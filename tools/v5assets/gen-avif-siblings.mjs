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

function findCandidates() {
  const candidates = [];
  for (const dir of TARGET_DIRS) {
    function scan(d) {
      if (!fs.existsSync(d)) return;
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) {
          scan(full);
        } else if (entry.isFile() && entry.name.endsWith('.webp')) {
          const avifPath = full.replace(/\.webp$/, '.avif');
          if (!fs.existsSync(avifPath)) {
            const size = fs.statSync(full).size;
            candidates.push({ webp: full, avif: avifPath, size });
          }
        }
      }
    }
    scan(dir);
  }
  return candidates;
}

const allCandidates = findCandidates();
// Sort by size descending
allCandidates.sort((a, b) => b.size - a.size);

// Target batch: Select top candidates where generated AVIF will be <= 250 KB total
console.log(`Found ${allCandidates.length} WebP files without AVIF siblings.`);

const tmpDir = path.resolve('work/v5/AGV/jobs/avif_test');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const successful = [];
let totalStagedBytes = 0;
const MAX_STAGED_BYTES = 250 * 1024; // 250 KB budget per commit

// Prioritize key runtime and unit assets
const priorityAssets = allCandidates.filter(c => 
  c.webp.includes('/runtime.webp') || 
  c.webp.includes('/art/v3-shell/b2/radial-burst') ||
  c.webp.includes('/art/v3-shell/b2/backdrop')
);

console.log(`Evaluating ${priorityAssets.length} priority asset candidates...`);

for (const item of priorityAssets) {
  if (totalStagedBytes >= MAX_STAGED_BYTES) break;

  const tmpAvif = path.join(tmpDir, 'temp.avif');
  try {
    execSync(`magick "${item.webp}" -quality 75 "${tmpAvif}"`, { stdio: 'pipe' });
    const avifStat = fs.statSync(tmpAvif);
    const savings = 1 - (avifStat.size / item.size);

    if (savings >= 0.20) {
      // SSIM check
      let ssimDiff = 0;
      try {
        const cmp = execSync(`magick compare -metric SSIM "${item.webp}" "${tmpAvif}" null: 2>&1`).toString().trim();
        const m = cmp.match(/\(([0-9.]+)\)/);
        if (m) ssimDiff = parseFloat(m[1]);
      } catch (e) {
        const m = e.message.match(/\(([0-9.]+)\)/);
        if (m) ssimDiff = parseFloat(m[1]);
      }

      if (ssimDiff < 0.02) {
        fs.copyFileSync(tmpAvif, item.avif);
        successful.push({
          webp: item.webp,
          avif: item.avif,
          webpSize: item.size,
          avifSize: avifStat.size,
          savedPct: (savings * 100).toFixed(1),
          ssimDiff: ssimDiff.toFixed(5)
        });
        totalStagedBytes += avifStat.size;
        console.log(`[AVIF SUCCESS] ${path.basename(path.dirname(item.webp))}/${path.basename(item.webp)}: ${(item.size / 1024).toFixed(1)} KB -> ${(avifStat.size / 1024).toFixed(1)} KB (-${(savings * 100).toFixed(1)}%, SSIM: ${ssimDiff.toFixed(4)})`);
      }
    }
  } catch (err) {
    console.warn(`Failed on ${item.webp}:`, err.message);
  }
}

console.log('------------------------------------------------------------');
console.log(`Generated ${successful.length} AVIF siblings (${(totalStagedBytes / 1024).toFixed(1)} KB total).`);

// Write report
const reportPath = path.resolve('reports/v5/AGV/AVIF-SIBLINGS-REPORT.md');
const lines = [
  '# AVIF SIBLINGS REPORT (R5)',
  `Generated: ${new Date().toISOString()} | Savings Threshold: > 20% | SSIM Target: < 0.02`,
  '',
  `Total AVIF siblings generated: ${successful.length}`,
  `Total original WebP: ${(successful.reduce((s, x) => s + x.webpSize, 0) / 1024).toFixed(1)} KB`,
  `Total new AVIF: ${(totalStagedBytes / 1024).toFixed(1)} KB`,
  `Total bytes saved: ${((successful.reduce((s, x) => s + x.webpSize, 0) - totalStagedBytes) / 1024).toFixed(1)} KB (-${((1 - totalStagedBytes / successful.reduce((s, x) => s + x.webpSize, 0)) * 100).toFixed(1)}%)`,
  '',
  '| Asset Path | WebP Size | AVIF Size | Saved % | SSIM Distortion |',
  '|---|---|---|---|---|',
  ...successful.map(s => `| \`${s.webp}\` | ${(s.webpSize / 1024).toFixed(1)} KB | ${(s.avifSize / 1024).toFixed(1)} KB | -${s.savedPct}% | ${s.ssimDiff} |`)
];
fs.writeFileSync(reportPath, lines.join('\n') + '\n');
console.log(`Report written to ${reportPath}`);
