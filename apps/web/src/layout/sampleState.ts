import { useCallback, useState } from 'react';
import { v2 } from '@taskbar-hero/game-rules';
import type { BonusLineV2, GearSlotId, ItemV2, ServerStateV2 } from '../api/GameApiV2';
import { equipBlock } from './bag/equipRules';

/** Sample account for the v2 screens until live state arrives (demo mode, V12). Ids and numbers come from game-rules. */

const SAMPLE_LEVEL = 12;
const SAMPLE_CLASS = 'warrior';

function gear(
  id: string,
  itemKey: string,
  level: number,
  bonus: BonusLineV2[] = [],
  flags: { equipped?: boolean; locked?: boolean } = {},
): ItemV2 {
  const def = v2.ITEMS.find((i) => i.id === itemKey);
  if (!def) throw new Error(`Unknown sample item: ${itemKey}`);
  return {
    id,
    itemKey,
    slot: def.slot,
    ...(def.weaponType ? { weaponType: def.weaponType } : {}),
    rarity: def.rarity,
    level,
    bonus,
    locked: flags.locked ?? false,
    equipped: flags.equipped ?? false,
  };
}

export function sampleStateV2(): ServerStateV2 {
  const inventory: ItemV2[] = [
    // Worn: one per main slot, plus collar and earring. The ring and charm slots are empty.
    gear('it-1', 'wpn.sword.twig', 4, [], { equipped: true }),
    gear('it-2', 'arm.cozy.helmet.uncommon', 6, [{ stat: 'dodge', value: 0.01 }], { equipped: true }),
    gear('it-3', 'arm.cozy.armor.common', 3, [], { equipped: true }),
    gear(
      'it-4',
      'arm.ranger.gloves.rare',
      8,
      [
        { stat: 'critChance', value: 0.03 },
        { stat: 'attackSpeed', value: 0.03 },
      ],
      { equipped: true },
    ),
    gear('it-5', 'arm.cozy.boots.common', 2, [], { equipped: true }),
    gear('it-6', 'acc.collar.studded.uncommon', 5, [{ stat: 'xpBonus', value: 0.03 }], { equipped: true }),
    gear('it-7', 'acc.earring.fishhook.uncommon', 5, [{ stat: 'materialFind', value: 0.03 }], { equipped: true }),
    // Bag: all five rarities and all nine slots, a few locked, a few the Warrior cannot use.
    gear('it-8', 'wpn.sword.silver', 7, [{ stat: 'critDamage', value: 0.1 }]),
    gear('it-9', 'wpn.hammer.cork', 5),
    gear('it-10', 'wpn.sword.sunfang', 10, [{ stat: 'attackSpeed', value: 0.04 }], { locked: true }),
    gear('it-11', 'arm.moon.helmet.epic', 10, [{ stat: 'dodge', value: 0.02 }]),
    gear('it-12', 'arm.cozy.armor.uncommon', 6),
    gear('it-13', 'arm.ranger.gloves.common', 3),
    gear(
      'it-14',
      'arm.moon.boots.legendary',
      14,
      [
        { stat: 'attackSpeed', value: 0.07 },
        { stat: 'fishBonus', value: 0.12 },
      ],
    ),
    gear('it-15', 'acc.collar.bell.common', 4),
    gear('it-16', 'acc.earring.feather.common', 2),
    gear('it-17', 'acc.ring.paw.epic', 9),
    gear('it-18', 'acc.charm.catnip.legendary', 20, [{ stat: 'hpRegen', value: 0.006 }], { locked: true }),
    gear('it-19', 'arm.ranger.helmet.rare', 11, [{ stat: 'dodge', value: 0.015 }]),
    gear('it-20', 'wpn.daggers.thorns', 8),
    gear('it-21', 'arm.cozy.gloves.epic', 12, [{ stat: 'bossDamage', value: 0.07 }], { locked: true }),
    gear('it-22', 'acc.ring.lucky.uncommon', 4),
  ];

  const xpToNext = Math.round(v2.V2_CONFIG.cat.xpBase * v2.V2_CONFIG.cat.xpGrowth ** (SAMPLE_LEVEL - 1));

  return {
    cat: { classId: SAMPLE_CLASS, level: SAMPLE_LEVEL, xp: Math.round(xpToNext * 0.4), xpToNext },
    progress: { chapter: 2, round: 3, kills: 4, killsPerRound: 10, gated: false, neededPower: 0 },
    currencies: { fish: 120, yarn: 35, keys: 1 },
    materials: {},
    inventory,
    bagLimit: 200,
    equipped: {
      weapon: 'it-1',
      helmet: 'it-2',
      armor: 'it-3',
      gloves: 'it-4',
      boots: 'it-5',
      collar: 'it-6',
      earring: 'it-7',
      ring: null,
      charm: null,
    },
    unlockedSlots: v2.GEAR_SLOTS.filter((s) => s.unlockLevel <= SAMPLE_LEVEL).map((s) => s.id),
    bosses: { chapters: [{ chapter: 1, cleared: true, wins: 1 }], cooldownUntil: null },
    forge: { blockedBy: null, forgedToday: false, pending: null, today: null },
    founder: false,
    serverTime: 1_800_000_000,
  };
}

/** Puts `itemId` into `slot` (or empties the slot for null). Refused moves return the same state object. */
export function equipInState(state: ServerStateV2, itemId: string | null, slot: GearSlotId): ServerStateV2 {
  const target = itemId === null ? null : (state.inventory.find((i) => i.id === itemId) ?? null);
  if (itemId !== null && (!target || target.slot !== slot || equipBlock(target, state))) return state;
  const worn = state.equipped[slot];
  if (worn === itemId) return state;
  return {
    ...state,
    inventory: state.inventory.map((i) => {
      if (i.id === worn) return { ...i, equipped: false };
      if (i.id === itemId) return { ...i, equipped: true };
      return i;
    }),
    equipped: { ...state.equipped, [slot]: itemId },
  };
}

export function setLockedInState(state: ServerStateV2, itemId: string, locked: boolean): ServerStateV2 {
  if (!state.inventory.some((i) => i.id === itemId)) return state;
  return {
    ...state,
    inventory: state.inventory.map((i) => (i.id === itemId ? { ...i, locked } : i)),
  };
}

/** Local copy of the sample state. Equip and lock change this copy only; nothing is sent anywhere. */
export function useSampleStateV2(): {
  state: ServerStateV2;
  equip: (itemId: string | null, slot: GearSlotId) => void;
  setLocked: (itemId: string, locked: boolean) => void;
} {
  const [state, setState] = useState<ServerStateV2>(sampleStateV2);
  const equip = useCallback(
    (itemId: string | null, slot: GearSlotId) => setState((prev) => equipInState(prev, itemId, slot)),
    [],
  );
  const setLocked = useCallback(
    (itemId: string, locked: boolean) => setState((prev) => setLockedInState(prev, itemId, locked)),
    [],
  );
  return { state, equip, setLocked };
}
