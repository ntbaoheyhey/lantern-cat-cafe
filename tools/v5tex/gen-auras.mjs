#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AGV/jobs/auras_v2';
const compDir = '/Users/bao/th-v5-ag2/work/v5/AGV/comp';
const repCompDir = '/Users/bao/th-v5-ag2/reports/v5/AGV/comp';
const battleBg = '/Users/bao/th-v5-ag2/work/v5/AGV/comp_base/wave1.png';
const manifestPath = path.join(vfxDir, 'manifest.json');

if (!fs.existsSync(vfxDir)) fs.mkdirSync(vfxDir, { recursive: true });
if (!fs.existsSync(workBase)) fs.mkdirSync(workBase, { recursive: true });
if (!fs.existsSync(compDir)) fs.mkdirSync(compDir, { recursive: true });

function run(cmd) {
  execSync(cmd, { stdio: 'pipe' });
}

function toWebP(pngIn, webpOut, q = 80) {
  run(`cwebp -q ${q} -alpha_q 90 "${pngIn}" -o "${webpOut}"`);
}

function compositeAtlasEffect(effectWebp, outCompJpg, posX = 480, posY = 380, frameW = 256, frameH = 256) {
  let samplePng = path.join(workBase, 'temp_sample.png');
  run(`magick "${effectWebp}" -crop ${frameW}x${frameH}+${frameW}+${frameH} +repage "${samplePng}"`);
  const left = Math.round(posX - frameW / 2);
  const top = Math.round(posY - frameH / 2);
  run(`magick "${battleBg}" "${samplePng}" -geometry +${left}+${top} -compose plus -composite -resize 960x540 -quality 80 "${outCompJpg}"`);
}

function drawWavyRibbon(cx, cy, rInner, rOuter, startAng, sweepAng, waves, waveAmp, fillCol, strokeCol = null) {
  const pts = [];
  const steps = 24;
  // Outer edge
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ang = startAng + t * sweepAng;
    const w = Math.sin(t * waves * Math.PI) * waveAmp;
    const r = rOuter + w;
    const px = cx + Math.cos(ang) * r;
    const py = cy + Math.sin(ang) * (r * 0.82); // elliptical perspective
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  // Inner edge
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    const ang = startAng + t * sweepAng;
    const w = Math.sin(t * waves * Math.PI) * (waveAmp * 0.6);
    const r = rInner + w;
    const px = cx + Math.cos(ang) * r;
    const py = cy + Math.sin(ang) * (r * 0.82);
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  let str = `fill "${fillCol}" `;
  if (strokeCol) str += `stroke "${strokeCol}" stroke-width 1.5 `;
  else str += `stroke none `;
  str += `polygon ${pts.join(' ')}`;
  return str;
}

function drawLeaf(cx, cy, L, W, ang, fillCol, strokeCol = null) {
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  const perpCos = -sin;
  const perpSin = cos;

  const tipX = cx + cos * L;
  const tipY = cy + sin * L;
  const c1x = cx + cos * (L * 0.45) + perpCos * (W * 0.5);
  const c1y = cy + sin * (L * 0.45) + perpSin * (W * 0.5);
  const c2x = cx + cos * (L * 0.45) - perpCos * (W * 0.5);
  const c2y = cy + sin * (L * 0.45) - perpSin * (W * 0.5);

  let str = `fill "${fillCol}" `;
  if (strokeCol) str += `stroke "${strokeCol}" stroke-width 1 `;
  else str += `stroke none `;
  str += `path "M ${cx.toFixed(1)},${cy.toFixed(1)} Q ${c1x.toFixed(1)},${c1y.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)} Q ${c2x.toFixed(1)},${c2y.toFixed(1)} ${cx.toFixed(1)},${cy.toFixed(1)} Z"`;
  return str;
}

function drawFlameTongue(cx, cy, h, w, tilt, fillCol) {
  const tipX = cx + tilt;
  const tipY = cy - h;
  const c1x = cx - w * 0.6;
  const c1y = cy - h * 0.4;
  const c2x = cx + w * 0.6 + tilt * 0.5;
  const c2y = cy - h * 0.5;

  return `fill "${fillCol}" stroke none path "M ${cx - w * 0.5},${cy} Q ${c1x},${c1y} ${tipX},${tipY} Q ${c2x},${c2y} ${cx + w * 0.5},${cy} Z"`;
}

function buildAuraAtlas(name, renderFrame) {
  console.log(`Building organic ${name} 4x4 atlas...`);
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
  toWebP(stitchedPng, outWebp, 78);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
  compositeAtlasEffect(outWebp, path.join(compDir, `${name}.jpg`), 480, 380, 256, 256);
}

