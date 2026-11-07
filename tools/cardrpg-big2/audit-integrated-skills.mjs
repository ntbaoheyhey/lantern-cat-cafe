// REFERENCE: skill-measure.mjs; integration/accepted-source.json.
// Recompute every summary from the original RAF arrays before publishing gates.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const out = 'reports/cardrpg-big2/integration';
const directory = `${out}/skills`;
const json = async path => JSON.parse(await readFile(path, 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const accepted = await json(`${out}/accepted-source.json`);
const receipt = await json(`${directory}/summary.json`);
const ranked = await json(`${directory}/ranked.json`);
assert.equal(receipt.sha256, accepted.sha256);
assert.equal(hash(await readFile(accepted.artifact)), accepted.sha256);
assert.equal(ranked.complete, true);
assert.equal(receipt.selection.scope, 'full roster');
assert.equal(receipt.actions.length, 86);
assert.equal(receipt.fullGalleryActions.length, 86);
assert.equal(receipt.rows.length, 860);
assert.equal(new Set(receipt.actions.map(action => action.owner)).size, 25);
assert.equal(new Set(receipt.rows.map(row => row.name)).size, 860);
assert.deepEqual(ranked.errors, []);

function stats(frames) {
  const times = frames.map(frame => frame.ms).sort((a, b) => a - b);
  assert(times.length > 0 && times.every(ms => Number.isFinite(ms) && ms > 0));
  return { frames: times.length, max: times.at(-1), p95: times[Math.floor(times.length * .95)],
    above25: times.filter(ms => ms > 25).length, above50: times.filter(ms => ms > 50).length,
    within20: times.filter(ms => ms <= 20).length / times.length };
}
function compare(actual, expected, label) {
  for (const [key, value] of Object.entries(actual)) {
    assert(Number.isFinite(expected[key]), `${label}.${key} must be recorded`);
    assert(Math.abs(value - expected[key]) < 1e-7, `${label}.${key}: ${value} != ${expected[key]}`);
  }
}
const proof = [], units = new Map();
let frames = 0, castFrames = 0, peakCalls = 0, peakTriangles = 0;
for (const row of receipt.rows) {
  const bytes = await readFile(`${directory}/${row.name}.json`), raw = JSON.parse(bytes);
  assert.deepEqual(raw.action, row.action);
  assert.deepEqual(raw.errors, []);
  assert.equal(raw.casts.length, 2);
  assert(raw.firstInteractiveAt > 0 && raw.sceneReadyAt > raw.firstInteractiveAt);
  compare(stats(raw.frames), row.pageOpen, `${row.name}.page`);
  compare(stats(raw.frames.filter(f => f.at - f.ms >= raw.firstInteractiveAt)), row.postInteractive, `${row.name}.interactive`);
  compare(stats(raw.frames.filter(f => f.at - f.ms >= raw.sceneReadyAt)), row.postReady, `${row.name}.ready`);
  assert.deepEqual(raw.casts.map(cast => cast.use), ['first', 'repeat']);
  for (const cast of raw.casts) {
    const window = raw.frames.filter(frame => frame.at >= cast.before.at && frame.at <= cast.after.at);
    const computed = stats(window);
    compare(computed, cast.summary, `${row.name}.${cast.use}`);
    assert.deepEqual(cast, row.casts.find(candidate => candidate.use === cast.use));
    assert.equal(cast.summary.calls, Math.max(...window.map(frame => frame.calls ?? 0)));
    assert.equal(cast.summary.triangles, Math.max(...window.map(frame => frame.triangles ?? 0)));
    castFrames += computed.frames;
  }
  peakCalls = Math.max(peakCalls, ...raw.frames.map(frame => frame.calls ?? 0));
  peakTriangles = Math.max(peakTriangles, ...raw.frames.map(frame => frame.triangles ?? 0));
  frames += raw.frames.length;
  proof.push({ name: row.name, sha256: hash(bytes), frames: raw.frames.length });
  if (!units.has(row.action.owner)) units.set(row.action.owner, []);
  units.get(row.action.owner).push(row);
}
const max = values => Math.max(...values);
const cpu4 = receipt.rows.filter(row => row.cpu === 4);
const metrics = {
  pageNativeMax: max(receipt.rows.filter(row => row.cpu === 1).map(row => row.pageOpen.max)),
  pageCpu4Max: max(cpu4.map(row => row.pageOpen.max)),
  postInteractiveMax: max(receipt.rows.map(row => row.postInteractive.max)),
  postReadyMax: max(receipt.rows.map(row => row.postReady.max)),
  cpu4WorstP95: max(cpu4.map(row => row.pageOpen.p95)),
  firstMax: max(receipt.rows.map(row => row.casts[0].summary.max)),
  repeatMax: max(receipt.rows.map(row => row.casts[1].summary.max)),
  minimumConfigurationWithin20: Math.min(...ranked.configurations.flatMap(row => [row.first.within20, row.repeat.within20])),
  minimumIndividualCastWithin20: Math.min(...receipt.rows.flatMap(row => row.casts.map(cast => cast.summary.within20))),
  peakCalls, peakTriangles,
};
const le = (value, limit) => value <= limit + 1e-6; // floating-point noise only; never round a miss down.
const gates = {
  wholePage100: le(Math.max(metrics.pageNativeMax, metrics.pageCpu4Max), 100),
  postInteractive100: le(metrics.postInteractiveMax, 100),
  cpu4P95_33: le(metrics.cpu4WorstP95, 33),
  cast50: le(Math.max(metrics.firstMax, metrics.repeatMax), 50),
  cast99PercentWithin20: metrics.minimumConfigurationWithin20 >= .99,
  draw250: metrics.peakCalls <= 250, triangle150000: metrics.peakTriangles <= 150000,
};
const unitRows = [...units].map(([owner, rows]) => ({ owner, cases: rows.length,
  actions: new Set(rows.map(row => row.action.id)).size,
  pageMax: max(rows.map(row => row.pageOpen.max)),
  postInteractiveMax: max(rows.map(row => row.postInteractive.max)),
  firstMax: max(rows.map(row => row.casts[0].summary.max)),
  repeatMax: max(rows.map(row => row.casts[1].summary.max)),
  calls: max(rows.flatMap(row => row.casts.map(cast => cast.summary.calls))),
  triangles: max(rows.flatMap(row => row.casts.map(cast => cast.summary.triangles))),
}));
assert(unitRows.every(row => row.cases === row.actions * 10));
const result = { recordedAt: new Date().toISOString(), sha256: accepted.sha256,
  summarySha256: hash(await readFile(`${directory}/summary.json`)),
  method: 'All 860 raw frame arrays independently recomputed and compared to their page/interactive/ready/first/repeat summaries. The original arrays are immutable. Gate failures are reported as failures, independent of successful evidence collection.',
  cases: proof.length, casts: proof.length * 2, frames, castFrames, metrics, gates, units: unitRows, files: proof };
await writeFile(`${directory}/raw-audit.json`, JSON.stringify(result, null, 2));
const n = value => value.toFixed(1);
await writeFile(`${out}/PERFORMANCE.md`, `# Accepted integrated performance evidence
REFERENCE: accepted-source.json; skills/summary.json; skills/raw-audit.json; skills/ranked.json; skills/profiles

Main HTML SHA256 \`${accepted.sha256}\`. All 25 units / 86 actions × 10 configurations = 860 fresh-page cases and 1,720 first/repeat casts. Independently recomputed ${frames.toLocaleString('en-US')} page frames and ${castFrames.toLocaleString('en-US')} cast frames from the original arrays. Zero runtime errors. The seven-case cold trace, loading screenshots, lifecycle and audio runs are separate observations.

| Gate | Observed | Result |
|---|---:|---|
| Whole page MAX ≤100 ms | Native ${n(metrics.pageNativeMax)} / CPU4 ${n(metrics.pageCpu4Max)} ms | ${gates.wholePage100 ? 'PASS' : 'MISS'} |
| After first interactive MAX ≤100 ms | ${n(metrics.postInteractiveMax)} ms | ${gates.postInteractive100 ? 'PASS' : 'MISS'} |
| CPU4 worst-case p95 ≤33 ms | ${n(metrics.cpu4WorstP95)} ms | ${gates.cpu4P95_33 ? 'PASS' : 'MISS'} |
| First / repeat cast MAX ≤50 ms | ${n(metrics.firstMax)} / ${n(metrics.repeatMax)} ms | ${gates.cast50 ? 'PASS' : 'MISS'} |
| ≥99% cast frames ≤20 ms, per configuration/use | ${(metrics.minimumConfigurationWithin20 * 100).toFixed(4)}% minimum | ${gates.cast99PercentWithin20 ? 'PASS' : 'MISS'} |
| Draw calls ≤250 / triangles ≤150,000 | ${peakCalls} / ${peakTriangles} | ${gates.draw250 && gates.triangle150000 ? 'PASS' : 'MISS'} |

Worst individual cast has ${(metrics.minimumIndividualCastWithin20 * 100).toFixed(4)}% of frames ≤20 ms; this stricter diagnostic is retained separately from the inherited per-configuration aggregation. After scene ready, MAX is ${n(metrics.postReadyMax)} ms. CPU throttle affects CPU only. These measurements do not establish subjective art quality or unlimited-session memory stability.

## Per-unit hitch table
REFERENCE: skills/README.md; skills/raw-audit.json; skills/*.json

| Unit | Actions / cases | Page MAX | After interactive MAX | First / repeat MAX | Cast calls / triangles |
|---|---:|---:|---:|---:|---:|
${unitRows.map(row => `| ${row.owner} | ${row.actions} / ${row.cases} | ${n(row.pageMax)} | ${n(row.postInteractiveMax)} | ${n(row.firstMax)} / ${n(row.repeatMax)} | ${row.calls} / ${row.triangles} |`).join('\n')}

Every time above is in milliseconds. All ten configuration tables and links to the 860 raw arrays remain in [skills/README.md](skills/README.md). Separate profiling reruns are under [skills/profiles](skills/profiles); they do not replace the measured maxima.
`);
console.log(JSON.stringify({ cases: result.cases, frames, castFrames, metrics, gates }));
