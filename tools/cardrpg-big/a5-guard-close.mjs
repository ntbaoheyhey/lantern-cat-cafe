// REFERENCE: PROMPT-A5 B2. Verify retained guard-only source receipts; no test or timing reroll.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const root = 'reports/cardrpg-big/a5/b2-guard';
const source = 'db69140eb06a4625d9ec22a977c36444540bd56d';
const sha = data => createHash('sha256').update(data).digest('hex');
const receipts = [];
async function read(path) {
  const bytes = await readFile(path);
  receipts.push({ path, sha256: sha(bytes) });
  return JSON.parse(bytes);
}
const gates = await read(root + '/gates/checks.json');
const expected = ['typecheck', 'lint', 'web-unit', 'rules', 'e2e', 'build'];
for (const name of expected) {
  const row = gates.findLast(check => check.name === name);
  assert(row && row.code === 0, `Missing passing gate: ${name}`);
  assert.equal(row.head, source);
}
for (const row of gates) assert.equal(sha(await readFile(row.log)), row.sha256, row.log);
execFileSync('git', ['merge-base', '--is-ancestor', source, 'HEAD']);
const changes = execFileSync('git', ['diff', '--name-only', source, '--', 'apps', 'packages', 'scripts',
  'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'], { encoding: 'utf8' }).trim();
assert.equal(changes, '', 'Runtime changed since the recorded source gates');

const off = await read(root + '/off/checks.json');
const runtime = await read(root + '/off/source.json');
assert.equal(off.offBehavior, 'PASS');
assert.equal(off.sha256, '47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3');
assert.equal(off.cells, 165); assert.equal(off.routes, 8250);
for (const [path, digest] of Object.entries(runtime)) assert.equal(sha(await readFile(path)), digest, path);
const followup = await read('reports/cardrpg-big/a5/b2/fatal-followup/checks.json');
assert.equal(sha(await readFile(followup.sourceReceipt.path)), followup.sourceReceipt.sha256);
for (const name of ['exactPrefixReplay', 'automaticPreviewImmutable', 'everyLegalActionResolves', 'fatalFollowupReplayExact'])
  assert.equal(followup[name], true, name);
assert.equal(followup.fatalFollowupResult, 'enemy');
const scope = JSON.parse(execFileSync(process.execPath, ['tools/cardrpg-big/a5-scope.mjs'], { encoding: 'utf8' }));
assert.equal(scope.scope, 'PASS'); assert.equal(scope.baseline, 'PASS'); assert.equal(scope.historicalSimFiles, 13);
const audit = {
  source, status: 'Guard-only source checks PASS; B1/B2 balance and A5 acceptance remain open.',
  change: 'V4 energy-to-shield follow-up skips a missing living recipient after fatal reflection. Normal shield and legacy energy stay unchanged.',
  gates, off, sourceFilesChecked: Object.keys(runtime).length, followup,
  scope: { scope: scope.scope, baseline: scope.baseline, historicalSimFiles: scope.historicalSimFiles, author: scope.author },
  receipts, limitations: [
    'No Scent policy or kit trial is adopted.',
    'Fresh acceptance seeds 20001–20500 remain unused.',
    'The current public offline demo is not rebuilt by this source-only correction; replacement remains scheduled for Z.',
    'No new screen or flow; existing source E2E checks do not constitute a new screenshot pack or 30-minute engagement measurement.',
  ],
};
await writeFile(root + '/audit.json', JSON.stringify(audit, null, 2));
console.log(JSON.stringify({ status: audit.status, source, gates: expected, off, scope: audit.scope }));
