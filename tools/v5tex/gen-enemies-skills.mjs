#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AGV/jobs/enemy_skills';
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

console.log('Generating Enemy Skills (R2) and Victory Burst (R3)...');

// 1. NEEDLE MOTH RAIN (Silver-cyan needle barrage)
console.log('Building enemy-needle-moth-rain...');
buildAtlas('enemy-needle-moth-rain', (f, framePath) => {
  const C = 128;
  const draws = [];
  const t = f / 15;
  const alpha = f <= 3 ? (f / 3).toFixed(2) : (1 - (f - 3) / 12).toFixed(2);

  // Slanted needle rain (falling from top-right to bottom-left)
  const needles = [
    { x0: 200, y0: 30, len: 45, ang: 2.3 },
    { x0: 160, y0: 15, len: 55, ang: 2.25 },
    { x0: 220, y0: 80, len: 40, ang: 2.35 },
    { x0: 130, y0: 50, len: 50, ang: 2.2 },
    { x0: 180, y0: 110, len: 42, ang: 2.3 }
  ];

  for (let i = 0; i < needles.length; i++) {
    const n = needles[i];
    const travel = t * 140;
    const nx = n.x0 - travel * 0.7;
    const ny = n.y0 + travel * 0.7;

    const x2 = nx + Math.cos(n.ang) * n.len;
    const y2 = ny + Math.sin(n.ang) * n.len;

    // Glowing needle shaft
    draws.push(`stroke "rgba(220, 240, 255, ${alpha})" stroke-width 2.5 fill none line ${nx.toFixed(1)},${ny.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`);
    // Trailing thread line
    const tx = nx - Math.cos(n.ang) * (n.len * 0.8);
    const ty = ny - Math.sin(n.ang) * (n.len * 0.8);
    draws.push(`stroke "rgba(134, 199, 221, ${(alpha * 0.6).toFixed(2)})" stroke-width 1.2 fill none line ${nx.toFixed(1)},${ny.toFixed(1)} ${tx.toFixed(1)},${ty.toFixed(1)}`);
    // Point glint
    draws.push(`fill "white" stroke none circle ${x2.toFixed(1)},${y2.toFixed(1)} ${(x2 + 2.5).toFixed(1)},${y2.toFixed(1)}`);
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x0.8 "${framePath}"`);
});

// 2. BINDING THREAD KNOT (Tightening yarn knot with cross-stitches)
console.log('Building enemy-binding-thread-knot...');
buildAtlas('enemy-binding-thread-knot', (f, framePath) => {
  const C = 128;
  const draws = [];
  const expand = f / 15;
  const alpha = f <= 4 ? (f / 4).toFixed(2) : (1 - (f - 4) / 11).toFixed(2);

  // Contracting thread loops (starts wide, contracts to center, snaps)
  const radius = f <= 8 ? (85 - f * 6) : (37 + (f - 8) * 8);

  // 3 interlocking elliptical loops
  for (let l = 0; l < 3; l++) {
    const rot = l * 60 + f * 5;
    const rX = radius;
    const rY = radius * 0.6;
    draws.push(`stroke "rgba(186, 155, 209, ${alpha})" stroke-width 3 fill none ellipse ${C},${C} ${rX.toFixed(1)},${rY.toFixed(1)} 0,360`);
    draws.push(`stroke "rgba(236, 206, 231, ${(alpha * 0.8).toFixed(2)})" stroke-width 1.5 fill none ellipse ${C},${C} ${(rX * 0.85).toFixed(1)},${(rY * 0.85).toFixed(1)} 0,360`);
  }

  // Cross-stitches along perimeter
  for (let s = 0; s < 6; s++) {
    const sa = (s * Math.PI) / 3 + f * 0.1;
    const sx = C + Math.cos(sa) * radius;
    const sy = C + Math.sin(sa) * (radius * 0.6);
    draws.push(`stroke "rgba(255, 240, 250, ${alpha})" stroke-width 2 line ${sx - 4},${sy - 4} ${sx + 4},${sy + 4} line ${sx - 4},${sy + 4} ${sx + 4},${sy - 4}`);
  }

  // Core snap flash on frame 7-9
  if (f >= 6 && f <= 10) {
    const coreA = (1 - Math.abs(f - 8) / 3).toFixed(2);
    draws.push(drawBlob(C, C, 22, 6, f, `rgba(255, 255, 255, ${coreA})`));
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${framePath}"`);
});

