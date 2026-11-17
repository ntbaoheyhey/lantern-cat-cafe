#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const tmpDir = '/Users/bao/th-v5-ag2/work/v5/AGV/jobs/opt_vfx';
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const files = fs.readdirSync(vfxDir).filter(f => f.endsWith('.webp'));
console.log(`Analyzing ${files.length} VFX WebP files for R4 size optimization...`);

let totalBefore = 0;
let totalAfter = 0;
let optimizedCount = 0;

for (const file of files) {
  const origPath = path.join(vfxDir, file);
  const statBefore = fs.statSync(origPath);
  totalBefore += statBefore.size;

  // Only optimize files >= 10 KB (small files like 1 KB have negligible savings and high header overhead)
  if (statBefore.size < 10 * 1024) {
    totalAfter += statBefore.size;
    continue;
  }

  const tmpOut = path.join(tmpDir, file);
  try {
    execSync(`magick "${origPath}" -quality 76 -define webp:method=6 "${tmpOut}"`, { stdio: 'pipe' });
    const statAfter = fs.statSync(tmpOut);

    // Verify SSIM distortion
    let ssimDiff = 0;
    try {
      const cmp = execSync(`magick compare -metric SSIM "${origPath}" "${tmpOut}" null: 2>&1`).toString().trim();
      const match = cmp.match(/\(([0-9.]+)\)/);
      if (match) ssimDiff = parseFloat(match[1]);
    } catch (e) {
      // compare exits with 1 on difference
      const match = e.message.match(/\(([0-9.]+)\)/);
      if (match) ssimDiff = parseFloat(match[1]);
    }

    // Accept if smaller and SSIM distortion is low (< 0.035)
    if (statAfter.size < statBefore.size * 0.95 && ssimDiff < 0.035) {
      const savedPct = (((statBefore.size - statAfter.size) / statBefore.size) * 100).toFixed(1);
      console.log(`[OPT] ${file}: ${(statBefore.size / 1024).toFixed(1)} KB -> ${(statAfter.size / 1024).toFixed(1)} KB (-${savedPct}%, SSIM diff: ${ssimDiff.toFixed(4)})`);
      fs.copyFileSync(tmpOut, origPath);
      totalAfter += statAfter.size;
      optimizedCount++;
    } else {
      totalAfter += statBefore.size;
    }
  } catch (err) {
    console.warn(`Could not optimize ${file}:`, err.message);
    totalAfter += statBefore.size;
  }
}

const totalSavedKB = ((totalBefore - totalAfter) / 1024).toFixed(1);
const totalSavedPct = (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1);

console.log('------------------------------------------------------------');
console.log(`Optimized ${optimizedCount} files.`);
console.log(`Total VFX size: ${(totalBefore / 1024).toFixed(1)} KB -> ${(totalAfter / 1024).toFixed(1)} KB (-${totalSavedKB} KB, -${totalSavedPct}%)`);
