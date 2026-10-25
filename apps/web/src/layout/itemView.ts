import { v2 } from '@taskbar-hero/game-rules';
import type { GearRarityId, GearSlotId, ItemV2, StatId, WeaponType } from '../api/GameApiV2';
import { itemIconKey, type ItemIconKey } from '../art/itemIcons';
import type { V2FrameName } from '../art/v2Frames';
import type { V2IconName } from '../art/v2Icons';

/** Display helpers shared by the Character and Bag panels. Ids and numbers come from game-rules. */

const ITEM_NAME = new Map(v2.ITEMS.map((item) => [item.id, item.name]));

export const RARITY_LABEL: Record<GearRarityId, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

export const SLOT_LABEL: Record<GearSlotId, string> = {
  weapon: 'Weapon',
  helmet: 'Helmet',
  armor: 'Armor',
  gloves: 'Gloves',
  boots: 'Boots',
  collar: 'Collar',
  earring: 'Earring',
  ring: 'Ring',
  charm: 'Charm',
};

const STAT_LABEL: Record<StatId, string> = {
  hp: 'HP',
  atk: 'ATK',
  def: 'DEF',
  attackSpeed: 'Attack speed',
  critChance: 'Crit chance',
  critDamage: 'Crit damage',
  dodge: 'Dodge',
  hpRegen: 'HP regen',
  fishBonus: 'Fish bonus',
  xpBonus: 'XP bonus',
  materialFind: 'Material find',
  bossDamage: 'Boss damage',
};

const WEAPON_ICON: Record<WeaponType, V2IconName> = {
  sword: 'sword',
  hammer: 'hammer',
  daggers: 'daggers',
  spear: 'spear',
  bow: 'bow',
  staff: 'staff',
  flasks: 'flasks',
};

const SLOT_ICON: Record<GearSlotId, V2IconName> = {
  weapon: 'slotWeapon',
  helmet: 'slotHelmet',
  armor: 'slotArmor',
  gloves: 'slotGloves',
  boots: 'slotBoots',
  collar: 'slotCollar',
  earring: 'slotEarring',
  ring: 'slotRing',
  charm: 'slotCharm',
};

const RARITY_FRAME: Record<GearRarityId, V2FrameName> = {
  common: 'frameCommon',
  uncommon: 'frameUncommon',
  rare: 'frameRare',
  epic: 'frameEpic',
  legendary: 'frameLegendary',
};

export const EMPTY_FRAME: Record<GearSlotId, V2FrameName> = {
  weapon: 'emptyWeapon',
  helmet: 'emptyHelmet',
  armor: 'emptyArmor',
  gloves: 'emptyGloves',
  boots: 'emptyBoots',
  collar: 'emptyCollar',
  earring: 'emptyEarring',
  ring: 'emptyRing',
  charm: 'emptyCharm',
};

export const LOCKED_FRAME: V2FrameName = 'lockedSlot';

export function itemName(itemKey: string): string {
  return ITEM_NAME.get(itemKey) ?? itemKey;
}

/** Weapons show their weapon type; every other slot shows its slot icon. */
export function itemIconName(item: Pick<ItemV2, 'slot' | 'weaponType'>): V2IconName {
  if (item.slot === 'weapon' && item.weaponType) return WEAPON_ICON[item.weaponType];
  return SLOT_ICON[item.slot];
}

/** Specific item icon (A11) when one exists (armor sets, accessories), else the fallback slot/weapon-type icon. */
export function itemArtOf(
  item: Pick<ItemV2, 'itemKey' | 'slot' | 'weaponType'>,
): { kind: 'item'; key: ItemIconKey } | { kind: 'icon'; name: V2IconName } {
  const key = itemIconKey(item.itemKey);
  if (key !== null) {
    return { kind: 'item', key };
  }
  return { kind: 'icon', name: itemIconName(item) };
}

export function frameFor(rarity: GearRarityId): V2FrameName {
  return RARITY_FRAME[rarity];
}

export function rarityLabel(rarity: GearRarityId): string {
  return RARITY_LABEL[rarity];
}

export function statLabel(stat: StatId): string {
  return STAT_LABEL[stat];
}

/** Fractions show as a percentage (0.05 = 5%); flat stats as a plain number. Sign is the caller's job. */
export function formatStat(stat: StatId, value: number): string {
  const kind = v2.STATS.find((s) => s.id === stat)?.kind;
  if (kind === 'fraction') return `${roundForDisplay(value * 100)}%`;
  return roundForDisplay(value);
}

function roundForDisplay(value: number): string {
  const digits = Math.abs(value) >= 10 ? 0 : 1;
  return Number(value.toFixed(digits)).toString();
}
