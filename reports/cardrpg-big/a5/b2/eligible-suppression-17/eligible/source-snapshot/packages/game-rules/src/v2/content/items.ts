import type { WeaponType } from './classes';
import { GEAR_RARITY_IDS, type GearRarityId } from './rarities';
import type { GearSlotId } from './slots';
import type { StatBlock } from './stats';

/**
 * Item catalog. Each entry is one item kind players can own; ids are stable forever (they are
 * stored in gear.item_key), so rename the `name`, never the id. Adding an item = adding one entry
 * (plus an icon); validateContent() checks every entry.
 *
 * baseStats are the item's stats at level 1 BEFORE the rarity multiplier; deriveStats (V2) applies
 * rarity x level growth. Items of one family share base stats and differ by rarity and look.
 */
export interface ItemDef {
  id: string;
  slot: GearSlotId;
  /** Weapons only. */
  weaponType?: WeaponType;
  rarity: GearRarityId;
  name: string;
  baseStats: StatBlock;
  /** Drawing set (armor set, weapon type or accessory design) and the palette it is recoloured with. */
  visual: { set: string; palette: GearRarityId };
  /** Chapter indexes (1-based) where this item can drop. */
  dropChapters: readonly number[];
}

const ALL_CHAPTERS = [1, 2, 3, 4, 5] as const;

/** Base stats per main slot, before rarity. */
const MAIN_BASE: Readonly<Record<'weapon' | 'helmet' | 'armor' | 'gloves' | 'boots', StatBlock>> = {
  weapon: { atk: 8 },
  helmet: { hp: 20, def: 2 },
  armor: { hp: 35, def: 4 },
  gloves: { atk: 3, critChance: 0.02 },
  boots: { hp: 15, attackSpeed: 0.03 },
};

type ByRarity<T> = Readonly<Record<GearRarityId, T>>;

// ---------------------------------------------------------------------------------- weapons
/** One named weapon per weapon type and rarity: [id suffix, name]. */
const WEAPON_NAMES: Readonly<Record<WeaponType, ByRarity<readonly [string, string]>>> = {
  sword: {
    common: ['twig', 'Twig Sword'],
    uncommon: ['tin', 'Tin Whisker Blade'],
    rare: ['silver', 'Silverclaw Saber'],
    epic: ['sunfang', 'Sunfang'],
    legendary: ['ninelives', 'Nine Lives Edge'],
  },
  hammer: {
    common: ['mallet', 'Yarn Mallet'],
    uncommon: ['cork', 'Cork Knocker'],
    rare: ['anvil', 'Anvil Paw'],
    epic: ['thunder', 'Thunderpurr'],
    legendary: ['catastrophe', 'Cat-astrophe'],
  },
  daggers: {
    common: ['claws', 'Kitten Claws'],
    uncommon: ['thorns', 'Rose Thorns'],
    rare: ['fangs', 'Twin Fangs'],
    epic: ['shadow', 'Shadowpounce Pair'],
    legendary: ['midnight', 'Midnight Whiskers'],
  },
  spear: {
    common: ['reed', 'Cattail Reed'],
    uncommon: ['pike', 'Fishing Pike'],
    rare: ['harpoon', 'Tuna Harpoon'],
    epic: ['moonlance', 'Moonlance'],
    legendary: ['pounce', 'Pride of the Pounce'],
  },
  bow: {
    common: ['willow', 'Willow Bow'],
    uncommon: ['yarnstring', 'Yarnstring Bow'],
    rare: ['feather', 'Featherflight'],
    epic: ['starcatcher', 'Starcatcher'],
    legendary: ['aurora', 'Aurora Longbow'],
  },
  staff: {
    common: ['branch', 'Catnip Branch'],
    uncommon: ['wand', 'Wand of Whiskers'],
    rare: ['crystal', 'Crystal Scepter'],
    epic: ['comet', 'Comet Staff'],
    legendary: ['eclipse', 'Eclipse Staff'],
  },
  flasks: {
    common: ['vial', 'Milk Vial'],
    uncommon: ['tonic', 'Bubbly Tonic'],
    rare: ['brew', 'Catnip Brew'],
    epic: ['elixir', 'Moonglow Elixir'],
    legendary: ['purrfect', 'Purrfect Elixir'],
  },
};

export function weaponItems(): ItemDef[] {
  const out: ItemDef[] = [];
  for (const [weaponType, byRarity] of Object.entries(WEAPON_NAMES) as [WeaponType, ByRarity<readonly [string, string]>][]) {
    for (const rarity of GEAR_RARITY_IDS) {
      const [suffix, name] = byRarity[rarity];
      out.push({
        id: `wpn.${weaponType}.${suffix}`,
        slot: 'weapon',
        weaponType,
        rarity,
        name,
        baseStats: MAIN_BASE.weapon,
        visual: { set: weaponType, palette: rarity },
        dropChapters: ALL_CHAPTERS,
      });
    }
  }
  return out;
}

// ------------------------------------------------------------------------------ armor sets
type ArmorSlot = 'helmet' | 'armor' | 'gloves' | 'boots';
const ARMOR_SLOTS: readonly ArmorSlot[] = ['helmet', 'armor', 'gloves', 'boots'];

