#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AG2/jobs/ultimates';
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
  // Crop peak frame: row 1, col 1 in 4x4 atlas (frame 5 = +256+256)
  run(`magick "${effectWebp}" -crop ${frameW}x${frameH}+${frameW}+${frameH} +repage "${samplePng}"`);
  const left = Math.round(posX - frameW / 2);
  const top = Math.round(posY - frameH / 2);
  run(`magick "${battleBg}" "${samplePng}" -geometry +${left}+${top} -compose plus -composite -quality 80 "${outCompJpg}"`);
  console.log(`  [Composite] -> ${outCompJpg}`);
}

console.log('Processing 8 Ultimate Flipbook Sheets (Q6)...');

// ----------------------------------------------------------------------
// 1. PROCESS GENERATED SHEETS (Mochi, Soot, Clover Charge)
// ----------------------------------------------------------------------
const generatedSheets = [
  { id: 'mochi-ult-charge', raw: '/Users/bao/th-v5-ag2/work/v5/AG2/raw/mochi-ult-charge-gen.jpg' },
  { id: 'mochi-ult-release', raw: '/Users/bao/th-v5-ag2/work/v5/AG2/raw/mochi-ult-release-gen.jpg' },
  { id: 'soot-ult-charge', raw: '/Users/bao/th-v5-ag2/work/v5/AG2/raw/soot-ult-charge-gen.jpg' },
  { id: 'soot-ult-release', raw: '/Users/bao/th-v5-ag2/work/v5/AG2/raw/soot-ult-release-gen.jpg' },
  { id: 'clover-ult-charge', raw: '/Users/bao/th-v5-ag2/work/v5/AG2/raw/clover-ult-charge-gen.jpg' },
];

for (const item of generatedSheets) {
  const cleanPng = path.join(workBase, `${item.id}_clean.png`);
  const outWebp = path.join(vfxDir, `${item.id}.webp`);
  run(`magick "${item.raw}" -black-threshold 4% -resize 1024x1024! "${cleanPng}"`);
  toWebP(cleanPng, outWebp, 85);
  console.log(`  -> [Generated] ${outWebp}`);
  compositeAtlasEffect(outWebp, path.join(compDir, `${item.id}.jpg`), 480, 270, 256, 256);
}

// ----------------------------------------------------------------------
// 2. PROCEDURAL ATLAS BUILDERS (For Quota-Exhausted Effects)
// ----------------------------------------------------------------------

// Helper to build a 4x4 atlas (1024x1024) from a frame rendering callback
function buildProceduralAtlas(name, renderFrame) {
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
  console.log(`  -> [Procedural] ${outWebp}`);
  compositeAtlasEffect(outWebp, path.join(compDir, `${name}.jpg`), 480, 270, 256, 256);
}

