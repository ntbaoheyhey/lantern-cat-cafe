import { V2_CONFIG } from '../config';
import { GEAR_RARITY_IDS, GEAR_SLOT_IDS, type GearRarityId, type GearSlotId, type StatId, type WeaponType } from '../content';

/** Structural API ItemV2 shape; no dependency on the web app. */
export interface BagItem {
  id: string;
  itemKey: string;
  slot: GearSlotId;
  weaponType?: WeaponType;
  rarity: GearRarityId;
  level: number;
  bonus: readonly { stat: StatId; value: number }[];
  locked: boolean;
  equipped: boolean;
}

export function bagUsage(items: readonly BagItem[], limit: number = V2_CONFIG.bag.limit) {
  const used = items.length;
  return { used, limit, full: used >= limit, nearFull: used >= limit * V2_CONFIG.bag.nearFullRatio };
}

export type BagSort = 'rarity' | 'level' | 'slot' | 'recent';

/**
 * Stable, non-mutating sorts. Level is descending; slots follow registry display order.
 * Rarity then level break ties, with input order retained for equal keys.
 * API snapshots are oldest first (v2_items_json); without timestamps, recent reverses that order.
 */
export function sortItems<T extends BagItem>(items: readonly T[], by: BagSort): T[] {
  if (by === 'recent') return [...items].reverse();
  const rarity = (a: T, b: T) => GEAR_RARITY_IDS.indexOf(b.rarity) - GEAR_RARITY_IDS.indexOf(a.rarity);
  return [...items].sort((a, b) => {
    const primary = by === 'level' ? b.level - a.level
      : by === 'slot' ? GEAR_SLOT_IDS.indexOf(a.slot) - GEAR_SLOT_IDS.indexOf(b.slot) : 0;
    return primary || rarity(a, b) || b.level - a.level;
  });
}

export * from './compare';
export * from './best';
export * from './salvage';
