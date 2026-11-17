#!/usr/bin/env node
/**
 * tools/v5audio/cut_ranged_and_voices.mjs
 * Slices 144 pre-baked ranged impact variants and 16 cat hit/death voice samples
 * from current per-element packs/manifest offsets with microsecond precision.
 * Output: .opus (WebM container, 48kHz mono) and .m4a (AAC fallback).
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
const VOICE_DIR = path.join(AUDIO_V5_DIR, 'voice');
const REPORTS_DIR = path.join(ROOT_DIR, 'reports/v5/AGS');

fs.mkdirSync(LEGACY_DIR, { recursive: true });
fs.mkdirSync(VOICE_DIR, { recursive: true });
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

function measureLoudness(filePath) {
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
    truePeakDb: peakMatch ? parseFloat(peakMatch[1]) : 0.0
  };
}

export function cutRangedVariants() {
  console.log('=== Cutting 144 Ranged Impact Variants from Per-Element Packs ===');
  const manifestPath = path.join(AUDIO_DIR, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const elements = ['ember', 'heavy', 'shadow', 'tide'];
  const cuts = [];
  const mappingEntries = {};
  let totalOpusBytes = 0;
  let totalM4aBytes = 0;

  for (const el of elements) {
    const designKey = `kit.ranged-${el}.impact`;
    const design = manifest.designs[designKey];
    if (!design || !design.baked) {
      throw new Error(`Design ${designKey} or baked array not found in manifest`);
    }

    const srcWebm = path.join(AUDIO_DIR, `v4-ranged-${el}.webm`);
    if (!fs.existsSync(srcWebm)) {
      throw new Error(`Source audio pack not found: ${srcWebm}`);
    }

    console.log(`Processing ${el}: ${design.baked.length} baked variants from ${path.basename(srcWebm)}...`);

    for (let idx = 0; idx < design.baked.length; idx++) {
      const bakedItem = design.baked[idx];
      const { start, duration, variantId, bus } = bakedItem.sample;

      // Extract safe filename e.g. ranged-ember-impact-0-0
      const safeName = variantId.replace(/\//g, '-').replace(/\./g, '-');
      const opusOut = path.join(LEGACY_DIR, `${safeName}.opus`);
      const m4aOut = path.join(LEGACY_DIR, `${safeName}.m4a`);

      // Slice opus (optimized 36k)
      runFfmpeg([
        '-i', srcWebm,
        '-ss', start.toString(),
        '-t', duration.toString(),
        '-c:a', 'libopus',
        '-b:a', '36k',
        '-ac', '1',
        '-f', 'webm',
        opusOut
      ]);

      // Slice m4a fallback (optimized 48k)
      runFfmpeg([
        '-i', srcWebm,
        '-ss', start.toString(),
        '-t', duration.toString(),
        '-c:a', 'aac',
        '-b:a', '48k',
        '-ac', '1',
        m4aOut
      ]);

      const opusStat = fs.statSync(opusOut);
      const m4aStat = fs.statSync(m4aOut);
      totalOpusBytes += opusStat.size;
      totalM4aBytes += m4aStat.size;

      const loudness = measureLoudness(opusOut);
      const probe = probeAudio(opusOut);

      const cutMeta = {
        element: el,
        variantId,
        safeName,
        pack: `v4-ranged-${el}`,
        start,
        duration,
        probedDuration: parseFloat(probe.format.duration),
        opusFile: `/audio/v5/legacy/${safeName}.opus`,
        m4aFile: `/audio/v5/legacy/${safeName}.m4a`,
        opusBytes: opusStat.size,
        m4aBytes: m4aStat.size,
        bus: bus || 'sfx',
        integratedLUFS: loudness.integratedLUFS,
        truePeakDbFS: loudness.truePeakDb,
        layers: bakedItem.layers || []
      };

      cuts.push(cutMeta);
      mappingEntries[variantId] = {
        opus: cutMeta.opusFile,
        m4a: cutMeta.m4aFile,
        durationSeconds: cutMeta.duration,
        bus: cutMeta.bus,
        variantId,
        element: el,
        layers: cutMeta.layers
      };
    }
  }

  console.log(`Finished cutting ${cuts.length} variants!`);
  console.log(`Total Opus: ${(totalOpusBytes / 1024).toFixed(1)} KB`);
  console.log(`Total M4A: ${(totalM4aBytes / 1024).toFixed(1)} KB`);
  console.log(`Total Combined: ${((totalOpusBytes + totalM4aBytes) / 1024).toFixed(1)} KB`);

  // Write reports/v5/AG4/RANGED-144-REPORT.csv
  const csvLines = [
    'variantId,element,start,duration,probedDuration,opusFile,opusBytes,m4aBytes,integratedLUFS,truePeakDbFS,bus'
  ];
  for (const c of cuts) {
    csvLines.push(`${c.variantId},${c.element},${c.start.toFixed(4)},${c.duration.toFixed(4)},${c.probedDuration.toFixed(4)},${c.opusFile},${c.opusBytes},${c.m4aBytes},${c.integratedLUFS.toFixed(1)},${c.truePeakDbFS.toFixed(1)},${c.bus}`);
  }
  const csvPath = path.join(REPORTS_DIR, 'RANGED-144-REPORT.csv');
  fs.writeFileSync(csvPath, csvLines.join('\n') + '\n', 'utf8');
  console.log(`Wrote report CSV: ${csvPath}`);

  // Write reports/v5/AG4/RANGED-144-MAPPING.json
  const mappingJsonPath = path.join(REPORTS_DIR, 'RANGED-144-MAPPING.json');
  fs.writeFileSync(mappingJsonPath, JSON.stringify({
    at: new Date().toISOString(),
    totalVariants: cuts.length,
    totalOpusBytes,
    totalM4aBytes,
    variants: mappingEntries
  }, null, 2) + '\n', 'utf8');
  console.log(`Wrote mapping JSON: ${mappingJsonPath}`);

  // Update reports/v5/AG4/U2-mapping.json as well for backward compatibility
  const u2Path = path.join(REPORTS_DIR, 'U2-mapping.json');
  fs.writeFileSync(u2Path, JSON.stringify({
    at: new Date().toISOString(),
    totalVariants: cuts.length,
    totalOpusBytes,
    totalM4aBytes,
    mapping: mappingEntries
  }, null, 2) + '\n', 'utf8');

  return { cuts, mappingEntries, totalOpusBytes, totalM4aBytes };
}

export function cutVoiceVariants() {
  console.log('=== Cutting Cat Voice Hit & Death Samples ===');
  const manifestPath = path.join(AUDIO_DIR, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const heroes = ['mochi', 'soot', 'clover', 'panko'];
  const phases = ['hit', 'death'];
  const cuts = [];
  const voiceMapping = {};
  let totalOpusBytes = 0;
  let totalM4aBytes = 0;

  for (const hero of heroes) {
    const srcWebm = path.join(AUDIO_DIR, `cat-${hero}.webm`);
    if (!fs.existsSync(srcWebm)) {
      throw new Error(`Cat pack not found: ${srcWebm}`);
    }

    // Find all voice cues in manifest for this hero
    const heroCueKeys = Object.keys(manifest.cues).filter(k => k.startsWith(`voice.${hero}.`));

    for (const cueKey of heroCueKeys) {
      const cueSamples = manifest.cues[cueKey];
      if (!cueSamples || !cueSamples.length) continue;

      const phase = cueKey.replace(`voice.${hero}.`, '');
      voiceMapping[cueKey] = [];

      for (let idx = 0; idx < cueSamples.length; idx++) {
        const sample = cueSamples[idx];
        const { start, duration, variantId, bus } = sample;

        // Clean filename e.g. mochi-hit-1-1
        const cleanName = variantId.replace(/\.flac$/i, '').replace(/\//g, '-');
        const opusOut = path.join(VOICE_DIR, `${cleanName}.opus`);
        const m4aOut = path.join(VOICE_DIR, `${cleanName}.m4a`);

        // Slice opus (optimized 36k)
        runFfmpeg([
          '-i', srcWebm,
          '-ss', start.toString(),
          '-t', duration.toString(),
          '-c:a', 'libopus',
          '-b:a', '36k',
          '-ac', '1',
          '-f', 'webm',
          opusOut
        ]);

        // Slice m4a (optimized 48k)
        runFfmpeg([
          '-i', srcWebm,
          '-ss', start.toString(),
          '-t', duration.toString(),
          '-c:a', 'aac',
          '-b:a', '48k',
          '-ac', '1',
          m4aOut
        ]);

        const opusStat = fs.statSync(opusOut);
        const m4aStat = fs.statSync(m4aOut);
        totalOpusBytes += opusStat.size;
        totalM4aBytes += m4aStat.size;

        const loudness = measureLoudness(opusOut);
        const probe = probeAudio(opusOut);

        const cutMeta = {
          hero,
          phase,
          cueKey,
          variantId,
          cleanName,
          start,
          duration,
          probedDuration: parseFloat(probe.format.duration),
          opusFile: `/audio/v5/voice/${cleanName}.opus`,
          m4aFile: `/audio/v5/voice/${cleanName}.m4a`,
          opusBytes: opusStat.size,
          m4aBytes: m4aStat.size,
          bus: bus || 'voice',
          integratedLUFS: loudness.integratedLUFS,
          truePeakDbFS: loudness.truePeakDb
        };

        cuts.push(cutMeta);

        const entry = {
          opus: cutMeta.opusFile,
          m4a: cutMeta.m4aFile,
          durationSeconds: cutMeta.duration,
          bus: cutMeta.bus,
          variantId,
          hero,
          phase
        };

        voiceMapping[cueKey].push(entry);
        // Also map directly by variantId
        voiceMapping[variantId] = entry;
      }
    }
  }

  console.log(`Finished cutting ${cuts.length} cat voice samples!`);
  console.log(`Total Opus: ${(totalOpusBytes / 1024).toFixed(1)} KB`);
  console.log(`Total M4A: ${(totalM4aBytes / 1024).toFixed(1)} KB`);
  console.log(`Total Combined: ${((totalOpusBytes + totalM4aBytes) / 1024).toFixed(1)} KB`);

  // Write reports/v5/AG4/VOICE-CUTS-REPORT.csv
  const csvLines = [
    'cueKey,variantId,hero,phase,start,duration,probedDuration,opusFile,opusBytes,m4aBytes,integratedLUFS,truePeakDbFS,bus'
  ];
  for (const c of cuts) {
    csvLines.push(`${c.cueKey},${c.variantId},${c.hero},${c.phase},${c.start.toFixed(4)},${c.duration.toFixed(4)},${c.probedDuration.toFixed(4)},${c.opusFile},${c.opusBytes},${c.m4aBytes},${c.integratedLUFS.toFixed(1)},${c.truePeakDbFS.toFixed(1)},${c.bus}`);
  }
  const csvPath = path.join(REPORTS_DIR, 'VOICE-CUTS-REPORT.csv');
  fs.writeFileSync(csvPath, csvLines.join('\n') + '\n', 'utf8');
  console.log(`Wrote voice CSV: ${csvPath}`);

  // Write reports/v5/AG4/VOICE-CUTS-MAPPING.json
  const mappingJsonPath = path.join(REPORTS_DIR, 'VOICE-CUTS-MAPPING.json');
  fs.writeFileSync(mappingJsonPath, JSON.stringify({
    at: new Date().toISOString(),
    totalSamples: cuts.length,
    totalOpusBytes,
    totalM4aBytes,
    cues: voiceMapping
  }, null, 2) + '\n', 'utf8');
  console.log(`Wrote voice mapping JSON: ${mappingJsonPath}`);

  return { cuts, voiceMapping, totalOpusBytes, totalM4aBytes };
}

export function updateV5Manifest(rangedMapping, voiceMapping) {
  console.log('=== Updating apps/web/public/audio/v5/manifest.json ===');
  const v5ManifestPath = path.join(AUDIO_V5_DIR, 'manifest.json');
  let manifest = {};
  if (fs.existsSync(v5ManifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(v5ManifestPath, 'utf8'));
    } catch (e) {
      manifest = {};
    }
  }

  // 1. Sanitize hero aliases to remove any colliding "kit.ranged-*" entries
  for (const [key, value] of Object.entries(manifest)) {
    if (value && Array.isArray(value.aliases)) {
      value.aliases = value.aliases.filter(alias => !alias.startsWith('kit.ranged-'));
    }
  }

  // 2. Remove any top-level key that is "kit.ranged-*.impact" as a single file mapping
  for (const key of Object.keys(manifest)) {
    if (key.startsWith('kit.ranged-')) {
      delete manifest[key];
    }
  }

  // 3. Add all 144 ranged variants under their exact variantId
  for (const [variantId, item] of Object.entries(rangedMapping)) {
    manifest[variantId] = item;
  }

  // 4. Add all voice mappings
  for (const [key, item] of Object.entries(voiceMapping)) {
    manifest[key] = item;
  }

  fs.writeFileSync(v5ManifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`Updated manifest with ${Object.keys(manifest).length} total keys.`);
}

// Main execution
const arg = process.argv[2];
if (arg === '--voices-only') {
  const voice = cutVoiceVariants();
  updateV5Manifest({}, voice.voiceMapping);
  console.log('=== Voice cuts and manifest updates completed successfully! ===');
} else if (arg === '--ranged-only') {
  const ranged = cutRangedVariants();
  updateV5Manifest(ranged.mappingEntries, {});
  console.log('=== Ranged cuts and manifest updates completed successfully! ===');
} else {
  const ranged = cutRangedVariants();
  const voice = cutVoiceVariants();
  updateV5Manifest(ranged.mappingEntries, voice.voiceMapping);
  console.log('=== All cuts and manifest updates completed successfully! ===');
}
