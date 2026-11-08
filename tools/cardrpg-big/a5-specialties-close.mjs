// REFERENCE: PROMPT-A5 C1/B2. Verify source, paired combat, compatibility and rendered copy receipts.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const root = 'reports/cardrpg-big/a5/c1-specialties';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const receipts = [];
async function read(path) {
  const bytes = await readFile(path);
  receipts.push({ path, sha256: sha(bytes) });
  return JSON.parse(bytes);
}
const gates = await read(`${root}/gates/checks.json`);
const source = gates[0]?.head;
assert(source);
for (const name of ['typecheck', 'lint', 'web-unit', 'rules', 'e2e', 'build']) {
  const check = gates.findLast(row => row.name === name);
  assert.equal(check?.code, 0, name);
  execFileSync('git', ['merge-base', '--is-ancestor', source, check.head]);
  assert.equal(execFileSync('git', ['diff', '--name-only', source, check.head, '--', 'apps', 'packages',
    'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'], { encoding: 'utf8' }).trim(), '');
}
const e2eAttempts = gates.filter(row => row.name === 'e2e');
if (e2eAttempts.at(-1).scope?.startsWith('last failed')) {
  assert(e2eAttempts[0].counts.includes('  420 passed (2.1m)'));
  assert(e2eAttempts.at(-1).counts.some(line => /^  1 passed \(/.test(line)));
  const failed = await read(`${root}/gates/e2e-original-failure/last-run.json`);
  assert.equal(failed.failedTests.length, 1);
}
for (const row of gates) assert.equal(sha(await readFile(row.log)), row.sha256, row.log);
execFileSync('git', ['merge-base', '--is-ancestor', source, 'HEAD']);
assert.equal(execFileSync('git', ['diff', '--name-only', source, '--', 'apps', 'packages',
  'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'], { encoding: 'utf8' }).trim(), '');
const draft = await read('tools/cardrpg-big/a5-drafts/specialties-23/manifest.json');
for (const [path, digest] of Object.entries(draft.outputs)) assert.equal(sha(await readFile(path)), digest, path);
const off = await read(`${root}/off/checks.json`);
assert.deepEqual(off, { offBehavior: 'PASS',
  sha256: '47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3', cells: 165, routes: 8250 });
const offSource = await read(`${root}/off/source.json`);
for (const [path, digest] of Object.entries(offSource)) assert.equal(sha(await readFile(path)), digest, path);
const replay = await read(`${root}/replay/checks.json`);
assert.equal(replay.passed, true);
assert.equal(replay.rows.length, 216);
assert(replay.rows.every(row => row.normalizedSha256 === row.originalSha256));
assert(replay.allowedText.events > 0);
assert.equal(replay.rows.filter(row => row.v4 === false).length, 108);
for (const [path, digest] of Object.entries(replay.afterSource)) assert.equal(sha(await readFile(path)), digest, path);
const ui = await read(`${root}/ui-checks/checks.json`);
for (const row of ui) assert.equal(sha(await readFile(row.log)), row.sha256, row.log);
for (const name of ['replay', 'fixtures', ...['on', 'off'].flatMap(mode =>
  [`build-${mode}`, ...[1280, 1440, 1024].map(width => `browser-${mode}-${width}`)])])
  assert.equal(ui.findLast(row => row.name === name)?.code, 0, name);
const fixtures = await read(`${root}/fixtures/checks.json`);
assert.equal(fixtures.cats.length, 12);
assert.equal(fixtures.tooltips.length, 8);
assert.equal(fixtures.historical.prefix, 'THC12');
assert.equal(sha(await readFile(`${root}/fixtures/all-set-tooltips.save`)), fixtures.saveSha256);
const artifacts = [], browsers = [], captures = [];
for (const mode of ['on', 'off']) {
  const artifactRoot = `/tmp/cardrpg-a5-specialties-${mode}`;
  const artifact = await readFile(`${artifactRoot}/index.html`);
  const build = await read(`${artifactRoot}/build.json`);
  assert.equal(sha(artifact), build.sha256);
  // Build receipts include tooling snapshots; compare runtime and asset inputs here.
  for (const [path, digest] of Object.entries(build.sourceHashes))
    if (/^(apps|packages|assets)\//.test(path)) assert.equal(sha(await readFile(path)), digest, path);
  await mkdir(`${root}/builds`, { recursive: true });
  await writeFile(`${root}/builds/${mode}.json`, JSON.stringify(build, null, 2) + '\n');
  receipts.push({ path: `${root}/builds/${mode}.json`, sha256: sha(await readFile(`${root}/builds/${mode}.json`)) });
  artifacts.push({ mode, path: `${artifactRoot}/index.html`, bytes: artifact.length, sha256: build.sha256 });
  for (const width of [1280, 1440, 1024]) {
    const check = ui.findLast(row => row.name === `browser-${mode}-${width}` && row.code === 0);
    const browser = await read(`${root}/browser-${mode}-${width}-attempt-${check.attempt}/checks.json`);
    assert.equal(browser.passed, true);
    assert.equal(browser.width, width);
    assert.equal(browser.mode, mode);
    assert.equal(browser.sha256, build.sha256);
    assert.deepEqual(browser.errors, []);
    assert.deepEqual(browser.remote, []);
    assert.equal(browser.checks.length, 7);
    assert.equal(browser.captures.length, mode === 'on' ? 8 : 6);
    for (const capture of browser.captures) {
      assert.equal(capture.overflow, 0);
      assert(capture.contrast.every(row => row.ratio >= 4.5));
      captures.push({ ...capture, sha256: sha(await readFile(capture.path)) });
    }
    browsers.push({ mode, width, checks: browser.checks });
  }
}
const scope = JSON.parse(execFileSync(process.execPath, ['tools/cardrpg-big/a5-scope.mjs'], { encoding: 'utf8' }));
assert.equal(scope.scope, 'PASS'); assert.equal(scope.baseline, 'PASS'); assert.equal(scope.historicalSimFiles, 13);
const report = { source, status: 'PASS', gates, off, artifacts, browsers,
  pairedBattles: replay.rows.length, allowedText: replay.allowedText, captures,
  minimumScopedContrast: Math.min(...captures.flatMap(capture => capture.contrast.map(row => row.ratio))),
  scope: { scope: scope.scope, baseline: scope.baseline, historicalSimFiles: scope.historicalSimFiles }, receipts,
  limitations: ['Kit capabilities are not measured best-team rankings.',
    'Synthetic gear fixtures exercise presentation, not earned progression or balance.',
    'Targeted copy captures are not the full last-artifact screenshot pack.',
    'No timing, fresh acceptance, complete 30-minute cadence or human playtest claim.',
    'Public demo remains unchanged until Z. Local ON/OFF artifacts are reproducible from recorded inputs.'] };
await writeFile(`${root}/audit.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ source, status: report.status, pairedBattles: report.pairedBattles,
  captures: captures.length, minimumScopedContrast: report.minimumScopedContrast, artifacts }));
