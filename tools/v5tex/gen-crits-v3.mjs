#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AGV/jobs/crits_v3';

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

function drawJaggedWave(cx, cy, rBase, numTeeth, seed, strokeCol, strokeW) {
  const pts = [];
  const steps = numTeeth * 3;
  for (let i = 0; i < steps; i++) {
    const a = (i * Math.PI * 2) / steps;
    const jitter = Math.sin(a * numTeeth + seed) * (rBase * 0.22);
    const r = rBase + jitter;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  return `stroke "${strokeCol}" stroke-width ${strokeW} fill none polygon ${pts.join(' ')}`;
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

console.log('Building organic Critical and Impact Bursts (V3: Painted matter & zero concentric rings)...');

// 1. CRIT IMPACT BURST (4x4 128x128 atlas, 16 frames: Electric Violet & Radiant Gold)
{
  console.log('Generating organic crit-impact-burst...');
  const framesDir = path.join(workBase, 'crit_burst_frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });
  const frameFiles = [];

  for (let f = 0; f < 16; f++) {
    const framePath = path.join(framesDir, `frame_${String(f).padStart(2, '0')}.png`);
    const C = 64;
    const draws = [];

    if (f <= 2) {
      // Anticipation / initial flash (frames 0-2)
      const r = 8 + f * 12;
      draws.push(drawBlob(C, C, r * 0.7, 5, f, 'rgba(255, 255, 255, 0.98)'));
      draws.push(drawBlob(C, C, r * 1.2, 6, f * 2, 'rgba(255, 220, 80, 0.9)'));
      draws.push(drawBlob(C, C, r * 1.8, 7, f * 3, 'rgba(180, 60, 255, 0.6)'));
    } else if (f <= 8) {
      // Peak detonation & jagged shock breakup (frames 3-8)
      const t = (f - 2) / 6;
      const alpha = (1 - t * 0.35).toFixed(2);
      const rBase = 18 + t * 40;

      // Organic hot impact core
      draws.push(drawBlob(C, C, 14 * (1 - t * 0.7), 5, f, `rgba(255, 255, 255, ${alpha})`));

      // Jagged violet-gold shockwave tear (no circular disc!)
      draws.push(drawJaggedWave(C, C, rBase, 7, f, `rgba(185, 55, 255, ${alpha})`, 3.5));
      draws.push(drawJaggedWave(C, C, rBase * 0.88, 6, f * 2, `rgba(255, 230, 90, ${alpha})`, 2.0));

      // 10 Flying painted crystal / spark splatters
      for (let s = 0; s < 10; s++) {
        const ang = (s * Math.PI * 2) / 10 + 0.3 * Math.sin(s * 3);
        const speed = 0.85 + (s % 3) * 0.25;
        const dist = rBase * speed;
        const px = C + Math.cos(ang) * dist;
        const py = C + Math.sin(ang) * dist;
        const col = s % 2 === 0 ? `rgba(255, 235, 120, ${alpha})` : `rgba(215, 110, 255, ${alpha})`;
        draws.push(drawSplatter(px, py, 9 * (1 - t * 0.4), 3.5, ang, col));
      }
    } else {
      // Long organic dissipation & sparkle fallout (frames 9-15)
      const diss = (f - 8) / 7;
      const alpha = ((1 - diss) * 0.65).toFixed(2);
      const distBase = 46 + diss * 16;

      for (let s = 0; s < 8; s++) {
        const ang = (s * Math.PI * 2) / 8 + s * 0.4;
        const px = C + Math.cos(ang) * distBase;
        const py = C + Math.sin(ang) * distBase;
        draws.push(drawBlob(px, py, 2.8 * (1 - diss * 0.5), 4, s * 4, `rgba(255, 220, 100, ${alpha})`));
      }
    }

    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x0.9 "${framePath}"`);
    frameFiles.push(`"${framePath}"`);
  }

  const stitchedPng = path.join(workBase, 'crit_impact_burst_stitched.png');
  run(`magick montage ${frameFiles.join(' ')} -tile 4x4 -geometry 128x128+0+0 -background black "${stitchedPng}"`);

  const outWebp = path.join(vfxDir, 'crit-impact-burst.webp');
  toWebP(stitchedPng, outWebp, 80);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// 2. CRIT SPARK FLARE (1x1 256px: Multifaceted painted needle glint starburst)
{
  console.log('Generating organic crit-spark-flare...');
  const outPng = path.join(workBase, 'crit_spark_flare.png');
  const outWebp = path.join(vfxDir, 'crit-spark-flare.webp');
  const C = 128;
  const draws = [];

  // Soft violet-gold ambient blossom
  draws.push(drawBlob(C, C, 80, 8, 1, 'rgba(160, 40, 240, 0.35)'));
  draws.push(drawBlob(C, C, 48, 7, 2, 'rgba(255, 205, 60, 0.55)'));

  // 8 Asymmetric tapered needle rays (organic diamond facets, not straight crosshairs)
  const rayAngles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];
  const rayLengths = [108, 62, 114, 58, 105, 66, 110, 60];

  for (let r = 0; r < 8; r++) {
    const ang = rayAngles[r];
    const len = rayLengths[r];
    // Main gold/white ray
    draws.push(drawSplatter(C, C, len, 6, ang, 'rgba(255, 245, 180, 0.85)'));
    // Inner brilliant core needle
    draws.push(drawSplatter(C, C, len * 0.75, 3, ang, 'rgba(255, 255, 255, 0.98)'));
  }

  // Brilliant core glint
  draws.push(drawBlob(C, C, 16, 6, 3, 'rgba(255, 255, 255, 0.98)'));
  draws.push(drawBlob(C, C, 26, 6, 4, 'rgba(255, 225, 90, 0.85)'));

  run(`magick -size 256x256 xc:black -draw '${draws.join(' ')}' -blur 0x1.0 "${outPng}"`);
  toWebP(outPng, outWebp, 85);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// 3. IMPACT BURST PROC (4x4 128x128 atlas, 16 frames: Organic warm physical impact)
{
  console.log('Generating organic impact-burst-proc...');
  const framesDir = path.join(workBase, 'impact_proc_frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });
  const frameFiles = [];

  for (let f = 0; f < 16; f++) {
    const framePath = path.join(framesDir, `frame_${String(f).padStart(2, '0')}.png`);
    const C = 64;
    const draws = [];

    if (f <= 2) {
      // Hot physical impact flash
      const r = 7 + f * 11;
      draws.push(drawBlob(C, C, r * 0.75, 5, f, 'rgba(255, 255, 255, 0.98)'));
      draws.push(drawBlob(C, C, r * 1.3, 6, f * 2, 'rgba(255, 195, 80, 0.85)'));
      draws.push(drawBlob(C, C, r * 1.7, 7, f * 3, 'rgba(220, 80, 30, 0.5)'));
    } else if (f <= 8) {
      // Expanding irregular dust & spark fracture
      const t = (f - 2) / 6;
      const alpha = (1 - t * 0.35).toFixed(2);
      const rBase = 16 + t * 38;

      draws.push(drawBlob(C, C, 12 * (1 - t * 0.7), 5, f, `rgba(255, 255, 255, ${alpha})`));

      // Jagged painted shockwave tear
      draws.push(drawJaggedWave(C, C, rBase, 6, f * 3, `rgba(255, 175, 60, ${alpha})`, 3.0));
      draws.push(drawJaggedWave(C, C, rBase * 0.85, 7, f * 4, `rgba(255, 240, 160, ${alpha})`, 1.5));

      // 8 Flying physical wood / ember splinters
      for (let s = 0; s < 8; s++) {
        const ang = (s * Math.PI * 2) / 8 + 0.25 * Math.cos(s * 2);
        const dist = rBase * (0.9 + (s % 3) * 0.2);
        const px = C + Math.cos(ang) * dist;
        const py = C + Math.sin(ang) * dist;
        draws.push(drawSplatter(px, py, 8 * (1 - t * 0.35), 3, ang, `rgba(255, 220, 110, ${alpha})`));
      }
    } else {
      // Soft fading motes
      const diss = (f - 8) / 7;
      const alpha = ((1 - diss) * 0.6).toFixed(2);
      const distBase = 44 + diss * 15;

      for (let s = 0; s < 6; s++) {
        const ang = (s * Math.PI * 2) / 6 + s * 0.5;
        const px = C + Math.cos(ang) * distBase;
        const py = C + Math.sin(ang) * distBase;
        draws.push(drawBlob(px, py, 2.5 * (1 - diss * 0.5), 4, s * 2, `rgba(255, 190, 80, ${alpha})`));
      }
    }

    run(`magick -size 128x128 xc:black -draw '${draws.join(' ')}' -blur 0x0.9 "${framePath}"`);
    frameFiles.push(`"${framePath}"`);
  }

  const stitchedPng = path.join(workBase, 'impact_burst_proc_stitched.png');
  run(`magick montage ${frameFiles.join(' ')} -tile 4x4 -geometry 128x128+0+0 -background black "${stitchedPng}"`);

  const outWebp = path.join(vfxDir, 'impact-burst-proc.webp');
  toWebP(stitchedPng, outWebp, 80);
  const stat = fs.statSync(outWebp);
  console.log(`  -> ${outWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
}

console.log('Organic Crits and Impact Bursts complete.');
