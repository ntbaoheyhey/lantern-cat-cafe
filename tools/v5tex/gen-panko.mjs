#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AG2/jobs/panko_v2';
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
    // Crop peak frame: row 1, col 1 in 4x4 atlas (frame 5 = +256+256)
    run(`magick "${effectWebp}" -crop ${frameW}x${frameH}+${frameW}+${frameH} +repage "${samplePng}"`);
  } else {
    run(`magick "${effectWebp}" -resize ${frameW}x${frameH} "${samplePng}"`);
  }
  const left = Math.round(posX - frameW / 2);
  const top = Math.round(posY - frameH / 2);
  run(`magick "${battleBg}" "${samplePng}" -geometry +${left}+${top} -compose plus -composite -quality 80 "${outCompJpg}"`);
  console.log(`  [Composite] -> ${outCompJpg}`);
}

console.log('Processing Panko Generation-First VFX Assets...');

// ----------------------------------------------------------------------
// 1. PROCESS GENERATED IMPACT SHEET
// ----------------------------------------------------------------------
export function processGeneratedImpact(genImgPath) {
  const cleanPng = path.join(workBase, 'panko_impact_clean.png');
  const outWebp = path.join(vfxDir, 'panko-impact.webp');

  run(`magick "${genImgPath}" -black-threshold 4% -resize 1024x1024! "${cleanPng}"`);
  toWebP(cleanPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeEffect(outWebp, path.join(compDir, 'panko-impact.jpg'), 580, 260, 256, 256, true);
}

// ----------------------------------------------------------------------
// 2. PROCESS GENERATED SLASH SHEET
// ----------------------------------------------------------------------
export function processGeneratedSlash(genImgPath) {
  const cleanPng = path.join(workBase, 'panko_slash_clean.png');
  const outWebp = path.join(vfxDir, 'panko-slash.webp');

  run(`magick "${genImgPath}" -black-threshold 4% -resize 1024x1024! "${cleanPng}"`);
  toWebP(cleanPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeEffect(outWebp, path.join(compDir, 'panko-slash.jpg'), 520, 240, 256, 256, true);
}

// ----------------------------------------------------------------------
// 3. ANTICIPATION GLOW (256x256 single - molten butter swirl & crumb motes)
// ----------------------------------------------------------------------
export function buildOrganicAnticipation() {
  const outPng = path.join(workBase, 'panko_anticipation_v2.png');
  const outWebp = path.join(vfxDir, 'panko-anticipation.webp');
  const C = 128;
  const draws = [];

  // Multi-stop warm radial glow: incandescent butter white -> golden honey butter -> amber crust
  draws.push(`fill "rgba(255, 253, 240, 0.95)" circle ${C},${C} ${C + 18},${C}`);
  draws.push(`fill "rgba(255, 200, 59, 0.85)" circle ${C},${C} ${C + 46},${C}`);
  draws.push(`fill "rgba(200, 109, 20, 0.55)" circle ${C},${C} ${C + 82},${C}`);
  draws.push(`fill "rgba(74, 36, 6, 0.25)" circle ${C},${C} ${C + 115},${C}`);

  // Sizzling molten butter swirls
  for (let s = 0; s < 6; s++) {
    const ang = (s * Math.PI) / 3;
    const r1 = 30;
    const r2 = 78;
    const x1 = C + Math.cos(ang) * r1;
    const y1 = C + Math.sin(ang) * r1;
    const cx = C + Math.cos(ang + 0.4) * (r1 + r2) * 0.55;
    const cy = C + Math.sin(ang + 0.4) * (r1 + r2) * 0.55;
    const x2 = C + Math.cos(ang + 0.7) * r2;
    const y2 = C + Math.sin(ang + 0.7) * r2;
    draws.push(`stroke "rgba(255, 215, 90, 0.8)" stroke-width 3 fill none bezier ${x1.toFixed(1)},${y1.toFixed(1)} ${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`);
  }

  // Floating crispy bread crumb motes
  for (let i = 0; i < 16; i++) {
    const ang = (i * Math.PI * 2) / 16 + (i % 3) * 0.2;
    const dist = 55 + (i * 17) % 55;
    const cx = C + Math.cos(ang) * dist;
    const cy = C + Math.sin(ang) * dist;
    const sz = 2.5 + (i % 3) * 1.5;
    draws.push(`fill "rgba(255, 235, 150, 0.9)" circle ${cx.toFixed(1)},${cy.toFixed(1)} ${(cx + sz).toFixed(1)},${cy.toFixed(1)}`);
    draws.push(`fill "rgba(200, 100, 20, 0.7)" circle ${cx.toFixed(1)},${cy.toFixed(1)} ${(cx + sz + 2).toFixed(1)},${cy.toFixed(1)}`);
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.5 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeEffect(outWebp, path.join(compDir, 'panko-anticipation.jpg'), 380, 280, 256, 256, false);
}

// ----------------------------------------------------------------------
// 4. PARTICLES (128x128 singles - crumbs, butter droplets, pastry flakes)
// ----------------------------------------------------------------------
export function buildOrganicParticles() {
  const C = 64;

  // 1: Crispy golden bread crumb cluster
  {
    const outPng = path.join(workBase, 'panko_particle_1_v2.png');
    const outWebp = path.join(vfxDir, 'panko-particle-1.webp');
    const draws = [
      `fill "white" circle ${C},${C} ${C + 6},${C}`,
      `fill "rgba(255, 220, 100, 0.9)" circle ${C},${C} ${C + 15},${C}`,
      `fill "rgba(200, 110, 20, 0.7)" circle ${C},${C} ${C + 26},${C}`,
      // Small satellite crumbs
      `fill "rgba(255, 240, 160, 0.9)" circle ${C - 16},${C + 8} ${C - 12},${C + 8}`,
      `fill "rgba(255, 180, 40, 0.8)" circle ${C + 14},${C - 10} ${C + 18},${C - 10}`,
      `fill "rgba(220, 120, 30, 0.75)" circle ${C + 10},${C + 16} ${C + 13},${C + 16}`,
      `fill "rgba(180, 80, 15, 0.6)" circle ${C - 10},${C - 14} ${C - 8},${C - 14}`,
    ];
    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${outPng}"`);
    toWebP(outPng, outWebp, 85);
    console.log(`  -> ${outWebp}`);
  }

  // 2: Sizzling golden molten butter droplet
  {
    const outPng = path.join(workBase, 'panko_particle_2_v2.png');
    const outWebp = path.join(vfxDir, 'panko-particle-2.webp');
    const draws = [
      `fill "rgba(255, 255, 255, 0.95)" circle ${C},${C - 2} ${C + 7},${C - 2}`,
      `fill "rgba(255, 225, 90, 0.85)" circle ${C},${C} ${C + 18},${C}`,
      `fill "rgba(215, 120, 25, 0.55)" circle ${C},${C + 4} ${C + 30},${C + 4}`,
      // Teardrop / droplet crown
      `stroke "rgba(255, 245, 160, 0.9)" stroke-width 2.5 fill none bezier ${C - 12},${C + 10} ${C - 16},${C - 12} ${C},${C - 26} ${C + 12},${C + 10}`,
    ];
    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${outPng}"`);
    toWebP(outPng, outWebp, 85);
    console.log(`  -> ${outWebp}`);
  }

  // 3: Flaky amber pastry crust shard
  {
    const outPng = path.join(workBase, 'panko_particle_3_v2.png');
    const outWebp = path.join(vfxDir, 'panko-particle-3.webp');
    const draws = [
      `fill "rgba(255, 250, 230, 0.95)" polygon ${C - 4},${C - 12} ${C + 16},${C - 4} ${C + 8},${C + 10} ${C - 12},${C + 4}`,
      `fill "rgba(255, 195, 60, 0.85)" polygon ${C - 14},${C - 18} ${C + 24},${C - 6} ${C + 14},${C + 18} ${C - 20},${C + 8}`,
      `fill "rgba(180, 85, 15, 0.5)" polygon ${C - 22},${C - 24} ${C + 30},${C - 8} ${C + 18},${C + 24} ${C - 28},${C + 12}`,
      `stroke "rgba(255, 255, 220, 0.9)" stroke-width 2 fill none line ${C - 18},${C - 14} ${C + 20},${C - 2}`,
    ];
    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${outPng}"`);
    toWebP(outPng, outWebp, 85);
    console.log(`  -> ${outWebp}`);
  }
}

// ----------------------------------------------------------------------
// 5. GROUND DECAL (512x512 single - toasted waffle & molten butter ring)
// ----------------------------------------------------------------------
export function buildOrganicGroundDecal() {
  const outPng = path.join(workBase, 'panko_decal_v2.png');
  const outWebp = path.join(vfxDir, 'panko-decal.webp');
  const C = 256;
  const draws = [];

  // Central molten butter pool
  draws.push(`fill "rgba(255, 255, 250, 0.95)" circle ${C},${C} ${C + 26},${C}`);
  draws.push(`fill "rgba(255, 215, 75, 0.85)" circle ${C},${C} ${C + 65},${C}`);
  draws.push(`fill "rgba(200, 110, 20, 0.5)" circle ${C},${C} ${C + 120},${C}`);

  // Toasted waffle grid indentations (organic diamond pattern, not mechanical)
  for (let offset = -140; offset <= 140; offset += 35) {
    const len = Math.sqrt(Math.max(0, 180 * 180 - offset * offset));
    if (len > 30) {
      draws.push(`stroke "rgba(235, 140, 35, 0.5)" stroke-width 3 stroke-dasharray 8,6 fill none line ${C + offset},${C - len} ${C + offset},${C + len}`);
      draws.push(`stroke "rgba(235, 140, 35, 0.5)" stroke-width 3 stroke-dasharray 8,6 fill none line ${C - len},${C + offset} ${C + len},${C + offset}`);
    }
  }

  // Radiating toasted crust impact fractures
  for (let i = 0; i < 12; i++) {
    const ang = (i * Math.PI) / 6 + 0.15;
    const r1 = 80;
    const r2 = 210 + (i % 3) * 20;
    const x1 = C + Math.cos(ang) * r1;
    const y1 = C + Math.sin(ang) * r1;
    const midX = C + Math.cos(ang + 0.08) * (r1 + r2) * 0.55;
    const midY = C + Math.sin(ang + 0.08) * (r1 + r2) * 0.55;
    const x2 = C + Math.cos(ang) * r2;
    const y2 = C + Math.sin(ang) * r2;
    draws.push(`stroke "rgba(255, 185, 55, 0.8)" stroke-width 3.5 fill none line ${x1.toFixed(1)},${y1.toFixed(1)} ${midX.toFixed(1)},${midY.toFixed(1)}`);
    draws.push(`stroke "rgba(210, 100, 20, 0.65)" stroke-width 2 fill none line ${midX.toFixed(1)},${midY.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`);
  }

  // Crunchy crumb splatters scattered along perimeter
  for (let c = 0; c < 28; c++) {
    const ang = (c * Math.PI * 2) / 28 + (c % 5) * 0.1;
    const dist = 140 + (c * 23) % 90;
    const cx = C + Math.cos(ang) * dist;
    const cy = C + Math.sin(ang) * dist;
    const sz = 3 + (c % 4) * 2;
    draws.push(`fill "rgba(255, 230, 130, 0.9)" circle ${cx.toFixed(1)},${cy.toFixed(1)} ${(cx + sz).toFixed(1)},${cy.toFixed(1)}`);
    draws.push(`fill "rgba(180, 80, 15, 0.6)" circle ${cx.toFixed(1)},${cy.toFixed(1)} ${(cx + sz + 3).toFixed(1)},${cy.toFixed(1)}`);
  }

  run(`magick -size 512x512 xc:black -draw '${draws.join(' ')}' -blur 0x1.6 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeEffect(outWebp, path.join(compDir, 'panko-decal.jpg'), 500, 380, 420, 420, false);
}

// ----------------------------------------------------------------------
// EXECUTION
// ----------------------------------------------------------------------
processGeneratedImpact('/Users/bao/th-v5-ag2/work/v5/AG2/raw/panko-impact-gen.jpg');
processGeneratedSlash('/Users/bao/th-v5-ag2/work/v5/AG2/raw/panko-slash-gen.jpg');
buildOrganicAnticipation();
buildOrganicParticles();
buildOrganicGroundDecal();

// Generate Panko montage
const montageOut = '/Users/bao/th-v5-ag2/reports/v5/AG2/T1/panko-montage.jpg';
run(`magick montage "${vfxDir}/panko-anticipation.webp" "${vfxDir}/panko-slash.webp" "${vfxDir}/panko-impact.webp" "${vfxDir}/panko-decal.webp" -geometry 256x256+4+4 -background "#0a0a0a" -quality 80 "${montageOut}"`);
console.log(`  -> Montage: ${montageOut}`);
