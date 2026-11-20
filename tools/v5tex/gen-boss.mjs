#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AG2/jobs/boss_v2';
const compDir = '/Users/bao/th-v5-ag2/reports/v5/AG2/comp';
const battleBg = '/Users/bao/th-v5-ag2/work/v5/AG2/comp_base/battle_bg.jpg';

if (!fs.existsSync(vfxDir)) fs.mkdirSync(vfxDir, { recursive: true });
if (!fs.existsSync(workBase)) fs.mkdirSync(workBase, { recursive: true });
if (!fs.existsSync(compDir)) fs.mkdirSync(compDir, { recursive: true });

function run(cmd) {
  execSync(cmd, { stdio: 'pipe' });
}

function toWebP(pngIn, webpOut, q = 85) {
  run(`cwebp -q ${q} -alpha_q 90 "${pngIn}" -o "${webpOut}"`);
}

function compositeEffect(effectWebp, outCompJpg, posX = 480, posY = 270, frameW = 256, frameH = 256, isAtlas = false) {
  let samplePng = path.join(workBase, 'temp_sample.png');
  if (isAtlas) {
    run(`magick "${effectWebp}" -crop ${frameW}x${frameH}+${frameW}+${frameH} +repage "${samplePng}"`);
  } else {
    run(`magick "${effectWebp}" -resize ${frameW}x${frameH} "${samplePng}"`);
  }
  const left = Math.round(posX - frameW / 2);
  const top = Math.round(posY - frameH / 2);
  run(`magick "${battleBg}" "${samplePng}" -geometry +${left}+${top} -compose plus -composite -quality 80 "${outCompJpg}"`);
  console.log(`  [Composite] -> ${outCompJpg}`);
}

console.log('Regenerating Yarn-Giant Boss & Enemy VFX Set (Q7)...');

// ----------------------------------------------------------------------
// 1. YARN-GIANT CHARGE SWIRL (4x4 256x256 frames, 1024x1024 atlas)
// ----------------------------------------------------------------------
console.log('Building yarn-giant-charge-swirl flipbook...');
{
  const framesDir = path.join(workBase, 'charge_frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

  const rawYarnVortex = '/Users/bao/th-v5-ag2/work/v5/AG2/raw/yarn-vortex-gen.jpg';
  const frameFiles = [];

  for (let f = 0; f < 16; f++) {
    const framePath = path.join(framesDir, `frame_${String(f).padStart(2, '0')}.png`);
    const progress = f / 15;
    const rot = (f * 24).toFixed(1); // Rapid rotation
    // Zoom in toward center as charge condenses: scale up from 256 to 360, crop center 256
    const sz = Math.round(256 + progress * 120);
    const C = 128;

    // First, crop and rotate a section from the raw generated yarn vortex
    const baseFrame = path.join(framesDir, `base_${f}.png`);
    run(`magick "${rawYarnVortex}" -resize ${sz}x${sz} -gravity center -crop 256x256+0+0 +repage -background black -rotate ${rot} -gravity center -crop 256x256+0+0 +repage -black-threshold 6% "${baseFrame}"`);

    // Draw glowing woolen thread spirals and intensifying white core over base
    const coreRad = Math.round(10 + progress * 24);
    const intensity = (0.4 + progress * 0.6).toFixed(2);
    const draws = [
      `fill "rgba(255, 255, 255, ${intensity})" circle ${C},${C} ${C + coreRad * 0.6},${C}`,
      `fill "rgba(255, 120, 150, ${intensity})" circle ${C},${C} ${C + coreRad},${C}`,
      `fill "rgba(180, 20, 50, 0.45)" circle ${C},${C} ${C + coreRad * 1.8},${C}`,
    ];

    // Swirling red and indigo yarn fibers
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI) / 3 + progress * 3.0;
      const r = 40 + progress * 35;
      const x1 = C + Math.cos(ang) * (r * 0.4);
      const y1 = C + Math.sin(ang) * (r * 0.4);
      const x2 = C + Math.cos(ang + 0.9) * r;
      const y2 = C + Math.sin(ang + 0.9) * r;
      const col = i % 2 === 0 ? `rgba(230, 57, 70, 0.8)` : `rgba(69, 123, 157, 0.8)`;
      draws.push(`stroke "${col}" stroke-width 3 fill none bezier ${x1.toFixed(1)},${y1.toFixed(1)} ${C},${C} ${x2.toFixed(1)},${y2.toFixed(1)}`);
    }

    run(`magick "${baseFrame}" -draw '${draws.join(' ')}' -blur 0x1.0 "${framePath}"`);
    frameFiles.push(`"${framePath}"`);
  }

  const stitchedPng = path.join(workBase, 'yarn_giant_charge_stitched.png');
  run(`magick montage ${frameFiles.join(' ')} -tile 4x4 -geometry 256x256+0+0 -background black "${stitchedPng}"`);

  const outWebp = path.join(vfxDir, 'yarn-giant-charge-swirl.webp');
  toWebP(stitchedPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeEffect(outWebp, path.join(compDir, 'yarn-giant-charge-swirl.jpg'), 480, 270, 256, 256, true);
}

