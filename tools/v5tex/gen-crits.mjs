#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AG2/jobs/crits_v2';
const compDir = '/Users/bao/th-v5-ag2/reports/v5/AG2/comp';
const battleBg = '/Users/bao/th-v5-ag2/work/v5/AG2/comp_base/battle_bg.jpg';
const manifestPath = path.join(vfxDir, 'manifest.json');

if (!fs.existsSync(vfxDir)) fs.mkdirSync(vfxDir, { recursive: true });
if (!fs.existsSync(workBase)) fs.mkdirSync(workBase, { recursive: true });
if (!fs.existsSync(compDir)) fs.mkdirSync(compDir, { recursive: true });

function run(cmd) {
  execSync(cmd, { stdio: 'pipe' });
}

function toWebP(pngIn, webpOut, q = 85) {
  run(`cwebp -q ${q} -alpha_q 90 "${pngIn}" -o "${webpOut}"`);
}

function compositeAtlasEffect(effectWebp, outCompJpg, posX = 480, posY = 270, frameW = 256, frameH = 256) {
  let samplePng = path.join(workBase, 'temp_sample.png');
  run(`magick "${effectWebp}" -crop ${frameW}x${frameH}+${frameW}+${frameH} +repage "${samplePng}"`);
  const left = Math.round(posX - frameW / 2);
  const top = Math.round(posY - frameH / 2);
  run(`magick "${battleBg}" "${samplePng}" -geometry +${left}+${top} -compose plus -composite -quality 80 "${outCompJpg}"`);
  console.log(`  [Composite] -> ${outCompJpg}`);
}

