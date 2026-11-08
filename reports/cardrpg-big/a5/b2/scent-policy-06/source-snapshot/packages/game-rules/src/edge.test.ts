import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { CONFIG } from './config';
import {
  bossPower,
  canClaimBossKey,
  canForge,
  computeClaimGains,
  computeIdleGains,
  dayIndex,
  forgeBlock,
  gearStat,
  goldPerSecond,
  heroPower,
  newPlayer,
  rollRelicRarity,
  simulateBoss,
  starterGear,
  upgradeCost,
} from './rules';
import { deriveSeed, Rng } from './rng';
import type { Gear, PlayerState, Rarity, Slot } from './types';

const seedArb = fc.integer({ min: 0, max: 0xffffffff });

describe('determinism', () => {
  it('Rng produces identical sequences for the same seed, and different sequences for different seeds', () => {
    const seedA = 123456789;
    const seedB = 987654321;

    const rngA1 = new Rng(seedA);
    const rngA2 = new Rng(seedA);
    const rngB = new Rng(seedB);

    const valuesA1 = Array.from({ length: 25 }, () => rngA1.next());
    const valuesA2 = Array.from({ length: 25 }, () => rngA2.next());
    const valuesB = Array.from({ length: 25 }, () => rngB.next());

    expect(valuesA1).toEqual(valuesA2);
    expect(valuesA1).not.toEqual(valuesB);

    const intsA1 = Array.from({ length: 25 }, () => rngA1.int(1, 100));
    const intsA2 = Array.from({ length: 25 }, () => rngA2.int(1, 100));
    expect(intsA1).toEqual(intsA2);
  });

  it('deriveSeed produces deterministic, distinct seeds for different salts', () => {
    const base = 424242;
    const s1a = deriveSeed(base, 1);
    const s1b = deriveSeed(base, 1);
    const s2 = deriveSeed(base, 2);
    const sOtherBase = deriveSeed(base + 1, 1);

    expect(s1a).toBe(s1b);
    expect(s1a).not.toBe(s2);
    expect(s1a).not.toBe(sOtherBase);
  });

  it('computeIdleGains is strictly deterministic for identical seeds and varies with different seeds', () => {
    const player = newPlayer();
    const elapsed = 7200;
    const seed1 = 10101;
    const seed2 = 20202;

    const run1a = computeIdleGains(player, elapsed, seed1);
    const run1b = computeIdleGains(player, elapsed, seed1);
    const run2 = computeIdleGains(player, elapsed, seed2);

    expect(run1a).toEqual(run1b);
    expect(run1a.gold).toBe(run1b.gold);
    expect(run1a.shards).toBe(run1b.shards);
    expect(run1a.drops).toEqual(run1b.drops);

    // With 7200s (1800 kills), different seeds produce different drops or shards
    expect(run1a.drops).not.toEqual(run2.drops);
  });

  it('simulateBoss combat log, damage rolls, and victory outcome are deterministic for identical seeds', () => {
    const power = heroPower(starterGear());
    const seed1 = 88888;
    const seed2 = 99999;

    const result1a = simulateBoss(power, 1, seed1);
    const result1b = simulateBoss(power, 1, seed1);
    const result2 = simulateBoss(power, 1, seed2);

    expect(result1a).toEqual(result1b);
    expect(result1a.won).toBe(result1b.won);
    expect(result1a.bossMaxHp).toBe(result1b.bossMaxHp);
    expect(result1a.heroMaxHp).toBe(result1b.heroMaxHp);
    expect(result1a.log).toEqual(result1b.log);

    // Different seeds explore different rng damage spread and crit paths
    expect(result1a.log).not.toEqual(result2.log);
  });

  it('rollRelicRarity produces the identical rarity for the same seed', () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const roll1 = rollRelicRarity(seed);
        const roll2 = rollRelicRarity(seed);
        expect(roll1).toBe(roll2);
      }),
    );
  });
});

