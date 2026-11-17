#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AG2/jobs/utility';

if (!fs.existsSync(vfxDir)) fs.mkdirSync(vfxDir, { recursive: true });
if (!fs.existsSync(workBase)) fs.rmSync(workBase, { recursive: true, force: true });
fs.mkdirSync(workBase, { recursive: true });

function run(cmd) {
  execSync(cmd, { stdio: 'pipe' });
}

function toWebP(pngIn, webpOut, q = 82) {
  run(`cwebp -q ${q} -alpha_q 90 "${pngIn}" -o "${webpOut}"`);
}

console.log('Building Shared Utility VFX textures...');

// ----------------------------------------------------------------------
// 1. TILEABLE NOISE (256x256 seamless value noise)
// ----------------------------------------------------------------------
function buildNoiseTile() {
  const outPng = path.join(workBase, 'util_noise_tile.png');
  const outWebp = path.join(vfxDir, 'util-noise-tile.webp');
  const SZ = 256;
  const GRID_SZ = 16;
  const grid = [];

  let seed = 12345;
  function rnd() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  for (let y = 0; y < GRID_SZ; y++) {
    grid[y] = [];
    for (let x = 0; x < GRID_SZ; x++) {
      grid[y][x] = rnd();
    }
  }

  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  function sampleGrid(u, v) {
    const x0 = Math.floor(u) % GRID_SZ;
    const y0 = Math.floor(v) % GRID_SZ;
    const x1 = (x0 + 1) % GRID_SZ;
    const y1 = (y0 + 1) % GRID_SZ;
    const fx = smoothstep(u - Math.floor(u));
    const fy = smoothstep(v - Math.floor(v));

    const top = grid[y0][x0] * (1 - fx) + grid[y0][x1] * fx;
    const bot = grid[y1][x0] * (1 - fx) + grid[y1][x1] * fx;
    return top * (1 - fy) + bot * fy;
  }

  const rawBytes = Buffer.alloc(SZ * SZ);
  for (let y = 0; y < SZ; y++) {
    for (let x = 0; x < SZ; x++) {
      const u = (x / SZ) * GRID_SZ;
      const v = (y / SZ) * GRID_SZ;

      let n = sampleGrid(u, v) * 0.6;
      n += sampleGrid(u * 2, v * 2) * 0.25;
      n += sampleGrid(u * 4, v * 4) * 0.15;

      const val = Math.min(255, Math.max(0, Math.floor(n * 255)));
      rawBytes[y * SZ + x] = val;
    }
  }

  const rawPath = path.join(workBase, 'noise.gray');
  fs.writeFileSync(rawPath, rawBytes);
  run(`magick -size ${SZ}x${SZ} -depth 8 gray:"${rawPath}" "${outPng}"`);
  toWebP(outPng, outWebp);
  console.log(`  -> ${outWebp}`);
}

