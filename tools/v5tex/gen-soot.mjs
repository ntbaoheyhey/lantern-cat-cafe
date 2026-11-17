#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AG2/jobs/soot_v2';
const compDir = '/Users/bao/th-v5-ag2/reports/v5/AG2/comp';
const battleBg = '/Users/bao/th-v5-ag2/work/v5/AG2/comp_base/battle_bg.jpg';

if (!fs.existsSync(vfxDir)) fs.mkdirSync(vfxDir, { recursive: true });
if (!fs.existsSync(workBase)) fs.mkdirSync(workBase, { recursive: true });
if (!fs.existsSync(compDir)) fs.mkdirSync(compDir, { recursive: true });

function run(cmd) {
  execSync(cmd, { stdio: 'pipe' });
}

function toWebP(pngIn, webpOut, q = 85) {
  run(`cwebp -q ${q} -alpha_q 90 "${pngIn}" -o "${webpOut}"`);
}

function compositeEffect(effectWebp, outCompJpg, posX = 480, posY = 270, frameW = 256, frameH = 256, isAtlas = false) {
  let samplePng = path.join(workBase, 'temp_sample.png');
  if (isAtlas) {
    // Crop peak frame (row 1 col 1 = frame 5 at +256+256)
    run(`magick "${effectWebp}" -crop ${frameW}x${frameH}+${frameW}+${frameH} +repage "${samplePng}"`);
  } else {
    run(`magick "${effectWebp}" -resize ${frameW}x${frameH} "${samplePng}"`);
  }

  const left = Math.round(posX - frameW / 2);
  const top = Math.round(posY - frameH / 2);
  run(`magick "${battleBg}" "${samplePng}" -geometry +${left}+${top} -compose plus -composite -quality 80 "${outCompJpg}"`);
  console.log(`  [Composite] -> ${outCompJpg}`);
}

console.log('Processing Soot Generation-First VFX Assets...');