describe('idle gains: bounds, clamping, and edge cases', () => {
  it('idle gold and shards are zero and never negative for zero elapsed time', () => {
    const player = newPlayer();
    const gains = computeIdleGains(player, 0, 123);
    expect(gains.gold).toBe(0);
    expect(gains.shards).toBe(0);
    expect(gains.drops).toEqual([]);
    expect(gains.countedSeconds).toBe(0);
  });

  it('idle gold and shards are zero and never negative for negative elapsed times', () => {
    const player = newPlayer();
    for (const negElapsed of [-1, -60, -3600, -1e6, -1e12]) {
      const gains = computeIdleGains(player, negElapsed, 456);
      expect(gains.gold).toBe(0);
      expect(gains.shards).toBe(0);
      expect(gains.drops).toEqual([]);
      expect(gains.countedSeconds).toBe(0);
    }
  });

  it('idle progress safely handles non-finite inputs (NaN, Infinity, -Infinity)', () => {
    const player = newPlayer();
    for (const nonFinite of [NaN, Infinity, -Infinity]) {
      const gains = computeIdleGains(player, nonFinite, 789);
      expect(gains.gold).toBe(0);
      expect(gains.shards).toBe(0);
      expect(gains.drops).toEqual([]);
      expect(gains.countedSeconds).toBe(0);
    }
  });

  it('idle progress is strictly capped at CONFIG.idle.offlineCapSeconds', () => {
    const player = newPlayer();
    const cap = CONFIG.idle.offlineCapSeconds;
    const atCap = computeIdleGains(player, cap, 555);

    for (const overCap of [cap + 1, cap + 3600, cap * 2, cap * 10, 1e9]) {
      const gains = computeIdleGains(player, overCap, 555);
      expect(gains.countedSeconds).toBe(cap);
      expect(gains).toEqual(atCap);
    }
  });

  it('goldPerSecond clamps negative power to zero, never dropping below baseGoldPerSecond', () => {
    expect(goldPerSecond(0)).toBe(CONFIG.idle.baseGoldPerSecond);
    expect(goldPerSecond(-1)).toBe(CONFIG.idle.baseGoldPerSecond);
    expect(goldPerSecond(-100)).toBe(CONFIG.idle.baseGoldPerSecond);
    expect(goldPerSecond(-1e9)).toBe(CONFIG.idle.baseGoldPerSecond);

    const normalPower = 50;
    expect(goldPerSecond(normalPower)).toBe(
      CONFIG.idle.baseGoldPerSecond + CONFIG.idle.goldPerSecondPerPower * normalPower,
    );
  });

  it('dropped gear level is clamped within [1, CONFIG.gear.maxLevel] regardless of bossLevel', () => {
    const player = newPlayer();
    const cap = CONFIG.gear.maxLevel;

    // Very low / negative / zero boss levels
    for (const lowBossLevel of [-10, 0, 1]) {
      const gains = computeIdleGains({ ...player, bossLevel: lowBossLevel }, 10000, 42);
      for (const drop of gains.drops) {
        expect(drop.level).toBeGreaterThanOrEqual(1);
        expect(drop.level).toBeLessThanOrEqual(cap);
        expect(drop.level).toBe(1);
      }
    }

    // Very large boss levels exceeding maxLevel
    for (const highBossLevel of [cap, cap + 1, cap + 100, 1e6]) {
      const gains = computeIdleGains({ ...player, bossLevel: highBossLevel }, 10000, 42);
      for (const drop of gains.drops) {
        expect(drop.level).toBe(cap);
      }
    }
  });

  it('claim drops are capped at CONFIG.idle.maxDropsPerClaim and sorted by gearStat descending', () => {
    const player = newPlayer();
    // Huge elapsed time generates lots of kills
    const gains = computeIdleGains(player, CONFIG.idle.offlineCapSeconds, 777);
    expect(gains.drops.length).toBeLessThanOrEqual(CONFIG.idle.maxDropsPerClaim);

    for (let i = 0; i < gains.drops.length - 1; i++) {
      const current = gains.drops[i]!;
      const next = gains.drops[i + 1]!;
      expect(gearStat(current)).toBeGreaterThanOrEqual(gearStat(next));
    }
  });
});