// ----------------------------------------------------------------------
// 2. SOFT GLOW DOTS (64x64 and 128x128)
// ----------------------------------------------------------------------
function buildGlowDots() {
  // 64x64
  {
    const outPng = path.join(workBase, 'util_glow_dot_64.png');
    const outWebp = path.join(vfxDir, 'util-glow-dot-64.webp');
    const C = 32;
    const draws = [
      `fill "white" circle ${C},${C} ${C + 4},${C}`,
      `fill "rgba(255, 245, 230, 0.75)" circle ${C},${C} ${C + 10},${C}`,
      `fill "rgba(255, 230, 190, 0.35)" circle ${C},${C} ${C + 20},${C}`,
      `fill "rgba(255, 210, 160, 0.12)" circle ${C},${C} ${C + 28},${C}`,
    ];
    run(`magick -size 64x64 xc:black -draw '${draws.join(' ')}' -blur 0x1.5 "${outPng}"`);
    toWebP(outPng, outWebp);
    console.log(`  -> ${outWebp}`);
  }

  // 128x128
  {
    const outPng = path.join(workBase, 'util_glow_dot_128.png');
    const outWebp = path.join(vfxDir, 'util-glow-dot-128.webp');
    const C = 64;
    const draws = [
      `fill "white" circle ${C},${C} ${C + 8},${C}`,
      `fill "rgba(255, 245, 230, 0.8)" circle ${C},${C} ${C + 20},${C}`,
      `fill "rgba(255, 230, 190, 0.4)" circle ${C},${C} ${C + 40},${C}`,
      `fill "rgba(255, 210, 160, 0.15)" circle ${C},${C} ${C + 56},${C}`,
    ];
    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x2.5 "${outPng}"`);
    toWebP(outPng, outWebp);
    console.log(`  -> ${outWebp}`);
  }
}

// ----------------------------------------------------------------------
// 3. STAR SPARKLE 4x4 FLIPBOOK (512x512 atlas = 16 frames of 128x128)
// ----------------------------------------------------------------------
function buildStarSparkleFlipbook() {
  const sparkleWork = path.join(workBase, 'sparkle_frames');
  if (fs.existsSync(sparkleWork)) fs.rmSync(sparkleWork, { recursive: true });
  fs.mkdirSync(sparkleWork, { recursive: true });

  const N = 16;
  const C = 64;

  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const framePng = path.join(sparkleWork, `f_${String(i).padStart(2, '0')}.png`);
    const draws = [];

    // Scale pulses up then down: peak around t=0.45
    const scale = Math.sin(Math.min(Math.PI, t * Math.PI));
    const alpha = Math.max(0, Math.sin(t * Math.PI));
    const rot = (t * Math.PI * 0.5); // rotates 90 degrees during twinkle

    if (alpha > 0.05) {
      const lenMajor = 8 + 48 * scale;
      const lenMinor = 4 + 24 * scale;

      // 4 major star rays
      for (let r = 0; r < 4; r++) {
        const ang = rot + (r * Math.PI) / 2;
        const x1 = C + Math.cos(ang) * lenMajor;
        const y1 = C + Math.sin(ang) * lenMajor;
        draws.push(`stroke "rgba(255, 255, 255, ${(alpha * 0.95).toFixed(2)})" stroke-width 2.5 line ${C},${C} ${x1.toFixed(1)},${y1.toFixed(1)}`);
      }

      // 4 diagonal minor rays
      for (let r = 0; r < 4; r++) {
        const ang = rot + Math.PI / 4 + (r * Math.PI) / 2;
        const x1 = C + Math.cos(ang) * lenMinor;
        const y1 = C + Math.sin(ang) * lenMinor;
        draws.push(`stroke "rgba(255, 235, 170, ${(alpha * 0.8).toFixed(2)})" stroke-width 1.5 line ${C},${C} ${x1.toFixed(1)},${y1.toFixed(1)}`);
      }

      // Center bright core
      draws.push(`fill "white" circle ${C},${C} ${(C + 3 + 4 * scale).toFixed(1)},${C}`);
      draws.push(`fill "rgba(255, 220, 140, ${(alpha * 0.6).toFixed(2)})" circle ${C},${C} ${(C + 10 + 12 * scale).toFixed(1)},${C}`);
    }

    const drawArg = draws.length > 0 ? `-draw '${draws.join(' ')}'` : '';
    run(`magick -size 128x128 xc:black ${drawArg} -blur 0x0.7 "${framePng}"`);
  }

  const atlasPng = path.join(workBase, 'util_star_sparkle_atlas.png');
  run(`magick montage "${sparkleWork}/f_*.png" -tile 4x4 -geometry 128x128+0+0 -background black "${atlasPng}"`);
  const outWebp = path.join(vfxDir, 'util-star-sparkle.webp');
  toWebP(atlasPng, outWebp);
  console.log(`  -> ${outWebp}`);
}

// ----------------------------------------------------------------------
// 4. HEAL PLUS / LEAF PARTICLES (128x128 singles)
// ----------------------------------------------------------------------
function buildHealAndLeaf() {
  // Heal Plus
  {
    const outPng = path.join(workBase, 'util_heal_plus.png');
    const outWebp = path.join(vfxDir, 'util-heal-plus.webp');
    const C = 64;
    const draws = [];

    // Glowing green-gold cross
    draws.push(`stroke "rgba(60, 210, 110, 0.9)" stroke-width 10 stroke-linecap round line ${C - 24},${C} ${C + 24},${C} line ${C},${C - 24} ${C},${C + 24}`);
    draws.push(`stroke "rgba(240, 230, 120, 0.95)" stroke-width 4 stroke-linecap round line ${C - 22},${C} ${C + 22},${C} line ${C},${C - 22} ${C},${C + 22}`);
    draws.push(`fill "white" circle ${C},${C} ${C + 4},${C}`);

    // Stitched perimeter aura
    draws.push(`stroke "rgba(100, 240, 140, 0.45)" stroke-width 2 fill none circle ${C},${C} ${C + 36},${C}`);

    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x0.9 "${outPng}"`);
    toWebP(outPng, outWebp);
    console.log(`  -> ${outWebp}`);
  }

  // Leaf Particle
  {
    const outPng = path.join(workBase, 'util_leaf_particle.png');
    const outWebp = path.join(vfxDir, 'util-leaf-particle.webp');
    const C = 64;
    const draws = [];

    // Heart-shaped clover leaf petal
    draws.push(`fill "rgba(45, 195, 95, 0.85)" circle ${C - 10},${C - 6} ${C - 10 + 16},${C - 6}`);
    draws.push(`fill "rgba(45, 195, 95, 0.85)" circle ${C + 10},${C - 6} ${C + 10 + 16},${C - 6}`);
    draws.push(`fill "rgba(45, 195, 95, 0.85)" polygon ${C - 20},${C - 2} ${C + 20},${C - 2} ${C},${C + 26}`);

    // Inner bright vein
    draws.push(`stroke "rgba(220, 245, 140, 0.9)" stroke-width 2 fill none line ${C},${C - 14} ${C},${C + 22}`);
    draws.push(`stroke "rgba(220, 245, 140, 0.7)" stroke-width 1.5 fill none line ${C},${C} ${C - 10},${C - 8} line ${C},${C + 6} ${C + 10},${C - 2}`);

    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x0.8 "${outPng}"`);
    toWebP(outPng, outWebp);
    console.log(`  -> ${outWebp}`);
  }
}

// ----------------------------------------------------------------------
// 5. SHIELD HEX RIPPLE 4x4 FLIPBOOK (512x512 atlas = 16 frames of 128x128)
// ----------------------------------------------------------------------
function buildShieldHexRipple() {
  const hexWork = path.join(workBase, 'hex_frames');
  if (fs.existsSync(hexWork)) fs.rmSync(hexWork, { recursive: true });
  fs.mkdirSync(hexWork, { recursive: true });

  const N = 16;
  const C = 64;

  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const framePng = path.join(hexWork, `f_${String(i).padStart(2, '0')}.png`);
    const draws = [];

    const hexR = 8 + 50 * Math.pow(t, 0.7);
    const alpha = Math.max(0, 1.0 - Math.pow(t, 1.3));

    if (alpha > 0.03) {
      // Draw honeycomb hexagon
      const pts = [];
      for (let h = 0; h < 6; h++) {
        const ang = (h * Math.PI) / 3;
        const px = C + Math.cos(ang) * hexR;
        const py = C + Math.sin(ang) * hexR;
        pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
      }

      // Outer ripple
      draws.push(`stroke "rgba(80, 180, 255, ${(alpha * 0.9).toFixed(2)})" stroke-width ${(3.5 * (1 - t * 0.5)).toFixed(1)} fill none polygon ${pts.join(' ')}`);

      // Inner ripple echo
      if (hexR > 18) {
        const innerPts = [];
        const inR = hexR * 0.75;
        for (let h = 0; h < 6; h++) {
          const ang = (h * Math.PI) / 3;
          const px = C + Math.cos(ang) * inR;
          const py = C + Math.sin(ang) * inR;
          innerPts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
        }
        draws.push(`stroke "rgba(180, 230, 255, ${(alpha * 0.7).toFixed(2)})" stroke-width 2 fill none polygon ${innerPts.join(' ')}`);
      }

      // Hex vertex stitch dots
      for (let h = 0; h < 6; h++) {
        const ang = (h * Math.PI) / 3;
        const px = C + Math.cos(ang) * hexR;
        const py = C + Math.sin(ang) * hexR;
        draws.push(`fill "rgba(255, 255, 255, ${(alpha * 0.95).toFixed(2)})" circle ${px.toFixed(1)},${py.toFixed(1)} ${(px + 2).toFixed(1)},${py.toFixed(1)}`);
      }
    }

    const drawArg = draws.length > 0 ? `-draw '${draws.join(' ')}'` : '';
    run(`magick -size 128x128 xc:black ${drawArg} -blur 0x0.8 "${framePng}"`);
  }

  const atlasPng = path.join(workBase, 'util_shield_hex_ripple_atlas.png');
  run(`magick montage "${hexWork}/f_*.png" -tile 4x4 -geometry 128x128+0+0 -background black "${atlasPng}"`);
  const outWebp = path.join(vfxDir, 'util-shield-hex-ripple.webp');
  toWebP(atlasPng, outWebp);
  console.log(`  -> ${outWebp}`);
}

// Run all
buildNoiseTile();
buildGlowDots();
buildStarSparkleFlipbook();
buildHealAndLeaf();
buildShieldHexRipple();

console.log('\nAll Shared Utility VFX textures generated successfully!');
