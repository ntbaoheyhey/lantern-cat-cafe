#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AGV/jobs/utility_v2';

if (!fs.existsSync(vfxDir)) fs.mkdirSync(vfxDir, { recursive: true });
if (!fs.existsSync(workBase)) fs.mkdirSync(workBase, { recursive: true });

function run(cmd) {
  execSync(cmd, { stdio: 'pipe' });
}

function toWebP(pngIn, webpOut, q = 85) {
  run(`cwebp -q ${q} -alpha_q 90 "${pngIn}" -o "${webpOut}"`);
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

console.log('Regenerating Shared Utility VFX Textures (V2: Painted Organic Matter)...');

// 1. SOFT ORGANIC GLOW DOTS (64x64 and 128x128 - feathered, zero clipping under additive stacking)
{
  // 64x64
  const outPng64 = path.join(workBase, 'util_glow_dot_64.png');
  const outWebp64 = path.join(vfxDir, 'util-glow-dot-64.webp');
  const C64 = 32;
  const draws64 = [
    `fill "rgba(255, 250, 235, 0.7)" stroke none circle ${C64},${C64} ${C64 + 4},${C64}`,
    `fill "rgba(255, 220, 160, 0.45)" stroke none circle ${C64},${C64} ${C64 + 10},${C64}`,
    `fill "rgba(255, 180, 100, 0.20)" stroke none circle ${C64},${C64} ${C64 + 18},${C64}`,
    `fill "rgba(220, 120, 50, 0.08)" stroke none circle ${C64},${C64} ${C64 + 26},${C64}`
  ];
  run(`magick -size 64x64 xc:black -draw '${draws64.join(' ')}' -blur 0x2.0 "${outPng64}"`);
  toWebP(outPng64, outWebp64);

  // 128x128
  const outPng128 = path.join(workBase, 'util_glow_dot_128.png');
  const outWebp128 = path.join(vfxDir, 'util-glow-dot-128.webp');
  const C128 = 64;
  const draws128 = [
    `fill "rgba(255, 250, 235, 0.75)" stroke none circle ${C128},${C128} ${C128 + 8},${C128}`,
    `fill "rgba(255, 220, 160, 0.48)" stroke none circle ${C128},${C128} ${C128 + 20},${C128}`,
    `fill "rgba(255, 180, 100, 0.22)" stroke none circle ${C128},${C128} ${C128 + 36},${C128}`,
    `fill "rgba(220, 120, 50, 0.09)" stroke none circle ${C128},${C128} ${C128 + 52},${C128}`
  ];
  run(`magick -size 128x128 xc:black -draw '${draws128.join(' ')}' -blur 0x3.0 "${outPng128}"`);
  toWebP(outPng128, outWebp128);
  console.log(`  -> ${outWebp64}, ${outWebp128}`);
}

// 2. STAR SPARKLE 4x4 FLIPBOOK (Organic needle glint with asymmetric ray breakup)
{
  console.log('Building util-star-sparkle...');
  const sparkleWork = path.join(workBase, 'sparkle_frames');
  if (!fs.existsSync(sparkleWork)) fs.mkdirSync(sparkleWork, { recursive: true });

  const N = 16;
  const C = 64;
  const frameFiles = [];

  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const framePng = path.join(sparkleWork, `f_${String(i).padStart(2, '0')}.png`);
    const draws = [];

    const scale = Math.sin(t * Math.PI);
    const alpha = (Math.sin(t * Math.PI) * 0.95).toFixed(2);
    const rot = t * Math.PI * 0.4;

    if (scale > 0.05) {
      // 4 faceted needle-glint rays with organic length variance
      const rayLens = [38 * scale, 22 * scale, 34 * scale, 18 * scale];
      for (let r = 0; r < 4; r++) {
        const ang = rot + (r * Math.PI) / 2;
        const len = rayLens[r];
        const tipX = C + Math.cos(ang) * len;
        const tipY = C + Math.sin(ang) * len;
        draws.push(`stroke "rgba(255, 250, 230, ${alpha})" stroke-width 2 fill none line ${C},${C} ${tipX.toFixed(1)},${tipY.toFixed(1)}`);
      }

      // 4 diagonal warm golden flecks
      for (let d = 0; d < 4; d++) {
        const dang = rot + Math.PI / 4 + (d * Math.PI) / 2;
        const dlen = 16 * scale;
        const dx = C + Math.cos(dang) * dlen;
        const dy = C + Math.sin(dang) * dlen;
        draws.push(`fill "rgba(255, 220, 110, ${alpha})" stroke none circle ${dx.toFixed(1)},${dy.toFixed(1)} ${(dx + 1.8).toFixed(1)},${dy.toFixed(1)}`);
      }

      // Small central diamond highlight
      draws.push(`fill "white" stroke none polygon ${C},${C - 6 * scale} ${C + 4 * scale},${C} ${C},${C + 6 * scale} ${C - 4 * scale},${C}`);
      draws.push(`fill "rgba(255, 235, 160, ${(alpha * 0.5).toFixed(2)})" stroke none circle ${C},${C} ${(C + 10 * scale).toFixed(1)},${C}`);
    }

    const drawArg = draws.length > 0 ? `-draw '${draws.join(' ')}'` : '';
    run(`magick -size 128x128 xc:black ${drawArg} -blur 0x0.8 "${framePng}"`);
    frameFiles.push(`"${framePng}"`);
  }

  const atlasPng = path.join(workBase, 'util_star_sparkle_atlas.png');
  run(`magick montage ${frameFiles.join(' ')} -tile 4x4 -geometry 128x128+0+0 -background black "${atlasPng}"`);
  const outWebp = path.join(vfxDir, 'util-star-sparkle.webp');
  toWebP(atlasPng, outWebp);
  console.log(`  -> ${outWebp}`);
}

