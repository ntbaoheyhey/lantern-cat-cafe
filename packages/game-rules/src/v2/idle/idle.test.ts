import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../config';
import { Rng } from '../../rng';
import { deriveStats, monsterAt, monsterFight, powerRating, stageOf } from '../combat';
import { CHAPTERS, GEAR_RARITIES, ITEMS, SMART_LOOT } from '../content';
import { V2_CONFIG } from '../config';
import { computeClaimV2, type ClaimDeltaV2, type ClaimInputV2 } from './index';
import { xpToNextV2 } from './claim';
import { binomial, keyCapacity } from './drops';

const initial = (overrides: Partial<ClaimInputV2> = {}): ClaimInputV2 => ({
  classId: 'warrior', level: 1, xp: 0, chapter: 1, round: 1, kills: 0, bestStage: 0,
  equipped: [], keysHeld: 0, lastDailyKeyDay: '2026-10-24', today: '2026-10-24', offline: false,
  ...overrides,
});
const geared = () => [
  { itemId: 'wpn.sword.ninelives', level: 50 },
  ...['helmet', 'armor', 'gloves', 'boots'].map((slot) => ({ itemId: `arm.cozy.${slot}.legendary`, level: 50 })),
];
const advance = (input: ClaimInputV2, delta: ClaimDeltaV2): ClaimInputV2 => ({
  ...input, ...delta.progress, keysHeld: input.keysHeld + (delta.stackDeltas.catKey ?? 0),
  lastDailyKeyDay: delta.dailyKeyDay ?? input.lastDailyKeyDay,
});
const totalXp = (level: number, xp: number) => {
  for (let previous = 1; previous < level; previous++) xp += xpToNextV2(previous);
  return xp;
};
const roundSeconds = (input: ClaimInputV2) => {
  const chapter = CHAPTERS.find((entry) => entry.index === input.chapter)!;
  const stats = deriveStats(input, input.equipped);
  let ms = 0;
  // This small reference loop is deliberately independent of the engine's bulk arithmetic.
  for (let kill = input.kills; kill < chapter.killsPerRound; kill++) {
    const monster = kill === chapter.killsPerRound - 1 ? chapter.elite : chapter.regulars[kill % chapter.regulars.length]!;
    ms += monsterFight(stats, monsterAt(monster, stageOf(input.chapter, input.round))).timeToKillMs + V2_CONFIG.idle.walkTimeMs;
  }
  return ms / 1000;
};

