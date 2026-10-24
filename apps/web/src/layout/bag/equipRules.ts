import { v2 } from '@taskbar-hero/game-rules';
import type { GearSlotId, ItemV2, ServerStateV2 } from '../../api/GameApiV2';
import { itemScore } from './compare';

/** Why `item` cannot go into its slot now (the refusal the server gives), or null when it can. */
export function equipBlock(item: ItemV2, state: ServerStateV2): string | null {
  const classId = state.cat.classId;
  if (classId === null) return 'Choose a class first';
  if (!state.unlockedSlots.includes(item.slot)) {
    const unlockLevel = v2.GEAR_SLOTS.find((s) => s.id === item.slot)?.unlockLevel;
    return `Unlocks at level ${unlockLevel}`;
  }
  const cls = v2.CLASSES.find((c) => c.id === classId);
  if (item.slot === 'weapon' && cls && item.weaponType !== cls.weaponType) {
    return `Needs a ${cls.weaponType} weapon`;
  }
  return null;
}

/** For every unlocked slot, the best unequipped item that beats the worn one. Skips items that cannot be equipped. */
export function equipBest(state: ServerStateV2): { itemId: string; slot: GearSlotId }[] {
  const upgrades: { itemId: string; slot: GearSlotId }[] = [];
  for (const { id: slot } of v2.GEAR_SLOTS) {
    if (!state.unlockedSlots.includes(slot)) continue;
    const worn = state.inventory.find((i) => i.id === state.equipped[slot]) ?? null;
    let best: ItemV2 | null = null;
    for (const item of state.inventory) {
      if (item.equipped || item.slot !== slot || equipBlock(item, state)) continue;
      if (!best || itemScore(item) > itemScore(best)) best = item;
    }
    if (best && (!worn || itemScore(best) > itemScore(worn))) upgrades.push({ itemId: best.id, slot });
  }
  return upgrades;
}
