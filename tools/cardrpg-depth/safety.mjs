import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const base = '7ff71ff69bd271c554ec4f407e1cb7fefbef8099';
const tracked = execFileSync('git', ['diff', '--name-only', base], { encoding: 'utf8' }).trim().split('\n');
const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { encoding: 'utf8' }).trim().split('\n');
const changed = [...new Set([...tracked, ...untracked].filter(Boolean))].sort();
const allowed = ['packages/game-rules/src/cardrpg/', 'packages/game-rules/src/squad/', 'apps/web/src/game/cardrpg/', 'apps/web/src/game/squad/', 'assets/', 'tools/cardrpg', 'docs/cardrpg2/', 'docs/design/cardrpg/', 'reports/cardrpg-depth/'];
const outside = changed.filter(path => path !== 'apps/web/src/main.tsx' && !allowed.some(prefix => path.startsWith(prefix)));
const rules = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'packages/game-rules/src/cardrpg/depth'], { encoding: 'utf8' }).trim().split('\n');
const scheduler = /\b(?:actionTime|nextActionAt|initiativeMeter|ATB|speedClock|fractionalScheduler)\b/;
const schedulerHits = [];
for (const path of rules) if (scheduler.test(await readFile(path, 'utf8'))) schedulerHits.push(path);
const manifests = ['models', 'icons', 'portraits', 'runtime'];
const hashes = [], mismatches = [];
for (const kind of manifests) {
  const manifest = JSON.parse(await readFile(`assets/provenance/cardrpg-depth-${kind}.json`, 'utf8'));
  const entries = [...(manifest.assets || []), ...(manifest.sources || [])];
  if (manifest.source) entries.push({ path: manifest.source, sha256: manifest.sourceSha256 });
  for (const entry of entries) {
    const actual = createHash('sha256').update(await readFile(entry.path)).digest('hex');
    hashes.push({ path: entry.path, sha256: actual });
    if (actual !== entry.sha256) mismatches.push(entry.path);
  }
}
const lockfile = execFileSync('git', ['diff', base, '--', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'], { encoding: 'utf8' });
const author = execFileSync('git', ['var', 'GIT_AUTHOR_IDENT'], { encoding: 'utf8' }).trim();
const result = { date: new Date().toISOString(), base, changed, outside, schedulerPattern: scheduler.source, schedulerHits, provenanceEntries: hashes.length, mismatches, hashes, dependencyFilesUnchanged: !lockfile, author };
await mkdir('reports/cardrpg-depth/validation', { recursive: true });
await writeFile('reports/cardrpg-depth/validation/safety.json', JSON.stringify(result, null, 2));
assert.deepEqual(outside, []); assert.deepEqual(schedulerHits, []); assert.deepEqual(mismatches, []); assert.equal(lockfile, '');
console.log(JSON.stringify({ changed: changed.length, provenanceEntries: hashes.length, outside, schedulerHits, mismatches, author }));
