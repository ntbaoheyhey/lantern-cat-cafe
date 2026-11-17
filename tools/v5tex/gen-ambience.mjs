#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AGV/jobs/ambience_v1';
const manifestPath = path.join(vfxDir, 'manifest.json');

if (!fs.existsSync(vfxDir)) fs.mkdirSync(vfxDir, { recursive: true });
if (!fs.existsSync(workBase)) fs.mkdirSync(workBase, { recursive: true });

function run(cmd) {
  execSync(cmd, { stdio: 'pipe' });
}

function toWebP(pngIn, webpOut, q = 85) {
  run(`cwebp -q ${q} -alpha_q 90 "${pngIn}" -o "${webpOut}"`);
}

console.log('Generating Environmental Ambience & Damage Glow Plates (F5 + F6)...');

// 1. AMBIENCE DUST MOTES (4x4 256x256 looping atlas)
{
  console.log('Building ambience-dust-motes...');
  const framesDir = path.join(workBase, 'dust_frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

  // 32 deterministic dust motes
  const motes = [];
  for (let i = 0; i < 32; i++) {
    motes.push({
      x0: ((i * 37 + 13) % 240) + 8,
      y0: ((i * 53 + 29) % 240) + 8,
      radius: 1.2 + (i % 3) * 0.8,
      phaseX: (i * 1.3) % (Math.PI * 2),
      phaseY: (i * 1.7) % (Math.PI * 2),
      speedY: 0.4 + (i % 4) * 0.25,
      speedX: ((i % 2 === 0 ? 1 : -1) * (0.2 + (i % 3) * 0.15)),
      baseAlpha: 0.4 + (i % 4) * 0.18
    });
  }

  const frameFiles = [];
  for (let f = 0; f < 16; f++) {
    const framePath = path.join(framesDir, `frame_${String(f).padStart(2, '0')}.png`);
    const draws = [];
    const t = (f * Math.PI * 2) / 16;

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      // Looping drift
      const dx = Math.sin(t + m.phaseX) * 10 + Math.cos(t * 0.5) * 4;
      const dy = -Math.sin(t + m.phaseY) * 12 - (f / 16) * 14 * m.speedY;

      let px = (m.x0 + dx + 256) % 256;
      let py = (m.y0 + dy + 256) % 256;

      const pulse = 0.85 + 0.25 * Math.sin(t * 2 + m.phaseX);
      const alpha = Math.min(1.0, m.baseAlpha * pulse).toFixed(2);
      const haloAlpha = (alpha * 0.35).toFixed(2);

      // Outer glow halo
      draws.push(`fill "rgba(255, 200, 100, ${haloAlpha})" stroke none circle ${px.toFixed(1)},${py.toFixed(1)} ${(px + m.radius * 3.5).toFixed(1)},${py.toFixed(1)}`);
      // Inner warm core
      draws.push(`fill "rgba(255, 245, 200, ${alpha})" stroke none circle ${px.toFixed(1)},${py.toFixed(1)} ${(px + m.radius).toFixed(1)},${py.toFixed(1)}`);
    }

    run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x0.8 "${framePath}"`);
    frameFiles.push(`"${framePath}"`);
  }

  const stitchedPng = path.join(workBase, 'ambience_dust_stitched.png');
  run(`magick montage ${frameFiles.join(' ')} -tile 4x4 -geometry 256x256+0+0 -background black "${stitchedPng}"`);

  const outWebp = path.join(vfxDir, 'ambience-dust-motes.webp');
  toWebP(stitchedPng, outWebp, 85);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// 2. AMBIENCE LIGHT SHAFTS (4x4 256x256 looping atlas)
{
  console.log('Building ambience-light-shafts...');
  const framesDir = path.join(workBase, 'shaft_frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

  const frameFiles = [];
  for (let f = 0; f < 16; f++) {
    const framePath = path.join(framesDir, `frame_${String(f).padStart(2, '0')}.png`);
    const t = (f * Math.PI * 2) / 16;
    const draws = [];

    // 3 slanting volumetric sunbeams from top-left (angle ~40 deg)
    const beams = [
      { xTop: 20, widthTop: 45, xBot: 110, widthBot: 75, phase: 0 },
      { xTop: 85, widthTop: 60, xBot: 190, widthBot: 95, phase: 1.8 },
      { xTop: 160, widthTop: 40, xBot: 250, widthBot: 70, phase: 3.5 }
    ];

    for (const b of beams) {
      const pulse = 0.75 + 0.28 * Math.sin(t + b.phase);
      const sway = Math.sin(t + b.phase * 0.5) * 5;

      const p1x = b.xTop + sway;
      const p2x = b.xTop + b.widthTop + sway;
      const p3x = b.xBot + b.widthBot + sway * 1.5;
      const p4x = b.xBot + sway * 1.5;

      const alphaCore = (0.28 * pulse).toFixed(2);
      const alphaGlow = (0.14 * pulse).toFixed(2);

      // Outer soft beam
      draws.push(`fill "rgba(255, 215, 120, ${alphaGlow})" stroke none polygon ${p1x - 15},0 ${p2x + 15},0 ${p3x + 25},256 ${p4x - 25},256`);
      // Inner bright shaft
      draws.push(`fill "rgba(255, 245, 190, ${alphaCore})" stroke none polygon ${p1x},0 ${p2x},0 ${p3x},256 ${p4x},256`);
    }

    run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x12 "${framePath}"`);
    frameFiles.push(`"${framePath}"`);
  }

  const stitchedPng = path.join(workBase, 'ambience_shafts_stitched.png');
  run(`magick montage ${frameFiles.join(' ')} -tile 4x4 -geometry 256x256+0+0 -background black "${stitchedPng}"`);

  const outWebp = path.join(vfxDir, 'ambience-light-shafts.webp');
  toWebP(stitchedPng, outWebp, 85);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// 3. DAMAGE NUMBER GLOW PLATES (F6 - NO DIGITS, pure stylized painted backplates)
