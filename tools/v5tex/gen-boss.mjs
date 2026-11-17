#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AGV/jobs/boss_v3';
const compDir = '/Users/bao/th-v5-ag2/work/v5/AGV/comp';
const repCompDir = '/Users/bao/th-v5-ag2/reports/v5/AGV/comp';
const battleBg = '/Users/bao/th-v5-ag2/work/v5/AGV/comp_base/boss.png';

if (!fs.existsSync(vfxDir)) fs.mkdirSync(vfxDir, { recursive: true });
if (!fs.existsSync(workBase)) fs.mkdirSync(workBase, { recursive: true });

function run(cmd) {
  execSync(cmd, { stdio: 'pipe' });
}

function toWebP(pngIn, webpOut, q = 82) {
  run(`cwebp -q ${q} -alpha_q 90 "${pngIn}" -o "${webpOut}"`);
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

function drawBlob(cx, cy, radius, numLobes, seed, fillCol) {
  const pts = [];
  const steps = numLobes * 4;
  for (let i = 0; i < steps; i++) {
    const a = (i * Math.PI * 2) / steps;
    const lobeMod = 0.8 + 0.3 * Math.sin(a * numLobes + seed);
    const r = radius * lobeMod;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  return `fill "${fillCol}" stroke none polygon ${pts.join(' ')}`;
}

console.log('Regenerating Yarn-Giant Boss Effects (V3: Clean Geometry & Organic Matter)...');

// 1. YARN-GIANT CHARGE SWIRL (Fixed geometry: 1024x1024 4x4 direct conversion)
{
  console.log('Building yarn-giant-charge-swirl flipbook...');
  const rawYarnVortex = '/Users/bao/th-v5-ag2/work/v5/AG2/raw/yarn-vortex-gen.jpg';
  const outWebp = path.join(vfxDir, 'yarn-giant-charge-swirl.webp');

  // Convert raw 1024x1024 4x4 atlas directly with pure black thresholding and q76
  run(`magick "${rawYarnVortex}" -resize 1024x1024 -black-threshold 6% -quality 76 -define webp:method=6 "${outWebp}"`);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// 2. YARN-GIANT SHOCKWAVE RING (Organic braided yarn ring & tearing fiber tendrils)
{
  console.log('Building yarn-giant-shockwave-ring flipbook...');
  const framesDir = path.join(workBase, 'shockwave_frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });
  const frameFiles = [];

  for (let f = 0; f < 16; f++) {
    const framePath = path.join(framesDir, `frame_${String(f).padStart(2, '0')}.png`);
    const C = 128;
    const draws = [];

    if (f <= 2) {
      const r = 24 + f * 24;
      draws.push(drawBlob(C, C, r * 0.6, 6, f, 'rgba(255, 255, 255, 0.98)'));
      draws.push(drawBlob(C, C, r * 1.1, 7, f * 2, 'rgba(255, 120, 150, 0.85)'));
      draws.push(drawBlob(C, C, r * 1.6, 8, f * 3, 'rgba(180, 20, 50, 0.5)'));
    } else if (f <= 8) {
      const expand = (f - 2) / 6;
      const alpha = (1 - expand * 0.3).toFixed(2);
      const distBase = 32 + expand * 78;

      draws.push(drawBlob(C, C, 20 * (1 - expand * 0.6), 5, f, `rgba(255, 255, 255, ${alpha})`));

      // Braided undulating yarn ring (wavy multi-segment loop)
      const numSegments = 24;
      const ringPts = [];
      for (let s = 0; s < numSegments; s++) {
        const a = (s * Math.PI * 2) / numSegments;
        const wave = Math.sin(a * 6 + expand * 4) * 6;
        const r = distBase + wave;
        const px = C + Math.cos(a) * r;
        const py = C + Math.sin(a) * r;
        ringPts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
      }
      draws.push(`stroke "rgba(225, 45, 65, ${alpha})" stroke-width 5 fill none polygon ${ringPts.join(' ')}`);
      draws.push(`stroke "rgba(70, 100, 235, ${(alpha * 0.8).toFixed(2)})" stroke-width 2.5 fill none polygon ${ringPts.join(' ')}`);

      // 14 flying woolen yarn fiber tufts
      for (let i = 0; i < 14; i++) {
        const a = (i * Math.PI * 2) / 14 + expand * 0.5;
        const speed = 0.8 + (i % 3) * 0.25;
        const dist = distBase * speed;
        const px = C + Math.cos(a) * dist;
        const py = C + Math.sin(a) * dist;
        draws.push(drawFlake(px, py, 4.5, 5, i + f, `rgba(255, 170, 190, ${alpha})`, `rgba(200, 30, 60, ${alpha})`));
      }

      // Frayed thread arcs
      for (let t = 0; t < 6; t++) {
        const ta = (t * Math.PI * 2) / 6 + expand * 0.7;
        const p1x = C + Math.cos(ta) * (distBase * 0.7);
        const p1y = C + Math.sin(ta) * (distBase * 0.7);
        const p2x = C + Math.cos(ta + 0.3) * (distBase * 1.15);
        const p2y = C + Math.sin(ta + 0.3) * (distBase * 1.15);
        draws.push(`stroke "rgba(255, 230, 200, ${alpha})" stroke-width 2 fill none line ${p1x.toFixed(1)},${p1y.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)}`);
      }
    } else {
      const diss = (f - 8) / 7;
      const alpha = ((1 - diss) * 0.65).toFixed(2);
      const distBase = 100 + diss * 35;

      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI * 2) / 12 + i * 0.35;
        const px = C + Math.cos(a) * distBase;
        const py = C + Math.sin(a) * distBase;
        draws.push(drawFlake(px, py, 3, 5, i * 3, `rgba(210, 40, 70, ${alpha})`));
      }
    }

    run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${framePath}"`);
    frameFiles.push(`"${framePath}"`);
  }

  const stitchedPng = path.join(workBase, 'yarn_shockwave_stitched.png');
  run(`magick montage ${frameFiles.join(' ')} -tile 4x4 -geometry 256x256+0+0 -background black "${stitchedPng}"`);

  const outWebp = path.join(vfxDir, 'yarn-giant-shockwave-ring.webp');
  toWebP(stitchedPng, outWebp, 82);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// 3. YARN-GIANT GROUND CRACK (512x512 Decal - Deep jagged stone fissures & woven yarn cords)
{
  console.log('Building yarn-giant-ground-crack decal...');
  const outPng = path.join(workBase, 'yarn_giant_ground_crack.png');
  const outWebp = path.join(vfxDir, 'yarn-giant-ground-crack.webp');
  const C = 256;
  const draws = [];

  // Central fractured crater
  draws.push(drawBlob(C, C, 55, 7, 1, 'rgba(180, 25, 45, 0.8)'));
  draws.push(drawBlob(C, C, 35, 6, 2, 'rgba(50, 70, 190, 0.85)'));
  draws.push(drawBlob(C, C, 18, 5, 3, 'rgba(255, 240, 245, 0.95)'));

  // 12 deep jagged fractured fault lines branching outward
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6 + 0.12 * Math.sin(i * 3);
    const seg1R = 60 + (i % 3) * 20;
    const seg2R = 140 + (i % 4) * 25;
    const seg3R = 210 + (i % 2) * 20;

    const p0x = C + Math.cos(a) * 35;
    const p0y = C + Math.sin(a) * 35;

    const p1x = C + Math.cos(a + 0.08) * seg1R;
    const p1y = C + Math.sin(a + 0.08) * seg1R;

    const p2x = C + Math.cos(a - 0.06) * seg2R;
    const p2y = C + Math.sin(a - 0.06) * seg2R;

    const p3x = C + Math.cos(a + 0.04) * seg3R;
    const p3y = C + Math.sin(a + 0.04) * seg3R;

    const col = i % 2 === 0 ? 'rgba(230, 45, 65, 0.9)' : 'rgba(70, 100, 235, 0.9)';
    draws.push(`stroke "${col}" stroke-width 4.5 fill none line ${p0x.toFixed(1)},${p0y.toFixed(1)} ${p1x.toFixed(1)},${p1y.toFixed(1)} line ${p1x.toFixed(1)},${p1y.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)} line ${p2x.toFixed(1)},${p2y.toFixed(1)} ${p3x.toFixed(1)},${p3y.toFixed(1)}`);

    // Cross-stitches across fissure fault
    const mx = (p1x + p2x) * 0.5;
    const my = (p1y + p2y) * 0.5;
    draws.push(`stroke "rgba(255, 245, 250, 0.95)" stroke-width 2.5 line ${mx - 8},${my - 8} ${mx + 8},${my + 8} line ${mx - 8},${my + 8} ${mx + 8},${my - 8}`);

    // Dislodged fabric/stone debris flakes along edges
    const dbx = p2x + Math.sin(a) * 12;
    const dby = p2y - Math.cos(a) * 12;
    draws.push(drawFlake(dbx, dby, 6, 5, i * 7, 'rgba(200, 50, 75, 0.75)', 'rgba(255, 200, 215, 0.8)'));
  }

  run(`magick -size 512x512 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

console.log('All Yarn-Giant Boss effects updated.');
