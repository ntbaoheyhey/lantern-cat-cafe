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
