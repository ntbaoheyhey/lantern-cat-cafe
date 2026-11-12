import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadRuntime, freshAccount } from './runtime.mjs';
import { chooseAction, executeModelAction } from './policy.mjs';

const directory = await mkdtemp(join(tmpdir(), 'c2-policy-'));
after(() => rm(directory, { recursive: true, force: true }));
const { R, DepthModel } = await loadRuntime(directory);

function prepare(fallenFronts) {
 const m = new DepthModel(true, true, true, true, true);
 m.state = freshAccount(R, 80002, 0); m.state.tutorial = 3;
 m.start(1, 'campaign', 1);
 const front = m.state.team.filter(id => m.state.rows[id] === 'front');
 for (const id of front.slice(0, fallenFronts)) m.state.run.hp[id] = 0;
 m.enter('0-0');
 return m;
}
test('the shared player repairs a fallen frontline through a legal swap without healing or rerolling', () => {
 const m = prepare(2), initial = structuredClone(m.battle.initial), view = { screen: 'prepare' };
 const action = chooseAction(R, m.state, view, {});
 assert.equal(action.type, 'front');
 executeModelAction(R, m, view, action);
 assert.deepEqual(m.battle.initial.hp, initial.hp);
 assert.deepEqual(m.battle.initial.enemyStats, initial.enemyStats);
 assert.equal(m.battle.seed, initial.seed);
 const next = chooseAction(R, m.state, view, {});
 assert.equal(next.type, 'fight'); executeModelAction(R, m, view, next);
 assert.equal(m.watching, true);
});
test('the shared player leaves a legal healthy or partly fallen formation alone', () => {
 for (const fallen of [0, 1]) {
  const m = prepare(fallen);
  assert.equal(chooseAction(R, m.state, { screen: 'prepare' }, {}).type, 'fight');
 }
});