// ----------------------------------------------------------------------
// 2. YARN-GIANT SHOCKWAVE RING (4x4 256x256 frames, 1024x1024 atlas)
// ----------------------------------------------------------------------
console.log('Building yarn-giant-shockwave-ring flipbook...');
{
  const framesDir = path.join(workBase, 'shockwave_frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });
  const frameFiles = [];

  for (let f = 0; f < 16; f++) {
    const framePath = path.join(framesDir, `frame_${String(f).padStart(2, '0')}.png`);
    const C = 128;
    const draws = [];

    if (f <= 2) {
      // Violent initial wool detonation flash
      const rCore = 18 + f * 20;
      const rGlow = 36 + f * 34;
      draws.push(`fill "white" circle ${C},${C} ${C + rCore},${C}`);
      draws.push(`fill "rgba(255, 140, 160, 0.9)" circle ${C},${C} ${C + rGlow},${C}`);
      draws.push(`fill "rgba(155, 29, 32, 0.6)" circle ${C},${C} ${C + rGlow + 30},${C}`);
    } else if (f <= 8) {
      // Expanding braided woolen yarn shockwave ring
      const expand = (f - 2) / 6;
      const rCore = 26 * (1 - expand * 0.6);
      const rWave = 45 + expand * 75;
      const alpha = (1 - expand * 0.35).toFixed(2);

      draws.push(`fill "white" circle ${C},${C} ${C + rCore},${C}`);
      draws.push(`fill "rgba(255, 160, 180, ${alpha})" circle ${C},${C} ${C + rCore * 2},${C}`);

      // Braided crimson yarn ring
      draws.push(`stroke "rgba(230, 57, 70, ${alpha})" stroke-width 6 fill "rgba(180, 20, 50, 0.18)" circle ${C},${C} ${C + rWave},${C}`);
      // Interwoven indigo wool thread ring
      draws.push(`stroke "rgba(69, 123, 157, ${alpha})" stroke-width 3.5 stroke-dasharray 12,8 fill none circle ${C},${C} ${C + rWave - 6},${C}`);

      // Flying fleece tufts and snapped thread ends
      for (let t = 0; t < 16; t++) {
        const ang = (t * Math.PI * 2) / 16 + expand * 0.3;
        const dist = rWave + 12 + (t % 3) * 10;
        const tx = C + Math.cos(ang) * dist;
        const ty = C + Math.sin(ang) * dist;
        const col = t % 2 === 0 ? `rgba(255, 180, 190, ${alpha})` : `rgba(130, 190, 230, ${alpha})`;
        draws.push(`stroke "${col}" stroke-width 2 fill none line ${tx.toFixed(1)},${ty.toFixed(1)} ${(tx + (t % 2 === 0 ? 6 : -6)).toFixed(1)},${(ty + 8).toFixed(1)}`);
      }
    } else {
      // Dissipating wool lint and floating fleece particles
      const diss = (f - 8) / 7;
      const alpha = ((1 - diss) * 0.6).toFixed(2);
      const rOuter = 85 + diss * 35;

      draws.push(`stroke "rgba(200, 45, 60, ${alpha})" stroke-width 3.5 stroke-dasharray 10,12 fill none circle ${C},${C} ${C + rOuter},${C}`);

      for (let p = 0; p < 18; p++) {
        const ang = (p * Math.PI * 2) / 18 + p * 0.35;
        const dist = 40 + diss * 68 + (p % 4) * 12;
        const px = C + Math.cos(ang) * dist;
        const py = C + Math.sin(ang) * dist;
        const col = p % 2 === 0 ? `rgba(255, 140, 160, ${alpha})` : `rgba(100, 160, 210, ${alpha})`;
        draws.push(`fill "${col}" circle ${px.toFixed(1)},${py.toFixed(1)} ${(px + 2.5).toFixed(1)},${py.toFixed(1)}`);
      }
    }

    run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.5 "${framePath}"`);
    frameFiles.push(`"${framePath}"`);
  }

  const stitchedPng = path.join(workBase, 'yarn_giant_shockwave_stitched.png');
  run(`magick montage ${frameFiles.join(' ')} -tile 4x4 -geometry 256x256+0+0 -background black "${stitchedPng}"`);

  const outWebp = path.join(vfxDir, 'yarn-giant-shockwave-ring.webp');
  toWebP(stitchedPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeEffect(outWebp, path.join(compDir, 'yarn-giant-shockwave-ring.jpg'), 480, 270, 256, 256, true);
}

// ----------------------------------------------------------------------
// 3. YARN-GIANT GROUND CRACK (512x512 single - torn canvas & woolen seams)
// ----------------------------------------------------------------------
console.log('Building yarn-giant-ground-crack...');
{
  const outPng = path.join(workBase, 'yarn_ground_crack_v2.png');
  const outWebp = path.join(vfxDir, 'yarn-giant-ground-crack.webp');
  const C = 256;
  const draws = [];

  // Incandescent crimson core crater bloom
  draws.push(`fill "rgba(255, 255, 255, 0.95)" circle ${C},${C} ${C + 25},${C}`);
  draws.push(`fill "rgba(255, 120, 140, 0.85)" circle ${C},${C} ${C + 60},${C}`);
  draws.push(`fill "rgba(180, 25, 45, 0.5)" circle ${C},${C} ${C + 115},${C}`);

  // Torn canvas jagged fissure paths radiating in 8 directions
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4 + 0.15;
    const r1 = 30;
    const r2 = 140 + (i % 3) * 35;
    const r3 = 215 + (i % 2) * 25;

    const x1 = C + Math.cos(ang) * r1;
    const y1 = C + Math.sin(ang) * r1;
    const jx = C + Math.cos(ang + 0.12) * r2;
    const jy = C + Math.sin(ang + 0.12) * r2;
    const x3 = C + Math.cos(ang - 0.08) * r3;
    const y3 = C + Math.sin(ang - 0.08) * r3;

    // Fissure tear lines
    draws.push(`stroke "rgba(255, 100, 120, 0.9)" stroke-width 4.5 fill none line ${x1.toFixed(1)},${y1.toFixed(1)} ${jx.toFixed(1)},${jy.toFixed(1)}`);
    draws.push(`stroke "rgba(230, 40, 60, 0.75)" stroke-width 3 fill none line ${jx.toFixed(1)},${jy.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)}`);

    // Woolen cross-thread stitches bridging the fissure
    for (let s = 1; s <= 4; s++) {
      const frac = s / 5;
      const sx = x1 + (jx - x1) * frac;
      const sy = y1 + (jy - y1) * frac;
      const normAng = ang + Math.PI / 2;
      const nx1 = sx + Math.cos(normAng) * 9;
      const ny1 = sy + Math.sin(normAng) * 9;
      const nx2 = sx - Math.cos(normAng) * 9;
      const ny2 = sy - Math.sin(normAng) * 9;
      draws.push(`stroke "rgba(69, 123, 157, 0.85)" stroke-width 2.5 fill none line ${nx1.toFixed(1)},${ny1.toFixed(1)} ${nx2.toFixed(1)},${ny2.toFixed(1)}`);
    }
  }

  // Frayed wool fibers scattering along the tears
  for (let w = 0; w < 24; w++) {
    const ang = (w * Math.PI * 2) / 24 + (w % 4) * 0.1;
    const dist = 70 + (w * 19) % 130;
    const wx = C + Math.cos(ang) * dist;
    const wy = C + Math.sin(ang) * dist;
    draws.push(`fill "rgba(255, 160, 180, 0.85)" circle ${wx.toFixed(1)},${wy.toFixed(1)} ${(wx + 3).toFixed(1)},${wy.toFixed(1)}`);
  }

  run(`magick -size 512x512 xc:black -draw '${draws.join(' ')}' -blur 0x1.6 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeEffect(outWebp, path.join(compDir, 'yarn-giant-ground-crack.jpg'), 500, 380, 420, 420, false);
}

// ----------------------------------------------------------------------
// 4. ENEMY HIT SPARKS (128x128 singles x 3)
// ----------------------------------------------------------------------
console.log('Building enemy hit sparks 1-3...');
{
  const C = 64;

  // Spark 1: Snapped needle glint with crimson silk thread fragment
  {
    const outPng = path.join(workBase, 'enemy_spark_1.png');
    const outWebp = path.join(vfxDir, 'enemy-hit-spark-1.webp');
    const draws = [
      `fill "white" circle ${C},${C} ${C + 6},${C}`,
      `stroke "rgba(255, 255, 255, 0.95)" stroke-width 3.5 fill none line ${C - 32},${C} ${C + 32},${C}`,
      `stroke "rgba(255, 220, 240, 0.85)" stroke-width 2.5 fill none line ${C},${C - 24} ${C},${C + 24}`,
      // Whipping crimson thread barb
      `stroke "rgba(230, 50, 75, 0.85)" stroke-width 2 fill none bezier ${C + 16},${C} ${C + 26},${C - 16} ${C + 38},${C + 12}`,
    ];
    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${outPng}"`);
    toWebP(outPng, outWebp, 85);
    console.log(`  -> ${outWebp}`);
  }

  // Spark 2: Boiling brass kettle steam pop with golden sizzle sparks
  {
    const outPng = path.join(workBase, 'enemy_spark_2.png');
    const outWebp = path.join(vfxDir, 'enemy-hit-spark-2.webp');
    const draws = [
      `fill "white" circle ${C},${C} ${C + 7},${C}`,
      `fill "rgba(255, 225, 100, 0.85)" circle ${C},${C} ${C + 18},${C}`,
      `fill "rgba(220, 130, 25, 0.5)" circle ${C},${C} ${C + 32},${C}`,
      // Sizzling steam droplets
      `fill "rgba(255, 245, 160, 0.9)" circle ${C - 18},${C - 14} ${C - 15},${C - 14}`,
      `fill "rgba(255, 210, 80, 0.85)" circle ${C + 20},${C + 12} ${C + 23},${C + 12}`,
      `fill "rgba(255, 180, 40, 0.8)" circle ${C - 12},${C + 22} ${C - 9},${C + 22}`,
    ];
    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${outPng}"`);
    toWebP(outPng, outWebp, 85);
    console.log(`  -> ${outWebp}`);
  }

  // Spark 3: Tangled woolen lint filament starburst
  {
    const outPng = path.join(workBase, 'enemy_spark_3.png');
    const outWebp = path.join(vfxDir, 'enemy-hit-spark-3.webp');
    const draws = [
      `fill "white" circle ${C},${C} ${C + 5},${C}`,
      `fill "rgba(255, 140, 170, 0.8)" circle ${C},${C} ${C + 15},${C}`,
    ];
    // 8 Multi-directional frayed wool thread rays
    for (let r = 0; r < 8; r++) {
      const ang = (r * Math.PI) / 4 + 0.2;
      const len = 24 + (r % 3) * 6;
      const x2 = C + Math.cos(ang) * len;
      const y2 = C + Math.sin(ang) * len;
      const col = r % 2 === 0 ? `rgba(230, 57, 70, 0.85)` : `rgba(69, 123, 157, 0.85)`;
      draws.push(`stroke "${col}" stroke-width 2 fill none line ${C},${C} ${x2.toFixed(1)},${y2.toFixed(1)}`);
    }
    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${outPng}"`);
    toWebP(outPng, outWebp, 85);
    console.log(`  -> ${outWebp}`);
  }
}

// ----------------------------------------------------------------------
// 5. ENEMY DEATH DISSOLVE (512x512 tileable woven fabric thread noise)
// ----------------------------------------------------------------------
console.log('Building enemy-death-dissolve (woven cloth noise)...');
{
  const outPng = path.join(workBase, 'death_dissolve_v2.png');
  const outWebp = path.join(vfxDir, 'enemy-death-dissolve.webp');

  // Generate multi-octave plasma noise with woven fabric frequency modulation
  // 1. Base perlin-style plasma noise
  const plasma1 = path.join(workBase, 'plasma1.png');
  const plasma2 = path.join(workBase, 'plasma2.png');
  run(`magick -size 512x512 plasma:fractal -colorspace gray "${plasma1}"`);
  run(`magick -size 512x512 plasma:fractal -colorspace gray -blur 0x4 "${plasma2}"`);

  // Blend with subtle horizontal and vertical thread scanlines
  run(`magick "${plasma1}" "${plasma2}" -compose blend -define compose:args=60,40 -composite -contrast-stretch 2%x2% "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
}

// ----------------------------------------------------------------------
// 6. BOSS & ENEMY MONTAGES
// ----------------------------------------------------------------------
const montageOut = '/Users/bao/th-v5-ag2/reports/v5/AG2/T2/boss-enemy-montage.jpg';
const bossFiles = [
  `${vfxDir}/yarn-giant-charge-swirl.webp`,
  `${vfxDir}/yarn-giant-shockwave-ring.webp`,
  `${vfxDir}/yarn-giant-ground-crack.webp`,
  `${vfxDir}/enemy-hit-spark-1.webp`,
  `${vfxDir}/enemy-hit-spark-2.webp`,
  `${vfxDir}/enemy-hit-spark-3.webp`,
  `${vfxDir}/enemy-death-dissolve.webp`
];
run(`magick montage ${bossFiles.map(f => `"${f}"`).join(' ')} -tile 4x2 -geometry 256x256+4+4 -background "#0a0a0a" -quality 80 "${montageOut}"`);
console.log(`  -> Boss Montage: ${montageOut}`);
