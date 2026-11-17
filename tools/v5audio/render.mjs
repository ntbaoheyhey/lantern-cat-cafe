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
 * Includes iterative loudness calibration to meet strict game audio targets.
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
  limiterLinear = 0.78, // ~ -2.1 dBFS to guarantee decoded true peak <= -1.0 dBTP
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

  // Calibrate gain in up to 3 passes
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

  // Render AAC / M4A fallback
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
  // 1. Mochi: soft cloth whoosh + plush thud
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

  // 2. Soot: crackle + ember pop
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

  // 3. Clover: airy chime + leaf rustle (heal)
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

  // 4. Panko: crunchy toast crack + butter squish
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

  // Write U1-loudness.csv
  const csvLines = [
    'cueId,name,opusPath,sizeBytes,durationSec,integratedLUFS,truePeakDbFS,impactOffsetMs'
  ];
  for (const r of results) {
    csvLines.push(`${r.cueId},${r.name},${r.opusPath},${r.sizeBytes},${r.duration.toFixed(3)},${r.integratedLUFS.toFixed(1)},${r.truePeakDb.toFixed(1)},${r.impactOffsetMs}`);
  }
  const csvPath = path.join(REPORTS_DIR, 'U1-loudness.csv');
  fs.writeFileSync(csvPath, csvLines.join('\n') + '\n', 'utf8');
  console.log(`Wrote loudness report: ${csvPath}`);

  // Update or create manifest.json
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

  // Calculate loudness variance
  const lufsValues = results.map(r => r.integratedLUFS);
  const minLufs = Math.min(...lufsValues);
  const maxLufs = Math.max(...lufsValues);
  const avgLufs = lufsValues.reduce((a, b) => a + b, 0) / lufsValues.length;
  const spread = maxLufs - minLufs;

  console.log(`Loudness spread: min=${minLufs.toFixed(1)}, max=${maxLufs.toFixed(1)}, avg=${avgLufs.toFixed(1)}, spread=${spread.toFixed(1)} LU`);
  if (spread > 4.0) {
    console.warn(`WARNING: Loudness spread ${spread.toFixed(1)} exceeds +/- 2 LU tolerance! Adjust gains.`);
  }

  return { results, spread, avgLufs };
}

// CLI dispatcher
const arg = process.argv[2];
if (arg === '--calibrate') {
  renderCalibration();
} else if (arg === '--hero-skills') {
  renderHeroSkills();
} else if (arg === '--help' || !arg) {
  console.log('Usage: node tools/v5audio/render.mjs [--calibrate | --hero-skills | --split-ranged | --enemy-ui | --all]');
}
