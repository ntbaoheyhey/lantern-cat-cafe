#!/usr/bin/env node
/**
 * tools/v5audio/render.mjs
 * Deterministic sound synthesis & cutting pipeline for Taskbar Hero V5 (AG4).
 * Spawns ffmpeg to generate .opus (WebM container, 48kHz mono) and .m4a (AAC fallback).
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const AUDIO_V5_DIR = path.join(ROOT_DIR, 'apps/web/public/audio/v5');
const REPORTS_DIR = path.join(ROOT_DIR, 'reports/v5/AG4');

fs.mkdirSync(AUDIO_V5_DIR, { recursive: true });
fs.mkdirSync(path.join(AUDIO_V5_DIR, 'legacy'), { recursive: true });
fs.mkdirSync(REPORTS_DIR, { recursive: true });

function runFfmpeg(args) {
  const res = spawnSync('ffmpeg', ['-hide_banner', '-y', ...args], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`FFmpeg failed: ${res.stderr || res.stdout}`);
  }
  return res;
}

function probeAudio(filePath) {
  const res = spawnSync('ffprobe', [
    '-hide_banner',
    '-v', 'error',
    '-show_entries', 'format=duration,size,bit_rate:stream=codec_name,sample_rate,channels',
    '-of', 'json',
    filePath
  ], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`FFprobe failed on ${filePath}: ${res.stderr}`);
  }
  return JSON.parse(res.stdout);
}

export function measureLoudness(filePath) {
  // Use apad for short one-shot sound effects so EBU R128 400ms gating window integrates accurately
  const res = spawnSync('ffmpeg', [
    '-hide_banner',
    '-i', filePath,
    '-af', 'apad=pad_dur=1.0,ebur128=peak=true',
    '-f', 'null',
    '-'
  ], { encoding: 'utf8' });

  const output = res.stderr || '';
  const summaryPart = output.split('Summary:')[1] || output;
  const integratedMatch = summaryPart.match(/Integrated loudness:\s+I:\s+([-\d.]+)\s+LUFS/);
  const peakMatch = summaryPart.match(/True peak:\s+Peak:\s+([-\d.]+)\s+dBFS/);

  return {
    integratedLUFS: integratedMatch ? parseFloat(integratedMatch[1]) : -70.0,
    truePeakDb: peakMatch ? parseFloat(peakMatch[1]) : 0.0,
    raw: output
  };
}

/**
 * Synthesize an audio cue using 3-layer architecture: Transient, Body, Tail
 */
export function synthesizeCue({
  name,
  durationSec = 0.45,
  transientFilter,
  transientDelayMs = 0,
  bodyFilter,
  bodyDelayMs = 8,
  tailFilter,
  tailDelayMs = 15,
  masterGain = 1.0,
  limiterLinear = 0.82,
  subDir = ''
}) {
  const outDir = subDir ? path.join(AUDIO_V5_DIR, subDir) : AUDIO_V5_DIR;
  fs.mkdirSync(outDir, { recursive: true });

  const opusPath = path.join(outDir, `${name}.opus`);
  const m4aPath = path.join(outDir, `${name}.m4a`);

  const trClause = transientDelayMs > 0 ? `${transientFilter},adelay=delays=${transientDelayMs}:all=1[tr]` : `${transientFilter}[tr]`;
  const bdClause = bodyDelayMs > 0 ? `${bodyFilter},adelay=delays=${bodyDelayMs}:all=1[bd]` : `${bodyFilter}[bd]`;
  const tlClause = tailDelayMs > 0 ? `${tailFilter},adelay=delays=${tailDelayMs}:all=1[tl]` : `${tailFilter}[tl]`;

  const filtergraph = [
    trClause,
    bdClause,
    tlClause,
    `[tr][bd][tl]amix=inputs=3:dropout_transition=0:normalize=0,volume=${masterGain},alimiter=limit=${limiterLinear}:level=false[mix]`,
    `[mix]apad=whole_dur=${durationSec}[out]`
  ].join(';');

  // Render Opus (WebM container, 48kHz, mono)
  runFfmpeg([
    '-f', 'lavfi',
    '-i', 'anullsrc=r=48000:cl=mono',
    '-filter_complex', filtergraph,
    '-map', '[out]',
    '-t', `${durationSec}`,
    '-c:a', 'libopus',
    '-b:a', '48k',
    '-ac', '1',
    '-f', 'webm',
    opusPath
  ]);

  // Render AAC / M4A fallback (mono)
  runFfmpeg([
    '-i', opusPath,
    '-c:a', 'aac',
    '-b:a', '64k',
    '-ac', '1',
    m4aPath
  ]);

  const probe = probeAudio(opusPath);
  const loudness = measureLoudness(opusPath);
  const sizeBytes = fs.statSync(opusPath).size;

  return {
    name,
    opusPath,
    m4aPath,
    sizeBytes,
    duration: parseFloat(probe.format.duration),
    codec: probe.streams[0].codec_name,
    integratedLUFS: loudness.integratedLUFS,
    truePeakDb: loudness.truePeakDb
  };
}

/**
 * U0: Calibration Impact
 */
export function renderCalibration() {
  console.log('Rendering U0 Calibration Impact...');
  const res = synthesizeCue({
    name: 'calibration-impact',
    durationSec: 0.38,
    transientFilter: "aevalsrc=exprs='0.85*sin(2*PI*(4500-2800*(t/0.012))*t)*exp(-t/0.003)':s=48000:d=0.012",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.95*sin(2*PI*(115-55*(t/0.09))*t)*exp(-t/0.035)':s=48000:d=0.10",
    bodyDelayMs: 6,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.32,lowpass=f=650,volume=0.35,afade=t=out:st=0.03:d=0.28",
    tailDelayMs: 15,
    masterGain: 1.35,
    limiterLinear: 0.82
  });

  console.log(`Calibration render complete:`);
  console.log(`- File: ${res.opusPath} (${res.sizeBytes} bytes, duration: ${res.duration.toFixed(3)}s)`);
  console.log(`- Codec: ${res.codec}`);
  console.log(`- Integrated Loudness: ${res.integratedLUFS.toFixed(1)} LUFS`);
  console.log(`- True Peak: ${res.truePeakDb.toFixed(1)} dBFS`);
  return res;
}

// CLI dispatcher
const arg = process.argv[2];
if (arg === '--calibrate') {
  renderCalibration();
} else if (arg === '--help' || !arg) {
  console.log('Usage: node tools/v5audio/render.mjs [--calibrate | --hero-skills | --split-ranged | --enemy-ui | --all]');
}
