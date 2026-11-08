import type { GearRarityId } from '../content/rarities';
import { SALVAGE, type MaterialCost } from '../content/recipes';

/** A fresh material map; level, slot and bonus rolls do not affect salvage value. */
export function salvage(item: { rarity: GearRarityId }): MaterialCost {
  const entry = SALVAGE.find((candidate) => candidate.rarity === item.rarity);
  if (!entry) throw new Error(`Unknown salvage rarity: ${item.rarity}`);
  return { ...entry.materials };
}
