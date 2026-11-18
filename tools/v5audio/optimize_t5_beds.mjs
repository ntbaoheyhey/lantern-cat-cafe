#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const files = [
  { name: 'score-boss', src: 'score-boss.webm', bitrates: { opus: '32k', aac: '48k' } },
  { name: 'score-dawn', src: 'score-dawn.webm', bitrates: { opus: '32k', aac: '48k' } },
  { name: 'scene-workshop', src: 'scene-workshop.webm', bitrates: { opus: '32k', aac: '48k' } },
  { name: 'scene-rain', src: 'scene-rain.webm', bitrates: { opus: '32k', aac: '48k' } }
];

const AUDIO_DIR = path.resolve('/Users/bao/th-v5-ag2/apps/web/public/audio');
const OUTPUT_DIR = path.resolve('apps/web/public/audio/v5/legacy');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function runFfmpeg(args) {
  const res = spawnSync('ffmpeg', ['-hide_banner', '-y', ...args], { encoding: 'utf8' });
  if (res.status !== 0) throw new Error(`FFmpeg failed: ${res.stderr}`);
}

for (const file of files) {
  const src = path.join(AUDIO_DIR, file.src);
  const opusOut = path.join(OUTPUT_DIR, `${file.name}.opus`);
  const aacOut = path.join(OUTPUT_DIR, `${file.name}.m4a`);

  console.log(`Optimizing ${file.name}...`);
  runFfmpeg(['-i', src, '-c:a', 'libopus', '-b:a', file.bitrates.opus, '-ac', '1', '-f', 'webm', opusOut]);
  runFfmpeg(['-i', src, '-c:a', 'aac', '-b:a', file.bitrates.aac, '-ac', '1', aacOut]);
  
  const opusSize = fs.statSync(opusOut).size;
  const aacSize = fs.statSync(aacOut).size;
  console.log(`  Opus: ${(opusSize / 1024).toFixed(1)} KB, M4A: ${(aacSize / 1024).toFixed(1)} KB`);
}
console.log('Optimization complete.');