describe('computeClaimV2', () => {
  it('returns an empty delta for zero/negative/non-finite elapsed, including no daily key', () => {
    const input = initial({ lastDailyKeyDay: null });
    for (const elapsed of [0, -1, NaN, Infinity]) {
      const result = computeClaimV2(input, elapsed, 1);
      expect(result).toEqual({ progress: {
        level: 1, xp: 0, chapter: 1, round: 1, kills: 0, bestStage: 0,
      }, stackDeltas: {}, items: [], gated: false });
    }
  });

  it('uses analytic kill timing, the elite last, and registry kills per round', () => {
    for (const input of [initial(), initial({ chapter: 2, level: 60, equipped: geared() })]) {
      const duration = roundSeconds(input);
      const almost = computeClaimV2(input, duration - 0.001, 1);
      const full = computeClaimV2(input, duration, 1);
      const chapter = CHAPTERS.find((entry) => entry.index === input.chapter)!;
      expect(almost.progress.kills).toBe(chapter.killsPerRound - 1);
      expect(almost.progress.bestStage).toBe(0);
      expect(full.progress.bestStage).toBe(stageOf(input.chapter, 1));
      expect(full.progress.kills).toBe(chapter.killsPerRound);
    }
  });

  it('carries overflow XP and uses stage XP and Fish with archetype multipliers', () => {
    const input = initial({ xp: 55 });
    const result = computeClaimV2(input, roundSeconds(input), 7);
    expect(result.progress.level).toBe(2);
    expect(result.progress.xp).toBe(43); // 55 + 5x6 + 18 - 60
    expect(result.stackDeltas.fish).toBe(16); // 5x2 + 6
    expect(input.xp).toBe(55);
  });

  it('caps the cat level and clears XP at max level', () => {
    const input = initial({ level: 59, xp: xpToNextV2(59) - 1, equipped: geared() });
    const result = computeClaimV2(input, 300, 8);
    expect(result.progress.level).toBe(V2_CONFIG.cat.maxLevel);
    expect(result.progress.xp).toBe(0);
  });

  it('gates a weak cat in chapter 2, farms behind it, and reports higher needed power', () => {
    const input = initial({ chapter: 2, bestStage: 10 });
    const result = computeClaimV2(input, 300, 9);
    expect(result.gated).toBe(true);
    expect(result.neededPower).toBeGreaterThan(powerRating(deriveStats(input)));
    expect(result.progress).toMatchObject({ chapter: 2, round: 1, kills: 0, bestStage: 10 });
    expect(result.stackDeltas.fish).toBeGreaterThan(0);
    expect(result.progress.level).toBeGreaterThan(1);
    // The old chapter can drop keys, but chapter-2 materials cannot leak from the frontier.
    expect(result.stackDeltas.shinyButton).toBeUndefined();
  });

  it('detects an elite gate before paying out the easier regular monsters', () => {
    const input = initial({ chapter: 2 });
    const chapter = CHAPTERS[1]!;
    const stats = deriveStats(input);
    expect(monsterFight(stats, monsterAt(chapter.regulars[0]!, 11)).canWin).toBe(true);
    expect(monsterFight(stats, monsterAt(chapter.elite, 11)).canWin).toBe(false);
    const result = computeClaimV2(input, 1, 1);
    expect(result.gated).toBe(true);
    expect(result.progress.kills).toBe(0);
    expect(result.stackDeltas.fish).toBeUndefined();
  });

  it.each([false, true])('never fights or advances past the boss (offline=%s)', (offline) => {
    const input = initial({ level: 60, equipped: geared(), offline });
    const result = computeClaimV2(input, 8 * 3600, 4);
    expect(result.progress).toMatchObject({ chapter: 1, round: 10, kills: 6, bestStage: 10 });
    expect(result.gated).toBe(false);
    const ready = advance(input, result);
    expect(computeClaimV2(ready, 3600, 4).progress).toEqual(result.progress);
  });

  it('grants one daily key, records the UTC+7 date even at the cap, and never exceeds five', () => {
    for (const keysHeld of [0, 4, 5]) {
      const input = initial({ keysHeld, lastDailyKeyDay: '2026-10-23' });
      const result = computeClaimV2(input, 1, 1);
      expect(result.dailyKeyDay).toBe(input.today);
      expect(keysHeld + (result.stackDeltas.catKey ?? 0)).toBe(Math.min(5, keysHeld + 1));
      expect(computeClaimV2(advance(input, result), 1, 1).dailyKeyDay).toBeUndefined();
    }
    const input = initial({ chapter: 2, bestStage: 10, keysHeld: 4, lastDailyKeyDay: null });
    expect(computeClaimV2(input, 8 * 3600, 7).stackDeltas.catKey).toBe(1);
    expect(keyCapacity()).toBe(5);
  });

  it('drops random keys only in already-cleared chapters', () => {
    const input = initial({ level: 60, equipped: geared() });
    expect(computeClaimV2(input, 8 * 3600, 12).stackDeltas.catKey).toBeUndefined();
    expect(computeClaimV2({ ...input, bestStage: 20 }, 8 * 3600, 12).stackDeltas.catKey).toBeGreaterThan(0);
  });

  it('is deterministic, pure, and rolls valid catalog gear with smart loot', () => {
    const input = initial({ level: 60, equipped: geared(), bestStage: 20 });
    const before = JSON.parse(JSON.stringify(input)) as ClaimInputV2;
    const result = computeClaimV2(input, 8 * 3600, 100);
    expect(computeClaimV2(input, 8 * 3600, 100)).toEqual(result);
    expect(input).toEqual(before);
    expect(computeClaimV2(input, 8 * 3600, 101).items).not.toEqual(result.items);
    expect(result.stackDeltas.fluffTuft).toBeGreaterThan(0);
    expect(result.stackDeltas.catnipCrystal).toBeGreaterThan(0);
    expect(result.stackDeltas.shinyButton).toBeUndefined();
    const weapons = result.items.filter((item) => item.slot === 'weapon');
    expect(weapons.length).toBeGreaterThan(10);
    const ownShare = weapons.filter((item) => item.weaponType === 'sword').length / weapons.length;
    expect(Math.abs(ownShare - SMART_LOOT.classWeaponShare)).toBeLessThan(0.2);
    for (const item of result.items) {
      const def = ITEMS.find((entry) => entry.id === item.itemKey)!;
      const rarity = GEAR_RARITIES.find((entry) => entry.id === item.rarity)!;
      expect(def.slot).toBe(item.slot);
      expect(def.rarity).toBe(item.rarity);
      expect(def.dropChapters).toContain(1);
      expect(item.level).toBeLessThanOrEqual(rarity.maxLevel);
      expect(item.bonus).toHaveLength(rarity.bonusLines);
      expect(new Set(item.bonus.map((line) => line.stat)).size).toBe(item.bonus.length);
      expect(item).toMatchObject({ source: 'drop', equipped: false, locked: false });
    }
  });

  it('drops Shiny Buttons from chapter 2 monsters', () => {
    const input = initial({ chapter: 2, level: 60, equipped: geared() });
    expect(computeClaimV2(input, 8 * 3600, 7).stackDeltas.shinyButton).toBeGreaterThan(0);
  });

  it('splits offline XP and Fish totals within 1 percent without resetting an online window', () => {
    const input = initial({ level: 20, equipped: geared(), round: 10, kills: 6, bestStage: 10, offline: true });
    const whole = computeClaimV2(input, 8 * 3600, 1);
    const first = computeClaimV2(input, 4 * 3600, 2);
    const second = computeClaimV2(advance(input, first), 4 * 3600, 3);
    const startXp = totalXp(input.level, input.xp);
    const wholeXp = totalXp(whole.progress.level, whole.progress.xp) - startXp;
    const splitXp = totalXp(second.progress.level, second.progress.xp) - startXp;
    expect(wholeXp).toBeGreaterThan(0);
    expect(Math.abs(splitXp - wholeXp) / wholeXp).toBeLessThan(0.01);
    const splitFish = (first.stackDeltas.fish ?? 0) + (second.stackDeltas.fish ?? 0);
    expect(Math.abs(splitFish - whole.stackDeltas.fish!) / whole.stackDeltas.fish!).toBeLessThan(0.01);
  });

  it('splits an online claim within the imported online window within 1 percent', () => {
    const input = initial({ level: 20, equipped: geared(), round: 10, kills: 6, bestStage: 10 });
    const seconds = CONFIG.idle.onlineWindowSeconds;
    const whole = computeClaimV2(input, seconds, 1);
    const first = computeClaimV2(input, seconds / 2, 2);
    const second = computeClaimV2(advance(input, first), seconds / 2, 3);
    const startXp = totalXp(input.level, input.xp);
    const wholeXp = totalXp(whole.progress.level, whole.progress.xp) - startXp;
    const splitXp = totalXp(second.progress.level, second.progress.xp) - startXp;
    expect(Math.abs(splitXp - wholeXp) / wholeXp).toBeLessThan(0.01);
    const splitFish = (first.stackDeltas.fish ?? 0) + (second.stackDeltas.fish ?? 0);
    expect(Math.abs(splitFish - whole.stackDeltas.fish!) / whole.stackDeltas.fish!).toBeLessThan(0.01);
  });

  it('imports the v1 offline cap, efficiency and online window', () => {
    const input = initial({ level: 60, equipped: geared() });
    const cap = CONFIG.idle.offlineCapSeconds;
    expect(computeClaimV2(input, cap * 2, 1)).toEqual(computeClaimV2(input, cap, 1));
    const online = CONFIG.idle.onlineWindowSeconds;
    expect(computeClaimV2(input, online, 1)).toEqual(computeClaimV2({ ...input, offline: true }, online / CONFIG.idle.offlineEfficiency, 1));
    expect(computeClaimV2(input, online * 2, 1)).toEqual(computeClaimV2({ ...input, offline: true }, online / CONFIG.idle.offlineEfficiency + online, 1));
  });

  it('handles an eight-hour claim under 50 ms with a generous 150 ms CI ceiling', () => {
    const input = initial({ level: 60, equipped: geared() });
    computeClaimV2(input, 8 * 3600, 1); // JIT warm-up
    const start = Date.now();
    const result = computeClaimV2(input, 8 * 3600, 2);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(150);
    expect(result.stackDeltas.fish).toBeGreaterThan(0);
  });
});

