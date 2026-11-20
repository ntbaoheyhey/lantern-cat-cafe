#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AG2/jobs/hitstop_v1';
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

function compositeSingleEffect(effectWebp, outCompJpg, posX = 480, posY = 270, frameW = 512, frameH = 512) {
  let samplePng = path.join(workBase, 'temp_sample.png');
  run(`magick "${effectWebp}" -resize ${frameW}x${frameH} "${samplePng}"`);
  const left = Math.round(posX - frameW / 2);
  const top = Math.round(posY - frameH / 2);
  run(`magick "${battleBg}" "${samplePng}" -geometry +${left}+${top} -compose plus -composite -quality 80 "${outCompJpg}"`);
  console.log(`  [Composite] -> ${outCompJpg}`);
}

console.log('Generating Hit-stop Flash Frames & Glow Vignettes (F4)...');

// 1. HIT-STOP FLASH WHITE (256x256 single)
{
  const outPng = path.join(workBase, 'hit_stop_white.png');
  const outWebp = path.join(vfxDir, 'hit-stop-flash-white.webp');
  const C = 128;
  const draws = [
    `fill "white" circle ${C},${C} ${C + 45},${C}`,
    `fill "rgba(255, 245, 230, 0.85)" circle ${C},${C} ${C + 85},${C}`,
    `fill "rgba(255, 220, 200, 0.45)" circle ${C},${C} ${C + 120},${C}`,
    `stroke "white" stroke-width 4 line ${C - 100},${C} ${C + 100},${C} line ${C},${C - 100} ${C},${C + 100}`,
    `stroke "rgba(255, 255, 255, 0.7)" stroke-width 2 line ${C - 70},${C - 70} ${C + 70},${C + 70} line ${C - 70},${C + 70} ${C + 70},${C - 70}`
  ];
  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x2.5 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeSingleEffect(outWebp, path.join(compDir, 'hit-stop-flash-white.jpg'), 480, 270, 256, 256);
}

// 2. HIT-STOP FLASH GOLD (256x256 single)
{
  const outPng = path.join(workBase, 'hit_stop_gold.png');
  const outWebp = path.join(vfxDir, 'hit-stop-flash-gold.webp');
  const C = 128;
  const draws = [
    `fill "white" circle ${C},${C} ${C + 40},${C}`,
    `fill "rgba(255, 235, 140, 0.9)" circle ${C},${C} ${C + 80},${C}`,
    `fill "rgba(255, 170, 40, 0.55)" circle ${C},${C} ${C + 120},${C}`,
    `stroke "white" stroke-width 4 line ${C - 90},${C} ${C + 90},${C} line ${C},${C - 90} ${C},${C + 90}`,
    `stroke "rgba(255, 220, 100, 0.8)" stroke-width 2.5 line ${C - 65},${C - 65} ${C + 65},${C + 65} line ${C - 65},${C + 65} ${C + 65},${C - 65}`
  ];
  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x2.5 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeSingleEffect(outWebp, path.join(compDir, 'hit-stop-flash-gold.jpg'), 480, 270, 256, 256);
}

// 3. VIGNETTE DAMAGE RED (512x512 single - crimson silk screen-edge frame)
{
  const outPng = path.join(workBase, 'vignette_damage_red.png');
  const outWebp = path.join(vfxDir, 'vignette-damage-red.webp');
  run(`magick -size 512x512 radial-gradient:black-white -level 20%,90% -fill "rgb(230, 30, 60)" -tint 100% -blur 0x12 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeSingleEffect(outWebp, path.join(compDir, 'vignette-damage-red.jpg'), 480, 270, 960, 540);
}

// 4. VIGNETTE HEAL GREEN (512x512 single - emerald botanical screen-edge frame)
{
  const outPng = path.join(workBase, 'vignette_heal_green.png');
  const outWebp = path.join(vfxDir, 'vignette-heal-green.webp');
  run(`magick -size 512x512 radial-gradient:black-white -level 20%,90% -fill "rgb(45, 205, 95)" -tint 100% -blur 0x12 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeSingleEffect(outWebp, path.join(compDir, 'vignette-heal-green.jpg'), 480, 270, 960, 540);
}

// 5. VIGNETTE ULT GOLD (512x512 single - golden needle-light screen-edge frame)
{
  const outPng = path.join(workBase, 'vignette_ult_gold.png');
  const outWebp = path.join(vfxDir, 'vignette-ult-gold.webp');
  run(`magick -size 512x512 radial-gradient:black-white -level 20%,90% -fill "rgb(255, 200, 50)" -tint 100% -blur 0x12 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeSingleEffect(outWebp, path.join(compDir, 'vignette-ult-gold.jpg'), 480, 270, 960, 540);
}

// Update manifest
console.log('Updating manifest.json with 5 hitstop & vignette entries...');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const hitstopEntries = {
  'hit-stop-flash-gold': { file: 'hit-stop-flash-gold.webp', cols: 1, rows: 1, frameMs: 50, blend: 'add', anchor: 'target', sizePx: 256 },
  'hit-stop-flash-white': { file: 'hit-stop-flash-white.webp', cols: 1, rows: 1, frameMs: 50, blend: 'add', anchor: 'target', sizePx: 256 },
  'vignette-damage-red': { file: 'vignette-damage-red.webp', cols: 1, rows: 1, frameMs: 50, blend: 'add', anchor: 'target', sizePx: 512 },
  'vignette-heal-green': { file: 'vignette-heal-green.webp', cols: 1, rows: 1, frameMs: 50, blend: 'add', anchor: 'target', sizePx: 512 },
  'vignette-ult-gold': { file: 'vignette-ult-gold.webp', cols: 1, rows: 1, frameMs: 50, blend: 'add', anchor: 'target', sizePx: 512 }
};
for (const [k, v] of Object.entries(hitstopEntries)) manifest[k] = v;

const sortedManifest = {};
for (const k of Object.keys(manifest).sort()) sortedManifest[k] = manifest[k];
fs.writeFileSync(manifestPath, JSON.stringify(sortedManifest, null, 2) + '\n', 'utf8');

// Montage
const montageOut = '/Users/bao/th-v5-ag2/reports/v5/AG2/T1/hitstop-montage.jpg';
const hitstopFiles = [
  `${vfxDir}/hit-stop-flash-white.webp`,
  `${vfxDir}/hit-stop-flash-gold.webp`,
  `${vfxDir}/vignette-damage-red.webp`,
  `${vfxDir}/vignette-heal-green.webp`,
  `${vfxDir}/vignette-ult-gold.webp`,
];
run(`magick montage ${hitstopFiles.map(f => `"${f}"`).join(' ')} -tile 3x2 -geometry 256x256+4+4 -background "#0a0a0a" -quality 80 "${montageOut}"`);
console.log(`  -> Hitstop Montage: ${montageOut}`);
