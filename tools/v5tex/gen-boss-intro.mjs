#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AGV/jobs/boss_intro';
const manifestPath = path.join(vfxDir, 'manifest.json');

if (!fs.existsSync(vfxDir)) fs.mkdirSync(vfxDir, { recursive: true });
if (!fs.existsSync(workBase)) fs.mkdirSync(workBase, { recursive: true });

function run(cmd) {
  execSync(cmd, { stdio: 'pipe' });
}

function toWebP(pngIn, webpOut, q = 82) {
  run(`cwebp -q ${q} -alpha_q 90 "${pngIn}" -o "${webpOut}"`);
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

console.log('Generating Boss Intro Presentation Textures (R8: Nameplate Frame & Entrance Dust)...');

// 1. BOSS INTRO NAMEPLATE FRAME (512x256 single - Ornate antique golden frame with crimson braided stitching)
{
  console.log('Building boss-intro-nameplate-frame...');
  const outPng = path.join(workBase, 'boss_intro_nameplate.png');
  const outWebp = path.join(vfxDir, 'boss-intro-nameplate-frame.webp');
  const W = 512;
  const H = 256;
  const CX = 256;
  const CY = 128;
  const draws = [];

  const boxW = 440;
  const boxH = 140;
  const x1 = CX - boxW / 2;
  const y1 = CY - boxH / 2;
  const x2 = CX + boxW / 2;
  const y2 = CY + boxH / 2;

  // Outer golden-amber glow
  draws.push(`stroke "rgba(255, 200, 70, 0.45)" stroke-width 8 fill none roundrectangle ${x1 - 4},${y1 - 4} ${x2 + 4},${y2 + 4} 16,16`);

  // Main braided crimson silk cord frame
  draws.push(`stroke "rgba(220, 35, 55, 0.85)" stroke-width 4.5 fill "rgba(40, 10, 20, 0.35)" roundrectangle ${x1},${y1} ${x2},${y2} 12,12`);

  // Inner antique gold filigree rim
  draws.push(`stroke "rgba(255, 225, 120, 0.9)" stroke-width 2 fill none roundrectangle ${x1 + 6},${y1 + 6} ${x2 - 6},${y2 - 6} 8,8`);

  // 4 ornate needle-stitched corner accents
  const corners = [
    { x: x1, y: y1 },
    { x: x2, y: y1 },
    { x: x1, y: y2 },
    { x: x2, y: y2 }
  ];

  for (const c of corners) {
    draws.push(`fill "white" stroke "rgba(255, 215, 80, 0.9)" stroke-width 1.5 circle ${c.x},${c.y} ${c.x + 5},${c.y}`);
    draws.push(`stroke "rgba(255, 240, 180, 0.8)" stroke-width 2 line ${c.x - 8},${c.y} ${c.x + 8},${c.y} line ${c.x},${c.y - 8} ${c.x},${c.y + 8}`);
  }

  // Cross stitches along top and bottom edge
  for (let sx = x1 + 25; sx <= x2 - 25; sx += 30) {
    draws.push(`stroke "rgba(255, 245, 220, 0.8)" stroke-width 1.5 line ${sx - 3},${y1 - 3} ${sx + 3},${y1 + 3} line ${sx - 3},${y1 + 3} ${sx + 3},${y1 - 3}`);
    draws.push(`stroke "rgba(255, 245, 220, 0.8)" stroke-width 1.5 line ${sx - 3},${y2 - 3} ${sx + 3},${y2 + 3} line ${sx - 3},${y2 + 3} ${sx + 3},${y2 - 3}`);
  }

  run(`magick -size ${W}x${H} xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${outPng}"`);
  toWebP(outPng, outWebp, 82);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// 2. BOSS INTRO ENTRANCE DUST (4x4 256x256 flipbook - Heavy ground impact dust & tearing yarn fibers)
{
  console.log('Building boss-intro-entrance-dust flipbook...');
  const framesDir = path.join(workBase, 'dust_frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });
  const frameFiles = [];

  for (let f = 0; f < 16; f++) {
    const framePath = path.join(framesDir, `frame_${String(f).padStart(2, '0')}.png`);
    const C = 128;
    const draws = [];

    if (f <= 2) {
      // Impact compression flash at bottom ground level
      const r = 24 + f * 24;
      draws.push(drawBlob(C, 185, r * 0.7, 5, f, 'rgba(255, 255, 240, 0.95)'));
      draws.push(drawBlob(C, 185, r * 1.2, 6, f * 2, 'rgba(230, 160, 90, 0.8)'));
    } else if (f <= 8) {
      const expand = (f - 2) / 6;
      const alpha = (1 - expand * 0.3).toFixed(2);
      const distBase = 35 + expand * 75;

      // Heavy billowing dust clouds expanding laterally to both sides
      for (let side of [-1, 1]) {
        const cx = C + side * distBase * 0.85;
        const cy = 180 - expand * 35;
        const cloudR = 24 + expand * 26;
        draws.push(drawBlob(cx, cy, cloudR, 6, f + side, `rgba(220, 190, 150, ${(alpha * 0.55).toFixed(2)})`));
        draws.push(drawBlob(cx, cy, cloudR * 0.6, 5, f * 2, `rgba(255, 235, 195, ${alpha})`));
      }

      // Flying yarn fibers & stone debris
      for (let p = 0; p < 14; p++) {
        const ang = (p * Math.PI) / 14 + (p % 2 === 0 ? 0.2 : -0.2);
        const pd = distBase * (0.8 + (p % 3) * 0.25);
        const px = C + Math.cos(ang + Math.PI) * pd;
        const py = 180 - Math.sin(ang) * pd;
        draws.push(drawFlake(px, py, 4, 5, p + f, `rgba(210, 60, 70, ${alpha})`, `rgba(255, 220, 180, ${alpha})`));
      }
    } else {
      const diss = (f - 8) / 7;
      const alpha = ((1 - diss) * 0.6).toFixed(2);
      const distBase = 100 + diss * 30;

      for (let side of [-1, 1]) {
        const cx = C + side * distBase;
        const cy = 145 - diss * 25;
        draws.push(drawBlob(cx, cy, 32, 5, f + side, `rgba(180, 150, 120, ${(alpha * 0.35).toFixed(2)})`));
      }

      for (let p = 0; p < 10; p++) {
        const ang = (p * Math.PI) / 10;
        const px = C + Math.cos(ang + Math.PI) * distBase;
        const py = 160 - Math.sin(ang) * (distBase * 0.7);
        draws.push(drawFlake(px, py, 3, 5, p * 3, `rgba(180, 70, 70, ${alpha})`));
      }
    }

    run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${framePath}"`);
    frameFiles.push(`"${framePath}"`);
  }

  const stitchedPng = path.join(workBase, 'boss_entrance_dust_stitched.png');
  run(`magick montage ${frameFiles.join(' ')} -tile 4x4 -geometry 256x256+0+0 -background black "${stitchedPng}"`);

  const outWebp = path.join(vfxDir, 'boss-intro-entrance-dust.webp');
  toWebP(stitchedPng, outWebp, 78);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// Update manifest
console.log('Updating manifest.json with 2 boss intro entries...');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const newEntries = {
  'boss-intro-nameplate-frame': { file: 'boss-intro-nameplate-frame.webp', cols: 1, rows: 1, frameMs: 50, blend: 'add', anchor: 'target', sizePx: 512 },
  'boss-intro-entrance-dust': { file: 'boss-intro-entrance-dust.webp', cols: 4, rows: 4, frameMs: 50, blend: 'add', anchor: 'ground', sizePx: 256 }
};
for (const [k, v] of Object.entries(newEntries)) manifest[k] = v;

const sortedManifest = {};
for (const k of Object.keys(manifest).sort()) sortedManifest[k] = manifest[k];
fs.writeFileSync(manifestPath, JSON.stringify(sortedManifest, null, 2) + '\n', 'utf8');

console.log('Boss intro textures (R8) generated successfully.');