function buildCritAtlas(name, renderFrame) {
  const framesDir = path.join(workBase, `${name}_frames`);
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

  const frameFiles = [];
  for (let f = 0; f < 16; f++) {
    const framePath = path.join(framesDir, `frame_${String(f).padStart(2, '0')}.png`);
    renderFrame(f, framePath);
    frameFiles.push(`"${framePath}"`);
  }

  const stitchedPng = path.join(workBase, `${name}_stitched.png`);
  run(`magick montage ${frameFiles.join(' ')} -tile 4x4 -geometry 256x256+0+0 -background black "${stitchedPng}"`);

  const outWebp = path.join(vfxDir, `${name}.webp`);
  toWebP(stitchedPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeAtlasEffect(outWebp, path.join(compDir, `${name}.jpg`), 480, 270, 256, 256);
}

console.log('Generating Dedicated Hero Crit Burst Flipbooks (F1)...');

// 1. MOCHI CRIT BURST (Strawberry Silk & Golden Stitch Detonation)
console.log('Building mochi-crit-burst...');
buildCritAtlas('mochi-crit-burst', (f, framePath) => {
  const C = 128;
  const draws = [];
  if (f <= 2) {
    const r = 24 + f * 25;
    draws.push(`fill "white" circle ${C},${C} ${C + r},${C}`);
    draws.push(`fill "rgba(255, 240, 210, 0.95)" circle ${C},${C} ${C + r * 1.5},${C}`);
    draws.push(`fill "rgba(255, 60, 110, 0.6)" circle ${C},${C} ${C + r * 2.2},${C}`);
    // Sharp cross-stitch gleams
    draws.push(`stroke "white" stroke-width 4 line ${C - 60},${C} ${C + 60},${C} line ${C},${C - 60} ${C},${C + 60}`);
    draws.push(`stroke "rgba(255, 200, 220, 0.8)" stroke-width 2.5 line ${C - 42},${C - 42} ${C + 42},${C + 42} line ${C - 42},${C + 42} ${C + 42},${C - 42}`);
  } else if (f <= 8) {
    const expand = (f - 2) / 6;
    const rCore = 30 * (1 - expand * 0.5);
    const rWave = 48 + expand * 72;
    const alpha = (1 - expand * 0.35).toFixed(2);

    draws.push(`fill "white" circle ${C},${C} ${C + rCore},${C}`);
    draws.push(`fill "rgba(255, 235, 180, ${alpha})" circle ${C},${C} ${C + rCore * 2},${C}`);
    draws.push(`stroke "rgba(255, 50, 100, ${alpha})" stroke-width 5 fill "rgba(255, 120, 160, 0.2)" circle ${C},${C} ${C + rWave},${C}`);
    draws.push(`stroke "rgba(255, 245, 220, ${alpha})" stroke-width 3 stroke-dasharray 8,6 fill none circle ${C},${C} ${C + rWave - 8},${C}`);

    // Flying strawberry thread sparks
    for (let i = 0; i < 16; i++) {
      const ang = (i * Math.PI * 2) / 16 + expand * 0.4;
      const dist = rWave * 0.7 + expand * 45 + (i % 3) * 10;
      const sx = C + Math.cos(ang) * dist;
      const sy = C + Math.sin(ang) * dist;
      const col = i % 2 === 0 ? `rgba(255, 70, 120, ${alpha})` : `rgba(255, 220, 140, ${alpha})`;
      draws.push(`stroke "${col}" stroke-width 2 fill none line ${sx.toFixed(1)},${sy.toFixed(1)} ${(sx + 5).toFixed(1)},${(sy + 5).toFixed(1)}`);
    }
  } else {
    const diss = (f - 8) / 7;
    const alpha = ((1 - diss) * 0.6).toFixed(2);
    const rOuter = 85 + diss * 35;
    draws.push(`stroke "rgba(220, 40, 90, ${alpha})" stroke-width 3.5 stroke-dasharray 10,12 fill none circle ${C},${C} ${C + rOuter},${C}`);
    for (let p = 0; p < 14; p++) {
      const ang = (p * Math.PI * 2) / 14 + p * 0.3;
      const dist = 35 + diss * 70;
      const px = C + Math.cos(ang) * dist;
      const py = C + Math.sin(ang) * dist;
      draws.push(`fill "rgba(255, 180, 200, ${alpha})" circle ${px.toFixed(1)},${py.toFixed(1)} ${(px + 3).toFixed(1)},${py.toFixed(1)}`);
    }
  }
  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.5 "${framePath}"`);
});

// 2. SOOT CRIT BURST (Charcoal Firecracker Starburst & Blazing Cinders)
console.log('Building soot-crit-burst...');
buildCritAtlas('soot-crit-burst', (f, framePath) => {
  const C = 128;
  const draws = [];
  if (f <= 2) {
    const r = 26 + f * 24;
    draws.push(`fill "white" circle ${C},${C} ${C + r},${C}`);
    draws.push(`fill "rgba(255, 225, 80, 0.95)" circle ${C},${C} ${C + r * 1.6},${C}`);
    draws.push(`fill "rgba(255, 68, 0, 0.6)" circle ${C},${C} ${C + r * 2.3},${C}`);
    // Brilliant 8-point cinder spikes
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI) / 4;
      const x2 = C + Math.cos(ang) * (r * 2.5);
      const y2 = C + Math.sin(ang) * (r * 2.5);
      draws.push(`stroke "white" stroke-width 3.5 fill none line ${C},${C} ${x2.toFixed(1)},${y2.toFixed(1)}`);
    }
  } else if (f <= 8) {
    const expand = (f - 2) / 6;
    const rCore = 28 * (1 - expand * 0.5);
    const rWave = 50 + expand * 70;
    const alpha = (1 - expand * 0.35).toFixed(2);

    draws.push(`fill "white" circle ${C},${C} ${C + rCore},${C}`);
    draws.push(`fill "rgba(255, 210, 50, ${alpha})" circle ${C},${C} ${C + rCore * 2},${C}`);
    draws.push(`stroke "rgba(255, 80, 0, ${alpha})" stroke-width 6 fill "rgba(200, 50, 0, 0.2)" circle ${C},${C} ${C + rWave},${C}`);

    // Violent jagged cinder arcs
    for (let i = 0; i < 20; i++) {
      const ang = (i * Math.PI * 2) / 20 + expand * 0.5;
      const dist = rWave * 0.6 + expand * 50 + (i % 4) * 8;
      const cx = C + Math.cos(ang) * dist;
      const cy = C + Math.sin(ang) * dist;
      const sz = 2.5 + (i % 3) * 1.5;
      draws.push(`fill "rgba(255, 230, 90, ${alpha})" circle ${cx.toFixed(1)},${cy.toFixed(1)} ${(cx + sz).toFixed(1)},${cy.toFixed(1)}`);
      draws.push(`fill "rgba(255, 80, 0, ${alpha})" circle ${(cx + 1).toFixed(1)},${(cy + 1).toFixed(1)} ${(cx + sz + 2).toFixed(1)},${(cy + 1).toFixed(1)}`);
    }
  } else {
    const diss = (f - 8) / 7;
    const alpha = ((1 - diss) * 0.6).toFixed(2);
    const rOuter = 85 + diss * 35;
    draws.push(`stroke "rgba(180, 50, 0, ${alpha})" stroke-width 4 fill none circle ${C},${C} ${C + rOuter},${C}`);
    for (let c = 0; c < 16; c++) {
      const ang = (c * Math.PI * 2) / 16 + c * 0.3;
      const dist = 35 + diss * 70;
      const cx = C + Math.cos(ang) * dist;
      const cy = C + Math.sin(ang) * dist;
      draws.push(`fill "rgba(255, 160, 40, ${alpha})" circle ${cx.toFixed(1)},${cy.toFixed(1)} ${(cx + 2.5).toFixed(1)},${cy.toFixed(1)}`);
    }
  }
  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.5 "${framePath}"`);
});

