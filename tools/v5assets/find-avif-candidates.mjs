#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const TARGET_DIRS = [
  'apps/web/public/units',
  'apps/web/public/art',
  'apps/web/public/ui-art2',
  'apps/web/public/relics',
  'apps/web/public/cinematics'
];

function findWebps(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findWebps(full, list);
    } else if (entry.isFile() && entry.name.endsWith('.webp')) {
      // Skip if sibling .avif already exists
      const avifSibling = full.replace(/\.webp$/, '.avif');
      if (!fs.existsSync(avifSibling)) {
        list.push(full);
      }
    }
  }
  return list;
}

console.log('Finding candidate WebP files for AVIF sibling generation (R5: >20% savings)...');
const allWebps = TARGET_DIRS.flatMap(dir => findWebps(dir));
console.log(`Found ${allWebps.length} WebP files without existing AVIF siblings.`);

// Filter for files >= 20 KB
const largeWebps = allWebps.filter(f => fs.statSync(f).size >= 20 * 1024);
console.log(`Testing ${largeWebps.length} candidate files (>= 20 KB)...`);

const successful = [];
const tmpDir = path.resolve('work/v5/AGV/jobs/avif_test');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

for (const webpFile of largeWebps) {
  const statWebp = fs.statSync(webpFile);
  const avifSibling = webpFile.replace(/\.webp$/, '.avif');
  const tmpAvif = path.join(tmpDir, 'test.avif');

  try {
    execSync(`magick "${webpFile}" -quality 80 -define heic:speed=2 "${tmpAvif}"`, { stdio: 'pipe' });
    const statAvif = fs.statSync(tmpAvif);

    // Savings threshold: >= 20%
    const savingsRatio = 1 - (statAvif.size / statWebp.size);
    if (savingsRatio >= 0.20) {
      // Check SSIM distortion
      let ssimDiff = 0;
      try {
        const cmp = execSync(`magick compare -metric SSIM "${webpFile}" "${tmpAvif}" null: 2>&1`).toString().trim();
        const m = cmp.match(/\(([0-9.]+)\)/);
        if (m) ssimDiff = parseFloat(m[1]);
      } catch (e) {
        const m = e.message.match(/\(([0-9.]+)\)/);
        if (m) ssimDiff = parseFloat(m[1]);
      }

      if (ssimDiff < 0.02) {
        fs.copyFileSync(tmpAvif, avifSibling);
        successful.push({
          file: webpFile,
          avif: avifSibling,
          webpSize: statWebp.size,
          avifSize: statAvif.size,
          savedPct: (savingsRatio * 100).toFixed(1),
          ssimDiff
        });
        console.log(`[AVIF] ${path.basename(webpFile)}: ${(statWebp.size / 1024).toFixed(1)} KB -> ${(statAvif.size / 1024).toFixed(1)} KB (-${(savingsRatio * 100).toFixed(1)}%)`);
      }
    }
  } catch (err) {
    // skip
  }
}

console.log('------------------------------------------------------------');
console.log(`Generated ${successful.length} AVIF siblings with > 20% savings.`);
const totalWebpB = successful.reduce((sum, s) => sum + s.webpSize, 0);
const totalAvifB = successful.reduce((sum, s) => sum + s.avifSize, 0);
const totalSavedKB = ((totalWebpB - totalAvifB) / 1024).toFixed(1);
console.log(`Total payload: ${(totalWebpB / 1024).toFixed(1)} KB -> ${(totalAvifB / 1024).toFixed(1)} KB (-${totalSavedKB} KB)`);