// 1. AURA SHIELD WARD (Guardian Woven Silk Ribbons & Quilted Golden Mist)
buildAuraAtlas('aura-shield-ward', (f, framePath) => {
  const C = 128;
  const draws = [];
  const phase = (f * Math.PI * 2) / 16;

  // Honey warm ambient core mist
  draws.push(`fill "rgba(255, 230, 160, 0.22)" stroke none circle ${C},${C + 10} ${C + 45},${C + 10}`);
  draws.push(`fill "rgba(255, 180, 50, 0.12)" stroke none circle ${C},${C + 10} ${C + 85},${C + 10}`);

  // 3 Swirling flowing quilted silk ribbons undulating and wrapping around
  for (let r = 0; r < 3; r++) {
    const baseAng = phase + (r * Math.PI * 2) / 3;
    const sweep = Math.PI * 1.1;
    const waveAmp = 5 + Math.sin(phase * 2 + r) * 3;
    const rIn = 65 + r * 6;
    const rOut = rIn + 14;

    // Outer rich amber fabric body
    draws.push(drawWavyRibbon(C, C + 8, rIn, rOut, baseAng, sweep, 3, waveAmp, 'rgba(235, 150, 35, 0.45)', 'rgba(255, 205, 90, 0.7)'));
    // Inner lustrous gold silk sheen
    draws.push(drawWavyRibbon(C, C + 8, rIn + 3, rOut - 3, baseAng + 0.15, sweep * 0.75, 3, waveAmp * 0.8, 'rgba(255, 245, 180, 0.65)', null));
  }

  // Floating yarn thread fibers rising and curling
  for (let i = 0; i < 8; i++) {
    const a = phase * 1.2 + (i * Math.PI * 2) / 8;
    const dist = 75 + ((i * 17 + f * 4) % 30);
    const yOff = 15 - ((f * 3 + i * 8) % 36);
    const px = C + Math.cos(a) * dist;
    const py = C + Math.sin(a) * (dist * 0.75) + yOff;
    const ang = a + Math.PI / 2 + Math.sin(phase + i) * 0.4;
    draws.push(drawLeaf(px, py, 10, 3.5, ang, 'rgba(255, 235, 150, 0.85)', 'rgba(255, 180, 50, 0.6)'));
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.1 "${framePath}"`);
});

// 2. AURA FIRE BUFF (Warm Campfire Hearth & Dancing Flame Tongues)
buildAuraAtlas('aura-fire-buff', (f, framePath) => {
  const C = 128;
  const draws = [];
  const phase = (f * Math.PI * 2) / 16;

  // Ground embers warmth
  draws.push(`fill "rgba(220, 50, 10, 0.25)" stroke none circle ${C},${C + 35} ${C + 75},${C + 35}`);
  draws.push(`fill "rgba(255, 160, 20, 0.28)" stroke none circle ${C},${C + 30} ${C + 45},${C + 30}`);

  // 6 dancing organic flame tongues around character base licking upward
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI * 2) / 6 + phase * 0.4;
    const rX = 58 + Math.sin(phase * 2 + i) * 8;
    const px = C + Math.cos(a) * rX;
    const py = C + 28 + Math.sin(a) * (rX * 0.45);

    const fH = 42 + Math.sin(phase * 3 + i * 2) * 16;
    const fW = 20 + Math.sin(phase * 2 + i) * 4;
    const tilt = Math.sin(phase * 2.5 + i) * 10;

    // Outer crimson ember flame
    draws.push(drawFlameTongue(px, py, fH * 1.2, fW * 1.3, tilt * 1.2, 'rgba(195, 30, 10, 0.42)'));
    // Rich orange body
    draws.push(drawFlameTongue(px, py, fH, fW, tilt, 'rgba(255, 125, 20, 0.72)'));
    // Golden core
    draws.push(drawFlameTongue(px, py, fH * 0.65, fW * 0.6, tilt * 0.7, 'rgba(255, 230, 75, 0.88)'));
    // White hot base
    draws.push(drawFlameTongue(px, py, fH * 0.35, fW * 0.35, tilt * 0.4, 'rgba(255, 255, 235, 0.95)'));
  }

  // Rising sparkling embers floating upward
  for (let e = 0; e < 12; e++) {
    const ea = phase * 0.8 + (e * Math.PI * 2) / 12;
    const edist = 40 + ((e * 19 + f * 6) % 45);
    const eLife = ((f + e * 3) % 16) / 16;
    const eAlpha = (1 - eLife * 0.7).toFixed(2);
    const ex = C + Math.cos(ea) * edist;
    const ey = C + 35 - eLife * 75;
    const eSz = 2.5 * (1 - eLife * 0.5);
    draws.push(`fill "rgba(255, 235, 120, ${eAlpha})" stroke none circle ${ex.toFixed(1)},${ey.toFixed(1)} ${(ex + eSz).toFixed(1)},${ey.toFixed(1)}`);
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${framePath}"`);
});

