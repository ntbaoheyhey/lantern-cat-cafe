import type { StatId } from './stats';

export const GEAR_SLOT_IDS = [
  'weapon',
  'helmet',
  'armor',
  'gloves',
  'boots',
  'collar',
  'earring',
  'ring',
  'charm',
] as const;
export type GearSlotId = (typeof GEAR_SLOT_IDS)[number];

export interface GearSlotDef {
  id: GearSlotId;
  /** 'main' slots are drawn on the cat; 'accessory' slots only add secondary stats. */
  group: 'main' | 'accessory';
  /** Drawn on the cat. */
  visible: boolean;
  /** Cat level that unlocks the slot (main slots: 1). */
  unlockLevel: number;
  /**
   * Stats every item in this slot has as base stats. Accessories have none in common: each
   * accessory design picks its own secondary stat (items.ts).
   */
  primaryStats: readonly StatId[];
}

/** Display order: main slots, then accessories. */
export const GEAR_SLOTS: readonly GearSlotDef[] = [
  { id: 'weapon', group: 'main', visible: true, unlockLevel: 1, primaryStats: ['atk'] },
  { id: 'helmet', group: 'main', visible: true, unlockLevel: 1, primaryStats: ['hp', 'def'] },
  { id: 'armor', group: 'main', visible: true, unlockLevel: 1, primaryStats: ['hp', 'def'] },
  { id: 'gloves', group: 'main', visible: true, unlockLevel: 1, primaryStats: ['atk', 'critChance'] },
  { id: 'boots', group: 'main', visible: true, unlockLevel: 1, primaryStats: ['hp', 'attackSpeed'] },
  { id: 'collar', group: 'accessory', visible: false, unlockLevel: 1, primaryStats: [] },
  { id: 'earring', group: 'accessory', visible: false, unlockLevel: 5, primaryStats: [] },
  { id: 'ring', group: 'accessory', visible: false, unlockLevel: 10, primaryStats: [] },
  { id: 'charm', group: 'accessory', visible: false, unlockLevel: 20, primaryStats: [] },
];
