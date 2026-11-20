#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AG2/jobs/mochi_v2';
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
  // Extract first frame or peak frame if atlas
  let samplePng = path.join(workBase, 'temp_sample.png');
  if (isAtlas) {
    // Crop peak frame (frame 5 = row 1, col 1 in 4x4 atlas, or frame 4 = row 1 col 0)
    // For 1024 atlas with 256x256 frames: frame 4 is at +0+256, frame 5 is at +256+256
    run(`magick "${effectWebp}" -crop ${frameW}x${frameH}+${frameW}+${frameH} +repage "${samplePng}"`);
  } else {
    run(`magick "${effectWebp}" -resize ${frameW}x${frameH} "${samplePng}"`);
  }

  // Composite over battle background using additive "plus" blend
  const left = Math.round(posX - frameW / 2);
  const top = Math.round(posY - frameH / 2);
  run(`magick "${battleBg}" "${samplePng}" -geometry +${left}+${top} -compose plus -composite -quality 85 "${outCompJpg}"`);
  console.log(`  [Composite] -> ${outCompJpg}`);
}

console.log('Processing Mochi Generation-First VFX Assets...');

// ----------------------------------------------------------------------
// 1. PROCESS GENERATED IMPACT SHEET
// ----------------------------------------------------------------------
export function processGeneratedImpact(genImgPath) {
  const cleanPng = path.join(workBase, 'mochi_impact_clean.png');
  const outWebp = path.join(vfxDir, 'mochi-impact.webp');

  // Clamp background to pure black #000000, ensure 1024x1024 POT
  run(`magick "${genImgPath}" -black-threshold 4% -resize 1024x1024! "${cleanPng}"`);
  toWebP(cleanPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeEffect(outWebp, path.join(compDir, 'mochi-impact.jpg'), 580, 260, 256, 256, true);
}

// ----------------------------------------------------------------------
// 2. PROCESS GENERATED SLASH SHEET
// ----------------------------------------------------------------------
export function processGeneratedSlash(genImgPath) {
  const cleanPng = path.join(workBase, 'mochi_slash_clean.png');
  const outWebp = path.join(vfxDir, 'mochi-slash.webp');

  run(`magick "${genImgPath}" -black-threshold 4% -resize 1024x1024! "${cleanPng}"`);
  toWebP(cleanPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeEffect(outWebp, path.join(compDir, 'mochi-slash.jpg'), 520, 240, 256, 256, true);
}

// ----------------------------------------------------------------------
// 3. ANTICIPATION GLOW (256x256 single - organic, NO UI reticle)
// ----------------------------------------------------------------------
export function buildOrganicAnticipation() {
  const outPng = path.join(workBase, 'mochi_anticipation_v2.png');
  const outWebp = path.join(vfxDir, 'mochi-anticipation.webp');
  const C = 128;
  const draws = [];

  // Multi-stop radial light: hot white -> cream -> strawberry pink -> dark velvet falloff
  draws.push(`fill "white" circle ${C},${C} ${C + 16},${C}`);
  draws.push(`fill "rgba(255, 242, 223, 0.9)" circle ${C},${C} ${C + 38},${C}`);
  draws.push(`fill "rgba(255, 51, 119, 0.75)" circle ${C},${C} ${C + 75},${C}`);
  draws.push(`fill "rgba(180, 20, 70, 0.35)" circle ${C},${C} ${C + 105},${C}`);

  // Subtle organic cotton wisps swirling around core
  for (let s = 0; s < 8; s++) {
    const ang = (s * Math.PI) / 4 + 0.15;
    const r1 = 35;
    const r2 = 85;
    const x1 = C + Math.cos(ang) * r1;
    const y1 = C + Math.sin(ang) * r1;
    const x2 = C + Math.cos(ang + 0.4) * r2;
    const y2 = C + Math.sin(ang + 0.4) * r2;
    draws.push(`stroke "rgba(255, 120, 165, 0.6)" stroke-width 3 fill none line ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`);
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x2.5 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeEffect(outWebp, path.join(compDir, 'mochi-anticipation.jpg'), 380, 280, 256, 256, false);
}

// ----------------------------------------------------------------------
// 4. DISSIPATION PARTICLES (128x128 singles - organic materials)
// ----------------------------------------------------------------------
export function buildOrganicParticles() {
  const C = 64;

  // 1: Pink cotton yarn puff
  {
    const outPng = path.join(workBase, 'mochi_particle_1_v2.png');
    const outWebp = path.join(vfxDir, 'mochi-particle-1.webp');
    const draws = [
      `fill "white" circle ${C},${C} ${C + 6},${C}`,
      `fill "rgba(255, 235, 210, 0.9)" circle ${C},${C} ${C + 15},${C}`,
      `fill "rgba(255, 55, 120, 0.8)" circle ${C},${C} ${C + 28},${C}`,
      `fill "rgba(180, 15, 60, 0.3)" circle ${C},${C} ${C + 42},${C}`,
    ];
    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x1.2 "${outPng}"`);
    toWebP(outPng, outWebp, 85);
    console.log(`  -> ${outWebp}`);
  }

  // 2: Warm cream sparkle glint (organic diamond gleam)
  {
    const outPng = path.join(workBase, 'mochi_particle_2_v2.png');
    const outWebp = path.join(vfxDir, 'mochi-particle-2.webp');
    const draws = [
      `fill "white" circle ${C},${C} ${C + 8},${C}`,
      `fill "rgba(255, 245, 225, 0.85)" circle ${C},${C} ${C + 20},${C}`,
      `stroke "rgba(255, 255, 255, 0.9)" stroke-width 3 line ${C - 32},${C} ${C + 32},${C} line ${C},${C - 32} ${C},${C + 32}`,
      `stroke "rgba(255, 120, 160, 0.6)" stroke-width 1.5 line ${C - 18},${C - 18} ${C + 18},${C + 18} line ${C - 18},${C + 18} ${C + 18},${C - 18}`,
    ];
    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${outPng}"`);
    toWebP(outPng, outWebp, 85);
    console.log(`  -> ${outWebp}`);
  }

  // 3: Strawberry silk ribbon petal wisp
  {
    const outPng = path.join(workBase, 'mochi_particle_3_v2.png');
    const outWebp = path.join(vfxDir, 'mochi-particle-3.webp');
    const draws = [
      `fill "rgba(255, 60, 130, 0.85)" polygon ${C - 24},${C + 18} ${C},${C - 28} ${C + 22},${C + 6} ${C},${C + 24}`,
      `fill "rgba(255, 240, 220, 0.95)" polygon ${C - 10},${C + 8} ${C},${C - 18} ${C + 10},${C + 2} ${C},${C + 12}`,
      `fill "white" circle ${C},${C} ${C + 4},${C}`,
    ];
    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${outPng}"`);
    toWebP(outPng, outWebp, 85);
    console.log(`  -> ${outWebp}`);
  }
}

// ----------------------------------------------------------------------
// 5. GROUND DECAL (512x512 single - organic magical weave, NO paw stamp)
// ----------------------------------------------------------------------
export function buildOrganicGroundDecal() {
  const outPng = path.join(workBase, 'mochi_decal_v2.png');
  const outWebp = path.join(vfxDir, 'mochi-decal.webp');
  const C = 256;
  const draws = [];

  // Central incandescent energy bloom
  draws.push(`fill "rgba(255, 255, 255, 0.9)" circle ${C},${C} ${C + 25},${C}`);
  draws.push(`fill "rgba(255, 242, 220, 0.85)" circle ${C},${C} ${C + 60},${C}`);
  draws.push(`fill "rgba(255, 51, 119, 0.5)" circle ${C},${C} ${C + 120},${C}`);

  // Braided concentric ribbon embroidery circles
  draws.push(`stroke "rgba(255, 51, 119, 0.85)" stroke-width 6 fill none circle ${C},${C} ${C + 215},${C}`);
  draws.push(`stroke "rgba(255, 235, 200, 0.9)" stroke-width 3 fill none circle ${C},${C} ${C + 185},${C}`);
  draws.push(`stroke "rgba(255, 90, 150, 0.5)" stroke-width 2 fill none circle ${C},${C} ${C + 145},${C}`);

  // 12 Curved silk ribbon rays radiating outward
  for (let i = 0; i < 12; i++) {
    const ang = (i * Math.PI) / 6;
    const r1 = 65;
    const r2 = 180;
    const x1 = C + Math.cos(ang) * r1;
    const y1 = C + Math.sin(ang) * r1;
    const x2 = C + Math.cos(ang + 0.12) * r2;
    const y2 = C + Math.sin(ang + 0.12) * r2;
    draws.push(`stroke "rgba(255, 80, 140, 0.8)" stroke-width 3.5 fill none line ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`);
  }

  run(`magick -size 512x512 xc:black -draw '${draws.join(' ')}' -blur 0x1.8 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeEffect(outWebp, path.join(compDir, 'mochi-decal.jpg'), 500, 380, 420, 420, false);
}

// Build organic components
buildOrganicAnticipation();
buildOrganicParticles();
buildOrganicGroundDecal();
