import type { MaterialId } from './materials';
import type { GearRarityId } from './rarities';

/**
 * Forge data (DATA ONLY; rules are V5 in ../forge). Plan section 5: the player picks a slot and a
 * rarity; the rarity is guaranteed, bonus lines are random, the item level follows the highest
 * cleared stage. Salvage returns about 25% of the cost, so craft-then-salvage always loses.
 */
export type MaterialCost = Partial<Record<MaterialId, number>>;

export interface RecipeDef {
  id: string;
  rarity: GearRarityId;
  /** Yarn is a material here (stored as v1 shards). */
  materials: MaterialCost;
  fish: number;
}

export interface SalvageDef {
  rarity: GearRarityId;
  materials: MaterialCost;
}

export const RECIPES: readonly RecipeDef[] = [
  { id: 'rcp.common', rarity: 'common', materials: { yarn: 10, fluffTuft: 4 }, fish: 50 },
  { id: 'rcp.uncommon', rarity: 'uncommon', materials: { yarn: 25, fluffTuft: 8, shinyButton: 1 }, fish: 150 },
  { id: 'rcp.rare', rarity: 'rare', materials: { yarn: 60, fluffTuft: 10, shinyButton: 6 }, fish: 500 },
  { id: 'rcp.epic', rarity: 'epic', materials: { yarn: 150, shinyButton: 6, catnipCrystal: 3 }, fish: 1500 },
  { id: 'rcp.legendary', rarity: 'legendary', materials: { yarn: 400, catnipCrystal: 6, starlightScale: 2 }, fish: 5000 },
];

export const SALVAGE: readonly SalvageDef[] = [
  { rarity: 'common', materials: { yarn: 1, fluffTuft: 2 } },
  { rarity: 'uncommon', materials: { yarn: 3, fluffTuft: 4 } },
  { rarity: 'rare', materials: { yarn: 8, shinyButton: 2 } },
  { rarity: 'epic', materials: { yarn: 20, catnipCrystal: 1 } },
  { rarity: 'legendary', materials: { yarn: 50, starlightScale: 1 } },
];

/** The daily Relic NFT forge: 30 Yarn + 1 Moon Pearl, still one per day (odds stay in v1 CONFIG.relic). */
export const RELIC_RECIPE = { id: 'rcp.relic', materials: { yarn: 30, moonPearl: 1 } as MaterialCost, perDay: 1 } as const;