// 3. TEACUP HEALER REFILL (Pale jade restorative fountain & tea droplets)
console.log('Building enemy-teacup-healer-refill...');
buildAtlas('enemy-teacup-healer-refill', (f, framePath) => {
  const C = 128;
  const draws = [];
  const expand = f / 15;
  const alpha = f <= 3 ? (f / 3).toFixed(2) : (1 - (f - 3) / 12).toFixed(2);

  // Rising steam fountain from bottom
  const baseY = 210 - expand * 100;
  draws.push(drawBlob(C, baseY, 28 + expand * 20, 5, f, `rgba(169, 217, 183, ${(alpha * 0.6).toFixed(2)})`));
  draws.push(drawBlob(C, baseY, 16 + expand * 10, 6, f * 2, `rgba(255, 241, 204, ${alpha})`));

  // Radiating restorative droplets
  for (let d = 0; d < 8; d++) {
    const da = (d * Math.PI * 2) / 8 + expand * 0.8;
    const dist = 20 + expand * 65;
    const dx = C + Math.cos(da) * dist;
    const dy = baseY - 20 + Math.sin(da) * (dist * 0.6);
    draws.push(drawPetal(dx, dy, 8, 5, da - Math.PI / 2, `rgba(220, 255, 235, ${alpha})`, `rgba(120, 210, 150, ${alpha})`));
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.2 "${framePath}"`);
});

// 4. KETTLE KNIGHT JAB (High-pressure boiling steam plume)
console.log('Building enemy-kettle-knight-jab...');
buildAtlas('enemy-kettle-knight-jab', (f, framePath) => {
  const C = 128;
  const draws = [];
  const expand = f / 15;
  const alpha = f <= 3 ? (f / 3).toFixed(2) : (1 - (f - 3) / 12).toFixed(2);

  // Forward steam plume (bursting to the right)
  const plumeLen = 30 + expand * 110;
  const plumeX = 60 + plumeLen * 0.5;
  const plumeY = C;

  draws.push(drawBlob(plumeX, plumeY, 20 + expand * 25, 6, f * 3, `rgba(177, 199, 220, ${(alpha * 0.5).toFixed(2)})`));
  draws.push(drawBlob(plumeX - 15, plumeY, 14 + expand * 12, 5, f * 2, `rgba(255, 230, 161, ${alpha})`));
  draws.push(drawBlob(50, C, 16, 5, f, `rgba(255, 255, 255, ${alpha})`));

  // Copper boiling sparks
  for (let s = 0; s < 10; s++) {
    const sa = (s * Math.PI * 2) / 10 + expand * 0.4;
    const sx = plumeX + Math.cos(sa) * (20 + expand * 35);
    const sy = plumeY + Math.sin(sa) * (15 + expand * 25);
    draws.push(`fill "rgba(255, 210, 100, ${alpha})" stroke none circle ${sx.toFixed(1)},${sy.toFixed(1)} ${(sx + 2.5).toFixed(1)},${sy.toFixed(1)}`);
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${framePath}"`);
});

