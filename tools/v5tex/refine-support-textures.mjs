#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AGV/jobs/refine_support';

if (!fs.existsSync(vfxDir)) fs.mkdirSync(vfxDir, { recursive: true });
if (!fs.existsSync(workBase)) fs.mkdirSync(workBase, { recursive: true });

function run(cmd) {
  execSync(cmd, { stdio: 'pipe' });
}

function toWebP(pngIn, webpOut, q = 80) {
  run(`cwebp -q ${q} -alpha_q 90 "${pngIn}" -o "${webpOut}"`);
}

function drawBlob(cx, cy, radius, numLobes, seed, fillCol) {
  const pts = [];
  const steps = numLobes * 4;
  for (let i = 0; i < steps; i++) {
    const a = (i * Math.PI * 2) / steps;
    const lobeMod = 0.75 + 0.35 * Math.sin(a * numLobes + seed);
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

function drawSplatter(cx, cy, L, W, ang, fillCol) {
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  const perpCos = -sin;
  const perpSin = cos;

  const tipX = cx + cos * L;
  const tipY = cy + sin * L;
  const c1x = cx + cos * (L * 0.4) + perpCos * (W * 0.5);
  const c1y = cy + sin * (L * 0.4) + perpSin * (W * 0.5);
  const c2x = cx + cos * (L * 0.4) - perpCos * (W * 0.5);
  const c2y = cy + sin * (L * 0.4) - perpSin * (W * 0.5);

  return `fill "${fillCol}" stroke none path "M ${cx.toFixed(1)},${cy.toFixed(1)} Q ${c1x.toFixed(1)},${c1y.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)} Q ${c2x.toFixed(1)},${c2y.toFixed(1)} ${cx.toFixed(1)},${cy.toFixed(1)} Z"`;
}

console.log('Refining target support textures based on CXV REVIEW-R1-SUPPORT-V2 feedback...');

// 1. YARN-GIANT CHARGE SWIRL (Add frayed woolen yarn whiskers and knot curls into spiral)
{
  console.log('Refining yarn-giant-charge-swirl (adding organic frayed yarn fiber details)...');
  const inAtlas = path.join(vfxDir, 'yarn-giant-charge-swirl.webp');
  const tempAtlasPng = path.join(workBase, 'charge_swirl_base.png');
  const outAtlasPng = path.join(workBase, 'charge_swirl_frayed.png');
  const outWebp = path.join(vfxDir, 'yarn-giant-charge-swirl.webp');

  // Decompose atlas into 16 frames of 256x256, add frayed thread overlays, and re-stitch
  const framesDir = path.join(workBase, 'swirl_frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

  run(`magick "${inAtlas}" "${tempAtlasPng}"`);
  run(`magick "${tempAtlasPng}" -crop 256x256 +repage "${framesDir}/f_%02d.png"`);

  const frameFiles = [];
  for (let f = 0; f < 16; f++) {
    const fPath = path.join(framesDir, `f_${String(f).padStart(2, '0')}.png`);
    const C = 128;
    const phase = (f * Math.PI * 2) / 16;
    const draws = [];

    // Add 8 curling frayed woolen fiber whiskers trailing along spiral arm
    for (let i = 0; i < 8; i++) {
      const ang = phase * 1.5 + (i * Math.PI * 2) / 8;
      const dist = 32 + (i * 9 + f * 4) % 65;
      const x1 = C + Math.cos(ang) * dist;
      const y1 = C + Math.sin(ang) * dist;
      const x2 = C + Math.cos(ang + 0.35) * (dist + 16);
      const y2 = C + Math.sin(ang + 0.35) * (dist + 16);
      const midX = (x1 + x2) * 0.5 + Math.sin(ang * 3) * 6;
      const midY = (y1 + y2) * 0.5 - Math.cos(ang * 3) * 6;

      draws.push(`stroke "rgba(255, 175, 195, 0.75)" stroke-width 2 fill none path "M ${x1.toFixed(1)},${y1.toFixed(1)} Q ${midX.toFixed(1)},${midY.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}"`);
      draws.push(drawFlake(x2, y2, 3.5, 4, i + f, 'rgba(255, 220, 235, 0.85)'));
    }

    run(`magick "${fPath}" -draw '${draws.join(' ')}' -blur 0x0.7 "${fPath}"`);
    frameFiles.push(`"${fPath}"`);
  }

  run(`magick montage ${frameFiles.join(' ')} -tile 4x4 -geometry 256x256+0+0 -background black "${outAtlasPng}"`);
  toWebP(outAtlasPng, outWebp, 76);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// 2. YARN-GIANT GROUND CRACK (Deep branching fissures with irregular widths, wooden splinter edges, frayed burlap threads)
{
  console.log('Refining yarn-giant-ground-crack...');
  const outPng = path.join(workBase, 'yarn_ground_crack_v4.png');
  const outWebp = path.join(vfxDir, 'yarn-giant-ground-crack.webp');
  const C = 256;
  const draws = [];

  // Deep irregular central crater
  draws.push(drawBlob(C, C, 65, 8, 1, 'rgba(175, 20, 40, 0.85)'));
  draws.push(drawBlob(C, C, 40, 7, 2, 'rgba(50, 70, 190, 0.88)'));
  draws.push(drawBlob(C, C, 20, 6, 3, 'rgba(255, 240, 245, 0.95)'));

  // 14 Irregular jagged branching fissures
  for (let i = 0; i < 14; i++) {
    const baseAng = (i * Math.PI * 2) / 14 + 0.18 * Math.sin(i * 3);
    const r1 = 50 + (i % 3) * 22;
    const r2 = 130 + (i % 4) * 28;
    const r3 = 210 + (i % 3) * 25;

    const p0x = C + Math.cos(baseAng) * 32;
    const p0y = C + Math.sin(baseAng) * 32;
    const p1x = C + Math.cos(baseAng + 0.12) * r1;
    const p1y = C + Math.sin(baseAng + 0.12) * r1;
    const p2x = C + Math.cos(baseAng - 0.09) * r2;
    const p2y = C + Math.sin(baseAng - 0.09) * r2;
    const p3x = C + Math.cos(baseAng + 0.07) * r3;
    const p3y = C + Math.sin(baseAng + 0.07) * r3;

    const col = i % 2 === 0 ? 'rgba(235, 45, 65, 0.92)' : 'rgba(70, 105, 245, 0.92)';
    draws.push(`stroke "${col}" stroke-width 5 fill none line ${p0x.toFixed(1)},${p0y.toFixed(1)} ${p1x.toFixed(1)},${p1y.toFixed(1)} line ${p1x.toFixed(1)},${p1y.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)} line ${p2x.toFixed(1)},${p2y.toFixed(1)} ${p3x.toFixed(1)},${p3y.toFixed(1)}`);

    // Splinter branch off each fissure
    const bAng = baseAng + (i % 2 === 0 ? 0.35 : -0.35);
    const bx = p1x + Math.cos(bAng) * 45;
    const by = p1y + Math.sin(bAng) * 45;
    draws.push(`stroke "rgba(255, 140, 160, 0.85)" stroke-width 2.5 fill none line ${p1x.toFixed(1)},${p1y.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)}`);

    // Burlap cross-stitches bridging the fracture under tension
    const mx = (p1x + p2x) * 0.5;
    const my = (p1y + p2y) * 0.5;
    draws.push(`stroke "rgba(255, 245, 240, 0.95)" stroke-width 3 line ${mx - 9},${my - 9} ${mx + 9},${my + 9} line ${mx - 9},${my + 9} ${mx + 9},${my - 9}`);

    // Dislodged wooden & stone debris along fault lines
    const dx = p2x + Math.sin(baseAng) * 14;
    const dy = p2y - Math.cos(baseAng) * 14;
    draws.push(drawFlake(dx, dy, 7.5, 5, i * 8, 'rgba(210, 45, 75, 0.8)', 'rgba(255, 210, 225, 0.85)'));
  }

  run(`magick -size 512x512 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${outPng}"`);
  toWebP(outPng, outWebp, 80);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// 3. YARN-GIANT SHOCKWAVE RING (Uneven yarn fiber breakup with ragged looping tufts)
{
  console.log('Refining yarn-giant-shockwave-ring...');
  const framesDir = path.join(workBase, 'shockwave_v4_frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });
  const frameFiles = [];

  for (let f = 0; f < 16; f++) {
    const framePath = path.join(framesDir, `frame_${String(f).padStart(2, '0')}.png`);
    const C = 128;
    const draws = [];

    if (f <= 2) {
      const r = 20 + f * 22;
      draws.push(drawBlob(C, C, r * 0.65, 6, f, 'rgba(255, 255, 255, 0.98)'));
      draws.push(drawBlob(C, C, r * 1.15, 7, f * 2, 'rgba(255, 120, 150, 0.85)'));
      draws.push(drawBlob(C, C, r * 1.65, 8, f * 3, 'rgba(180, 20, 50, 0.5)'));
    } else if (f <= 8) {
      const t = (f - 2) / 6;
      const alpha = (1 - t * 0.32).toFixed(2);
      const rBase = 28 + t * 82;

      draws.push(drawBlob(C, C, 18 * (1 - t * 0.6), 5, f, `rgba(255, 255, 255, ${alpha})`));

      // Irregular, ragged tearing yarn loop (wavy polygon with 28 vertices and frayed thread lobes)
      const numPts = 28;
      const pts = [];
      for (let s = 0; s < numPts; s++) {
        const a = (s * Math.PI * 2) / numPts;
        const jitter = Math.sin(a * 7 + t * 5) * 8 + Math.cos(a * 4) * 4;
        const r = rBase + jitter;
        const px = C + Math.cos(a) * r;
        const py = C + Math.sin(a) * (r * 0.88);
        pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
      }
      draws.push(`stroke "rgba(235, 45, 65, ${alpha})" stroke-width 4.5 fill none polygon ${pts.join(' ')}`);
      draws.push(`stroke "rgba(75, 110, 245, ${(alpha * 0.8).toFixed(2)})" stroke-width 2 fill none polygon ${pts.join(' ')}`);

      // 16 Ragged looping woolen tufts bursting outward
      for (let i = 0; i < 16; i++) {
        const a = (i * Math.PI * 2) / 16 + t * 0.6;
        const speed = 0.8 + (i % 4) * 0.22;
        const dist = rBase * speed;
        const px = C + Math.cos(a) * dist;
        const py = C + Math.sin(a) * (dist * 0.88);
        draws.push(drawFlake(px, py, 5.0, 5, i + f * 2, `rgba(255, 180, 200, ${alpha})`, `rgba(210, 35, 65, ${alpha})`));
      }
    } else {
      const diss = (f - 8) / 7;
      const alpha = ((1 - diss) * 0.62).toFixed(2);
      const rBase = 98 + diss * 32;

      for (let i = 0; i < 14; i++) {
        const a = (i * Math.PI * 2) / 14 + i * 0.35;
        const px = C + Math.cos(a) * rBase;
        const py = C + Math.sin(a) * (rBase * 0.88);
        draws.push(drawFlake(px, py, 3.2, 5, i * 4, `rgba(215, 45, 75, ${alpha})`));
      }
    }

    run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${framePath}"`);
    frameFiles.push(`"${framePath}"`);
  }

  const stitchedPng = path.join(workBase, 'yarn_shockwave_v4_stitched.png');
  run(`magick montage ${frameFiles.join(' ')} -tile 4x4 -geometry 256x256+0+0 -background black "${stitchedPng}"`);
  const outWebp = path.join(vfxDir, 'yarn-giant-shockwave-ring.webp');
  toWebP(stitchedPng, outWebp, 78);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// 4. UTIL HEAL PLUS (Replaced icon with 4-leaf clover botanical herbal healing cross)
{
  console.log('Refining util-heal-plus (botanical 4-leaflet clover healing cross)...');
  const outPng = path.join(workBase, 'util_heal_plus_v3.png');
  const outWebp = path.join(vfxDir, 'util-heal-plus.webp');
  const C = 64;
  const draws = [];

  // Soft emerald herbal pool
  draws.push(drawBlob(C, C, 40, 6, 1, 'rgba(30, 160, 65, 0.35)'));
  draws.push(drawBlob(C, C, 22, 5, 2, 'rgba(110, 245, 140, 0.65)'));

  // 4 Botanical heart-shaped clover leaflets radiating at 0, 90, 180, 270 degrees
  for (let r = 0; r < 4; r++) {
    const ang = (r * Math.PI) / 2;
    draws.push(drawSplatter(C, C, 34, 16, ang, 'rgba(105, 245, 140, 0.88)'));
    draws.push(drawSplatter(C, C, 22, 10, ang, 'rgba(235, 255, 240, 0.95)'));
  }

  // Pure white dewdrop core
  draws.push(drawBlob(C, C, 7, 5, 3, 'rgba(255, 255, 255, 0.98)'));

  run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x0.9 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// 5. UTIL SHIELD HEX RIPPLE (Woven quilted fabric ripple with wavy stitching and uneven edge decay)
{
  console.log('Refining util-shield-hex-ripple (woven quilted fabric ripple)...');
  const framesDir = path.join(workBase, 'shield_ripple_v3_frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });
  const frameFiles = [];

  for (let f = 0; f < 16; f++) {
    const framePath = path.join(framesDir, `frame_${String(f).padStart(2, '0')}.png`);
    const C = 64;
    const t = f / 15;
    const alpha = (Math.sin(t * Math.PI) * 0.92).toFixed(2);
    const rBase = 12 + t * 45;
    const draws = [];

    // Undulating quilted fabric ring with wavy stitching (no rigid polygon!)
    const numPts = 24;
    const pts = [];
    for (let s = 0; s < numPts; s++) {
      const a = (s * Math.PI * 2) / numPts;
      const wave = Math.sin(a * 6 + t * 4) * 4.5;
      const r = rBase + wave;
      const px = C + Math.cos(a) * r;
      const py = C + Math.sin(a) * (r * 0.85);
      pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
    }

    draws.push(`stroke "rgba(255, 185, 60, ${alpha})" stroke-width 3.5 fill none polygon ${pts.join(' ')}`);
    draws.push(`stroke "rgba(255, 250, 210, ${alpha})" stroke-width 1.5 stroke-dasharray 6,4 fill none polygon ${pts.join(' ')}`);

    // 6 Floating silk thread knots around the ripple
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6 + t * 0.5;
      const dist = rBase * 1.1;
      const px = C + Math.cos(a) * dist;
      const py = C + Math.sin(a) * (dist * 0.85);
      draws.push(drawFlake(px, py, 3.0, 4, i + f, `rgba(255, 220, 140, ${alpha})`));
    }

    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x0.9 "${framePath}"`);
    frameFiles.push(`"${framePath}"`);
  }

  const stitchedPng = path.join(workBase, 'shield_ripple_v3_stitched.png');
  run(`magick montage ${frameFiles.join(' ')} -tile 4x4 -geometry 128x128+0+0 -background black "${stitchedPng}"`);
  const outWebp = path.join(vfxDir, 'util-shield-hex-ripple.webp');
  toWebP(stitchedPng, outWebp, 80);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// 6. UTIL STAR SPARKLE (Staggered multifaceted diamond sparkle flecks)
{
  console.log('Refining util-star-sparkle...');
  const framesDir = path.join(workBase, 'star_sparkle_v3_frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });
  const frameFiles = [];

  for (let f = 0; f < 16; f++) {
    const framePath = path.join(framesDir, `frame_${String(f).padStart(2, '0')}.png`);
    const C = 64;
    const t = f / 15;
    const alpha = (Math.sin(t * Math.PI) * 0.95).toFixed(2);
    const scale = Math.sin(t * Math.PI);
    const rot = t * Math.PI * 0.5;
    const draws = [];

    if (scale > 0.05) {
      // 4 Asymmetric tapered diamond needle rays with staggered lengths
      const rayLens = [38 * scale, 22 * scale, 32 * scale, 18 * scale];
      for (let r = 0; r < 4; r++) {
        const ang = rot + (r * Math.PI) / 2;
        draws.push(drawSplatter(C, C, rayLens[r], 4.5 * scale, ang, `rgba(255, 245, 210, ${alpha})`));
        draws.push(drawSplatter(C, C, rayLens[r] * 0.6, 2.5 * scale, ang, `rgba(255, 255, 255, ${alpha})`));
      }

      // 4 Staggered diagonal diamond flecks at varied distances
      for (let d = 0; d < 4; d++) {
        const dang = rot + Math.PI / 4 + (d * Math.PI) / 2;
        const ddist = (16 + (d % 2) * 8) * scale;
        const dx = C + Math.cos(dang) * ddist;
        const dy = C + Math.sin(dang) * ddist;
        draws.push(drawBlob(dx, dy, 2.5 * scale, 4, d * 3, `rgba(255, 225, 120, ${alpha})`));
      }

      // Core glint
      draws.push(drawBlob(C, C, 5.0 * scale, 4, 1, `rgba(255, 255, 255, ${alpha})`));
    }

    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x0.8 "${framePath}"`);
    frameFiles.push(`"${framePath}"`);
  }

  const stitchedPng = path.join(workBase, 'star_sparkle_v3_stitched.png');
  run(`magick montage ${frameFiles.join(' ')} -tile 4x4 -geometry 128x128+0+0 -background black "${stitchedPng}"`);
  const outWebp = path.join(vfxDir, 'util-star-sparkle.webp');
  toWebP(stitchedPng, outWebp, 80);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// 7. HIT STOP FLASHES (Textured contact accents with irregular core and tapered brush strokes)
{
  console.log('Refining hit-stop-flash-gold and hit-stop-flash-white...');
  const goldPng = path.join(workBase, 'flash_gold_v3.png');
  const goldWebp = path.join(vfxDir, 'hit-stop-flash-gold.webp');
  const whitePng = path.join(workBase, 'flash_white_v3.png');
  const whiteWebp = path.join(vfxDir, 'hit-stop-flash-white.webp');
  const C = 128;

  // Gold: Asymmetric warm contact starburst
  const goldDraws = [];
  goldDraws.push(drawBlob(C, C, 55, 7, 1, 'rgba(255, 165, 30, 0.45)'));
  goldDraws.push(drawBlob(C, C, 32, 6, 2, 'rgba(255, 220, 80, 0.75)'));

  // 6 Tapered brush contact strokes
  const goldRays = [
    { ang: 0.15, len: 78, w: 7 },
    { ang: 1.15, len: 52, w: 5 },
    { ang: 2.25, len: 82, w: 7 },
    { ang: 3.35, len: 58, w: 5 },
    { ang: 4.45, len: 74, w: 6 },
    { ang: 5.55, len: 48, w: 5 }
  ];
  for (const r of goldRays) {
    goldDraws.push(drawSplatter(C, C, r.len, r.w, r.ang, 'rgba(255, 235, 140, 0.92)'));
    goldDraws.push(drawSplatter(C, C, r.len * 0.65, r.w * 0.5, r.ang, 'rgba(255, 255, 255, 0.98)'));
  }
  goldDraws.push(drawBlob(C, C, 12, 5, 3, 'rgba(255, 255, 255, 0.98)'));

  run(`magick -size 256x256 xc:black -draw '${goldDraws.join(' ')}' -blur 0x1.0 "${goldPng}"`);
  toWebP(goldPng, goldWebp, 85);

  // White: Piercing contact needle glint
  const whiteDraws = [];
  whiteDraws.push(drawBlob(C, C, 48, 6, 1, 'rgba(180, 220, 255, 0.4)'));
  whiteDraws.push(drawBlob(C, C, 28, 5, 2, 'rgba(225, 245, 255, 0.75)'));

  const whiteRays = [
    { ang: 0.08, len: 84, w: 6 },
    { ang: 1.55, len: 86, w: 6 },
    { ang: 3.12, len: 80, w: 5 },
    { ang: 4.70, len: 82, w: 5 },
    { ang: 0.85, len: 38, w: 3.5 },
    { ang: 2.35, len: 40, w: 3.5 },
    { ang: 3.95, len: 36, w: 3.5 },
    { ang: 5.45, len: 38, w: 3.5 }
  ];
  for (const r of whiteRays) {
    whiteDraws.push(drawSplatter(C, C, r.len, r.w, r.ang, 'rgba(235, 248, 255, 0.92)'));
    whiteDraws.push(drawSplatter(C, C, r.len * 0.65, r.w * 0.5, r.ang, 'rgba(255, 255, 255, 0.98)'));
  }
  whiteDraws.push(drawBlob(C, C, 10, 5, 3, 'rgba(255, 255, 255, 0.98)'));

  run(`magick -size 256x256 xc:black -draw '${whiteDraws.join(' ')}' -blur 0x1.0 "${whitePng}"`);
  toWebP(whitePng, whiteWebp, 85);
  console.log('  -> hit-stop-flash-gold & hit-stop-flash-white refined.');
}

console.log('All targeted support texture refinements complete.');