// ----------------------------------------------------------------------
// 1. PROCESS GENERATED IMPACT SHEET
// ----------------------------------------------------------------------
export function processGeneratedImpact(genImgPath) {
  const cleanPng = path.join(workBase, 'soot_impact_clean.png');
  const outWebp = path.join(vfxDir, 'soot-impact.webp');

  run(`magick "${genImgPath}" -black-threshold 4% -resize 1024x1024! "${cleanPng}"`);
  toWebP(cleanPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeEffect(outWebp, path.join(compDir, 'soot-impact.jpg'), 580, 260, 256, 256, true);
}

// ----------------------------------------------------------------------
// 2. ANTICIPATION GLOW (256x256 single - organic vortex, NO reticle)
// ----------------------------------------------------------------------
export function buildOrganicAnticipation() {
  const outPng = path.join(workBase, 'soot_anticipation_v2.png');
  const outWebp = path.join(vfxDir, 'soot-anticipation.webp');
  const C = 128;
  const draws = [];

  // Multi-stop fire glow: hot white-yellow -> golden heat -> fiery orange -> dark smoke
  draws.push(`fill "white" circle ${C},${C} ${C + 14},${C}`);
  draws.push(`fill "rgba(255, 204, 34, 0.95)" circle ${C},${C} ${C + 35},${C}`);
  draws.push(`fill "rgba(255, 85, 0, 0.75)" circle ${C},${C} ${C + 70},${C}`);
  draws.push(`fill "rgba(60, 20, 0, 0.4)" circle ${C},${C} ${C + 105},${C}`);

  // 10 organic ember sparks swirling around vortex
  for (let s = 0; s < 10; s++) {
    const ang = (s * Math.PI * 2) / 10 + 0.3 * Math.sin(s);
    const r = 50 + (s % 3) * 16;
    const sx = C + Math.cos(ang) * r;
    const sy = C + Math.sin(ang) * r;
    draws.push(`fill "rgba(255, 235, 120, 0.9)" circle ${sx.toFixed(1)},${sy.toFixed(1)} ${(sx + 3.5).toFixed(1)},${sy.toFixed(1)}`);
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x2.0 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeEffect(outWebp, path.join(compDir, 'soot-anticipation.jpg'), 380, 280, 256, 256, false);
}

// ----------------------------------------------------------------------
// 3. PROJECTILE (256x256 single - blazing cinder comet with smoke streamlines)
// ----------------------------------------------------------------------
export function buildOrganicProjectile() {
  const outPng = path.join(workBase, 'soot_projectile_v2.png');
  const outWebp = path.join(vfxDir, 'soot-projectile.webp');
  const hx = 185, hy = 128;
  const draws = [];

  // Core fireball
  draws.push(`fill "white" circle ${hx},${hy} ${hx + 14},${hy}`);
  draws.push(`fill "rgba(255, 210, 40, 0.95)" circle ${hx},${hy} ${hx + 28},${hy}`);
  draws.push(`fill "rgba(255, 80, 0, 0.8)" circle ${hx},${hy} ${hx + 46},${hy}`);
  draws.push(`fill "rgba(80, 25, 0, 0.35)" circle ${hx},${hy} ${hx + 68},${hy}`);

  // Trailing charcoal smoke streamers flowing left
  for (let yOff of [-18, -10, -4, 0, 4, 10, 18]) {
    const len = 145 + Math.abs(yOff) * -3;
    const alpha = 0.85 - Math.abs(yOff) * 0.035;
    draws.push(`stroke "rgba(255, 90, 10, ${alpha.toFixed(2)})" stroke-width 4 fill none line ${(hx - 15)},${(hy + yOff)} ${(hx - len)},${(hy + yOff * 0.4)}`);
  }

  // 24 scattered golden spark motes along trail
  for (let s = 0; s < 24; s++) {
    const sx = hx - 15 - s * 7;
    const sy = hy + Math.sin(s * 1.4) * (12 + s * 0.7);
    const sa = (1 - s / 24) * 0.95;
    draws.push(`fill "rgba(255, 225, 80, ${sa.toFixed(2)})" circle ${sx.toFixed(1)},${sy.toFixed(1)} ${(sx + 2.5).toFixed(1)},${sy.toFixed(1)}`);
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.2 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeEffect(outWebp, path.join(compDir, 'soot-projectile.jpg'), 520, 240, 256, 256, false);
}

// ----------------------------------------------------------------------
// 4. DISSIPATION PARTICLES (128x128 singles)
// ----------------------------------------------------------------------
export function buildOrganicParticles() {
  const C = 64;

  // 1: Charcoal soot smoke puff
  {
    const outPng = path.join(workBase, 'soot_particle_1_v2.png');
    const outWebp = path.join(vfxDir, 'soot-particle-1.webp');
    const draws = [
      `fill "rgba(255, 230, 160, 0.9)" circle ${C},${C} ${C + 10},${C}`,
      `fill "rgba(255, 100, 10, 0.8)" circle ${C},${C} ${C + 24},${C}`,
      `fill "rgba(80, 40, 20, 0.4)" circle ${C},${C} ${C + 38},${C}`,
    ];
    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x1.5 "${outPng}"`);
    toWebP(outPng, outWebp, 85);
    console.log(`  -> ${outWebp}`);
  }

  // 2: Diamond ember spark
  {
    const outPng = path.join(workBase, 'soot_particle_2_v2.png');
    const outWebp = path.join(vfxDir, 'soot-particle-2.webp');
    const draws = [
      `fill "white" circle ${C},${C} ${C + 7},${C}`,
      `fill "rgba(255, 220, 50, 0.9)" circle ${C},${C} ${C + 18},${C}`,
      `stroke "rgba(255, 255, 255, 0.95)" stroke-width 3 line ${C - 28},${C} ${C + 28},${C} line ${C},${C - 28} ${C},${C + 28}`,
      `stroke "rgba(255, 120, 0, 0.7)" stroke-width 1.5 line ${C - 16},${C - 16} ${C + 16},${C + 16} line ${C - 16},${C + 16} ${C + 16},${C - 16}`,
    ];
    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x0.9 "${outPng}"`);
    toWebP(outPng, outWebp, 85);
    console.log(`  -> ${outWebp}`);
  }

  // 3: Glowing orange cinder flare
  {
    const outPng = path.join(workBase, 'soot_particle_3_v2.png');
    const outWebp = path.join(vfxDir, 'soot-particle-3.webp');
    const draws = [
      `fill "white" circle ${C},${C} ${C + 5},${C}`,
      `fill "rgba(255, 160, 20, 0.9)" circle ${C},${C} ${C + 14},${C}`,
      `fill "rgba(255, 70, 0, 0.75)" circle ${C},${C} ${C + 26},${C}`,
      `fill "rgba(100, 30, 0, 0.35)" circle ${C},${C} ${C + 42},${C}`,
    ];
    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x1.2 "${outPng}"`);
    toWebP(outPng, outWebp, 85);
    console.log(`  -> ${outWebp}`);
  }
}

// ----------------------------------------------------------------------
// 5. GROUND DECAL (512x512 single - scorched crater, NO reticle)
// ----------------------------------------------------------------------
export function buildOrganicGroundDecal() {
  const outPng = path.join(workBase, 'soot_decal_v2.png');
  const outWebp = path.join(vfxDir, 'soot-decal.webp');
  const C = 256;
  const draws = [];

  // Central incandescent heat glow
  draws.push(`fill "white" circle ${C},${C} ${C + 20},${C}`);
  draws.push(`fill "rgba(255, 210, 40, 0.9)" circle ${C},${C} ${C + 50},${C}`);
  draws.push(`fill "rgba(255, 80, 0, 0.65)" circle ${C},${C} ${C + 110},${C}`);

  // Scorched jagged perimeter ring
  draws.push(`stroke "rgba(255, 85, 0, 0.85)" stroke-width 5.5 fill none circle ${C},${C} ${C + 210},${C}`);
  draws.push(`stroke "rgba(255, 190, 40, 0.85)" stroke-width 2.5 fill none circle ${C},${C} ${C + 180},${C}`);

  // 14 Irregular radiating cinder crack lines
  for (let i = 0; i < 14; i++) {
    const ang = (i * Math.PI * 2) / 14 + 0.1 * Math.sin(i * 2);
    const r1 = 45;
    const r2 = 130 + (i % 3) * 25;
    const r3 = 205;

    const x1 = C + Math.cos(ang) * r1;
    const y1 = C + Math.sin(ang) * r1;
    const x2 = C + Math.cos(ang + 0.08) * r2;
    const y2 = C + Math.sin(ang + 0.08) * r2;
    const x3 = C + Math.cos(ang - 0.05) * r3;
    const y3 = C + Math.sin(ang - 0.05) * r3;

    draws.push(`stroke "rgba(255, 120, 20, 0.85)" stroke-width 3.5 fill none line ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} line ${x2.toFixed(1)},${y2.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)}`);
  }

  run(`magick -size 512x512 xc:black -draw '${draws.join(' ')}' -blur 0x1.8 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeEffect(outWebp, path.join(compDir, 'soot-decal.jpg'), 500, 380, 420, 420, false);
}

// Build organic components
buildOrganicAnticipation();
buildOrganicProjectile();
buildOrganicParticles();
buildOrganicGroundDecal();