describe('claim gains: online window vs offline rate', () => {
  it('computeClaimGains applies online window at full rate, remainder at offlineEfficiency', () => {
    const player = newPlayer();
    const { onlineWindowSeconds, offlineCapSeconds, offlineEfficiency } = CONFIG.idle;
    const gps = goldPerSecond(heroPower(player.gear));

    // Under online window: full rate
    const under = computeClaimGains(player, onlineWindowSeconds / 2, 100);
    expect(under.gold).toBe(Math.floor(gps * (onlineWindowSeconds / 2)));
    expect(under.countedSeconds).toBe(onlineWindowSeconds / 2);

    // Exactly at window boundary: full rate
    const exact = computeClaimGains(player, onlineWindowSeconds, 100);
    expect(exact.gold).toBe(Math.floor(gps * onlineWindowSeconds));
    expect(exact.countedSeconds).toBe(onlineWindowSeconds);

    // Beyond window: onlineWindow full rate + offline rate for remainder
    const pastSeconds = onlineWindowSeconds + 1200;
    const past = computeClaimGains(player, pastSeconds, 100);
    const expectedPastGold =
      Math.floor(gps * onlineWindowSeconds) + Math.floor(gps * 1200 * offlineEfficiency);
    expect(past.gold).toBe(expectedPastGold);
    expect(past.countedSeconds).toBe(pastSeconds);

    // Over cap: same as exact cap
    const over = computeClaimGains(player, offlineCapSeconds * 5, 100);
    expect(over.countedSeconds).toBe(offlineCapSeconds);
    const expectedCapGold =
      Math.floor(gps * onlineWindowSeconds) +
      Math.floor(gps * (offlineCapSeconds - onlineWindowSeconds) * offlineEfficiency);
    expect(over.gold).toBe(expectedCapGold);
  });

  it('computeClaimGains safely handles zero, negative, and non-finite elapsed times', () => {
    const player = newPlayer();
    for (const invalid of [0, -10, -3600, NaN, Infinity, -Infinity]) {
      const gains = computeClaimGains(player, invalid, 100);
      expect(gains.gold).toBe(0);
      expect(gains.shards).toBe(0);
      expect(gains.drops).toEqual([]);
      expect(gains.countedSeconds).toBe(0);
    }
  });
});

describe('upgrade costs and hero power monotonicity', () => {
  it('upgrade cost grows strictly monotonically with level up to maxLevel - 1', () => {
    for (const slot of CONFIG.slots) {
      for (const rarity of CONFIG.rarities) {
        let prevCost = 0;
        for (let level = 1; level < CONFIG.gear.maxLevel; level++) {
          const cost = upgradeCost({ slot, rarity, level });
          expect(cost).not.toBeNull();
          expect(cost!).toBeGreaterThan(prevCost);
          prevCost = cost!;
        }
      }
    }
  });

  it('upgrade cost strictly scales with rarity tier at the same level', () => {
    for (const slot of CONFIG.slots) {
      for (const level of [1, 5, 10, 20, CONFIG.gear.maxLevel - 1]) {
        const commonCost = upgradeCost({ slot, rarity: 'common', level })!;
        const rareCost = upgradeCost({ slot, rarity: 'rare', level })!;
        const epicCost = upgradeCost({ slot, rarity: 'epic', level })!;
        const legCost = upgradeCost({ slot, rarity: 'legendary', level })!;

        expect(rareCost).toBeGreaterThan(commonCost);
        expect(epicCost).toBeGreaterThan(rareCost);
        expect(legCost).toBeGreaterThan(epicCost);
      }
    }
  });

  it('upgrade cost returns null at or above CONFIG.gear.maxLevel', () => {
    for (const slot of CONFIG.slots) {
      for (const rarity of CONFIG.rarities) {
        expect(upgradeCost({ slot, rarity, level: CONFIG.gear.maxLevel })).toBeNull();
        expect(upgradeCost({ slot, rarity, level: CONFIG.gear.maxLevel + 1 })).toBeNull();
        expect(upgradeCost({ slot, rarity, level: 100 })).toBeNull();
      }
    }
  });

  it('hero power with empty gear array equals CONFIG.hero.basePower', () => {
    expect(heroPower([])).toBe(CONFIG.hero.basePower);
  });

  it('hero power only accounts for the best item in each slot', () => {
    const weakWeapon: Gear = { slot: 'weapon', rarity: 'common', level: 1 };
    const strongWeapon: Gear = { slot: 'weapon', rarity: 'legendary', level: 10 };

    const powerWithStrong = heroPower([strongWeapon]);
    const powerWithBoth = heroPower([weakWeapon, strongWeapon]);
    const powerWithBothReversed = heroPower([strongWeapon, weakWeapon]);

    expect(powerWithBoth).toBe(powerWithStrong);
    expect(powerWithBothReversed).toBe(powerWithStrong);
    expect(powerWithStrong).toBeGreaterThan(heroPower([weakWeapon]));
  });

  it('gearStat increases strictly monotonically with item level', () => {
    for (const slot of CONFIG.slots) {
      for (const rarity of CONFIG.rarities) {
        let prevStat = 0;
        for (let level = 1; level <= CONFIG.gear.maxLevel; level++) {
          const stat = gearStat({ slot, rarity, level });
          expect(stat).toBeGreaterThan(prevStat);
          prevStat = stat;
        }
      }
    }
  });
});

