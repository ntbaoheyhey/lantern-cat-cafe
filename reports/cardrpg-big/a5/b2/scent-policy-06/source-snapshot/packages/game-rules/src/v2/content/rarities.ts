/**
 * v2 GEAR rarities (5 tiers). Deliberately separate from the Relic tiers in ../../content.ts
 * (RARITIES, relicIdOf): those are on-chain ids and must never move. Do not import them here.
 */
export const GEAR_RARITY_IDS = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
export type GearRarityId = (typeof GEAR_RARITY_IDS)[number];

export interface GearRarityDef {
  id: GearRarityId;
  /** Multiplies an item's base stats. */
  statMultiplier: number;
  /** Random bonus lines an item of this rarity rolls. */
  bonusLines: number;
  /** Highest item level. */
  maxLevel: number;
}

/** Lowest to highest. */
export const GEAR_RARITIES: readonly GearRarityDef[] = [
  { id: 'common', statMultiplier: 1, bonusLines: 0, maxLevel: 10 },
  { id: 'uncommon', statMultiplier: 1.3, bonusLines: 1, maxLevel: 20 },
  { id: 'rare', statMultiplier: 1.7, bonusLines: 2, maxLevel: 30 },
  { id: 'epic', statMultiplier: 2.3, bonusLines: 3, maxLevel: 40 },
  { id: 'legendary', statMultiplier: 3.2, bonusLines: 4, maxLevel: 50 },
];
