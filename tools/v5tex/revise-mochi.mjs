#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AG2/jobs/mochi_v3';
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

console.log('Revising Mochi Ancillaries with Stitched-Shield Motif & Honey/Gold Palette...');

// ----------------------------------------------------------------------
// 1. ANTICIPATION GLOW: Stitched Fabric Shield Crest with Honey/Gold Core
// ----------------------------------------------------------------------
export function buildStitchedAnticipation() {
  const outPng = path.join(workBase, 'mochi_anticipation_v3.png');
  const outWebp = path.join(vfxDir, 'mochi-anticipation.webp');
  const C = 128;
  const draws = [];

  // 1. Soft painted warm honey-amber radial underglow
  draws.push(`fill "rgba(255, 255, 245, 0.95)" circle ${C},${C} ${C + 18},${C}`);
  draws.push(`fill "rgba(255, 230, 160, 0.85)" circle ${C},${C} ${C + 45},${C}`);
  draws.push(`fill "rgba(245, 175, 55, 0.6)" circle ${C},${C} ${C + 80},${C}`);
  draws.push(`fill "rgba(180, 70, 20, 0.3)" circle ${C},${C} ${C + 115},${C}`);

  // 2. Hand-painted stitched cloth shield silhouette (kite/heater shield form)
  // Coordinates for a curved shield centered at (128, 128):
  // Top-left: (75, 75), Top-center indent: (128, 88), Top-right: (181, 75)
  // Mid-left: (68, 135), Mid-right: (188, 135)
  // Bottom point: (128, 195)
  const shieldPath = `M 128,86 C 145,80 170,72 184,76 C 190,95 190,135 178,160 C 165,180 145,192 128,198 C 111,192 91,180 78,160 C 66,135 66,95 72,76 C 86,72 111,80 128,86 Z`;
  draws.push(`stroke "rgba(255, 240, 180, 0.9)" stroke-width 4.5 fill "rgba(255, 195, 70, 0.25)" path "${shieldPath}"`);

  // 3. Stitched yarn thread dashes around shield perimeter
  const innerStitchPath = `M 128,94 C 142,89 162,82 174,86 C 178,102 178,133 169,152 C 158,168 142,178 128,183 C 114,178 98,168 87,152 C 78,133 78,102 82,86 C 94,82 114,89 128,94 Z`;
  draws.push(`stroke "rgba(255, 255, 240, 0.95)" stroke-width 2.5 stroke-dasharray 6,5 fill none path "${innerStitchPath}"`);

  // 4. Strawberry silk embroidery cross-stitches at cardinal points
  // Cross stitch at center top, center, and bottom
  const crosses = [
    [128, 128], [128, 105], [128, 160], [102, 128], [154, 128]
  ];
  for (const [cx, cy] of crosses) {
    draws.push(`stroke "rgba(255, 95, 140, 0.85)" stroke-width 2.5 line ${cx - 7},${cy - 7} ${cx + 7},${cy + 7} line ${cx - 7},${cy + 7} ${cx + 7},${cy - 7}`);
  }

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.5 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeEffect(outWebp, path.join(compDir, 'mochi-anticipation.jpg'), 380, 280, 256, 256, false);
}

