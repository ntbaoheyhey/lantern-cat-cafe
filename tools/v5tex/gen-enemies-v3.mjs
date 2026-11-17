#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AGV/jobs/enemies_v3';
const manifestPath = path.join(vfxDir, 'manifest.json');

if (!fs.existsSync(vfxDir)) fs.mkdirSync(vfxDir, { recursive: true });
if (!fs.existsSync(workBase)) fs.mkdirSync(workBase, { recursive: true });

function run(cmd) {
  execSync(cmd, { stdio: 'pipe' });
}

function toWebP(pngIn, webpOut, q = 80) {
  run(`cwebp -q ${q} -alpha_q 90 "${pngIn}" -o "${webpOut}"`);
}

function drawBlob(cx, cy, radius, numLobes, seed, fillCol) {
  const pts = [];
  const steps = numLobes * 4;
  for (let i = 0; i < steps; i++) {
    const a = (i * Math.PI * 2) / steps;
    const lobeMod = 0.75 + 0.35 * Math.sin(a * numLobes + seed);
    const r = radius * lobeMod;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  return `fill "${fillCol}" stroke none polygon ${pts.join(' ')}`;
}

function drawFlake(cx, cy, radius, numPts, seed, fillCol, strokeCol = null) {
  const pts = [];
  for (let i = 0; i < numPts; i++) {
    const a = (i * Math.PI * 2) / numPts;
    const j = 0.65 + ((Math.sin(seed * 11 + i * 7) + 1) / 2) * 0.7;
    const r = radius * j;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  let str = `fill "${fillCol}" `;
  if (strokeCol) str += `stroke "${strokeCol}" stroke-width 1 `;
  else str += `stroke none `;
  str += `polygon ${pts.join(' ')}`;
  return str;
}

function drawSplatter(cx, cy, L, W, ang, fillCol) {
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  const perpCos = -sin;
  const perpSin = cos;

  const tipX = cx + cos * L;
  const tipY = cy + sin * L;
  const c1x = cx + cos * (L * 0.4) + perpCos * (W * 0.5);
  const c1y = cy + sin * (L * 0.4) + perpSin * (W * 0.5);
  const c2x = cx + cos * (L * 0.4) - perpCos * (W * 0.5);
  const c2y = cy + sin * (L * 0.4) - perpSin * (W * 0.5);

  return `fill "${fillCol}" stroke none path "M ${cx.toFixed(1)},${cy.toFixed(1)} Q ${c1x.toFixed(1)},${c1y.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)} Q ${c2x.toFixed(1)},${c2y.toFixed(1)} ${cx.toFixed(1)},${cy.toFixed(1)} Z"`;
}

console.log('Building organic Enemy & Boss VFX (V3: Painted organic matter, zero icons)...');

// 1. ENEMY HIT SPARK 1 (Silver needle glint splinter with tapered brush rays)
{
  console.log('Building organic enemy-hit-spark-1...');
  const outPng = path.join(workBase, 'enemy_hit_spark_1.png');
  const outWebp = path.join(vfxDir, 'enemy-hit-spark-1.webp');
  const C = 64;
  const draws = [];

  // Ambient silver/cyan sheen
  draws.push(drawBlob(C, C, 34, 7, 1, 'rgba(140, 200, 255, 0.35)'));
  draws.push(drawBlob(C, C, 18, 6, 2, 'rgba(210, 240, 255, 0.65)'));

  // 4 Asymmetric tapered needle rays with metallic glint
  const rays = [
    { ang: 0.1, len: 46, w: 4.5 },
    { ang: Math.PI / 2 - 0.08, len: 44, w: 4.5 },
    { ang: Math.PI + 0.12, len: 42, w: 4.0 },
    { ang: (3 * Math.PI) / 2 + 0.05, len: 45, w: 4.0 },
    { ang: Math.PI / 4 + 0.1, len: 24, w: 2.8 },
    { ang: (5 * Math.PI) / 4 - 0.1, len: 22, w: 2.8 }
  ];

  for (const r of rays) {
    draws.push(drawSplatter(C, C, r.len, r.w, r.ang, 'rgba(215, 245, 255, 0.88)'));
    draws.push(drawSplatter(C, C, r.len * 0.6, r.w * 0.5, r.ang, 'rgba(255, 255, 255, 0.98)'));
  }

  // Brilliant pin core
  draws.push(drawBlob(C, C, 6, 5, 3, 'rgba(255, 255, 255, 0.98)'));

  run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x0.8 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// 2. ENEMY HIT SPARK 2 (Hot copper boiling steam/droplet burst)
{
  console.log('Building organic enemy-hit-spark-2...');
  const outPng = path.join(workBase, 'enemy_hit_spark_2.png');
  const outWebp = path.join(vfxDir, 'enemy-hit-spark-2.webp');
  const C = 64;
  const draws = [];

  draws.push(drawBlob(C, C, 32, 6, 1, 'rgba(255, 140, 50, 0.38)'));
  draws.push(drawBlob(C, C, 19, 5, 2, 'rgba(255, 210, 120, 0.72)'));

  // 7 Flying steam droplet pops & copper splash specks
  for (let i = 0; i < 7; i++) {
    const a = (i * Math.PI * 2) / 7 + 0.25 * Math.sin(i * 2);
    const dist = 24 + (i % 3) * 8;
    const px = C + Math.cos(a) * dist;
    const py = C + Math.sin(a) * dist;
    draws.push(drawSplatter(px, py, 11, 4.5, a, 'rgba(255, 235, 180, 0.9)'));
    draws.push(drawBlob(px, py, 3.5, 4, i * 3, 'rgba(255, 255, 255, 0.95)'));
  }

  draws.push(drawBlob(C, C, 7, 5, 4, 'rgba(255, 255, 255, 0.98)'));

  run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x0.9 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// 3. ENEMY HIT SPARK 3 (Snapped yarn knot with frayed woolen whiskers)
{
  console.log('Building organic enemy-hit-spark-3...');
  const outPng = path.join(workBase, 'enemy_hit_spark_3.png');
  const outWebp = path.join(vfxDir, 'enemy-hit-spark-3.webp');
  const C = 64;
  const draws = [];

  draws.push(drawBlob(C, C, 28, 6, 1, 'rgba(240, 50, 90, 0.4)'));
  draws.push(drawBlob(C, C, 16, 5, 2, 'rgba(255, 180, 200, 0.75)'));

  // 6 Curling frayed woolen fibers popping outward
  const angles = [0.35, 1.35, 2.45, 3.55, 4.55, 5.65];
  for (let i = 0; i < angles.length; i++) {
    const ang = angles[i];
    const len = 34 + (i % 3) * 8;
    const midX = C + Math.cos(ang) * (len * 0.5) + Math.sin(ang) * 6;
    const midY = C + Math.sin(ang) * (len * 0.5) - Math.cos(ang) * 6;
    const endX = C + Math.cos(ang) * len;
    const endY = C + Math.sin(ang) * len;

    draws.push(`stroke "rgba(255, 140, 175, 0.85)" stroke-width 2.5 fill none path "M ${C},${C} Q ${midX.toFixed(1)},${midY.toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)}"`);
    draws.push(drawFlake(endX, endY, 4.0, 5, i * 4, 'rgba(255, 230, 240, 0.95)', 'rgba(220, 60, 100, 0.8)'));
  }

  draws.push(drawBlob(C, C, 6, 4, 5, 'rgba(255, 255, 255, 0.98)'));

  run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x0.9 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// 4. ENEMY DEATH DISSOLVE (4x4 256x256 flipbook: 16 frames of unraveling yarn, breaking stitches, drifting ash)
{
  console.log('Building organic enemy-death-dissolve 4x4 animated flipbook...');
  const framesDir = path.join(workBase, 'dissolve_frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });
  const frameFiles = [];

  for (let f = 0; f < 16; f++) {
    const framePath = path.join(framesDir, `frame_${String(f).padStart(2, '0')}.png`);
    const C = 128;
    const draws = [];

    // Animation progress:
    // f=0..3: seams glowing and opening up, stitches pulling
    // f=4..9: fabric tears into unraveling yarn loops and rising fiber wisps
    // f=10..15: yarn wisps disintegrating into floating ash embers and disappearing
    const t = f / 15;

    if (f <= 3) {
      // Intact enemy silhouette with breaking seam fissures
      const seamAlpha = ((f + 1) / 4).toFixed(2);
      draws.push(drawBlob(C, C, 65, 7, 1, 'rgba(40, 30, 35, 0.75)'));
      draws.push(drawBlob(C, C, 45, 6, 2, 'rgba(70, 45, 55, 0.6)'));

      // Glowing fracture seams
      draws.push(`stroke "rgba(255, 180, 80, ${seamAlpha})" stroke-width 3 fill none line ${C - 35},${C - 20} ${C + 35},${C + 20} line ${C - 20},${C + 30} ${C + 20},${C - 30}`);
      draws.push(`stroke "rgba(255, 240, 180, ${seamAlpha})" stroke-width 1.5 fill none line ${C - 35},${C - 20} ${C + 35},${C + 20}`);
    } else if (f <= 9) {
      const dissolveT = (f - 3) / 6;
      const coreR = Math.max(8, 55 * (1 - dissolveT * 0.85));
      const coreAlpha = (1 - dissolveT * 0.5).toFixed(2);

      draws.push(drawBlob(C, C, coreR, 6, f, `rgba(50, 35, 40, ${coreAlpha})`));

      // 8 Unraveling yarn thread loops whipping outward and curling upward
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI * 2) / 8 + dissolveT * 0.8;
        const dist = 35 + dissolveT * 55;
        const yDrift = -dissolveT * 38;
        const x1 = C + Math.cos(ang) * (dist * 0.5);
        const y1 = C + Math.sin(ang) * (dist * 0.5) + yDrift * 0.5;
        const x2 = C + Math.cos(ang + 0.4) * dist;
        const y2 = C + Math.sin(ang + 0.4) * dist + yDrift;

        const fiberAlpha = (1 - dissolveT * 0.4).toFixed(2);
        draws.push(`stroke "rgba(235, 90, 60, ${fiberAlpha})" stroke-width 2.5 fill none path "M ${C},${C} Q ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}"`);
        draws.push(drawFlake(x2, y2, 4.5, 5, i + f, `rgba(255, 190, 120, ${fiberAlpha})`));
      }

      // Rising ash flakes
      for (let a = 0; a < 10; a++) {
        const ax = C - 35 + ((a * 23 + f * 9) % 70);
        const ay = C + 20 - dissolveT * 60 - ((a * 17) % 30);
        draws.push(drawFlake(ax, ay, 3.0, 4, a * 3, `rgba(255, 160, 60, ${coreAlpha})`));
      }
    } else {
      // Dissipating ember ash and drifting smoke
      const diss = (f - 9) / 6;
      const alpha = ((1 - diss) * 0.65).toFixed(2);

      for (let a = 0; a < 12; a++) {
        const ax = C - 45 + ((a * 29 + f * 11) % 90);
        const ay = C - 15 - diss * 45 - ((a * 19) % 40);
        const sz = Math.max(1, 3.5 * (1 - diss * 0.7));
        draws.push(drawBlob(ax, ay, sz, 4, a * 2, `rgba(240, 120, 50, ${alpha})`));
      }
    }

    run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${framePath}"`);
    frameFiles.push(`"${framePath}"`);
  }

  const stitchedPng = path.join(workBase, 'dissolve_stitched.png');
  run(`magick montage ${frameFiles.join(' ')} -tile 4x4 -geometry 256x256+0+0 -background black "${stitchedPng}"`);

  const outWebp = path.join(vfxDir, 'enemy-death-dissolve.webp');
  toWebP(stitchedPng, outWebp, 78);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// Update manifest for enemy-death-dissolve to 4x4
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest['enemy-death-dissolve'] = {
  file: 'enemy-death-dissolve.webp',
  cols: 4,
  rows: 4,
  frameMs: 45,
  blend: 'add',
  anchor: 'target',
  sizePx: 256
};

// Re-sort manifest
const sortedManifest = {};
for (const k of Object.keys(manifest).sort()) {
  sortedManifest[k] = manifest[k];
}
fs.writeFileSync(manifestPath, JSON.stringify(sortedManifest, null, 2) + '\n');
console.log('Manifest updated for enemy-death-dissolve 4x4.');
