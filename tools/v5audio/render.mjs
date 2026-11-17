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
const AUDIO_DIR = path.join(ROOT_DIR, 'apps/web/public/audio');
const AUDIO_V5_DIR = path.join(ROOT_DIR, 'apps/web/public/audio/v5');
const LEGACY_DIR = path.join(AUDIO_V5_DIR, 'legacy');
const REPORTS_AGS_DIR = path.join(ROOT_DIR, 'reports/v5/AGS');
const REPORTS_DIR = REPORTS_AGS_DIR;

fs.mkdirSync(AUDIO_V5_DIR, { recursive: true });
fs.mkdirSync(LEGACY_DIR, { recursive: true });
fs.mkdirSync(REPORTS_AGS_DIR, { recursive: true });

function writeReportFile(filename, content) {
  const agsPath = path.join(REPORTS_AGS_DIR, filename);
  fs.writeFileSync(agsPath, content, 'utf8');
}

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
  targetLufs = -18.0,
  limiterLinear = 0.78,
  opusBitrate = '36k',
  aacBitrate = '48k',
  subDir = ''
}) {
  const outDir = subDir ? path.join(AUDIO_V5_DIR, subDir) : AUDIO_V5_DIR;
  fs.mkdirSync(outDir, { recursive: true });

  const opusPath = path.join(outDir, `${name}.opus`);
  const m4aPath = path.join(outDir, `${name}.m4a`);

  const trClause = transientDelayMs > 0 ? `${transientFilter},adelay=delays=${transientDelayMs}:all=1[tr]` : `${transientFilter}[tr]`;
  const bdClause = bodyDelayMs > 0 ? `${bodyFilter},adelay=delays=${bodyDelayMs}:all=1[bd]` : `${bodyFilter}[bd]`;
  const tlClause = tailDelayMs > 0 ? `${tailFilter},adelay=delays=${tailDelayMs}:all=1[tl]` : `${tailFilter}[tl]`;

  let currentGain = masterGain;
  let finalProbe = null;
  let finalLoudness = null;

  for (let pass = 0; pass < 4; pass++) {
    const filtergraph = [
      trClause,
      bdClause,
      tlClause,
      `[tr][bd][tl]amix=inputs=3:dropout_transition=0:normalize=0,volume=${currentGain.toFixed(3)},alimiter=limit=${limiterLinear}:level=false[mix]`,
      `[mix]apad=whole_dur=${durationSec}[out]`
    ].join(';');

    runFfmpeg([
      '-f', 'lavfi',
      '-i', 'anullsrc=r=48000:cl=mono',
      '-filter_complex', filtergraph,
      '-map', '[out]',
      '-t', `${durationSec}`,
      '-c:a', 'libopus',
      '-b:a', opusBitrate,
      '-ac', '1',
      '-f', 'webm',
      opusPath
    ]);

    finalLoudness = measureLoudness(opusPath);
    if (!targetLufs) break;

    const diff = targetLufs - finalLoudness.integratedLUFS;
    if (Math.abs(diff) <= 1.8 && finalLoudness.truePeakDb <= -1.0) {
      break;
    }

    if (pass === 3) break;

    if (finalLoudness.truePeakDb > -1.0) {
      const peakOvershoot = finalLoudness.truePeakDb - (-1.4);
      currentGain *= Math.pow(10, -peakOvershoot / 20);
    } else {
      const factor = Math.pow(10, Math.min(1.5, Math.max(-1.5, diff)) / 20);
      currentGain = Math.max(0.1, currentGain * factor);
    }
  }

  runFfmpeg([
    '-i', opusPath,
    '-c:a', 'aac',
    '-b:a', aacBitrate,
    '-ac', '1',
    m4aPath
  ]);

  finalProbe = probeAudio(opusPath);
  finalLoudness = measureLoudness(opusPath);
  const sizeBytes = fs.statSync(opusPath).size;

  return {
    name,
    opusPath,
    m4aPath,
    sizeBytes,
    duration: parseFloat(finalProbe.format.duration),
    codec: finalProbe.streams[0].codec_name,
    integratedLUFS: finalLoudness.integratedLUFS,
    truePeakDb: finalLoudness.truePeakDb
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
    targetLufs: -18.0,
    limiterLinear: 0.78
  });

  console.log(`Calibration render complete:`);
  console.log(`- File: ${res.opusPath} (${res.sizeBytes} bytes, duration: ${res.duration.toFixed(3)}s)`);
  console.log(`- Codec: ${res.codec}`);
  console.log(`- Integrated Loudness: ${res.integratedLUFS.toFixed(1)} LUFS`);
  console.log(`- True Peak: ${res.truePeakDb.toFixed(1)} dBFS`);
  return res;
}

/**
 * U1: Hero Skill Set Definitions (4 heroes x 3 actions = 12 cues)
 */
export const HERO_SKILL_DEFINITIONS = [
  {
    cueId: 'hero.mochi.basic',
    name: 'hero-mochi-basic',
    impactOffsetMs: 45,
    durationSec: 0.38,
    transientFilter: "anoisesrc=c=pink:r=48000:d=0.035,bandpass=f=2200:w=1400,afade=t=out:st=0:d=0.035,volume=0.95",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.95*sin(2*PI*(100-35*(t/0.12))*t)*exp(-t/0.048)':s=48000:d=0.12",
    bodyDelayMs: 10,
    tailFilter: "anoisesrc=c=brown:r=48000:d=0.22,lowpass=f=450,volume=0.32,afade=t=out:st=0.02:d=0.20",
    tailDelayMs: 25,
    masterGain: 2.45,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'hero.mochi.skill',
    name: 'hero-mochi-skill',
    impactOffsetMs: 95,
    durationSec: 0.65,
    transientFilter: "anoisesrc=c=pink:r=48000:d=0.09,bandpass=f=1400:w=1000,afade=t=in:st=0:d=0.06,afade=t=out:st=0.06:d=0.03,volume=0.95",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.95*sin(2*PI*(110-45*(t/0.18))*t)*exp(-t/0.06)':s=48000:d=0.18",
    bodyDelayMs: 55,
    tailFilter: "anoisesrc=c=brown:r=48000:d=0.45,lowpass=f=400,volume=0.36,afade=t=out:st=0.05:d=0.40",
    tailDelayMs: 80,
    masterGain: 2.11,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'hero.mochi.ultimate',
    name: 'hero-mochi-ultimate',
    impactOffsetMs: 250,
    durationSec: 1.05,
    transientFilter: "anoisesrc=c=pink:r=48000:d=0.22,bandpass=f=1300:w=900,afade=t=in:st=0:d=0.18,afade=t=out:st=0.18:d=0.04,volume=0.9",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='1.0*sin(2*PI*(92-35*(t/0.25))*t)*exp(-t/0.08)':s=48000:d=0.25",
    bodyDelayMs: 220,
    tailFilter: "anoisesrc=c=brown:r=48000:d=0.65,lowpass=f=360,volume=0.38,afade=t=out:st=0.08:d=0.57",
    tailDelayMs: 250,
    masterGain: 1.29,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'hero.soot.basic',
    name: 'hero-soot-basic',
    impactOffsetMs: 30,
    durationSec: 0.32,
    transientFilter: "aevalsrc=exprs='0.92*sin(2*PI*(4200-1800*(t/0.008))*t)*exp(-t/0.002)':s=48000:d=0.008",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.95*sin(2*PI*(145-50*(t/0.12))*t)*exp(-t/0.038)':s=48000:d=0.12",
    bodyDelayMs: 5,
    tailFilter: "anoisesrc=c=white:r=48000:d=0.20,highpass=f=2200,volume=0.28,afade=t=out:st=0.01:d=0.19",
    tailDelayMs: 10,
    masterGain: 1.55,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'hero.soot.skill',
    name: 'hero-soot-skill',
    impactOffsetMs: 75,
    durationSec: 0.62,
    transientFilter: "aevalsrc=exprs='0.95*(sin(2*PI*3800*t)+0.5*sin(2*PI*5800*t))*exp(-t/0.004)':s=48000:d=0.015",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.95*sin(2*PI*(140-50*(t/0.14))*t)*exp(-t/0.045)':s=48000:d=0.15",
    bodyDelayMs: 15,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.45,bandpass=f=3200:w=1800,volume=0.34,afade=t=out:st=0.03:d=0.42",
    tailDelayMs: 25,
    masterGain: 1.18,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'hero.soot.ultimate',
    name: 'hero-soot-ultimate',
    impactOffsetMs: 270,
    durationSec: 1.10,
    transientFilter: "anoisesrc=c=white:r=48000:d=0.26,bandpass=f=2600:w=1600,afade=t=in:st=0:d=0.24,afade=t=out:st=0.24:d=0.02,volume=0.9",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='1.0*sin(2*PI*(120-40*(t/0.25))*t)*exp(-t/0.07)':s=48000:d=0.25",
    bodyDelayMs: 240,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.70,bandpass=f=2800:w=2000,volume=0.38,afade=t=out:st=0.05:d=0.65",
    tailDelayMs: 270,
    masterGain: 0.55,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'hero.clover.basic',
    name: 'hero-clover-basic',
    impactOffsetMs: 35,
    durationSec: 0.38,
    transientFilter: "aevalsrc=exprs='0.85*(sin(2*PI*1760*t)+0.5*sin(2*PI*2640*t)+0.3*sin(2*PI*3520*t))*exp(-t/0.06)':s=48000:d=0.15",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.88*sin(2*PI*(185-35*(t/0.14))*t)*exp(-t/0.048)':s=48000:d=0.14",
    bodyDelayMs: 8,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.25,bandpass=f=2200:w=1100,volume=0.25,afade=t=out:st=0.03:d=0.22",
    tailDelayMs: 18,
    masterGain: 1.25,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'hero.clover.skill',
    name: 'hero-clover-skill',
    impactOffsetMs: 90,
    durationSec: 0.72,
    transientFilter: "aevalsrc=exprs='0.75*(sin(2*PI*1760*t)+0.6*sin(2*PI*2217*t)+0.5*sin(2*PI*2637*t))*exp(-t/0.10)':s=48000:d=0.22",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.8*sin(2*PI*(160-30*(t/0.18))*t)*exp(-t/0.05)':s=48000:d=0.18",
    bodyDelayMs: 20,
    tailFilter: "anoisesrc=c=white:r=48000:d=0.50,bandpass=f=1900:w=1300,volume=0.30,afade=t=out:st=0.04:d=0.46",
    tailDelayMs: 35,
    masterGain: 0.87,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'hero.clover.ultimate',
    name: 'hero-clover-ultimate',
    impactOffsetMs: 260,
    durationSec: 1.12,
    transientFilter: "aevalsrc=exprs='0.6*sin(2*PI*(880+1800*t/0.24)*t)*exp(-t/0.24)':s=48000:d=0.24",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.85*(sin(2*PI*1320*t)+0.6*sin(2*PI*1980*t)+0.4*sin(2*PI*2640*t))*exp(-t/0.18)':s=48000:d=0.30",
    bodyDelayMs: 220,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.75,bandpass=f=1700:w=1400,volume=0.35,afade=t=out:st=0.06:d=0.69",
    tailDelayMs: 250,
    masterGain: 0.49,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'hero.panko.basic',
    name: 'hero-panko-basic',
    impactOffsetMs: 30,
    durationSec: 0.34,
    transientFilter: "anoisesrc=c=white:r=48000:d=0.015,highpass=f=3000,volume=0.88,afade=t=out:st=0:d=0.015",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.95*sin(2*PI*(115-35*(t/0.12))*t)*exp(-t/0.042)':s=48000:d=0.12",
    bodyDelayMs: 8,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.20,bandpass=f=2600:w=1400,volume=0.25,afade=t=out:st=0.02:d=0.18",
    tailDelayMs: 15,
    masterGain: 1.75,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'hero.panko.skill',
    name: 'hero-panko-skill',
    impactOffsetMs: 70,
    durationSec: 0.65,
    transientFilter: "aevalsrc=exprs='0.88*(sin(2*PI*2700*t)+0.5*sin(2*PI*4100*t))*exp(-t/0.008)':s=48000:d=0.02",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.95*sin(2*PI*(105-45*(t/0.14))*t)*exp(-t/0.045)':s=48000:d=0.15",
    bodyDelayMs: 12,
    tailFilter: "anoisesrc=c=white:r=48000:d=0.45,bandpass=f=3000:w=2000,volume=0.32,afade=t=out:st=0.04:d=0.41",
    tailDelayMs: 25,
    masterGain: 1.28,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'hero.panko.ultimate',
    name: 'hero-panko-ultimate',
    impactOffsetMs: 255,
    durationSec: 1.08,
    transientFilter: "anoisesrc=c=pink:r=48000:d=0.22,bandpass=f=1700:w=1100,afade=t=in:st=0:d=0.20,afade=t=out:st=0.20:d=0.02,volume=0.88",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='1.0*sin(2*PI*(95-30*(t/0.25))*t)*exp(-t/0.08)':s=48000:d=0.25",
    bodyDelayMs: 220,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.75,bandpass=f=2500:w=1800,volume=0.36,afade=t=out:st=0.06:d=0.69",
    tailDelayMs: 250,
    masterGain: 1.01,
    targetLufs: -18.0,
    limiterLinear: 0.78
  }
];