describe('bulk binomial sampler', () => {
  it('has the expected mean and handles zero/certain/complement probabilities', () => {
    const rng = new Rng(8);
    expect(binomial(100, 0, rng)).toBe(0);
    expect(binomial(100, 1, rng)).toBe(100);
    expect(binomial(0, 0.5, rng)).toBe(0);
    for (const p of [1 / 150, 0.15, 0.8]) {
      let sum = 0;
      for (let run = 0; run < 1000; run++) sum += binomial(1000, p, rng);
      expect(Math.abs(sum / 1000 - 1000 * p)).toBeLessThan(1);
    }
  });
});

// V12: read-only gate inspection must agree with the existing claim engine.
describe('gateV2', () => {
  it('agrees with one-second claims for 200 seeded frontiers', async () => {
    const { gateV2 } = await import('./claim');
    const rng = new Rng(123);
    for (let n = 0; n < 200; n++) {
      const chapter = CHAPTERS[rng.int(0, CHAPTERS.length - 1)]!;
      const input = initial({ chapter: chapter.index, round: rng.int(1, chapter.roundsPerChapter), kills: rng.int(0, chapter.killsPerRound), level: rng.int(1, 60), equipped: rng.chance(0.5) ? geared() : [] });
      const delta = computeClaimV2(input, 1, 1);
      expect(gateV2(input)).toEqual({ gated: delta.gated, neededPower: delta.neededPower ?? 0 });
    }
  });
  it('reports a weak gate and treats the completed last round as boss-ready', async () => {
    const { gateV2 } = await import('./claim');
    const input = initial({ chapter: 3, round: 5 });
    expect(gateV2(input).gated).toBe(true);
    expect(gateV2(input).neededPower).toBeGreaterThan(powerRating(deriveStats(input, [])));
    expect(gateV2(initial({ round: 10, kills: CHAPTERS[0]!.killsPerRound }))).toEqual({ gated: false, neededPower: 0 });
  });
});
