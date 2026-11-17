#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AGV/jobs/impacts_alt';
const manifestPath = path.join(vfxDir, 'manifest.json');

if (!fs.existsSync(vfxDir)) fs.mkdirSync(vfxDir, { recursive: true });
if (!fs.existsSync(workBase)) fs.mkdirSync(workBase, { recursive: true });

function run(cmd) {
  execSync(cmd, { stdio: 'pipe' });
}

function toWebP(pngIn, webpOut, q = 82) {
  run(`cwebp -q ${q} -alpha_q 90 "${pngIn}" -o "${webpOut}"`);
}

function buildAtlas(name, renderFrame) {
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

console.log('Generating Hero Impact Variants (R1: mochi, soot, clover, panko alt)...');

// 1. MOCHI IMPACT ALT (Cherry Blossom Thread Slice)
console.log('Building mochi-impact-alt...');
buildAtlas('mochi-impact-alt', (f, framePath) => {
  const C = 128;
  const draws = [];

  if (f <= 2) {
    const r = 18 + f * 20;
    draws.push(drawBlob(C, C, r * 0.6, 5, f * 2, 'rgba(255, 255, 255, 0.98)'));
    draws.push(drawBlob(C, C, r * 1.1, 6, f * 3, 'rgba(255, 220, 235, 0.85)'));
    // Diagonal needle slash glint
    draws.push(`stroke "white" stroke-width 3.5 fill none line ${C - 50},${C + 35} ${C + 50},${C - 35}`);
  } else if (f <= 8) {
    const expand = (f - 2) / 6;
    const alpha = (1 - expand * 0.3).toFixed(2);
    const distBase = 25 + expand * 70;

    // Fading core
    draws.push(drawBlob(C, C, 18 * (1 - expand * 0.6), 5, f, `rgba(255, 255, 255, ${alpha})`));

    // Curved thread slash arc
    const arcLen = 60 + expand * 50;
    const ang = -0.6;
    const p1x = C - Math.cos(ang) * arcLen;
    const p1y = C + Math.sin(ang) * arcLen;
    const p2x = C + Math.cos(ang) * arcLen;
    const p2y = C - Math.sin(ang) * arcLen;
    const cpx = C + 20 * Math.sin(expand * Math.PI);
    const cpy = C - 15 * Math.sin(expand * Math.PI);
    draws.push(`stroke "rgba(255, 235, 180, ${alpha})" stroke-width 3 fill none path "M ${p1x.toFixed(1)},${p1y.toFixed(1)} Q ${cpx.toFixed(1)},${cpy.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)}"`);

    // 10 flying cherry petals
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI * 2) / 10 + (i % 2 === 0 ? 0.3 : -0.3);
      const dist = distBase * (0.7 + (i % 3) * 0.25);
      const px = C + Math.cos(a) * dist;
      const py = C + Math.sin(a) * dist;
      draws.push(drawPetal(px, py, 12, 7, a + expand, `rgba(255, 150, 195, ${alpha})`, `rgba(255, 230, 240, ${alpha})`));
    }
  } else {
    const diss = (f - 8) / 7;
    const alpha = ((1 - diss) * 0.65).toFixed(2);
    const distBase = 85 + diss * 35;

    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8 + i * 0.4;
      const dist = distBase + (i % 2) * 10;
      const px = C + Math.cos(a) * dist;
      const py = C + Math.sin(a) * dist;
      draws.push(drawPetal(px, py, 9, 5, a + 1.2, `rgba(255, 130, 180, ${alpha})`));
    }
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${framePath}"`);
});