export function renderHeroSkills() {
  console.log(`Rendering ${HERO_SKILL_DEFINITIONS.length} Hero Skill cues (U1)...`);
  const results = [];
  const manifestCues = {};

  for (const def of HERO_SKILL_DEFINITIONS) {
    const res = synthesizeCue(def);
    results.push({ ...res, cueId: def.cueId, impactOffsetMs: def.impactOffsetMs });
    manifestCues[def.cueId] = {
      opus: `/audio/v5/${def.name}.opus`,
      m4a: `/audio/v5/${def.name}.m4a`,
      gainDb: 0,
      impactOffsetMs: def.impactOffsetMs
    };
    console.log(`- ${def.cueId}: ${res.integratedLUFS.toFixed(1)} LUFS, peak ${res.truePeakDb.toFixed(1)} dBFS, size ${res.sizeBytes} B, dur ${res.duration.toFixed(2)}s`);
  }

  const csvLines = [
    'cueId,name,opusPath,sizeBytes,durationSec,integratedLUFS,truePeakDbFS,impactOffsetMs'
  ];
  for (const r of results) {
    csvLines.push(`${r.cueId},${r.name},${r.opusPath},${r.sizeBytes},${r.duration.toFixed(3)},${r.integratedLUFS.toFixed(1)},${r.truePeakDb.toFixed(1)},${r.impactOffsetMs}`);
  }
  const csvPath = path.join(REPORTS_DIR, 'U1-loudness.csv');
  fs.writeFileSync(csvPath, csvLines.join('\n') + '\n', 'utf8');
  console.log(`Wrote loudness report: ${csvPath}`);

  const manifestPath = path.join(AUDIO_V5_DIR, 'manifest.json');
  let currentManifest = {};
  if (fs.existsSync(manifestPath)) {
    try {
      currentManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (e) {
      currentManifest = {};
    }
  }
  const updatedManifest = {
    ...currentManifest,
    ...manifestCues
  };
  fs.writeFileSync(manifestPath, JSON.stringify(updatedManifest, null, 2) + '\n', 'utf8');
  console.log(`Updated manifest: ${manifestPath}`);

  const lufsValues = results.map(r => r.integratedLUFS);
  const minLufs = Math.min(...lufsValues);
  const maxLufs = Math.max(...lufsValues);
  const avgLufs = lufsValues.reduce((a, b) => a + b, 0) / lufsValues.length;
  const spread = maxLufs - minLufs;

  console.log(`Loudness spread: min=${minLufs.toFixed(1)}, max=${maxLufs.toFixed(1)}, avg=${avgLufs.toFixed(1)}, spread=${spread.toFixed(1)} LU`);
  return { results, spread, avgLufs };
}

/**
 * U2: Selected Ranged Impacts Metadata from v4-ranged-impacts.mp3
 * (9 primary variants for each of the 4 battle elements = 36 variants total)
 */
export const RANGED_VARIANTS_METADATA = [
  // ember (Soot)
  { element: 'ember', variantId: 'ranged.ember.impact/0-0', safeName: 'ranged-ember-impact-0-0', start: 0, duration: 1.0325 },
  { element: 'ember', variantId: 'ranged.ember.impact/0-1', safeName: 'ranged-ember-impact-0-1', start: 1.1125, duration: 0.9134375 },
  { element: 'ember', variantId: 'ranged.ember.impact/0-2', safeName: 'ranged-ember-impact-0-2', start: 2.1059375, duration: 0.7096875 },
  { element: 'ember', variantId: 'ranged.ember.impact/1-0', safeName: 'ranged-ember-impact-1-0', start: 5.161041666666666, duration: 0.9134375 },
  { element: 'ember', variantId: 'ranged.ember.impact/1-1', safeName: 'ranged-ember-impact-1-1', start: 6.154479166666667, duration: 0.9134375 },
  { element: 'ember', variantId: 'ranged.ember.impact/1-2', safeName: 'ranged-ember-impact-1-2', start: 7.147916666666667, duration: 0.9134375 },
  { element: 'ember', variantId: 'ranged.ember.impact/2-0', safeName: 'ranged-ember-impact-2-0', start: 10.5109375, duration: 0.7096875 },
  { element: 'ember', variantId: 'ranged.ember.impact/2-1', safeName: 'ranged-ember-impact-2-1', start: 11.300625, duration: 0.9134375 },
  { element: 'ember', variantId: 'ranged.ember.impact/2-2', safeName: 'ranged-ember-impact-2-2', start: 12.2940625, duration: 0.7096875 },

  // heavy (Binding Thread / Yarn Giant)
  { element: 'heavy', variantId: 'ranged.heavy.impact/0-0', safeName: 'ranged-heavy-impact-0-0', start: 31.8025, duration: 1.16 },
  { element: 'heavy', variantId: 'ranged.heavy.impact/0-1', safeName: 'ranged-heavy-impact-0-1', start: 33.0425, duration: 1.16 },
  { element: 'heavy', variantId: 'ranged.heavy.impact/0-2', safeName: 'ranged-heavy-impact-0-2', start: 34.2825, duration: 1.0072708333333333 },
  { element: 'heavy', variantId: 'ranged.heavy.impact/1-0', safeName: 'ranged-heavy-impact-1-0', start: 37.9625, duration: 1.16 },
  { element: 'heavy', variantId: 'ranged.heavy.impact/1-1', safeName: 'ranged-heavy-impact-1-1', start: 39.2025, duration: 1.16 },
  { element: 'heavy', variantId: 'ranged.heavy.impact/1-2', safeName: 'ranged-heavy-impact-1-2', start: 40.4425, duration: 1.0072708333333333 },
  { element: 'heavy', variantId: 'ranged.heavy.impact/2-0', safeName: 'ranged-heavy-impact-2-0', start: 43.864270833333335, duration: 1.0072708333333333 },
  { element: 'heavy', variantId: 'ranged.heavy.impact/2-1', safeName: 'ranged-heavy-impact-2-1', start: 44.95154166666667, duration: 1.16 },
  { element: 'heavy', variantId: 'ranged.heavy.impact/2-2', safeName: 'ranged-heavy-impact-2-2', start: 46.191541666666665, duration: 1.0072708333333333 },

  // shadow (Inkcap)
  { element: 'shadow', variantId: 'ranged.shadow.impact/0-0', safeName: 'ranged-shadow-impact-0-0', start: 68.77875, duration: 0.8367916666666667 },
  { element: 'shadow', variantId: 'ranged.shadow.impact/0-1', safeName: 'ranged-shadow-impact-0-1', start: 69.69554166666667, duration: 0.879125 },
  { element: 'shadow', variantId: 'ranged.shadow.impact/0-2', safeName: 'ranged-shadow-impact-0-2', start: 70.65466666666667, duration: 0.8793958333333334 },
  { element: 'shadow', variantId: 'ranged.shadow.impact/1-0', safeName: 'ranged-shadow-impact-1-0', start: 73.95758333333333, duration: 0.879125 },
  { element: 'shadow', variantId: 'ranged.shadow.impact/1-1', safeName: 'ranged-shadow-impact-1-1', start: 74.91670833333333, duration: 0.879125 },
  { element: 'shadow', variantId: 'ranged.shadow.impact/1-2', safeName: 'ranged-shadow-impact-1-2', start: 75.87583333333334, duration: 0.8793958333333334 },
  { element: 'shadow', variantId: 'ranged.shadow.impact/2-0', safeName: 'ranged-shadow-impact-2-0', start: 79.28822916666667, duration: 0.8793958333333334 },
  { element: 'shadow', variantId: 'ranged.shadow.impact/2-1', safeName: 'ranged-shadow-impact-2-1', start: 80.247625, duration: 0.879125 },
  { element: 'shadow', variantId: 'ranged.shadow.impact/2-2', safeName: 'ranged-shadow-impact-2-2', start: 81.20675, duration: 0.8793958333333334 },

  // tide / ice (Sorrel / Velvet)
  { element: 'tide', variantId: 'ranged.tide.impact/0-0', safeName: 'ranged-tide-impact-0-0', start: 99.96533333333333, duration: 0.5483125 },
  { element: 'tide', variantId: 'ranged.tide.impact/0-1', safeName: 'ranged-tide-impact-0-1', start: 100.59364583333333, duration: 0.739 },
  { element: 'tide', variantId: 'ranged.tide.impact/0-2', safeName: 'ranged-tide-impact-0-2', start: 101.41264583333333, duration: 0.55425 },
  { element: 'tide', variantId: 'ranged.tide.impact/1-0', safeName: 'ranged-tide-impact-1-0', start: 104.09341666666666, duration: 0.739 },
  { element: 'tide', variantId: 'ranged.tide.impact/1-1', safeName: 'ranged-tide-impact-1-1', start: 104.91241666666666, duration: 0.739 },
  { element: 'tide', variantId: 'ranged.tide.impact/1-2', safeName: 'ranged-tide-impact-1-2', start: 105.73141666666666, duration: 0.55425 },
  { element: 'tide', variantId: 'ranged.tide.impact/2-0', safeName: 'ranged-tide-impact-2-0', start: 108.64366666666667, duration: 0.55425 },
  { element: 'tide', variantId: 'ranged.tide.impact/2-1', safeName: 'ranged-tide-impact-2-1', start: 109.27791666666667, duration: 0.739 },
  { element: 'tide', variantId: 'ranged.tide.impact/2-2', safeName: 'ranged-tide-impact-2-2', start: 110.09691666666666, duration: 0.55425 }
];

export function splitRangedImpacts() {
  const sourceMp3 = path.join(AUDIO_DIR, 'v4-ranged-impacts.mp3');
  if (!fs.existsSync(sourceMp3)) {
    throw new Error(`Source audio file not found: ${sourceMp3}`);
  }

  console.log(`Splitting ${RANGED_VARIANTS_METADATA.length} ranged impact segments from v4-ranged-impacts.mp3 (U2)...`);
  const mappingRows = [];
  const manifestEntries = {};
  let totalOpusBytes = 0;
  let totalM4aBytes = 0;

  for (const v of RANGED_VARIANTS_METADATA) {
    const opusName = `${v.safeName}.opus`;
    const m4aName = `${v.safeName}.m4a`;
    const opusPath = path.join(LEGACY_DIR, opusName);
    const m4aPath = path.join(LEGACY_DIR, m4aName);

    // Cut to Opus (WebM container, 16kbps mono)
    runFfmpeg([
      '-ss', v.start.toString(),
      '-t', v.duration.toString(),
      '-i', sourceMp3,
      '-c:a', 'libopus',
      '-b:a', '16k',
      '-ac', '1',
      '-f', 'webm',
      opusPath
    ]);

    // Cut to M4A (AAC fallback, 32kbps mono)
    runFfmpeg([
      '-ss', v.start.toString(),
      '-t', v.duration.toString(),
      '-i', sourceMp3,
      '-c:a', 'aac',
      '-b:a', '32k',
      '-ac', '1',
      m4aPath
    ]);

    const opusSize = fs.statSync(opusPath).size;
    const m4aSize = fs.statSync(m4aPath).size;
    totalOpusBytes += opusSize;
    totalM4aBytes += m4aSize;

    const row = {
      variantId: v.variantId,
      element: v.element,
      safeName: v.safeName,
      sourceStartSec: v.start,
      durationSec: v.duration,
      opusPath: `/audio/v5/legacy/${opusName}`,
      m4aPath: `/audio/v5/legacy/${m4aName}`,
      opusSizeBytes: opusSize,
      m4aSizeBytes: m4aSize,
      license: 'CC0-1.0',
      sourceFile: 'apps/web/public/audio/v4-ranged-impacts.mp3'
    };
    mappingRows.push(row);

    manifestEntries[v.variantId] = {
      opus: row.opusPath,
      m4a: row.m4aPath,
      gainDb: 0,
      element: v.element,
      originalStart: v.start,
      duration: v.duration,
      impactOffsetMs: 0
    };
  }

  const totalCombinedBytes = totalOpusBytes + totalM4aBytes;
  const totalOpusKb = (totalOpusBytes / 1024).toFixed(1);
  const totalCombinedKb = (totalCombinedBytes / 1024).toFixed(1);

  console.log(`Split complete:`);
  console.log(`- 36 Opus files: ${totalOpusBytes} bytes (${totalOpusKb} KB)`);
  console.log(`- 36 M4A files: ${totalM4aBytes} bytes (${(totalM4aBytes/1024).toFixed(1)} KB)`);
  console.log(`- Total cut files: ${totalCombinedBytes} bytes (${totalCombinedKb} KB) [Budget: <= 300 KB]`);

  // Write reports/v5/AG4/U2-mapping.csv
  const csvLines = [
    'variantId,element,safeName,sourceStartSec,durationSec,opusPath,m4aPath,opusSizeBytes,m4aSizeBytes,license'
  ];
  for (const r of mappingRows) {
    csvLines.push(`${r.variantId},${r.element},${r.safeName},${r.sourceStartSec.toFixed(3)},${r.durationSec.toFixed(3)},${r.opusPath},${r.m4aPath},${r.opusSizeBytes},${r.m4aSizeBytes},${r.license}`);
  }
  const csvPath = path.join(REPORTS_DIR, 'U2-mapping.csv');
  fs.writeFileSync(csvPath, csvLines.join('\n') + '\n', 'utf8');

  // Write reports/v5/AG4/U2-mapping.json
  const jsonReport = {
    at: new Date().toISOString(),
    sourceFile: 'apps/web/public/audio/v4-ranged-impacts.mp3',
    sourceLicense: 'CC0-1.0',
    totalVariants: mappingRows.length,
    totalOpusBytes,
    totalM4aBytes,
    totalCombinedBytes,
    totalCombinedKb: parseFloat(totalCombinedKb),
    budgetMaxKb: 300,
    budgetPass: totalCombinedBytes <= 300 * 1024,
    variants: mappingRows
  };
  const jsonPath = path.join(REPORTS_DIR, 'U2-mapping.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2) + '\n', 'utf8');

  // Update manifest.json
  const manifestPath = path.join(AUDIO_V5_DIR, 'manifest.json');
  let manifest = {};
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (e) {
      manifest = {};
    }
  }
  manifest = {
    ...manifest,
    ...manifestEntries
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`Wrote mapping report: ${csvPath}`);
  console.log(`Wrote mapping JSON: ${jsonPath}`);
  console.log(`Updated manifest: ${manifestPath}`);

  return jsonReport;
}




/**
 * U3: Enemy + Boss + UI Set Definitions (7 cues)
 */
export const ENEMY_UI_DEFINITIONS = [
  // 1. Hit reactions x3
  {
    cueId: 'enemy.hit.light',
    name: 'enemy-hit-light',
    impactOffsetMs: 20,
    durationSec: 0.25,
    transientFilter: "anoisesrc=c=white:r=48000:d=0.012,highpass=f=2800,volume=0.82,afade=t=out:st=0:d=0.012",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.90*sin(2*PI*(145-50*(t/0.09))*t)*exp(-t/0.032)':s=48000:d=0.09",
    bodyDelayMs: 5,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.15,lowpass=f=800,volume=0.22,afade=t=out:st=0.02:d=0.13",
    tailDelayMs: 10,
    masterGain: 1.25,
    targetLufs: -18.0,
    limiterLinear: 0.72
  },
  {
    cueId: 'enemy.hit.medium',
    name: 'enemy-hit-medium',
    impactOffsetMs: 25,
    durationSec: 0.38,
    transientFilter: "aevalsrc=exprs='0.9*sin(2*PI*(3600-2000*(t/0.015))*t)*exp(-t/0.003)':s=48000:d=0.015",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.95*sin(2*PI*(130-55*(t/0.10))*t)*exp(-t/0.035)':s=48000:d=0.10",
    bodyDelayMs: 8,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.28,bandpass=f=600:w=400,volume=0.28,afade=t=out:st=0.03:d=0.25",
    tailDelayMs: 15,
    masterGain: 1.5,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'enemy.hit.heavy',
    name: 'enemy-hit-heavy',
    impactOffsetMs: 30,
    durationSec: 0.52,
    transientFilter: "aevalsrc=exprs='0.95*(sin(2*PI*2400*t)+0.6*sin(2*PI*4800*t))*exp(-t/0.005)':s=48000:d=0.018",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='1.0*sin(2*PI*(100-40*(t/0.18))*t)*exp(-t/0.06)':s=48000:d=0.18",
    bodyDelayMs: 10,
    tailFilter: "anoisesrc=c=brown:r=48000:d=0.40,lowpass=f=450,volume=0.35,afade=t=out:st=0.05:d=0.35",
    tailDelayMs: 20,
    masterGain: 1.4,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },

  // 2. Death x2
  {
    cueId: 'enemy.death.small',
    name: 'enemy-death-small',
    impactOffsetMs: 40,
    durationSec: 0.65,
    transientFilter: "anoisesrc=c=pink:r=48000:d=0.05,bandpass=f=1800:w=1200,afade=t=out:st=0:d=0.05,volume=0.85",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.85*sin(2*PI*(140-50*(t/0.14))*t)*exp(-t/0.05)':s=48000:d=0.14",
    bodyDelayMs: 15,
    tailFilter: "anoisesrc=c=white:r=48000:d=0.50,bandpass=f=1200:w=800,afade=t=out:st=0.05:d=0.45,volume=0.30",
    tailDelayMs: 30,
    masterGain: 1.5,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'enemy.death.boss',
    name: 'enemy-death-boss',
    impactOffsetMs: 60,
    durationSec: 1.15,
    transientFilter: "aevalsrc=exprs='0.85*(sin(2*PI*2200*t)+0.6*sin(2*PI*3300*t)+0.4*sin(2*PI*5500*t))*exp(-t/0.03)':s=48000:d=0.08",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='1.0*sin(2*PI*(85-25*(t/0.35))*t)*exp(-t/0.12)':s=48000:d=0.35",
    bodyDelayMs: 30,
    tailFilter: "anoisesrc=c=brown:r=48000:d=0.85,lowpass=f=350,volume=0.38,afade=t=out:st=0.10:d=0.75",
    tailDelayMs: 60,
    masterGain: 1.2,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },

  // 3. Yarn-Giant Ultimate
  {
    cueId: 'boss.yarn-giant.ultimate',
    name: 'boss-yarn-giant-ultimate',
    impactOffsetMs: 460,
    durationSec: 1.18,
    transientFilter: "anoisesrc=c=pink:r=48000:d=0.45,bandpass=f=900:w=600,afade=t=in:st=0:d=0.40,afade=t=out:st=0.40:d=0.05,volume=0.85",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='1.0*sin(2*PI*(80-28*(t/0.30))*t)*exp(-t/0.10)':s=48000:d=0.30",
    bodyDelayMs: 450,
    tailFilter: "anoisesrc=c=brown:r=48000:d=0.65,lowpass=f=380,volume=0.36,afade=t=out:st=0.08:d=0.57",
    tailDelayMs: 480,
    masterGain: 1.3,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },

  // 4. Receipt "chain confirmed" chime (soft, 0.8s)
  {
    cueId: 'ui.receipt.confirmed',
    name: 'ui-receipt-confirmed',
    impactOffsetMs: 15,
    durationSec: 0.80,
    transientFilter: "aevalsrc=exprs='0.7*(0.9*sin(2*PI*783.99*t)+0.8*sin(2*PI*987.77*t)+0.7*sin(2*PI*1174.66*t)+0.6*sin(2*PI*1567.98*t))*exp(-t/0.22)':s=48000:d=0.78",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.5*sin(2*PI*392*t)*exp(-t/0.25)':s=48000:d=0.60",
    bodyDelayMs: 10,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.70,bandpass=f=3200:w=1200,volume=0.18,afade=t=out:st=0.05:d=0.65",
    tailDelayMs: 20,
    masterGain: 0.85,
    targetLufs: -18.0,
    limiterLinear: 0.78
  }
];

export function renderEnemyAndUi() {
  console.log(`Rendering ${ENEMY_UI_DEFINITIONS.length} Enemy/Boss/UI cues (U3)...`);
  const results = [];
  const manifestCues = {};

  for (const def of ENEMY_UI_DEFINITIONS) {
    const res = synthesizeCue(def);
    results.push({ ...res, cueId: def.cueId, impactOffsetMs: def.impactOffsetMs });
    manifestCues[def.cueId] = {
      opus: `/audio/v5/${def.name}.opus`,
      m4a: `/audio/v5/${def.name}.m4a`,
      gainDb: 0,
      impactOffsetMs: def.impactOffsetMs
    };
    console.log(`- ${def.cueId}: ${res.integratedLUFS.toFixed(1)} LUFS, peak ${res.truePeakDb.toFixed(1)} dBFS, size ${res.sizeBytes} B, dur ${res.duration.toFixed(2)}s`);
  }

  // Write reports/v5/AG4/U3-loudness.csv
  const csvLines = [
    'cueId,name,opusPath,sizeBytes,durationSec,integratedLUFS,truePeakDbFS,impactOffsetMs'
  ];
  for (const r of results) {
    csvLines.push(`${r.cueId},${r.name},${r.opusPath},${r.sizeBytes},${r.duration.toFixed(3)},${r.integratedLUFS.toFixed(1)},${r.truePeakDb.toFixed(1)},${r.impactOffsetMs}`);
  }
  const csvPath = path.join(REPORTS_DIR, 'U3-loudness.csv');
  fs.writeFileSync(csvPath, csvLines.join('\n') + '\n', 'utf8');
  console.log(`Wrote loudness report: ${csvPath}`);

  // Update manifest.json
  const manifestPath = path.join(AUDIO_V5_DIR, 'manifest.json');
  let currentManifest = {};
  if (fs.existsSync(manifestPath)) {
    try {
      currentManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (e) {
      currentManifest = {};
    }
  }
  const updatedManifest = {
    ...currentManifest,
    ...manifestCues
  };
  fs.writeFileSync(manifestPath, JSON.stringify(updatedManifest, null, 2) + '\n', 'utf8');
  console.log(`Updated manifest: ${manifestPath}`);

  const lufsValues = results.map(r => r.integratedLUFS);
  const minLufs = Math.min(...lufsValues);
  const maxLufs = Math.max(...lufsValues);
  const avgLufs = lufsValues.reduce((a, b) => a + b, 0) / lufsValues.length;
  const spread = maxLufs - minLufs;

  console.log(`U3 Loudness spread: min=${minLufs.toFixed(1)}, max=${maxLufs.toFixed(1)}, avg=${avgLufs.toFixed(1)}, spread=${spread.toFixed(1)} LU`);
  return { results, spread, avgLufs };
}

/**
 * R1: Variations Definitions (2 takes per frequent cue with pitch +/-3% and micro-layer variations)
 * 10 frequent cues x 2 takes = 20 variation cues
 */
export const VARIATION_DEFINITIONS = [
  // 1. Mochi basic variations
  {
    cueId: 'hero.mochi.basic.var1',
    name: 'hero-mochi-basic-var1',
    runtimeCueId: 'skill.mochi.1.impact.var1',
    aliases: ['mochi-1-var1'],
    impactOffsetMs: 350,
    durationSec: 0.38,
    transientFilter: "anoisesrc=c=pink:r=48000:d=0.035,bandpass=f=2266:w=1400,afade=t=out:st=0:d=0.035,volume=0.95",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.95*sin(2*PI*(103-36*(t/0.115))*t)*exp(-t/0.046)':s=48000:d=0.115",
    bodyDelayMs: 9,
    tailFilter: "anoisesrc=c=brown:r=48000:d=0.22,lowpass=f=465,volume=0.32,afade=t=out:st=0.02:d=0.20",
    tailDelayMs: 24,
    masterGain: 2.45,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'hero.mochi.basic.var2',
    name: 'hero-mochi-basic-var2',
    runtimeCueId: 'skill.mochi.1.impact.var2',
    aliases: ['mochi-1-var2'],
    impactOffsetMs: 350,
    durationSec: 0.39,
    transientFilter: "anoisesrc=c=pink:r=48000:d=0.035,bandpass=f=2134:w=1400,afade=t=out:st=0:d=0.035,volume=0.95",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.95*sin(2*PI*(97-34*(t/0.125))*t)*exp(-t/0.05)':s=48000:d=0.125",
    bodyDelayMs: 11,
    tailFilter: "anoisesrc=c=brown:r=48000:d=0.22,lowpass=f=435,volume=0.32,afade=t=out:st=0.02:d=0.20",
    tailDelayMs: 26,
    masterGain: 2.45,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },

  // 2. Mochi skill variations
  {
    cueId: 'hero.mochi.skill.var1',
    name: 'hero-mochi-skill-var1',
    runtimeCueId: 'skill.mochi.2.impact.var1',
    aliases: ['mochi-2-var1'],
    impactOffsetMs: 350,
    durationSec: 0.63,
    transientFilter: "anoisesrc=c=pink:r=48000:d=0.088,bandpass=f=1442:w=1000,afade=t=in:st=0:d=0.058,afade=t=out:st=0.058:d=0.03,volume=0.95",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.95*sin(2*PI*(113-46*(t/0.175))*t)*exp(-t/0.058)':s=48000:d=0.175",
    bodyDelayMs: 52,
    tailFilter: "anoisesrc=c=brown:r=48000:d=0.43,lowpass=f=412,volume=0.36,afade=t=out:st=0.05:d=0.38",
    tailDelayMs: 76,
    masterGain: 2.11,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'hero.mochi.skill.var2',
    name: 'hero-mochi-skill-var2',
    runtimeCueId: 'skill.mochi.2.impact.var2',
    aliases: ['mochi-2-var2'],
    impactOffsetMs: 350,
    durationSec: 0.67,
    transientFilter: "anoisesrc=c=pink:r=48000:d=0.092,bandpass=f=1358:w=1000,afade=t=in:st=0:d=0.062,afade=t=out:st=0.062:d=0.03,volume=0.95",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.95*sin(2*PI*(107-44*(t/0.185))*t)*exp(-t/0.062)':s=48000:d=0.185",
    bodyDelayMs: 58,
    tailFilter: "anoisesrc=c=brown:r=48000:d=0.47,lowpass=f=388,volume=0.36,afade=t=out:st=0.05:d=0.42",
    tailDelayMs: 84,
    masterGain: 2.11,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },

  // 3. Soot basic variations
  {
    cueId: 'hero.soot.basic.var1',
    name: 'hero-soot-basic-var1',
    runtimeCueId: 'skill.soot.1.impact.var1',
    aliases: ['soot-1-var1'],
    impactOffsetMs: 350,
    durationSec: 0.32,
    transientFilter: "aevalsrc=exprs='0.92*sin(2*PI*(4320-1850*(t/0.008))*t)*exp(-t/0.002)':s=48000:d=0.008",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.95*sin(2*PI*(150-52*(t/0.115))*t)*exp(-t/0.036)':s=48000:d=0.115",
    bodyDelayMs: 5,
    tailFilter: "anoisesrc=c=white:r=48000:d=0.20,highpass=f=2266,volume=0.28,afade=t=out:st=0.01:d=0.19",
    tailDelayMs: 10,
    masterGain: 1.55,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'hero.soot.basic.var2',
    name: 'hero-soot-basic-var2',
    runtimeCueId: 'skill.soot.1.impact.var2',
    aliases: ['soot-1-var2'],
    impactOffsetMs: 350,
    durationSec: 0.33,
    transientFilter: "aevalsrc=exprs='0.92*sin(2*PI*(4080-1750*(t/0.008))*t)*exp(-t/0.002)':s=48000:d=0.008",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.95*sin(2*PI*(140-48*(t/0.125))*t)*exp(-t/0.04)':s=48000:d=0.125",
    bodyDelayMs: 6,
    tailFilter: "anoisesrc=c=white:r=48000:d=0.21,highpass=f=2134,volume=0.28,afade=t=out:st=0.01:d=0.20",
    tailDelayMs: 11,
    masterGain: 1.55,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },

  // 4. Soot skill variations
  {
    cueId: 'hero.soot.skill.var1',
    name: 'hero-soot-skill-var1',
    runtimeCueId: 'skill.soot.2.impact.var1',
    aliases: ['soot-2-var1'],
    impactOffsetMs: 350,
    durationSec: 0.60,
    transientFilter: "aevalsrc=exprs='0.95*(sin(2*PI*3914*t)+0.5*sin(2*PI*5974*t))*exp(-t/0.004)':s=48000:d=0.015",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.95*sin(2*PI*(144-52*(t/0.136))*t)*exp(-t/0.044)':s=48000:d=0.14",
    bodyDelayMs: 14,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.43,bandpass=f=3300:w=1800,volume=0.34,afade=t=out:st=0.03:d=0.40",
    tailDelayMs: 24,
    masterGain: 1.18,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'hero.soot.skill.var2',
    name: 'hero-soot-skill-var2',
    runtimeCueId: 'skill.soot.2.impact.var2',
    aliases: ['soot-2-var2'],
    impactOffsetMs: 350,
    durationSec: 0.64,
    transientFilter: "aevalsrc=exprs='0.95*(sin(2*PI*3686*t)+0.5*sin(2*PI*5626*t))*exp(-t/0.004)':s=48000:d=0.015",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.95*sin(2*PI*(136-48*(t/0.144))*t)*exp(-t/0.046)':s=48000:d=0.15",
    bodyDelayMs: 16,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.47,bandpass=f=3100:w=1800,volume=0.34,afade=t=out:st=0.03:d=0.44",
    tailDelayMs: 26,
    masterGain: 1.18,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },

  // 5. Clover basic variations
  {
    cueId: 'hero.clover.basic.var1',
    name: 'hero-clover-basic-var1',
    runtimeCueId: 'skill.clover.1.impact.var1',
    aliases: ['clover-1-var1'],
    impactOffsetMs: 350,
    durationSec: 0.38,
    transientFilter: "aevalsrc=exprs='0.85*(sin(2*PI*1813*t)+0.5*sin(2*PI*2719*t)+0.3*sin(2*PI*3626*t))*exp(-t/0.058)':s=48000:d=0.15",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.88*sin(2*PI*(191-36*(t/0.136))*t)*exp(-t/0.046)':s=48000:d=0.136",
    bodyDelayMs: 8,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.25,bandpass=f=2266:w=1100,volume=0.25,afade=t=out:st=0.03:d=0.22",
    tailDelayMs: 17,
    masterGain: 1.25,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'hero.clover.basic.var2',
    name: 'hero-clover-basic-var2',
    runtimeCueId: 'skill.clover.1.impact.var2',
    aliases: ['clover-1-var2'],
    impactOffsetMs: 350,
    durationSec: 0.39,
    transientFilter: "aevalsrc=exprs='0.85*(sin(2*PI*1707*t)+0.5*sin(2*PI*2561*t)+0.3*sin(2*PI*3414*t))*exp(-t/0.062)':s=48000:d=0.15",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.88*sin(2*PI*(179-34*(t/0.144))*t)*exp(-t/0.05)':s=48000:d=0.144",
    bodyDelayMs: 9,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.25,bandpass=f=2134:w=1100,volume=0.25,afade=t=out:st=0.03:d=0.22",
    tailDelayMs: 19,
    masterGain: 1.25,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },

  // 6. Clover skill variations
  {
    cueId: 'hero.clover.skill.var1',
    name: 'hero-clover-skill-var1',
    runtimeCueId: 'skill.clover.2.impact.var1',
    aliases: ['clover-2-var1'],
    impactOffsetMs: 350,
    durationSec: 0.70,
    transientFilter: "aevalsrc=exprs='0.75*(sin(2*PI*1813*t)+0.6*sin(2*PI*2283*t)+0.5*sin(2*PI*2716*t))*exp(-t/0.097)':s=48000:d=0.21",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.8*sin(2*PI*(165-31*(t/0.175))*t)*exp(-t/0.049)':s=48000:d=0.175",
    bodyDelayMs: 19,
    tailFilter: "anoisesrc=c=white:r=48000:d=0.48,bandpass=f=1957:w=1300,volume=0.30,afade=t=out:st=0.04:d=0.44",
    tailDelayMs: 34,
    masterGain: 0.87,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'hero.clover.skill.var2',
    name: 'hero-clover-skill-var2',
    runtimeCueId: 'skill.clover.2.impact.var2',
    aliases: ['clover-2-var2'],
    impactOffsetMs: 350,
    durationSec: 0.74,
    transientFilter: "aevalsrc=exprs='0.75*(sin(2*PI*1707*t)+0.6*sin(2*PI*2150*t)+0.5*sin(2*PI*2558*t))*exp(-t/0.103)':s=48000:d=0.23",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.8*sin(2*PI*(155-29*(t/0.185))*t)*exp(-t/0.051)':s=48000:d=0.185",
    bodyDelayMs: 21,
    tailFilter: "anoisesrc=c=white:r=48000:d=0.52,bandpass=f=1843:w=1300,volume=0.30,afade=t=out:st=0.04:d=0.48",
    tailDelayMs: 36,
    masterGain: 0.87,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },

  // 7. Panko basic variations
  {
    cueId: 'hero.panko.basic.var1',
    name: 'hero-panko-basic-var1',
    runtimeCueId: 'skill.panko.1.impact.var1',
    aliases: ['panko-1-var1'],
    impactOffsetMs: 350,
    durationSec: 0.33,
    transientFilter: "anoisesrc=c=white:r=48000:d=0.015,highpass=f=3090,volume=0.88,afade=t=out:st=0:d=0.015",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.95*sin(2*PI*(118-36*(t/0.115))*t)*exp(-t/0.04)':s=48000:d=0.115",
    bodyDelayMs: 7,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.20,bandpass=f=2678:w=1400,volume=0.25,afade=t=out:st=0.02:d=0.18",
    tailDelayMs: 14,
    masterGain: 1.75,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'hero.panko.basic.var2',
    name: 'hero-panko-basic-var2',
    runtimeCueId: 'skill.panko.1.impact.var2',
    aliases: ['panko-1-var2'],
    impactOffsetMs: 350,
    durationSec: 0.35,
    transientFilter: "anoisesrc=c=white:r=48000:d=0.015,highpass=f=2910,volume=0.88,afade=t=out:st=0:d=0.015",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.95*sin(2*PI*(112-34*(t/0.125))*t)*exp(-t/0.044)':s=48000:d=0.125",
    bodyDelayMs: 8,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.20,bandpass=f=2522:w=1400,volume=0.25,afade=t=out:st=0.02:d=0.18",
    tailDelayMs: 16,
    masterGain: 1.75,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },

  // 8. Panko skill variations
  {
    cueId: 'hero.panko.skill.var1',
    name: 'hero-panko-skill-var1',
    runtimeCueId: 'skill.panko.2.impact.var1',
    aliases: ['panko-2-var1'],
    impactOffsetMs: 350,
    durationSec: 0.63,
    transientFilter: "aevalsrc=exprs='0.88*(sin(2*PI*2781*t)+0.5*sin(2*PI*4223*t))*exp(-t/0.008)':s=48000:d=0.019",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.95*sin(2*PI*(108-46*(t/0.136))*t)*exp(-t/0.044)':s=48000:d=0.145",
    bodyDelayMs: 11,
    tailFilter: "anoisesrc=c=white:r=48000:d=0.43,bandpass=f=3090:w=2000,volume=0.32,afade=t=out:st=0.04:d=0.39",
    tailDelayMs: 24,
    masterGain: 1.28,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'hero.panko.skill.var2',
    name: 'hero-panko-skill-var2',
    runtimeCueId: 'skill.panko.2.impact.var2',
    aliases: ['panko-2-var2'],
    impactOffsetMs: 350,
    durationSec: 0.67,
    transientFilter: "aevalsrc=exprs='0.88*(sin(2*PI*2619*t)+0.5*sin(2*PI*3977*t))*exp(-t/0.008)':s=48000:d=0.021",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.95*sin(2*PI*(102-44*(t/0.144))*t)*exp(-t/0.046)':s=48000:d=0.155",
    bodyDelayMs: 13,
    tailFilter: "anoisesrc=c=white:r=48000:d=0.47,bandpass=f=2910:w=2000,volume=0.32,afade=t=out:st=0.04:d=0.43",
    tailDelayMs: 26,
    masterGain: 1.28,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },

  // 9. Enemy hit light variations
  {
    cueId: 'enemy.hit.light.var1',
    name: 'enemy-hit-light-var1',
    runtimeCueId: 'hit.light.var1',
    aliases: ['hit-1-var1'],
    impactOffsetMs: 20,
    durationSec: 0.25,
    transientFilter: "anoisesrc=c=white:r=48000:d=0.012,highpass=f=2884,volume=0.82,afade=t=out:st=0:d=0.012",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.90*sin(2*PI*(150-52*(t/0.088))*t)*exp(-t/0.031)':s=48000:d=0.088",
    bodyDelayMs: 5,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.15,lowpass=f=824,volume=0.22,afade=t=out:st=0.02:d=0.13",
    tailDelayMs: 10,
    masterGain: 1.15,
    targetLufs: -18.0,
    limiterLinear: 0.72
  },
  {
    cueId: 'enemy.hit.light.var2',
    name: 'enemy-hit-light-var2',
    runtimeCueId: 'hit.light.var2',
    aliases: ['hit-1-var2'],
    impactOffsetMs: 20,
    durationSec: 0.26,
    transientFilter: "anoisesrc=c=white:r=48000:d=0.012,highpass=f=2716,volume=0.82,afade=t=out:st=0:d=0.012",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.90*sin(2*PI*(140-48*(t/0.092))*t)*exp(-t/0.033)':s=48000:d=0.092",
    bodyDelayMs: 5,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.16,lowpass=f=776,volume=0.22,afade=t=out:st=0.02:d=0.14",
    tailDelayMs: 10,
    masterGain: 1.25,
    targetLufs: -18.0,
    limiterLinear: 0.72
  },

  // 10. Enemy hit medium variations
  {
    cueId: 'enemy.hit.medium.var1',
    name: 'enemy-hit-medium-var1',
    runtimeCueId: 'hit.medium.var1',
    aliases: ['hit-2-var1'],
    impactOffsetMs: 25,
    durationSec: 0.37,
    transientFilter: "aevalsrc=exprs='0.9*sin(2*PI*(3708-2060*(t/0.015))*t)*exp(-t/0.003)':s=48000:d=0.015",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.95*sin(2*PI*(134-57*(t/0.097))*t)*exp(-t/0.034)':s=48000:d=0.097",
    bodyDelayMs: 7,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.27,bandpass=f=618:w=400,volume=0.28,afade=t=out:st=0.03:d=0.24",
    tailDelayMs: 14,
    masterGain: 1.5,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'enemy.hit.medium.var2',
    name: 'enemy-hit-medium-var2',
    runtimeCueId: 'hit.medium.var2',
    aliases: ['hit-2-var2'],
    impactOffsetMs: 25,
    durationSec: 0.39,
    transientFilter: "aevalsrc=exprs='0.9*sin(2*PI*(3492-1940*(t/0.015))*t)*exp(-t/0.003)':s=48000:d=0.015",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.95*sin(2*PI*(126-53*(t/0.103))*t)*exp(-t/0.036)':s=48000:d=0.103",
    bodyDelayMs: 9,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.29,bandpass=f=582:w=400,volume=0.28,afade=t=out:st=0.03:d=0.26",
    tailDelayMs: 16,
    masterGain: 1.5,
    targetLufs: -18.0,
    limiterLinear: 0.78
  }
];

export function renderVariations() {
  console.log(`Rendering ${VARIATION_DEFINITIONS.length} Variation cues (R1)...`);
  const results = [];
  const manifestCues = {};

  for (const def of VARIATION_DEFINITIONS) {
    const res = synthesizeCue(def);
    results.push({ ...res, cueId: def.cueId, impactOffsetMs: def.impactOffsetMs });
    manifestCues[def.cueId] = {
      opus: `/audio/v5/${def.name}.opus`,
      m4a: `/audio/v5/${def.name}.m4a`,
      gainDb: 0,
      impactOffsetMs: def.impactOffsetMs,
      durationSeconds: parseFloat(res.duration.toFixed(3)),
      bus: 'sfx',
      runtimeCueId: def.runtimeCueId,
      aliases: def.aliases
    };
    console.log(`- ${def.cueId}: ${res.integratedLUFS.toFixed(1)} LUFS, peak ${res.truePeakDb.toFixed(1)} dBFS, size ${res.sizeBytes} B, dur ${res.duration.toFixed(2)}s`);
  }

  // Write reports/v5/AG4/R1-loudness.csv
  const csvLines = [
    'cueId,name,opusPath,sizeBytes,durationSec,integratedLUFS,truePeakDbFS,impactOffsetMs'
  ];
  for (const r of results) {
    csvLines.push(`${r.cueId},${r.name},${r.opusPath},${r.sizeBytes},${r.duration.toFixed(3)},${r.integratedLUFS.toFixed(1)},${r.truePeakDb.toFixed(1)},${r.impactOffsetMs}`);
  }
  const csvPath = path.join(REPORTS_DIR, 'R1-loudness.csv');
  fs.writeFileSync(csvPath, csvLines.join('\n') + '\n', 'utf8');
  console.log(`Wrote loudness report: ${csvPath}`);

  // Update manifest.json
  const manifestPath = path.join(AUDIO_V5_DIR, 'manifest.json');
  let currentManifest = {};
  if (fs.existsSync(manifestPath)) {
    try {
      currentManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (e) {
      currentManifest = {};
    }
  }
  const updatedManifest = {
    ...currentManifest,
    ...manifestCues
  };
  fs.writeFileSync(manifestPath, JSON.stringify(updatedManifest, null, 2) + '\n', 'utf8');
  console.log(`Updated manifest: ${manifestPath}`);

  const lufsValues = results.map(r => r.integratedLUFS);
  const minLufs = Math.min(...lufsValues);
  const maxLufs = Math.max(...lufsValues);
  const avgLufs = lufsValues.reduce((a, b) => a + b, 0) / lufsValues.length;
  const spread = maxLufs - minLufs;

  console.log(`R1 Loudness spread: min=${minLufs.toFixed(1)}, max=${maxLufs.toFixed(1)}, avg=${avgLufs.toFixed(1)}, spread=${spread.toFixed(1)} LU`);
  return { results, spread, avgLufs };
}

/**
 * R2: Ambience Loops Definitions (Cosy workshop/café and battle bed, seamless, <= 150 KB)
 */
export const AMBIENCE_DEFINITIONS = [
  {
    cueId: 'ambience.workshop.cosy',
    name: 'ambience-workshop-cosy',
    runtimeCueId: 'ambience.workshop.cosy',
    aliases: ['music.home', 'ambience.workshop', 'bgm.cosy'],
    durationSec: 14.0,
    bus: 'bgm',
    loop: true,
    filtergraph: [
      "aevalsrc=exprs='0.25*sin(2*PI*130.81*t)+0.20*sin(2*PI*196.00*t)+0.15*sin(2*PI*164.81*t)+0.10*sin(2*PI*261.63*t)':s=48000:d=14.0[pad]",
      "aevalsrc=exprs='0.28*sin(2*PI*28*t)*(0.7+0.3*sin(2*PI*22*t))':s=48000:d=14.0[purr]",
      "anoisesrc=c=pink:r=48000:d=14.0,lowpass=f=1200,volume=0.12[dust]",
      "aevalsrc=exprs='0.08*(sin(2*PI*1046.5*t)*exp(-mod(t\\,3.5)/0.8)+sin(2*PI*1567.98*t)*exp(-mod(t+1.75\\,3.5)/0.8))':s=48000:d=14.0[chime]",
      "[pad][purr][dust][chime]amix=inputs=4:dropout_transition=0:normalize=0,volume=0.36,alimiter=limit=0.85:level=false[mix]"
    ].join(';')
  },
  {
    cueId: 'ambience.battle.bed',
    name: 'ambience-battle-bed',
    runtimeCueId: 'ambience.battle.bed',
    aliases: ['music.battle', 'ambience.battle', 'bgm.battle'],
    durationSec: 12.0,
    bus: 'bgm',
    loop: true,
    filtergraph: [
      "aevalsrc=exprs='0.20*sin(2*PI*73.42*t)+0.15*sin(2*PI*110.00*t)+0.10*sin(2*PI*146.83*t)+0.08*sin(2*PI*174.61*t)':s=48000:d=12.0[pad]",
      "aevalsrc=exprs='0.28*sin(2*PI*52*t)*exp(-mod(t\\,1.0)/0.18)':s=48000:d=12.0[heart]",
      "anoisesrc=c=brown:r=48000:d=12.0,lowpass=f=450,volume=0.18[wind]",
      "anoisesrc=c=white:r=48000:d=12.0,bandpass=f=2200:w=600,volume=0.04[shiver]",
      "[pad][heart][wind][shiver]amix=inputs=4:dropout_transition=0:normalize=0,volume=0.60,alimiter=limit=0.85:level=false[mix]"
    ].join(';')
  },
  {
    cueId: 'ambience.cafe.afternoon',
    name: 'ambience-cafe-afternoon',
    runtimeCueId: 'ambience.cafe.afternoon',
    aliases: ['music.afternoon', 'bgm.cafe.afternoon', 'ambience.tea'],
    durationSec: 12.0,
    bus: 'bgm',
    loop: true,
    filtergraph: [
      "aevalsrc=exprs='0.20*sin(2*PI*174.61*t)+0.15*sin(2*PI*220.00*t)+0.12*sin(2*PI*261.63*t)':s=48000:d=12.0[pad]",
      "anoisesrc=c=pink:r=48000:d=12.0,bandpass=f=2400:w=1200,volume=0.08[steam]",
      "aevalsrc=exprs='0.08*sin(2*PI*1318.51*t)*exp(-mod(t\\,3.0)/0.6)':s=48000:d=12.0[chime]",
      "[pad][steam][chime]amix=inputs=3:dropout_transition=0:normalize=0,volume=0.45,alimiter=limit=0.85:level=false[mix]"
    ].join(';')
  },
  {
    cueId: 'ambience.battle.intense',
    name: 'ambience-battle-intense',
    runtimeCueId: 'ambience.battle.intense',
    aliases: ['music.battle.intense', 'bgm.battle.climax', 'ambience.battle.urgency'],
    durationSec: 10.0,
    bus: 'bgm',
    loop: true,
    filtergraph: [
      "aevalsrc=exprs='0.22*sin(2*PI*82.41*t)+0.18*sin(2*PI*123.47*t)+0.12*sin(2*PI*164.81*t)+0.10*sin(2*PI*196.00*t)':s=48000:d=10.0[pad]",
      "aevalsrc=exprs='0.32*sin(2*PI*60*t)*exp(-mod(t\\,0.5)/0.09)':s=48000:d=10.0[beat]",
      "anoisesrc=c=brown:r=48000:d=10.0,bandpass=f=350:w=200,volume=0.22[flame]",
      "[pad][beat][flame]amix=inputs=3:dropout_transition=0:normalize=0,volume=0.48,alimiter=limit=0.85:level=false[mix]"
    ].join(';')
  },
  {
    cueId: 'ambience.boss.dread',
    name: 'ambience-boss-dread',
    runtimeCueId: 'ambience.boss.dread',
    aliases: ['music.boss', 'bgm.boss.yarn', 'ambience.boss.dread'],
    durationSec: 12.0,
    bus: 'bgm',
    loop: true,
    filtergraph: [
      "aevalsrc=exprs='0.25*sin(2*PI*69.30*t)+0.18*sin(2*PI*103.83*t)+0.14*sin(2*PI*138.59*t)':s=48000:d=12.0[pad]",
      "aevalsrc=exprs='0.35*sin(2*PI*48*t)*(0.8+0.2*sin(2*PI*6*t))':s=48000:d=12.0[sub]",
      "aevalsrc=exprs='0.04*(sin(2*PI*880*t)+sin(2*PI*925*t))*(0.5+0.5*sin(2*PI*0.3*t))':s=48000:d=12.0[ring]",
      "anoisesrc=c=pink:r=48000:d=12.0,lowpass=f=250,volume=0.20[rumble]",
      "[pad][sub][ring][rumble]amix=inputs=4:dropout_transition=0:normalize=0,volume=0.45,alimiter=limit=0.85:level=false[mix]"
    ].join(';')
  }
];

export function renderAmbience() {
  console.log(`Rendering ${AMBIENCE_DEFINITIONS.length} Ambience Loops (R2)...`);
  const results = [];
  const manifestCues = {};

  for (const def of AMBIENCE_DEFINITIONS) {
    const opusPath = path.join(AUDIO_V5_DIR, `${def.name}.opus`);
    const m4aPath = path.join(AUDIO_V5_DIR, `${def.name}.m4a`);

    // Render opus (optimized 40k for 15s stereo/mono bed)
    runFfmpeg([
      '-f', 'lavfi',
      '-i', 'anullsrc=r=48000:cl=mono',
      '-filter_complex', def.filtergraph,
      '-map', '[mix]',
      '-t', `${def.durationSec}`,
      '-c:a', 'libopus',
      '-b:a', '40k',
      '-ac', '1',
      '-f', 'webm',
      opusPath
    ]);

    // Render m4a fallback (optimized 56k)
    runFfmpeg([
      '-i', opusPath,
      '-c:a', 'aac',
      '-b:a', '56k',
      '-ac', '1',
      m4aPath
    ]);

    const opusStat = fs.statSync(opusPath);
    const m4aStat = fs.statSync(m4aPath);
    const loudness = measureLoudness(opusPath);
    const probe = probeAudio(opusPath);

    const res = {
      cueId: def.cueId,
      name: def.name,
      opusPath,
      m4aPath,
      opusBytes: opusStat.size,
      m4aBytes: m4aStat.size,
      duration: parseFloat(probe.format.duration),
      integratedLUFS: loudness.integratedLUFS,
      truePeakDb: loudness.truePeakDb,
      bus: def.bus,
      loop: def.loop
    };

    results.push(res);
    manifestCues[def.cueId] = {
      opus: `/audio/v5/${def.name}.opus`,
      m4a: `/audio/v5/${def.name}.m4a`,
      durationSeconds: def.durationSec,
      bus: def.bus,
      loop: def.loop,
      runtimeCueId: def.runtimeCueId,
      aliases: def.aliases
    };

    console.log(`- ${def.cueId}: ${res.integratedLUFS.toFixed(1)} LUFS, peak ${res.truePeakDb.toFixed(1)} dBFS, opus ${(res.opusBytes / 1024).toFixed(1)} KB, m4a ${(res.m4aBytes / 1024).toFixed(1)} KB, dur ${res.duration.toFixed(1)}s`);
  }

  // Write reports/v5/AG4/R2-loudness.csv
  const csvLines = [
    'cueId,name,opusPath,opusBytes,m4aBytes,durationSec,integratedLUFS,truePeakDbFS,bus,loop'
  ];
  for (const r of results) {
    csvLines.push(`${r.cueId},${r.name},${r.opusPath},${r.opusBytes},${r.m4aBytes},${r.duration.toFixed(3)},${r.integratedLUFS.toFixed(1)},${r.truePeakDb.toFixed(1)},${r.bus},${r.loop}`);
  }
  const csvPath = path.join(REPORTS_DIR, 'R2-loudness.csv');
  fs.writeFileSync(csvPath, csvLines.join('\n') + '\n', 'utf8');
  console.log(`Wrote loudness report: ${csvPath}`);

  // Update manifest.json
  const manifestPath = path.join(AUDIO_V5_DIR, 'manifest.json');
  let currentManifest = {};
  if (fs.existsSync(manifestPath)) {
    try {
      currentManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (e) {
      currentManifest = {};
    }
  }
  const updatedManifest = {
    ...currentManifest,
    ...manifestCues
  };
  fs.writeFileSync(manifestPath, JSON.stringify(updatedManifest, null, 2) + '\n', 'utf8');
  console.log(`Updated manifest: ${manifestPath}`);

  const lufsValues = results.map(r => r.integratedLUFS);
  const minLufs = Math.min(...lufsValues);
  const maxLufs = Math.max(...lufsValues);
  const avgLufs = lufsValues.reduce((a, b) => a + b, 0) / lufsValues.length;
  const spread = maxLufs - minLufs;

  console.log(`R2 Loudness spread: min=${minLufs.toFixed(1)}, max=${maxLufs.toFixed(1)}, avg=${avgLufs.toFixed(1)}, spread=${spread.toFixed(1)} LU`);
  return { results, spread, avgLufs };
}

/**
 * R3: UI Set Definitions (click, hover, confirm, cancel, card flip, coin, error, all <= 15 KB)
 */
export const UI_SET_DEFINITIONS = [
  {
    cueId: 'ui.click',
    name: 'ui-click',
    runtimeCueId: 'ui.click',
    aliases: ['ui.tab', 'ui.toggle'],
    durationSec: 0.12,
    bus: 'ui',
    transientFilter: "aevalsrc=exprs='0.9*sin(2*PI*3200*t)*exp(-t/0.003)':s=48000:d=0.01",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.95*sin(2*PI*(320-100*(t/0.06))*t)*exp(-t/0.018)':s=48000:d=0.06",
    bodyDelayMs: 2,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.06,lowpass=f=950,volume=0.25,afade=t=out:st=0.01:d=0.05",
    tailDelayMs: 4,
    masterGain: 2.35,
    targetLufs: -18.0,
    limiterLinear: 0.70
  },
  {
    cueId: 'ui.hover',
    name: 'ui-hover',
    runtimeCueId: 'ui.hover',
    aliases: ['ui.scroll'],
    durationSec: 0.10,
    bus: 'ui',
    transientFilter: "anoisesrc=c=white:r=48000:d=0.018,bandpass=f=3800:w=1200,afade=t=out:st=0:d=0.018,volume=0.45",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.65*sin(2*PI*(450-80*(t/0.04))*t)*exp(-t/0.025)':s=48000:d=0.04",
    bodyDelayMs: 2,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.04,bandpass=f=2400:w=800,volume=0.15,afade=t=out:st=0.01:d=0.03",
    tailDelayMs: 5,
    masterGain: 2.15,
    targetLufs: -18.0,
    limiterLinear: 0.70
  },
  {
    cueId: 'ui.confirm',
    name: 'ui-confirm',
    runtimeCueId: 'ui.confirm',
    aliases: ['ui.open', 'ui.turn'],
    durationSec: 0.28,
    bus: 'ui',
    transientFilter: "aevalsrc=exprs='0.75*(sin(2*PI*1046.5*t)+0.8*sin(2*PI*1318.51*t))*exp(-t/0.04)':s=48000:d=0.12",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.65*sin(2*PI*1567.98*t)*exp(-t/0.06)':s=48000:d=0.15",
    bodyDelayMs: 40,
    tailFilter: "anoisesrc=c=white:r=48000:d=0.20,bandpass=f=2800:w=1400,volume=0.2,afade=t=out:st=0.04:d=0.16",
    tailDelayMs: 20,
    masterGain: 1.1,
    targetLufs: -18.0,
    limiterLinear: 0.75
  },
  {
    cueId: 'ui.cancel',
    name: 'ui-cancel',
    runtimeCueId: 'ui.cancel',
    aliases: ['ui.close'],
    durationSec: 0.22,
    bus: 'ui',
    transientFilter: "aevalsrc=exprs='0.6*sin(2*PI*1200*t)*exp(-t/0.01)':s=48000:d=0.02",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.75*sin(2*PI*(659.25-220*(t/0.12))*t)*exp(-t/0.05)':s=48000:d=0.14",
    bodyDelayMs: 8,
    tailFilter: "anoisesrc=c=brown:r=48000:d=0.15,lowpass=f=550,volume=0.22,afade=t=out:st=0.02:d=0.13",
    tailDelayMs: 15,
    masterGain: 1.4,
    targetLufs: -18.0,
    limiterLinear: 0.72
  },
  {
    cueId: 'ui.card_flip',
    name: 'ui-card-flip',
    runtimeCueId: 'ui.card_flip',
    aliases: ['ui.flip', 'ui.page'],
    durationSec: 0.18,
    bus: 'ui',
    transientFilter: "anoisesrc=c=white:r=48000:d=0.02,highpass=f=3400,afade=t=out:st=0:d=0.02,volume=0.75",
    transientDelayMs: 0,
    bodyFilter: "anoisesrc=c=pink:r=48000:d=0.10,bandpass=f=1800:w=1000,afade=t=in:st=0:d=0.02,afade=t=out:st=0.02:d=0.08,volume=0.65",
    bodyDelayMs: 5,
    tailFilter: "aevalsrc=exprs='0.5*sin(2*PI*(180-60*(t/0.05))*t)*exp(-t/0.02)':s=48000:d=0.05",
    tailDelayMs: 25,
    masterGain: 2.10,
    targetLufs: -18.0,
    limiterLinear: 0.72
  },
  {
    cueId: 'ui.coin',
    name: 'ui-coin',
    runtimeCueId: 'ui.coin',
    aliases: ['currency.fish.gain', 'currency.threads.gain'],
    durationSec: 0.35,
    bus: 'ui',
    transientFilter: "aevalsrc=exprs='0.8*(sin(2*PI*2093*t)+0.6*sin(2*PI*3136*t)+0.4*sin(2*PI*4186*t))*exp(-t/0.03)':s=48000:d=0.10",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.7*sin(2*PI*2093*t)*exp(-t/0.12)':s=48000:d=0.25",
    bodyDelayMs: 10,
    tailFilter: "anoisesrc=c=white:r=48000:d=0.30,highpass=f=4000,volume=0.18,afade=t=out:st=0.03:d=0.27",
    tailDelayMs: 20,
    masterGain: 0.95,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'ui.error',
    name: 'ui-error',
    runtimeCueId: 'ui.error',
    aliases: ['ui.fail', 'tx.failed'],
    durationSec: 0.26,
    bus: 'ui',
    transientFilter: "aevalsrc=exprs='0.7*sin(2*PI*240*t)*exp(-t/0.015)':s=48000:d=0.03",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.65*(sin(2*PI*164.81*t)+0.6*sin(2*PI*174.61*t))*exp(-t/0.08)':s=48000:d=0.18",
    bodyDelayMs: 8,
    tailFilter: "anoisesrc=c=brown:r=48000:d=0.18,lowpass=f=400,volume=0.2,afade=t=out:st=0.03:d=0.15",
    tailDelayMs: 15,
    masterGain: 1.35,
    targetLufs: -18.0,
    limiterLinear: 0.72
  }
];

export function renderUiSet() {
  console.log(`Rendering ${UI_SET_DEFINITIONS.length} UI cues (R3)...`);
  const results = [];
  const manifestCues = {};

  for (const def of UI_SET_DEFINITIONS) {
    const res = synthesizeCue(def);
    results.push({ ...res, cueId: def.cueId });
    manifestCues[def.cueId] = {
      opus: `/audio/v5/${def.name}.opus`,
      m4a: `/audio/v5/${def.name}.m4a`,
      durationSeconds: parseFloat(res.duration.toFixed(3)),
      bus: def.bus,
      runtimeCueId: def.runtimeCueId,
      aliases: def.aliases
    };
    console.log(`- ${def.cueId}: ${res.integratedLUFS.toFixed(1)} LUFS, peak ${res.truePeakDb.toFixed(1)} dBFS, size ${res.sizeBytes} B, dur ${res.duration.toFixed(2)}s`);
  }

  // Write reports/v5/AG4/R3-loudness.csv
  const csvLines = [
    'cueId,name,opusPath,sizeBytes,durationSec,integratedLUFS,truePeakDbFS,bus'
  ];
  for (const r of results) {
    csvLines.push(`${r.cueId},${r.name},${r.opusPath},${r.sizeBytes},${r.duration.toFixed(3)},${r.integratedLUFS.toFixed(1)},${r.truePeakDb.toFixed(1)},ui`);
  }
  const csvPath = path.join(REPORTS_DIR, 'R3-loudness.csv');
  fs.writeFileSync(csvPath, csvLines.join('\n') + '\n', 'utf8');
  console.log(`Wrote loudness report: ${csvPath}`);

  // Update manifest.json
  const manifestPath = path.join(AUDIO_V5_DIR, 'manifest.json');
  let currentManifest = {};
  if (fs.existsSync(manifestPath)) {
    try {
      currentManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (e) {
      currentManifest = {};
    }
  }
  const updatedManifest = {
    ...currentManifest,
    ...manifestCues
  };
  fs.writeFileSync(manifestPath, JSON.stringify(updatedManifest, null, 2) + '\n', 'utf8');
  console.log(`Updated manifest: ${manifestPath}`);

  const lufsValues = results.map(r => r.integratedLUFS);
  const minLufs = Math.min(...lufsValues);
  const maxLufs = Math.max(...lufsValues);
  const avgLufs = lufsValues.reduce((a, b) => a + b, 0) / lufsValues.length;
  const spread = maxLufs - minLufs;

  console.log(`R3 Loudness spread: min=${minLufs.toFixed(1)}, max=${maxLufs.toFixed(1)}, avg=${avgLufs.toFixed(1)}, spread=${spread.toFixed(1)} LU`);
  return { results, spread, avgLufs };
}

/**
 * R4: Stingers Definitions (victory, defeat, level-up, boss appear, all <= 3s)
 */
export const STINGER_DEFINITIONS = [
  {
    cueId: 'stinger.victory',
    name: 'stinger-victory',
    runtimeCueId: 'stinger.victory',
    aliases: ['victory', 'battle.victory', 'voice.victory'],
    durationSec: 2.4,
    bus: 'sfx',
    transientFilter: "aevalsrc=exprs='0.75*(sin(2*PI*523.25*t)+0.7*sin(2*PI*659.25*t)+0.6*sin(2*PI*783.99*t)+0.5*sin(2*PI*1046.5*t))*exp(-t/0.3)':s=48000:d=0.8",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.8*(sin(2*PI*261.63*t)+0.6*sin(2*PI*392*t))*exp(-t/0.6)':s=48000:d=1.5",
    bodyDelayMs: 50,
    tailFilter: "anoisesrc=c=pink:r=48000:d=1.6,bandpass=f=2400:w=1200,volume=0.25,afade=t=out:st=0.2:d=1.4",
    tailDelayMs: 100,
    masterGain: 0.85,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'stinger.defeat',
    name: 'stinger-defeat',
    runtimeCueId: 'stinger.defeat',
    aliases: ['defeat', 'battle.defeat', 'voice.defeat'],
    durationSec: 2.2,
    bus: 'sfx',
    transientFilter: "aevalsrc=exprs='0.7*(sin(2*PI*440*t)+0.6*sin(2*PI*349.23*t)+0.5*sin(2*PI*293.66*t))*exp(-t/0.4)':s=48000:d=1.0",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.85*sin(2*PI*(146.83-30*(t/1.2))*t)*exp(-t/0.7)':s=48000:d=1.4",
    bodyDelayMs: 60,
    tailFilter: "anoisesrc=c=brown:r=48000:d=1.5,lowpass=f=350,volume=0.3,afade=t=out:st=0.2:d=1.3",
    tailDelayMs: 120,
    masterGain: 0.90,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'stinger.level_up',
    name: 'stinger-level-up',
    runtimeCueId: 'stinger.level_up',
    aliases: ['level-up', 'gacha.reveal', 'gacha.pity'],
    durationSec: 1.8,
    bus: 'sfx',
    transientFilter: "aevalsrc=exprs='0.75*(sin(2*PI*1046.5*t)+0.7*sin(2*PI*1318.51*t)+0.6*sin(2*PI*1567.98*t)+0.8*sin(2*PI*2093*t))*exp(-t/0.25)':s=48000:d=0.7",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.85*(sin(2*PI*523.25*t)+0.5*sin(2*PI*783.99*t))*exp(-t/0.45)':s=48000:d=1.1",
    bodyDelayMs: 40,
    tailFilter: "anoisesrc=c=white:r=48000:d=1.2,bandpass=f=3200:w=1600,volume=0.22,afade=t=out:st=0.1:d=1.1",
    tailDelayMs: 80,
    masterGain: 0.70,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'stinger.boss_appear',
    name: 'stinger-boss-appear',
    runtimeCueId: 'stinger.boss_appear',
    aliases: ['boss.appear', 'boss.intro', 'boss.start'],
    durationSec: 2.6,
    bus: 'sfx',
    transientFilter: "aevalsrc=exprs='0.85*(sin(2*PI*73.42*t)+0.6*sin(2*PI*87.31*t)+0.5*sin(2*PI*110*t))*exp(-t/0.8)':s=48000:d=1.8",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.95*sin(2*PI*(95-35*(t/0.6))*t)*exp(-t/0.18)':s=48000:d=0.6",
    bodyDelayMs: 600,
    tailFilter: "anoisesrc=c=brown:r=48000:d=1.6,lowpass=f=420,volume=0.35,afade=t=out:st=0.2:d=1.4",
    tailDelayMs: 650,
    masterGain: 0.75,
    targetLufs: -18.0,
    limiterLinear: 0.78
  }
];

export function renderStingers() {
  console.log(`Rendering ${STINGER_DEFINITIONS.length} Stingers (R4)...`);
  const results = [];
  const manifestCues = {};

  for (const def of STINGER_DEFINITIONS) {
    const res = synthesizeCue({ ...def, opusBitrate: '40k', aacBitrate: '56k' });
    results.push({ ...res, cueId: def.cueId });
    manifestCues[def.cueId] = {
      opus: `/audio/v5/${def.name}.opus`,
      m4a: `/audio/v5/${def.name}.m4a`,
      durationSeconds: parseFloat(res.duration.toFixed(3)),
      bus: def.bus,
      runtimeCueId: def.runtimeCueId,
      aliases: def.aliases
    };
    console.log(`- ${def.cueId}: ${res.integratedLUFS.toFixed(1)} LUFS, peak ${res.truePeakDb.toFixed(1)} dBFS, size ${res.sizeBytes} B, dur ${res.duration.toFixed(2)}s`);
  }

  // Write reports/v5/AG4/R4-loudness.csv
  const csvLines = [
    'cueId,name,opusPath,sizeBytes,durationSec,integratedLUFS,truePeakDbFS,bus'
  ];
  for (const r of results) {
    csvLines.push(`${r.cueId},${r.name},${r.opusPath},${r.sizeBytes},${r.duration.toFixed(3)},${r.integratedLUFS.toFixed(1)},${r.truePeakDb.toFixed(1)},sfx`);
  }
  const csvPath = path.join(REPORTS_DIR, 'R4-loudness.csv');
  fs.writeFileSync(csvPath, csvLines.join('\n') + '\n', 'utf8');
  console.log(`Wrote loudness report: ${csvPath}`);

  // Update manifest.json
  const manifestPath = path.join(AUDIO_V5_DIR, 'manifest.json');
  let currentManifest = {};
  if (fs.existsSync(manifestPath)) {
    try {
      currentManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (e) {
      currentManifest = {};
    }
  }
  const updatedManifest = {
    ...currentManifest,
    ...manifestCues
  };
  fs.writeFileSync(manifestPath, JSON.stringify(updatedManifest, null, 2) + '\n', 'utf8');
  console.log(`Updated manifest: ${manifestPath}`);

  const lufsValues = results.map(r => r.integratedLUFS);
  const minLufs = Math.min(...lufsValues);
  const maxLufs = Math.max(...lufsValues);
  const avgLufs = lufsValues.reduce((a, b) => a + b, 0) / lufsValues.length;
  const spread = maxLufs - minLufs;

  console.log(`R4 Loudness spread: min=${minLufs.toFixed(1)}, max=${maxLufs.toFixed(1)}, avg=${avgLufs.toFixed(1)}, spread=${spread.toFixed(1)} LU`);
  return { results, spread, avgLufs };
}

/**
 * R5: Chain Moments Definitions (Avalanche transactions & receipts)
 */
export const CHAIN_MOMENT_DEFINITIONS = [
  {
    cueId: 'chain.tx_sent',
    name: 'chain-tx-sent',
    runtimeCueId: 'chain.tx_sent',
    aliases: ['tx.sent', 'chain.sent', 'blockchain.sent', 'wallet.sent'],
    durationSec: 0.45,
    bus: 'sfx',
    transientFilter: "aevalsrc=exprs='0.85*sin(2*PI*(3500+1700*(t/0.03))*t)*exp(-t/0.008)':s=48000:d=0.03",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.8*(sin(2*PI*(880+220*(t/0.18))*t)+0.5*sin(2*PI*(1320+330*(t/0.18))*t))*exp(-t/0.06)':s=48000:d=0.18",
    bodyDelayMs: 15,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.25,bandpass=f=3800:w=1200,volume=0.25,afade=t=out:st=0.02:d=0.23",
    tailDelayMs: 40,
    masterGain: 1.15,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'chain.tx_confirmed',
    name: 'chain-tx-confirmed',
    runtimeCueId: 'chain.tx_confirmed',
    aliases: ['tx.confirmed', 'chain.confirmed', 'avalanche.confirmed', 'blockchain.confirmed', 'fuji.confirmed'],
    durationSec: 1.25,
    bus: 'sfx',
    transientFilter: "aevalsrc=exprs='0.9*sin(2*PI*(2200-800*(t/0.02))*t)*exp(-t/0.006)':s=48000:d=0.02",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.8*(sin(2*PI*587.33*t)+0.65*sin(2*PI*880*t)+0.5*sin(2*PI*1174.66*t)+0.4*sin(2*PI*90*t))*exp(-t/0.28)':s=48000:d=0.9",
    bodyDelayMs: 10,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.9,bandpass=f=1800:w=1000,volume=0.22,afade=t=out:st=0.1:d=0.8",
    tailDelayMs: 40,
    masterGain: 0.82,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'chain.receipt_ready',
    name: 'chain-receipt-ready',
    runtimeCueId: 'chain.receipt_ready',
    aliases: ['receipt.ready', 'chain.receipt', 'receipt.fanout', 'ui.receipt.ready'],
    durationSec: 0.65,
    bus: 'sfx',
    transientFilter: "aevalsrc=exprs='0.85*(sin(2*PI*2637*t)+0.6*sin(2*PI*5274*t))*exp(-t/0.015)':s=48000:d=0.04",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.75*(sin(2*PI*1174.66*t)*exp(-t/0.12)+0.65*sin(2*PI*1760*t)*exp(-max(0,t-0.05)/0.12)+0.55*sin(2*PI*2349.32*t)*exp(-max(0,t-0.1)/0.15))':s=48000:d=0.45",
    bodyDelayMs: 15,
    tailFilter: "anoisesrc=c=white:r=48000:d=0.35,bandpass=f=2800:w=1400,volume=0.20,afade=t=out:st=0.05:d=0.30",
    tailDelayMs: 50,
    masterGain: 0.72,
    targetLufs: -18.0,
    limiterLinear: 0.78
  }
];

export function renderChainMoments() {
  console.log(`Rendering ${CHAIN_MOMENT_DEFINITIONS.length} Chain Moments (R5)...`);
  const results = [];
  const manifestCues = {};

  for (const def of CHAIN_MOMENT_DEFINITIONS) {
    const res = synthesizeCue(def);
    results.push({ ...res, cueId: def.cueId });
    manifestCues[def.cueId] = {
      opus: `/audio/v5/${def.name}.opus`,
      m4a: `/audio/v5/${def.name}.m4a`,
      durationSeconds: parseFloat(res.duration.toFixed(3)),
      bus: def.bus,
      runtimeCueId: def.runtimeCueId,
      aliases: def.aliases
    };
    console.log(`- ${def.cueId}: ${res.integratedLUFS.toFixed(1)} LUFS, peak ${res.truePeakDb.toFixed(1)} dBFS, size ${res.sizeBytes} B, dur ${res.duration.toFixed(2)}s`);
  }

  const csvLines = [
    'cueId,name,opusPath,sizeBytes,durationSec,integratedLUFS,truePeakDbFS,bus'
  ];
  for (const r of results) {
    csvLines.push(`${r.cueId},${r.name},${r.opusPath},${r.sizeBytes},${r.duration.toFixed(3)},${r.integratedLUFS.toFixed(1)},${r.truePeakDb.toFixed(1)},sfx`);
  }
  writeReportFile('R5-loudness.csv', csvLines.join('\n') + '\n');
  console.log('Wrote R5-loudness.csv to reports');

  // Update manifest.json
  const manifestPath = path.join(AUDIO_V5_DIR, 'manifest.json');
  let currentManifest = {};
  if (fs.existsSync(manifestPath)) {
    try {
      currentManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (e) {
      currentManifest = {};
    }
  }
  const updatedManifest = {
    ...currentManifest,
    ...manifestCues
  };
  fs.writeFileSync(manifestPath, JSON.stringify(updatedManifest, null, 2) + '\n', 'utf8');
  console.log(`Updated manifest: ${manifestPath}`);

  const lufsValues = results.map(r => r.integratedLUFS);
  const minLufs = Math.min(...lufsValues);
  const maxLufs = Math.max(...lufsValues);
  const avgLufs = lufsValues.reduce((a, b) => a + b, 0) / lufsValues.length;
  const spread = maxLufs - minLufs;

  console.log(`R5 Loudness spread: min=${minLufs.toFixed(1)}, max=${maxLufs.toFixed(1)}, avg=${avgLufs.toFixed(1)}, spread=${spread.toFixed(1)} LU`);
  return { results, spread, avgLufs };
}

/**
 * R6: Cat Emotes Definitions (4 heroes x 3 actions = 12 cues)
 */
export const CAT_EMOTE_DEFINITIONS = [
  // Mochi
  {
    cueId: 'emote.mochi.happy',
    name: 'cat-mochi-happy',
    runtimeCueId: 'emote.mochi.happy',
    aliases: ['mochi.happy', 'cat.happy', 'emote.happy'],
    durationSec: 0.38,
    bus: 'sfx',
    transientFilter: "anoisesrc=c=pink:r=48000:d=0.03,bandpass=f=1200:w=800,afade=t=out:st=0:d=0.03,volume=0.5",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.85*sin(2*PI*(420+360*(t/0.25))*t)*exp(-t/0.12)*(1+0.2*sin(2*PI*18*t))':s=48000:d=0.28",
    bodyDelayMs: 15,
    tailFilter: "anoisesrc=c=brown:r=48000:d=0.18,lowpass=f=700,volume=0.25,afade=t=out:st=0.02:d=0.16",
    tailDelayMs: 35,
    masterGain: 1.15,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'emote.mochi.hurt',
    name: 'cat-mochi-hurt',
    runtimeCueId: 'emote.mochi.hurt',
    aliases: ['mochi.hurt', 'cat.hurt', 'emote.hurt'],
    durationSec: 0.32,
    bus: 'sfx',
    transientFilter: "aevalsrc=exprs='0.8*sin(2*PI*850*t)*exp(-t/0.008)':s=48000:d=0.015",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.9*sin(2*PI*(680-360*(t/0.15))*t)*exp(-t/0.05)':s=48000:d=0.18",
    bodyDelayMs: 10,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.15,lowpass=f=550,volume=0.22,afade=t=out:st=0.01:d=0.14",
    tailDelayMs: 25,
    masterGain: 1.10,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'emote.mochi.purr',
    name: 'cat-mochi-purr',
    runtimeCueId: 'emote.mochi.purr',
    aliases: ['mochi.purr', 'cat.purr', 'emote.purr'],
    durationSec: 0.85,
    bus: 'sfx',
    transientFilter: "anoisesrc=c=brown:r=48000:d=0.05,lowpass=f=300,volume=0.3,afade=t=in:st=0:d=0.05",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.85*sin(2*PI*110*t)*(0.5+0.5*sin(2*PI*26*t))*exp(-t/0.5)':s=48000:d=0.75",
    bodyDelayMs: 20,
    tailFilter: "anoisesrc=c=brown:r=48000:d=0.45,lowpass=f=220,volume=0.35,afade=t=out:st=0.05:d=0.40",
    tailDelayMs: 60,
    masterGain: 1.25,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },

  // Soot
  {
    cueId: 'emote.soot.happy',
    name: 'cat-soot-happy',
    runtimeCueId: 'emote.soot.happy',
    aliases: ['soot.happy'],
    durationSec: 0.35,
    bus: 'sfx',
    transientFilter: "aevalsrc=exprs='0.85*sin(2*PI*(3200-1200*(t/0.01))*t)*exp(-t/0.004)':s=48000:d=0.012",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.85*sin(2*PI*(560+380*(t/0.22))*t)*exp(-t/0.10)*(1+0.25*sin(2*PI*22*t))':s=48000:d=0.25",
    bodyDelayMs: 12,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.18,bandpass=f=2200:w=1200,volume=0.22,afade=t=out:st=0.02:d=0.16",
    tailDelayMs: 30,
    masterGain: 1.15,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'emote.soot.hurt',
    name: 'cat-soot-hurt',
    runtimeCueId: 'emote.soot.hurt',
    aliases: ['soot.hurt'],
    durationSec: 0.30,
    bus: 'sfx',
    transientFilter: "aevalsrc=exprs='0.9*sin(2*PI*1100*t)*exp(-t/0.005)':s=48000:d=0.012",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.92*sin(2*PI*(760-400*(t/0.14))*t)*exp(-t/0.045)':s=48000:d=0.16",
    bodyDelayMs: 10,
    tailFilter: "anoisesrc=c=white:r=48000:d=0.14,bandpass=f=1800:w=900,volume=0.20,afade=t=out:st=0.01:d=0.13",
    tailDelayMs: 25,
    masterGain: 1.10,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'emote.soot.purr',
    name: 'cat-soot-purr',
    runtimeCueId: 'emote.soot.purr',
    aliases: ['soot.purr'],
    durationSec: 0.85,
    bus: 'sfx',
    transientFilter: "aevalsrc=exprs='0.6*sin(2*PI*280*t)*exp(-t/0.01)':s=48000:d=0.02",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.85*(sin(2*PI*125*t)+0.3*sin(2*PI*250*t))*(0.5+0.5*sin(2*PI*28*t))*exp(-t/0.52)':s=48000:d=0.75",
    bodyDelayMs: 18,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.45,lowpass=f=320,volume=0.30,afade=t=out:st=0.05:d=0.40",
    tailDelayMs: 60,
    masterGain: 1.20,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },

  // Clover
  {
    cueId: 'emote.clover.happy',
    name: 'cat-clover-happy',
    runtimeCueId: 'emote.clover.happy',
    aliases: ['clover.happy'],
    durationSec: 0.38,
    bus: 'sfx',
    transientFilter: "aevalsrc=exprs='0.8*sin(2*PI*1760*t)*exp(-t/0.006)':s=48000:d=0.015",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.8*(sin(2*PI*(500+360*(t/0.26))*t)+0.4*sin(2*PI*(1000+720*(t/0.26))*t))*exp(-t/0.12)':s=48000:d=0.28",
    bodyDelayMs: 14,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.22,bandpass=f=1600:w=800,volume=0.22,afade=t=out:st=0.02:d=0.20",
    tailDelayMs: 35,
    masterGain: 1.15,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'emote.clover.hurt',
    name: 'cat-clover-hurt',
    runtimeCueId: 'emote.clover.hurt',
    aliases: ['clover.hurt'],
    durationSec: 0.32,
    bus: 'sfx',
    transientFilter: "aevalsrc=exprs='0.85*sin(2*PI*950*t)*exp(-t/0.006)':s=48000:d=0.012",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.9*sin(2*PI*(690-360*(t/0.14))*t)*exp(-t/0.048)':s=48000:d=0.16",
    bodyDelayMs: 10,
    tailFilter: "anoisesrc=c=brown:r=48000:d=0.14,lowpass=f=480,volume=0.22,afade=t=out:st=0.01:d=0.13",
    tailDelayMs: 25,
    masterGain: 1.10,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'emote.clover.purr',
    name: 'cat-clover-purr',
    runtimeCueId: 'emote.clover.purr',
    aliases: ['clover.purr'],
    durationSec: 0.85,
    bus: 'sfx',
    transientFilter: "anoisesrc=c=pink:r=48000:d=0.04,lowpass=f=400,volume=0.3",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.85*(sin(2*PI*130*t)+0.25*sin(2*PI*260*t))*(0.5+0.5*sin(2*PI*25*t))*exp(-t/0.5)':s=48000:d=0.75",
    bodyDelayMs: 18,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.45,lowpass=f=280,volume=0.30,afade=t=out:st=0.05:d=0.40",
    tailDelayMs: 60,
    masterGain: 1.20,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },

  // Panko
  {
    cueId: 'emote.panko.happy',
    name: 'cat-panko-happy',
    runtimeCueId: 'emote.panko.happy',
    aliases: ['panko.happy'],
    durationSec: 0.38,
    bus: 'sfx',
    transientFilter: "aevalsrc=exprs='0.85*sin(2*PI*2100*t)*exp(-t/0.007)':s=48000:d=0.015",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.85*sin(2*PI*(440+320*(t/0.25))*t)*exp(-t/0.11)*(1+0.2*sin(2*PI*20*t))':s=48000:d=0.28",
    bodyDelayMs: 14,
    tailFilter: "anoisesrc=c=brown:r=48000:d=0.20,lowpass=f=600,volume=0.24,afade=t=out:st=0.02:d=0.18",
    tailDelayMs: 35,
    masterGain: 1.15,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'emote.panko.hurt',
    name: 'cat-panko-hurt',
    runtimeCueId: 'emote.panko.hurt',
    aliases: ['panko.hurt'],
    durationSec: 0.32,
    bus: 'sfx',
    transientFilter: "aevalsrc=exprs='0.9*sin(2*PI*1250*t)*exp(-t/0.006)':s=48000:d=0.012",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.9*sin(2*PI*(640-340*(t/0.15))*t)*exp(-t/0.048)':s=48000:d=0.17",
    bodyDelayMs: 10,
    tailFilter: "anoisesrc=c=brown:r=48000:d=0.14,lowpass=f=420,volume=0.22,afade=t=out:st=0.01:d=0.13",
    tailDelayMs: 25,
    masterGain: 1.10,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'emote.panko.purr',
    name: 'cat-panko-purr',
    runtimeCueId: 'emote.panko.purr',
    aliases: ['panko.purr'],
    durationSec: 0.85,
    bus: 'sfx',
    transientFilter: "anoisesrc=c=brown:r=48000:d=0.04,lowpass=f=350,volume=0.3",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.88*(sin(2*PI*115*t)+0.28*sin(2*PI*230*t))*(0.5+0.5*sin(2*PI*27*t))*exp(-t/0.5)':s=48000:d=0.75",
    bodyDelayMs: 18,
    tailFilter: "anoisesrc=c=brown:r=48000:d=0.45,lowpass=f=250,volume=0.32,afade=t=out:st=0.05:d=0.40",
    tailDelayMs: 60,
    masterGain: 1.20,
    targetLufs: -18.0,
    limiterLinear: 0.78
  }
];

export function renderCatEmotes() {
  console.log(`Rendering ${CAT_EMOTE_DEFINITIONS.length} Cat Emotes (R6)...`);
  const results = [];
  const manifestCues = {};

  for (const def of CAT_EMOTE_DEFINITIONS) {
    const res = synthesizeCue(def);
    results.push({ ...res, cueId: def.cueId });
    manifestCues[def.cueId] = {
      opus: `/audio/v5/${def.name}.opus`,
      m4a: `/audio/v5/${def.name}.m4a`,
      durationSeconds: parseFloat(res.duration.toFixed(3)),
      bus: def.bus,
      runtimeCueId: def.runtimeCueId,
      aliases: def.aliases
    };
    console.log(`- ${def.cueId}: ${res.integratedLUFS.toFixed(1)} LUFS, peak ${res.truePeakDb.toFixed(1)} dBFS, size ${res.sizeBytes} B, dur ${res.duration.toFixed(2)}s`);
  }

  const csvLines = [
    'cueId,name,opusPath,sizeBytes,durationSec,integratedLUFS,truePeakDbFS,bus'
  ];
  for (const r of results) {
    csvLines.push(`${r.cueId},${r.name},${r.opusPath},${r.sizeBytes},${r.duration.toFixed(3)},${r.integratedLUFS.toFixed(1)},${r.truePeakDb.toFixed(1)},sfx`);
  }
  writeReportFile('R6-loudness.csv', csvLines.join('\n') + '\n');
  console.log('Wrote R6-loudness.csv to reports');

  // Update manifest.json
  const manifestPath = path.join(AUDIO_V5_DIR, 'manifest.json');
  let currentManifest = {};
  if (fs.existsSync(manifestPath)) {
    try {
      currentManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (e) {
      currentManifest = {};
    }
  }
  const updatedManifest = {
    ...currentManifest,
    ...manifestCues
  };
  fs.writeFileSync(manifestPath, JSON.stringify(updatedManifest, null, 2) + '\n', 'utf8');
  console.log(`Updated manifest: ${manifestPath}`);

  const lufsValues = results.map(r => r.integratedLUFS);
  const minLufs = Math.min(...lufsValues);
  const maxLufs = Math.max(...lufsValues);
  const avgLufs = lufsValues.reduce((a, b) => a + b, 0) / lufsValues.length;
  const spread = maxLufs - minLufs;

  console.log(`R6 Loudness spread: min=${minLufs.toFixed(1)}, max=${maxLufs.toFixed(1)}, avg=${avgLufs.toFixed(1)}, spread=${spread.toFixed(1)} LU`);
  return { results, spread, avgLufs };
}

/**
 * R7: Boss Phase & Ultimate Layers Definitions (Yarn Giant)
 */
export const BOSS_LAYER_DEFINITIONS = [
  {
    cueId: 'boss.yarn-giant.phase_change',
    name: 'boss-yarn-giant-phase-change',
    runtimeCueId: 'boss.yarn-giant.phase_change',
    aliases: ['boss.phase_change', 'boss.enrage', 'yarn-giant.phase2'],
    durationSec: 1.85,
    bus: 'sfx',
    transientFilter: "aevalsrc=exprs='0.9*sin(2*PI*(2400-1100*(t/0.04))*t)*exp(-t/0.012)':s=48000:d=0.04",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.9*(sin(2*PI*(65+40*(t/1.2))*t)+0.5*sin(2*PI*(130+80*(t/1.2))*t))*(1+0.25*sin(2*PI*8*t))*exp(-t/0.8)':s=48000:d=1.4",
    bodyDelayMs: 25,
    tailFilter: "anoisesrc=c=brown:r=48000:d=1.4,lowpass=f=280,volume=0.38,afade=t=out:st=0.3:d=1.1",
    tailDelayMs: 120,
    masterGain: 0.95,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'boss.yarn-giant.shockwave',
    name: 'boss-yarn-giant-shockwave',
    runtimeCueId: 'boss.yarn-giant.shockwave',
    aliases: ['boss.shockwave', 'yarn-giant.ground-crack', 'shockwave.heavy'],
    durationSec: 1.45,
    bus: 'sfx',
    transientFilter: "aevalsrc=exprs='0.95*sin(2*PI*(140-80*(t/0.03))*t)*exp(-t/0.008)':s=48000:d=0.03",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.92*sin(2*PI*(48-12*(t/0.8))*t)*exp(-t/0.45)':s=48000:d=1.0",
    bodyDelayMs: 15,
    tailFilter: "anoisesrc=c=pink:r=48000:d=1.1,bandpass=f=450:w=300,volume=0.32,afade=t=out:st=0.1:d=1.0",
    tailDelayMs: 50,
    masterGain: 0.92,
    targetLufs: -18.0,
    limiterLinear: 0.78
  },
  {
    cueId: 'boss.yarn-giant.thread_charge',
    name: 'boss-yarn-giant-thread-charge',
    runtimeCueId: 'boss.yarn-giant.thread_charge',
    aliases: ['boss.charge', 'yarn-giant.charge-swirl', 'ult.yarn-giant.charge'],
    durationSec: 0.95,
    bus: 'sfx',
    transientFilter: "anoisesrc=c=pink:r=48000:d=0.25,bandpass=f=800:w=500,afade=t=in:st=0:d=0.25,volume=0.4",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.85*(sin(2*PI*(180+340*(t/0.75))*t)+0.4*sin(2*PI*(360+680*(t/0.75))*t))*exp(-max(0,0.75-t)/0.4)':s=48000:d=0.8",
    bodyDelayMs: 80,
    tailFilter: "aevalsrc=exprs='0.7*sin(2*PI*520*t)*exp(-t/0.15)':s=48000:d=0.25",
    tailDelayMs: 650,
    masterGain: 0.58,
    targetLufs: -18.0,
    limiterLinear: 0.78
  }
];

export function renderBossLayers() {
  console.log(`Rendering ${BOSS_LAYER_DEFINITIONS.length} Boss Phase & Ultimate Layers (R7)...`);
  const results = [];
  const manifestCues = {};

  for (const def of BOSS_LAYER_DEFINITIONS) {
    const res = synthesizeCue(def);
    results.push({ ...res, cueId: def.cueId });
    manifestCues[def.cueId] = {
      opus: `/audio/v5/${def.name}.opus`,
      m4a: `/audio/v5/${def.name}.m4a`,
      durationSeconds: parseFloat(res.duration.toFixed(3)),
      bus: def.bus,
      runtimeCueId: def.runtimeCueId,
      aliases: def.aliases
    };
    console.log(`- ${def.cueId}: ${res.integratedLUFS.toFixed(1)} LUFS, peak ${res.truePeakDb.toFixed(1)} dBFS, size ${res.sizeBytes} B, dur ${res.duration.toFixed(2)}s`);
  }

  const csvLines = [
    'cueId,name,opusPath,sizeBytes,durationSec,integratedLUFS,truePeakDbFS,bus'
  ];
  for (const r of results) {
    csvLines.push(`${r.cueId},${r.name},${r.opusPath},${r.sizeBytes},${r.duration.toFixed(3)},${r.integratedLUFS.toFixed(1)},${r.truePeakDb.toFixed(1)},sfx`);
  }
  writeReportFile('R7-loudness.csv', csvLines.join('\n') + '\n');
  console.log('Wrote R7-loudness.csv to reports');

  // Update manifest.json
  const manifestPath = path.join(AUDIO_V5_DIR, 'manifest.json');
  let currentManifest = {};
  if (fs.existsSync(manifestPath)) {
    try {
      currentManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (e) {
      currentManifest = {};
    }
  }
  const updatedManifest = {
    ...currentManifest,
    ...manifestCues
  };
  fs.writeFileSync(manifestPath, JSON.stringify(updatedManifest, null, 2) + '\n', 'utf8');
  console.log(`Updated manifest: ${manifestPath}`);

  const lufsValues = results.map(r => r.integratedLUFS);
  const minLufs = Math.min(...lufsValues);
  const maxLufs = Math.max(...lufsValues);
  const avgLufs = lufsValues.reduce((a, b) => a + b, 0) / lufsValues.length;
  const spread = maxLufs - minLufs;

  console.log(`R7 Loudness spread: min=${minLufs.toFixed(1)}, max=${maxLufs.toFixed(1)}, avg=${avgLufs.toFixed(1)}, spread=${spread.toFixed(1)} LU`);
  return { results, spread, avgLufs };
}

/**
 * R8: Full Audio Mix Pass & Gain Proposal Generation
 */
export function runMixPass() {
  console.log('=== Running Full V5 Audio Mix Pass (R8) ===');
  const manifestPath = path.join(AUDIO_V5_DIR, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const busTargets = {
    sfx: -18.0,
    ui: -19.0,
    voice: -18.0,
    ambience: -22.0
  };

  const cueEntries = Object.entries(manifest).filter(([k, v]) => typeof v === 'object' && v.opus && !k.startsWith('ranged.') && !k.startsWith('kit.ranged'));
  const rows = [];
  const proposals = [];

  for (const [cueId, meta] of cueEntries) {
    const fullPath = path.join(ROOT_DIR, 'apps/web/public', meta.opus);
    if (!fs.existsSync(fullPath)) continue;

    const loudness = measureLoudness(fullPath);
    const bus = meta.bus || 'sfx';
    const targetLufs = busTargets[bus] || -18.0;
    const diff = targetLufs - loudness.integratedLUFS;
    const gainProposalDb = Math.abs(diff) > 1.5 ? parseFloat(diff.toFixed(1)) : 0.0;

    rows.push({
      cueId,
      opus: meta.opus,
      bus,
      integratedLUFS: loudness.integratedLUFS,
      truePeakDb: loudness.truePeakDb,
      targetLufs,
      gainProposalDb
    });

    if (gainProposalDb !== 0) {
      proposals.push({ cueId, bus, currentLUFS: loudness.integratedLUFS, targetLufs, gainProposalDb });
    }
  }

  // Write CSV
  const csvLines = [
    'cueId,opus,bus,integratedLUFS,truePeakDbFS,targetLufs,gainProposalDb'
  ];
  for (const r of rows) {
    csvLines.push(`${r.cueId},${r.opus},${r.bus},${r.integratedLUFS.toFixed(1)},${r.truePeakDb.toFixed(1)},${r.targetLufs.toFixed(1)},${r.gainProposalDb.toFixed(1)}`);
  }
  writeReportFile('R8-loudness-full.csv', csvLines.join('\n') + '\n');

  // Write Markdown Report
  const mdReport = [
    '# R8: V5 Audio Mix Pass & Gain Proposals',
    '',
    `- Total evaluated cues: ${rows.length}`,
    `- Outliers requiring gain tuning: ${proposals.length}`,
    `- Bus Targets: SFX = -18.0 LUFS, UI = -19.0 LUFS, Voice = -18.0 LUFS, Ambience = -22.0 LUFS`,
    '',
    '## Gain Tuning Recommendations for CXI Audio Engine',
    '| Cue ID | Bus | Current LUFS | Target LUFS | Proposed Gain (dB) | Notes |',
    '| :--- | :---: | :---: | :---: | :---: | :--- |'
  ];

  for (const p of proposals) {
    mdReport.push(`| \`${p.cueId}\` | ${p.bus} | ${p.currentLUFS.toFixed(1)} | ${p.targetLufs.toFixed(1)} | ${p.gainProposalDb > 0 ? '+' : ''}${p.gainProposalDb} dB | Calibration offset |`);
  }

  if (proposals.length === 0) {
    mdReport.push('| None | - | - | - | 0.0 dB | All evaluated cues within +/- 1.5 LU of bus targets! |');
  }

  writeReportFile('R8-MIX-PASS.md', mdReport.join('\n') + '\n');
  console.log(`Mix pass complete. Evaluated ${rows.length} cues, found ${proposals.length} tuning recommendations.`);
  return { rows, proposals };
}

// CLI dispatcher
const arg = process.argv[2];
if (arg === '--calibrate') {
  renderCalibration();
} else if (arg === '--hero-skills') {
  renderHeroSkills();
} else if (arg === '--split-ranged') {
  splitRangedImpacts();
} else if (arg === '--enemy-ui') {
  renderEnemyAndUi();
} else if (arg === '--variations') {
  renderVariations();
} else if (arg === '--ambience') {
  renderAmbience();
} else if (arg === '--ui-set') {
  renderUiSet();
} else if (arg === '--stingers') {
  renderStingers();
} else if (arg === '--chain-moments') {
  renderChainMoments();
} else if (arg === '--cat-emotes') {
  renderCatEmotes();
} else if (arg === '--boss-layers') {
  renderBossLayers();
} else if (arg === '--mix-pass') {
  runMixPass();
} else if (arg === '--all') {
  renderCalibration();
  renderHeroSkills();
  splitRangedImpacts();
  renderEnemyAndUi();
  renderVariations();
  renderAmbience();
  renderUiSet();
  renderStingers();
  renderChainMoments();
  renderCatEmotes();
  renderBossLayers();
  runMixPass();
} else if (arg === '--help' || !arg) {
  console.log('Usage: node tools/v5audio/render.mjs [--calibrate | --hero-skills | --split-ranged | --enemy-ui | --variations | --ambience | --ui-set | --stingers | --chain-moments | --cat-emotes | --boss-layers | --mix-pass | --all]');
}

