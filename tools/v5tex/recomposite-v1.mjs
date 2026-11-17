#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const vfxDir = '/Users/bao/th-v5-ag2/apps/web/public/vfx/v5';
const compDir = '/Users/bao/th-v5-ag2/reports/v5/AGV/comp';
const montageDir = '/Users/bao/th-v5-ag2/reports/v5/AGV/montages';
const workBase = '/Users/bao/th-v5-ag2/work/v5/AGV/jobs/recomp';
const baseFrames = {
  wave1: '/Users/bao/th-v5-ag2/work/v5/AGV/comp_base/wave1.png',
  wave3: '/Users/bao/th-v5-ag2/work/v5/AGV/comp_base/wave3.png',
  boss: '/Users/bao/th-v5-ag2/work/v5/AGV/comp_base/boss.png',
};

if (!fs.existsSync(compDir)) fs.mkdirSync(compDir, { recursive: true });
if (!fs.existsSync(montageDir)) fs.mkdirSync(montageDir, { recursive: true });
if (!fs.existsSync(workBase)) fs.mkdirSync(workBase, { recursive: true });

function run(cmd) {
  try {
    return execSync(cmd, { stdio: 'pipe' }).toString().trim();
  } catch (err) {
    console.error(`Command failed: ${cmd}`, err.message);
    return '';
  }
}

const manifestPath = path.join(vfxDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Anchor coordinates on 1280x720 battle canvas
const coords = {
  wave1: {
    mochi: { x: 480, y: 380 },
    cushion: { x: 740, y: 380 },
    ground: { x: 740, y: 460 },
    panko: { x: 400, y: 600 },
  },
  wave3: {
    soot: { x: 260, y: 220 },
    clover: { x: 260, y: 480 },
    moth: { x: 800, y: 260 },
    minion: { x: 620, y: 360 },
    party_center: { x: 450, y: 400 },
    enemy_ground: { x: 750, y: 480 },
  },
  boss: {
    boss_center: { x: 760, y: 360 },
    boss_ground: { x: 760, y: 500 },
    frontline: { x: 480, y: 380 },
  }
};

console.log(`Starting recompositing for ${Object.keys(manifest).length} effects...`);

for (const [id, meta] of Object.entries(manifest)) {
  const filePath = path.join(vfxDir, meta.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`Missing file for ${id}: ${filePath}`);
    continue;
  }

  // Get image dimensions
  const dims = run(`magick identify -format "%w %h" "${filePath}"`).split(' ');
  const imgW = parseInt(dims[0], 10) || 256;
  const imgH = parseInt(dims[1], 10) || 256;
  const cols = meta.cols || 1;
  const rows = meta.rows || 1;
  const frameW = Math.round(imgW / cols);
  const frameH = Math.round(imgH / rows);

  // Determine base frame
  let baseFrame = baseFrames.wave1;
  let targetX = 740;
  let targetY = 380;
  const isBoss = id.startsWith('yarn-giant') || id.startsWith('enemy-');
  const isSoot = id.startsWith('soot-');
  const isClover = id.startsWith('clover-');
  const isPanko = id.startsWith('panko-');
  const isMochi = id.startsWith('mochi-');

  if (isBoss) {
    baseFrame = baseFrames.boss;
    targetX = coords.boss.boss_center.x;
    targetY = coords.boss.boss_center.y;
    if (meta.anchor === 'ground') {
      targetY = coords.boss.boss_ground.y;
    } else if (meta.anchor === 'target') {
      targetX = coords.boss.frontline.x;
      targetY = coords.boss.frontline.y;
    }
  } else if (isSoot) {
    baseFrame = baseFrames.wave3;
    if (meta.anchor === 'caster') {
      targetX = coords.wave3.soot.x;
      targetY = coords.wave3.soot.y;
    } else if (meta.anchor === 'ground') {
      targetX = coords.wave3.enemy_ground.x;
      targetY = coords.wave3.enemy_ground.y;
    } else {
      targetX = coords.wave3.moth.x;
      targetY = coords.wave3.moth.y;
    }
  } else if (isClover) {
    baseFrame = baseFrames.wave3;
    if (meta.anchor === 'caster') {
      targetX = coords.wave3.clover.x;
      targetY = coords.wave3.clover.y;
    } else if (meta.anchor === 'ground') {
      targetX = coords.wave3.party_center.x;
      targetY = coords.wave3.party_center.y + 60;
    } else {
      targetX = coords.wave3.party_center.x;
      targetY = coords.wave3.party_center.y;
    }
  } else if (isPanko) {
    baseFrame = baseFrames.wave1;
    if (meta.anchor === 'caster') {
      targetX = coords.wave1.panko.x;
      targetY = coords.wave1.panko.y;
    } else if (meta.anchor === 'ground') {
      targetX = coords.wave1.ground.x;
      targetY = coords.wave1.ground.y;
    } else {
      targetX = coords.wave1.cushion.x;
      targetY = coords.wave1.cushion.y;
    }
  } else if (isMochi) {
    baseFrame = baseFrames.wave1;
    if (meta.anchor === 'caster') {
      targetX = coords.wave1.mochi.x;
      targetY = coords.wave1.mochi.y;
    } else if (meta.anchor === 'ground') {
      targetX = coords.wave1.ground.x;
      targetY = coords.wave1.ground.y;
    } else {
      targetX = coords.wave1.cushion.x;
      targetY = coords.wave1.cushion.y;
    }
  }

  const isVignette = id.startsWith('vignette-');
  const tempSample = path.join(workBase, `${id}_sample.png`);
  const isAtlas = (cols > 1 || rows > 1);

  if (isVignette) {
    run(`magick "${filePath}" -resize 1280x720! "${tempSample}"`);
    const outJpg = path.join(compDir, `${id}.jpg`);
    run(`magick "${baseFrame}" "${tempSample}" -compose plus -composite -resize 960x540 -quality 80 "${outJpg}"`);
  } else if (isAtlas) {
    // Extract peak frame (col 1, row 1 for 4x4 atlas = frame 5)
    const cropX = cols > 1 ? frameW : 0;
    const cropY = rows > 1 ? frameH : 0;
    const dispW = Math.round(frameW * 1.25);
    const dispH = Math.round(frameH * 1.25);
    run(`magick "${filePath}" -crop ${frameW}x${frameH}+${cropX}+${cropY} +repage -resize ${dispW}x${dispH} "${tempSample}"`);
    const left = Math.round(targetX - dispW / 2);
    const top = Math.round(targetY - dispH / 2);
    const outJpg = path.join(compDir, `${id}.jpg`);
    const composeMode = meta.blend === 'normal' ? 'over' : 'plus';
    run(`magick "${baseFrame}" "${tempSample}" -geometry +${left}+${top} -compose ${composeMode} -composite -resize 960x540 -quality 80 "${outJpg}"`);
  } else {
    // Single image
    let sz = frameW;
    if (meta.anchor === 'ground') sz = 420;
    else if (sz < 200) sz = 240;
    run(`magick "${filePath}" -resize ${sz}x${sz} "${tempSample}"`);
    const left = Math.round(targetX - sz / 2);
    const top = Math.round(targetY - sz / 2);
    const outJpg = path.join(compDir, `${id}.jpg`);
    const composeMode = meta.blend === 'normal' ? 'over' : 'plus';
    run(`magick "${baseFrame}" "${tempSample}" -geometry +${left}+${top} -compose ${composeMode} -composite -resize 960x540 -quality 80 "${outJpg}"`);
  }
}