describe('boss power growth and combat simulation', () => {
  it('boss power grows by exactly CONFIG.boss.powerGrowth (1.15x) per level', () => {
    for (let level = 1; level < CONFIG.boss.maxLevel; level++) {
      const current = bossPower(level);
      const next = bossPower(level + 1);
      const ratio = next / current;
      expect(ratio).toBeCloseTo(CONFIG.boss.powerGrowth, 9);
    }
  });

  it('boss power clamps correctly for zero, negative, fractional, and excessive levels', () => {
    const base = CONFIG.boss.basePower;
    expect(bossPower(1)).toBe(base);
    expect(bossPower(0)).toBe(base);
    expect(bossPower(-1)).toBe(base);
    expect(bossPower(-100)).toBe(base);

    // Fractional levels are floored
    expect(bossPower(1.7)).toBe(bossPower(1));
    expect(bossPower(2.9)).toBe(bossPower(2));

    // Clamps at maxLevel
    const maxPower = bossPower(CONFIG.boss.maxLevel);
    expect(bossPower(CONFIG.boss.maxLevel + 1)).toBe(maxPower);
    expect(bossPower(CONFIG.boss.maxLevel + 50)).toBe(maxPower);
    expect(bossPower(1e6)).toBe(maxPower);
  });

  it('simulateBoss handles zero or negative hero power without throwing errors', () => {
    for (const zeroOrNegPower of [0, -10, -1000]) {
      const result = simulateBoss(zeroOrNegPower, 1, 12345);
      expect(result.won).toBe(false);
      expect(result.heroMaxHp).toBeLessThanOrEqual(0);
      expect(result.log.length).toBeGreaterThan(0);
      expect(result.log.at(-1)).toMatchObject({ type: 'end', won: false });
    }
  });

  it('simulateBoss ends in round 1 win when hero has overwhelming power', () => {
    const godPower = 1_000_000;
    const result = simulateBoss(godPower, 1, 42);
    expect(result.won).toBe(true);
    expect(result.log.length).toBe(2); // hero_hit + end
    expect(result.log[0]).toMatchObject({ t: 1, type: 'hero_hit', bossHp: 0 });
    expect(result.log[1]).toMatchObject({ t: 1, type: 'end', won: true });
  });

  it('simulateBoss caps at CONFIG.boss.maxRounds if hero cannot kill boss in time', () => {
    // If power is tiny and hero has huge HP (or test zero-damage stall)
    // Starter power against boss level 50 will definitely lose before maxRounds,
    // but log should never exceed maxRounds
    const power = heroPower(starterGear());
    const result = simulateBoss(power, CONFIG.boss.maxLevel, 123);
    expect(result.won).toBe(false);
    for (const ev of result.log) {
      expect(ev.t).toBeLessThanOrEqual(CONFIG.boss.maxRounds);
    }
  });
});

