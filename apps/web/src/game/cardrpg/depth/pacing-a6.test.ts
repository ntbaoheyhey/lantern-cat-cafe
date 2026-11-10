import { expect, it } from 'vitest';
import { createCardActionPlan } from './card-action-plan';
import { paceActionA6 } from './pacing-a6';
import type { TurnEvent } from '@taskbar-hero/game-rules/src/squad/turn/types';
const marker: TurnEvent = { version: 3, seq: 0, turn: 0, round: 0, actionId: 0, beat: 0, type: 'action_start', actorId: 'mochi', skillId: 'mochi-1', targetIds: ['foe'], amount: 0 };
it('shortens ordinary A6 animation while preserving event order and the source plan', () => {
  const plan = createCardActionPlan([marker], 'mochi-1'), before = JSON.stringify(plan);
  const paced = paceActionA6(plan, { gameplayA6: true, enemies: ['button-guard'] });
  expect(paced.duration).toBeLessThanOrEqual(650);
  expect(paced.events).toBe(plan.events);
  expect(paced.actorId).toBe(plan.actorId);
  expect(paced.beats.at(-1)!.start + paced.beats.at(-1)!.duration).toBe(paced.duration);
  expect(JSON.stringify(plan)).toBe(before);
});
it('preserves OFF, boss signatures and ultimate presentation exactly', () => {
  const normal = createCardActionPlan([marker], 'mochi-1');
  expect(paceActionA6(normal, { enemies: ['button-guard'] })).toBe(normal);
  const signature = createCardActionPlan([{...marker,actorId:'foe',skillId:'enemy-special'}], 'enemy:yarn-giant');
  expect(paceActionA6(signature, { gameplayA6: true, enemies: ['yarn-giant'] })).toBe(signature);
  const ultimate = createCardActionPlan([{ ...marker, skillId: 'mochi-4' }], 'mochi-4');
  expect(ultimate.ultimate).toBe(true);
  expect(paceActionA6(ultimate, { gameplayA6: true, enemies: ['button-guard'] })).toBe(ultimate);
});

it('bounds ordinary boss-fight actions without changing damage events or the source plan', () => {
  for (const identity of ['mochi-1', 'clover-2', 'enemy:yarn-giant:basic']) {
    const plan = createCardActionPlan([{...marker,skillId:identity}], identity), before = JSON.stringify(plan);
    const paced = paceActionA6(plan, {gameplayA6:true,enemies:['yarn-giant']});
    expect(paced.duration).toBeLessThanOrEqual(identity==='clover-2'?900:750);
    expect(paced.events).toBe(plan.events);
    expect(paced.beats.map(beat=>beat.kind)).toEqual(plan.beats.map(beat=>beat.kind));
    expect(paced.beats.at(-1)!.start+paced.beats.at(-1)!.duration).toBe(paced.duration);
    expect(JSON.stringify(plan)).toBe(before);
  }
});