// ----------------------------------------------------------------------
// 2. PARTICLES: Honey-Gold Thread Knot, Quilted Patch, and Fluffy Cotton Batting
// ----------------------------------------------------------------------
export function buildStitchedParticles() {
  const C = 64;

  // Particle 1: Golden Honey Stitched Knot
  {
    const outPng = path.join(workBase, 'mochi_particle_1_v3.png');
    const outWebp = path.join(vfxDir, 'mochi-particle-1.webp');
    const draws = [
      `fill "white" circle ${C},${C} ${C + 6},${C}`,
      `fill "rgba(255, 240, 180, 0.9)" circle ${C},${C} ${C + 16},${C}`,
      `fill "rgba(245, 170, 50, 0.6)" circle ${C},${C} ${C + 32},${C}`,
      // Stitched thread loop
      `stroke "rgba(255, 255, 220, 0.95)" stroke-width 3 fill none ellipse ${C},${C} 20,12 0,360`,
      `stroke "rgba(255, 90, 135, 0.85)" stroke-width 2.5 fill none ellipse ${C},${C} 12,20 0,360`,
      `stroke "rgba(255, 255, 255, 0.9)" stroke-width 2.5 line ${C - 10},${C - 10} ${C + 10},${C + 10} line ${C - 10},${C + 10} ${C + 10},${C - 10}`,
    ];
    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${outPng}"`);
    toWebP(outPng, outWebp, 85);
    console.log(`  -> ${outWebp}`);
  }

  // Particle 2: Hand-stitched quilted diamond fabric patch
  {
    const outPng = path.join(workBase, 'mochi_particle_2_v3.png');
    const outWebp = path.join(vfxDir, 'mochi-particle-2.webp');
    const draws = [
      `fill "rgba(245, 160, 45, 0.4)" polygon ${C},${C - 28} ${C + 28},${C} ${C},${C + 28} ${C - 28},${C}`,
      `fill "rgba(255, 220, 130, 0.75)" polygon ${C},${C - 20} ${C + 20},${C} ${C},${C + 20} ${C - 20},${C}`,
      `fill "white" circle ${C},${C} ${C + 6},${C}`,
      // Quilted seam stitch lines
      `stroke "rgba(255, 255, 245, 0.95)" stroke-width 2 stroke-dasharray 4,3 fill none polygon ${C},${C - 22} ${C + 22},${C} ${C},${C + 22} ${C - 22},${C}`,
      `stroke "rgba(255, 80, 130, 0.7)" stroke-width 1.5 line ${C},${C - 20} ${C},${C + 20} line ${C - 20},${C} ${C + 20},${C}`,
    ];
    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${outPng}"`);
    toWebP(outPng, outWebp, 85);
    console.log(`  -> ${outWebp}`);
  }

  // Particle 3: Fluffy organic wool tuft / cotton batting with strawberry accent
  {
    const outPng = path.join(workBase, 'mochi_particle_3_v3.png');
    const outWebp = path.join(vfxDir, 'mochi-particle-3.webp');
    const draws = [
      `fill "white" circle ${C},${C} ${C + 8},${C}`,
      `fill "rgba(255, 245, 215, 0.85)" circle ${C - 6},${C + 4} ${C + 10},${C + 4}`,
      `fill "rgba(255, 210, 120, 0.7)" circle ${C + 8},${C - 4} ${C + 20},${C - 4}`,
      `fill "rgba(255, 110, 150, 0.55)" circle ${C - 4},${C - 8} ${C + 8},${C - 8}`,
      `fill "rgba(200, 50, 90, 0.3)" circle ${C + 4},${C + 10} ${C + 18},${C + 10}`,
      // Organic fiber curls
      `stroke "rgba(255, 255, 250, 0.9)" stroke-width 2 fill none bezier ${C - 14},${C + 12} ${C - 6},${C - 16} ${C + 12},${C + 8} ${C + 18},${C - 12}`,
    ];
    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x1.2 "${outPng}"`);
    toWebP(outPng, outWebp, 85);
    console.log(`  -> ${outWebp}`);
  }
}

// ----------------------------------------------------------------------
// 3. GROUND DECAL: Quilted Stitched Shield Rug with Honey/Gold Embroidery
// ----------------------------------------------------------------------
export function buildStitchedGroundDecal() {
  const outPng = path.join(workBase, 'mochi_decal_v3.png');
  const outWebp = path.join(vfxDir, 'mochi-decal.webp');
  const C = 256;
  const draws = [];

  // Central incandescent golden energy bloom
  draws.push(`fill "rgba(255, 255, 255, 0.95)" circle ${C},${C} ${C + 25},${C}`);
  draws.push(`fill "rgba(255, 235, 160, 0.85)" circle ${C},${C} ${C + 65},${C}`);
  draws.push(`fill "rgba(245, 165, 45, 0.45)" circle ${C},${C} ${C + 125},${C}`);

  // Large stitched shield carpet contour on ground
  // Radii: 190 wide, 210 tall
  const shieldOuter = `M 256,66 C 295,54 350,42 380,50 C 392,90 392,175 365,225 C 335,268 295,294 256,306 C 217,294 177,268 147,225 C 120,175 120,90 132,50 C 162,42 217,54 256,66 Z`;
  draws.push(`stroke "rgba(255, 195, 60, 0.85)" stroke-width 7 fill "rgba(240, 150, 40, 0.12)" path "${shieldOuter}"`);

  // Stitched border with dashes
  const shieldInner = `M 256,80 C 290,70 338,58 365,66 C 375,102 375,178 350,220 C 322,258 288,280 256,292 C 224,280 190,258 162,220 C 137,178 137,102 147,66 C 174,58 222,70 256,80 Z`;
  draws.push(`stroke "rgba(255, 255, 230, 0.95)" stroke-width 4 stroke-dasharray 12,8 fill none path "${shieldInner}"`);

  // Quilted diamond stitch grid across the shield interior
  for (let offset = -120; offset <= 120; offset += 40) {
    // Diagonals top-left to bottom-right and top-right to bottom-left
    const yMid = 180;
    const x1 = C + offset - 60;
    const y1 = yMid - 60;
    const x2 = C + offset + 60;
    const y2 = yMid + 60;
    draws.push(`stroke "rgba(255, 215, 120, 0.4)" stroke-width 2 stroke-dasharray 6,6 fill none line ${x1},${y1} ${x2},${y2}`);
    draws.push(`stroke "rgba(255, 215, 120, 0.4)" stroke-width 2 stroke-dasharray 6,6 fill none line ${x1},${y2} ${x2},${y1}`);
  }

  // Strawberry silk cross-stitches along the 4 cardinal vertices
  const decorativeStitches = [
    [256, 115], [256, 250], [180, 175], [332, 175],
    [210, 130], [302, 130], [210, 220], [302, 220]
  ];
  for (const [sx, sy] of decorativeStitches) {
    draws.push(`stroke "rgba(255, 80, 135, 0.85)" stroke-width 3 line ${sx - 8},${sy - 8} ${sx + 8},${sy + 8} line ${sx - 8},${sy + 8} ${sx + 8},${sy - 8}`);
  }

  // Soft organic fiber fringe around bottom edge
  for (let f = 0; f < 14; f++) {
    const fx = 160 + f * 14;
    const fy = 240 + Math.sin(f * 0.4) * 45;
    const len = 15 + (f % 3) * 6;
    draws.push(`stroke "rgba(255, 180, 60, 0.6)" stroke-width 2 fill none line ${fx},${fy} ${fx + (f % 2 === 0 ? 4 : -4)},${fy + len}`);
  }

  run(`magick -size 512x512 xc:black -draw '${draws.join(' ')}' -blur 0x1.8 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  console.log(`  -> ${outWebp}`);
  compositeEffect(outWebp, path.join(compDir, 'mochi-decal.jpg'), 500, 380, 420, 420, false);
}

// Build revised assets
buildStitchedAnticipation();
buildStitchedParticles();
buildStitchedGroundDecal();

// Re-generate Mochi montage
const montageOut = '/Users/bao/th-v5-ag2/reports/v5/AG2/T1/mochi-montage.jpg';
run(`magick montage "${vfxDir}/mochi-anticipation.webp" "${vfxDir}/mochi-slash.webp" "${vfxDir}/mochi-impact.webp" "${vfxDir}/mochi-decal.webp" -geometry 256x256+4+4 -background "#0a0a0a" -quality 80 "${montageOut}"`);
console.log(`  -> Updated Montage: ${montageOut}`);
