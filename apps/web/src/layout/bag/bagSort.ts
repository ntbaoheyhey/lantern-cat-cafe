import { v2 } from '@taskbar-hero/game-rules';
import type { ItemV2 } from '../../api/GameApiV2';

export type BagSort = 'rarity' | 'level' | 'slot' | 'newest';

export const BAG_SORTS: { id: BagSort; label: string }[] = [
  { id: 'rarity', label: 'Rarity' },
  { id: 'level', label: 'Level' },
  { id: 'slot', label: 'Slot' },
  { id: 'newest', label: 'Newest' },
];

const RARITY_RANK = new Map(v2.GEAR_RARITIES.map((r, i) => [r.id, i]));
const SLOT_RANK = new Map(v2.GEAR_SLOTS.map((s, i) => [s.id, i]));

const rarityRank = (item: ItemV2) => RARITY_RANK.get(item.rarity) ?? 0;
const slotRank = (item: ItemV2) => SLOT_RANK.get(item.slot) ?? 0;

const COMPARE: Record<Exclude<BagSort, 'newest'>, (a: ItemV2, b: ItemV2) => number> = {
  // High to low; ties fall back to the other key so the order is stable to read.
  rarity: (a, b) => rarityRank(b) - rarityRank(a) || b.level - a.level,
  level: (a, b) => b.level - a.level || rarityRank(b) - rarityRank(a),
  slot: (a, b) => slotRank(a) - slotRank(b) || rarityRank(b) - rarityRank(a),
};

/** A sorted copy. `newest` keeps the server's order (the order items were added). */
export function sortBag(items: readonly ItemV2[], sort: BagSort): ItemV2[] {
  if (sort === 'newest') return [...items];
  return [...items].sort(COMPARE[sort]);
}
