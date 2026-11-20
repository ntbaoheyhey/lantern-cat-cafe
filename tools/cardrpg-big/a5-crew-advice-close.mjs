// REFERENCE: PROMPT-A5 E1. Close only the owned-cat recommendation change, preserving all earlier misses.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const root = 'reports/cardrpg-big/a5/e1-crew-advice';
const pilot = 'reports/cardrpg-big/a5/e1/crew-advice-28';
const sha = b => createHash('sha256').update(b).digest('hex');
const receipts = [];
async function read(path) {
  const bytes = await readFile(path); receipts.push({ path, sha256: sha(bytes) }); return JSON.parse(bytes);
}
const gates = await read(root + '/gates/checks.json'), source = gates[0].head;
for (const name of ['typecheck', 'lint', 'web-unit', 'rules', 'e2e', 'build']) {
  const row = gates.findLast(r => r.name === name);
  assert.equal(row?.code, 0, name); assert.equal(row.head, source); assert.equal(row.scope, 'complete');
}
for (const row of gates) assert.equal(sha(await readFile(row.log)), row.sha256, row.log);
execFileSync('git', ['merge-base', '--is-ancestor', source, 'HEAD']);
assert.equal(execFileSync('git', ['diff', '--name-only', source, '--', 'apps', 'packages',
  'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'], { encoding: 'utf8' }).trim(), '');
const registration = await read(pilot + '/REGISTERED-METHOD.json');
for (const [path, hash] of Object.entries(registration.combatSource)) assert.equal(sha(await readFile(path)), hash, path);
const day = await read(pilot + '/day7-checks/checks.json'), paired = await read(pilot + '/day7-paired.json');
assert.equal(day.accounts.length, 90); assert(Object.values(day.gates).every(Boolean));
for (const key of ['firstEncountersExact', 'firstChoicesExact', 'firstStateHashesExact', 'withoutAdviceExact'])
  assert.equal(paired.totals[key], 90, key);
assert.equal(paired.totals.firstTwoWorsened, 0);
for (const row of paired.receipts) assert.equal(sha(await readFile(row.path)), row.sha256, row.path);
const swaps = day.accounts.filter(a => a.advice?.change.kind === 'cat');
assert(swaps.length > 0);
for (const a of swaps) {
  assert.deepEqual(a.advice.cost, {}); assert.deepEqual(a.appliedCurrencies.before, a.appliedCurrencies.after);
}
const off = await read(root + '/off/checks.json');
assert.deepEqual(off, { offBehavior: 'PASS', sha256: '47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3', cells: 165, routes: 8250 });
for (const [path, hash] of Object.entries(await read(root + '/off/source.json'))) assert.equal(sha(await readFile(path)), hash, path);
const artifactRoot = '/tmp/cardrpg-a5-crew-advice-28/artifact';
const build = await read(artifactRoot + '/build.json'), artifact = await readFile(artifactRoot + '/index.html');
assert.equal(sha(artifact), build.sha256);
for (const [path, hash] of Object.entries(build.sourceHashes))
  if (/^(apps|packages|assets)\//.test(path)) assert.equal(sha(await readFile(path)), hash, path);
await mkdir(root + '/build', { recursive: true });
await writeFile(root + '/build/manifest.json', JSON.stringify(build, null, 2) + '\n');
receipts.push({ path: root + '/build/manifest.json', sha256: sha(await readFile(root + '/build/manifest.json')) });
const fixture = await read(pilot + '/browser-fixture.json');
const selected = swaps.find(a => a.style === fixture.style && a.index === fixture.index);
assert(selected); assert.deepEqual(selected.advice, fixture.advice);
assert.equal(selected.first.stateHash, fixture.lossStateHash);
const ui = await read(pilot + '/ui-checks.json'), browsers = [], captures = [];
for (const row of ui) assert.equal(sha(await readFile(row.log)), row.sha256, row.log);
for (const look of ['baseline', 'look']) for (const width of [1280, 1440, 1024]) {
  const row = ui.findLast(r => r.name === `${look}-${width}`); assert.equal(row?.code, 0);
  const browser = await read(`${pilot}/browser-${look}-${width}-attempt-${row.attempt}/checks.json`);
  assert.equal(browser.passed, true); assert.equal(browser.width, width); assert.equal(browser.look, look);
  assert.equal(browser.sha256, build.sha256); assert.deepEqual(browser.errors, []); assert.deepEqual(browser.remote, []);
  assert.deepEqual(browser.beforeTeam, fixture.beforeTeam); assert.deepEqual(browser.afterTeam, fixture.afterTeam);
  assert.equal(browser.checks.length, 2); assert.equal(browser.captures.length, 2);
  for (const capture of browser.captures) {
    assert.equal(capture.overflow, 0); assert(capture.contrast.length > 0);
    assert(capture.contrast.every(c => c.ratio >= 4.5));
    captures.push({ ...capture, width, look, sha256: sha(await readFile(capture.path)) });
  }
  browsers.push({ width, look, checks: browser.checks, workerWaitMs: browser.workerWaitMs });
}
const scope = JSON.parse(execFileSync(process.execPath, ['tools/cardrpg-big/a5-scope.mjs'], { encoding: 'utf8' }));
assert.equal(scope.scope, 'PASS'); assert.equal(scope.baseline, 'PASS'); assert.equal(scope.historicalSimFiles, 13);
const report = { status: 'PASS for the owned-reserve advice phase; A5 acceptance remains open', source, gates, off,
  artifact: { path: artifactRoot + '/index.html', sha256: build.sha256, bytes: artifact.length },
  paired: paired.totals, cohorts: day.cohorts, progressionGates: day.gates, ownedCatSuggestions: swaps.length,
  fixture: { style: fixture.style, index: fixture.index, label: fixture.advice.label }, browsers, captures,
  minimumScopedContrast: Math.min(...captures.flatMap(c => c.contrast.map(x => x.ratio))),
  scope: { scope: scope.scope, baseline: scope.baseline, historicalSimFiles: scope.historicalSimFiles }, receipts,
  limitations: ['Previously earned 90 day7 saves, not a fresh 45-day cohort or acceptance block.',
    'One heavy account still loses with advice while the no-advice retry wins; forecasts are not guarantees.',
    'Targeted apply/prepare clicks at three widths in both looks, not a full screenshot pack or new timed x1 journey.',
    'Pressure-transfer27 and phase26 are unadopted; no combat fixture or acceptance gate changed.',
    'Public game and guide are still the original A4 artifacts.'] };
await writeFile(root + '/audit.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, source, paired: report.paired, artifact: report.artifact,
  captures: captures.length, minimumScopedContrast: report.minimumScopedContrast }));
