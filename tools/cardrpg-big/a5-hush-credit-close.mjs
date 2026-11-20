// REFERENCE: A5 B2. Bind adopted Hush correction to its actual gates and registered evidence.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';

const root = 'reports/cardrpg-big/a5/b2-hush-credit';
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
  const row = gates.findLast(check => check.name === name);
  assert(row && row.code === 0, name);
  assert.equal(row.head, source);
}
for (const row of gates) assert.equal(sha(await readFile(row.log)), row.sha256, row.log);
execFileSync('git', ['merge-base', '--is-ancestor', source, 'HEAD']);
assert.equal(execFileSync('git', ['diff', '--name-only', source, '--', 'apps', 'packages', 'scripts',
  'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'], { encoding: 'utf8' }).trim(), '');
const registration = await read('reports/cardrpg-big/a5/b2/hush-eligibility-22/REGISTERED-METHOD.json');
for (const [path, digest] of Object.entries(registration.combatSource))
  assert.equal(sha(await readFile(path)), digest, path);
const stagedTests = await readFile('tools/cardrpg-big/a5-drafts/suppression-eligibility-v4.test.ts');
assert.equal(sha(await readFile('packages/game-rules/src/cardrpg/depth/suppression-eligibility-v4.test.ts')), sha(stagedTests));
const off = await read(`${root}/off/checks.json`);
assert.deepEqual(off, { offBehavior: 'PASS',
  sha256: '47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3', cells: 165, routes: 8250 });
assert.deepEqual(await read(`${root}/off/source.json`), registration.combatSource);
const composition = await read('reports/cardrpg-big/a5/b2/hush-eligibility-22/audit.json');
for (const receipt of composition.receipts)
  assert.equal(sha(await readFile(receipt.path)), receipt.sha256, receipt.path);
assert.equal(composition.semantic.after, 144);
assert.equal(composition.semantic.exactOff, 72);
assert.equal(composition.savedDay7.totals.accounts, 90);
assert(Object.values(composition.savedDay7.gates).every(Boolean));
const scope = JSON.parse(execFileSync(process.execPath, ['tools/cardrpg-big/a5-scope.mjs'], { encoding: 'utf8' }));
assert.equal(scope.scope, 'PASS'); assert.equal(scope.baseline, 'PASS'); assert.equal(scope.historicalSimFiles, 13);
const report = {
  source, status: 'Adopted Hush correctness repair verified; balance acceptance remains open.',
  changes: [
    'A Hushed heal or shield signature spends its turn without replacement damage.',
    'Hush earns suppression and Lantern credit only where it blocks eligible utility.',
    'Summon eligibility is checked after retaliation, phase and available-thread checks.',
    'Drowsy credit remains; Result copy names enemy actions rather than utility only.',
  ],
  gates, off, semantic: composition.semantic, train: composition.after,
  paired: composition.paired, savedDay7: composition.savedDay7,
  sourceFilesChecked: Object.keys(registration.combatSource).length,
  scope: { scope: scope.scope, baseline: scope.baseline, historicalSimFiles: scope.historicalSimFiles, author: scope.author },
  receipts, limitations: composition.limitations.concat([
    'No cooldown, gear-fixture, AI, model asset, protected path or dependency change is adopted.',
    'Fresh acceptance 20001–20500 remains unused and all numeric misses remain visible.',
    'Public offline artifact remains unchanged until the Z delivery phase.',
  ]),
};
await writeFile(`${root}/audit.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ source, status: report.status, gates: gates.map(r => ({ name: r.name, code: r.code, counts: r.counts })),
  off, pieceMisses: report.train.pieceMisses, savedDay7: report.savedDay7.gates }));
