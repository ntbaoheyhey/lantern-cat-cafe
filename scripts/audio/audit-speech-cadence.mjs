/** Preserve raw source-start cadence; charge/release are never grouped. */
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runtimeSignature} from './runtime-signature.mjs';

export function speechSummary(runtime, manifest) {
  const voices = runtime.hits.filter(h => h.result === 'played' && h.id.startsWith('voice.'));
  const intervals = voices.slice(1).map((h, i) => (h.at - voices[i].at) / 1000);
  assert(intervals.every(n => Number.isFinite(n) && n >= 0), 'Invalid source timestamps');
  const sorted = [...intervals].sort((a, b) => a - b);
  const cuts = [];
  for (let i = 0; i + 1 < voices.length; i++) {
    const voice = voices[i], layer = voice.layers?.[0];
    const take = manifest.cues[voice.id]?.find(s => s.variantId === layer?.variantId);
    assert(take && layer, 'Missing selected voice take: ' + voice.id);
    const expectedMs = take.duration / (layer.pitch || 1) * 1000;
    assert(Number.isFinite(expectedMs) && expectedMs > 0, 'Invalid source duration');
    const heardMs = voices[i + 1].at - voice.at;
    if (expectedMs > heardMs + 40) cuts.push({cue: voice.id, at: voice.at, expectedMs, heardMs});
  }
  const ultimate = id => /\.ult\.(charge|release)$/.test(id);
  const skill = id => id.includes('.skill.');
  return {
    starts: voices.length,
    medianSeconds: sorted[Math.floor(sorted.length / 2)] ?? null,
    intervalsSeconds: intervals,
    ultimateStarts: voices.filter(v => ultimate(v.id)).length,
    skillStarts: voices.filter(v => skill(v.id)).length,
    interruptedUltimate: cuts.filter(c => ultimate(c.cue)).length,
    interruptedSkill: cuts.filter(c => skill(c.cue)).length,
    cuts,
  };
}

export function speechGates(scenes) {
  const rows = [];
  for (const name of ['stage1', 'battle']) {
    const s = scenes[name];
    rows.push({id: `S4.${name}.raw-cadence`, value: s?.medianSeconds,
      pass: s?.starts >= 2 && s.medianSeconds >= 6 && s.medianSeconds <= 9,
      required: 'median of every actual voice-source interval: 6–9 seconds'});
  }
  for (const name of ['stage1', 'battle', 'boss']) {
    const s = scenes[name];
    rows.push({id: `S4.${name}.required-cuts`, value: s ? [s.interruptedUltimate, s.interruptedSkill] : null,
      pass: s?.ultimateStarts > 0 && s.interruptedUltimate === 0 &&
        (s.skillStarts > 0 ? s.interruptedSkill / s.skillStarts <= .05 : s.interruptedSkill === 0),
      required: '0 ultimate cuts; skill cut fraction <=5%'});
  }
  return rows;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [trial, cadencePath] = process.argv.slice(2);
  assert(/^[A-Za-z0-9-]+$/.test(trial ?? '') && cadencePath, 'Supply trial and stage-one cadence JSON');
  const base = 'reports/v3-shell/b2', out = `${base}/polish/S4/${trial}`;
  const read = path => JSON.parse(readFileSync(path));
  const sign = path => ({path, sha256: createHash('sha256').update(readFileSync(path)).digest('hex')});
  const signature = runtimeSignature(resolve(process.env.AUDIO_RUNTIME_ROOT || 'work/v3solo-integration'));
  const manifest = read('apps/web/public/audio/manifest.json');
  const metrics = {stage1: read(cadencePath), battle: read(`${base}/mix/${trial}-battle.json`),
    boss: read(`${base}/mix/${trial}-boss.json`)};
  const scenes = {};
  for (const [name, metric] of Object.entries(metrics)) {
    assert.deepEqual(metric.runtimeSources, signature, 'Current runtime differs: ' + name);
    assert.equal(metric.errors.length, 0, 'Browser error in ' + name);
    assert(!metric.diagnostic && metric.durationSeconds >= (name === 'boss' ? 120 : 180),
      'Full production capture required: ' + name);
    const receipt = metric.runtime ?? metric.log;
    assert.equal(sign(receipt.path).sha256, receipt.sha256, 'Modified runtime trace');
    scenes[name] = {...speechSummary(JSON.parse(gunzipSync(readFileSync(receipt.path))), manifest),
      durationSeconds: metric.durationSeconds, runtime: receipt};
  }
  const gates = speechGates(scenes);
  mkdirSync(out, {recursive: true});
  writeFileSync(`${out}/speech-audit.json`, JSON.stringify({at: new Date().toISOString(), trial,
    sources: signature, stage1: sign(cadencePath), scenes, gates,
    method: 'All actual voice-source starts, including separate charge/release; no phrase grouping. Cuts use selected sprite duration/pitch and the existing 40ms jitter tolerance. Capture-boundary truncation is not inferred from another source.'}, null, 2) + '\n');
  const lines = gates.map(g => `${g.pass ? 'PASS' : 'FAIL'} ${g.id}: measured=${JSON.stringify(g.value)}; required=${g.required}`);
  writeFileSync(`${out}/speech-gates.log`, lines.join('\n') + '\n');
  console.log(lines.join('\n'));
  process.exitCode = gates.every(g => g.pass) ? 0 : 1;
}
