import { CONFIG, gearStat, heroPower, type Gear, type Slot } from '@taskbar-hero/game-rules';
import type { OwnedGear } from '../api/GameApi';

export interface SlotGroup {
  slot: Slot;
  equipped: OwnedGear | null;
  /** Unequipped items, strongest first. */
  spare: OwnedGear[];
}

/** Inventory grouped by slot, in CONFIG.slots order. */
export function groupBySlot(inventory: readonly OwnedGear[]): SlotGroup[] {
  return CONFIG.slots.map((slot) => {
    const items = inventory.filter((g) => g.slot === slot);
    return {
      slot,
      equipped: items.find((g) => g.equipped) ?? null,
      spare: items.filter((g) => !g.equipped).sort((a, b) => gearStat(b) - gearStat(a)),
    };
  });
}

/** Hero power if `item` replaced whatever is equipped in its slot. */
export function powerIfEquipped(equipped: readonly Gear[], item: Gear): number {
  return heroPower([...equipped.filter((g) => g.slot !== item.slot), item]);
}

export function formatPower(p: number): string {
  return (Math.round(p * 10) / 10).toLocaleString('en-US');
}

export { capitalize } from '../theme/labels';