// 5. VICTORY BURST (R3: Triumphant golden laurel wreath & painted confetti)
console.log('Building victory-burst...');
buildAtlas('victory-burst', (f, framePath) => {
  const C = 128;
  const draws = [];

  if (f <= 2) {
    const r = 24 + f * 24;
    draws.push(drawBlob(C, C, r * 0.6, 6, f, 'rgba(255, 255, 240, 0.98)'));
    draws.push(drawBlob(C, C, r * 1.1, 7, f * 2, 'rgba(255, 220, 100, 0.85)'));
    // Golden flash gleams
    draws.push(`stroke "white" stroke-width 4 line ${C - 60},${C} ${C + 60},${C} line ${C},${C - 60} ${C},${C + 60}`);
  } else if (f <= 8) {
    const expand = (f - 2) / 6;
    const alpha = (1 - expand * 0.3).toFixed(2);
    const distBase = 30 + expand * 78;

    draws.push(drawBlob(C, C, 22 * (1 - expand * 0.6), 5, f, `rgba(255, 255, 220, ${alpha})`));

    // Golden laurel leaves (radiating ring)
    for (let l = 0; l < 12; l++) {
      const la = (l * Math.PI * 2) / 12;
      const lx = C + Math.cos(la) * distBase;
      const ly = C + Math.sin(la) * distBase;
      draws.push(drawPetal(lx, ly, 14, 8, la + Math.PI / 2, `rgba(255, 225, 90, ${alpha})`, `rgba(230, 160, 20, ${alpha})`));
    }

    // Ribbon confetti (colored fluttering rectangular strips)
    const confColors = [
      `rgba(255, 80, 120, ${alpha})`,
      `rgba(80, 220, 140, ${alpha})`,
      `rgba(100, 180, 255, ${alpha})`,
      `rgba(255, 215, 60, ${alpha})`
    ];
    for (let c = 0; c < 16; c++) {
      const ca = (c * Math.PI * 2) / 16 + expand * 0.5;
      const cd = distBase * (0.6 + (c % 3) * 0.3);
      const cx = C + Math.cos(ca) * cd;
      const cy = C + Math.sin(ca) * cd;
      const col = confColors[c % 4];
      draws.push(`fill "${col}" stroke none polygon ${cx - 4},${cy - 2} ${cx + 4},${cy + 2} ${cx + 3},${cy + 6} ${cx - 5},${cy + 2}`);
    }
  } else {
    const diss = (f - 8) / 7;
    const alpha = ((1 - diss) * 0.65).toFixed(2);
    const distBase = 100 + diss * 35;

    for (let l = 0; l < 10; l++) {
      const la = (l * Math.PI * 2) / 10 + l * 0.3;
      const lx = C + Math.cos(la) * distBase;
      const ly = C + Math.sin(la) * distBase;
      draws.push(drawPetal(lx, ly, 10, 6, la + Math.PI / 2, `rgba(255, 210, 70, ${alpha})`));
    }

    for (let s = 0; s < 12; s++) {
      const sa = (s * Math.PI * 2) / 12 + s * 0.4;
      const sx = C + Math.cos(sa) * (distBase * 0.85);
      const sy = C + Math.sin(sa) * (distBase * 0.85);
      draws.push(`fill "rgba(255, 245, 180, ${alpha})" stroke none circle ${sx.toFixed(1)},${sy.toFixed(1)} ${(sx + 2).toFixed(1)},${sy.toFixed(1)}`);
    }
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${framePath}"`);
});

// Update manifest
console.log('Updating manifest.json with 5 enemy & victory entries...');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const newEntries = {
  'enemy-needle-moth-rain': { file: 'enemy-needle-moth-rain.webp', cols: 4, rows: 4, frameMs: 40, blend: 'add', anchor: 'target', sizePx: 256 },
  'enemy-binding-thread-knot': { file: 'enemy-binding-thread-knot.webp', cols: 4, rows: 4, frameMs: 45, blend: 'add', anchor: 'target', sizePx: 256 },
  'enemy-teacup-healer-refill': { file: 'enemy-teacup-healer-refill.webp', cols: 4, rows: 4, frameMs: 50, blend: 'add', anchor: 'target', sizePx: 256 },
  'enemy-kettle-knight-jab': { file: 'enemy-kettle-knight-jab.webp', cols: 4, rows: 4, frameMs: 40, blend: 'add', anchor: 'target', sizePx: 256 },
  'victory-burst': { file: 'victory-burst.webp', cols: 4, rows: 4, frameMs: 45, blend: 'add', anchor: 'target', sizePx: 256 }
};
for (const [k, v] of Object.entries(newEntries)) manifest[k] = v;

const sortedManifest = {};
for (const k of Object.keys(manifest).sort()) sortedManifest[k] = manifest[k];
fs.writeFileSync(manifestPath, JSON.stringify(sortedManifest, null, 2) + '\n', 'utf8');

console.log('Enemy skills & victory burst generated successfully.');
