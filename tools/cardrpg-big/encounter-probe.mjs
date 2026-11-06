import { loadRules } from '../cardrpg-sim/load.mjs';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';

const phase = process.argv[2] || 'before';
assert(/^[a-z0-9-]+$/.test(phase));
const count = Number(process.env.BIG_SEEDS || 20);
const offset = Number(process.env.BIG_OFFSET || 2000);
const candidates = JSON.parse(process.env.BIG_ENEMY_CANDIDATES || '[[1,1]]');
const overrides = JSON.parse(process.env.BIG_ENEMY_OVERRIDES || '{}');
const chapters = JSON.parse(process.env.BIG_CHAPTERS || '[1,2,3]');
const levels = JSON.parse(process.env.BIG_LEVELS || '[1,6]');
const { load, vite, rules: legacy } = await loadRules();
const R = await load('packages/game-rules/src/cardrpg/depth/index.ts');
const { playRun } = await load('packages/game-rules/src/cardrpg/depth/run-bot.ts');
const { DepthModel } = await load('apps/web/src/game/cardrpg/depth/model.ts');
const originals = R.ENEMIES.map(enemy => ({ id: enemy.id, hp: enemy.hp, attack: enemy.attack, defense: enemy.defense }));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sourcePaths = ['packages/game-rules/src/cardrpg/depth/catalog.ts',
  'packages/game-rules/src/cardrpg/depth/battle.ts', 'packages/game-rules/src/cardrpg/depth/equipment.ts',
  'packages/game-rules/src/cardrpg/depth/policies.ts', 'apps/web/src/game/cardrpg/depth/model.ts',
  'apps/web/src/game/cardrpg/depth/card-action-plan.ts', 'apps/web/src/game/cardrpg/depth/battle-presentation.ts',
  'apps/web/src/game/squad/turn3d/effects.ts', 'apps/web/src/game/squad/turn3d/card-effect-data.ts'];
const sourceHashes = Object.fromEntries(await Promise.all(sourcePaths.map(async path =>
  [path, createHash('sha256').update(await readFile(path)).digest('hex')])));
const percentiles = values => {
  const sorted = [...values].sort((a, b) => a - b);
  return { min: sorted[0], p50: sorted[Math.floor(sorted.length * .5)],
    p95: sorted[Math.floor(sorted.length * .95)], max: sorted.at(-1) };
};
function plannedPlayback(completed) {
  const model = new DepthModel(true);
  model.replay = R.createBattle(completed.initial);
  model.replayChoices = completed.choices;
  model.sceneReady = true;
  model.sceneStarted = true;
  model.watching = true;
  const plans = [];
  for (let step = 0; model.showBattle && step < 2000; step++) {
    if (model.plan) {
      plans.push({ identity: model.plan.presentationId || model.plan.skillId,
        actor: model.plan.actorId, duration: model.plan.duration });
      model.tick(model.plan.duration);
    } else {
      assert(model.canAct, 'Replay stalled');
      model.replayStep();
    }
  }
  assert(!model.showBattle, 'Replay exceeded its bound');
  assert.equal(hash(model.replay), hash(completed), 'Presentation replay differs from rules');
  const actions = plans.filter(plan => plan.actor).length;
  return { actions, plans, plannedMilliseconds: plans.reduce((total, plan) => total + plan.duration, 0)
    + Math.max(0, actions - 1) * 80 };
}
function fixture(seed, level, rarity) {
  const state = R.createDepthAccount(seed);
  for (const card of state.account.cards) card.level = level;
  state.cleared = [1, 2];
  if (rarity === 'starter') return state;
  state.gear = [];
  state.equipment = {};
  if (rarity === 'none') return state;
  const sets = { mochi: 'hearthloom', soot: 'moonwick', clover: 'mossbrew' };
  for (const id of state.team) {
    state.equipment[id] = {};
    for (const [index, slot] of legacy.EQUIPMENT_SLOTS.entries()) {
      const item = R.makeGear(state, `${sets[id]}-${slot}-${rarity}`, seed + index * 7919);
      state.gear.push(item);
      state.equipment[id][slot] = item.id;
    }
  }
  return state;
}
const rows = [];
try {
  for (const [hpScale, attackScale] of candidates) {
    assert(hpScale > 0 && attackScale > 0);
    for (const original of originals) {
      // Explicit in-memory pilot over existing enemy stats, including bosses.
      // The separate tutorial cushion retains its original values.
      if (original.id === 'practice-cushion') continue;
      Object.assign(R.ENEMY_BY_ID[original.id], { hp: Math.round(original.hp * hpScale),
        attack: Math.max(1, Math.round(original.attack * attackScale)), defense: original.defense, ...overrides[original.id] });
    }
    for (const level of levels) for (const chapter of chapters) {
      for (const rarity of ['starter', 'none', ...legacy.RARITY_ORDER]) {
        const runs = [];
        for (let index = 1; index <= count; index++) {
          const seed = offset + index;
          const start = R.startRun(fixture(seed, level, rarity), chapter, seed);
          assert(start.ok, start.error);
          const encounters = [];
          const end = playRun(start.state, 'auto', completed => {
            const playback = plannedPlayback(completed);
            encounters.push({ won: completed.result === 'party', enemies: completed.initial.enemies,
              rounds: completed.round, choices: completed.choices.length, hash: hash(completed), ...playback });
          });
          runs.push({ seed, won: end.run.won, encounters });
        }
        const first = runs.map(run => run.encounters[0].plannedMilliseconds);
        const row = { hpScale, attackScale, level, chapter, rarity, count,
          wins: runs.filter(run => run.won).length, firstPlannedMs: percentiles(first),
          firstWithin45to90: first.filter(ms => ms >= 45000 && ms <= 90000).length, runs };
        rows.push(row);
        console.log(JSON.stringify({ ...row, runs: undefined }));
        await mkdir('reports/cardrpg-big/sim', { recursive: true });
        await writeFile(`reports/cardrpg-big/sim/encounter-${phase}.summary.json`, JSON.stringify({
          phase, count, offset, candidates, overrides, chapters, levels,
          rows: rows.map(({ runs, ...summary }) => summary) }, null, 2));
      }
    }
  }
} finally {
  await vite.close();
  await mkdir('reports/cardrpg-big/sim', { recursive: true });
  const receipt = { phase, count, offset, candidates, overrides, chapters, levels, originals, sourceHashes,
    method: 'Existing automatic campaign route bot and exact DepthModel replay plans. Authored duration plus80ms per inter-action gap. Headless planning estimate, browser frame/click timings measured separately. Enemy values are in-memory overrides. Training2001+ and final heldout30001+.', rows };
  await writeFile(`reports/cardrpg-big/sim/encounter-${phase}.json.gz`, gzipSync(JSON.stringify(receipt, null, 2)));
}
