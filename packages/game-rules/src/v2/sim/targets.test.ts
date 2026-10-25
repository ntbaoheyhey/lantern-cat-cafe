import { expect, it } from 'vitest';
import { CLASS_IDS, CHAPTERS } from '../content';
import { V2_CONFIG } from '../config';
import { withConfigV2, type ConfigOverridesV2 } from './config';
import { PROPOSED_V2_OVERRIDES } from './proposal';
import { newPlayerV2 } from './player';
import { sampleRoundV2, simulateV2, type SimResultV2 } from './simulate';
import { checkTargetsV2, guardrailsCheckV2, walkShareCheckV2 } from './targets';
import { percentileV2 } from './report';

function synthetic(spread: number): SimResultV2[] {
  return CLASS_IDS.flatMap((classId, index) => [1, 2, 3].map((seed) => ({
    classId, seed, keyWaitMinutes: {}, calendarDaysToChapterBossWin: {}, maxLevelBeforeChapter5Win: false, minutesToFirstBossWin: 12,
    minutesToChapterBossWin: Object.fromEntries(CHAPTERS.map((ch) => [ch.index, 12 * 2 ** (ch.index - 1) * (1 + (index / 6 - 0.5) * spread)])),
    minutesPerChapter: Object.fromEntries(CHAPTERS.map((ch) => [ch.index, 12 * 1.5 ** (ch.index - 1)])),
    minutesToLevel: { 20: 20, 40: 40 }, keysUsed: 5, bossFights: 5, bossLosses: 0, crafted: 0, salvaged: 0,
    stuck: null, finalLevel: 40, finalPower: 100,
    roundSamples: Object.fromEntries(['1:1', '3:1', '3:5', '5:1'].map((key) => [key, { level: 10, timeToKillMs: 2000, walkTimeMs: 2000 / 3, walkShare: 0.25, timeToKillByLevelMs: Array(60).fill(2000) as number[] }])),
    bosses: Object.fromEntries(CHAPTERS.map((ch) => [ch.index, { fights: 1, losses: Number(seed === 3), firstAttemptWon: seed !== 3, durationsMs: [120000], levels: [10] }])),
  })));
}

it('rejects identical class times and accepts 5% range at every chapter', () => {
  expect(checkTargetsV2(synthetic(0)).find((c) => c.id === 'class-spread')?.ok).toBe(false);
  expect(checkTargetsV2(synthetic(0.05)).find((c) => c.id === 'class-spread')?.ok).toBe(true);
  expect(checkTargetsV2(synthetic(0.029)).find((c) => c.id === 'class-spread')?.ok).toBe(false);
  const outside = synthetic(0.4);
  expect(checkTargetsV2(outside).find((c) => c.id === 'class-spread')?.ok).toBe(false);
});

it('enforces numeric ratios and each absolute guardrail on the override object', () => {
  expect(guardrailsCheckV2({ cat: { baseHp: 6000 } }).ok).toBe(false);
  expect(guardrailsCheckV2({ idle: { walkTimeMs: 6000 } }).ok).toBe(false);
  expect(guardrailsCheckV2({ idle: { walkTimeMs: 2001 } }).ok).toBe(false);
  expect(guardrailsCheckV2({ idle: { dailyKeys: 4 } }).ok).toBe(false);
  expect(guardrailsCheckV2({ idle: { dailyKeys: 5 } }).ok).toBe(false);
  expect(guardrailsCheckV2({ boss: { maxMs: 180001 } }).ok).toBe(false);
  expect(guardrailsCheckV2({ cat: { levelGrowth: 0.019 } }).ok).toBe(false);
  expect(guardrailsCheckV2({ cat: { baseHp: NaN } }).ok).toBe(false);
  expect(guardrailsCheckV2({ monster: { unknown: { hp: 30 } } } as unknown as ConfigOverridesV2).ok).toBe(false);
  expect(guardrailsCheckV2(PROPOSED_V2_OVERRIDES).ok).toBe(true);
});

it('rejects a six-second walk using current combat stats at every class start', () => {
  const samples = withConfigV2({ idle: { walkTimeMs: 6000 } }, () => CLASS_IDS.map((classId) => {
    const sample = sampleRoundV2(newPlayerV2(classId), 1, 1, 1);
    const fixture = synthetic(0.05).find((r) => r.classId === classId)!;
    return { ...fixture, roundSamples: { ...fixture.roundSamples, '1:1': sample } };
  }));
  expect(samples.every((r) => r.roundSamples['1:1']!.walkShare > 0.5)).toBe(true);
  expect(walkShareCheckV2(samples).ok).toBe(false);
  expect(V2_CONFIG.idle.walkTimeMs).toBe(1000);
});

it('requires first-attempt rates, complete attempts and bounded actual fight durations', () => {
  const rows = synthetic(0.05);
  const bossCheck = () => checkTargetsV2(rows).find((c) => c.id === 'boss-check')!.ok;
  expect(bossCheck()).toBe(true);
  rows[0]!.bosses[1]!.firstAttemptWon = false;
  expect(bossCheck()).toBe(false); // 1/3 is below 40%.
  rows[0]!.bosses[1]!.firstAttemptWon = true;
  rows[2]!.bosses[1]!.firstAttemptWon = true;
  expect(bossCheck()).toBe(false); // 3/3 is above 90%.
  rows[2]!.bosses[1]!.firstAttemptWon = null;
  expect(bossCheck()).toBe(false);
  rows[2]!.bosses[1]!.firstAttemptWon = false;
  rows[0]!.bosses[1]!.durationsMs = [180001];
  rows[1]!.bosses[1]!.durationsMs = [180001];
  expect(bossCheck()).toBe(false);
});

it('does not drop missing probes or wins from aggregate checks and percentiles', () => {
  const rows = synthetic(0.05);
  delete rows[0]!.roundSamples['3:5'];
  expect(walkShareCheckV2(rows).ok).toBe(false);
  expect(percentileV2([10, 20, 30, 40], 0.25)).toBe(17.5);
  expect(percentileV2([10, null, null], 0.5)).toBe(Infinity);
});

it('records first attempts, durations and probe entry levels without changing fight totals', () => {
  const result = simulateV2({ classId: 'warrior', seed: 1, maxActiveMinutes: 60 });
  expect(result.roundSamples['1:1']?.level).toBe(1);
  expect(Object.values(result.bosses).reduce((n, b) => n + b.fights, 0)).toBe(result.bossFights);
  expect(Object.values(result.bosses).reduce((n, b) => n + b.losses, 0)).toBe(result.bossLosses);
  for (const boss of Object.values(result.bosses)) {
    expect(boss.durationsMs).toHaveLength(boss.fights);
    expect(boss.levels).toHaveLength(boss.fights);
    expect(boss.levels.every((level) => level >= 1 && level <= V2_CONFIG.cat.maxLevel)).toBe(true);
    expect(boss.firstAttemptWon === null).toBe(boss.fights === 0);
  }
});

it('evaluates all entry equipment at the median level rather than selecting a level subset', () => {
  const rows = synthetic(0.05);
  for (const row of rows) for (const sample of Object.values(row.roundSamples)) {
    sample.level = row.seed; // Class median level is 2.
    sample.timeToKillByLevelMs[1] = row.seed === 2 ? 2000 : 500;
  }
  // The median-level run alone passes, but the median TTK across all gear sets fails.
  expect(walkShareCheckV2(rows).ok).toBe(false);
  for (const row of rows) for (const sample of Object.values(row.roundSamples)) sample.timeToKillByLevelMs[1] = 2000;
  expect(walkShareCheckV2(rows).ok).toBe(true);
});
