// REFERENCE: PROMPT-A5 E2. Bind the original Home03 journey and phase checks; no new samples.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root = 'reports/cardrpg-big/a5/engagement/home-03', receipts = [];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = async path => {
  const bytes = await readFile(path); receipts.push({ path, sha256: sha(bytes) }); return JSON.parse(bytes);
};
const reg = await json(root + '/REGISTERED-METHOD.json');
const metrics = await json(root + '/metrics.json'), audit = await json(root + '/audit.json');
assert.equal(audit.samplesRepeated, 0);
assert.deepEqual(audit.gates, metrics.gates);
for (const row of [...audit.captures, ...metrics.files]) assert.equal(sha(await readFile(row.path)), row.sha256, row.path);
assert.equal(sha(await readFile(root + '/contact.png')), audit.contactSha256);
assert(metrics.activeMinutes >= 60);
const gates = await json('reports/cardrpg-big/a5/e2-informed/gates/checks.json');
for (const name of ['typecheck', 'lint', 'web-unit', 'rules', 'e2e', 'build']) {
  const row = gates.findLast(r => r.name === name);
  assert.equal(row?.code, 0, name);
  execFileSync('git', ['merge-base', '--is-ancestor', row.head, 'HEAD']);
  assert.equal(execFileSync('git', ['diff', '--name-only', row.head, '--', 'apps', 'packages', 'assets',
    'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'], { encoding: 'utf8' }).trim(), '');
}
for (const row of gates) assert.equal(sha(await readFile(row.log)), row.sha256, row.log);
assert.equal(execFileSync('git', ['diff', '--name-only', reg.runtimeSource, '--', 'apps', 'packages', 'assets',
  'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'], { encoding: 'utf8' }).trim(), '');
assert.equal(sha(await readFile(reg.buildManifest)), reg.buildManifestSha256);
const build = await json(reg.buildManifest);
for (const [path, digest] of Object.entries(build.sourceHashes))
  if (/^(apps|packages|assets)\//.test(path)) assert.equal(sha(await readFile(path)), digest, path);
const artifact = await readFile(reg.artifact);
assert.equal(sha(artifact), reg.artifactSha256); assert.equal(artifact.length, reg.artifactBytes);
const offRoot = 'reports/cardrpg-big/a5/e1-crew-advice-band/off', off = await json(offRoot + '/checks.json');
assert.deepEqual(off, { offBehavior: 'PASS', sha256: '47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3', cells: 165, routes: 8250 });
for (const [path, digest] of Object.entries(await json(offRoot + '/source.json')))
  assert.equal(sha(await readFile(path)), digest, path);
assert.equal(execFileSync('git', ['diff', '--name-only', 'e14d320ed', '--', 'packages'], { encoding: 'utf8' }).trim(), '');
const scope = JSON.parse(execFileSync(process.execPath, ['tools/cardrpg-big/a5-scope.mjs'], { encoding: 'utf8' }));
assert.equal(scope.scope, 'PASS'); assert.equal(scope.baseline, 'PASS'); assert.equal(scope.historicalSimFiles, 13);
const result = {
  status: 'PASS: original journey evidence is complete; individual engagement targets retain their measured status',
  runtime: reg.runtimeSource, activeMinutes: metrics.activeMinutes, engagementGates: metrics.gates,
  artifact: { path: reg.artifact, sha256: reg.artifactSha256, bytes: reg.artifactBytes },
  sourceGates: gates, captures: audit.captures.length,
  off: { ...off, reusedFrom: offRoot, reason: 'Exact source hashes and complete package diff verified; no repeat samples.' },
  scope: { protectedPaths: scope.scope, baseline: scope.baseline, historicalSimFiles: scope.historicalSimFiles },
  receipts, acceptanceSeedsUsed: false,
  limitations: metrics.limitations,
};
await writeFile(root + '/closure.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, gates: result.engagementGates, activeMinutes: result.activeMinutes, captures: result.captures }));
