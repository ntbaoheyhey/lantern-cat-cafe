/** Replay preregistered sparse observation actions using the served Git rules. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

assert.equal(process.argv.length, 4);
const [input, output] = process.argv.slice(2).map(p => resolve(p));
assert(!existsSync(output), 'Preserve existing evidence');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const bytes = await readFile(input), raw = JSON.parse(bytes);
const preBytes = await readFile(raw.preregistration.path), pre = JSON.parse(preBytes);
assert.equal(sha(preBytes), raw.preregistration.sha256);
const fields = Object.keys(pre.cases[0]);
const project = a => Object.fromEntries(fields.map(k => [k, a[k]]));
assert.deepEqual(raw.plannedActions.map(project), pre.cases);
assert.deepEqual(raw.actions.map(project), pre.cases);
assert(raw.pass && !raw.errors.length && !raw.blockedRequests.length);
assert(/^[0-9a-f]{40}$/.test(raw.sourceCommit));
assert.equal(raw.sourceCommit, pre.sourceCommit);
assert.equal(raw.indexSha256, pre.indexSha256);
const root = resolve(import.meta.dirname, '../..');
const archive = execFileSync('git', ['archive', raw.sourceCommit, 'packages/game-rules', 'tsconfig.base.json'],
  { cwd: root, maxBuffer: 32 * 1024 * 1024 });
const snapshot = await mkdtemp('/tmp/cxi-observation-rules-');
let modules;
try {
  execFileSync('tar', ['-xf', '-', '-C', snapshot], { input: archive });
  process.env.BIG_RULES_ROOT = snapshot;
  const { loadRules } = await import('../cardrpg-big/a4-load.mjs');
  modules = await loadRules();
  const R = await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');
  const rows = [];
  for (const action of raw.actions) {
    const battle = structuredClone(action.initialBattle);
    assert(R.legalChoices(battle).some(c => JSON.stringify(c) === JSON.stringify(action.choice)));
    assert(R.act(battle, action.choice));
    assert.deepEqual(battle, action.expectedBattle);
    assert.deepEqual(battle, action.observedBattle);
    assert.equal(action.plan.skill, `${action.cat}-${action.skill}`);
    assert.equal(action.plan.contact, action.skill === 4 ? 1100 : 350);
    assert.equal(action.plan.duration, action.skill === 4 ? 2200 : 800);
    rows.push({ ...project(action), fullBattleExact: true,
      initialSha256: sha(JSON.stringify(action.initialBattle)), resultSha256: sha(JSON.stringify(battle)) });
  }
  let matchedModePairs = 0;
  for (const a of raw.actions.filter(x => x.mode === 'normal')) {
    const b = raw.actions.find(x => x.mode === 'reduced' && x.cat === a.cat && x.skill === a.skill &&
      x.ms === a.ms && x.statusCase === a.statusCase);
    if (b) {
      assert.deepEqual(a.initialBattle, b.initialBattle);
      assert.deepEqual(a.observedBattle, b.observedBattle);
      matchedModePairs++;
    }
  }
  const result = { utc: new Date().toISOString(), raw: { path: input, sha256: sha(bytes) },
    preregistration: raw.preregistration, sourceCommit: raw.sourceCommit, indexSha256: raw.indexSha256, url: raw.url,
    toolSha256: sha(await readFile(import.meta.filename)), rulesArchiveSha256: sha(archive),
    actions: rows.length, rows, fullBattleExact: true, matchedModePairs, productionAcceptance: false,
    limits: ['Seeded legal actions only; fixture preconditions do not establish natural reachability.',
      'No renderer, label, motion, art or performance acceptance from rules replay.'] };
  await writeFile(output, JSON.stringify(result, null, 2)+'\n', { flag: 'wx' });
  console.log(JSON.stringify({ actions: rows.length, fullBattleExact: true, matchedModePairs }));
} finally {
  if (modules) await modules.vite.close();
  await rm(snapshot, { recursive: true, force: true });
}
