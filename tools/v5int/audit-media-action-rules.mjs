/** Replay captured seeded actions from the exact served Git rules snapshot. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({ allowPositionals: true, options: { pilot: { type: 'string' } } });
assert.equal(positionals.length, 2);
const [input, output] = positionals.map(p => resolve(p));
assert(!existsSync(output), 'Preserve existing evidence');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const bytes = await readFile(input), raw = JSON.parse(bytes);
const root = resolve(import.meta.dirname, '../..');
let planned = ['normal', 'reduced'].flatMap(mode => ['mochi', 'clover', 'panko', 'mallow'].flatMap(cat => [1, 4].map(skill => ({ mode, cat, skill }))));
if (values.pilot) planned = planned.filter(a => `${a.mode}-${a.cat}-${a.skill}` === values.pilot);
assert(planned.length === (values.pilot ? 1 : 16));
assert.deepEqual(raw.plannedActions, planned);
assert.deepEqual(raw.actions.map(({mode, cat, skill}) => ({mode, cat, skill})), planned);
assert(raw.pass && !raw.errors.length && !raw.blockedRequests.length);
assert(/^[0-9a-f]{40}$/.test(raw.sourceCommit));
const archive = execFileSync('git', ['archive', raw.sourceCommit, 'packages/game-rules', 'tsconfig.base.json'], { cwd: root, maxBuffer: 32 * 1024 * 1024 });
const snapshot = await mkdtemp('/tmp/cxi-action-rules-');
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
    rows.push({mode:action.mode, cat:action.cat, skill:action.skill, fullBattleExact:true,
      initialSha256:sha(JSON.stringify(action.initialBattle)), resultSha256:sha(JSON.stringify(battle))});
  }
  if (!values.pilot) {
    for (let i = 0; i < 8; i++) {
      assert.deepEqual(raw.actions[i].initialBattle, raw.actions[i+8].initialBattle);
      assert.deepEqual(raw.actions[i].observedBattle, raw.actions[i+8].observedBattle);
    }
  }
  const result = { utc:new Date().toISOString(), raw:{path:input,sha256:sha(bytes)}, sourceCommit:raw.sourceCommit,
    indexSha256:raw.indexSha256, url:raw.url, toolSha256:sha(await readFile(import.meta.filename)),
    rulesArchiveSha256:sha(archive), actions:rows.length, rows, fullBattleExact:true,
    normalReducedParity:values.pilot ? null : true, productionAcceptance:false,
    limits:['Independently replayed seeded legal actions; initial HP/charge/queue were modified, so this does not establish natural reachability.',
      'No renderer, motion, label paint, art or performance acceptance from rules replay.'] };
  await writeFile(output, JSON.stringify(result,null,2)+'\n', {flag:'wx'});
  console.log(JSON.stringify({actions:rows.length,fullBattleExact:true,normalReducedParity:result.normalReducedParity}));
} finally {
  if (modules) await modules.vite.close();
  await rm(snapshot,{recursive:true,force:true});
}