// 3. HEAL PLUS (Soft botanical cross of 4 budding clover leaflets)
{
  console.log('Building util-heal-plus...');
  const outPng = path.join(workBase, 'util_heal_plus.png');
  const outWebp = path.join(vfxDir, 'util-heal-plus.webp');
  const C = 64;
  const draws = [];

  // 4 budding emerald leaflets forming an organic botanical cross (not a flat UI icon)
  for (let i = 0; i < 4; i++) {
    const ang = (i * Math.PI) / 2;
    draws.push(drawPetal(C, C, 22, 12, ang, 'rgba(100, 230, 140, 0.85)', 'rgba(40, 160, 70, 0.8)'));
    draws.push(drawPetal(C, C, 14, 7, ang, 'rgba(210, 255, 220, 0.95)', 'rgba(80, 210, 120, 0.7)'));
  }

  // Dewy central core
  draws.push(`fill "white" stroke none circle ${C},${C} ${C + 4},${C}`);
  draws.push(`fill "rgba(230, 255, 240, 0.5)" stroke none circle ${C},${C} ${C + 12},${C}`);

  run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x0.8 "${outPng}"`);
  toWebP(outPng, outWebp);
  console.log(`  -> ${outWebp}`);
}

// 4. LEAF PARTICLE (Painted botanical tea leaf with layered shading and delicate veins)
{
  console.log('Building util-leaf-particle...');
  const outPng = path.join(workBase, 'util_leaf_particle.png');
  const outWebp = path.join(vfxDir, 'util-leaf-particle.webp');
  const C = 64;
  const draws = [];

  // Organic tilted tea leaf
  draws.push(drawPetal(C - 10, C + 14, 38, 18, -0.7, 'rgba(60, 190, 85, 0.9)', 'rgba(30, 120, 50, 0.85)'));
  draws.push(drawPetal(C - 6, C + 10, 28, 11, -0.7, 'rgba(140, 235, 155, 0.85)'));

  // Delicate center vein & side ribs
  const tipX = (C - 10) + Math.cos(-0.7) * 36;
  const tipY = (C + 14) + Math.sin(-0.7) * 36;
  draws.push(`stroke "rgba(220, 255, 230, 0.95)" stroke-width 1.5 fill none line ${C - 8},${C + 12} ${tipX.toFixed(1)},${tipY.toFixed(1)}`);

  run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x0.8 "${outPng}"`);
  toWebP(outPng, outWebp);
  console.log(`  -> ${outWebp}`);
}

// 5. SHIELD HEX RIPPLE (Woven silk honeycomb ripple with yarn cross-stitches)
{
  console.log('Building util-shield-hex-ripple...');
  const hexWork = path.join(workBase, 'hex_frames');
  if (!fs.existsSync(hexWork)) fs.mkdirSync(hexWork, { recursive: true });

  const N = 16;
  const C = 64;
  const frameFiles = [];

  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const framePng = path.join(hexWork, `f_${String(i).padStart(2, '0')}.png`);
    const draws = [];

    const hexR = 8 + 48 * Math.pow(t, 0.7);
    const alpha = Math.max(0, 1.0 - Math.pow(t, 1.3));

    if (alpha > 0.03) {
      const pts = [];
      for (let h = 0; h < 6; h++) {
        const ang = (h * Math.PI) / 3;
        const px = C + Math.cos(ang) * hexR;
        const py = C + Math.sin(ang) * hexR;
        pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
      }

      // Woven silk perimeter cord
      draws.push(`stroke "rgba(90, 190, 255, ${(alpha * 0.9).toFixed(2)})" stroke-width ${(3.5 * (1 - t * 0.5)).toFixed(1)} fill "rgba(40, 120, 220, ${(alpha * 0.12).toFixed(2)})" polygon ${pts.join(' ')}`);

      // Inner woven echo
      if (hexR > 18) {
        const inPts = [];
        const inR = hexR * 0.75;
        for (let h = 0; h < 6; h++) {
          const ang = (h * Math.PI) / 3;
          const px = C + Math.cos(ang) * inR;
          const py = C + Math.sin(ang) * inR;
          inPts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
        }
        draws.push(`stroke "rgba(180, 235, 255, ${(alpha * 0.7).toFixed(2)})" stroke-width 1.8 fill none polygon ${inPts.join(' ')}`);
      }

      // Cross-stitches at hexagon vertices
      for (let h = 0; h < 6; h++) {
        const ang = (h * Math.PI) / 3;
        const px = C + Math.cos(ang) * hexR;
        const py = C + Math.sin(ang) * hexR;
        draws.push(`stroke "rgba(255, 255, 255, ${(alpha * 0.95).toFixed(2)})" stroke-width 1.5 line ${px - 2},${py - 2} ${px + 2},${py + 2} line ${px - 2},${py + 2} ${px + 2},${py - 2}`);
      }
    }

    const drawArg = draws.length > 0 ? `-draw '${draws.join(' ')}'` : '';
    run(`magick -size 128x128 xc:black ${drawArg} -blur 0x0.8 "${framePng}"`);
    frameFiles.push(`"${framePng}"`);
  }

  const atlasPng = path.join(workBase, 'util_shield_hex_ripple_atlas.png');
  run(`magick montage ${frameFiles.join(' ')} -tile 4x4 -geometry 128x128+0+0 -background black "${atlasPng}"`);
  const outWebp = path.join(vfxDir, 'util-shield-hex-ripple.webp');
  toWebP(atlasPng, outWebp);
  console.log(`  -> ${outWebp}`);
}

console.log('All Shared Utility VFX textures regenerated.');