// 3. AURA HEAL REGEN (Herbal Tea Steam & Blooming Clover Updraft)
buildAuraAtlas('aura-heal-regen', (f, framePath) => {
  const C = 128;
  const draws = [];
  const phase = (f * Math.PI * 2) / 16;

  // Calming celadon/emerald herbal pool glow
  draws.push(`fill "rgba(35, 160, 75, 0.22)" stroke none circle ${C},${C + 25} ${C + 75},${C + 25}`);
  draws.push(`fill "rgba(125, 245, 160, 0.25)" stroke none circle ${C},${C + 20} ${C + 45},${C + 20}`);

  // 2 Swirling fragrant steam spirals rising
  for (let s = 0; s < 2; s++) {
    const baseAng = phase + s * Math.PI;
    const sweep = Math.PI * 1.25;
    const rIn = 52 + s * 10;
    const rOut = rIn + 18;
    const waveAmp = 6 + Math.sin(phase * 2 + s) * 3;
    draws.push(drawWavyRibbon(C, C + 12 - s * 10, rIn, rOut, baseAng, sweep, 3, waveAmp, 'rgba(45, 185, 95, 0.35)', 'rgba(155, 255, 185, 0.6)'));
  }

  // 7 Floating painted clover leaflets & herbal tea droplets swirling and ascending
  for (let c = 0; c < 7; c++) {
    const life = ((f + c * 2.3) % 16) / 16;
    const ca = phase * 1.4 + (c * Math.PI * 2) / 7;
    const cdist = 38 + life * 45;
    const cyOff = 25 - life * 65;
    const cx = C + Math.cos(ca) * cdist;
    const cy = C + Math.sin(ca) * (cdist * 0.65) + cyOff;
    const cAlpha = (Math.sin(life * Math.PI) * 0.9).toFixed(2);
    const leafAng = ca + Math.PI / 2 + Math.sin(phase * 2 + c) * 0.5;

    // Painted clover leaflet
    draws.push(drawLeaf(cx, cy, 11, 6, leafAng, `rgba(110, 245, 145, ${cAlpha})`, `rgba(25, 140, 60, ${cAlpha})`));
    // Tiny translucent dewdrop sparkle
    draws.push(`fill "rgba(240, 255, 245, ${cAlpha})" stroke none circle ${(cx + 2).toFixed(1)},${(cy - 2).toFixed(1)} ${(cx + 4.5).toFixed(1)},${(cy - 2).toFixed(1)}`);
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${framePath}"`);
});

// 4. AURA ATTACK BUFF (Calligraphic Brushstroke Ribbons & Spirited Sparks)
buildAuraAtlas('aura-attack-buff', (f, framePath) => {
  const C = 128;
  const draws = [];
  const phase = (f * Math.PI * 2) / 16;

  // Spirited crimson/golden radiance
  draws.push(`fill "rgba(225, 30, 45, 0.22)" stroke none circle ${C},${C + 10} ${C + 70},${C + 10}`);
  draws.push(`fill "rgba(255, 215, 60, 0.28)" stroke none circle ${C},${C + 5} ${C + 42},${C + 5}`);

  // 3 Dynamic sweeping calligraphic stroke ribbons whipping around
  for (let b = 0; b < 3; b++) {
    const baseAng = phase * 1.5 + (b * Math.PI * 2) / 3;
    const sweep = Math.PI * 1.05;
    const waveAmp = 7 + Math.cos(phase * 2.5 + b) * 4;
    const rIn = 60 + b * 8;
    const rOut = rIn + 15;

    // Deep lacquer crimson stroke
    draws.push(drawWavyRibbon(C, C + 6, rIn, rOut, baseAng, sweep, 2.5, waveAmp, 'rgba(215, 25, 35, 0.5)', 'rgba(255, 80, 90, 0.75)'));
    // Gleaming gold highlight along ribbon spine
    draws.push(drawWavyRibbon(C, C + 6, rIn + 4, rOut - 4, baseAng + 0.1, sweep * 0.8, 2.5, waveAmp * 0.7, 'rgba(255, 240, 160, 0.8)', null));
  }

  // Sharp painted impact flecks & energy sparks
  for (let s = 0; s < 10; s++) {
    const sa = phase * 2.2 + (s * Math.PI * 2) / 10;
    const sdist = 70 + ((s * 23 + f * 5) % 35);
    const syOff = 10 - ((f * 4 + s * 9) % 40);
    const sx = C + Math.cos(sa) * sdist;
    const sy = C + Math.sin(sa) * (sdist * 0.72) + syOff;
    const sang = sa + Math.PI / 2;
    draws.push(drawLeaf(sx, sy, 8, 3, sang, 'rgba(255, 250, 200, 0.95)', 'rgba(255, 140, 30, 0.8)'));
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${framePath}"`);
});

console.log('Organic Aura loops generation complete.');
