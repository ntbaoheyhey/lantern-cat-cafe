import { VISUAL_PALETTE } from '../../visual/tokens';
const C = Object.fromEntries(Object.entries(VISUAL_PALETTE).map(([key, hex]) => [key, Number.parseInt(hex.slice(1), 16)])) as Record<keyof typeof VISUAL_PALETTE, number>;
import type { BodyPalette, ClassId, ClassLook, Color, GearRarity, Palette } from './types';

/**
 * Rarity palette: the trim characters every gear and weapon map may use.
 * t = trim, T = trim shade, h = highlight / gem. Colours follow the plan's rarity table.
 */
export const RARITY_PALETTES: Readonly<Record<GearRarity, Palette>> = {
  common: { t: C.common, T: C.slate, h: C.paper },
  uncommon: { t: C.sage, T: C.moss, h: C.cream },
  rare: { t: C.rare, T: C.blue, h: C.aqua },
  epic: { t: C.epic, T: C.plum, h: C.lavender },
  legendary: { t: C.gold, T: C.amber, h: C.paper },
};
export const RARITY_CHARS = ['t', 'T', 'h'] as const;

/** Fixed weapon materials. m/M = metal light/dark, g/G = wood light/dark, s = string, q = glass, l/L = potion. */
export const WEAPON_PALETTE: Palette = {
  m: C.paper, M: C.mist, g: C.copper, G: C.wood, s: C.cream, q: C.aqua, l: C.sage, L: C.moss,
};

/** Armor set palettes: a = cloth or plate, b = its shade. Trim comes from the rarity palette. */
export const SET_PALETTES: Readonly<Record<string, Palette>> = {
  cozy: { a: C.rust, b: C.woodLight },
};
export const SET_CHARS = ['a', 'b'] as const;

export const BODY_CHARS: readonly (keyof BodyPalette)[] = ['k', 'o', 'd', 'w', 'n', 'e'];

/** k is also the outline drawn around the whole dressed cat. */
const fur = (o: Color, d: Color, w: Color, e: Color, n: Color = C.rose): BodyPalette => ({
  k: C.ink, o, d, w, n, e,
});

/**
 * Evening Atelier palette pass; class markings and starter-weapon contracts retained.
 */
export const CLASS_LOOKS: Readonly<Record<ClassId, ClassLook>> = {
  warrior: { id: 'warrior', name: 'Warrior', weaponType: 'sword', markings: 'tabby', starterWeapon: 'sword.basic',
    fur: fur(C.fur, C.amber, C.cream, C.leaf) },
  guardian: { id: 'guardian', name: 'Guardian', weaponType: 'hammer', markings: 'plain', starterWeapon: 'hammer.basic',
    fur: fur(C.mist, C.slate, C.paper, C.gold) },
  rogue: { id: 'rogue', name: 'Rogue', weaponType: 'daggers', markings: 'plain', starterWeapon: 'daggers.basic',
    fur: fur(C.dusk, C.night, C.lavender, C.gold, C.coral) },
  hunter: { id: 'hunter', name: 'Hunter', weaponType: 'spear', markings: 'tabby', starterWeapon: 'spear.basic',
    fur: fur(C.copper, C.wood, C.cream, C.sage) },
  archer: { id: 'archer', name: 'Archer', weaponType: 'bow', markings: 'points', starterWeapon: 'bow.basic',
    fur: fur(C.paper, C.copper, C.cream, C.rare) },
  witch: { id: 'witch', name: 'Witch', weaponType: 'staff', markings: 'plain', starterWeapon: 'staff.basic',
    fur: fur(C.lavender, C.plum, C.paper, C.epic) },
  alchemist: { id: 'alchemist', name: 'Alchemist', weaponType: 'flasks', markings: 'patches', starterWeapon: 'flasks.basic',
    fur: fur(C.cream, C.amber, C.paper, C.sage) },
};

