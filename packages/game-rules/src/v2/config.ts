/**
 * Tunable numbers for Cat RPG v2. Never hard-code these in logic. Starting values come from the
 * approved plan; V6 (balance simulation) owns this file's final numbers and the user signs them off.
 * Times are in milliseconds unless the name says Seconds.
 */
export const V2_CONFIG = {
  cat: {
    /** Stats of a level 1 cat before class multipliers. */
    baseHp: 100,
    baseAtk: 10,
    baseDef: 5,
    /** Base stats grow by this much per level above 1 (compounding). */
    levelGrowth: 0.06,
    maxLevel: 60,
    /** Item stats grow by this much of the base per item level above 1 (linear). */
    itemLevelGrowth: 0.07,
    /** XP to next level: xpBase x xpGrowth^(L-1). Used by idle (V3). */
    xpBase: 60,
    xpGrowth: 1.12,
  },

  /** Limits so stacked bonuses cannot break the formulas. */
  caps: {
    critChance: 0.75,
    dodge: 0.6,
    attackSpeed: 1,
    hpRegen: 0.05,
    minAttackIntervalMs: 200,
  },

  damage: {
    /** damage = atk x defScale / (defScale + def). */
    defScale: 100,
    /** Every hit that lands deals at least this much. */
    minDamage: 1,
  },

  /** Monster numbers at stage s (1..50): value = base x growth^(s-1). */
  monster: {
    hpBase: 30,
    hpGrowth: 1.13,
    atkBase: 4,
    atkGrowth: 1.12,
    xpBase: 6,
    xpGrowth: 1.11,
    fishBase: 2,
    fishGrowth: 1.1,
    /** Monster DEF at stage s: defBase + defStep x (s-1). */
    defBase: 2,
    defStep: 0.5,
    attackIntervalMs: 1500,
  },

  boss: {
    /** Normal boss attack: telegraph, then impact. */
    attackIntervalMs: 1500,
    windupMs: 400,
    /** The big attack lands every bigEveryMs; its telegraph starts bigWindupMs before. */
    bigEveryMs: 6000,
    bigWindupMs: 1000,
    bigMultiplier: 2.5,
    /** The fight ends as a loss after this long. */
    maxMs: 60000,
  },

  /** Hit offsets of a volley's extra arrows after the first arrow's hit (Archer). */
  volleyStaggerMs: 60,
} as const;

export type V2Config = typeof V2_CONFIG;
