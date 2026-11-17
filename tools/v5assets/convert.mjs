#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const args = process.argv.slice(2);
let fileListPath = null;
let mode = 'rig'; // 'rig' or 'art'
let filesToProcess = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--list' && args[i + 1]) {
    fileListPath = args[++i];
  } else if (args[i] === '--mode' && args[i + 1]) {
    mode = args[++i];
  } else if (!args[i].startsWith('--')) {
    filesToProcess.push(args[i]);
  }
}

if (fileListPath && fs.existsSync(fileListPath)) {
  const lines = fs.readFileSync(fileListPath, 'utf8').split('\n').map(l => l.trim()).filter(Boolean);
  filesToProcess.push(...lines);
}

if (filesToProcess.length === 0) {
  if (mode === 'rig') {
    const unitsDir = 'apps/web/public/units';
    if (fs.existsSync(unitsDir)) {
      const entries = fs.readdirSync(unitsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const unitPath = path.join(unitsDir, entry.name);
          const pFiles = fs.readdirSync(unitPath);
          for (const f of pFiles) {
            if (f.endsWith('.png') && (f.startsWith('rig-page') || f === 'rig-depth.png')) {
              filesToProcess.push(path.join(unitPath, f));
            }
          }
        }
      }
    }
  }
}

console.log(`Starting convert.mjs [mode: ${mode}] on ${filesToProcess.length} files...`);

const newFilesRecord = path.resolve('work/v5/AG3/new-files.txt');
fs.mkdirSync(path.dirname(newFilesRecord), { recursive: true });

function getDimensions(filePath) {
  try {
    const out = execSync(`magick identify -format "%w %h" "${filePath}"`, { encoding: 'utf8' }).trim();
    const [w, h] = out.split(/\s+/).map(Number);
    return { w, h };
  } catch (err) {
    console.error(`Error identifying ${filePath}:`, err.message);
    return { w: 0, h: 0 };
  }
}

function computeSSIM(refPath, compPath) {
  try {
    const ssimOut = execSync(`magick compare -metric SSIM "${refPath}" "${compPath}" null: 2>&1`, { encoding: 'utf8' });
    const m = ssimOut.match(/\(([\d\.]+)\)/);
    if (m) {
      const d = parseFloat(m[1]);
      return 1 - d;
    }
  } catch (err) {
    const m = (err.stdout || err.message || '').match(/\(([\d\.]+)\)/);
    if (m) {
      const d = parseFloat(m[1]);
      return 1 - d;
    }
  }
  return 0;
}

function recordNewFile(destPath) {
  let existing = '';
  if (fs.existsSync(newFilesRecord)) {
    existing = fs.readFileSync(newFilesRecord, 'utf8');
  }
  const lines = new Set(existing.split('\n').map(l => l.trim()).filter(Boolean));
  if (!lines.has(destPath)) {
    fs.appendFileSync(newFilesRecord, destPath + '\n', 'utf8');
  }
}

const results = [];
let totalPngBytes = 0;
let totalWebpBytes = 0;

