#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AG2/jobs/clover_v2';
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
    run(`magick "${effectWebp}" -crop ${frameW}x${frameH}+${frameW}+${frameH} +repage "${samplePng}"`);
  } else {
    run(`magick "${effectWebp}" -resize ${frameW}x${frameH} "${samplePng}"`);
  }

  const left = Math.round(posX - frameW / 2);
  const top = Math.round(posY - frameH / 2);
  run(`magick "${battleBg}" "${samplePng}" -geometry +${left}+${top} -compose plus -composite -quality 80 "${outCompJpg}"`);
  console.log(`  [Composite] -> ${outCompJpg}`);
}

console.log('Processing Clover Generation-First VFX Assets...');

// ----------------------------------------------------------------------
// 1. PROCESS GENERATED IMPACT SHEET
// ----------------------------------------------------------------------
export function processGeneratedImpact(genImgPath) {
  const cleanPng = path.join(workBase, 'clover_impact_clean.png');
  const outWebp = path.join(vfxDir, 'clover-impact.webp');

  run(`magick "${genImgPath}" -black-threshold 4% -resize 1024x1024! "${cleanPng}"`);
  toWebP(cleanPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeEffect(outWebp, path.join(compDir, 'clover-impact.jpg'), 480, 260, 256, 256, true);
}

// ----------------------------------------------------------------------
// 2. ANTICIPATION GLOW (256x256 single - organic blooming aura)
// ----------------------------------------------------------------------
export function buildOrganicAnticipation() {
  const outPng = path.join(workBase, 'clover_anticipation_v2.png');
  const outWebp = path.join(vfxDir, 'clover-anticipation.webp');
  const C = 128;
  const draws = [];

  // Multi-stop holy green glow: white sunbeam -> honey gold -> emerald green -> jade shadow
  draws.push(`fill "white" circle ${C},${C} ${C + 16},${C}`);
  draws.push(`fill "rgba(252, 232, 104, 0.95)" circle ${C},${C} ${C + 42},${C}`);
  draws.push(`fill "rgba(34, 197, 94, 0.75)" circle ${C},${C} ${C + 80},${C}`);
  draws.push(`fill "rgba(4, 38, 16, 0.35)" circle ${C},${C} ${C + 110},${C}`);

  // 4 Soft organic clover lobe auras
  for (let l = 0; l < 4; l++) {
    const ang = (l * Math.PI) / 2 + Math.PI / 4;
    const lx = C + Math.cos(ang) * 55;
    const ly = C + Math.sin(ang) * 55;
    draws.push(`fill "rgba(34, 197, 94, 0.55)" circle ${lx.toFixed(1)},${ly.toFixed(1)} ${(lx + 32).toFixed(1)},${ly.toFixed(1)}`);
    draws.push(`fill "rgba(252, 232, 104, 0.7)" circle ${lx.toFixed(1)},${ly.toFixed(1)} ${(lx + 14).toFixed(1)},${ly.toFixed(1)}`);
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x2.5 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeEffect(outWebp, path.join(compDir, 'clover-anticipation.jpg'), 380, 280, 256, 256, false);
}

// ----------------------------------------------------------------------
// 3. PROJECTILE (256x256 single - spiraling emerald seed bud with gold streamlines)
// ----------------------------------------------------------------------
export function buildOrganicProjectile() {
  const outPng = path.join(workBase, 'clover_projectile_v2.png');
  const outWebp = path.join(vfxDir, 'clover-projectile.webp');
  const hx = 180, hy = 128;
  const draws = [];

  // Core radiant seed
  draws.push(`fill "white" circle ${hx},${hy} ${hx + 14},${hy}`);
  draws.push(`fill "rgba(250, 230, 90, 0.95)" circle ${hx},${hy} ${hx + 26},${hy}`);
  draws.push(`fill "rgba(34, 197, 94, 0.85)" circle ${hx},${hy} ${hx + 44},${hy}`);
  draws.push(`fill "rgba(10, 50, 20, 0.35)" circle ${hx},${hy} ${hx + 64},${hy}`);

  // Golden pollen trails flowing left
  for (let yOff of [-16, -9, -3, 3, 9, 16]) {
    const len = 140 + Math.abs(yOff) * -3;
    const alpha = 0.85 - Math.abs(yOff) * 0.035;
    draws.push(`stroke "rgba(252, 232, 104, ${alpha.toFixed(2)})" stroke-width 3.5 fill none line ${(hx - 15)},${(hy + yOff)} ${(hx - len)},${(hy + yOff * 0.45)}`);
  }

  // 16 floating pollen sparkle motes
  for (let s = 0; s < 16; s++) {
    const sx = hx - 16 - s * 9;
    const sy = hy + Math.sin(s * 1.5) * (14 + s * 0.8);
    const sa = (1 - s / 16) * 0.9;
    draws.push(`fill "rgba(255, 245, 140, ${sa.toFixed(2)})" circle ${sx.toFixed(1)},${sy.toFixed(1)} ${(sx + 2.5).toFixed(1)},${sy.toFixed(1)}`);
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.2 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeEffect(outWebp, path.join(compDir, 'clover-projectile.jpg'), 520, 240, 256, 256, false);
}

// ----------------------------------------------------------------------
// 4. DISSIPATION PARTICLES (128x128 singles)
// ----------------------------------------------------------------------
export function buildOrganicParticles() {
  const C = 64;

  // 1: Translucent clover leaf sprig
  {
    const outPng = path.join(workBase, 'clover_particle_1_v2.png');
    const outWebp = path.join(vfxDir, 'clover-particle-1.webp');
    const draws = [
      `fill "rgba(34, 197, 94, 0.85)" circle ${C - 8},${C - 6} ${C - 8 + 14},${C - 6}`,
      `fill "rgba(34, 197, 94, 0.85)" circle ${C + 8},${C - 6} ${C + 8 + 14},${C - 6}`,
      `fill "rgba(34, 197, 94, 0.85)" polygon ${C - 16},${C - 2} ${C + 16},${C - 2} ${C},${C + 22}`,
      `stroke "rgba(250, 240, 140, 0.9)" stroke-width 2 fill none line ${C},${C - 12} ${C},${C + 18}`,
    ];
    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${outPng}"`);
    toWebP(outPng, outWebp, 85);
    console.log(`  -> ${outWebp}`);
  }

  // 2: Honey gold pollen sparkle
  {
    const outPng = path.join(workBase, 'clover_particle_2_v2.png');
    const outWebp = path.join(vfxDir, 'clover-particle-2.webp');
    const draws = [
      `fill "white" circle ${C},${C} ${C + 7},${C}`,
      `fill "rgba(252, 232, 104, 0.9)" circle ${C},${C} ${C + 18},${C}`,
      `stroke "rgba(255, 255, 240, 0.95)" stroke-width 3 line ${C - 26},${C} ${C + 26},${C} line ${C},${C - 26} ${C},${C + 26}`,
      `stroke "rgba(34, 197, 94, 0.6)" stroke-width 1.5 line ${C - 15},${C - 15} ${C + 15},${C + 15} line ${C - 15},${C + 15} ${C + 15},${C - 15}`,
    ];
    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x0.9 "${outPng}"`);
    toWebP(outPng, outWebp, 85);
    console.log(`  -> ${outWebp}`);
  }

  // 3: Translucent dewdrop healing tear
  {
    const outPng = path.join(workBase, 'clover_particle_3_v2.png');
    const outWebp = path.join(vfxDir, 'clover-particle-3.webp');
    const draws = [
      `fill "white" circle ${C},${C + 4} ${C + 5},${C + 4}`,
      `fill "rgba(180, 245, 190, 0.9)" circle ${C},${C + 6} ${C + 16},${C + 6}`,
      `fill "rgba(34, 197, 94, 0.7)" polygon ${C - 14},${C + 4} ${C + 14},${C + 4} ${C},${C - 24}`,
      `fill "rgba(252, 232, 104, 0.4)" circle ${C},${C} ${C + 28},${C}`,
    ];
    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${outPng}"`);
    toWebP(outPng, outWebp, 85);
    console.log(`  -> ${outWebp}`);
  }
}

// ----------------------------------------------------------------------
// 5. GROUND DECAL (512x512 single - fairy ring floral sanctuary)
// ----------------------------------------------------------------------
export function buildOrganicGroundDecal() {
  const outPng = path.join(workBase, 'clover_decal_v2.png');
  const outWebp = path.join(vfxDir, 'clover-decal.webp');
  const C = 256;
  const draws = [];

  // Central radiant healing well
  draws.push(`fill "white" circle ${C},${C} ${C + 25},${C}`);
  draws.push(`fill "rgba(252, 232, 104, 0.85)" circle ${C},${C} ${C + 65},${C}`);
  draws.push(`fill "rgba(34, 197, 94, 0.55)" circle ${C},${C} ${C + 125},${C}`);

  // Braided clover vine perimeter rings
  draws.push(`stroke "rgba(34, 197, 94, 0.85)" stroke-width 5.5 fill none circle ${C},${C} ${C + 215},${C}`);
  draws.push(`stroke "rgba(252, 232, 104, 0.8)" stroke-width 3 fill none circle ${C},${C} ${C + 185},${C}`);
  draws.push(`stroke "rgba(34, 197, 94, 0.5)" stroke-width 2 fill none circle ${C},${C} ${C + 145},${C}`);

  // 8 Petal nodes around the ring
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4;
    const px = C + Math.cos(ang) * 185;
    const py = C + Math.sin(ang) * 185;
    draws.push(`fill "rgba(252, 232, 104, 0.9)" circle ${px.toFixed(1)},${py.toFixed(1)} ${(px + 12).toFixed(1)},${py.toFixed(1)}`);
    draws.push(`fill "white" circle ${px.toFixed(1)},${py.toFixed(1)} ${(px + 4).toFixed(1)},${py.toFixed(1)}`);
  }

  run(`magick -size 512x512 xc:black -draw '${draws.join(' ')}' -blur 0x1.8 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeEffect(outWebp, path.join(compDir, 'clover-decal.jpg'), 500, 380, 420, 420, false);
}

// Build organic components
buildOrganicAnticipation();
buildOrganicProjectile();
buildOrganicParticles();
buildOrganicGroundDecal();
