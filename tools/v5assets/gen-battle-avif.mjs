#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const battleUnits = [
  'mochi', 'soot', 'clover', 'panko',
  'kettle-knight', 'needle-moth', 'binding-thread', 'teacup-healer'
];

const unitsBase = path.resolve('apps/web/public/units');
const tmpDir = path.resolve('work/v5/AGV/jobs/battle_avif');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

console.log('Generating high-efficiency AVIF siblings for 8 core battle units...');

const results = [];
let totalWebpBytes = 0;
let totalAvifBytes = 0;

for (const unit of battleUnits) {
  const webpFile = path.join(unitsBase, unit, 'runtime.webp');
  const avifFile = path.join(unitsBase, unit, 'runtime.avif');

  if (!fs.existsSync(webpFile)) {
    console.warn(`Missing: ${webpFile}`);
    continue;
  }

  const statWebp = fs.statSync(webpFile);
  const tmpAvif = path.join(tmpDir, `${unit}.avif`);

  try {
    execSync(`magick "${webpFile}" -quality 75 "${tmpAvif}"`, { stdio: 'pipe' });
    const statAvif = fs.statSync(tmpAvif);
    const savings = 1 - (statAvif.size / statWebp.size);

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

    if (savings >= 0.20 && ssimDiff < 0.02) {
      fs.copyFileSync(tmpAvif, avifFile);
      results.push({
        unit,
        webpFile,
        avifFile,
        webpSize: statWebp.size,
        avifSize: statAvif.size,
        savedPct: (savings * 100).toFixed(1),
        ssimDiff: ssimDiff.toFixed(5)
      });
      totalWebpBytes += statWebp.size;
      totalAvifBytes += statAvif.size;
      console.log(`[AVIF BATTLE] ${unit}/runtime.webp: ${(statWebp.size / 1024).toFixed(1)} KB -> ${(statAvif.size / 1024).toFixed(1)} KB (-${(savings * 100).toFixed(1)}%, SSIM: ${ssimDiff.toFixed(4)})`);
    } else {
      console.warn(`Threshold check failed for ${unit}: savings=${(savings * 100).toFixed(1)}%, SSIM=${ssimDiff}`);
    }
  } catch (err) {
    console.error(`Error processing ${unit}:`, err.message);
  }
}

console.log('------------------------------------------------------------');
console.log(`Successfully generated ${results.length} core battle AVIF siblings.`);
console.log(`Total WebP: ${(totalWebpBytes / 1024).toFixed(1)} KB -> Total AVIF: ${(totalAvifBytes / 1024).toFixed(1)} KB`);
console.log(`Total savings: ${((totalWebpBytes - totalAvifBytes) / 1024).toFixed(1)} KB (-${((1 - totalAvifBytes / totalWebpBytes) * 100).toFixed(1)}%)`);

// Update reports/v5/AGV/AVIF-SIBLINGS-REPORT.md
const reportPath = path.resolve('reports/v5/AGV/AVIF-SIBLINGS-REPORT.md');
let reportContent = fs.existsSync(reportPath) ? fs.readFileSync(reportPath, 'utf8') : '';
const addition = [
  '',
  '### Core Battle Units Runtime AVIF Siblings',
  `Generated: ${new Date().toISOString()}`,
  `Total original WebP: ${(totalWebpBytes / 1024).toFixed(1)} KB`,
  `Total new AVIF: ${(totalAvifBytes / 1024).toFixed(1)} KB`,
  `Total savings: ${((totalWebpBytes - totalAvifBytes) / 1024).toFixed(1)} KB (-${((1 - totalAvifBytes / totalWebpBytes) * 100).toFixed(1)}%)`,
  '',
  '| Unit | WebP Size | AVIF Size | Saved % | SSIM Distortion |',
  '|---|---|---|---|---|',
  ...results.map(r => `| \`${r.unit}\` | ${(r.webpSize / 1024).toFixed(1)} KB | ${(r.avifSize / 1024).toFixed(1)} KB | -${r.savedPct}% | ${r.ssimDiff} |`)
].join('\n');

fs.appendFileSync(reportPath, addition + '\n');
console.log(`Report updated at ${reportPath}`);
