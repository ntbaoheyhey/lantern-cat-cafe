/** Verify the complete preparation-inclusive series; never infer native acceptance. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {root} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';

const out = resolve(root, 'work/v5/CXV/films/V7-F-shader-preparation-production');
const seriesBytes = await readFile(resolve(out, 'series.json'));
const series = JSON.parse(seriesBytes);
assert(series.pass && series.runs.length === 6, 'Retain incomplete series; summarize only after completion');
assert.deepEqual(series.order, ['baseline', 'compile', 'compile', 'baseline', 'baseline', 'compile']);
const manifest = await readFile(series.buildManifest.path);
assert.equal(hash(manifest), series.buildManifest.sha256);
const built = JSON.parse(manifest), artifact = built.artifacts.find(a => a.mode === 'native');
assert.equal(built.source, series.source);
assert.equal(built.runtimePatchSha256, hash(''));
assert.equal(artifact.transformed, 0);
assert.equal(artifact.indexSha256, series.indexSha256);
for (const f of artifact.files) {
  const bytes = await readFile(resolve(artifact.dist, f.path));
  assert.equal(bytes.length, f.bytes); assert.equal(hash(bytes), f.sha256);
}
for (const snap of series.snapshots) {
  assert.equal(hash(await readFile(resolve(out, snap.name))), snap.sha256);
  assert.equal(hash(await readFile(resolve(root, 'tools/v5vfx', snap.name))), snap.sha256, 'Live tool changed during trials');
}
const median = values => { const a = [...values].sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
const sum = values => values.reduce((a, b) => a + b, 0);
const callsSummary = calls => Object.fromEntries([...new Set(calls.map(c => c.name))].map(name => {
  const rows = calls.filter(c => c.name === name);
  return [name, {count: rows.length, elapsedMs: sum(rows.map(c => c.elapsedMs)), maxMs: Math.max(0, ...rows.map(c => c.elapsedMs))}];
}));
const behavior = r => ({initial: r.initial, final: r.final, plans: r.plans.map(({wallMs, ...rest}) => rest)});
const trials = [], captures = [], reviews = [];
let expectedBehavior;
for (const row of series.runs) {
  assert.equal(row.index, trials.length / 2); assert.equal(row.mode, series.order[row.index]);
  const bytes = await readFile(row.raw); assert.equal(hash(bytes), row.sha256);
  const d = JSON.parse(bytes);
  assert(d.pass && d.localProduction && d.focusProfile && d.layoutProfile);
  for (const key of ['hudMode', 'pendingBatch', 'facePrototype', 'outerPrototype', 'numberMetricsMode', 'labelSearchMode', 'cloverLeafMode', 'drawingResetMode', 'offlineNumberMode', 'transparentWorkPrototype']) assert(!d[key], key);
  assert.equal(d.shaderPreparationMode, row.mode); assert.deepEqual(d.errors, []);
  assert.deepEqual(d.viewport, {width:1280, height:720}); assert.deepEqual(d.runs.map(r => r.rate), [1, 4]);
  assert.equal(d.url, 'http://127.0.0.1:6312/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3');
  for (const r of d.runs) {
    assert.deepEqual(r.identity, r.identityAfter); assert.equal(r.identity.buildSource, series.source);
    assert.equal(r.identity.indexSha256, series.indexSha256); assert.equal(r.identity.artifactMode, 'native');
    assert.equal(r.identity.buildManifestSha256, series.buildManifest.sha256);
    assert.equal(r.identity.buildRuntimePatchSha256, hash(''));
    assert.equal(r.identity.harnessSha256, series.snapshots.find(s => s.name === 'production-candidate-fixture.mjs').sha256);
    assert.deepEqual(r.blockedRequests, []);
    assert(r.shaderPreparation.stateExact && r.shaderPreparation.checksEnabled && r.shaderPlay.checksEnabled);
    assert.equal(r.shaderPreparation.active, row.mode === 'compile');
    assert(r.shaderPlay.calls.every(c => !([0x8B81, 0x8B82].includes(c.parameter) && c.result === false)));
    assert(r.shaderPlay.calls.every(c => !c.name.endsWith('InfoLog') || c.result.length === 0));
    expectedBehavior ??= behavior(r); assert.deepEqual(behavior(r), expectedBehavior, 'Rule-selected behavior differs');
    const phases = Object.fromEntries(['preparation', 'play'].map(phase => [phase, callsSummary(r.shaderPlay.calls.filter(c => c.phase === phase))]));
    const trial = {index:row.index, mode:row.mode, rate:r.rate, utc:d.utc, ended:d.ended, url:d.url, raw:row.raw, rawSha256:row.sha256, identity:r.identity,
      elapsedMs:r.elapsedMs, preparation:r.shaderPreparation, programsAfterPlay:r.shaderPlay.programsAfter, shaderCalls:phases,
      preparationPlusPlayTaskMs:r.layout.TaskDuration * 1000 + r.shaderPreparation.taskElapsedMs, playTaskMs:r.layout.TaskDuration * 1000,
      layout:r.layout, firstRenderLatencyMs:r.firstRenderLatencyMs, startup:r.startup, wholeRun:r.wholeRun,
      steady:{startMs:r.steadyWindowStartMs, samples:r.samples, frameMs:r.frameMs, submitCpuMs:r.submitCpuMs, over33:r.over33, over50:r.over50},
      focusEntryCpuMs:r.focusEntryCpuMs, focusEntryRenderCpuMs:r.focusEntryRenderCpuMs, focusEntries:r.focusEntries,
      actions:r.plans.filter(p => p.kind === 'action').length, ultimates:r.plans.filter(p => p.ultimate).length, exactBehavior:true, checksEnabled:true, errors:[], blockedRequests:[]};
    trials.push(trial);
    const path = resolve(out, row.index+'-'+row.mode, 'boss-'+r.rate+'x.png'), png = await readFile(path);
    assert.equal(png.readUInt32BE(16), 1280); assert.equal(png.readUInt32BE(20), 720);
    const rgb = execFileSync('ffmpeg', ['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'], {maxBuffer:4*1024*1024});
    const mean = sum(rgb)/rgb.length;
    let squares = 0; for (const value of rgb) squares += (value - mean) ** 2;
    const measuredStdDev = Math.sqrt(squares / rgb.length); assert(measuredStdDev > 10);
    captures.push({index:row.index, mode:row.mode, rate:r.rate, path, width:1280, height:720, sha256:hash(png), rgbSha256:hash(rgb), mean, stdDev:measuredStdDev});
    if (row.index < 2) {
      const review = resolve(out, row.index+'-'+row.mode+'-'+r.rate+'x-review.jpg');
      if (!existsSync(review)) execFileSync('ffmpeg', ['-v','error','-i',path,'-vf','scale=1024:576','-frames:v','1','-q:v','3',review]);
      reviews.push({path:review, width:1024, height:576, sha256:hash(await readFile(review))});
    }
  }
}
const summary = [];
for (const rate of [1,4]) for (const mode of ['baseline','compile']) {
  const rows = trials.filter(r => r.rate === rate && r.mode === mode), get = fn => median(rows.map(fn)); assert.equal(rows.length, 3);
  summary.push({rate, mode, trials:rows.length,
    preparationCallMs:get(r => r.preparation.callMs), preparationWallMs:get(r => r.preparation.elapsedMs), preparationTaskMs:get(r => r.preparation.taskElapsedMs),
    preparationPlusPlayTaskMs:get(r => r.preparationPlusPlayTaskMs), playTaskMs:get(r => r.playTaskMs), programsAdded:get(r => r.preparation.programsAfter-r.preparation.programsBefore), programsAfterPlay:get(r => r.programsAfterPlay),
    playProgramLogMs:get(r => r.shaderCalls.play.getProgramInfoLog?.elapsedMs ?? 0), playProgramLogCount:get(r => r.shaderCalls.play.getProgramInfoLog?.count ?? 0),
    startupFrameP95Ms:get(r => r.startup.frameMs.p95), startupFrameMaxMs:get(r => r.startup.frameMs.max), startupSubmitMaxMs:get(r => r.startup.submitCpuMs.max), startupOver50:get(r => r.startup.over50),
    wholeFrameP95Ms:get(r => r.wholeRun.frameMs.p95), wholeOver50:get(r => r.wholeRun.over50), steadyFrameP95Ms:get(r => r.steady.frameMs.p95), steadyOver50:get(r => r.steady.over50),
    submitMedianMs:get(r => r.steady.submitCpuMs.median), focusMedianMs:get(r => r.focusEntryCpuMs.median), focusRenderMedianMs:get(r => r.focusEntryRenderCpuMs.median)});
}
const report = {utc:new Date().toISOString(), source:series.source, runtimePatchSha256:series.runtimePatchSha256, indexSha256:series.indexSha256,
  method:'Six sequential alternating trials; one native unchanged production artifact; actual seeded boss rule-selected play at speed1 for32s/rate. compileAsync is invoked only by the harness while paused before play. Both modes retain shader diagnostics and wrappers. 1x/4x CPU;4x is a stress proxy. Three-trial group medians.',
  limits:'TaskDuration is main-thread elapsed task time, not exclusive CPU or GPU completion. Preparation and play windows include protocol overhead; fixture loading is outside both. Frame headline excludes first2000ms; startup and whole-run tails retained. Screenshots after measurement. No independent judge acceptance or native proposal.',
  series:{path:resolve(out,'series.json'),sha256:hash(seriesBytes),utc:series.utc,ended:series.ended,order:series.order}, buildManifest:series.buildManifest,
  artifactFilesVerified:artifact.files.length, verifiedToolSnapshots:series.snapshots, behavior:expectedBehavior,
  summary,trials,captures,reviews,reviewedUtc:null,interpretation:null,pass:true};
const path = resolve(root, 'reports/v5/CXV/V7-F-shader-preparation-production.json');
assert(!existsSync(path), 'Do not replace a reviewed report');
await writeFile(path, JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({path,pass:report.pass,captures:captures.length,summary}));
