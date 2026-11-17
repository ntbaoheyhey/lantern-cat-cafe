#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AGV/jobs/crits_v2';
const compDir = '/Users/bao/th-v5-ag2/reports/v5/AGV/comp';
const battleBg = '/Users/bao/th-v5-ag2/work/v5/AGV/comp_base/wave1.png';
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
  toWebP(stitchedPng, outWebp, 82);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// Helper: draw an organic petal at (cx, cy) with length L, width W, oriented at angle ang
function drawPetal(cx, cy, L, W, ang, fillCol, strokeCol = null) {
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  const perpCos = -sin;
  const perpSin = cos;

  // Base at (cx, cy)
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

// Helper: draw irregular crumb / ember polygon flake at (cx, cy)
function drawFlake(cx, cy, radius, numPts, seed, fillCol, strokeCol = null) {
  const pts = [];
  for (let i = 0; i < numPts; i++) {
    const a = (i * Math.PI * 2) / numPts;
    // Pseudo-random jitter
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

// Helper: draw organic splash / cloud blob (multi-lobe smooth blob)
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

console.log('Generating Dedicated Hero Crit Burst Flipbooks with Organic Matter (V2)...');

// 1. MOCHI CRIT BURST (Strawberry Petal Detonation & Silk Thread Arcs)
console.log('Building mochi-crit-burst...');
buildCritAtlas('mochi-crit-burst', (f, framePath) => {
  const C = 128;
  const draws = [];

  if (f <= 2) {
    const r = 20 + f * 22;
    // Hot creamy mochi core pop
    draws.push(drawBlob(C, C, r * 0.6, 5, f * 2, 'rgba(255, 255, 255, 0.95)'));
    draws.push(drawBlob(C, C, r * 1.1, 6, f * 3, 'rgba(255, 220, 235, 0.8)'));
    draws.push(drawBlob(C, C, r * 1.6, 7, f * 5, 'rgba(255, 100, 160, 0.4)'));
    // Emerging cherry blossom petals
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI * 2) / 6 + f * 0.2;
      draws.push(drawPetal(C, C, r * 1.4, r * 0.6, ang, 'rgba(255, 240, 248, 0.9)', 'rgba(255, 120, 170, 0.7)'));
    }
  } else if (f <= 8) {
    const expand = (f - 2) / 6;
    const alpha = (1 - expand * 0.3).toFixed(2);
    const distBase = 28 + expand * 78;

    // Soft fading core
    draws.push(drawBlob(C, C, 22 * (1 - expand * 0.6), 5, f, `rgba(255, 255, 255, ${alpha})`));
    draws.push(drawBlob(C, C, 38 * (1 - expand * 0.5), 6, f * 2, `rgba(255, 180, 210, ${(alpha * 0.6).toFixed(2)})`));

    // 12 flying cherry blossom petals with tumbling angles
    for (let i = 0; i < 12; i++) {
      const baseAng = (i * Math.PI * 2) / 12;
      const speed = 0.8 + (i % 4) * 0.2;
      const dist = distBase * speed;
      const px = C + Math.cos(baseAng) * dist;
      const py = C + Math.sin(baseAng) * dist;
      const petalLen = 14 + (i % 3) * 4;
      const petalWid = 8 + (i % 2) * 3;
      const tumble = baseAng + expand * 1.5 + (i * 0.7);

      draws.push(drawPetal(px, py, petalLen, petalWid, tumble, `rgba(255, 160, 205, ${alpha})`, `rgba(255, 230, 245, ${alpha})`));
    }

    // Curved strawberry silk thread sparks
    for (let s = 0; s < 6; s++) {
      const a = (s * Math.PI * 2) / 6 + expand * 0.5;
      const p1x = C + Math.cos(a) * (distBase * 0.3);
      const p1y = C + Math.sin(a) * (distBase * 0.3);
      const cpx = C + Math.cos(a + 0.4) * (distBase * 0.85);
      const cpy = C + Math.sin(a + 0.4) * (distBase * 0.85);
      const p2x = C + Math.cos(a + 0.1) * (distBase * 1.15);
      const p2y = C + Math.sin(a + 0.1) * (distBase * 1.15);
      draws.push(`stroke "rgba(255, 230, 180, ${alpha})" stroke-width 2 fill none path "M ${p1x.toFixed(1)},${p1y.toFixed(1)} Q ${cpx.toFixed(1)},${cpy.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)}"`);
    }

    // Sugar powder motes
    for (let m = 0; m < 14; m++) {
      const ma = (m * Math.PI * 2) / 14 + m * 0.3;
      const md = distBase * (0.5 + (m % 3) * 0.3);
      const mx = C + Math.cos(ma) * md;
      const my = C + Math.sin(ma) * md;
      draws.push(drawFlake(mx, my, 2.5, 4, m + f, `rgba(255, 240, 250, ${alpha})`));
    }
  } else {
    const diss = (f - 8) / 7;
    const alpha = ((1 - diss) * 0.65).toFixed(2);
    const distBase = 100 + diss * 35;

    // Dispersing petals drifting outward
    for (let i = 0; i < 10; i++) {
      const baseAng = (i * Math.PI * 2) / 10 + i * 0.4;
      const dist = distBase + (i % 3) * 8;
      const px = C + Math.cos(baseAng) * dist;
      const py = C + Math.sin(baseAng) * dist;
      const tumble = baseAng + 1.2 + diss * 2.0;
      draws.push(drawPetal(px, py, 11, 6, tumble, `rgba(255, 140, 190, ${alpha})`, `rgba(255, 210, 235, ${alpha})`));
    }

    // Fading sugar dust
    for (let m = 0; m < 16; m++) {
      const ma = (m * Math.PI * 2) / 16 + m * 0.5;
      const md = 60 + diss * 60;
      const mx = C + Math.cos(ma) * md;
      const my = C + Math.sin(ma) * md;
      draws.push(drawFlake(mx, my, 2, 4, m * 2, `rgba(255, 200, 225, ${alpha})`));
    }
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${framePath}"`);
});

// 2. SOOT CRIT BURST (Charred Fire Eruption & Twisting Embers)
console.log('Building soot-crit-burst...');
buildCritAtlas('soot-crit-burst', (f, framePath) => {
  const C = 128;
  const draws = [];

  if (f <= 2) {
    const r = 22 + f * 24;
    // White-hot core pop
    draws.push(drawBlob(C, C, r * 0.55, 5, f * 3, 'rgba(255, 255, 255, 0.98)'));
    draws.push(drawBlob(C, C, r * 1.0, 6, f * 4, 'rgba(255, 210, 80, 0.85)'));
    draws.push(drawBlob(C, C, r * 1.5, 7, f * 6, 'rgba(255, 75, 10, 0.5)'));
    // Fire tongues
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI * 2) / 6 + f * 0.25;
      draws.push(drawPetal(C, C, r * 1.5, r * 0.5, ang, 'rgba(255, 230, 120, 0.9)', 'rgba(255, 90, 15, 0.8)'));
    }
  } else if (f <= 8) {
    const expand = (f - 2) / 6;
    const alpha = (1 - expand * 0.3).toFixed(2);
    const distBase = 30 + expand * 80;

    // Soft incandescent core
    draws.push(drawBlob(C, C, 20 * (1 - expand * 0.55), 5, f, `rgba(255, 255, 220, ${alpha})`));
    draws.push(drawBlob(C, C, 36 * (1 - expand * 0.45), 6, f * 2, `rgba(255, 120, 20, ${(alpha * 0.6).toFixed(2)})`));

    // 16 flying irregular burning cloth ember flakes
    for (let e = 0; e < 16; e++) {
      const a = (e * Math.PI * 2) / 16 + expand * 0.35;
      const speed = 0.75 + (e % 4) * 0.22;
      const dist = distBase * speed;
      const ex = C + Math.cos(a) * dist;
      const ey = C + Math.sin(a) * dist;
      const rFlake = 4 + (e % 3) * 2.5;

      const fillCol = e % 3 === 0 ? `rgba(255, 245, 180, ${alpha})` : (e % 2 === 0 ? `rgba(255, 140, 25, ${alpha})` : `rgba(230, 60, 10, ${alpha})`);
      const strokeCol = `rgba(180, 30, 5, ${alpha})`;
      draws.push(drawFlake(ex, ey, rFlake, 5, e + f, fillCol, strokeCol));
    }

    // Swirling burning thread embers
    for (let t = 0; t < 6; t++) {
      const ta = (t * Math.PI * 2) / 6 + expand * 0.6;
      const p1x = C + Math.cos(ta) * (distBase * 0.25);
      const p1y = C + Math.sin(ta) * (distBase * 0.25);
      const cpx = C + Math.cos(ta + 0.5) * (distBase * 0.8);
      const cpy = C + Math.sin(ta + 0.5) * (distBase * 0.8);
      const p2x = C + Math.cos(ta + 0.2) * (distBase * 1.15);
      const p2y = C + Math.sin(ta + 0.2) * (distBase * 1.15);
      draws.push(`stroke "rgba(255, 190, 50, ${alpha})" stroke-width 2.2 fill none path "M ${p1x.toFixed(1)},${p1y.toFixed(1)} Q ${cpx.toFixed(1)},${cpy.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)}"`);
    }
  } else {
    const diss = (f - 8) / 7;
    const alpha = ((1 - diss) * 0.65).toFixed(2);
    const distBase = 105 + diss * 35;

    // Fading ash flakes and smoke tendrils
    for (let e = 0; e < 12; e++) {
      const a = (e * Math.PI * 2) / 12 + e * 0.35;
      const dist = distBase + (e % 3) * 7;
      const ex = C + Math.cos(a) * dist;
      const ey = C + Math.sin(a) * dist;
      draws.push(drawFlake(ex, ey, 3, 5, e * 3, `rgba(255, 100, 20, ${alpha})`, `rgba(150, 40, 5, ${alpha})`));
    }

    // Thin smoke wisps
    for (let w = 0; w < 5; w++) {
      const wa = (w * Math.PI * 2) / 5 + diss * 0.8;
      const sx = C + Math.cos(wa) * (50 + diss * 40);
      const sy = C + Math.sin(wa) * (50 + diss * 40);
      draws.push(drawBlob(sx, sy, 18, 5, w * 4, `rgba(160, 100, 60, ${(alpha * 0.35).toFixed(2)})`));
    }
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${framePath}"`);
});

// 3. CLOVER CRIT BURST (Herbal Tea Droplet Pop & Spinning Leaflets)
console.log('Building clover-crit-burst...');
buildCritAtlas('clover-crit-burst', (f, framePath) => {
  const C = 128;
  const draws = [];

  if (f <= 2) {
    const r = 22 + f * 22;
    // Jade tea splash pop
    draws.push(drawBlob(C, C, r * 0.6, 5, f * 2, 'rgba(255, 255, 240, 0.95)'));
    draws.push(drawBlob(C, C, r * 1.1, 6, f * 3, 'rgba(160, 245, 180, 0.8)'));
    draws.push(drawBlob(C, C, r * 1.6, 7, f * 5, 'rgba(40, 190, 80, 0.4)'));
    // Emerging leaflets
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2 + f * 0.2;
      draws.push(drawPetal(C, C, r * 1.4, r * 0.65, ang, 'rgba(210, 255, 220, 0.9)', 'rgba(50, 180, 80, 0.7)'));
    }
  } else if (f <= 8) {
    const expand = (f - 2) / 6;
    const alpha = (1 - expand * 0.3).toFixed(2);
    const distBase = 28 + expand * 78;

    // Fading jade core
    draws.push(drawBlob(C, C, 22 * (1 - expand * 0.6), 5, f, `rgba(255, 255, 255, ${alpha})`));
    draws.push(drawBlob(C, C, 38 * (1 - expand * 0.5), 6, f * 2, `rgba(130, 235, 160, ${(alpha * 0.6).toFixed(2)})`));

    // 12 tumbling clover leaflets and tea leaves
    for (let i = 0; i < 12; i++) {
      const baseAng = (i * Math.PI * 2) / 12;
      const speed = 0.8 + (i % 4) * 0.2;
      const dist = distBase * speed;
      const px = C + Math.cos(baseAng) * dist;
      const py = C + Math.sin(baseAng) * dist;
      const leafLen = 15 + (i % 3) * 4;
      const leafWid = 9 + (i % 2) * 3;
      const tumble = baseAng + expand * 1.6 + (i * 0.8);

      const fillCol = i % 2 === 0 ? `rgba(100, 230, 130, ${alpha})` : `rgba(160, 245, 175, ${alpha})`;
      const strokeCol = `rgba(35, 160, 65, ${alpha})`;
      draws.push(drawPetal(px, py, leafLen, leafWid, tumble, fillCol, strokeCol));
    }

    // Splashing herbal dew droplets (teardrops along direction)
    for (let d = 0; d < 14; d++) {
      const da = (d * Math.PI * 2) / 14 + d * 0.35;
      const dd = distBase * (0.55 + (d % 3) * 0.3);
      const dx = C + Math.cos(da) * dd;
      const dy = C + Math.sin(da) * dd;
      draws.push(drawPetal(dx, dy, 7, 4, da, `rgba(220, 255, 235, ${alpha})`, `rgba(70, 200, 110, ${alpha})`));
    }
  } else {
    const diss = (f - 8) / 7;
    const alpha = ((1 - diss) * 0.65).toFixed(2);
    const distBase = 100 + diss * 35;

    // Drifting leaflets
    for (let i = 0; i < 8; i++) {
      const baseAng = (i * Math.PI * 2) / 8 + i * 0.45;
      const dist = distBase + (i % 3) * 8;
      const px = C + Math.cos(baseAng) * dist;
      const py = C + Math.sin(baseAng) * dist;
      const tumble = baseAng + 1.5 + diss * 2.2;
      draws.push(drawPetal(px, py, 11, 7, tumble, `rgba(80, 210, 110, ${alpha})`, `rgba(40, 150, 70, ${alpha})`));
    }

    // Herbal mist puffs
    for (let m = 0; m < 5; m++) {
      const ma = (m * Math.PI * 2) / 5 + diss * 0.5;
      const mx = C + Math.cos(ma) * (55 + diss * 35);
      const my = C + Math.sin(ma) * (55 + diss * 35);
      draws.push(drawBlob(mx, my, 22, 5, m * 3, `rgba(80, 200, 120, ${(alpha * 0.3).toFixed(2)})`));
    }
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${framePath}"`);
});

// 4. PANKO CRIT BURST (Molten Butter Detonation & Crispy Toasted Crumbs)
console.log('Building panko-crit-burst...');
buildCritAtlas('panko-crit-burst', (f, framePath) => {
  const C = 128;
  const draws = [];

  if (f <= 2) {
    const r = 24 + f * 24;
    // Sizzling butter core pop
    draws.push(drawBlob(C, C, r * 0.6, 5, f * 2, 'rgba(255, 255, 230, 0.98)'));
    draws.push(drawBlob(C, C, r * 1.1, 6, f * 3, 'rgba(255, 225, 100, 0.85)'));
    draws.push(drawBlob(C, C, r * 1.6, 7, f * 5, 'rgba(220, 120, 20, 0.5)'));
    // Fracturing crust lines
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI * 2) / 6 + f * 0.2;
      const tx = C + Math.cos(ang) * (r * 1.3);
      const ty = C + Math.sin(ang) * (r * 1.3);
      draws.push(`stroke "rgba(255, 245, 190, 0.9)" stroke-width 2.5 fill none line ${C},${C} ${tx.toFixed(1)},${ty.toFixed(1)}`);
    }
  } else if (f <= 8) {
    const expand = (f - 2) / 6;
    const alpha = (1 - expand * 0.3).toFixed(2);
    const distBase = 30 + expand * 80;

    // Golden butter core fading
    draws.push(drawBlob(C, C, 22 * (1 - expand * 0.6), 5, f, `rgba(255, 255, 240, ${alpha})`));
    draws.push(drawBlob(C, C, 38 * (1 - expand * 0.5), 6, f * 2, `rgba(255, 210, 80, ${(alpha * 0.6).toFixed(2)})`));

    // 20 flying irregular crispy toast crumbs
    for (let c = 0; c < 20; c++) {
      const a = (c * Math.PI * 2) / 20 + expand * 0.35;
      const speed = 0.75 + (c % 4) * 0.22;
      const dist = distBase * speed;
      const cx = C + Math.cos(a) * dist;
      const cy = C + Math.sin(a) * dist;
      const rCrumb = 4.5 + (c % 3) * 2.5;

      const fillCol = c % 2 === 0 ? `rgba(255, 230, 130, ${alpha})` : `rgba(245, 185, 60, ${alpha})`;
      const strokeCol = `rgba(180, 85, 10, ${alpha})`;
      draws.push(drawFlake(cx, cy, rCrumb, 5, c + f, fillCol, strokeCol));
    }

    // Golden melted butter droplets
    for (let b = 0; b < 10; b++) {
      const ba = (b * Math.PI * 2) / 10 + b * 0.4;
      const bd = distBase * (0.6 + (b % 3) * 0.3);
      const bx = C + Math.cos(ba) * bd;
      const by = C + Math.sin(ba) * bd;
      draws.push(drawPetal(bx, by, 8, 5, ba, `rgba(255, 245, 170, ${alpha})`, `rgba(225, 140, 20, ${alpha})`));
    }

    // Warm flour puffs
    for (let p = 0; p < 6; p++) {
      const pa = (p * Math.PI * 2) / 6 + expand * 0.4;
      const pd = distBase * 0.45;
      const px = C + Math.cos(pa) * pd;
      const py = C + Math.sin(pa) * pd;
      draws.push(drawBlob(px, py, 14, 4, p + f, `rgba(255, 235, 190, ${(alpha * 0.4).toFixed(2)})`));
    }
  } else {
    const diss = (f - 8) / 7;
    const alpha = ((1 - diss) * 0.65).toFixed(2);
    const distBase = 105 + diss * 35;

    // Drifting crumb fragments
    for (let c = 0; c < 14; c++) {
      const a = (c * Math.PI * 2) / 14 + c * 0.35;
      const dist = distBase + (c % 3) * 7;
      const cx = C + Math.cos(a) * dist;
      const cy = C + Math.sin(a) * dist;
      draws.push(drawFlake(cx, cy, 3.5, 5, c * 3, `rgba(240, 170, 50, ${alpha})`, `rgba(160, 70, 10, ${alpha})`));
    }

    // Expanding flour cloud
    for (let p = 0; p < 5; p++) {
      const pa = (p * Math.PI * 2) / 5 + diss * 0.6;
      const px = C + Math.cos(pa) * (55 + diss * 40);
      const py = C + Math.sin(pa) * (55 + diss * 40);
      draws.push(drawBlob(px, py, 22, 5, p * 4, `rgba(240, 210, 160, ${(alpha * 0.3).toFixed(2)})`));
    }
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${framePath}"`);
});

console.log('All 4 organic crit bursts generated.');
