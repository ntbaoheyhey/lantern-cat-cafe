import { expect, it } from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { summarizeBattle } from './battle-summary';

it('sums actual HP damage, healing and damage taken without double-counting defeat events', () => {
  const state = R.createDepthAccount();
  const battle = R.createBattle({ seed: 11, chapter: 1, cats: R.battleCats(state), enemies: ['button-guard'] });
  const event = { round: 1, actorId: 'soot', targetId: 'foe-0-button-guard', skillId: '', text: '' };
  battle.log = [
    { ...event, kind: 'damage', amount: 50 }, { ...event, kind: 'detonate', amount: 20 }, { ...event, kind: 'defeat', amount: 0 },
    { ...event, actorId: 'clover', targetId: 'mochi', kind: 'heal', amount: 35 },
    { ...event, actorId: 'foe-0-button-guard', targetId: 'mochi', kind: 'shared', amount: 12 },
    { ...event, actorId: 'mochi', targetId: 'mochi', kind: 'survive', amount: 30 },
    { ...event, kind: 'action', amount: 0, skillId: 'soot-4' },
  ];
  const before = JSON.stringify(battle);
  const result = summarizeBattle(battle);
  expect(result.cats.find(cat => cat.id === 'soot')!.damage).toBe(70);
  expect(result.cats.find(cat => cat.id === 'clover')!.healing).toBe(35);
  expect(result.cats.find(cat => cat.id === 'mochi')!.taken).toBe(12);
  expect(result.mvp!.id).toBe('soot');
  expect(result.firstUltimate!.skillId).toBe('soot-4');
  expect(result.biggestHit!.amount).toBe(50);
  expect(result.saves).toHaveLength(1);
  expect(JSON.stringify(battle)).toBe(before);
});

it.each([
  { incoming: false, hp: 100 }, { incoming: false, hp: 10 },
  { incoming: true, hp: 100 }, { incoming: true, hp: 10 },
])('reports actual Rupture HP loss through shields (incoming=$incoming, HP=$hp)', ({ incoming, hp }) => {
  const state = R.setGameplayA6(R.createDepthAccount(917273), true);
  const battle = R.createBattle({ seed: 917273, chapter: 1, gameplayV4: true, skillsV5: true, gameplayA6: true,
    cats: R.battleCats(state), enemies: ['sock-skipper'] });
  const source = battle.actors.find(a => a.id === (incoming ? 'foe-0-sock-skipper' : 'soot'))!;
  const target = battle.actors.find(a => a.id === (incoming ? 'clover' : 'foe-0-sock-skipper'))!;
  target.hp = hp; target.shield = 5000;
  target.statuses = ['snag', 'brittle'].map(id => ({ id: id as R.StatusId, stacks: id === 'snag' ? 3 : 1,
    remaining: 3, source: source.id, appliedRound: battle.round }));
  battle.queue = [source.id, ...battle.actors.filter(a => a.id !== source.id).map(a => a.id)];
  battle.log = [];
  expect(incoming ? R.enemyAct(battle) : R.act(battle, { actorId: source.id, targetId: target.id, skillId: 'soot-1' })).toBe(true);
  const actualLoss = hp - target.hp, reaction = battle.log.find(e => e.kind === 'reaction-damage')!;
  expect(actualLoss).toBe(Math.min(hp, 36));
  expect(reaction.amount).toBe(actualLoss); expect(target.shield).toBeGreaterThan(0);
  expect(battle.log.some(e => e.kind === 'reaction' && e.skillId === 'rupture')).toBe(true);
  const before = JSON.stringify(battle), summary = summarizeBattle(battle), outcome = R.outcomeV4(battle);
  expect(summary.cats.find(c => c.id === (incoming ? target.id : source.id))![incoming ? 'taken' : 'damage']).toBe(actualLoss);
  expect(summary.biggestHit).toEqual(reaction);
  if (incoming) {
    expect(outcome.totalDamage).toBe(0); expect(outcome.damageByRow).toEqual({ front: 0, rear: actualLoss });
    expect(outcome.rearShare).toBe(100);
  } else {
    expect(summary.mvp!.id).toBe(source.id); expect(outcome.totalDamage).toBe(actualLoss);
    expect(outcome.allCauses.find(c => c.kind === 'damage' && c.actorId === source.id)?.amount).toBe(actualLoss);
  }
  expect(JSON.stringify(battle)).toBe(before);
});