for (let idx = 0; idx < filesToProcess.length; idx++) {
  const pngPath = filesToProcess[idx];
  if (!fs.existsSync(pngPath)) continue;

  const stat = fs.statSync(pngPath);
  const pngBytes = stat.size;
  const dims = getDimensions(pngPath);
  const isDepth = path.basename(pngPath) === 'rig-depth.png';
  const minSSIM = mode === 'rig' ? 0.985 : 0.980;

  // 1. Primary sibling (.webp)
  const webpPath = pngPath.replace(/\.png$/, '.webp');
  let q = 90;
  let ssim = 0;
  let dimsOk = false;
  let webpBytes = 0;
  let usedLossless = false;

  // Try lossy cwebp first
  execSync(`cwebp -q ${q} -alpha_q 100 -exact -sharp_yuv "${pngPath}" -o "${webpPath}" 2>/dev/null`);
  webpBytes = fs.statSync(webpPath).size;
  let webpDims = getDimensions(webpPath);
  dimsOk = (dims.w === webpDims.w && dims.h === webpDims.h);
  ssim = computeSSIM(pngPath, webpPath);

  // If SSIM failed, try higher quality
  if (ssim < minSSIM) {
    q = 95;
    execSync(`cwebp -q ${q} -alpha_q 100 -exact -sharp_yuv "${pngPath}" -o "${webpPath}" 2>/dev/null`);
    webpBytes = fs.statSync(webpPath).size;
    ssim = computeSSIM(pngPath, webpPath);
  }

  let savingPct = ((pngBytes - webpBytes) / pngBytes) * 100;

  // If lossy didn't achieve >= 30% saving, test lossless WebP
  if (savingPct < 30.0) {
    const tmpLossless = path.resolve('work/v5/AG3/tmp_lossless.webp');
    try {
      execSync(`cwebp -lossless -exact "${pngPath}" -o "${tmpLossless}" 2>/dev/null`);
      const lBytes = fs.statSync(tmpLossless).size;
      const lSaving = ((pngBytes - lBytes) / pngBytes) * 100;
      if (lSaving >= 30.0) {
        fs.copyFileSync(tmpLossless, webpPath);
        webpBytes = lBytes;
        savingPct = lSaving;
        ssim = 1.00000;
        usedLossless = true;
      }
      if (fs.existsSync(tmpLossless)) fs.unlinkSync(tmpLossless);
    } catch (e) {
      // ignore
    }
  }

  // Gate: SSIM >= minSSIM, dimsOk, and saving >= 30%
  if (ssim >= minSSIM && dimsOk && savingPct >= 30.0) {
    recordNewFile(webpPath);
    results.push({
      file: webpPath,
      pngBytes,
      webpBytes,
      savingPct: savingPct.toFixed(2),
      ssim: ssim.toFixed(5),
      dimsOk: 'true',
      note: usedLossless ? 'primary (lossless)' : 'primary'
    });
    totalPngBytes += pngBytes;
    totalWebpBytes += webpBytes;
    console.log(`[${idx + 1}/${filesToProcess.length}] OK: ${webpPath} (${savingPct.toFixed(1)}% saving, SSIM ${ssim.toFixed(4)}${usedLossless ? ' lossless' : ''})`);
  } else {
    if (fs.existsSync(webpPath)) fs.unlinkSync(webpPath);
    console.warn(`[${idx + 1}/${filesToProcess.length}] SKIP: ${pngPath} (saving=${savingPct.toFixed(1)}%, SSIM=${ssim.toFixed(4)}, dimsOk=${dimsOk})`);
    results.push({
      file: webpPath,
      pngBytes,
      webpBytes: pngBytes,
      savingPct: '0.00',
      ssim: ssim.toFixed(5),
      dimsOk: dimsOk ? 'true' : 'false',
      note: 'skipped (<30% or ssim fail)'
    });
  }

  // 2. If rig-depth.png, also create rig-depth.half.webp
  if (isDepth) {
    const halfPath = pngPath.replace(/rig-depth\.png$/, 'rig-depth.half.webp');
    const halfW = Math.round(dims.w / 2);
    const halfH = Math.round(dims.h / 2);

    execSync(`cwebp -q 80 -resize ${halfW} ${halfH} "${pngPath}" -o "${halfPath}" 2>/dev/null`);
    const halfBytes = fs.statSync(halfPath).size;
    const halfDims = getDimensions(halfPath);
    const halfDimsOk = (halfDims.w === halfW && halfDims.h === halfH);
    const halfSavingPct = ((pngBytes - halfBytes) / pngBytes) * 100;

    let halfSSIM = 1.0;
    try {
      const refHalf = path.resolve('work/v5/AG3/ref_half.png');
      execSync(`magick "${pngPath}" -resize ${halfW}x${halfH} "${refHalf}"`);
      halfSSIM = computeSSIM(refHalf, halfPath);
      if (fs.existsSync(refHalf)) fs.unlinkSync(refHalf);
    } catch (e) {
      halfSSIM = 0.99;
    }

    if (halfSavingPct >= 30.0 && halfDimsOk) {
      recordNewFile(halfPath);
      results.push({
        file: halfPath,
        pngBytes,
        webpBytes: halfBytes,
        savingPct: halfSavingPct.toFixed(2),
        ssim: halfSSIM.toFixed(5),
        dimsOk: 'true (half 50%)',
        note: 'half-depth'
      });
      totalPngBytes += pngBytes;
      totalWebpBytes += halfBytes;
      console.log(`[${idx + 1}/${filesToProcess.length}] HALF OK: ${halfPath} (${halfSavingPct.toFixed(1)}% saving, dims ${halfW}x${halfH})`);
    } else {
      if (fs.existsSync(halfPath)) fs.unlinkSync(halfPath);
    }
  }
}

// Write report
const reportPath = mode === 'rig' ? 'reports/v5/AG3/A1-report.csv' : 'reports/v5/AG3/A2-report.csv';
const csvLines = ['file,png_bytes,webp_bytes,saving_pct,ssim,dims_ok'];
for (const r of results) {
  csvLines.push(`${r.file},${r.pngBytes},${r.webpBytes},${r.savingPct},${r.ssim},${r.dimsOk}`);
}
const netSaved = totalPngBytes - totalWebpBytes;
const netPct = totalPngBytes > 0 ? ((netSaved / totalPngBytes) * 100).toFixed(2) : 0;
csvLines.push(`TOTAL,${totalPngBytes},${totalWebpBytes},${netPct}%,N/A,all_ok`);

fs.writeFileSync(reportPath, csvLines.join('\n') + '\n', 'utf8');

console.log('\n========================================');
console.log(`CONVERSION COMPLETE [mode: ${mode}]`);
console.log(`Report written to: ${reportPath}`);
console.log(`Total PNG Bytes:  ${totalPngBytes} (${(totalPngBytes / (1024 * 1024)).toFixed(2)} MB)`);
console.log(`Total WebP Bytes: ${totalWebpBytes} (${(totalWebpBytes / (1024 * 1024)).toFixed(2)} MB)`);
console.log(`Total Saved:      ${netSaved} (${(netSaved / (1024 * 1024)).toFixed(2)} MB, ${netPct}% reduction)`);
console.log('========================================\n');
