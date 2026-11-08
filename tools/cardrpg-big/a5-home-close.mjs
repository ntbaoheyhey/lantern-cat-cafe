// REFERENCE: PROMPT-A5 E2. Audit source-bound navigation evidence without a new balance or cadence claim.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const root = 'reports/cardrpg-big/a5/e2-home', receipts = [];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function json(path) {
  const bytes = await readFile(path); receipts.push({ path, sha256: sha(bytes) }); return JSON.parse(bytes);
}
const gates = await json(root + '/gates/checks.json'), source = gates[0].head;
for (const name of ['typecheck', 'lint', 'web-unit', 'rules', 'e2e', 'build']) {
  const row = gates.findLast(r => r.name === name);
  assert.equal(row?.code, 0, name); assert.equal(row.head, source); assert.equal(row.scope, 'complete');
}
for (const row of gates) assert.equal(sha(await readFile(row.log)), row.sha256, row.log);
execFileSync('git', ['merge-base', '--is-ancestor', source, 'HEAD']);
assert.equal(execFileSync('git', ['diff', '--name-only', source, '--', 'apps', 'packages',
  'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'], { encoding: 'utf8' }).trim(), '');
// No rules changed since the already completed digest: verify every original source hash, not a new run.
const offRoot = 'reports/cardrpg-big/a5/e1-crew-advice-band/off';
const off = await json(offRoot + '/checks.json');
assert.deepEqual(off, { offBehavior: 'PASS', sha256: '47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3', cells: 165, routes: 8250 });
for (const [path, hash] of Object.entries(await json(offRoot + '/source.json'))) assert.equal(sha(await readFile(path)), hash, path);
assert.equal(execFileSync('git', ['diff', '--name-only', 'e14d320ed', '--', 'packages'], { encoding: 'utf8' }).trim(), '');
const artifactRoot = '/tmp/cardrpg-a5-home-artifact';
const build = await json(artifactRoot + '/build.json'), artifact = await readFile(artifactRoot + '/index.html');
assert.equal(sha(artifact), build.sha256);
for (const [path, hash] of Object.entries(build.sourceHashes))
  if (/^(apps|packages|assets)\//.test(path)) assert.equal(sha(await readFile(path)), hash, path);
await mkdir(root + '/build', { recursive: true });
await writeFile(root + '/build/manifest.json', JSON.stringify(build, null, 2) + '\n');
receipts.push({ path: root + '/build/manifest.json', sha256: sha(await readFile(root + '/build/manifest.json')) });
const fixtures = await json(root + '/fixtures/checks.json'); assert.equal(fixtures.passed, true);
for (const fixture of fixtures.checks) assert.equal(sha(await readFile(fixture.path)), fixture.sha256);
const ui = await json(root + '/ui-checks/checks.json'), browsers = [], captures = [];
for (const row of ui) assert.equal(sha(await readFile(row.log)), row.sha256, row.log);
for (const name of ['fixtures', 'build', 'browser-1280', 'browser-1440', 'browser-1024'])
  assert.equal(ui.findLast(row => row.name === name)?.code, 0, name);
for (const width of [1280, 1440, 1024]) {
  const attempt = ui.findLast(row => row.name === 'browser-' + width).attempt;
  const browser = await json(`${root}/browser-${width}-attempt-${attempt}/checks.json`);
  assert.equal(browser.passed, true); assert.equal(browser.width, width); assert.equal(browser.sha256, build.sha256);
  assert.deepEqual(browser.errors, []); assert.deepEqual(browser.remote, []);
  assert.equal(browser.checks.length, 8); assert.equal(browser.captures.length, 10);
  for (const capture of browser.captures) {
    assert.equal(capture.overflow, 0); assert.equal(capture.primaryVisible, true);
    assert(capture.contrast.length > 0 && capture.contrast.every(row => row.ratio >= 4.5));
    captures.push({ ...capture, width, sha256: sha(await readFile(capture.path)) });
  }
  browsers.push({ width, checks: browser.checks });
}
const scope = JSON.parse(execFileSync(process.execPath, ['tools/cardrpg-big/a5-scope.mjs'], { encoding: 'utf8' }));
assert.equal(scope.scope, 'PASS'); assert.equal(scope.baseline, 'PASS'); assert.equal(scope.historicalSimFiles, 13);
const result = { status: 'PASS for Home navigation; A5 acceptance remains open', source, gates,
  off: { ...off, reusedFrom: offRoot, reason: 'All original rules hashes and complete package diff remain exact.' },
  artifact: { path: artifactRoot + '/index.html', sha256: build.sha256, bytes: artifact.length },
  fixtures: fixtures.checks, browsers, captures,
  minimumScopedContrast: Math.min(...captures.flatMap(capture => capture.contrast.map(row => row.ratio))),
  scope: { scope: scope.scope, baseline: scope.baseline, historicalSimFiles: scope.historicalSimFiles }, receipts,
  limitations: ['Home-only navigation and copy follow-up; no combat, saved-state or reward rule changes.',
    'The active route is an earned minute10 checkpoint; band/star edge cases are explicitly synthetic UI fixtures.',
    'The separate elapsed engagement01 browser uses its original immutable artifact; this change is not measured there.',
    'Thirty targeted Home captures at three widths/both looks, not the last-artifact Z screenshot pack.',
    'Public game and guide remain the original A4 artifacts. Fresh acceptance seeds remain unused.'] };
await writeFile(root + '/audit.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, source, artifact: result.artifact,
  captures: captures.length, minimumScopedContrast: result.minimumScopedContrast }));
