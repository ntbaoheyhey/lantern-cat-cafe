import type { GearRarityId } from './rarities';

/**
 * v2 stat ids. Flat stats (hp, atk, def) are plain numbers; every other stat is a fraction
 * (0.05 = +5%). Meaning of each fractional stat, as deriveStats (V2) reads it:
 * - attackSpeed: attacks come this much faster (interval / (1 + attackSpeed)).
 * - critChance: chance per hit; critDamage: added to the class crit multiplier.
 * - dodge: chance to avoid a hit; hpRegen: share of max HP healed per second.
 * - fishBonus, xpBonus, materialFind: extra share of that reward; bossDamage: extra damage vs bosses.
 */
export const STAT_IDS = [
  'hp',
  'atk',
  'def',
  'attackSpeed',
  'critChance',
  'critDamage',
  'dodge',
  'hpRegen',
  'fishBonus',
  'xpBonus',
  'materialFind',
  'bossDamage',
] as const;
export type StatId = (typeof STAT_IDS)[number];

export type StatBlock = Partial<Record<StatId, number>>;

export interface StatDef {
  id: StatId;
  /** 'flat' stats add plain numbers; 'fraction' stats add shares (0.05 = 5%). */
  kind: 'flat' | 'fraction';
  /** Whether this stat can roll as a bonus line on gear. */
  bonusLine: boolean;
}

export const STATS: readonly StatDef[] = [
  { id: 'hp', kind: 'flat', bonusLine: false },
  { id: 'atk', kind: 'flat', bonusLine: false },
  { id: 'def', kind: 'flat', bonusLine: false },
  { id: 'attackSpeed', kind: 'fraction', bonusLine: true },
  { id: 'critChance', kind: 'fraction', bonusLine: true },
  { id: 'critDamage', kind: 'fraction', bonusLine: true },
  { id: 'dodge', kind: 'fraction', bonusLine: true },
  { id: 'hpRegen', kind: 'fraction', bonusLine: true },
  { id: 'fishBonus', kind: 'fraction', bonusLine: true },
  { id: 'xpBonus', kind: 'fraction', bonusLine: true },
  { id: 'materialFind', kind: 'fraction', bonusLine: true },
  { id: 'bossDamage', kind: 'fraction', bonusLine: true },
];

/** [min, max] roll range of one bonus line, uniform. */
export type RollRange = readonly [min: number, max: number];

/**
 * Bonus line roll ranges per stat and gear rarity. Common has 0 bonus lines today; its row exists
 * so a recipe or a future rule can still roll one. Ranges grow with rarity.
 */
export const BONUS_LINE_RANGES: Readonly<Partial<Record<StatId, Readonly<Record<GearRarityId, RollRange>>>>> = {
  attackSpeed: { common: [0.01, 0.02], uncommon: [0.02, 0.03], rare: [0.03, 0.05], epic: [0.04, 0.07], legendary: [0.06, 0.1] },
  critChance: { common: [0.01, 0.02], uncommon: [0.01, 0.03], rare: [0.02, 0.04], epic: [0.03, 0.06], legendary: [0.05, 0.08] },
  critDamage: { common: [0.03, 0.05], uncommon: [0.05, 0.08], rare: [0.08, 0.12], epic: [0.12, 0.18], legendary: [0.18, 0.25] },
  dodge: { common: [0.005, 0.01], uncommon: [0.01, 0.015], rare: [0.01, 0.02], epic: [0.02, 0.03], legendary: [0.03, 0.04] },
  hpRegen: { common: [0.001, 0.002], uncommon: [0.002, 0.003], rare: [0.003, 0.004], epic: [0.004, 0.006], legendary: [0.006, 0.008] },
  fishBonus: { common: [0.02, 0.04], uncommon: [0.03, 0.06], rare: [0.05, 0.08], epic: [0.07, 0.11], legendary: [0.1, 0.15] },
  xpBonus: { common: [0.02, 0.04], uncommon: [0.03, 0.06], rare: [0.05, 0.08], epic: [0.07, 0.11], legendary: [0.1, 0.15] },
  materialFind: { common: [0.02, 0.04], uncommon: [0.03, 0.06], rare: [0.05, 0.08], epic: [0.07, 0.11], legendary: [0.1, 0.15] },
  bossDamage: { common: [0.02, 0.04], uncommon: [0.03, 0.06], rare: [0.05, 0.08], epic: [0.07, 0.11], legendary: [0.1, 0.15] },
};
