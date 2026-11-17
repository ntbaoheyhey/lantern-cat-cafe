#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workDir = '/Users/bao/th-v5-ag2/work/v5/AG2/jobs/burst_proc';

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(workDir)) fs.rmSync(workDir, { recursive: true });
fs.mkdirSync(workDir, { recursive: true });

const N_FRAMES = 16;
const FRAME_SZ = 128; // 128x128 per frame -> 512x512 atlas
const CENTER = FRAME_SZ / 2;

// Fixed spark seed angles and speeds
const SPARKS = [
  { angle: 0.1, speed: 45, size: 2.5 },
  { angle: 0.6, speed: 52, size: 2.0 },
  { angle: 1.2, speed: 40, size: 3.0 },
  { angle: 1.8, speed: 48, size: 2.2 },
  { angle: 2.4, speed: 55, size: 1.8 },
  { angle: 3.1, speed: 42, size: 2.8 },
  { angle: 3.7, speed: 50, size: 2.4 },
  { angle: 4.3, speed: 46, size: 2.1 },
  { angle: 5.0, speed: 53, size: 2.6 },
  { angle: 5.7, speed: 44, size: 2.0 },
  { angle: 2.8, speed: 36, size: 1.6 },
  { angle: 4.9, speed: 38, size: 1.9 },
];

console.log('Generating procedural impact burst frames...');

for (let i = 0; i < N_FRAMES; i++) {
  const t = i / (N_FRAMES - 1); // 0.0 to 1.0
  const framePath = path.join(workDir, `frame_${String(i).padStart(2, '0')}.png`);

  // Ring radius expands from 2 to 54 px
  const ringR = 2 + 52 * Math.pow(t, 0.6);
  // Intensity fades from 1.0 down to 0.0
  const alpha = Math.max(0, 1.0 - Math.pow(t, 1.2));
  const coreAlpha = Math.max(0, 1.0 - t * 3.0); // core flashes early, gone by t=0.35

  const drawCommands = [];

  // Core flash
  if (coreAlpha > 0.05) {
    const coreR = Math.max(1, 14 * (1 - t * 2.5));
    const coreColor = `rgba(255, 245, 210, ${coreAlpha.toFixed(3)})`;
    drawCommands.push(`fill "${coreColor}" circle ${CENTER},${CENTER} ${CENTER + coreR},${CENTER}`);
  }

  // Shockwave ring
  if (alpha > 0.02 && ringR > 3) {
    const strokeW = Math.max(1, 4.5 * (1 - t * 0.7));
    const ringColor = `rgba(255, 200, 100, ${(alpha * 0.9).toFixed(3)})`;
    drawCommands.push(`stroke "${ringColor}" stroke-width ${strokeW.toFixed(1)} fill none circle ${CENTER},${CENTER} ${CENTER + ringR},${CENTER}`);

    // Inner bright ring edge
    if (t < 0.6) {
      const innerColor = `rgba(255, 255, 255, ${(alpha * 0.7).toFixed(3)})`;
      drawCommands.push(`stroke "${innerColor}" stroke-width 1.5 fill none circle ${CENTER},${CENTER} ${CENTER + ringR * 0.95},${CENTER}`);
    }
  }

  // Sparks
  for (const sp of SPARKS) {
    const dist = sp.speed * Math.pow(t, 0.8);
    const sx = CENTER + Math.cos(sp.angle) * dist;
    const sy = CENTER + Math.sin(sp.angle) * dist;
    const sparkAlpha = Math.max(0, (1 - t * 1.1) * (0.8 + 0.2 * Math.sin(i * 2 + sp.angle)));

    if (sparkAlpha > 0.05 && sx >= 0 && sx < FRAME_SZ && sy >= 0 && sy < FRAME_SZ) {
      const spR = Math.max(0.8, sp.size * (1 - t * 0.6));
      drawCommands.push(`fill "rgba(255, 220, 140, ${sparkAlpha.toFixed(3)})" circle ${sx.toFixed(1)},${sy.toFixed(1)} ${(sx + spR).toFixed(1)},${sy.toFixed(1)}`);
      // Spark core
      drawCommands.push(`fill "rgba(255, 255, 255, ${(sparkAlpha * 0.8).toFixed(3)})" circle ${sx.toFixed(1)},${sy.toFixed(1)} ${(sx + spR * 0.5).toFixed(1)},${sy.toFixed(1)}`);
    }
  }

  // Draw with magick
  const drawArg = drawCommands.length > 0 ? `-draw '${drawCommands.join(" ")}'` : '';
  const cmd = `magick -size ${FRAME_SZ}x${FRAME_SZ} xc:black ${drawArg} -blur 0x0.8 "${framePath}"`;
  execSync(cmd, { stdio: 'pipe' });
}

// Assemble into 4x4 atlas (512x512)
const atlasRaw = path.join(workDir, 'atlas.png');
execSync(`magick montage "${workDir}/frame_*.png" -tile 4x4 -geometry ${FRAME_SZ}x${FRAME_SZ}+0+0 -background black "${atlasRaw}"`, { stdio: 'pipe' });

// Convert to WebP quality 82
const outWebp = path.join(outDir, 'impact-burst-proc.webp');
execSync(`cwebp -q 82 -alpha_q 90 "${atlasRaw}" -o "${outWebp}"`, { stdio: 'pipe' });

const stat = fs.statSync(outWebp);
console.log(`Generated: ${outWebp} (${stat.size} bytes)`);
