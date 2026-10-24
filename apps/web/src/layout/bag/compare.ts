import { v2 } from '@taskbar-hero/game-rules';
import type { ItemV2, StatId } from '../../api/GameApiV2';

export type StatTotals = Partial<Record<StatId, number>>;

const ITEM_BY_ID = new Map(v2.ITEMS.map((item) => [item.id, item]));
const RARITY_BY_ID = new Map(v2.GEAR_RARITIES.map((rarity) => [rarity.id, rarity]));

/** A fraction point counts as this many score points, so 5% scores like 5 flat points. */
const FRACTION_SCORE = 100;

export interface StatLine {
  stat: StatId;
  value: number;
}

/** Base and bonus lines of one item: the same formula as deriveStats's item part. */
export function itemLines(item: ItemV2): { base: StatLine[]; bonus: StatLine[] } {
  const def = ITEM_BY_ID.get(item.itemKey);
  const rarity = RARITY_BY_ID.get(item.rarity);
  if (!def || !rarity) return { base: [], bonus: [] };
  const level = Math.min(Math.max(1, Math.floor(item.level)), rarity.maxLevel);
  const scale = rarity.statMultiplier * (1 + v2.V2_CONFIG.cat.itemLevelGrowth * (level - 1));
  const base = (Object.entries(def.baseStats) as [StatId, number][]).map(([stat, value]) => ({
    stat,
    value: value * scale,
  }));
  const bonus = item.bonus.map((line) => ({ stat: line.stat, value: Math.max(0, line.value) }));
  return { base, bonus };
}

export function effectiveStats(item: ItemV2): StatTotals {
  const totals: StatTotals = {};
  const { base, bonus } = itemLines(item);
  for (const { stat, value } of [...base, ...bonus]) totals[stat] = (totals[stat] ?? 0) + value;
  return totals;
}

/**
 * Stat deltas of `candidate` against `equipped` (null = nothing worn), non-zero only, in stat order.
 * PLACEHOLDER: the shared compare helper from card S2 replaces this function's body when it merges.
 */
export function compareItems(candidate: ItemV2, equipped: ItemV2 | null): { stat: StatId; delta: number }[] {
  const a = effectiveStats(candidate);
  const b = equipped ? effectiveStats(equipped) : {};
  return v2.STATS.map(({ id }) => ({ stat: id, delta: (a[id] ?? 0) - (b[id] ?? 0) })).filter((d) => d.delta !== 0);
}

/** One number to rank items in a slot: the sum of effective stats, fractions weighted up. */
export function itemScore(item: ItemV2): number {
  const totals = effectiveStats(item);
  let score = 0;
  for (const { id, kind } of v2.STATS) score += (totals[id] ?? 0) * (kind === 'fraction' ? FRACTION_SCORE : 1);
  return score;
}