// 2. SOOT IMPACT ALT (Charred Robe Swirl & Fiery Curls)
console.log('Building soot-impact-alt...');
buildAtlas('soot-impact-alt', (f, framePath) => {
  const C = 128;
  const draws = [];

  if (f <= 2) {
    const r = 20 + f * 22;
    draws.push(drawBlob(C, C, r * 0.6, 5, f * 3, 'rgba(255, 255, 255, 0.98)'));
    draws.push(drawBlob(C, C, r * 1.1, 6, f * 4, 'rgba(255, 200, 70, 0.85)'));
    draws.push(drawBlob(C, C, r * 1.6, 7, f * 5, 'rgba(240, 70, 10, 0.5)'));
  } else if (f <= 8) {
    const expand = (f - 2) / 6;
    const alpha = (1 - expand * 0.3).toFixed(2);
    const distBase = 28 + expand * 75;

    // Fading fiery core
    draws.push(drawBlob(C, C, 18 * (1 - expand * 0.6), 5, f, `rgba(255, 245, 210, ${alpha})`));

    // Swirling burning cloth flames
    for (let t = 0; t < 5; t++) {
      const ta = (t * Math.PI * 2) / 5 + expand * 1.2;
      const fx = C + Math.cos(ta) * (distBase * 0.6);
      const fy = C + Math.sin(ta) * (distBase * 0.6);
      draws.push(drawPetal(fx, fy, 16, 9, ta + 1.4, `rgba(255, 140, 20, ${alpha})`, `rgba(255, 220, 90, ${alpha})`));
    }

    // 12 irregular ember sparks
    for (let e = 0; e < 12; e++) {
      const ea = (e * Math.PI * 2) / 12 + expand * 0.5;
      const ed = distBase * (0.8 + (e % 3) * 0.25);
      const ex = C + Math.cos(ea) * ed;
      const ey = C + Math.sin(ea) * ed;
      draws.push(drawFlake(ex, ey, 4.5, 5, e + f, `rgba(255, 220, 120, ${alpha})`, `rgba(200, 50, 10, ${alpha})`));
    }
  } else {
    const diss = (f - 8) / 7;
    const alpha = ((1 - diss) * 0.65).toFixed(2);
    const distBase = 95 + diss * 30;

    for (let e = 0; e < 10; e++) {
      const ea = (e * Math.PI * 2) / 10 + e * 0.4;
      const ex = C + Math.cos(ea) * distBase;
      const ey = C + Math.sin(ea) * distBase;
      draws.push(drawFlake(ex, ey, 3, 5, e * 3, `rgba(220, 90, 15, ${alpha})`));
    }
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${framePath}"`);
});

// 3. CLOVER IMPACT ALT (Herbal Tea Cascade & Dew Swirl)
console.log('Building clover-impact-alt...');
buildAtlas('clover-impact-alt', (f, framePath) => {
  const C = 128;
  const draws = [];

  if (f <= 2) {
    const r = 18 + f * 20;
    draws.push(drawBlob(C, C, r * 0.6, 5, f * 2, 'rgba(255, 255, 245, 0.98)'));
    draws.push(drawBlob(C, C, r * 1.1, 6, f * 3, 'rgba(170, 245, 185, 0.85)'));
  } else if (f <= 8) {
    const expand = (f - 2) / 6;
    const alpha = (1 - expand * 0.3).toFixed(2);
    const distBase = 25 + expand * 72;

    draws.push(drawBlob(C, C, 18 * (1 - expand * 0.6), 5, f, `rgba(255, 255, 255, ${alpha})`));

    // Splashing droplets
    for (let d = 0; d < 12; d++) {
      const da = (d * Math.PI * 2) / 12 + expand * 0.4;
      const dd = distBase * (0.7 + (d % 3) * 0.25);
      const dx = C + Math.cos(da) * dd;
      const dy = C + Math.sin(da) * dd;
      draws.push(drawPetal(dx, dy, 9, 5, da, `rgba(200, 255, 220, ${alpha})`, `rgba(60, 190, 95, ${alpha})`));
    }

    // 6 spinning clover leaflets
    for (let l = 0; l < 6; l++) {
      const la = (l * Math.PI * 2) / 6 + expand * 1.1;
      const ld = distBase * 0.6;
      const lx = C + Math.cos(la) * ld;
      const ly = C + Math.sin(la) * ld;
      draws.push(drawPetal(lx, ly, 14, 8, la + 1.2, `rgba(90, 220, 120, ${alpha})`, `rgba(35, 150, 60, ${alpha})`));
    }
  } else {
    const diss = (f - 8) / 7;
    const alpha = ((1 - diss) * 0.65).toFixed(2);
    const distBase = 90 + diss * 30;

    for (let l = 0; l < 6; l++) {
      const la = (l * Math.PI * 2) / 6 + l * 0.5;
      const lx = C + Math.cos(la) * distBase;
      const ly = C + Math.sin(la) * distBase;
      draws.push(drawPetal(lx, ly, 10, 6, la + 1.5, `rgba(70, 190, 100, ${alpha})`));
    }
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${framePath}"`);
});

// 4. PANKO IMPACT ALT (Toasted Crumb Blast & Melted Butter)
console.log('Building panko-impact-alt...');
buildAtlas('panko-impact-alt', (f, framePath) => {
  const C = 128;
  const draws = [];

  if (f <= 2) {
    const r = 20 + f * 22;
    draws.push(drawBlob(C, C, r * 0.6, 5, f * 2, 'rgba(255, 255, 235, 0.98)'));
    draws.push(drawBlob(C, C, r * 1.1, 6, f * 3, 'rgba(255, 215, 90, 0.85)'));
    draws.push(drawBlob(C, C, r * 1.6, 7, f * 5, 'rgba(215, 110, 15, 0.5)'));
  } else if (f <= 8) {
    const expand = (f - 2) / 6;
    const alpha = (1 - expand * 0.3).toFixed(2);
    const distBase = 28 + expand * 75;

    draws.push(drawBlob(C, C, 18 * (1 - expand * 0.6), 5, f, `rgba(255, 255, 240, ${alpha})`));

    // 16 irregular crispy bread crumbs
    for (let c = 0; c < 16; c++) {
      const ca = (c * Math.PI * 2) / 16 + expand * 0.4;
      const cd = distBase * (0.75 + (c % 4) * 0.2);
      const cx = C + Math.cos(ca) * cd;
      const cy = C + Math.sin(ca) * cd;
      draws.push(drawFlake(cx, cy, 4.5, 5, c + f, `rgba(250, 205, 95, ${alpha})`, `rgba(175, 80, 10, ${alpha})`));
    }

    // Melted butter droplets
    for (let b = 0; b < 8; b++) {
      const ba = (b * Math.PI * 2) / 8 + expand * 0.6;
      const bd = distBase * 0.5;
      const bx = C + Math.cos(ba) * bd;
      const by = C + Math.sin(ba) * bd;
      draws.push(drawPetal(bx, by, 8, 5, ba, `rgba(255, 240, 150, ${alpha})`, `rgba(215, 130, 20, ${alpha})`));
    }
  } else {
    const diss = (f - 8) / 7;
    const alpha = ((1 - diss) * 0.65).toFixed(2);
    const distBase = 95 + diss * 30;

    for (let c = 0; c < 10; c++) {
      const ca = (c * Math.PI * 2) / 10 + c * 0.4;
      const cx = C + Math.cos(ca) * distBase;
      const cy = C + Math.sin(ca) * distBase;
      draws.push(drawFlake(cx, cy, 3, 5, c * 3, `rgba(230, 160, 45, ${alpha})`));
    }
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${framePath}"`);
});

// Update manifest
console.log('Updating manifest.json with 4 hero impact alt entries...');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const newEntries = {
  'mochi-impact-alt': { file: 'mochi-impact-alt.webp', cols: 4, rows: 4, frameMs: 40, blend: 'add', anchor: 'target', sizePx: 256 },
  'soot-impact-alt': { file: 'soot-impact-alt.webp', cols: 4, rows: 4, frameMs: 40, blend: 'add', anchor: 'target', sizePx: 256 },
  'clover-impact-alt': { file: 'clover-impact-alt.webp', cols: 4, rows: 4, frameMs: 40, blend: 'add', anchor: 'target', sizePx: 256 },
  'panko-impact-alt': { file: 'panko-impact-alt.webp', cols: 4, rows: 4, frameMs: 40, blend: 'add', anchor: 'target', sizePx: 256 }
};
for (const [k, v] of Object.entries(newEntries)) manifest[k] = v;

const sortedManifest = {};
for (const k of Object.keys(manifest).sort()) sortedManifest[k] = manifest[k];
fs.writeFileSync(manifestPath, JSON.stringify(sortedManifest, null, 2) + '\n', 'utf8');

console.log('Hero impact variants (R1) generated successfully.');