// Procedural Clover Ult Release (Sacred Botanical Blossom Explosion)
console.log('Building Procedural clover-ult-release (Sacred Botanical Blossom)...');
buildProceduralAtlas('clover-ult-release', (f, framePath) => {
  const C = 128;
  const draws = [];
  const progress = f / 15; // 0.0 to 1.0

  if (f <= 2) {
    // Initial detonation flash
    const intensity = 0.5 + f * 0.25;
    const rCore = 15 + f * 18;
    const rGlow = 35 + f * 35;
    draws.push(`fill "white" circle ${C},${C} ${C + rCore},${C}`);
    draws.push(`fill "rgba(220, 255, 200, ${intensity.toFixed(2)})" circle ${C},${C} ${C + rGlow},${C}`);
    draws.push(`fill "rgba(60, 200, 100, 0.4)" circle ${C},${C} ${C + rGlow + 30},${C}`);
  } else if (f <= 8) {
    // Peak expanding blossoming shockwave
    const expand = (f - 2) / 6; // 0.16 to 1.0
    const rCore = 25 * (1 - expand * 0.4);
    const rBloom = 40 + expand * 75;
    const alpha = (1 - expand * 0.35).toFixed(2);

    draws.push(`fill "white" circle ${C},${C} ${C + rCore},${C}`);
    draws.push(`fill "rgba(255, 240, 150, ${alpha})" circle ${C},${C} ${C + rCore * 2},${C}`);

    // Radiating 8-petal clover bloom outline
    for (let p = 0; p < 8; p++) {
      const ang = (p * Math.PI) / 4 + progress * 0.2;
      const petalDist = rBloom * 0.85;
      const px = C + Math.cos(ang) * petalDist;
      const py = C + Math.sin(ang) * petalDist;
      const pRad = 16 + expand * 10;
      draws.push(`fill "rgba(60, 210, 100, ${alpha})" circle ${px.toFixed(1)},${py.toFixed(1)} ${(px + pRad).toFixed(1)},${py.toFixed(1)}`);
      draws.push(`fill "rgba(255, 220, 100, ${(alpha * 0.8).toFixed(2)})" circle ${px.toFixed(1)},${py.toFixed(1)} ${(px + pRad * 0.5).toFixed(1)},${py.toFixed(1)}`);
    }

    // Expanding golden pollen ray shafts
    for (let i = 0; i < 12; i++) {
      const ang = (i * Math.PI) / 6;
      const r1 = rCore * 1.5;
      const r2 = rBloom + 15;
      const x1 = C + Math.cos(ang) * r1;
      const y1 = C + Math.sin(ang) * r1;
      const x2 = C + Math.cos(ang) * r2;
      const y2 = C + Math.sin(ang) * r2;
      draws.push(`stroke "rgba(255, 235, 120, ${alpha})" stroke-width 2.5 fill none line ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`);
    }
  } else {
    // Dissipation into floating leaf motes and healing dew
    const diss = (f - 8) / 7; // 0.14 to 1.0
    const alpha = ((1 - diss) * 0.65).toFixed(2);
    const rOuter = 85 + diss * 35;

    // Outer soft ring
    draws.push(`stroke "rgba(50, 180, 90, ${alpha})" stroke-width 3 fill none circle ${C},${C} ${C + rOuter},${C}`);

    // Scattering leaf motes
    for (let m = 0; m < 18; m++) {
      const ang = (m * Math.PI * 2) / 18 + m * 0.3;
      const dist = 30 + diss * 70 + (m % 4) * 12;
      const mx = C + Math.cos(ang) * dist;
      const my = C + Math.sin(ang) * dist;
      const sz = 2.5 + (m % 3);
      draws.push(`fill "rgba(100, 230, 140, ${alpha})" circle ${mx.toFixed(1)},${my.toFixed(1)} ${(mx + sz).toFixed(1)},${my.toFixed(1)}`);
      draws.push(`fill "rgba(255, 235, 120, ${alpha})" circle ${(mx + 2).toFixed(1)},${(my + 2).toFixed(1)} ${(mx + sz + 1).toFixed(1)},${(my + 2).toFixed(1)}`);
    }
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.5 "${framePath}"`);
});

// Procedural Panko Ult Charge (Molten Butter Vortex)
console.log('Building Procedural panko-ult-charge (Molten Butter Vortex)...');
buildProceduralAtlas('panko-ult-charge', (f, framePath) => {
  const C = 128;
  const draws = [];
  const progress = f / 15; // 0.0 to 1.0

  // Inward suction progression: radius shrinks, intensity and core brightness grow
  const vortexRadius = 110 - progress * 55; // 110 down to 55
  const coreBrightness = 0.3 + progress * 0.7; // 0.3 up to 1.0
  const coreRad = 12 + progress * 20;

  // Swirling inward butter arms
  for (let s = 0; s < 5; s++) {
    const baseAng = (s * Math.PI * 2) / 5 + progress * 4.0;
    const r1 = vortexRadius * 0.3;
    const r2 = vortexRadius;
    const x1 = C + Math.cos(baseAng) * r1;
    const y1 = C + Math.sin(baseAng) * r1;
    const cx = C + Math.cos(baseAng + 0.8) * (r1 + r2) * 0.55;
    const cy = C + Math.sin(baseAng + 0.8) * (r1 + r2) * 0.55;
    const x2 = C + Math.cos(baseAng + 1.6) * r2;
    const y2 = C + Math.sin(baseAng + 1.6) * r2;
    draws.push(`stroke "rgba(255, 195, 60, ${coreBrightness.toFixed(2)})" stroke-width 3.5 fill none bezier ${x1.toFixed(1)},${y1.toFixed(1)} ${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`);
  }

  // Floating crumb motes spiraling inward
  for (let c = 0; c < 14; c++) {
    const ang = (c * Math.PI * 2) / 14 + progress * 5.0;
    const dist = vortexRadius * 0.4 + (c % 5) * 12;
    const cx = C + Math.cos(ang) * dist;
    const cy = C + Math.sin(ang) * dist;
    draws.push(`fill "rgba(255, 230, 140, 0.9)" circle ${cx.toFixed(1)},${cy.toFixed(1)} ${(cx + 3).toFixed(1)},${cy.toFixed(1)}`);
    draws.push(`fill "rgba(200, 100, 20, 0.7)" circle ${cx.toFixed(1)},${cy.toFixed(1)} ${(cx + 5).toFixed(1)},${cy.toFixed(1)}`);
  }

  // Central incandescent butter core
  draws.push(`fill "rgba(255, 255, 255, ${coreBrightness.toFixed(2)})" circle ${C},${C} ${C + coreRad * 0.6},${C}`);
  draws.push(`fill "rgba(255, 225, 90, ${(coreBrightness * 0.85).toFixed(2)})" circle ${C},${C} ${C + coreRad},${C}`);
  draws.push(`fill "rgba(215, 115, 20, 0.45)" circle ${C},${C} ${C + coreRad * 1.6},${C}`);

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.5 "${framePath}"`);
});

// Procedural Panko Ult Release (Bakery Butter Oven Explosion)
console.log('Building Procedural panko-ult-release (Bakery Butter Explosion)...');
buildProceduralAtlas('panko-ult-release', (f, framePath) => {
  const C = 128;
  const draws = [];
  const progress = f / 15; // 0.0 to 1.0

  if (f <= 2) {
    // Initial white-hot butter detonation
    const rCore = 20 + f * 22;
    const rGlow = 40 + f * 38;
    draws.push(`fill "white" circle ${C},${C} ${C + rCore},${C}`);
    draws.push(`fill "rgba(255, 240, 150, 0.9)" circle ${C},${C} ${C + rGlow},${C}`);
    draws.push(`fill "rgba(220, 120, 30, 0.5)" circle ${C},${C} ${C + rGlow + 35},${C}`);
  } else if (f <= 8) {
    // Expanding molten golden butter shockwave + crumb shrapnel
    const expand = (f - 2) / 6;
    const rCore = 30 * (1 - expand * 0.5);
    const rWave = 50 + expand * 70;
    const alpha = (1 - expand * 0.35).toFixed(2);

    draws.push(`fill "white" circle ${C},${C} ${C + rCore},${C}`);
    draws.push(`fill "rgba(255, 220, 90, ${alpha})" circle ${C},${C} ${C + rCore * 2},${C}`);

    // Expanding scalloped butter wave ring
    draws.push(`stroke "rgba(255, 200, 60, ${alpha})" stroke-width 6 fill "rgba(230, 130, 25, 0.2)" circle ${C},${C} ${C + rWave},${C}`);
    draws.push(`stroke "rgba(255, 245, 180, ${alpha})" stroke-width 3 stroke-dasharray 10,8 fill none circle ${C},${C} ${C + rWave - 8},${C}`);

    // Flying crunchy bread crumbs and pastry shards
    for (let c = 0; c < 20; c++) {
      const ang = (c * Math.PI * 2) / 20 + expand * 0.4;
      const dist = rWave * 0.6 + expand * 45 + (c % 4) * 8;
      const cx = C + Math.cos(ang) * dist;
      const cy = C + Math.sin(ang) * dist;
      const sz = 2.5 + (c % 3) * 1.5;
      draws.push(`fill "rgba(255, 235, 150, ${alpha})" circle ${cx.toFixed(1)},${cy.toFixed(1)} ${(cx + sz).toFixed(1)},${cy.toFixed(1)}`);
      draws.push(`fill "rgba(190, 90, 15, ${alpha})" circle ${cx.toFixed(1)},${cy.toFixed(1)} ${(cx + sz + 2).toFixed(1)},${cy.toFixed(1)}`);
    }
  } else {
    // Sizzling steam clouds and dissolving toasted embers
    const diss = (f - 8) / 7;
    const alpha = ((1 - diss) * 0.6).toFixed(2);
    const rOuter = 85 + diss * 35;

    draws.push(`stroke "rgba(220, 130, 30, ${alpha})" stroke-width 4 fill none circle ${C},${C} ${C + rOuter},${C}`);

    // Floating crumb dust
    for (let c = 0; c < 16; c++) {
      const ang = (c * Math.PI * 2) / 16 + c * 0.3;
      const dist = 40 + diss * 65 + (c % 5) * 10;
      const cx = C + Math.cos(ang) * dist;
      const cy = C + Math.sin(ang) * dist;
      draws.push(`fill "rgba(255, 220, 120, ${alpha})" circle ${cx.toFixed(1)},${cy.toFixed(1)} ${(cx + 2.5).toFixed(1)},${cy.toFixed(1)}`);
    }
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.6 "${framePath}"`);
});

// ----------------------------------------------------------------------
// 3. UPDATE MANIFEST.JSON WITH 8 NEW ENTRIES
// ----------------------------------------------------------------------
console.log('Updating manifest.json with 8 ultimate entries...');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const ultEntries = {
  'clover-ult-charge': {
    file: 'clover-ult-charge.webp',
    cols: 4,
    rows: 4,
    frameMs: 50,
    blend: 'add',
    anchor: 'caster',
    sizePx: 256
  },
  'clover-ult-release': {
    file: 'clover-ult-release.webp',
    cols: 4,
    rows: 4,
    frameMs: 40,
    blend: 'add',
    anchor: 'target',
    sizePx: 256
  },
  'mochi-ult-charge': {
    file: 'mochi-ult-charge.webp',
    cols: 4,
    rows: 4,
    frameMs: 50,
    blend: 'add',
    anchor: 'caster',
    sizePx: 256
  },
  'mochi-ult-release': {
    file: 'mochi-ult-release.webp',
    cols: 4,
    rows: 4,
    frameMs: 40,
    blend: 'add',
    anchor: 'caster',
    sizePx: 256
  },
  'panko-ult-charge': {
    file: 'panko-ult-charge.webp',
    cols: 4,
    rows: 4,
    frameMs: 50,
    blend: 'add',
    anchor: 'caster',
    sizePx: 256
  },
  'panko-ult-release': {
    file: 'panko-ult-release.webp',
    cols: 4,
    rows: 4,
    frameMs: 40,
    blend: 'add',
    anchor: 'target',
    sizePx: 256
  },
  'soot-ult-charge': {
    file: 'soot-ult-charge.webp',
    cols: 4,
    rows: 4,
    frameMs: 50,
    blend: 'add',
    anchor: 'caster',
    sizePx: 256
  },
  'soot-ult-release': {
    file: 'soot-ult-release.webp',
    cols: 4,
    rows: 4,
    frameMs: 40,
    blend: 'add',
    anchor: 'target',
    sizePx: 256
  }
};

for (const [k, v] of Object.entries(ultEntries)) {
  manifest[k] = v;
}

// Ensure sorted keys
const sortedManifest = {};
for (const k of Object.keys(manifest).sort()) {
  sortedManifest[k] = manifest[k];
}

fs.writeFileSync(manifestPath, JSON.stringify(sortedManifest, null, 2) + '\n', 'utf8');
console.log(`  -> Manifest successfully updated with ${Object.keys(sortedManifest).length} sorted entries.`);

// ----------------------------------------------------------------------
// 4. COMBINED ULTIMATES MONTAGES
// ----------------------------------------------------------------------
const montageOut = '/Users/bao/th-v5-ag2/reports/v5/AG2/T1/ultimates-montage.jpg';
const ultFiles = [
  `${vfxDir}/mochi-ult-charge.webp`,
  `${vfxDir}/mochi-ult-release.webp`,
  `${vfxDir}/soot-ult-charge.webp`,
  `${vfxDir}/soot-ult-release.webp`,
  `${vfxDir}/clover-ult-charge.webp`,
  `${vfxDir}/clover-ult-release.webp`,
  `${vfxDir}/panko-ult-charge.webp`,
  `${vfxDir}/panko-ult-release.webp`,
];
run(`magick montage ${ultFiles.map(f => `"${f}"`).join(' ')} -tile 4x2 -geometry 256x256+4+4 -background "#0a0a0a" -quality 80 "${montageOut}"`);
console.log(`  -> Ultimates Montage: ${montageOut}`);
