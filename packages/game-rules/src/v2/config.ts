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

  /** Idle-only tuning; v1 time windows/rates are imported by the claim engine. */
  idle: {
    walkTimeMs: 1000,
    maxRoundsPerClaim: 4096,
    /** Yarn per kill = base x growth^(stage-1) x monster.lootMul. */
    yarnBase: 0.1,
    yarnGrowth: 1.1,
    dailyKeys: 1,
    clearedChapterKeyChance: 1 / 150,
    /** The current material registry has no monster sources; keep them here until it does. */
    materialDrops: [
      { id: 'fluffTuft', fromChapter: 1, eliteOnly: false, chance: 0.15 },
      { id: 'shinyButton', fromChapter: 2, eliteOnly: false, chance: 0.04 },
      { id: 'catnipCrystal', fromChapter: 1, eliteOnly: true, chance: 0.005 },
    ],
    gearDropChance: 0.02,
    gearRarityWeights: { common: 70, uncommon: 20, rare: 8, epic: 1.8, legendary: 0.2 },
    /** Used only for the UI estimate, by scaling HP/ATK/DEF until the round is winnable. */
    powerSearchSteps: 20,
    powerSearchMaxScale: 1024,
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

  chapters: {
    /** Kills to finish a round, per chapter (index 0 = chapter 1). The last kill is the elite. */
    killsPerRound: [6, 10, 10, 10, 10],
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
    /** Keys a boss win spends (a loss spends none). */
    keyCost: 1,
    /** One cooldown per player after a lost boss fight, in seconds (schema-v2.md question 2). */
    lossCooldownSeconds: 60,
    /** Boss HP multiplier per chapter on top of the stage formula (was ARCHETYPE.boss 40 for all). */
    chapterHpMul: [40, 40, 40, 40, 40],
    /** Boss ATK multiplier per chapter on top of the stage formula (was ARCHETYPE.boss 2.5 for all). */
    chapterAtkMul: [2.5, 2.5, 2.5, 2.5, 2.5],
    /** Cat Keys added to the FIRST-clear chest of each boss (D1 = S-B). Rematch chests never get one. 0 = off. */
    firstClearKeys: 0,
  },

  /** Bag size (approved in docs/proposals/schema-v2.md) and the point where the UI warns it is nearly full. */
  bag: {
    limit: 200,
    nearFullRatio: 0.9,
  },

  /** Hit offsets of a volley's extra arrows after the first arrow's hit (Archer). */
  volleyStaggerMs: 60,
} as const;

export type V2Config = typeof V2_CONFIG;
