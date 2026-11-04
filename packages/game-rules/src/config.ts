import { RARITY_IDS, SLOT_IDS } from './content';

/**
 * Classic tunables were signed off by the user on 2026-10-23
 * (boss.powerGrowth 1.15 and relic.shardCost 30 changed at sign-off; the rest kept).
 * Classic time is in seconds. Docs: docs/game-rules.md (keep in sync).
 * ORIG1 is a separate default-off draft; timing units are explicit in docs/design/original-economy.md.
 */
export const CONFIG = {
  /** ORIG1 gameplay remains OFF. The local catalog uses this default and opts in without changing it. */
  features: { originalEconomy: false },
  /** Original draft tables; see docs/design/original-economy.md for units and rationale. */
  originalEconomy: {
    revision: 'orig1-2026-11-02',
    stats: {
      hp: { name: 'Ninefold Stamina', description: 'How much punishment a cat can carry before resting.', base: 116, cap: null, unit: 'points' },
      atk: { name: 'Pawprint Force', description: 'The starting strength of one landed hit.', base: 12, cap: null, unit: 'points' },
      def: { name: 'Quiltguard', description: 'Padding that softens each incoming hit.', base: 7, cap: null, unit: 'rating' },
      attackSpeed: { name: 'Quickstep Rhythm', description: 'Shortens the pause between ordinary attacks.', base: 0, cap: 0.65, unit: 'fraction' },
      critChance: { name: 'Glint Focus', description: 'The share of hits that find a bright opening.', base: 0.035, cap: 0.42, unit: 'probability' },
      critDamage: { name: 'Flare Payoff', description: 'Extra damage above a normal hit when an opening is found.', base: 0.55, cap: 1.1, unit: 'fraction' },
      dodge: { name: 'Threadstep', description: 'The chance to slip entirely past an incoming hit.', base: 0.02, cap: 0.28, unit: 'probability' },
      hpRegen: { name: 'Purr Reserve', description: 'The fraction of full stamina restored each second.', base: 0, cap: 0.012, unit: 'fraction/second' },
      fishBonus: { name: 'Pantry Yield', description: 'Adds a share to fish earned from encounters.', base: 0, cap: 0.24, unit: 'fraction' },
      xpBonus: { name: 'Trail Memory', description: 'Adds a share to experience earned from encounters.', base: 0, cap: 0.2, unit: 'fraction' },
      materialFind: { name: 'Pocket Scouting', description: 'Raises material roll chances without changing gear quality.', base: 0, cap: 0.18, unit: 'fraction' },
      bossDamage: { name: 'Gate Pressure', description: 'Adds a share of damage against the chapter guardian.', base: 0, cap: 0.22, unit: 'fraction' },
    },
    combat: { attackIntervalMs: 1250, defenseScale: 90, minDamage: 1 },
    gear: {
      maxLevel: 6,
      levelGrowth: 0.055,
      /** Fish to buy levels 2..6, before quality cost scaling; round up once. */
      upgradeFish: [18, 29, 47, 76, 123],
      /** Quality weights are conditional on receiving gear; basis points total 10000. */
      qualities: {
        common: { name: 'Hearthmade', multiplier: 1, costMultiplier: 1, weightBp: 6250 },
        uncommon: { name: 'Trailstitched', multiplier: 1.22, costMultiplier: 1.18, weightBp: 2520 },
        rare: { name: 'Lamplit', multiplier: 1.52, costMultiplier: 1.45, weightBp: 940 },
        epic: { name: 'Aurorawoven', multiplier: 1.95, costMultiplier: 1.85, weightBp: 250 },
        legendary: { name: 'Daybreakbound', multiplier: 2.45, costMultiplier: 2.3, weightBp: 40 },
      },
      items: {
        seamblade: { name: 'Seamlight Saber', description: 'A curved edge with a stitched grip for steady patrols.', slot: 'weapon', weaponType: 'sword', stats: { atk: 7 } },
        kettlemaul: { name: 'Kettlebelly Maul', description: 'A hollow workshop head gives every swing a low note.', slot: 'weapon', weaponType: 'hammer', stats: { atk: 9 } },
        hemknives: { name: 'Hemskip Twins', description: 'Two small blades nest neatly in a folded apron.', slot: 'weapon', weaponType: 'daggers', stats: { atk: 5 } },
        windowpike: { name: 'Windowline Pike', description: 'A long reach fashioned for narrow rooftop crossings.', slot: 'weapon', weaponType: 'spear', stats: { atk: 7 } },
        rafterbow: { name: 'Rafterstring Bow', description: 'Its woven cord hums beneath the attic beams.', slot: 'weapon', weaponType: 'bow', stats: { atk: 6 } },
        lanternrod: { name: 'Lanternwake Rod', description: 'A shaded lamp at the tip guides wandering sparks.', slot: 'weapon', weaponType: 'staff', stats: { atk: 8 } },
        mossflasks: { name: 'Mossfoam Bottles', description: 'Soft glass sleeves keep the bubbling cargo snug.', slot: 'weapon', weaponType: 'flasks', stats: { atk: 6 } },
        quiltcap: { name: 'Quiltfold Cap', description: 'A padded brim catches dust from the rafters.', slot: 'helmet', stats: { hp: 10, def: 2 } },
        porchcoat: { name: 'Porchlight Coat', description: 'Broad patches keep the evening chill outside.', slot: 'armor', stats: { hp: 22, def: 4 } },
        spoolmitts: { name: 'Spoolgrip Mitts', description: 'Reinforced palms hold fast on wet window ledges.', slot: 'gloves', stats: { hp: 6, def: 1 } },
        eaveboots: { name: 'Eaveskip Boots', description: 'Quiet soles leave only a faint trail on the tiles.', slot: 'boots', stats: { hp: 8, def: 1 } },
        chimecollar: { name: 'Firstchime Collar', description: 'A tiny chime marks the start of each watch.', slot: 'collar', stats: { critChance: 0.014 } },
        pantrystud: { name: 'Pantrygleam Stud', description: 'A polished clasp recalls the promise of supper.', slot: 'earring', stats: { fishBonus: 0.025 } },
        hemring: { name: 'Hemturn Band', description: 'A smooth loop keeps loose threads from catching.', slot: 'ring', stats: { attackSpeed: 0.018 } },
        purrcharm: { name: 'Purrwell Token', description: 'A warm keepsake settles against a tired heartbeat.', slot: 'charm', stats: { hpRegen: 0.0015 } },
      },
    },
    skills: {
      /** Rank prices are incremental fish purchases; rank gates use character level. */
      rankFish: [24, 58, 126],
      unlockLevels: [2, 5, 9],
      entries: {
        seamsweep: { name: 'Seamlight Sweep', description: 'Draw a bright seam across one nearby foe.', weaponType: 'sword', trigger: 'cooldown', every: 9000, effect: 'damage', hits: 1, perRank: [1.2, 1.5, 1.8] },
        kettlepulse: { name: 'Kettlefall Pulse', description: 'Release the stored ring of seven deliberate swings.', weaponType: 'hammer', trigger: 'attacks', every: 7, effect: 'damage', hits: 1, perRank: [1.4, 1.7, 2] },
        hempair: { name: 'Hemskip Pair', description: 'Slip two quick cuts through the same opening.', weaponType: 'daggers', trigger: 'attacks', every: 9, effect: 'damage', hits: 2, perRank: [0.55, 0.68, 0.82] },
        windowthrust: { name: 'Windowline Thrust', description: 'Place a measured jab beyond the nearest pawhold.', weaponType: 'spear', trigger: 'cooldown', every: 11000, effect: 'damage', hits: 1, perRank: [1.65, 1.95, 2.3] },
        rafterecho: { name: 'Rafter Echo', description: 'Send a second note along the path of the first arrow.', weaponType: 'bow', trigger: 'attacks', every: 8, effect: 'damage', hits: 2, perRank: [0.6, 0.75, 0.9] },
        lanternarc: { name: 'Lanternwake Arc', description: 'Gather a patient glow and spill it onto one foe.', weaponType: 'staff', trigger: 'cooldown', every: 12000, effect: 'damage', hits: 1, perRank: [1.9, 2.2, 2.6] },
        mossparcel: { name: 'Mossfoam Parcel', description: 'Unwrap a cool poultice to mend your own scrapes.', weaponType: 'flasks', trigger: 'cooldown', every: 15000, effect: 'heal', hits: 1, perRank: [0.06, 0.085, 0.11] },
      },
    },
    rewards: {
      /** Fixed early-loop benchmark, not a replacement for stage/monster rewards. */
      fishPerSecond: 0.42,
      killIntervalSeconds: 6,
      gearDropChance: 0.028,
      offlineEfficiency: 0.55,
      offlineCapSeconds: 6 * 3600,
    },
  },
  /** Client presentation only. No grants, drops or server combat rules depend on these. */
  gameplay: {
    firstClaimMs: 10_000,
    claimIntervalMs: 30_000,
    closeCallHpFraction: 0.2,
    greatRollThreshold: 0.8,
    keyStats: 3,
    coachSteps: 3,
    juice: { maxParticles: 16, maxTweens: 32, maxLabels: 12, maxProjectiles: 8,
      critStopMs: 60, maxShakePx: 2, flashMs: 70, chipTrailMs: 650,
      anticipationMs: 180, settleMs: 480,
      labelMs: 650, calmLabelMs: 220, shakeMs: 80, resourceGainMs: 900,
      burstNormal: 3, burstCrit: 6, burstDefeat: 8 },
    actor: { idleFrameMs: [700, 180, 120, 180, 600, 100, 120, 200], napFrameMs: 1400, equipFrameMs: [100, 140, 140, 180], napAfterMs: 12000 },
  },
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
