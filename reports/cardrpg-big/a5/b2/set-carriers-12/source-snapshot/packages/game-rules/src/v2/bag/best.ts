import { classOf, powerRating } from '../combat/stats';
import type { CatState } from '../combat/types';
import { V2_CONFIG } from '../config';
import { GEAR_SLOTS } from '../content';
import { deriveBagStats } from './compare';
import type { BagItem } from './index';

/**
 * Greedily take the largest strict power gain across all slots, then repeat to a fixed point.
 * Equal powers retain the current item (or the first input candidate), preventing tie churn.
 * Locked items may be equipped; only salvage is prevented by that flag.
 * Returns final changed row ids only, in slot display order. Requires a chosen class.
 */
export function bestLoadout(cat: CatState, items: readonly BagItem[]) {
  const equipped = items.filter((item) => item.equipped);
  let loadout = [...equipped];
  const powerBefore = powerRating(deriveBagStats(cat, loadout));
  let powerAfter = powerBefore;
  const level = Math.min(V2_CONFIG.cat.maxLevel, Math.max(1, Math.floor(Number.isFinite(cat.level) ? cat.level : 0)));
  const weaponType = classOf(cat.classId).weaponType;
  const candidates = items.filter((item) =>
    GEAR_SLOTS.some((slot) => slot.id === item.slot && slot.unlockLevel <= level)
    && (item.slot !== 'weapon' || item.weaponType === weaponType));

  while (true) {
    let best: BagItem | undefined;
    let bestPower = powerAfter;
    for (const item of candidates) {
      if (loadout.some((worn) => worn.id === item.id)) continue;
      const trial = [...loadout.filter((worn) => worn.slot !== item.slot), item];
      const power = powerRating(deriveBagStats(cat, trial));
      if (power > bestPower) {
        best = item;
        bestPower = power;
      }
    }
    if (!best) break;
    loadout = [...loadout.filter((worn) => worn.slot !== best.slot), best];
    powerAfter = bestPower;
  }

  const equip = GEAR_SLOTS.flatMap((slot) => loadout
    .filter((item) => item.slot === slot.id && !equipped.some((worn) => worn.id === item.id))
    .map((item) => item.id));
  return { equip, powerBefore, powerAfter };
}
