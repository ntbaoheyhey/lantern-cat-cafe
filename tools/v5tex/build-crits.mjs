#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AG2/jobs/crits';

if (!fs.existsSync(vfxDir)) fs.mkdirSync(vfxDir, { recursive: true });
if (!fs.existsSync(workBase)) fs.rmSync(workBase, { recursive: true, force: true });
fs.mkdirSync(workBase, { recursive: true });

function run(cmd) {
  execSync(cmd, { stdio: 'pipe' });
}

function toWebP(pngIn, webpOut, q = 82) {
  run(`cwebp -q ${q} -alpha_q 90 "${pngIn}" -o "${webpOut}"`);
}

console.log('Building Critical Hit VFX textures...');

// 1. CRIT IMPACT BURST (4x4 flipbook = 512x512 atlas, 16 frames of 128x128)
// Palette: Electric Violet (rgba(180, 70, 255)) + Radiant Gold (rgba(255, 220, 60))
function buildCritImpactBurst() {
  const critWork = path.join(workBase, 'crit_burst_frames');
  fs.mkdirSync(critWork, { recursive: true });

  const N = 16;
  const C = 64;

  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const framePng = path.join(critWork, `f_${String(i).padStart(2, '0')}.png`);
    const draws = [];

    // Powerful central flash
    const coreAlpha = Math.max(0, 1.0 - t * 2.2);
    if (coreAlpha > 0.05) {
      const coreR = Math.max(1, 22 * (1 - t * 1.8));
      draws.push(`fill "white" circle ${C},${C} ${(C + coreR * 0.6).toFixed(1)},${C}`);
      draws.push(`fill "rgba(255, 230, 80, ${(coreAlpha * 0.95).toFixed(2)})" circle ${C},${C} ${(C + coreR).toFixed(1)},${C}`);
      draws.push(`fill "rgba(180, 70, 255, ${(coreAlpha * 0.7).toFixed(2)})" circle ${C},${C} ${(C + coreR * 1.6).toFixed(1)},${C}`);
    }

    // Double shockwave: outer violet + inner radiant gold
    const ringR = 3 + 55 * Math.pow(t, 0.65);
    const ringAlpha = Math.max(0, 1.0 - Math.pow(t, 1.25));

    if (ringAlpha > 0.02 && ringR > 4) {
      draws.push(`stroke "rgba(195, 80, 255, ${(ringAlpha * 0.9).toFixed(2)})" stroke-width ${(4.0 * (1 - t * 0.6)).toFixed(1)} fill none circle ${C},${C} ${(C + ringR).toFixed(1)},${C}`);
      draws.push(`stroke "rgba(255, 235, 100, ${(ringAlpha * 0.95).toFixed(2)})" stroke-width 2 fill none circle ${C},${C} ${(C + ringR * 0.93).toFixed(1)},${C}`);
    }

    // 12 critical lightning / spark needles
    const nSparks = 12;
    for (let s = 0; s < nSparks; s++) {
      const ang = (s * Math.PI * 2) / nSparks + 0.2 * Math.sin(s * 2);
      const dist = 52 * Math.pow(t, 0.7);
      const sx = C + Math.cos(ang) * dist;
      const sy = C + Math.sin(ang) * dist;
      const sAlpha = Math.max(0, (1 - t * 1.1) * 0.9);

      if (sAlpha > 0.05 && sx >= 0 && sx < 128 && sy >= 0 && sy < 128) {
        const col = s % 2 === 0 ? `rgba(255, 240, 110, ${sAlpha.toFixed(2)})` : `rgba(210, 110, 255, ${sAlpha.toFixed(2)})`;
        draws.push(`fill "${col}" circle ${sx.toFixed(1)},${sy.toFixed(1)} ${(sx + 2.5).toFixed(1)},${sy.toFixed(1)}`);
      }
    }

    const drawArg = draws.length > 0 ? `-draw '${draws.join(' ')}'` : '';
    run(`magick -size 128x128 xc:black ${drawArg} -blur 0x0.7 "${framePng}"`);
  }

  const atlasPng = path.join(workBase, 'crit_impact_burst_atlas.png');
  run(`magick montage "${critWork}/f_*.png" -tile 4x4 -geometry 128x128+0+0 -background black "${atlasPng}"`);
  const outWebp = path.join(vfxDir, 'crit-impact-burst.webp');
  toWebP(atlasPng, outWebp);
  console.log(`  -> ${outWebp}`);
}

// 2. CRIT SPARK FLARE (single 256x256 high-intensity starburst)
function buildCritSparkFlare() {
  const outPng = path.join(workBase, 'crit_spark_flare.png');
  const outWebp = path.join(vfxDir, 'crit-spark-flare.webp');
  const C = 128;
  const draws = [];

  // Radial purple-gold glow
  draws.push(`fill "rgba(180, 60, 255, 0.4)" circle ${C},${C} ${C + 95},${C}`);
  draws.push(`fill "rgba(255, 220, 80, 0.65)" circle ${C},${C} ${C + 55},${C}`);
  draws.push(`fill "white" circle ${C},${C} ${C + 18},${C}`);

  // Piercing 8-pointed star rays
  for (let r = 0; r < 4; r++) {
    const ang = (r * Math.PI) / 2;
    const len = 105;
    const x1 = C + Math.cos(ang) * len;
    const y1 = C + Math.sin(ang) * len;
    draws.push(`stroke "rgba(255, 255, 255, 0.95)" stroke-width 4 line ${C},${C} ${x1.toFixed(1)},${y1.toFixed(1)}`);
  }
  for (let r = 0; r < 4; r++) {
    const ang = Math.PI / 4 + (r * Math.PI) / 2;
    const len = 65;
    const x1 = C + Math.cos(ang) * len;
    const y1 = C + Math.sin(ang) * len;
    draws.push(`stroke "rgba(255, 235, 120, 0.85)" stroke-width 2.5 line ${C},${C} ${x1.toFixed(1)},${y1.toFixed(1)}`);
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${outPng}"`);
  toWebP(outPng, outWebp);
  console.log(`  -> ${outWebp}`);
}

buildCritImpactBurst();
buildCritSparkFlare();
console.log('Critical Hit VFX textures generated successfully!');
