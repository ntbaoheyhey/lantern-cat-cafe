#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AG2/jobs/status_v1';
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

function compositeAtlasEffect(effectWebp, outCompJpg, posX = 480, posY = 270, frameW = 128, frameH = 128) {
  let samplePng = path.join(workBase, 'temp_sample.png');
  run(`magick "${effectWebp}" -crop ${frameW}x${frameH}+${frameW}+${frameH} +repage "${samplePng}"`);
  const left = Math.round(posX - frameW / 2);
  const top = Math.round(posY - frameH / 2);
  run(`magick "${battleBg}" "${samplePng}" -geometry +${left}+${top} -compose plus -composite -quality 80 "${outCompJpg}"`);
  console.log(`  [Composite] -> ${outCompJpg}`);
}

function buildStatusAtlas(name, renderFrame) {
  const framesDir = path.join(workBase, `${name}_frames`);
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

  const frameFiles = [];
  for (let f = 0; f < 16; f++) {
    const framePath = path.join(framesDir, `frame_${String(f).padStart(2, '0')}.png`);
    renderFrame(f, framePath);
    frameFiles.push(`"${framePath}"`);
  }

  const stitchedPng = path.join(workBase, `${name}_stitched.png`);
  run(`magick montage ${frameFiles.join(' ')} -tile 4x4 -geometry 128x128+0+0 -background black "${stitchedPng}"`);

  const outWebp = path.join(vfxDir, `${name}.webp`);
  toWebP(stitchedPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeAtlasEffect(outWebp, path.join(compDir, `${name}.jpg`), 480, 270, 128, 128);
}

console.log('Generating 4 Status Effect Loops (F3)...');

// 1. STATUS POISON LOOP (Bubbling Violet Venom & Spores)
console.log('Building status-poison-loop...');
buildStatusAtlas('status-poison-loop', (f, framePath) => {
  const C = 64;
  const draws = [];
  const phase = (f * Math.PI * 2) / 16;

  // Toxic violet core
  draws.push(`fill "rgba(180, 70, 240, 0.45)" circle ${C},${C + 10} ${C + 18},${C + 10}`);
  draws.push(`fill "rgba(100, 220, 80, 0.25)" circle ${C},${C + 10} ${C + 35},${C + 10}`);

  // Rising bubbling venom droplets (seamless cyclic loop)
  for (let b = 0; b < 6; b++) {
    const bPhase = (phase + (b * Math.PI * 2) / 6) % (Math.PI * 2);
    const rise = (bPhase / (Math.PI * 2)) * 45; // 0 to 45 px up
    const sway = Math.sin(bPhase * 2) * 8;
    const bx = C - 15 + (b * 6) + sway;
    const by = C + 20 - rise;
    const sz = 2.5 + (b % 3);
    const alpha = (Math.sin(bPhase) * 0.85).toFixed(2);
    if (alpha > 0.05) {
      draws.push(`fill "rgba(180, 50, 230, ${alpha})" circle ${bx.toFixed(1)},${by.toFixed(1)} ${(bx + sz).toFixed(1)},${by.toFixed(1)}`);
      draws.push(`fill "rgba(120, 255, 100, ${alpha})" circle ${(bx - 1).toFixed(1)},${(by - 1).toFixed(1)} ${(bx + sz * 0.5).toFixed(1)},${(by - 1).toFixed(1)}`);
    }
  }

  run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${framePath}"`);
});

// 2. STATUS BURN LOOP (Crackling Flame Tongues & Embers)
console.log('Building status-burn-loop...');
buildStatusAtlas('status-burn-loop', (f, framePath) => {
  const C = 64;
  const draws = [];
  const phase = (f * Math.PI * 2) / 16;

  // Luminous fire core
  draws.push(`fill "rgba(255, 230, 90, 0.5)" circle ${C},${C + 12} ${C + 16},${C + 12}`);
  draws.push(`fill "rgba(255, 60, 0, 0.3)" circle ${C},${C + 12} ${C + 32},${C + 12}`);

  // 3 Flickering flame tongues rising
  for (let t = 0; t < 3; t++) {
    const tPhase = (phase + (t * Math.PI * 2) / 3) % (Math.PI * 2);
    const h = 20 + Math.sin(tPhase) * 12;
    const tx = C - 12 + t * 12;
    const ty = C + 14;
    draws.push(`stroke "rgba(255, 80, 0, 0.85)" stroke-width 3.5 fill none line ${tx},${ty} ${tx + Math.sin(tPhase * 2) * 5},${ty - h}`);
    draws.push(`stroke "rgba(255, 220, 60, 0.9)" stroke-width 2 fill none line ${tx},${ty} ${tx + Math.sin(tPhase * 2) * 3},${ty - h * 0.7}`);
  }

  // Floating spark embers
  for (let s = 0; s < 8; s++) {
    const sPhase = (phase + (s * Math.PI * 2) / 8) % (Math.PI * 2);
    const rise = (sPhase / (Math.PI * 2)) * 48;
    const sx = C + Math.cos(sPhase * 3) * 16;
    const sy = C + 15 - rise;
    const alpha = (Math.sin(sPhase) * 0.9).toFixed(2);
    if (alpha > 0.05) {
      draws.push(`fill "rgba(255, 240, 140, ${alpha})" circle ${sx.toFixed(1)},${sy.toFixed(1)} ${(sx + 1.8).toFixed(1)},${sy.toFixed(1)}`);
    }
  }

  run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${framePath}"`);
});

// 3. STATUS STUN LOOP (Orbiting Golden Dizziness Yarn / Stars)
console.log('Building status-stun-loop...');
buildStatusAtlas('status-stun-loop', (f, framePath) => {
  const C = 64;
  const draws = [];
  const phase = (f * Math.PI * 2) / 16;

  // Gentle central halo
  draws.push(`fill "rgba(255, 235, 140, 0.3)" circle ${C},${C} ${C + 15},${C}`);

  // 3 Orbiting golden stars in an elliptical 3D tilt
  for (let i = 0; i < 3; i++) {
    const ang = (i * Math.PI * 2) / 3 + phase;
    const ox = C + Math.cos(ang) * 28;
    const oy = C + Math.sin(ang) * 12; // Elliptical foreshortening

    // Star glint with cross
    draws.push(`fill "white" circle ${ox.toFixed(1)},${oy.toFixed(1)} ${(ox + 3).toFixed(1)},${oy.toFixed(1)}`);
    draws.push(`fill "rgba(255, 215, 60, 0.9)" circle ${ox.toFixed(1)},${oy.toFixed(1)} ${(ox + 7).toFixed(1)},${oy.toFixed(1)}`);
    draws.push(`stroke "rgba(255, 255, 230, 0.9)" stroke-width 1.5 line ${(ox - 8).toFixed(1)},${oy.toFixed(1)} ${(ox + 8).toFixed(1)},${oy.toFixed(1)} line ${ox.toFixed(1)},${(oy - 8).toFixed(1)} ${ox.toFixed(1)},${(oy + 8).toFixed(1)}`);
  }

  // Soft orbiting wool fiber thread connecting the stars
  for (let seg = 0; seg < 12; seg++) {
    const a1 = (seg * Math.PI * 2) / 12 + phase;
    const a2 = ((seg + 1) * Math.PI * 2) / 12 + phase;
    const x1 = C + Math.cos(a1) * 28;
    const y1 = C + Math.sin(a1) * 12;
    const x2 = C + Math.cos(a2) * 28;
    const y2 = C + Math.sin(a2) * 12;
    draws.push(`stroke "rgba(255, 200, 50, 0.5)" stroke-width 1.5 stroke-dasharray 4,4 fill none line ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`);
  }

  run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${framePath}"`);
});

// 4. STATUS SLOW LOOP (Viscous Honey Streams & Heavy Molten Droplets)
console.log('Building status-slow-loop...');
buildStatusAtlas('status-slow-loop', (f, framePath) => {
  const C = 64;
  const draws = [];
  const phase = (f * Math.PI * 2) / 16;

  // Warm honey puddle underglow
  draws.push(`fill "rgba(255, 210, 60, 0.4)" circle ${C},${C + 16} ${C + 20},${C + 16}`);
  draws.push(`fill "rgba(200, 100, 15, 0.25)" circle ${C},${C + 16} ${C + 35},${C + 16}`);

  // 4 Viscous dripping honey strands
  for (let s = 0; s < 4; s++) {
    const sPhase = (phase + (s * Math.PI * 2) / 4) % (Math.PI * 2);
    const drop = (sPhase / (Math.PI * 2)) * 36;
    const sx = C - 15 + s * 10;
    const sy = C - 10 + drop;
    const alpha = (Math.sin(sPhase) * 0.85).toFixed(2);
    if (alpha > 0.05) {
      // Teardrop honey bead
      draws.push(`fill "rgba(255, 200, 45, ${alpha})" circle ${sx.toFixed(1)},${sy.toFixed(1)} ${(sx + 3.5).toFixed(1)},${sy.toFixed(1)}`);
      draws.push(`fill "rgba(255, 250, 180, ${alpha})" circle ${(sx - 1).toFixed(1)},${(sy - 1).toFixed(1)} ${(sx + 1.5).toFixed(1)},${(sy - 1).toFixed(1)}`);
      draws.push(`stroke "rgba(230, 130, 20, ${alpha})" stroke-width 1.5 fill none line ${sx.toFixed(1)},${(sy - 15).toFixed(1)} ${sx.toFixed(1)},${sy.toFixed(1)}`);
    }
  }

  run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${framePath}"`);
});

// Update manifest
console.log('Updating manifest.json with 4 status effect loop entries...');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const statusEntries = {
  'status-poison-loop': { file: 'status-poison-loop.webp', cols: 4, rows: 4, frameMs: 60, blend: 'add', anchor: 'target', sizePx: 128 },
  'status-burn-loop': { file: 'status-burn-loop.webp', cols: 4, rows: 4, frameMs: 50, blend: 'add', anchor: 'target', sizePx: 128 },
  'status-stun-loop': { file: 'status-stun-loop.webp', cols: 4, rows: 4, frameMs: 50, blend: 'add', anchor: 'target', sizePx: 128 },
  'status-slow-loop': { file: 'status-slow-loop.webp', cols: 4, rows: 4, frameMs: 70, blend: 'add', anchor: 'target', sizePx: 128 }
};
for (const [k, v] of Object.entries(statusEntries)) manifest[k] = v;

const sortedManifest = {};
for (const k of Object.keys(manifest).sort()) sortedManifest[k] = manifest[k];
fs.writeFileSync(manifestPath, JSON.stringify(sortedManifest, null, 2) + '\n', 'utf8');

// Montage
const montageOut = '/Users/bao/th-v5-ag2/reports/v5/AG2/T1/status-montage.jpg';
const statusFiles = [
  `${vfxDir}/status-poison-loop.webp`,
  `${vfxDir}/status-burn-loop.webp`,
  `${vfxDir}/status-stun-loop.webp`,
  `${vfxDir}/status-slow-loop.webp`,
];
run(`magick montage ${statusFiles.map(f => `"${f}"`).join(' ')} -tile 2x2 -geometry 128x128+4+4 -background "#0a0a0a" -quality 80 "${montageOut}"`);
console.log(`  -> Status Montage: ${montageOut}`);