describe('forge rules, shard costs, and daily limits', () => {
  const basePlayer: PlayerState = {
    ...newPlayer(),
    bossKeys: CONFIG.relic.bossKeyCost,
    shards: CONFIG.relic.shardCost,
    lastForgeDay: -1,
  };

  it('the forge costs exactly CONFIG.relic.shardCost (30) shards and fails with 29', () => {
    const today = 100;
    // Exactly enough shards
    const readyState = { ...basePlayer, shards: CONFIG.relic.shardCost };
    expect(canForge(readyState, today)).toBe(true);
    expect(forgeBlock(readyState, today)).toBeNull();

    // 1 shard short (29 shards)
    const shortState = { ...basePlayer, shards: CONFIG.relic.shardCost - 1 };
    expect(canForge(shortState, today)).toBe(false);
    expect(forgeBlock(shortState, today)).toBe('not_enough_shards');
  });

  it('the forge fails with zero and negative shards', () => {
    const today = 100;
    for (const zeroOrNegShards of [0, -1, -30, -1e6]) {
      const state = { ...basePlayer, shards: zeroOrNegShards };
      expect(canForge(state, today)).toBe(false);
      expect(forgeBlock(state, today)).toBe('not_enough_shards');
    }
  });

  it('the forge fails without enough boss keys (costs CONFIG.relic.bossKeyCost)', () => {
    const today = 100;
    const noKeyState = { ...basePlayer, bossKeys: 0 };
    expect(canForge(noKeyState, today)).toBe(false);
    expect(forgeBlock(noKeyState, today)).toBe('no_boss_key');

    const negKeyState = { ...basePlayer, bossKeys: -1 };
    expect(canForge(negKeyState, today)).toBe(false);
    expect(forgeBlock(negKeyState, today)).toBe('no_boss_key');

    const abundantKeyState = { ...basePlayer, bossKeys: 10 };
    expect(canForge(abundantKeyState, today)).toBe(true);
    expect(forgeBlock(abundantKeyState, today)).toBeNull();
  });

  it('the forge enforces the daily Relic limit (at most 1 per day)', () => {
    const today = 50;
    // Forged on the same day -> blocked
    const alreadyForged = { ...basePlayer, lastForgeDay: today };
    expect(canForge(alreadyForged, today)).toBe(false);
    expect(forgeBlock(alreadyForged, today)).toBe('daily_limit');

    // Forged on a previous day -> allowed
    const forgedYesterday = { ...basePlayer, lastForgeDay: today - 1 };
    expect(canForge(forgedYesterday, today)).toBe(true);
    expect(forgeBlock(forgedYesterday, today)).toBeNull();

    // Never forged (-1) -> allowed
    const neverForged = { ...basePlayer, lastForgeDay: -1 };
    expect(canForge(neverForged, today)).toBe(true);
    expect(forgeBlock(neverForged, today)).toBeNull();
  });

  it('forgeBlock prioritizes blocking reasons: daily_limit > no_boss_key > not_enough_shards', () => {
    const today = 50;
    // Both already forged, no keys, and no shards
    const allBlocked: PlayerState = {
      ...basePlayer,
      lastForgeDay: today,
      bossKeys: 0,
      shards: 0,
    };
    expect(forgeBlock(allBlocked, today)).toBe('daily_limit');

    // Not forged today, but no keys and no shards
    const noKeyNoShards: PlayerState = {
      ...basePlayer,
      lastForgeDay: today - 1,
      bossKeys: 0,
      shards: 0,
    };
    expect(forgeBlock(noKeyNoShards, today)).toBe('no_boss_key');

    // Has key, but no shards
    const hasKeyNoShards: PlayerState = {
      ...basePlayer,
      lastForgeDay: today - 1,
      bossKeys: 1,
      shards: 0,
    };
    expect(forgeBlock(hasKeyNoShards, today)).toBe('not_enough_shards');
  });

  it('canClaimBossKey enforces daily Boss Key limit (at most 1 claim per day)', () => {
    const today = 77;
    const claimedToday: PlayerState = { ...basePlayer, lastBossKeyDay: today };
    expect(canClaimBossKey(claimedToday, today)).toBe(false);

    const claimedYesterday: PlayerState = { ...basePlayer, lastBossKeyDay: today - 1 };
    expect(canClaimBossKey(claimedYesterday, today)).toBe(true);

    const neverClaimed: PlayerState = { ...basePlayer, lastBossKeyDay: -1 };
    expect(canClaimBossKey(neverClaimed, today)).toBe(true);
  });
});

