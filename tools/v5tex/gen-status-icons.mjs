#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AGV/jobs/status_icons';
const manifestPath = path.join(vfxDir, 'manifest.json');

if (!fs.existsSync(vfxDir)) fs.mkdirSync(vfxDir, { recursive: true });
if (!fs.existsSync(workBase)) fs.mkdirSync(workBase, { recursive: true });

function run(cmd) {
  execSync(cmd, { stdio: 'pipe' });
}

function toWebP(pngIn, webpOut, q = 90) {
  run(`cwebp -q ${q} -alpha_q 95 "${pngIn}" -o "${webpOut}"`);
}

console.log('Generating R9 status effect badge icons for mobile (390 px)...');

// 1. Burn Icon (64x64 base, rendered at 128x128 for retina sharpness)
// Shape: Dark circular badge background with gold rim, bright fiery flame tongue inside
const burnPng = path.join(workBase, 'icon-status-burn.png');
run(`magick -size 128x128 xc:none \\
  -fill "#180c08cc" -stroke "#e65c00" -strokewidth 3 -draw "circle 64,64 64,12" \\
  -stroke "#ffcc00" -strokewidth 1.5 -draw "circle 64,64 64,15" \\
  \\( -size 128x128 xc:none \\
     -fill "#d83800" -draw "path 'M 64,24 C 74,40 92,60 88,84 C 84,104 68,108 64,108 C 60,108 44,104 40,84 C 36,60 54,40 64,24 Z'" \\
     -fill "#ff7a00" -draw "path 'M 64,36 C 70,50 82,66 79,84 C 76,98 66,102 64,102 C 62,102 52,98 49,84 C 46,66 58,50 64,36 Z'" \\
     -fill "#ffea60" -draw "path 'M 64,52 C 68,62 74,74 72,86 C 70,94 66,97 64,97 C 62,97 58,94 56,86 C 54,74 60,62 64,52 Z'" \\
     -fill "#ffffff" -draw "path 'M 64,68 C 66,74 69,80 68,88 C 67,92 65,94 64,94 C 63,94 61,92 60,88 C 59,80 62,74 64,68 Z'" \\
  \\) -composite "${burnPng}"`);

toWebP(burnPng, path.join(vfxDir, 'icon-status-burn.webp'));

// 2. Poison Icon
// Shape: Dark circular badge with emerald rim, bubbling poison droplet & toxic skull-bubble
const poisonPng = path.join(workBase, 'icon-status-poison.png');
run(`magick -size 128x128 xc:none \\
  -fill "#06180bcc" -stroke "#1dbb45" -strokewidth 3 -draw "circle 64,64 64,12" \\
  -stroke "#72ff88" -strokewidth 1.5 -draw "circle 64,64 64,15" \\
  \\( -size 128x128 xc:none \\
     -fill "#138830" -draw "path 'M 64,24 C 72,40 88,60 86,82 C 84,102 68,106 64,106 C 60,106 44,102 42,82 C 40,60 56,40 64,24 Z'" \\
     -fill "#28e050" -draw "path 'M 64,36 C 70,50 80,66 78,82 C 76,96 66,100 64,100 C 62,100 52,96 50,82 C 48,66 58,50 64,36 Z'" \\
     -fill "#94ff66" -draw "circle 64,80 64,68" \\
     -fill "#06180b" -draw "circle 58,78 58,75 circle 70,78 70,75" \\
     -fill "#ffffff" -draw "circle 54,58 54,54 circle 74,86 74,84" \\
  \\) -composite "${poisonPng}"`);

toWebP(poisonPng, path.join(vfxDir, 'icon-status-poison.webp'));