console.log('Individual composites finished. Building set montages...');

// Set definitions for REVIEW requests
const sets = {
  'mochi-v2': [
    'mochi-impact', 'mochi-slash', 'mochi-anticipation', 'mochi-decal',
    'mochi-particle-1', 'mochi-particle-2', 'mochi-particle-3'
  ],
  'soot': [
    'soot-impact', 'soot-projectile', 'soot-anticipation', 'soot-decal',
    'soot-particle-1', 'soot-particle-2', 'soot-particle-3'
  ],
  'clover': [
    'clover-impact', 'clover-projectile', 'clover-anticipation', 'clover-decal',
    'clover-particle-1', 'clover-particle-2', 'clover-particle-3'
  ],
  'panko': [
    'panko-impact', 'panko-slash', 'panko-anticipation', 'panko-decal',
    'panko-particle-1', 'panko-particle-2', 'panko-particle-3'
  ],
  'ultimates': [
    'mochi-ult-charge', 'mochi-ult-release', 'soot-ult-charge', 'soot-ult-release',
    'clover-ult-charge', 'clover-ult-release', 'panko-ult-charge', 'panko-ult-release'
  ],
  'boss-enemy': [
    'yarn-giant-charge-swirl', 'yarn-giant-shockwave-ring', 'yarn-giant-ground-crack',
    'enemy-hit-spark-1', 'enemy-hit-spark-2', 'enemy-hit-spark-3', 'enemy-death-dissolve'
  ],
  'crits': [
    'mochi-crit-burst', 'soot-crit-burst', 'clover-crit-burst', 'panko-crit-burst'
  ],
  'auras-status': [
    'aura-shield-ward', 'aura-fire-buff', 'aura-heal-regen', 'aura-attack-buff',
    'status-poison-loop', 'status-burn-loop', 'status-stun-loop', 'status-slow-loop'
  ],
  'hitstop-vignettes': [
    'hit-stop-flash-white', 'hit-stop-flash-gold',
    'vignette-damage-red', 'vignette-heal-green', 'vignette-ult-gold'
  ]
};

for (const [setName, ids] of Object.entries(sets)) {
  const filePaths = ids.map(id => {
    const f = path.join(vfxDir, `${id}.webp`);
    return fs.existsSync(f) ? `"${f}"` : null;
  }).filter(Boolean);

  if (filePaths.length === 0) continue;

  const montageOut = path.join(montageDir, `${setName}-montage.jpg`);
  run(`magick montage ${filePaths.join(' ')} -tile 4x2 -geometry 256x256+4+4 -background black -quality 85 "${montageOut}"`);
  console.log(`Montage created: ${montageOut}`);
}

console.log('All composites and montages generated successfully.');
