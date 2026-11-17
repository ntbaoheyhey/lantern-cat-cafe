#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AGV/jobs/hitstop_v2';
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

console.log('Regenerating Hit-stop Flash Accents & Additive Vignettes (V2)...');

// 1. HIT-STOP FLASH WHITE (256x256 single - sharp textured contact starburst accent)
{
  const outPng = path.join(workBase, 'hit_stop_white.png');
  const outWebp = path.join(vfxDir, 'hit-stop-flash-white.webp');
  const C = 128;
  const draws = [];

  // 8 textured needle-glint rays of varying length
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4;
    const len = i % 2 === 0 ? 95 : 55;
    const wid = i % 2 === 0 ? 2.5 : 1.5;
    const x1 = C - Math.cos(ang) * len;
    const y1 = C - Math.sin(ang) * len;
    const x2 = C + Math.cos(ang) * len;
    const y2 = C + Math.sin(ang) * len;
    draws.push(`stroke "rgba(255, 255, 255, 0.9)" stroke-width ${wid} line ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`);
  }

  // Diamond facets
  draws.push(`fill "rgba(255, 255, 255, 0.7)" stroke none polygon ${C},${C - 28} ${C + 16},${C} ${C},${C + 28} ${C - 16},${C}`);
  // Small concentrated pinpoint core (does not wipe out character detail)
  draws.push(`fill "white" circle ${C},${C} ${C + 8},${C}`);
  draws.push(`fill "rgba(240, 245, 255, 0.4)" circle ${C},${C} ${C + 20},${C}`);

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// 2. HIT-STOP FLASH GOLD (256x256 single - golden critical contact starburst accent)
{
  const outPng = path.join(workBase, 'hit_stop_gold.png');
  const outWebp = path.join(vfxDir, 'hit-stop-flash-gold.webp');
  const C = 128;
  const draws = [];

  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4;
    const len = i % 2 === 0 ? 105 : 65;
    const wid = i % 2 === 0 ? 3.0 : 1.8;
    const x1 = C - Math.cos(ang) * len;
    const y1 = C - Math.sin(ang) * len;
    const x2 = C + Math.cos(ang) * len;
    const y2 = C + Math.sin(ang) * len;
    draws.push(`stroke "rgba(255, 220, 100, 0.95)" stroke-width ${wid} line ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`);
  }

  // Diamond facets
  draws.push(`fill "rgba(255, 235, 140, 0.75)" stroke none polygon ${C},${C - 32} ${C + 18},${C} ${C},${C + 32} ${C - 18},${C}`);
  // Concentrated golden-white core
  draws.push(`fill "white" circle ${C},${C} ${C + 9},${C}`);
  draws.push(`fill "rgba(255, 180, 40, 0.45)" circle ${C},${C} ${C + 24},${C}`);

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// 3. VIGNETTE DAMAGE RED (512x512 single - pure black center, rich crimson edges, zero white border)
{
  const outPng = path.join(workBase, 'vignette_damage_red.png');
  const outWebp = path.join(vfxDir, 'vignette-damage-red.webp');
  run(`magick -size 512x512 "radial-gradient:black-rgb(180,20,40)" -level 28%,90% -blur 0x10 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// 4. VIGNETTE HEAL GREEN (512x512 single - pure black center, rich emerald edges, zero white border)
{
  const outPng = path.join(workBase, 'vignette_heal_green.png');
  const outWebp = path.join(vfxDir, 'vignette-heal-green.webp');
  run(`magick -size 512x512 "radial-gradient:black-rgb(25,160,60)" -level 28%,90% -blur 0x10 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// 5. VIGNETTE ULT GOLD (512x512 single - pure black center, rich amber-gold edges, zero white border)
{
  const outPng = path.join(workBase, 'vignette_ult_gold.png');
  const outWebp = path.join(vfxDir, 'vignette-ult-gold.webp');
  run(`magick -size 512x512 "radial-gradient:black-rgb(210,150,25)" -level 28%,90% -blur 0x10 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

console.log('All 5 hitstop & vignette textures updated.');
