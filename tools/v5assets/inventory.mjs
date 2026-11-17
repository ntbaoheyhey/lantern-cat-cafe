#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const TARGET_DIRS = [
  'apps/web/public/units',
  'apps/web/public/art',
  'apps/web/public/ui-art2',
  'apps/web/public/relics',
  'apps/web/public/cinematics'
];

const EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg']);

function findFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findFiles(fullPath, fileList);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (EXTENSIONS.has(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

console.log('Scanning directories...');
const allFiles = TARGET_DIRS.flatMap(dir => findFiles(dir));
console.log(`Found ${allFiles.length} images.`);

// Create a temporary file list for magick identify
const tmpListPath = path.resolve('work/v5/AG3/identify_list.txt');
fs.mkdirSync(path.dirname(tmpListPath), { recursive: true });
fs.writeFileSync(tmpListPath, allFiles.join('\n') + '\n', 'utf8');

console.log('Running magick identify...');
let identifyOutput = '';
try {
  identifyOutput = execFileSync('magick', [
    'identify',
    '-format',
    '%i|%w|%h|%[opaque]\n',
    `@${tmpListPath}`
  ], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
} catch (err) {
  console.error('Error running magick identify:', err.message);
  process.exit(1);
}

const infoMap = new Map();
const lines = identifyOutput.split('\n');
for (const line of lines) {
  if (!line.trim()) continue;
  const parts = line.split('|');
  if (parts.length >= 4) {
    const filePath = parts[0];
    const width = parseInt(parts[1], 10);
    const height = parseInt(parts[2], 10);
    const isOpaque = parts[3].trim().toLowerCase() === 'true';
    const hasAlpha = !isOpaque;
    infoMap.set(filePath, { width, height, hasAlpha });
  }
}

const items = [];
let totalBytes = 0;

for (const filePath of allFiles) {
  const stat = fs.statSync(filePath);
  const bytes = stat.size;
  totalBytes += bytes;

  // magick identify output might have relative or normalized path
  const info = infoMap.get(filePath) || { width: 0, height: 0, hasAlpha: false };
  items.push({
    path: filePath,
    bytes,
    width: info.width,
    height: info.height,
    hasAlpha: info.hasAlpha
  });
}

// Sort descending by size
items.sort((a, b) => b.bytes - a.bytes);

// Write CSV
const csvRows = ['path,bytes,width,height,has_alpha'];
for (const item of items) {
  csvRows.push(`${item.path},${item.bytes},${item.width},${item.height},${item.hasAlpha}`);
}
const csvPath = 'reports/v5/AG3/inventory.csv';
fs.mkdirSync(path.dirname(csvPath), { recursive: true });
fs.writeFileSync(csvPath, csvRows.join('\n') + '\n', 'utf8');
console.log(`Saved inventory to ${csvPath}`);

// Print Top 25 and Totals
console.log('\n--- TOP 25 HEAVIEST ASSETS ---');
console.log('Rank | Bytes      | Dimensions | Alpha | Path');
console.log('------------------------------------------------------------');
for (let i = 0; i < Math.min(25, items.length); i++) {
  const item = items[i];
  const sizeMB = (item.bytes / (1024 * 1024)).toFixed(2) + ' MB';
  const rank = String(i + 1).padStart(4);
  const bytesStr = String(item.bytes).padStart(10);
  const dims = `${item.width}x${item.height}`.padEnd(10);
  const alphaStr = item.hasAlpha ? 'yes' : 'no ';
  console.log(`${rank} | ${bytesStr} (${sizeMB.padStart(8)}) | ${dims} | ${alphaStr} | ${item.path}`);
}
console.log('------------------------------------------------------------');
console.log(`Total files: ${items.length}`);
console.log(`Total bytes: ${totalBytes} bytes (${(totalBytes / (1024 * 1024)).toFixed(2)} MB)`);
