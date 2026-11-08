import { V2_CONFIG } from '../config';
import { GEAR_RARITIES, GEAR_RARITY_IDS, ITEMS, STAT_IDS, type GearRarityId, type StatBlock } from '../content';
import type { BagItem } from './index';

const ITEM_BY_KEY = new Map(ITEMS.map((item) => [item.id, item]));

/** Uncapped item contributions; keeping tradeoffs avoids destroying useful alternate builds. */
function contributions(item: BagItem): StatBlock | undefined {
  const def = ITEM_BY_KEY.get(item.itemKey);
  const rarity = GEAR_RARITIES.find((r) => r.id === item.rarity);
  if (!def || !rarity || def.slot !== item.slot || def.weaponType !== item.weaponType) return;
  const level = Math.min(rarity.maxLevel, Math.max(1, Math.floor(Number.isFinite(item.level) ? item.level : 0)));
  const scale = rarity.statMultiplier * (1 + V2_CONFIG.cat.itemLevelGrowth * (level - 1));
  const stats: StatBlock = {};
  for (const stat of STAT_IDS) stats[stat] = (def.baseStats[stat] ?? 0) * scale;
  for (const { stat, value } of item.bonus) stats[stat] = (stats[stat] ?? 0) + Math.max(0, Number.isFinite(value) ? value : 0);
  return stats;
}

/**
 * No cat context: "worse" means another owned item has every stat >= and at least one >.
 * Compare weapons only within their weapon type. Keep all ties and incomparable tradeoffs.
 * Equipped/locked items can protect inferior copies but can never be returned themselves.
 */
export function salvageCandidates<T extends BagItem>(items: readonly T[], options: { keepBest: true; maxRarity: GearRarityId }): T[] {
  const ceiling = GEAR_RARITY_IDS.indexOf(options.maxRarity);
  const scored = items.map((item) => ({ item, stats: contributions(item) }));
  return scored.filter(({ item, stats }) => {
    if (item.equipped || item.locked || !stats || GEAR_RARITY_IDS.indexOf(item.rarity) > ceiling) return false;
    return scored.some(({ item: other, stats: better }) => other.id !== item.id && better
      && other.slot === item.slot && other.weaponType === item.weaponType
      && STAT_IDS.every((stat) => (better[stat] ?? 0) >= (stats[stat] ?? 0))
      && STAT_IDS.some((stat) => (better[stat] ?? 0) > (stats[stat] ?? 0)));
  }).map(({ item }) => item);
}