interface ArmorSetDef {
  id: string;
  /** Piece name per slot. */
  pieces: Readonly<Record<ArmorSlot, string>>;
  /** Name prefix per rarity. */
  prefixes: ByRarity<string>;
  dropChapters: readonly number[];
}

/** Launch armor looks: each drawn once, recoloured per rarity (15 looks per slot from 3 drawings). */
export const ARMOR_SETS: readonly ArmorSetDef[] = [
  {
    id: 'cozy',
    pieces: { helmet: 'Knit Beanie', armor: 'Cozy Sweater', gloves: 'Mitten Paws', boots: 'Fuzzy Booties' },
    prefixes: { common: 'Patched', uncommon: 'Snug', rare: 'Woolly', epic: 'Hearthwarm', legendary: "Grandma's" },
    dropChapters: [1, 2, 3],
  },
  {
    id: 'ranger',
    pieces: { helmet: 'Leather Cap', armor: 'Ranger Vest', gloves: 'Ranger Gloves', boots: 'Trail Boots' },
    prefixes: { common: 'Scuffed', uncommon: 'Trail', rare: 'Pathfinder', epic: 'Wildwood', legendary: 'Evergreen' },
    dropChapters: [2, 3, 4, 5],
  },
  {
    id: 'moon',
    pieces: { helmet: 'Moon Helm', armor: 'Moon Plate', gloves: 'Moon Gauntlets', boots: 'Moon Greaves' },
    prefixes: { common: 'Dim', uncommon: 'Silver', rare: 'Moonlit', epic: 'Starforged', legendary: 'Celestial' },
    dropChapters: [4, 5],
  },
];

/** Generator: every set x slot x rarity, named "<prefix> <piece>". */
export function armorItems(sets: readonly ArmorSetDef[] = ARMOR_SETS): ItemDef[] {
  const out: ItemDef[] = [];
  for (const set of sets) {
    for (const slot of ARMOR_SLOTS) {
      for (const rarity of GEAR_RARITY_IDS) {
        out.push({
          id: `arm.${set.id}.${slot}.${rarity}`,
          slot,
          rarity,
          name: `${set.prefixes[rarity]} ${set.pieces[slot]}`,
          baseStats: MAIN_BASE[slot],
          visual: { set: set.id, palette: rarity },
          dropChapters: set.dropChapters,
        });
      }
    }
  }
  return out;
}

// ----------------------------------------------------------------------------- accessories
type AccessorySlot = 'collar' | 'earring' | 'ring' | 'charm';

interface AccessoryDesign {
  id: string;
  slot: AccessorySlot;
  name: string;
  /** The design's own secondary stat, before rarity. */
  baseStats: StatBlock;
}

/** 4 slots x 3 designs; each design has one secondary stat. */
export const ACCESSORY_DESIGNS: readonly AccessoryDesign[] = [
  { id: 'bell', slot: 'collar', name: 'Bell Collar', baseStats: { critChance: 0.03 } },
  { id: 'ribbon', slot: 'collar', name: 'Ribbon Collar', baseStats: { xpBonus: 0.05 } },
  { id: 'studded', slot: 'collar', name: 'Studded Collar', baseStats: { critDamage: 0.1 } },
  { id: 'fishhook', slot: 'earring', name: 'Fishhook Earring', baseStats: { fishBonus: 0.05 } },
  { id: 'feather', slot: 'earring', name: 'Feather Earring', baseStats: { dodge: 0.02 } },
  { id: 'pearl', slot: 'earring', name: 'Pearl Stud', baseStats: { hpRegen: 0.003 } },
  { id: 'paw', slot: 'ring', name: 'Paw Print Ring', baseStats: { attackSpeed: 0.03 } },
  { id: 'hunter', slot: 'ring', name: "Hunter's Ring", baseStats: { bossDamage: 0.05 } },
  { id: 'lucky', slot: 'ring', name: 'Lucky Ring', baseStats: { materialFind: 0.05 } },
  { id: 'catnip', slot: 'charm', name: 'Catnip Charm', baseStats: { hpRegen: 0.003 } },
  { id: 'mouse', slot: 'charm', name: 'Mouse Charm', baseStats: { bossDamage: 0.05 } },
  { id: 'star', slot: 'charm', name: 'Star Charm', baseStats: { critDamage: 0.1 } },
];

const ACCESSORY_PREFIXES: ByRarity<string> = {
  common: 'Plain',
  uncommon: 'Polished',
  rare: 'Fine',
  epic: 'Gleaming',
  legendary: 'Radiant',
};

export function accessoryItems(designs: readonly AccessoryDesign[] = ACCESSORY_DESIGNS): ItemDef[] {
  const out: ItemDef[] = [];
  for (const d of designs) {
    for (const rarity of GEAR_RARITY_IDS) {
      out.push({
        id: `acc.${d.slot}.${d.id}.${rarity}`,
        slot: d.slot,
        rarity,
        name: `${ACCESSORY_PREFIXES[rarity]} ${d.name}`,
        baseStats: d.baseStats,
        visual: { set: d.id, palette: rarity },
        dropChapters: ALL_CHAPTERS,
      });
    }
  }
  return out;
}

/** The whole catalog: 35 weapons, 60 armor pieces, 60 accessories. */
export const ITEMS: readonly ItemDef[] = [...weaponItems(), ...armorItems(), ...accessoryItems()];
