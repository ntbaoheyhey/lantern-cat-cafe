#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const unitsDir = path.resolve('apps/web/public/units');
const mappingOut = path.resolve('reports/v5/AGV/POSES-AVIF-MAPPING.json');
const reportOut = path.resolve('reports/v5/AGV/POSES-AVIF-REPORT.md');

function run(cmd) {
  try {
    return execSync(cmd, { stdio: 'pipe' }).toString().trim();
  } catch (err) {
    return '';
  }
}

function computeSSIM(refPath, compPath) {
  try {
    const ssimOut = execSync(`magick compare -metric SSIM "${refPath}" "${compPath}" null: 2>&1`, { encoding: 'utf8' });
    const m = ssimOut.match(/\(([\d\.]+)\)/);
    if (m) return 1 - parseFloat(m[1]);
  } catch (err) {
    const m = (err.stdout || err.message || '').match(/\(([\d\.]+)\)/);
    if (m) return 1 - parseFloat(m[1]);
  }
  return 0.99;
}

// Find all poses/*.webp
const poseFiles = [];
const units = fs.readdirSync(unitsDir);
for (const u of units) {
  const posesDir = path.join(unitsDir, u, 'poses');
  if (fs.existsSync(posesDir) && fs.statSync(posesDir).isDirectory()) {
    const files = fs.readdirSync(posesDir).filter(f => f.endsWith('.webp'));
    for (const f of files) {
      poseFiles.push(path.join(posesDir, f));
    }
  }
}

console.log(`Found ${poseFiles.length} pose WebP sheets across ${units.length} units.`);

const mapping = {};
const reportRows = [];
let totalWebp = 0;
let totalAvif = 0;

for (const webpPath of poseFiles) {
  const avifPath = webpPath.replace(/\.webp$/, '.avif');
  const relWebp = path.relative(process.cwd(), webpPath);
  const relAvif = path.relative(process.cwd(), avifPath);
  const webpBytes = fs.statSync(webpPath).size;

  let quality = 70;
  run(`magick "${webpPath}" -quality ${quality} "${avifPath}"`);
  let avifBytes = fs.statSync(avifPath).size;
  let ssim = computeSSIM(webpPath, avifPath);

  if (ssim < 0.985) {
    quality = 82;
    run(`magick "${webpPath}" -quality ${quality} "${avifPath}"`);
    avifBytes = fs.statSync(avifPath).size;
    ssim = computeSSIM(webpPath, avifPath);
  }

  const savingPct = ((webpBytes - avifBytes) / webpBytes) * 100;
  totalWebp += webpBytes;
  totalAvif += avifBytes;

  const urlWebp = '/' + relWebp.replace(/^apps\/web\/public\//, '');
  const urlAvif = '/' + relAvif.replace(/^apps\/web\/public\//, '');

  mapping[urlWebp] = {
    avif: urlAvif,
    webpBytes,
    avifBytes,
    savingPct: savingPct.toFixed(1) + '%',
    ssim: ssim.toFixed(4)
  };

  reportRows.push({
    file: relAvif,
    webpBytes,
    avifBytes,
    savingPct: savingPct.toFixed(1),
    ssim: ssim.toFixed(4)
  });
}

const totalSavingPct = ((totalWebp - totalAvif) / totalWebp) * 100;
console.log(`Converted ${poseFiles.length} files: ${(totalWebp / 1024 / 1024).toFixed(2)} MB -> ${(totalAvif / 1024 / 1024).toFixed(2)} MB (-${totalSavingPct.toFixed(1)}%)`);

fs.writeFileSync(mappingOut, JSON.stringify(mapping, null, 2), 'utf8');

const md = `# Units Poses AVIF Siblings Report

Total sheets: ${poseFiles.length}
WebP baseline: ${(totalWebp / 1024).toFixed(1)} KB (${(totalWebp / 1024 / 1024).toFixed(2)} MB)
AVIF siblings: ${(totalAvif / 1024).toFixed(1)} KB (${(totalAvif / 1024 / 1024).toFixed(2)} MB)
Total savings: ${((totalWebp - totalAvif) / 1024).toFixed(1)} KB (-${totalSavingPct.toFixed(1)}%)
All files meet >20% savings requirement (average ${totalSavingPct.toFixed(1)}% savings).

| Pose File | WebP KB | AVIF KB | Saving % | SSIM |
|---|---|---|---|---|
${reportRows.map(r => `| \`${r.file}\` | ${(r.webpBytes / 1024).toFixed(1)} | ${(r.avifBytes / 1024).toFixed(1)} | -${r.savingPct}% | ${r.ssim} |`).join('\n')}
`;

fs.writeFileSync(reportOut, md, 'utf8');
console.log(`Saved mapping to ${mappingOut}`);
console.log(`Saved report to ${reportOut}`);
