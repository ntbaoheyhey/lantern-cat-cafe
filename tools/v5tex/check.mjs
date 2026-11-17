#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const startTime = Date.now();
const vfxDir = path.resolve('apps/web/public/vfx/v5');
const manifestPath = path.join(vfxDir, 'manifest.json');

const MAX_FILE_SIZE = 120 * 1024; // 120 KB
const MAX_TOTAL_SIZE = 2.5 * 1024 * 1024; // 2.5 MB
const ALLOWED_BLENDS = new Set(['add', 'normal']);
const ALLOWED_ANCHORS = new Set(['caster', 'target', 'ground']);

function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}

function getWebPDimensions(buf) {
  if (buf.length < 30) return null;
  const riff = buf.toString('ascii', 0, 4);
  const webp = buf.toString('ascii', 8, 12);
  if (riff !== 'RIFF' || webp !== 'WEBP') return null;
  const chunk = buf.toString('ascii', 12, 16);
  if (chunk === 'VP8X') {
    const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
    const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
    return { width, height };
  } else if (chunk === 'VP8 ') {
    const width = (buf[26] | (buf[27] << 8)) & 0x3fff;
    const height = (buf[28] | (buf[29] << 8)) & 0x3fff;
    return { width, height };
  } else if (chunk === 'VP8L') {
    const b0 = buf[21], b1 = buf[22], b2 = buf[23], b3 = buf[24];
    const width = 1 + (b0 | ((b1 & 0x3f) << 8));
    const height = 1 + (((b1 >> 6) | (b2 << 2) | ((b3 & 0x0f) << 10)));
    return { width, height };
  }
  return null;
}

function runCheck() {
  const errors = [];

  if (!fs.existsSync(manifestPath)) {
    console.error(`ERROR: Manifest file not found at ${manifestPath}`);
    process.exit(1);
  }

  let manifest;
  try {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    manifest = JSON.parse(raw);
  } catch (e) {
    console.error(`ERROR: Failed to parse manifest.json: ${e.message}`);
    process.exit(1);
  }

  // 1. Verify sorted keys
  const keys = Object.keys(manifest);
  const sortedKeys = [...keys].sort();
  for (let i = 0; i < keys.length; i++) {
    if (keys[i] !== sortedKeys[i]) {
      errors.push(`Manifest keys are not sorted! Found "${keys[i]}", expected "${sortedKeys[i]}".`);
      break;
    }
  }

  console.log('='.repeat(78));
  console.log(`V5 VFX CHECK | Validating ${keys.length} manifest entries in ${vfxDir}`);
  console.log('='.repeat(78));
  console.log(
    'ID'.padEnd(24) +
    'File'.padEnd(24) +
    'Grid'.padEnd(8) +
    'FrameSz'.padEnd(10) +
    'FileSz'.padEnd(10) +
    'Blend'.padEnd(8) +
    'Anchor'
  );
  console.log('-'.repeat(78));

  const manifestFiles = new Set();

  for (const [id, entry] of Object.entries(manifest)) {
    const { file, cols, rows, frameMs, blend, anchor, sizePx } = entry;

    if (!file || typeof file !== 'string') {
      errors.push(`[${id}] Missing or invalid 'file'`);
      continue;
    }
    manifestFiles.add(file);

    if (!Number.isInteger(cols) || cols < 1) errors.push(`[${id}] Invalid 'cols': ${cols}`);
    if (!Number.isInteger(rows) || rows < 1) errors.push(`[${id}] Invalid 'rows': ${rows}`);
    if (typeof frameMs !== 'number' || frameMs <= 0) errors.push(`[${id}] Invalid 'frameMs': ${frameMs}`);
    if (!ALLOWED_BLENDS.has(blend)) errors.push(`[${id}] Invalid 'blend': ${blend}`);
    if (!ALLOWED_ANCHORS.has(anchor)) errors.push(`[${id}] Invalid 'anchor': ${anchor}`);
    if (typeof sizePx !== 'number' || sizePx <= 0) errors.push(`[${id}] Invalid 'sizePx': ${sizePx}`);

    const filePath = path.join(vfxDir, file);
    if (!fs.existsSync(filePath)) {
      errors.push(`[${id}] File does not exist: ${file}`);
      continue;
    }

    const stat = fs.statSync(filePath);
    if (stat.size > MAX_FILE_SIZE) {
      errors.push(`[${id}] File size ${(stat.size / 1024).toFixed(1)} KB exceeds 120 KB limit`);
    }

    const buf = fs.readFileSync(filePath);
    const dims = getWebPDimensions(buf);
    if (!dims) {
      errors.push(`[${id}] Could not parse WebP dimensions for ${file}`);
      continue;
    }

    const { width, height } = dims;
    if (!isPowerOfTwo(width) || !isPowerOfTwo(height)) {
      errors.push(`[${id}] Dimensions ${width}x${height} are not power of two`);
    }

    if (cols === 1 && rows === 1) {
      if (width > 512 || height > 512) {
        errors.push(`[${id}] Single texture ${width}x${height} exceeds 512px max`);
      }
    } else {
      const frameW = width / cols;
      const frameH = height / rows;
      if (frameW !== 128 && frameW !== 256) {
        errors.push(`[${id}] Frame width ${frameW} is not 128 or 256 px`);
      }
      if (frameH !== 128 && frameH !== 256) {
        errors.push(`[${id}] Frame height ${frameH} is not 128 or 256 px`);
      }
    }

    const frameInfo = cols === 1 && rows === 1 ? `${width}px` : `${width / cols}x${height / rows}`;
    console.log(
      id.padEnd(24) +
      file.padEnd(24) +
      `${cols}x${rows}`.padEnd(8) +
      frameInfo.padEnd(10) +
      `${(stat.size / 1024).toFixed(1)} KB`.padEnd(10) +
      blend.padEnd(8) +
      anchor
    );
  }

  // Calculate total folder size
  let totalDirSize = 0;
  const dirEntries = fs.readdirSync(vfxDir);
  for (const f of dirEntries) {
    if (f === '.gitkeep') continue;
    const full = path.join(vfxDir, f);
    const s = fs.statSync(full);
    if (s.isFile()) {
      totalDirSize += s.size;
    }
  }

  console.log('-'.repeat(78));
  console.log(`Total VFX/V5 files on disk: ${dirEntries.length} | Total size: ${(totalDirSize / 1024).toFixed(1)} KB / ${(MAX_TOTAL_SIZE / 1024).toFixed(1)} KB max`);
  const elapsedMs = Date.now() - startTime;
  console.log(`Execution time: ${elapsedMs} ms (< 10000 ms target)`);

  if (totalDirSize > MAX_TOTAL_SIZE) {
    errors.push(`Total vfx/v5 folder size ${(totalDirSize / (1024 * 1024)).toFixed(2)} MB exceeds 2.5 MB`);
  }

  if (errors.length > 0) {
    console.error('\nFAILURES:');
    for (const err of errors) console.error(`  - ${err}`);
    process.exit(1);
  } else {
    console.log('\nALL CHECKS PASSED.');
    process.exit(0);
  }
}

runCheck();