// 3. CLOVER CRIT BURST (Sacred Emerald Bloom & Radiant Pollen Rays)
console.log('Building clover-crit-burst...');
buildCritAtlas('clover-crit-burst', (f, framePath) => {
  const C = 128;
  const draws = [];
  if (f <= 2) {
    const r = 24 + f * 24;
    draws.push(`fill "white" circle ${C},${C} ${C + r},${C}`);
    draws.push(`fill "rgba(230, 255, 200, 0.95)" circle ${C},${C} ${C + r * 1.6},${C}`);
    draws.push(`fill "rgba(50, 205, 80, 0.6)" circle ${C},${C} ${C + r * 2.3},${C}`);
    // Diamond dew ray glints
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2;
      const x2 = C + Math.cos(ang) * (r * 2.6);
      const y2 = C + Math.sin(ang) * (r * 2.6);
      draws.push(`stroke "white" stroke-width 4 fill none line ${C},${C} ${x2.toFixed(1)},${y2.toFixed(1)}`);
    }
  } else if (f <= 8) {
    const expand = (f - 2) / 6;
    const rCore = 28 * (1 - expand * 0.5);
    const rBloom = 45 + expand * 75;
    const alpha = (1 - expand * 0.35).toFixed(2);

    draws.push(`fill "white" circle ${C},${C} ${C + rCore},${C}`);
    draws.push(`fill "rgba(255, 235, 140, ${alpha})" circle ${C},${C} ${C + rCore * 2},${C}`);

    // Radiating emerald four-leaf petals
    for (let p = 0; p < 8; p++) {
      const ang = (p * Math.PI) / 4 + expand * 0.2;
      const px = C + Math.cos(ang) * rBloom;
      const py = C + Math.sin(ang) * rBloom;
      const sz = 16 + expand * 8;
      draws.push(`fill "rgba(45, 210, 95, ${alpha})" circle ${px.toFixed(1)},${py.toFixed(1)} ${(px + sz).toFixed(1)},${py.toFixed(1)}`);
      draws.push(`fill "rgba(255, 235, 120, ${(alpha * 0.85).toFixed(2)})" circle ${px.toFixed(1)},${py.toFixed(1)} ${(px + sz * 0.5).toFixed(1)},${py.toFixed(1)}`);
    }

    // Golden pollen rays
    for (let i = 0; i < 12; i++) {
      const ang = (i * Math.PI) / 6;
      const r2 = rBloom + 20;
      const x2 = C + Math.cos(ang) * r2;
      const y2 = C + Math.sin(ang) * r2;
      draws.push(`stroke "rgba(255, 240, 140, ${alpha})" stroke-width 2.5 fill none line ${C},${C} ${x2.toFixed(1)},${y2.toFixed(1)}`);
    }
  } else {
    const diss = (f - 8) / 7;
    const alpha = ((1 - diss) * 0.6).toFixed(2);
    const rOuter = 85 + diss * 35;
    draws.push(`stroke "rgba(40, 180, 80, ${alpha})" stroke-width 3.5 fill none circle ${C},${C} ${C + rOuter},${C}`);
    for (let m = 0; m < 18; m++) {
      const ang = (m * Math.PI * 2) / 18 + m * 0.3;
      const dist = 35 + diss * 70;
      const mx = C + Math.cos(ang) * dist;
      const my = C + Math.sin(ang) * dist;
      draws.push(`fill "rgba(120, 240, 150, ${alpha})" circle ${mx.toFixed(1)},${my.toFixed(1)} ${(mx + 3).toFixed(1)},${my.toFixed(1)}`);
    }
  }
  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.5 "${framePath}"`);
});

// 4. PANKO CRIT BURST (Molten Butter Eruption & Caramelized Shards)
console.log('Building panko-crit-burst...');
buildCritAtlas('panko-crit-burst', (f, framePath) => {
  const C = 128;
  const draws = [];
  if (f <= 2) {
    const r = 26 + f * 24;
    draws.push(`fill "white" circle ${C},${C} ${C + r},${C}`);
    draws.push(`fill "rgba(255, 245, 170, 0.95)" circle ${C},${C} ${C + r * 1.6},${C}`);
    draws.push(`fill "rgba(220, 120, 20, 0.6)" circle ${C},${C} ${C + r * 2.3},${C}`);
    // Sharp butter-cleaver flash spikes
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI) / 3;
      const x2 = C + Math.cos(ang) * (r * 2.5);
      const y2 = C + Math.sin(ang) * (r * 2.5);
      draws.push(`stroke "white" stroke-width 3.5 fill none line ${C},${C} ${x2.toFixed(1)},${y2.toFixed(1)}`);
    }
  } else if (f <= 8) {
    const expand = (f - 2) / 6;
    const rCore = 30 * (1 - expand * 0.5);
    const rWave = 48 + expand * 72;
    const alpha = (1 - expand * 0.35).toFixed(2);

    draws.push(`fill "white" circle ${C},${C} ${C + rCore},${C}`);
    draws.push(`fill "rgba(255, 220, 80, ${alpha})" circle ${C},${C} ${C + rCore * 2},${C}`);
    draws.push(`stroke "rgba(255, 195, 50, ${alpha})" stroke-width 6 fill "rgba(215, 110, 15, 0.2)" circle ${C},${C} ${C + rWave},${C}`);

    // Flying crunchy bread crumbs and caramelized sugar shards
    for (let c = 0; c < 22; c++) {
      const ang = (c * Math.PI * 2) / 22 + expand * 0.4;
      const dist = rWave * 0.65 + expand * 48 + (c % 4) * 8;
      const cx = C + Math.cos(ang) * dist;
      const cy = C + Math.sin(ang) * dist;
      const sz = 2.5 + (c % 3) * 1.5;
      draws.push(`fill "rgba(255, 235, 150, ${alpha})" circle ${cx.toFixed(1)},${cy.toFixed(1)} ${(cx + sz).toFixed(1)},${cy.toFixed(1)}`);
      draws.push(`fill "rgba(195, 95, 10, ${alpha})" circle ${(cx + 1).toFixed(1)},${(cy + 1).toFixed(1)} ${(cx + sz + 2).toFixed(1)},${(cy + 1).toFixed(1)}`);
    }
  } else {
    const diss = (f - 8) / 7;
    const alpha = ((1 - diss) * 0.6).toFixed(2);
    const rOuter = 85 + diss * 35;
    draws.push(`stroke "rgba(210, 115, 20, ${alpha})" stroke-width 4 fill none circle ${C},${C} ${C + rOuter},${C}`);
    for (let c = 0; c < 16; c++) {
      const ang = (c * Math.PI * 2) / 16 + c * 0.3;
      const dist = 35 + diss * 70;
      const cx = C + Math.cos(ang) * dist;
      const cy = C + Math.sin(ang) * dist;
      draws.push(`fill "rgba(255, 220, 110, ${alpha})" circle ${cx.toFixed(1)},${cy.toFixed(1)} ${(cx + 2.5).toFixed(1)},${cy.toFixed(1)}`);
    }
  }
  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.5 "${framePath}"`);
});