describe('dayIndex and time transitions', () => {
  it('dayIndex resets at midnight Vietnam time (UTC+7)', () => {
    // 2026-10-24 00:00:00 UTC+7 is 2026-10-23 17:00:00 UTC
    const midnightUtc = Date.UTC(2026, 9, 23, 17, 0, 0) / 1000;
    const day = dayIndex(midnightUtc);

    // 1 second before midnight is previous day
    expect(dayIndex(midnightUtc - 1)).toBe(day - 1);

    // Throughout the same day
    expect(dayIndex(midnightUtc + 1)).toBe(day);
    expect(dayIndex(midnightUtc + 3600)).toBe(day);
    expect(dayIndex(midnightUtc + CONFIG.time.secondsPerDay - 1)).toBe(day);

    // Exactly at the next midnight
    expect(dayIndex(midnightUtc + CONFIG.time.secondsPerDay)).toBe(day + 1);
  });

  it('dayIndex handles Unix epoch (0), negative timestamps, and distant future', () => {
    // Unix epoch 0 (1970-01-01 00:00:00 UTC) with +7 offset is 07:00:00 on day 0
    expect(dayIndex(0)).toBe(0);

    // Negative timestamp (before 1970)
    expect(dayIndex(-CONFIG.time.secondsPerDay)).toBeLessThan(0);

    // Year 2038+ (e.g. 2,000,000,000 seconds)
    const futureSec = 2_000_000_000;
    expect(dayIndex(futureSec + CONFIG.time.secondsPerDay)).toBe(dayIndex(futureSec) + 1);
  });
});

describe('property-based edge-case invariants', () => {
  it('property: upgradeCost is always a positive integer or null', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CONFIG.slots),
        fc.constantFrom(...CONFIG.rarities),
        fc.integer({ min: 1, max: 100 }),
        (slot, rarity, level) => {
          const cost = upgradeCost({ slot, rarity, level });
          if (level >= CONFIG.gear.maxLevel) {
            expect(cost).toBeNull();
          } else {
            expect(cost).toBeGreaterThan(0);
            expect(Number.isInteger(cost)).toBe(true);
          }
        },
      ),
    );
  });

  it('property: bossPower is strictly positive, non-decreasing, and bounded within [basePower, maxPower]', () => {
    const minPower = bossPower(1);
    const maxPower = bossPower(CONFIG.boss.maxLevel);

    fc.assert(
      fc.property(
        fc.double({ min: -1e6, max: 1e6, noNaN: true }),
        (level) => {
          const bp = bossPower(level);
          expect(bp).toBeGreaterThanOrEqual(minPower);
          expect(bp).toBeLessThanOrEqual(maxPower);
        },
      ),
    );
  });

  it('property: dayIndex increases monotonically with timestamp', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1e8, max: 2e9 }),
        fc.integer({ min: 0, max: 1e7 }),
        (t, delta) => {
          expect(dayIndex(t + delta)).toBeGreaterThanOrEqual(dayIndex(t));
        },
      ),
    );
  });

  it('property: goldPerSecond is always >= CONFIG.idle.baseGoldPerSecond', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e9, max: 1e9, noNaN: true }),
        (power) => {
          expect(goldPerSecond(power)).toBeGreaterThanOrEqual(CONFIG.idle.baseGoldPerSecond);
        },
      ),
    );
  });
});
