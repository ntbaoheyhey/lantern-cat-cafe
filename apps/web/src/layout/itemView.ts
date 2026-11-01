import { v2 } from '@taskbar-hero/game-rules';
import type { GearRarityId, GearSlotId, ItemV2, StatId, WeaponType } from '../api/GameApiV2';
import { itemIconKey, type ItemIconKey } from '../art/itemIcons';
import type { V2FrameName } from '../art/v2Frames';
import type { V2IconName } from '../art/v2Icons';

/** Display helpers shared by the Character and Bag panels. Ids and numbers come from game-rules. */

const ITEM_NAME = new Map(v2.ITEMS.map((item) => [item.id, item.name]));
const MATERIAL_NAME = new Map(v2.MATERIALS.map((m) => [m.id, m.name]));

export const RARITY_LABEL: Record<string, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
  relic: 'Relic',
};

export const SLOT_LABEL: Record<string, string> = {
  weapon: 'Weapon',
  helmet: 'Helmet',
  armor: 'Armor',
  gloves: 'Gloves',
  boots: 'Boots',
  collar: 'Collar',
  earring: 'Earring',
  ring: 'Ring',
  charm: 'Charm',
  material: 'Material',
  relic: 'Relic',
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

const SLOT_ICON: Record<string, V2IconName> = {
  weapon: 'slotWeapon',
  helmet: 'slotHelmet',
  armor: 'slotArmor',
  gloves: 'slotGloves',
  boots: 'slotBoots',
  collar: 'slotCollar',
  earring: 'slotEarring',
  ring: 'slotRing',
  charm: 'slotCharm',
  material: 'fluffTuft',
  relic: 'moonPearl',
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
  const fromItems = ITEM_NAME.get(itemKey);
  if (fromItems) return fromItems;
  if (itemKey.startsWith('mat.')) {
    const id = itemKey.slice(4);
    const mName = MATERIAL_NAME.get(id as any);
    if (mName) return mName;
  }
  if (itemKey.startsWith('relic.')) {
    const id = itemKey.slice(6);
    const mName = MATERIAL_NAME.get(id as any);
    if (mName) return `${mName} Relic`;
    return 'Ancient Relic';
  }
  return itemKey;
}

/** Weapons show their weapon type; materials and accessories show their respective icons. */
export function itemIconName(item: Pick<ItemV2, 'slot' | 'weaponType'> & { itemKey?: string }): V2IconName {
  if (item.slot === 'weapon' && item.weaponType) return WEAPON_ICON[item.weaponType];
  if (item.itemKey) {
    if (item.itemKey.includes('moonPearl') || item.itemKey.includes('relic')) return 'moonPearl';
    if (item.itemKey.includes('catnipCrystal')) return 'catnipCrystal';
    if (item.itemKey.includes('starlightScale')) return 'starlightScale';
    if (item.itemKey.includes('shinyButton')) return 'shinyButton';
    if (item.itemKey.includes('fluffTuft')) return 'fluffTuft';
  }
  return SLOT_ICON[item.slot] ?? 'slotCharm';
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

export function rarityLabel(rarity: GearRarityId | string): string {
  return RARITY_LABEL[rarity] ?? rarity;
}

export function rarityColor(rarity: GearRarityId | string): string {
  switch (rarity) {
    case 'common':
      return 'var(--rarity-common, #b9b6c9)';
    case 'uncommon':
      return 'var(--rarity-uncommon, #6be08a)';
    case 'rare':
      return 'var(--rarity-rare, #4aa8ff)';
    case 'epic':
      return 'var(--rarity-epic, #bb74ff)';
    case 'legendary':
    case 'relic':
      return 'var(--rarity-legendary, #ff9a3c)';
    default:
      return 'var(--rarity-common, #b9b6c9)';
  }
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
