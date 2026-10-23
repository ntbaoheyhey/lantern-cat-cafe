import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  dayIndex,
  CONFIG,
  GAME_VERSION,
  bossPower,
  canForge,
  computeIdleGains,
  deriveSeed,
  heroPower,
  newPlayer,
  powerAfter,
  relicOdds,
  rollRelicRarity,
  simulateBoss,
  starterGear,
} from './index';

const seedArb = fc.integer({ min: 0, max: 0xffffffff });

describe('game-rules', () => {
  it('exposes a version', () => {
    expect(GAME_VERSION).toBe('0.1.0');
  });

  it('offline gain stops at the cap', () => {
    const p = newPlayer();
    const cap = CONFIG.idle.offlineCapSeconds;
    const at = computeIdleGains(p, cap, 7, { offline: true });
    const way = computeIdleGains(p, cap * 10, 7, { offline: true });
    expect(way).toEqual(at);
    expect(way.countedSeconds).toBe(cap);
  });

  it('same seed gives same loot, different seeds differ', () => {
    const p = newPlayer();
    const a = computeIdleGains(p, 20000, 42);
    expect(computeIdleGains(p, 20000, 42)).toEqual(a);
    expect(computeIdleGains(p, 20000, 43)).not.toEqual(a);
  });

  it('boss sim is deterministic for same seed and gear', () => {
    const power = heroPower(starterGear());
    const a = simulateBoss(power, 1, 9);
    expect(simulateBoss(power, 1, 9)).toEqual(a);
    expect(a.log.at(-1)).toMatchObject({ type: 'end', won: a.won });
  });

  it('stronger boss levels need more power', () => {
    expect(bossPower(2)).toBeGreaterThan(bossPower(1));
  });

  it('gold, shards and drops never negative (property)', () => {
    fc.assert(
      fc.property(
        seedArb,
        fc.double({ min: -1e6, max: 1e9, noNaN: true }),
        fc.boolean(),
        fc.integer({ min: 1, max: 50 }),
        (seed, elapsed, offline, bossLevel) => {
          const g = computeIdleGains({ gear: starterGear(), bossLevel }, elapsed, seed, { offline });
          expect(g.gold).toBeGreaterThanOrEqual(0);
          expect(g.shards).toBeGreaterThanOrEqual(0);
          expect(g.drops.length).toBeLessThanOrEqual(CONFIG.idle.maxDropsPerClaim);
          expect(g.countedSeconds).toBeLessThanOrEqual(CONFIG.idle.offlineCapSeconds);
        },
      ),
    );
  });

  it('rarity odds sum to 1 and rolls are valid and deterministic', () => {
    const sum = Object.values(relicOdds()).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 12);
    fc.assert(
      fc.property(seedArb, (s) => {
        expect(CONFIG.rarities).toContain(rollRelicRarity(s));
        expect(rollRelicRarity(s)).toBe(rollRelicRarity(s));
      }),
    );
  });

  it('rarity roll frequencies roughly match odds', () => {
    const n = 20000;
    const counts: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      const r = rollRelicRarity(deriveSeed(1, i));
      counts[r] = (counts[r] ?? 0) + 1;
    }
    const odds = relicOdds();
    for (const r of CONFIG.rarities) expect((counts[r] ?? 0) / n).toBeCloseTo(odds[r], 1);
  });

  it('canForge enforces key, shards, and one per day', () => {
    const p = { ...newPlayer(), bossKeys: 1, shards: CONFIG.relic.shardCost };
    expect(canForge(p, 5)).toBe(true);
    expect(canForge({ ...p, bossKeys: 0 }, 5)).toBe(false);
    expect(canForge({ ...p, shards: p.shards - 1 }, 5)).toBe(false);
    expect(canForge({ ...p, lastForgeDay: 5 }, 5)).toBe(false);
    expect(canForge({ ...p, lastForgeDay: 4 }, 5)).toBe(true);
  });

  it('tuning: starter beats boss 1 with p >= 50% within 10-15 active minutes', () => {
    const { targetMinSeconds, targetMaxSeconds, minWinProbability } = CONFIG.tuning;
    const runs = 20;
    const fights = 100;
    const winRate = (secs: number) => {
      let wins = 0;
      for (let r = 0; r < runs; r++) {
        const power = powerAfter(1000 + r, secs);
        for (let f = 0; f < fights; f++) {
          if (simulateBoss(power, 1, deriveSeed(r, f)).won) wins++;
        }
      }
      return wins / (runs * fights);
    };
    // Not trivial at the very start, but beatable by the end of the window.
    expect(winRate(0)).toBeLessThan(minWinProbability);
    expect(winRate(targetMaxSeconds)).toBeGreaterThanOrEqual(minWinProbability);
    // Should not be beatable well before the window opens.
    expect(winRate(targetMinSeconds / 2)).toBeLessThan(minWinProbability);
  });
});

describe('day boundary', () => {
  it('resets at midnight Vietnam time (UTC+7)', () => {
    const vnMidnight = Date.UTC(2026, 10, 20, 17, 0, 0) / 1000; // 2026-11-21 00:00 UTC+7
    expect(dayIndex(vnMidnight - 1)).toBe(dayIndex(vnMidnight) - 1);
    expect(dayIndex(vnMidnight + 23 * 3600)).toBe(dayIndex(vnMidnight));
  });
});
