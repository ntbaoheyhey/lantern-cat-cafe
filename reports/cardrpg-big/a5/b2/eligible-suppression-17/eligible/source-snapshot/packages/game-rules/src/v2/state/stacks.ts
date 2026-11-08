import { MATERIALS } from '../content/materials';
import { cloneItem, cloneState, type OwnedItem, type PlayerStateV2, type StackId,
  type StacksV2, type StateRefusalV2, type StateResultV2 } from './types';

/** Read caps from content until a separate key-cap config setting exists. */
export const CAT_KEY_CAP = MATERIALS.find((entry) => entry.id === 'catKey')!.maxStack;
export const STACK_CAPS_V2: Readonly<StacksV2> = Object.freeze(
  Object.fromEntries(MATERIALS.map((entry) => [entry.id, entry.maxStack])),
);

/** Atomic: validate every spend before exposing any new balances. Added includes actual spends. */
export function applyStacks(stacks: StacksV2, deltas: StacksV2, caps: StacksV2 = STACK_CAPS_V2):
  { ok: true; stacks: StacksV2; added: StacksV2 } | StateRefusalV2 {
  const next = { ...stacks };
  const added: StacksV2 = {};
  for (const [id, delta] of Object.entries(deltas) as [StackId, number][]) {
    const balance = stacks[id] ?? 0;
    if (!Number.isSafeInteger(delta) || !Number.isSafeInteger(balance) || balance < 0)
      return { ok: false, code: 'invalid_request' };
    if (balance + delta < 0) return { ok: false, code: `not_enough:${id}` };
    const cap = id === 'catKey' ? Math.min(caps[id] ?? CAT_KEY_CAP, CAT_KEY_CAP) : caps[id] ?? Infinity;
    if (cap < 0 || Number.isNaN(cap)) return { ok: false, code: 'invalid_request' };
    // A cap never turns a positive credit into a debit on a pre-existing over-cap balance.
    next[id] = delta > 0 ? balance + Math.min(delta, Math.max(0, cap - balance)) : balance + delta;
    if (!Number.isSafeInteger(next[id])) return { ok: false, code: 'invalid_request' };
    added[id] = next[id]! - balance;
  }
  return { ok: true, stacks: next, added };
}

export interface AutoSalvagedV2 { item: OwnedItem; gains: StacksV2 }

/** Inventory insertions never equip loot. Refuse duplicate instance ids before any salvage. */
export function addItems(state: PlayerStateV2, items: OwnedItem[], bagLimit: number,
  salvageValueOf: (item: OwnedItem) => StacksV2):
  StateResultV2<{ items: OwnedItem[]; autoSalvaged: AutoSalvagedV2[]; gains: StacksV2 }> {
  if (!Number.isSafeInteger(bagLimit) || bagLimit < 0) return { ok: false, code: 'invalid_request' };
  const ids = new Set(state.items.map((item) => item.id));
  for (const item of items) {
    if (!item.id || ids.has(item.id)) return { ok: false, code: 'invalid_request' };
    ids.add(item.id);
  }
  const next = cloneState(state);
  const inserted: OwnedItem[] = [];
  const autoSalvaged: AutoSalvagedV2[] = [];
  const gains: StacksV2 = {};
  for (const input of items) {
    const item = { ...cloneItem(input), equipped: false };
    if (next.items.length < bagLimit) {
      next.items.push(item);
      inserted.push(cloneItem(item));
    } else {
      const values = salvageValueOf(item);
      if (Object.values(values).some((value) => value < 0)) return { ok: false, code: 'invalid_request' };
      const applied = applyStacks(next.stacks, values);
      if (!applied.ok) return applied;
      next.stacks = applied.stacks;
      for (const [id, value] of Object.entries(applied.added) as [StackId, number][])
        gains[id] = (gains[id] ?? 0) + value;
      autoSalvaged.push({ item: cloneItem(item), gains: { ...applied.added } });
    }
  }
  return { ok: true, state: next, items: inserted, autoSalvaged, gains };
}
