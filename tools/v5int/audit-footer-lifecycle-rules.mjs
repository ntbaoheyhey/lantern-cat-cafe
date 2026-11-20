/** Independently replay lifecycle controls from the exact captured rules revision. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const [input, output] = process.argv.slice(2).map(p => resolve(p));
assert(input && output && !existsSync(output));
const bytes = await readFile(input), raw = JSON.parse(bytes);
const sha = b => createHash('sha256').update(b).digest('hex');
assert(raw.pass && raw.runs.length === 4);
assert(/^[0-9a-f]{40}$/.test(raw.sourceCommit));
const root = resolve(import.meta.dirname, '../..');
const archive = execFileSync('git', ['archive', raw.sourceCommit, 'packages/game-rules', 'tsconfig.base.json'], {cwd: root, maxBuffer: 32 * 1024 * 1024});
const snapshot = await mkdtemp('/tmp/cxi-footer-rules-');
let modules;
try {
  execFileSync('tar', ['-xf', '-', '-C', snapshot], {input: archive});
  process.env.BIG_RULES_ROOT = snapshot;
  const {loadRules} = await import('../cardrpg-big/a4-load.mjs');
  modules = await loadRules();
  const R = await modules.load('packages/game-rules/src/cardrpg/depth/index.ts'), rows = [];
  for (const run of raw.runs) {
    const a = run.action, battle = structuredClone(a.initial);
    assert(R.legalChoices(battle).some(c => JSON.stringify(c) === JSON.stringify(a.choice)));
    assert(R.act(battle, a.choice));
    assert.deepEqual(battle, a.expected);
    assert.deepEqual(battle, a.actual);
    rows.push({key: run.key, exact: true, resultSha256: sha(JSON.stringify(battle))});
  }
  const pairs = new Map();
  for (const run of raw.runs) {
    const key = [run.mode, run.cat, run.skill, run.statusCase, run.focusStatusId ?? ''].join('|');
    if (!pairs.has(key)) pairs.set(key, []);
    pairs.get(key).push(run);
  }
  for (const pair of pairs.values()) {
    assert.equal(pair.length, 2);
    const [a, b] = pair;
    assert.deepEqual([a.arm, b.arm], ['original', 'prototype']);
    for (const key of ['initial', 'choice', 'expected', 'actual', 'duration']) assert.deepEqual(a.action[key], b.action[key]);
  }
  await writeFile(output, JSON.stringify({utc: new Date().toISOString(), raw: {path: input, sha256: sha(bytes)},
    sourceCommit: raw.sourceCommit, indexSha256: raw.indexSha256, url: raw.url,
    rulesArchiveSha256: sha(archive), toolSha256: sha(await readFile(import.meta.filename)),
    actions: rows.length, originalPrototypeParity: true, rows, productionAcceptance: false,
    limits: ['Synthetic initial state; legal action parity does not establish natural reachability or label/art quality.']}, null, 2)+'\n', {flag: 'wx'});
  console.log(JSON.stringify({actions: rows.length, originalPrototypeParity: true}));
} finally {
  if (modules) await modules.vite.close();
  await rm(snapshot, {recursive: true, force: true});
}
