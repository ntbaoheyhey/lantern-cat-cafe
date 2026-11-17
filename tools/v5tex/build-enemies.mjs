#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AG2/jobs/enemies';

if (!fs.existsSync(vfxDir)) fs.mkdirSync(vfxDir, { recursive: true });
if (!fs.existsSync(workBase)) fs.rmSync(workBase, { recursive: true, force: true });
fs.mkdirSync(workBase, { recursive: true });

function run(cmd) {
  execSync(cmd, { stdio: 'pipe' });
}

function toWebP(pngIn, webpOut, q = 82) {
  run(`cwebp -q ${q} -alpha_q 90 "${pngIn}" -o "${webpOut}"`);
}

console.log('Building Enemy & Boss VFX textures...');

// ----------------------------------------------------------------------
// 1. HIT SPARKS (3 variants, 128x128 single textures, anchor: target, blend: add)
// ----------------------------------------------------------------------
// Variant 1: Needle prick glint (metallic silver/cyan flash with 4 sharp needle rays)
function buildHitSpark1() {
  const outPng = path.join(workBase, 'enemy_hit_spark_1.png');
  const outWebp = path.join(vfxDir, 'enemy-hit-spark-1.webp');
  const C = 64;
  const draws = [];

  // Piercing 4-ray needle glint
  draws.push(`stroke "rgba(220, 240, 255, 0.95)" stroke-width 3 line ${C - 42},${C} ${C + 42},${C} line ${C},${C - 42} ${C},${C + 42}`);
  draws.push(`stroke "rgba(160, 210, 255, 0.75)" stroke-width 1.5 line ${C - 24},${C - 24} ${C + 24},${C + 24} line ${C - 24},${C + 24} ${C + 24},${C - 24}`);
  // Intense core pinpoint
  draws.push(`fill "white" circle ${C},${C} ${C + 6},${C}`);
  draws.push(`fill "rgba(180, 225, 255, 0.5)" circle ${C},${C} ${C + 16},${C}`);

  run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x0.7 "${outPng}"`);
  toWebP(outPng, outWebp);
  console.log(`  -> ${outWebp}`);
}

// Variant 2: Kettle steam hiss spark (warm copper/white boiling droplet burst)
function buildHitSpark2() {
  const outPng = path.join(workBase, 'enemy_hit_spark_2.png');
  const outWebp = path.join(vfxDir, 'enemy-hit-spark-2.webp');
  const C = 64;
  const draws = [];

  draws.push(`fill "rgba(255, 240, 210, 0.9)" circle ${C},${C} ${C + 16},${C}`);
  draws.push(`fill "rgba(255, 180, 120, 0.6)" circle ${C},${C} ${C + 28},${C}`);
  draws.push(`fill "white" circle ${C},${C} ${C + 7},${C}`);

  // Steam droplet sparkles radiating
  for (let a = 0; a < 8; a++) {
    const angle = (a * Math.PI) / 4 + 0.2;
    const r = 32 + (a % 3) * 6;
    const sx = C + Math.cos(angle) * r;
    const sy = C + Math.sin(angle) * r;
    draws.push(`fill "rgba(255, 220, 180, 0.85)" circle ${sx.toFixed(1)},${sy.toFixed(1)} ${(sx + 3).toFixed(1)},${sy.toFixed(1)}`);
  }

  run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x0.9 "${outPng}"`);
  toWebP(outPng, outWebp);
  console.log(`  -> ${outWebp}`);
}

