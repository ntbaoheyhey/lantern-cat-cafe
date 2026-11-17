#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const artifactDir = '/Users/bao/.gemini/antigravity/brain/76c304de-370e-4b93-be74-35e21c26a772';

const items = [
  {
    src: path.join(artifactDir, 'herbal_tea_blossom_spritesheet_1794900320722.jpg'),
    dest: path.join(vfxDir, 'clover-ult-release.webp'),
    name: 'clover-ult-release',
    q: 85,
    threshold: '5%'
  },
  {
    src: path.join(artifactDir, 'bakery_flour_gathering_spritesheet_1794900323225.jpg'),
    dest: path.join(vfxDir, 'panko-ult-charge.webp'),
    name: 'panko-ult-charge',
    q: 78,
    threshold: '6%'
  },
  {
    src: path.join(artifactDir, 'toast_crumb_blast_spritesheet_png_1794900332452.jpg'),
    dest: path.join(vfxDir, 'panko-ult-release.webp'),
    name: 'panko-ult-release',
    q: 78,
    threshold: '6%'
  }
];

console.log('Processing generation-first sheets to WebP in apps/web/public/vfx/v5...');

for (const item of items) {
  if (!fs.existsSync(item.src)) {
    throw new Error(`Source file missing: ${item.src}`);
  }

  // 1. Threshold black background so pure black is #000000 for additive blending
  // 2. Encode to WebP with target size <= 120 KB
  const cmd = `magick "${item.src}" -resize 1024x1024 -black-threshold ${item.threshold} -quality ${item.q} -define webp:method=6 "${item.dest}"`;
  execSync(cmd, { stdio: 'inherit' });

  const stat = fs.statSync(item.dest);
  console.log(`[OK] ${item.name} -> ${item.dest} (${(stat.size / 1024).toFixed(1)} KB)`);
  if (stat.size > 120 * 1024) {
    console.warn(`WARNING: ${item.name} is ${(stat.size / 1024).toFixed(1)} KB, exceeds 120 KB! Adjusting quality...`);
    const cmdAdjust = `magick "${item.src}" -resize 1024x1024 -black-threshold ${item.threshold} -quality 70 -define webp:method=6 "${item.dest}"`;
    execSync(cmdAdjust, { stdio: 'inherit' });
    const statAdj = fs.statSync(item.dest);
    console.log(`  -> Adjusted size: ${(statAdj.size / 1024).toFixed(1)} KB`);
  }
}

console.log('All 3 generation-first sheets processed.');