// Update manifest
console.log('Updating manifest.json with 4 crit burst entries...');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const critEntries = {
  'mochi-crit-burst': { file: 'mochi-crit-burst.webp', cols: 4, rows: 4, frameMs: 40, blend: 'add', anchor: 'target', sizePx: 256 },
  'soot-crit-burst': { file: 'soot-crit-burst.webp', cols: 4, rows: 4, frameMs: 40, blend: 'add', anchor: 'target', sizePx: 256 },
  'clover-crit-burst': { file: 'clover-crit-burst.webp', cols: 4, rows: 4, frameMs: 40, blend: 'add', anchor: 'target', sizePx: 256 },
  'panko-crit-burst': { file: 'panko-crit-burst.webp', cols: 4, rows: 4, frameMs: 40, blend: 'add', anchor: 'target', sizePx: 256 }
};
for (const [k, v] of Object.entries(critEntries)) manifest[k] = v;

const sortedManifest = {};
for (const k of Object.keys(manifest).sort()) sortedManifest[k] = manifest[k];
fs.writeFileSync(manifestPath, JSON.stringify(sortedManifest, null, 2) + '\n', 'utf8');

// Montage
const montageOut = '/Users/bao/th-v5-ag2/reports/v5/AG2/T1/crits-montage.jpg';
const critFiles = [
  `${vfxDir}/mochi-crit-burst.webp`,
  `${vfxDir}/soot-crit-burst.webp`,
  `${vfxDir}/clover-crit-burst.webp`,
  `${vfxDir}/panko-crit-burst.webp`,
];
run(`magick montage ${critFiles.map(f => `"${f}"`).join(' ')} -tile 2x2 -geometry 256x256+4+4 -background "#0a0a0a" -quality 80 "${montageOut}"`);
console.log(`  -> Crits Montage: ${montageOut}`);