// Variant 3: Thread knot snap spark (frayed thread fiber whiskers popping outward)
function buildHitSpark3() {
  const outPng = path.join(workBase, 'enemy_hit_spark_3.png');
  const outWebp = path.join(vfxDir, 'enemy-hit-spark-3.webp');
  const C = 64;
  const draws = [];

  // Central knot burst
  draws.push(`fill "rgba(255, 140, 180, 0.95)" circle ${C},${C} ${C + 14},${C}`);
  draws.push(`fill "white" circle ${C},${C} ${C + 5},${C}`);

  // 6 thread whiskers shooting out with kinks
  const angles = [0.3, 1.2, 2.3, 3.5, 4.4, 5.5];
  for (const ang of angles) {
    const mX = C + Math.cos(ang) * 22 + Math.sin(ang) * 5;
    const mY = C + Math.sin(ang) * 22 - Math.cos(ang) * 5;
    const eX = C + Math.cos(ang) * 44;
    const eY = C + Math.sin(ang) * 44;
    draws.push(`stroke "rgba(255, 170, 200, 0.85)" stroke-width 2 fill none line ${C},${C} ${mX.toFixed(1)},${mY.toFixed(1)} line ${mX.toFixed(1)},${mY.toFixed(1)} ${eX.toFixed(1)},${eY.toFixed(1)}`);
    draws.push(`fill "rgba(255, 255, 255, 0.9)" circle ${eX.toFixed(1)},${eY.toFixed(1)} ${(eX + 2).toFixed(1)},${eY.toFixed(1)}`);
  }

  run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x0.8 "${outPng}"`);
  toWebP(outPng, outWebp);
  console.log(`  -> ${outWebp}`);
}

// ----------------------------------------------------------------------
// 2. DEATH DISSOLVE NOISE (512x512 tileable texture, fabric weave noise)
// ----------------------------------------------------------------------
function buildDeathDissolve() {
  const outPng = path.join(workBase, 'enemy_death_dissolve.png');
  const outWebp = path.join(vfxDir, 'enemy-death-dissolve.webp');
  const SZ = 512;

  // Generate periodic 2D value noise on a 16x16 grid with bicubic interpolation
  const GRID_SZ = 16;
  const grid = [];
  // Seedable pseudo-random
  let seed = 42;
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

      // Octave 1
      let n = sampleGrid(u, v) * 0.55;
      // Octave 2 (wrapped)
      n += sampleGrid(u * 2, v * 2) * 0.30;
      // High frequency woven cloth fiber texture
      const weave = Math.sin((x * Math.PI) / 4) * Math.cos((y * Math.PI) / 4) * 0.15;
      n += weave;

      const val = Math.min(255, Math.max(0, Math.floor(n * 255)));
      rawBytes[y * SZ + x] = val;
    }
  }

  const rawPath = path.join(workBase, 'dissolve.gray');
  fs.writeFileSync(rawPath, rawBytes);
  // Convert raw grayscale to PNG
  run(`magick -size ${SZ}x${SZ} -depth 8 gray:"${rawPath}" "${outPng}"`);
  toWebP(outPng, outWebp);
  console.log(`  -> ${outWebp}`);
}

// ----------------------------------------------------------------------
// 3. YARN GIANT CHARGE SWIRL (4x4 flipbook = 512x512 atlas, 16 frames of 128x128)
//    Theme: Wool Red (rgba(215, 38, 56)) + Indigo (rgba(50, 60, 180))
// ----------------------------------------------------------------------
function buildYarnGiantChargeSwirl() {
  const swirlWork = path.join(workBase, 'swirl_frames');
  if (fs.existsSync(swirlWork)) fs.rmSync(swirlWork, { recursive: true });
  fs.mkdirSync(swirlWork, { recursive: true });

  const N = 16;
  const C = 64;

  for (let i = 0; i < N; i++) {
    const t = i / (N - 1); // 0.0 to 1.0
    const framePng = path.join(swirlWork, `f_${String(i).padStart(2, '0')}.png`);
    const draws = [];

    // Core energy accumulation (builds brighter towards t=1.0)
    const coreR = 4 + 18 * Math.pow(t, 1.2);
    const coreAlpha = 0.3 + 0.7 * t;
    draws.push(`fill "rgba(215, 38, 56, ${(coreAlpha * 0.8).toFixed(2)})" circle ${C},${C} ${(C + coreR).toFixed(1)},${C}`);
    draws.push(`fill "rgba(100, 120, 255, ${(coreAlpha * 0.7).toFixed(2)})" circle ${C},${C} ${(C + coreR * 0.7).toFixed(1)},${C}`);
    if (t > 0.4) {
      draws.push(`fill "rgba(255, 230, 240, ${(t * 0.95).toFixed(2)})" circle ${C},${C} ${(C + coreR * 0.4).toFixed(1)},${C}`);
    }

    // 6 inward spiraling yarn arms
    const nArms = 6;
    for (let arm = 0; arm < nArms; arm++) {
      const baseAngle = (arm * (Math.PI * 2)) / nArms + t * Math.PI * 2.5;
      const isRed = arm % 2 === 0;
      const color = isRed ? `rgba(225, 45, 65, 0.85)` : `rgba(70, 95, 225, 0.85)`;

      const pts = [];
      const steps = 14;
      for (let s = 0; s <= steps; s++) {
        const prog = s / steps;
        // Spiral inward from r=56 to r=coreR
        const r = 56 * (1 - prog) + coreR * prog;
        const ang = baseAngle + prog * Math.PI * 1.4;
        const px = C + Math.cos(ang) * r;
        const py = C + Math.sin(ang) * r;
        pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
      }

      draws.push(`stroke "${color}" stroke-width ${(2.5 * (1 - t * 0.2)).toFixed(1)} fill none polyline ${pts.join(' ')}`);
    }

    const drawArg = draws.length > 0 ? `-draw '${draws.join(' ')}'` : '';
    run(`magick -size 128x128 xc:black ${drawArg} -blur 0x0.8 "${framePng}"`);
  }

  const atlasPng = path.join(workBase, 'yarn_giant_charge_swirl_atlas.png');
  run(`magick montage "${swirlWork}/f_*.png" -tile 4x4 -geometry 128x128+0+0 -background black "${atlasPng}"`);
  const outWebp = path.join(vfxDir, 'yarn-giant-charge-swirl.webp');
  toWebP(atlasPng, outWebp);
  console.log(`  -> ${outWebp}`);
}

// ----------------------------------------------------------------------
// 4. YARN GIANT SHOCKWAVE RING (4x4 flipbook = 512x512 atlas, 16 frames of 128x128)
// ----------------------------------------------------------------------
function buildYarnGiantShockwaveRing() {
  const shockWork = path.join(workBase, 'shock_frames');
  if (fs.existsSync(shockWork)) fs.rmSync(shockWork, { recursive: true });
  fs.mkdirSync(shockWork, { recursive: true });

  const N = 16;
  const C = 64;

  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const framePng = path.join(shockWork, `f_${String(i).padStart(2, '0')}.png`);
    const draws = [];

    // Colossal expanding ring: radius from 3 to 58 px
    const ringR = 3 + 55 * Math.pow(t, 0.6);
    const alpha = Math.max(0, 1.0 - Math.pow(t, 1.3));

    if (alpha > 0.02 && ringR > 3) {
      // Outer wool red shock ring
      draws.push(`stroke "rgba(225, 45, 65, ${(alpha * 0.9).toFixed(2)})" stroke-width ${(4.5 * (1 - t * 0.6)).toFixed(1)} fill none circle ${C},${C} ${(C + ringR).toFixed(1)},${C}`);
      // Indigo trailing tension ring
      if (ringR > 8) {
        draws.push(`stroke "rgba(70, 95, 230, ${(alpha * 0.75).toFixed(2)})" stroke-width 2 fill none circle ${C},${C} ${(C + ringR * 0.9).toFixed(1)},${C}`);
      }
      // White fiery leading edge
      if (t < 0.5) {
        draws.push(`stroke "rgba(255, 240, 245, ${(alpha * 0.9).toFixed(2)})" stroke-width 1.5 fill none circle ${C},${C} ${(C + ringR * 0.97).toFixed(1)},${C}`);
      }
    }

    // Tangled wool yarn fragments blasting outward
    const nBursts = 12;
    for (let b = 0; b < nBursts; b++) {
      const ang = (b * (Math.PI * 2)) / nBursts + Math.sin(b * 3);
      const dist = 48 * Math.pow(t, 0.7);
      const bx = C + Math.cos(ang) * dist;
      const by = C + Math.sin(ang) * dist;
      const bAlpha = Math.max(0, (1 - t * 1.1) * 0.85);

      if (bAlpha > 0.05 && bx >= 0 && bx < 128 && by >= 0 && by < 128) {
        const isRed = b % 2 === 0;
        const col = isRed ? `rgba(235, 55, 75, ${bAlpha.toFixed(2)})` : `rgba(80, 110, 240, ${bAlpha.toFixed(2)})`;
        draws.push(`fill "${col}" circle ${bx.toFixed(1)},${by.toFixed(1)} ${(bx + 2.5).toFixed(1)},${by.toFixed(1)}`);
      }
    }

    const drawArg = draws.length > 0 ? `-draw '${draws.join(' ')}'` : '';
    run(`magick -size 128x128 xc:black ${drawArg} -blur 0x0.8 "${framePng}"`);
  }

  const atlasPng = path.join(workBase, 'yarn_giant_shockwave_ring_atlas.png');
  run(`magick montage "${shockWork}/f_*.png" -tile 4x4 -geometry 128x128+0+0 -background black "${atlasPng}"`);
  const outWebp = path.join(vfxDir, 'yarn-giant-shockwave-ring.webp');
  toWebP(atlasPng, outWebp);
  console.log(`  -> ${outWebp}`);
}

// ----------------------------------------------------------------------
// 5. YARN GIANT GROUND CRACK (single 512x512 decal, anchor: ground, blend: add)
// ----------------------------------------------------------------------
function buildYarnGiantGroundCrack() {
  const outPng = path.join(workBase, 'yarn_giant_ground_crack.png');
  const outWebp = path.join(vfxDir, 'yarn-giant-ground-crack.webp');
  const C = 256;
  const draws = [];

  // Central heavy impact crater
  draws.push(`fill "rgba(220, 35, 55, 0.75)" circle ${C},${C} ${C + 45},${C}`);
  draws.push(`fill "rgba(60, 80, 220, 0.8)" circle ${C},${C} ${C + 25},${C}`);
  draws.push(`fill "rgba(255, 230, 240, 0.9)" circle ${C},${C} ${C + 10},${C}`);

  // Braided concentric yarn crater rings
  draws.push(`stroke "rgba(215, 38, 56, 0.85)" stroke-width 5 fill none circle ${C},${C} ${C + 215},${C}`);
  draws.push(`stroke "rgba(70, 95, 230, 0.8)" stroke-width 3 fill none circle ${C},${C} ${C + 185},${C}`);
  draws.push(`stroke "rgba(215, 38, 56, 0.6)" stroke-width 2 fill none circle ${C},${C} ${C + 120},${C}`);

  // 12 Jagged crack lines laced with cross stitches
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6 + 0.15 * Math.sin(i * 2);
    const r1 = 40;
    const r2 = 120 + (i % 3) * 20;
    const r3 = 205;

    const x1 = C + Math.cos(angle) * r1;
    const y1 = C + Math.sin(angle) * r1;
    const x2 = C + Math.cos(angle + 0.08) * r2;
    const y2 = C + Math.sin(angle + 0.08) * r2;
    const x3 = C + Math.cos(angle - 0.04) * r3;
    const y3 = C + Math.sin(angle - 0.04) * r3;

    const isRed = i % 2 === 0;
    const crackCol = isRed ? "rgba(225, 45, 65, 0.85)" : "rgba(70, 100, 235, 0.85)";
    draws.push(`stroke "${crackCol}" stroke-width 3 fill none line ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} line ${x2.toFixed(1)},${y2.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)}`);

    // Cross-stitches along crack
    const stitchX = (x2 + x3) * 0.5;
    const stitchY = (y2 + y3) * 0.5;
    draws.push(`stroke "rgba(255, 240, 245, 0.9)" stroke-width 2 line ${(stitchX - 6).toFixed(1)},${(stitchY - 6).toFixed(1)} ${(stitchX + 6).toFixed(1)},${(stitchY + 6).toFixed(1)} line ${(stitchX - 6).toFixed(1)},${(stitchY + 6).toFixed(1)} ${(stitchX + 6).toFixed(1)},${(stitchY - 6).toFixed(1)}`);
  }

  run(`magick -size 512x512 xc:black -draw '${draws.join(' ')}' -blur 0x1.2 "${outPng}"`);
  toWebP(outPng, outWebp);
  console.log(`  -> ${outWebp}`);
}

// Run all
buildHitSpark1();
buildHitSpark2();
buildHitSpark3();
buildDeathDissolve();
buildYarnGiantChargeSwirl();
buildYarnGiantShockwaveRing();
buildYarnGiantGroundCrack();

console.log('\nAll Enemy & Boss VFX textures generated successfully!');
