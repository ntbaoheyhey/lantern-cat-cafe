import { RARITY_IDS, SLOT_IDS } from './content';

/**
 * ALL tunable numbers for Taskbar Hero live here. Signed off by the user on 2026-10-23
 * (boss.powerGrowth 1.15 and relic.shardCost 30 changed at sign-off; the rest kept).
 * Time is always in seconds. Docs: docs/game-rules.md (keep in sync).
 */
export const CONFIG = {
  /** Gear slots, in display order (content.ts). */
  slots: SLOT_IDS,
  /** Rarity tiers, lowest to highest (content.ts). */
  rarities: RARITY_IDS,

  hero: {
    /** Power of a naked hero. */
    basePower: 10,
    /** Hero hit points per point of power (boss fight). */
    hpPerPower: 12,
    /** Damage per second per point of power (boss fight). */
    damagePerPower: 1,
    /** Chance of a critical hit per boss-fight round. */
    critChance: 0.15,
    /** Damage multiplier on a critical hit. */
    critMultiplier: 2,
  },

  gear: {
    /** Base stat (power) of a level 1 Common item, per slot. */
    baseStat: { weapon: 8, helm: 4, armor: 5, ring: 3 },
    /** Stat multiplier per rarity. */
    rarityMultiplier: { common: 1, rare: 1.6, epic: 2.6, legendary: 4.2 },
    /** Extra stat per item level above 1, as a fraction of the base stat. */
    levelGrowth: 0.12,
    /** Highest item level (drops and upgrades). */
    maxLevel: 30,
    /** Gold to upgrade an item from level 1 to 2. */
    upgradeBaseCost: 25,
    /** Cost growth per level. */
    upgradeCostGrowth: 1.3,
    /** Gold cost multiplier per rarity (better items cost more to upgrade). */
    upgradeRarityCostMultiplier: { common: 1, rare: 1.5, epic: 2.5, legendary: 4 },
  },

  idle: {
    /** Gold per second with zero power. */
    baseGoldPerSecond: 1,
    /** Extra gold per second per point of power. */
    goldPerSecondPerPower: 0.1,
    /** Seconds per enemy kill. Drops and shards roll once per kill. */
    secondsPerKill: 4,
    /** Maximum seconds of progress counted in one claim. */
    offlineCapSeconds: 8 * 3600,
    /** Share of gold/shards/drops earned while offline (0..1). */
    offlineEfficiency: 0.5,
    /** Seconds at the start of each claim paid at the full rate; the rest is offline. */
    onlineWindowSeconds: 5 * 60,
    /** Chance a kill drops a gear item. */
    gearDropChance: 0.05,
    /** Chance a kill drops shards. */
    shardDropChance: 0.1,
    /** Shards dropped when a shard drop happens. */
    shardsPerDrop: 1,
    /** Max gear items returned from a single claim (best kept). */
    maxDropsPerClaim: 40,
    /** Gear drop rarity weights (relative, need not sum to 1). */
    dropRarityWeights: { common: 70, rare: 22, epic: 7, legendary: 1 },
  },

  boss: {
    /** Boss power at level 1. */
    basePower: 62,
    /** Boss power growth per level (multiplicative). */
    powerGrowth: 1.15,
    /** Boss hit points per point of boss power. */
    hpPerPower: 14,
    /** Boss damage per second per point of boss power. */
    damagePerPower: 1,
    /** Damage roll spread, each round multiplied by 1 +/- this. */
    damageSpread: 0.2,
    /** Fight is lost if the boss survives this many rounds (1 round = 1 s). */
    maxRounds: 60,
    /** Highest boss level. */
    maxLevel: 50,
    /** Boss fights allowed per day (UTC+7). */
    maxAttemptsPerDay: 5,
  },

  relic: {
    /** Shards needed to forge one Relic. */
    shardCost: 30,
    /** Boss Keys needed to forge one Relic. */
    bossKeyCost: 1,
    /** Rarity odds in basis points (1/100 of a percent); must sum to 10000. */
    rarityOddsBp: { common: 6000, rare: 2800, epic: 1000, legendary: 200 },
  },

  time: {
    /** Seconds per forge/boss-key day. */
    secondsPerDay: 86400,
    /** The day resets at midnight Vietnam time (UTC+7). */
    dayOffsetSeconds: 7 * 3600,
  },

  /** Tuning-target check used by tests: active play window in seconds. */
  tuning: {
    targetMinSeconds: 10 * 60,
    targetMaxSeconds: 15 * 60,
    minWinProbability: 0.5,
  },
} as const;

export type Config = typeof CONFIG;
