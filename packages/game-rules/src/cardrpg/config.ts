import type { CurrencyId, Odds, Rarity, Stat } from './contract';
/** Independent sandbox tuning. Never imported by production CONFIG. */
export const CARD_RPG_CONFIG = {
  rarity: {
    common: { name: 'Common', color: '#A7B3BF', cap: 20, affixes: 0, salvage: 2, shards: 2 },
    rare: { name: 'Rare', color: '#63B6F1', cap: 30, affixes: 1, salvage: 5, shards: 5 },
    epic: { name: 'Epic', color: '#C493F5', cap: 40, affixes: 2, salvage: 12, shards: 12 },
    legendary: { name: 'Legendary', color: '#F4C66A', cap: 50, affixes: 3, salvage: 25, shards: 25 },
  } satisfies Record<Rarity, { name: string; color: string; cap: number; affixes: number; salvage: number; shards: number }>,
  odds: { common: 6000, rare: 3000, epic: 900, legendary: 100 } satisfies Odds,
  gearOdds: { common: 5500, rare: 3400, epic: 1000, legendary: 100 } satisfies Odds,
  pity: { soft: 41, hard: 60, stepBp: 300, featuredBp: 5000 },
  drawCost: 100, maxBatch: 10, maxDrawsPerDay: 30, historyLimit: 200,
  starterBalances: { fish: 600, threads: 40, stamps: 600, essence: 0 },
  // Caps include all repeatable rewards; one-time chapter/achievement rewards are separate.
  dailyCaps: { fish: 900, threads: 120, stamps: 600, essence: 12 } satisfies Record<CurrencyId, number>,
  battle: { rewardedPerDay: 6, reward: { fish: 90, threads: 12, stamps: 40 }, xp: 60, lossXp: 10, firstClear: { fish: 200, stamps: 200 }, bossProof: 1 },
  service: { minutesPerClaim: 10, maxClaims: 2, reward: { fish: 50, threads: 8, stamps: 50 } },
  enhance: { max: 12, fishBase: 30, threadsBase: 3, growth: 0.06 },
  reforge: { fish: 90, threads: 15 },
  level: { fishBase: 25, threads: 2, statGrowth: 0.012, maxStars: 5, starGrowth: 0.025, shardsBase: 10, ascendFish: 150 },
  accountXpStep: 200, accountLevelCap: 50,
  statCaps: { hp: 9999, attack: 999, defense: 300, critBp: 4000, critDamageBp: 10000, effectHitBp: 7500, effectResistBp: 6000, healingBp: 6000, shieldBp: 6000, initiative: 12 } satisfies Record<Stat, number>,
  combat: { defenseScale: 80, varianceBp: 800, minEffectBp: 1500, maxEffectBp: 9500 },
  scarcity: { epic: { global: 2400, season: 400 }, legendary: { global: 360, season: 60 } },
} as const;
