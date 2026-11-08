import { CLASSES, GEAR_SLOTS, ITEMS } from '../content';
import { deriveStats, powerRating } from '../combat/stats';
import { cloneItem, cloneState, type OwnedItem, type PlayerStateV2, type StateResultV2 } from './types';

/** Pure, collision-free local id. Persistence callers can replace it with their own UUID. */
export function nextItemId(state: PlayerStateV2, prefix: string): string {
  let sequence = state.items.length;
  while (state.items.some((item) => item.id === `${prefix}:${sequence}`)) sequence++;
  return `${prefix}:${sequence}`;
}

/** The caller inserts starterWeapon (if returned) and equips it after assigning its persistent id. */
export function chooseClass(state: PlayerStateV2, classId: string): StateResultV2<{ starterWeapon: OwnedItem | null }> {
  const cls = CLASSES.find((entry) => entry.id === classId);
  if (!cls) return { ok: false, code: 'invalid_request' };
  const next = cloneState(state);
  next.classId = cls.id;
  next.progressRev++;
  const candidates = next.items.filter((item) => item.slot === 'weapon' &&
    ITEMS.find((entry) => entry.id === item.itemId)?.weaponType === cls.weaponType);
  let best: OwnedItem | undefined;
  for (const candidate of candidates) {
    if (!best || powerRating(deriveStats({ classId: cls.id, level: next.level }, [{ ...candidate, bonusLines: candidate.bonus }])) >
      powerRating(deriveStats({ classId: cls.id, level: next.level }, [{ ...best, bonusLines: best.bonus }]))) best = candidate;
  }
  for (const item of next.items) if (item.slot === 'weapon') item.equipped = item.id === best?.id;
  const definition = ITEMS.find((item) => item.id === cls.starterWeaponId)!;
  const starterWeapon: OwnedItem | null = best ? null : {
    id: nextItemId(next, 'starter'), itemId: definition.id, itemKey: definition.id,
    slot: definition.slot, weaponType: cls.weaponType, rarity: definition.rarity,
    level: 1, bonus: [], bonusLines: [], locked: false, equipped: false, source: 'starter',
  };
  return { ok: true, state: next, starterWeapon: starterWeapon ? cloneItem(starterWeapon) : null };
}

/** expectedClass is optional for adapters that have a client's previously observed class. */
export function equip(state: PlayerStateV2, itemId: string | null, slot: string,
  expectedClass: PlayerStateV2['classId'] = state.classId): StateResultV2 {
  if (!state.classId) return { ok: false, code: 'no_class' };
  if (expectedClass !== state.classId) return { ok: false, code: 'stale' };
  const definition = GEAR_SLOTS.find((entry) => entry.id === slot);
  if (!definition) return { ok: false, code: 'invalid_request' };
  const item = itemId === null ? null : state.items.find((entry) => entry.id === itemId);
  if (itemId !== null && !item) return { ok: false, code: 'not_owner' };
  if (item && item.slot !== slot) return { ok: false, code: 'wrong_slot' };
  if (state.level < definition.unlockLevel) return { ok: false, code: 'slot_locked' };
  if (item && slot === 'weapon' && ITEMS.find((entry) => entry.id === item.itemId)?.weaponType !==
    CLASSES.find((entry) => entry.id === state.classId)!.weaponType)
    return { ok: false, code: 'wrong_weapon' };
  const next = cloneState(state);
  for (const entry of next.items) if (entry.slot === slot) entry.equipped = entry.id === itemId;
  return { ok: true, state: next };
}
