import { expect, it } from 'vitest';
import { createCardActionPlan } from './card-action-plan';
import { paceActionA6 } from './pacing-a6';
import type { TurnEvent } from '@taskbar-hero/game-rules/src/squad/turn/types';
const marker: TurnEvent = { version: 3, seq: 0, turn: 0, round: 0, actionId: 0, beat: 0, type: 'action_start', actorId: 'mochi', skillId: 'mochi-1', targetIds: ['foe'], amount: 0 };
it('shortens ordinary A6 animation while preserving event order and the source plan', () => {
  const plan = createCardActionPlan([marker], 'mochi-1'), before = JSON.stringify(plan);
  const paced = paceActionA6(plan, { gameplayA6: true, enemies: ['button-guard'] });
  expect(paced.duration).toBeLessThanOrEqual(850);
  expect(paced.events).toBe(plan.events);
  expect(paced.actorId).toBe(plan.actorId);
  expect(paced.beats.at(-1)!.start + paced.beats.at(-1)!.duration).toBe(paced.duration);
  expect(JSON.stringify(plan)).toBe(before);
});
it('preserves OFF, boss encounters and ultimate presentation exactly', () => {
  const normal = createCardActionPlan([marker], 'mochi-1');
  expect(paceActionA6(normal, { enemies: ['button-guard'] })).toBe(normal);
  expect(paceActionA6(normal, { gameplayA6: true, enemies: ['yarn-giant'] })).toBe(normal);
  const ultimate = createCardActionPlan([{ ...marker, skillId: 'mochi-4' }], 'mochi-4');
  expect(ultimate.ultimate).toBe(true);
  expect(paceActionA6(ultimate, { gameplayA6: true, enemies: ['button-guard'] })).toBe(ultimate);
});
