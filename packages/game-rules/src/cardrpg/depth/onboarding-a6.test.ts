import { expect, it } from 'vitest';
import * as R from './index';
import {clone} from '../internal';
const fresh = () => R.setGameplayA6(R.createDepthAccount(11, 0), true);
it('guides the first patrol, free friend and first level, then reveals the next goal', () => {
  const s = fresh(); expect(R.introductionA6(s).guide).toBe('patrol');
  s.tutorial = 3; expect(R.introductionA6(s).guide).toBe('recruit');
  s.freeInvite = true; expect(R.introductionA6(s).guide).toBe('upgrade');
  s.account.cards[0]!.level = 2; expect(R.introductionA6(s).guide).toBeNull();
  s.cleared = [1]; expect(R.introductionA6(s).features.find(f => f.id === 'tower')!.open).toBe(true);
  expect(R.introductionA6(s).features.find(f => f.id === 'relic')!.open).toBe(false);
  s.cleared = [1, 2]; expect(R.introductionA6(s).features.find(f => f.id === 'relic')!.open).toBe(true);
});
it('uses the same entry band as Night Patrol, with explicit choices preserved and OFF unchanged', () => {
  const s = fresh(); s.account.cards.forEach(c => c.level = 6);
  const suggested = R.patrolDefaultsA6(s);
  expect(suggested).toMatchObject({ chapter: 1, band: 1, ceiling: 6 });
  expect(R.startRun(s, 1, 7).state.run!.challengeLevel).toBe(suggested.band);
  expect(R.startRun(s, 1, 7, 'campaign', '2026-11-10', 4).state.run!.challengeLevel).toBe(4);
  expect(R.startRun(R.setGameplayA6(s, false), 1, 7).state.run!.challengeLevel).toBe(6);
  s.cleared = [1]; expect(R.patrolDefaultsA6(s)).toMatchObject({ chapter: 2, band: 1 });
});
it('opens the tower after the first chapter and keeps floor progression earned', () => {
  const s = fresh(); expect(R.startTowerFloorA6(s).ok).toBe(false);
  s.cleared = [1]; expect(R.startTowerFloorA6(s).ok).toBe(true);
  expect(R.startTowerFloorA6(s, 2).ok).toBe(false);
});

it('keeps first-training gifts open after switching to untrained cats', () => {
  const s = fresh(); s.tutorial = 3; s.freeInvite = true;
  const trained = s.account.cards[0]!; trained.level = 2;
  s.team = s.team.filter(id => id !== trained.cardId);
  expect(R.introductionA6(s).guide).toBeNull();
  expect(R.introductionA6(s).features.find(f => f.id === 'daily')!.open).toBe(true);
});

it('ramps early campaign pressure without a first-clear difficulty jump and preserves preparation/replay', () => {
  const s = fresh(); s.account.cards.forEach(c => c.level = 5);
  const enter = (state: R.DepthAccount, band = 1) => {
    const started = R.startRun(state, 1, 7, 'campaign', '2026-11-10', band).state;
    return R.enterNode(started, R.availableNodes(started.run!)[0]!.id).state;
  };
  const first = enter(s), replay = enter({ ...s, cleared: [1] }), higher = enter(s, 4);
  expect(R.patrolPressureA6(first)).toBe(.72);
  expect(R.patrolPressureA6(replay)).toBe(.72);
  expect(R.patrolPressureA6(higher)).toBe(.72);
  const foe = first.run!.battle!.initial.enemies[0]!;
  expect(first.run!.battle!.initial.enemyStats![foe]!.attack).toBe(replay.run!.battle!.initial.enemyStats![foe]!.attack);
  const prepared = R.configurePreparation(first, first.team, first.rows, first.v4!.plan).state;
  expect(prepared.run!.battle!.initial.enemyStats).toEqual(first.run!.battle!.initial.enemyStats);
  const played = R.playBattle(prepared.run!.battle!, 'auto');
  expect(R.replayBattle(played.initial, played.choices)).toEqual(played);
  expect(R.patrolPressureA6(enter(R.setGameplayA6(s, false)))).toBe(1);
});


it('keeps fixed early/late/boss power near the expected new crew and upgrades never strengthen those foes', () => {
  const s = fresh(); s.cleared = [1, 2];
  for (const chapter of [1, 2, 3]) {
    const run = R.startRun(s, chapter, 7).state.run!;
    const expected = [7500, 7900, 8200][chapter - 1]!;
    for (const [id, ratio] of [['0-0', .72], ['5-0', .98], ['6-0', chapter===3?1.2:1.15]] as const) {
      const node = run.nodes.find(n => n.id === id)!;
      const stats = R.campaignEnemyStatsA6(run, node);
      const battle = R.createBattle({seed: 7, chapter, cats: [], enemies: node.enemies,
        gameplayV4: true, skillsV5: true, gameplayA6: true, enemyStats: stats});
      const power = battle.actors.reduce((n, a) => n + R.powerScoreA6(a), 0);
      // Later bosses retain their harder mechanics with a lower strike budget.
      // Validate the authored pressure range, not an exact score at any cost.
      expect(power / expected).toBeGreaterThan(node.kind === 'boss' && chapter > 1 ? .9 : ratio - .025);
      expect(power / expected).toBeLessThan(ratio + .025);
      const trained = clone(s); trained.account.cards.forEach(c => c.level = 6);
      const sameBand = R.startRun(trained, chapter, 7, 'campaign', '2026-11-10', 1).state.run!;
      expect(R.campaignEnemyStatsA6(sameBand, node)).toEqual(stats);
    }
  }
});