console.log('Building damage-number glow plates (F6)...');
{
  // Plate 1: plate-damage-crit (intense golden-crimson impact backplate)
  const outPng = path.join(workBase, 'plate_damage_crit.png');
  const outWebp = path.join(vfxDir, 'plate-damage-crit.webp');
  const C = 128;
  const draws = [
    // Outer fiery crimson halo
    `fill "rgba(220, 30, 60, 0.45)" stroke none ellipse ${C},${C} 95,48 0,360`,
    // Warm golden-amber midplate
    `fill "rgba(255, 180, 40, 0.75)" stroke none ellipse ${C},${C} 70,30 0,360`,
    // Incandescent white-gold core
    `fill "rgba(255, 250, 220, 0.95)" stroke none ellipse ${C},${C} 45,16 0,360`,
    // Sharp horizontal flare streaks
    `stroke "rgba(255, 240, 180, 0.85)" stroke-width 3 line ${C - 105},${C} ${C + 105},${C}`,
    `stroke "white" stroke-width 1.5 line ${C - 65},${C} ${C + 65},${C}`
  ];
  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x2.5 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

{
  // Plate 2: plate-damage-normal (warm parchment / amber damage backplate)
  const outPng = path.join(workBase, 'plate_damage_normal.png');
  const outWebp = path.join(vfxDir, 'plate-damage-normal.webp');
  const C = 128;
  const draws = [
    // Outer amber halo
    `fill "rgba(230, 140, 30, 0.35)" stroke none ellipse ${C},${C} 80,40 0,360`,
    // Warm parchment mid glow
    `fill "rgba(255, 210, 110, 0.65)" stroke none ellipse ${C},${C} 55,24 0,360`,
    // Soft cream core
    `fill "rgba(255, 250, 230, 0.88)" stroke none ellipse ${C},${C} 32,12 0,360`
  ];
  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x3.0 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

{
  // Plate 3: plate-heal-glow (soft jade / botanical restoration backplate)
  const outPng = path.join(workBase, 'plate_heal_glow.png');
  const outWebp = path.join(vfxDir, 'plate-heal-glow.webp');
  const C = 128;
  const draws = [
    // Outer emerald mist
    `fill "rgba(40, 180, 80, 0.35)" stroke none ellipse ${C},${C} 80,40 0,360`,
    // Mint mid glow
    `fill "rgba(120, 240, 160, 0.65)" stroke none ellipse ${C},${C} 55,24 0,360`,
    // Soft white-mint core
    `fill "rgba(230, 255, 240, 0.90)" stroke none ellipse ${C},${C} 32,12 0,360`
  ];
  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x3.0 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// Update manifest
console.log('Updating manifest.json with 5 ambience & plate entries...');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const newEntries = {
  'ambience-dust-motes': { file: 'ambience-dust-motes.webp', cols: 4, rows: 4, frameMs: 80, blend: 'add', anchor: 'ground', sizePx: 256 },
  'ambience-light-shafts': { file: 'ambience-light-shafts.webp', cols: 4, rows: 4, frameMs: 90, blend: 'add', anchor: 'ground', sizePx: 256 },
  'plate-damage-crit': { file: 'plate-damage-crit.webp', cols: 1, rows: 1, frameMs: 50, blend: 'add', anchor: 'target', sizePx: 256 },
  'plate-damage-normal': { file: 'plate-damage-normal.webp', cols: 1, rows: 1, frameMs: 50, blend: 'add', anchor: 'target', sizePx: 256 },
  'plate-heal-glow': { file: 'plate-heal-glow.webp', cols: 1, rows: 1, frameMs: 50, blend: 'add', anchor: 'target', sizePx: 256 }
};
for (const [k, v] of Object.entries(newEntries)) manifest[k] = v;

const sortedManifest = {};
for (const k of Object.keys(manifest).sort()) sortedManifest[k] = manifest[k];
fs.writeFileSync(manifestPath, JSON.stringify(sortedManifest, null, 2) + '\n', 'utf8');

console.log('Ambience & plates generated successfully and manifest updated.');
