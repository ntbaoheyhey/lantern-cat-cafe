#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AGV/jobs/status_v2';
const compDir = '/Users/bao/th-v5-ag2/work/v5/AGV/comp';
const repCompDir = '/Users/bao/th-v5-ag2/reports/v5/AGV/comp';
const manifestPath = path.join(vfxDir, 'manifest.json');

if (!fs.existsSync(vfxDir)) fs.mkdirSync(vfxDir, { recursive: true });
if (!fs.existsSync(workBase)) fs.mkdirSync(workBase, { recursive: true });

function run(cmd) {
  execSync(cmd, { stdio: 'pipe' });
}

function toWebP(pngIn, webpOut, q = 85) {
  run(`cwebp -q ${q} -alpha_q 90 "${pngIn}" -o "${webpOut}"`);
}

function drawPetal(cx, cy, L, W, ang, fillCol, strokeCol = null) {
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  const perpCos = -sin;
  const perpSin = cos;

  const tipX = cx + cos * L;
  const tipY = cy + sin * L;
  const ctrl1X = cx + cos * (L * 0.45) + perpCos * (W * 0.5);
  const ctrl1Y = cy + sin * (L * 0.45) + perpSin * (W * 0.5);
  const ctrl2X = cx + cos * (L * 0.45) - perpCos * (W * 0.5);
  const ctrl2Y = cy + sin * (L * 0.45) - perpSin * (W * 0.5);

  let str = `fill "${fillCol}" `;
  if (strokeCol) str += `stroke "${strokeCol}" stroke-width 1 `;
  else str += `stroke none `;
  str += `path "M ${cx.toFixed(1)},${cy.toFixed(1)} Q ${ctrl1X.toFixed(1)},${ctrl1Y.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)} Q ${ctrl2X.toFixed(1)},${ctrl2Y.toFixed(1)} ${cx.toFixed(1)},${cy.toFixed(1)} Z"`;
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
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

console.log('Regenerating Status Effect Loops (V2: Painted Organic Matter)...');

// 1. STATUS BURN LOOP (Rising dancing flame tongues & drifting sparks)
console.log('Building status-burn-loop...');
buildStatusAtlas('status-burn-loop', (f, framePath) => {
  const C = 64;
  const draws = [];
  const t = (f * Math.PI * 2) / 16;

  // 3 distinct dancing flame tongues rising from bottom
  const tongues = [
    { x0: 54, h: 36, phase: 0, w: 14 },
    { x0: 64, h: 46, phase: 1.8, w: 18 },
    { x0: 74, h: 34, phase: 3.5, w: 14 }
  ];

  for (const tg of tongues) {
    const sway = Math.sin(t + tg.phase) * 6;
    const tipY = 85 - tg.h + Math.cos(t * 2 + tg.phase) * 5;
    const tipX = tg.x0 + sway;

    // Outer fire tongue
    draws.push(drawPetal(tg.x0, 85, 85 - tipY, tg.w, -Math.PI / 2 + (sway * 0.05), 'rgba(235, 75, 15, 0.75)', 'rgba(180, 20, 5, 0.6)'));
    // Inner hot yellow tongue
    draws.push(drawPetal(tg.x0, 82, (85 - tipY) * 0.65, tg.w * 0.55, -Math.PI / 2 + (sway * 0.05), 'rgba(255, 215, 60, 0.9)', 'rgba(255, 150, 20, 0.7)'));
  }

  // Incandescent white base
  draws.push(drawBlob(64, 82, 10, 5, f, 'rgba(255, 255, 230, 0.95)'));

  // Sizzling sparks floating upward
  for (let s = 0; s < 5; s++) {
    const st = (t + s * 1.3) % (Math.PI * 2);
    const sx = 64 + Math.sin(st * 2 + s) * 16;
    const sy = 75 - (st / (Math.PI * 2)) * 45;
    const a = (1 - (75 - sy) / 45).toFixed(2);
    draws.push(`fill "rgba(255, 230, 140, ${a})" stroke none circle ${sx.toFixed(1)},${sy.toFixed(1)} ${(sx + 1.5).toFixed(1)},${sy.toFixed(1)}`);
  }

  run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x0.8 "${framePath}"`);
});

// 2. STATUS POISON LOOP (Wobbling toxic bubbles & virulent vapors)
console.log('Building status-poison-loop...');
buildStatusAtlas('status-poison-loop', (f, framePath) => {
  const C = 64;
  const draws = [];
  const t = (f * Math.PI * 2) / 16;

  // Swirling virulent vapor cloud
  const cloudR = 26 + Math.sin(t) * 4;
  draws.push(drawBlob(C, C + 4, cloudR, 6, f * 2, 'rgba(40, 160, 65, 0.45)'));
  draws.push(drawBlob(C, C + 4, cloudR * 0.65, 5, f * 3, 'rgba(140, 225, 50, 0.6)'));

  // 4 rising wobbling toxic bubbles
  const bubbles = [
    { x: 50, phase: 0, r: 6 },
    { x: 62, phase: 1.5, r: 8 },
    { x: 74, phase: 3.1, r: 5 },
    { x: 58, phase: 4.6, r: 7 }
  ];

  for (const b of bubbles) {
    const bt = (t + b.phase) % (Math.PI * 2);
    const by = 82 - (bt / (Math.PI * 2)) * 40;
    const bx = b.x + Math.sin(bt * 3) * 4;
    const ba = (1 - (82 - by) / 45).toFixed(2);

    // Bubble rim
    draws.push(`stroke "rgba(180, 255, 100, ${ba})" stroke-width 1.5 fill "rgba(60, 180, 70, ${(ba * 0.35).toFixed(2)})" circle ${bx.toFixed(1)},${by.toFixed(1)} ${(bx + b.r).toFixed(1)},${by.toFixed(1)}`);
    // Glint highlight
    draws.push(`fill "rgba(255, 255, 240, ${ba})" stroke none circle ${(bx - b.r * 0.3).toFixed(1)},${(by - b.r * 0.3).toFixed(1)} ${(bx - b.r * 0.3 + 1.2).toFixed(1)},${(by - b.r * 0.3).toFixed(1)}`);
  }

  run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x0.8 "${framePath}"`);
});

