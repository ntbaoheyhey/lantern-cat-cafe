#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AG2/jobs/auras_v1';
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

function compositeAtlasEffect(effectWebp, outCompJpg, posX = 480, posY = 270, frameW = 256, frameH = 256) {
  let samplePng = path.join(workBase, 'temp_sample.png');
  run(`magick "${effectWebp}" -crop ${frameW}x${frameH}+${frameW}+${frameH} +repage "${samplePng}"`);
  const left = Math.round(posX - frameW / 2);
  const top = Math.round(posY - frameH / 2);
  run(`magick "${battleBg}" "${samplePng}" -geometry +${left}+${top} -compose plus -composite -quality 80 "${outCompJpg}"`);
  console.log(`  [Composite] -> ${outCompJpg}`);
}

function buildAuraAtlas(name, renderFrame) {
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
  toWebP(stitchedPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeAtlasEffect(outWebp, path.join(compDir, `${name}.jpg`), 480, 270, 256, 256);
}

console.log('Generating 4 Shield / Buff Aura Loops (F2)...');

// 1. AURA SHIELD WARD (Guardian Quilted Fabric & Stitched Orbits)
console.log('Building aura-shield-ward...');
buildAuraAtlas('aura-shield-ward', (f, framePath) => {
  const C = 128;
  const draws = [];
  const phase = (f * Math.PI * 2) / 16;
  const pulse = Math.sin(phase * 2);
  const rBase = 84 + pulse * 6;

  // Gentle central honey warmth
  draws.push(`fill "rgba(255, 245, 220, 0.4)" circle ${C},${C} ${C + 35},${C}`);
  draws.push(`fill "rgba(255, 200, 70, 0.2)" circle ${C},${C} ${C + 70},${C}`);

  // Quilted diamond stitch barrier ring
  draws.push(`stroke "rgba(255, 205, 80, 0.75)" stroke-width 4 fill "rgba(240, 160, 40, 0.1)" circle ${C},${C} ${C + rBase},${C}`);
  draws.push(`stroke "rgba(255, 255, 235, 0.9)" stroke-width 2.5 stroke-dasharray 10,8 fill none circle ${C},${C} ${C + rBase - 6},${C}`);

  // 6 Orbiting strawberry cross-stitches
  for (let i = 0; i < 6; i++) {
    const ang = (i * Math.PI) / 3 + phase;
    const ox = C + Math.cos(ang) * (rBase + 10);
    const oy = C + Math.sin(ang) * (rBase + 10);
    draws.push(`stroke "rgba(255, 75, 130, 0.85)" stroke-width 2.5 line ${ox - 6},${oy - 6} ${ox + 6},${oy + 6} line ${ox - 6},${oy + 6} ${ox + 6},${oy - 6}`);
  }

  // Soft floating wool tufts
  for (let w = 0; w < 8; w++) {
    const ang = (w * Math.PI) / 4 - phase * 0.8;
    const r = 45 + ((w * 13) % 25);
    const wx = C + Math.cos(ang) * r;
    const wy = C + Math.sin(ang) * r;
    draws.push(`fill "rgba(255, 240, 200, 0.65)" circle ${wx.toFixed(1)},${wy.toFixed(1)} ${(wx + 3).toFixed(1)},${wy.toFixed(1)}`);
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.5 "${framePath}"`);
});

// 2. AURA FIRE BUFF (Blacksmith Roaring Flame & Cinder Shimmer)
console.log('Building aura-fire-buff...');
buildAuraAtlas('aura-fire-buff', (f, framePath) => {
  const C = 128;
  const draws = [];
  const phase = (f * Math.PI * 2) / 16;

  // Rising heat underglow
  draws.push(`fill "rgba(255, 230, 100, 0.5)" circle ${C},${C} ${C + 38},${C}`);
  draws.push(`fill "rgba(255, 75, 0, 0.3)" circle ${C},${C} ${C + 75},${C}`);

  // 4 Spiraling flame wisp arcs
  for (let s = 0; s < 4; s++) {
    const baseAng = (s * Math.PI) / 2 + phase;
    const r1 = 35;
    const r2 = 92;
    const x1 = C + Math.cos(baseAng) * r1;
    const y1 = C + Math.sin(baseAng) * r1;
    const cx = C + Math.cos(baseAng + 0.6) * (r1 + r2) * 0.55;
    const cy = C + Math.sin(baseAng + 0.6) * (r1 + r2) * 0.55;
    const x2 = C + Math.cos(baseAng + 1.2) * r2;
    const y2 = C + Math.sin(baseAng + 1.2) * r2;
    draws.push(`stroke "rgba(255, 95, 10, 0.8)" stroke-width 4 fill none bezier ${x1.toFixed(1)},${y1.toFixed(1)} ${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`);
    draws.push(`stroke "rgba(255, 220, 60, 0.9)" stroke-width 2 fill none bezier ${x1.toFixed(1)},${y1.toFixed(1)} ${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`);
  }

  // Floating embers drifting outward
  for (let e = 0; e < 14; e++) {
    const ang = (e * Math.PI * 2) / 14 + phase * 1.5;
    const dist = 40 + ((e * 17 + f * 5) % 65);
    const ex = C + Math.cos(ang) * dist;
    const ey = C + Math.sin(ang) * dist;
    draws.push(`fill "rgba(255, 240, 120, 0.95)" circle ${ex.toFixed(1)},${ey.toFixed(1)} ${(ex + 2.5).toFixed(1)},${ey.toFixed(1)}`);
    draws.push(`fill "rgba(255, 70, 0, 0.7)" circle ${(ex + 1).toFixed(1)},${(ey + 1).toFixed(1)} ${(ex + 4.5).toFixed(1)},${(ey + 1).toFixed(1)}`);
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.5 "${framePath}"`);
});

// 3. AURA HEAL REGEN (Herbalist Botanical Bloom & Golden Pollen Spiral)
console.log('Building aura-heal-regen...');
buildAuraAtlas('aura-heal-regen', (f, framePath) => {
  const C = 128;
  const draws = [];
  const phase = (f * Math.PI * 2) / 16;
  const pulse = Math.sin(phase);

  // Soft emerald botanical light
  draws.push(`fill "rgba(220, 255, 210, 0.5)" circle ${C},${C} ${C + 35},${C}`);
  draws.push(`fill "rgba(50, 205, 90, 0.25)" circle ${C},${C} ${C + 75},${C}`);

  // Fairy ring botanical boundary
  const rRing = 80 + pulse * 4;
  draws.push(`stroke "rgba(60, 215, 105, 0.75)" stroke-width 3.5 fill none circle ${C},${C} ${C + rRing},${C}`);
  draws.push(`stroke "rgba(255, 235, 140, 0.85)" stroke-width 2 stroke-dasharray 8,8 fill none circle ${C},${C} ${C + rRing - 6},${C}`);

  // 6 Floating clover leaves orbiting
  for (let p = 0; p < 6; p++) {
    const ang = (p * Math.PI) / 3 + phase * 0.7;
    const px = C + Math.cos(ang) * (rRing + 8);
    const py = C + Math.sin(ang) * (rRing + 8);
    draws.push(`fill "rgba(45, 200, 90, 0.85)" circle ${px.toFixed(1)},${py.toFixed(1)} ${(px + 6).toFixed(1)},${py.toFixed(1)}`);
    draws.push(`fill "rgba(255, 240, 160, 0.8)" circle ${px.toFixed(1)},${py.toFixed(1)} ${(px + 3).toFixed(1)},${py.toFixed(1)}`);
  }

  // Golden dew drops floating upward
  for (let d = 0; d < 12; d++) {
    const ang = (d * Math.PI * 2) / 12 - phase;
    const dist = 30 + ((d * 19 + f * 4) % 55);
    const dx = C + Math.cos(ang) * dist;
    const dy = C + Math.sin(ang) * dist;
    draws.push(`fill "rgba(255, 245, 160, 0.9)" circle ${dx.toFixed(1)},${dy.toFixed(1)} ${(dx + 2.5).toFixed(1)},${dy.toFixed(1)}`);
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.5 "${framePath}"`);
});

// 4. AURA ATTACK BUFF (Bakery Butter Sizzle & Crispy Crumb Halo)
console.log('Building aura-attack-buff...');
buildAuraAtlas('aura-attack-buff', (f, framePath) => {
  const C = 128;
  const draws = [];
  const phase = (f * Math.PI * 2) / 16;
  const pulse = Math.sin(phase * 3);

  // Sizzling golden butter core
  draws.push(`fill "rgba(255, 250, 200, 0.55)" circle ${C},${C} ${C + 35},${C}`);
  draws.push(`fill "rgba(255, 190, 50, 0.28)" circle ${C},${C} ${C + 72},${C}`);

  // Radiating golden cleaver blade arcs
  const rHalo = 82 + pulse * 5;
  draws.push(`stroke "rgba(255, 195, 55, 0.85)" stroke-width 4.5 fill "rgba(215, 115, 20, 0.15)" circle ${C},${C} ${C + rHalo},${C}`);
  draws.push(`stroke "rgba(255, 245, 180, 0.9)" stroke-width 2.5 stroke-dasharray 12,6 fill none circle ${C},${C} ${C + rHalo - 7},${C}`);

  // Flying crunchy toasted crumbs in rapid orbit
  for (let c = 0; c < 16; c++) {
    const ang = (c * Math.PI * 2) / 16 + phase * 2.0;
    const dist = rHalo * 0.7 + ((c * 17) % 35);
    const cx = C + Math.cos(ang) * dist;
    const cy = C + Math.sin(ang) * dist;
    const sz = 2.5 + (c % 3);
    draws.push(`fill "rgba(255, 235, 140, 0.95)" circle ${cx.toFixed(1)},${cy.toFixed(1)} ${(cx + sz).toFixed(1)},${cy.toFixed(1)}`);
    draws.push(`fill "rgba(200, 100, 15, 0.75)" circle ${(cx + 1).toFixed(1)},${(cy + 1).toFixed(1)} ${(cx + sz + 2).toFixed(1)},${(cy + 1).toFixed(1)}`);
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.5 "${framePath}"`);
});

// Update manifest
console.log('Updating manifest.json with 4 aura loop entries...');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const auraEntries = {
  'aura-shield-ward': { file: 'aura-shield-ward.webp', cols: 4, rows: 4, frameMs: 50, blend: 'add', anchor: 'caster', sizePx: 256 },
  'aura-fire-buff': { file: 'aura-fire-buff.webp', cols: 4, rows: 4, frameMs: 50, blend: 'add', anchor: 'caster', sizePx: 256 },
  'aura-heal-regen': { file: 'aura-heal-regen.webp', cols: 4, rows: 4, frameMs: 50, blend: 'add', anchor: 'caster', sizePx: 256 },
  'aura-attack-buff': { file: 'aura-attack-buff.webp', cols: 4, rows: 4, frameMs: 50, blend: 'add', anchor: 'caster', sizePx: 256 }
};
for (const [k, v] of Object.entries(auraEntries)) manifest[k] = v;

const sortedManifest = {};
for (const k of Object.keys(manifest).sort()) sortedManifest[k] = manifest[k];
fs.writeFileSync(manifestPath, JSON.stringify(sortedManifest, null, 2) + '\n', 'utf8');

// Montage
const montageOut = '/Users/bao/th-v5-ag2/reports/v5/AG2/T1/auras-montage.jpg';
const auraFiles = [
  `${vfxDir}/aura-shield-ward.webp`,
  `${vfxDir}/aura-fire-buff.webp`,
  `${vfxDir}/aura-heal-regen.webp`,
  `${vfxDir}/aura-attack-buff.webp`,
];
run(`magick montage ${auraFiles.map(f => `"${f}"`).join(' ')} -tile 2x2 -geometry 256x256+4+4 -background "#0a0a0a" -quality 80 "${montageOut}"`);
console.log(`  -> Auras Montage: ${montageOut}`);
