import { deriveStats, powerRating } from '../combat/stats';
import type { CatState, CatStats } from '../combat/types';
import { ITEMS, type ItemDef } from '../content';
import type { BagItem } from './index';

const ITEM_BY_KEY = new Map(ITEMS.map((item) => [item.id, item]));

/** Adapt API row ids, rarity and bonus lines to the combat engine without mutating the registry. */
export function deriveBagStats(cat: CatState, equipped: readonly BagItem[]): CatStats {
  const definitions = new Map<string, ItemDef>();
  for (const item of equipped) {
    const def = ITEM_BY_KEY.get(item.itemKey);
    if (def && def.slot === item.slot && def.weaponType === item.weaponType) {
      definitions.set(item.id, { ...def, id: item.id, rarity: item.rarity });
    }
  }
  return deriveStats(cat, equipped.map((item) => ({ itemId: item.id, level: item.level, bonusLines: item.bonus })), definitions);
}

export type ComparedStat = Exclude<keyof CatStats, 'classId' | 'level'>;
export interface StatDifference {
  stat: ComparedStat;
  before: number;
  after: number;
  delta: number;
}

/** Equipped is the current loadout, independent of each row's equipped flag. Requires a chosen class. */
export function compareItems(cat: CatState, equipped: readonly BagItem[], candidate: BagItem) {
  const before = deriveBagStats(cat, equipped);
  const after = deriveBagStats(cat, [...equipped.filter((item) => item.slot !== candidate.slot), candidate]);
  const stats: StatDifference[] = (Object.keys(before) as (keyof CatStats)[])
    .filter((stat): stat is ComparedStat => stat !== 'classId' && stat !== 'level')
    .map((stat) => ({ stat, before: before[stat], after: after[stat], delta: after[stat] - before[stat] }));
  const powerBefore = powerRating(before);
  const powerAfter = powerRating(after);
  const verdict = powerAfter > powerBefore ? 'better' : powerAfter < powerBefore ? 'worse' : 'same';
  return { stats, powerBefore, powerAfter, verdict } as const;
}