// 3. STATUS SLOW LOOP (Frost crystallization tendrils & falling ice spicules)
console.log('Building status-slow-loop...');
buildStatusAtlas('status-slow-loop', (f, framePath) => {
  const C = 64;
  const draws = [];
  const t = (f * Math.PI * 2) / 16;

  // Frost mist pool
  draws.push(drawBlob(C, C + 10, 25 + Math.sin(t) * 3, 6, f, 'rgba(50, 120, 210, 0.4)'));

  // 4 sharp crystalline frost icicle branches pointing downward
  const branches = [
    { x: 44, len: 24, phase: 0 },
    { x: 56, len: 34, phase: 1.5 },
    { x: 68, len: 32, phase: 3.0 },
    { x: 80, len: 22, phase: 4.5 }
  ];

  for (const br of branches) {
    const pulse = 0.8 + 0.2 * Math.sin(t + br.phase);
    const by = 48 + br.len * pulse;

    // Jagged icicle spine
    draws.push(`stroke "rgba(190, 235, 255, 0.9)" stroke-width 2 fill none line ${br.x},48 ${br.x + 2},${by - 8} line ${br.x + 2},${by - 8} ${br.x},${by}`);
    // Pale frost core
    draws.push(`stroke "white" stroke-width 1 fill none line ${br.x},48 ${br.x},${by - 5}`);
  }

  // Drifting ice crystals
  for (let c = 0; c < 5; c++) {
    const ct = (t + c * 1.2) % (Math.PI * 2);
    const cy = 48 + (ct / (Math.PI * 2)) * 38;
    const cx = 45 + c * 9 + Math.sin(ct * 2) * 3;
    const ca = (1 - (cy - 48) / 38).toFixed(2);
    draws.push(`fill "rgba(220, 245, 255, ${ca})" stroke none polygon ${cx},${cy - 2.5} ${cx + 2.5},${cy} ${cx},${cy + 2.5} ${cx - 2.5},${cy}`);
  }

  run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x0.8 "${framePath}"`);
});

// 4. STATUS STUN LOOP (Swirling painted dizziness spiral & dizzy stars)
console.log('Building status-stun-loop...');
buildStatusAtlas('status-stun-loop', (f, framePath) => {
  const C = 64;
  const draws = [];
  const t = (f * Math.PI * 2) / 16;

  // 3 painted dizzy stars / swirls orbiting in a tilted 3D oval
  for (let s = 0; s < 3; s++) {
    const ang = t + (s * Math.PI * 2) / 3;
    const rx = 28;
    const ry = 12; // tilted perspective
    const sx = C + Math.cos(ang) * rx;
    const sy = 52 + Math.sin(ang) * ry;

    // Scale by depth (front larger, back smaller)
    const depth = (Math.sin(ang) + 1) / 2; // 0 to 1
    const sz = 4.5 + depth * 3.5;
    const alpha = (0.6 + depth * 0.4).toFixed(2);

    // 4-pointed painted star with curled tips
    draws.push(`fill "rgba(255, 230, 80, ${alpha})" stroke "rgba(230, 140, 20, ${alpha})" stroke-width 1 polygon ${sx},${sy - sz * 1.4} ${sx + sz * 0.4},${sy - sz * 0.4} ${sx + sz * 1.4},${sy} ${sx + sz * 0.4},${sy + sz * 0.4} ${sx},${sy + sz * 1.4} ${sx - sz * 0.4},${sy + sz * 0.4} ${sx - sz * 1.4},${sy} ${sx - sz * 0.4},${sy - sz * 0.4}`);
    // White spark highlight
    draws.push(`fill "white" stroke none circle ${sx.toFixed(1)},${sy.toFixed(1)} ${(sx + 1.5).toFixed(1)},${sy.toFixed(1)}`);
  }

  // Faint orbital ellipse streak
  draws.push(`stroke "rgba(255, 215, 60, 0.25)" stroke-width 1.5 fill none ellipse ${C},52 28,12 0,360`);

  run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x0.8 "${framePath}"`);
});

console.log('All 4 status effect loops regenerated.');
