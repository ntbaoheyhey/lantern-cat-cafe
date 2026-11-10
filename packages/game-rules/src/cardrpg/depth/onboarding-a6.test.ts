import { expect, it } from 'vitest';
import * as R from './index';
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
  expect(R.patrolPressureA6(first)).toBe(.65);
  expect(R.patrolPressureA6(replay)).toBe(.65);
  expect(R.patrolPressureA6(higher)).toBe(1);
  const foe = first.run!.battle!.initial.enemies[0]!;
  expect(first.run!.battle!.initial.enemyStats![foe]!.attack).toBe(replay.run!.battle!.initial.enemyStats![foe]!.attack);
  const prepared = R.configurePreparation(first, first.team, first.rows, first.v4!.plan).state;
  expect(prepared.run!.battle!.initial.enemyStats).toEqual(first.run!.battle!.initial.enemyStats);
  const played = R.playBattle(prepared.run!.battle!, 'auto');
  expect(R.replayBattle(played.initial, played.choices)).toEqual(played);
  expect(R.patrolPressureA6(enter(R.setGameplayA6(s, false)))).toBe(1);
});
