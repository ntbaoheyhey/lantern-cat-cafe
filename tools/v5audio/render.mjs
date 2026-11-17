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
const REPORTS_DIR = path.join(ROOT_DIR, 'reports/v5/AG4');

fs.mkdirSync(AUDIO_V5_DIR, { recursive: true });
fs.mkdirSync(LEGACY_DIR, { recursive: true });
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

  for (let pass = 0; pass < 3; pass++) {
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
      '-b:a', '48k',
      '-ac', '1',
      '-f', 'webm',
      opusPath
    ]);

    finalLoudness = measureLoudness(opusPath);
    if (!targetLufs) break;

    const diff = targetLufs - finalLoudness.integratedLUFS;
    if (Math.abs(diff) <= 0.6 && finalLoudness.truePeakDb <= -1.0) {
      break;
    }
    const factor = Math.pow(10, diff / 20);
    currentGain = Math.max(0.1, currentGain * factor);
  }

  runFfmpeg([
    '-i', opusPath,
    '-c:a', 'aac',
    '-b:a', '64k',
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
    impactOffsetMs: 55,
    durationSec: 0.42,
    transientFilter: "anoisesrc=c=pink:r=48000:d=0.04,bandpass=f=1200:w=800,afade=t=out:st=0:d=0.04,volume=0.9",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.9*sin(2*PI*(95-40*(t/0.12))*t)*exp(-t/0.045)':s=48000:d=0.12",
    bodyDelayMs: 15,
    tailFilter: "anoisesrc=c=brown:r=48000:d=0.25,lowpass=f=450,volume=0.32,afade=t=out:st=0.02:d=0.23",
    tailDelayMs: 30,
    masterGain: 2.85,
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
    durationSec: 0.36,
    transientFilter: "aevalsrc=exprs='0.9*sin(2*PI*(4000-1800*(t/0.008))*t)*exp(-t/0.002)':s=48000:d=0.008",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.92*sin(2*PI*(150-65*(t/0.08))*t)*exp(-t/0.025)':s=48000:d=0.08",
    bodyDelayMs: 5,
    tailFilter: "anoisesrc=c=white:r=48000:d=0.24,highpass=f=2200,volume=0.28,afade=t=out:st=0.01:d=0.23",
    tailDelayMs: 10,
    masterGain: 1.63,
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
    durationSec: 0.44,
    transientFilter: "aevalsrc=exprs='0.8*(sin(2*PI*1760*t)+0.5*sin(2*PI*2640*t)+0.3*sin(2*PI*3520*t))*exp(-t/0.06)':s=48000:d=0.15",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.75*sin(2*PI*(210-40*(t/0.12))*t)*exp(-t/0.04)':s=48000:d=0.12",
    bodyDelayMs: 10,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.30,bandpass=f=2200:w=1100,volume=0.25,afade=t=out:st=0.03:d=0.27",
    tailDelayMs: 20,
    masterGain: 1.35,
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
    durationSec: 0.38,
    transientFilter: "anoisesrc=c=white:r=48000:d=0.015,highpass=f=3000,volume=0.85,afade=t=out:st=0:d=0.015",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.92*sin(2*PI*(120-60*(t/0.09))*t)*exp(-t/0.03)':s=48000:d=0.09",
    bodyDelayMs: 8,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.24,bandpass=f=2600:w=1400,volume=0.25,afade=t=out:st=0.02:d=0.22",
    tailDelayMs: 15,
    masterGain: 1.91,
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
    durationSec: 0.28,
    transientFilter: "anoisesrc=c=white:r=48000:d=0.012,highpass=f=2800,volume=0.8,afade=t=out:st=0:d=0.012",
    transientDelayMs: 0,
    bodyFilter: "aevalsrc=exprs='0.85*sin(2*PI*(160-70*(t/0.06))*t)*exp(-t/0.02)':s=48000:d=0.06",
    bodyDelayMs: 6,
    tailFilter: "anoisesrc=c=pink:r=48000:d=0.18,lowpass=f=800,volume=0.22,afade=t=out:st=0.02:d=0.16",
    tailDelayMs: 12,
    masterGain: 1.35,
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
} else if (arg === '--all') {
  renderCalibration();
  renderHeroSkills();
  splitRangedImpacts();
  renderEnemyAndUi();
} else if (arg === '--help' || !arg) {
  console.log('Usage: node tools/v5audio/render.mjs [--calibrate | --hero-skills | --split-ranged | --enemy-ui | --all]');
}