// 3. Slow Icon
// Shape: Dark circular badge with frost cyan rim, sharp 6-pointed ice crystal snowflake
const slowPng = path.join(workBase, 'icon-status-slow.png');
run(`magick -size 128x128 xc:none \\
  -fill "#06121acc" -stroke "#00a2e8" -strokewidth 3 -draw "circle 64,64 64,12" \\
  -stroke "#a0e8ff" -strokewidth 1.5 -draw "circle 64,64 64,15" \\
  \\( -size 128x128 xc:none \\
     -stroke "#00c3ff" -strokewidth 5 -draw "line 64,28 64,100 line 28,64 100,64 line 38,38 90,90 line 38,90 90,38" \\
     -stroke "#e0f8ff" -strokewidth 2.5 -draw "line 64,28 64,100 line 28,64 100,64 line 38,38 90,90 line 38,90 90,38" \\
     -stroke "#ffffff" -strokewidth 1.5 -draw "line 56,36 64,44 line 72,36 64,44 line 56,92 64,84 line 72,92 64,84 line 36,56 44,64 line 36,72 44,64 line 92,56 84,64 line 92,72 84,64" \\
     -fill "#ffffff" -stroke none -draw "circle 64,64 64,58" \\
  \\) -composite "${slowPng}"`);

toWebP(slowPng, path.join(vfxDir, 'icon-status-slow.webp'));

// 4. Stun Icon
// Shape: Dark circular badge with electric amber rim, 4-pointed diamond star with concentric daze spirals
const stunPng = path.join(workBase, 'icon-status-stun.png');
run(`magick -size 128x128 xc:none \\
  -fill "#1a1604cc" -stroke "#f0a800" -strokewidth 3 -draw "circle 64,64 64,12" \\
  -stroke "#ffea70" -strokewidth 1.5 -draw "circle 64,64 64,15" \\
  \\( -size 128x128 xc:none \\
     -fill "#e09000" -draw "path 'M 64,24 Q 64,54 34,64 Q 64,64 64,94 Q 64,64 94,64 Q 64,64 64,24 Z'" \\
     -fill "#ffcc00" -draw "path 'M 64,32 Q 64,56 40,64 Q 64,64 64,86 Q 64,64 88,64 Q 64,64 64,32 Z'" \\
     -fill "#fff590" -draw "path 'M 64,42 Q 64,58 48,64 Q 64,64 64,76 Q 64,64 80,64 Q 64,64 64,42 Z'" \\
     -fill "#ffffff" -draw "circle 64,64 64,59" \\
     -fill "#ffea60" -draw "circle 42,42 42,39 circle 86,42 86,39 circle 42,86 42,83 circle 86,86 86,83" \\
  \\) -composite "${stunPng}"`);

toWebP(stunPng, path.join(vfxDir, 'icon-status-stun.webp'));

// Update manifest
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const newEntries = {
  'icon-status-burn': {
    file: 'icon-status-burn.webp',
    cols: 1,
    rows: 1,
    frameMs: 50,
    blend: 'normal',
    anchor: 'target',
    sizePx: 128
  },
  'icon-status-poison': {
    file: 'icon-status-poison.webp',
    cols: 1,
    rows: 1,
    frameMs: 50,
    blend: 'normal',
    anchor: 'target',
    sizePx: 128
  },
  'icon-status-slow': {
    file: 'icon-status-slow.webp',
    cols: 1,
    rows: 1,
    frameMs: 50,
    blend: 'normal',
    anchor: 'target',
    sizePx: 128
  },
  'icon-status-stun': {
    file: 'icon-status-stun.webp',
    cols: 1,
    rows: 1,
    frameMs: 50,
    blend: 'normal',
    anchor: 'target',
    sizePx: 128
  }
};

Object.assign(manifest, newEntries);
// Sort keys
const sortedManifest = {};
for (const k of Object.keys(manifest).sort()) {
  sortedManifest[k] = manifest[k];
}
fs.writeFileSync(manifestPath, JSON.stringify(sortedManifest, null, 2) + '\n');
console.log('Manifest updated with 4 R9 status icons and sorted.');
