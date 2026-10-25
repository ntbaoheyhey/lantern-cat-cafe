import { expect, it } from 'vitest';
import { CLASS_IDS } from '../content';
import { V2_CONFIG } from '../config';
import { newPlayerV2, rollSimChestV2 } from './player';
import { earliestSecondV2, simulateV2, simulateWithStateForTest, type SimResultV2 } from './simulate';
import { PROPOSED_V2_OVERRIDES } from './proposal';
import { medianV2 } from './targets';
import type { ConfigOverridesV2 } from './config';

// Frozen C5b values, independent of this round's search result.
export const C5B_V2_OVERRIDES: ConfigOverridesV2 = {
  cat: { baseAtk: 14, baseHp: 300, baseDef: 5, levelGrowth: 0.06 },
  monster: { hpBase: 90, hpGrowth: 1.06, atkBase: 8, atkGrowth: 1.06, xpBase: 18 },
  idle: { dailyKeys: 3, walkTimeMs: 1000, clearedChapterKeyChance: 0.02 },
  boss: { maxMs: 180000, attackIntervalMs: 4500, bigEveryMs: 6000, bigMultiplier: 1.5 },
};
const c5bCache = new Map<string, SimResultV2>();
function c5b(classId: typeof CLASS_IDS[number], seed: number) {
  const key = `${classId}/${seed}`;
  if (!c5bCache.has(key)) c5bCache.set(key, simulateV2({ classId, seed, overrides: C5B_V2_OVERRIDES }));
  return c5bCache.get(key)!;
}
it('finds the first second of a synthetic mid-step gate', () => {
  expect(earliestSecondV2(120, (seconds) => seconds >= 43.2)).toBe(44);
  expect(earliestSecondV2(120, (seconds) => seconds >= 43.2)).toBeLessThan(120);
  const state = { ...newPlayerV2('warrior'), level: 60, round: 10, kills: 5, stacks: { catKey: 1 } };
  const run = simulateWithStateForTest({ classId: 'warrior', seed: 1, maxActiveMinutes: 2, stepMinutes: 2 }, state).result;
  expect(run.minutesToFirstBossWin).toBeGreaterThan(0);
  expect(run.minutesToFirstBossWin).toBeLessThan(2);
});
it('records wins inside steps and ch1 medians agree within one minute', () => {
  for (const classId of CLASS_IDS) {
    const times = [1, 2].map((stepMinutes) => [1, 2, 3].map((seed) => simulateV2({ classId, seed, overrides: PROPOSED_V2_OVERRIDES, stepMinutes, maxActiveMinutes: 60 }).minutesToFirstBossWin));
    expect(Math.abs(medianV2(times[0]!) - medianV2(times[1]!)), classId).toBeLessThanOrEqual(1);
    expect(times[1]!.some((time) => time !== null && time % 2 !== 0)).toBe(true);
  }
}, 60000);
it('measures the C5b ch4 key wall and zero wait with five daily keys', () => {
  for (const classId of CLASS_IDS) for (const seed of [1, 2, 3]) {
    const baseline = c5b(classId, seed);
    expect(baseline.keyWaitMinutes[4], `${classId}/${seed}`).toBeGreaterThan(1000);
    const scenario = simulateV2({ classId, seed, overrides: C5B_V2_OVERRIDES, scenario: 'S-A' });
    expect(Object.values(scenario.keyWaitMinutes)).toEqual([0, 0, 0, 0, 0]);
  }
}, 90000);
it('cleared-chapter key chance is inert on the C5b frontier before ch5 wins', () => {
  for (const classId of CLASS_IDS) for (const seed of [1, 2, 3]) {
    const run = (chance: number) => simulateV2({ classId, seed, overrides: { ...C5B_V2_OVERRIDES, idle: { ...C5B_V2_OVERRIDES.idle, clearedChapterKeyChance: chance } } });
    expect(run(1 / 150)).toEqual(c5b(classId, seed));
  }
}, 90000);
it('S-B refunds exactly one key on first clears and none on repeats', () => {
  for (const classId of CLASS_IDS) for (const seed of [1, 2, 3]) {
    for (const chapter of [1, 2, 3, 4, 5]) {
      const state = { ...newPlayerV2(classId), chapter };
      const base = rollSimChestV2(state, seed);
      const refund = rollSimChestV2(state, seed, { firstClearKeyRefund: true });
      expect(refund.stackDeltas.catKey ?? 0).toBe((base.stackDeltas.catKey ?? 0) + 1);
      expect(refund.items).toEqual(base.items);
      state.bossClears[chapter] = { wins: 1 };
      expect(rollSimChestV2(state, seed, { firstClearKeyRefund: true })).toEqual(rollSimChestV2(state, seed));
    }
  }
  expect(V2_CONFIG.idle.dailyKeys).toBe(1);
});
