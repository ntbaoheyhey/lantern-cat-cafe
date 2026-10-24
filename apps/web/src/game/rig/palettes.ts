import type { BodyPalette, ClassId, ClassLook, Color, GearRarity, Palette } from './types';

/**
 * Rarity palette: the trim characters every gear and weapon map may use.
 * t = trim, T = trim shade, h = highlight / gem. Colours follow the plan's rarity table.
 */
export const RARITY_PALETTES: Readonly<Record<GearRarity, Palette>> = {
  common: { t: 0xb9b6c9, T: 0x7d7a8c, h: 0xe6e3f0 },
  uncommon: { t: 0x6be08a, T: 0x2f9e50, h: 0xc8ffd4 },
  rare: { t: 0x4aa8ff, T: 0x1f6fc0, h: 0xc4e4ff },
  epic: { t: 0xbb74ff, T: 0x7e3fc9, h: 0xecd4ff },
  legendary: { t: 0xff9a3c, T: 0xc25e00, h: 0xffe08a },
};
export const RARITY_CHARS = ['t', 'T', 'h'] as const;

/** Fixed weapon materials. m/M = metal light/dark, g/G = wood light/dark, s = string, q = glass, l/L = potion. */
export const WEAPON_PALETTE: Palette = {
  m: 0xe6e9f2, M: 0x9aa3b8, g: 0xc8925a, G: 0x8b5a3c, s: 0xfff3e0, q: 0xd8f3ff, l: 0x6be08a, L: 0x2f9e50,
};

/** Armor set palettes: a = cloth or plate, b = its shade. Trim comes from the rarity palette. */
export const SET_PALETTES: Readonly<Record<string, Palette>> = {
  cozy: { a: 0xe07a5f, b: 0xa94f3a },
};
export const SET_CHARS = ['a', 'b'] as const;

export const BODY_CHARS: readonly (keyof BodyPalette)[] = ['k', 'o', 'd', 'w', 'n', 'e'];

/** k is also the outline drawn around the whole dressed cat. */
const fur = (o: Color, d: Color, w: Color, e: Color, n: Color = 0xff8fb1): BodyPalette => ({
  k: 0x140a12, o, d, w, n, e,
});

/**
 * Placeholder class looks: fur colours and a starter weapon silhouette, enough to test the rig.
 * The real looks come from the user's references in V22.
 */
export const CLASS_LOOKS: Readonly<Record<ClassId, ClassLook>> = {
  warrior: { id: 'warrior', name: 'Warrior', weaponType: 'sword', markings: 'tabby', starterWeapon: 'sword.basic',
    fur: fur(0xf0a040, 0xc66a1a, 0xfff0d8, 0x3f9e5a) },
  guardian: { id: 'guardian', name: 'Guardian', weaponType: 'hammer', markings: 'plain', starterWeapon: 'hammer.basic',
    fur: fur(0x9aa0b4, 0x666c80, 0xe8eaf0, 0xd9a520) },
  rogue: { id: 'rogue', name: 'Rogue', weaponType: 'daggers', markings: 'plain', starterWeapon: 'daggers.basic',
    fur: fur(0x4a4258, 0x2e2838, 0xd8d8e8, 0xe8c840, 0xd07890) },
  hunter: { id: 'hunter', name: 'Hunter', weaponType: 'spear', markings: 'tabby', starterWeapon: 'spear.basic',
    fur: fur(0xa0703f, 0x6e4a26, 0xe8d2b0, 0x3a8ac0) },
  archer: { id: 'archer', name: 'Archer', weaponType: 'bow', markings: 'points', starterWeapon: 'bow.basic',
    fur: fur(0xf3e2c4, 0x8a6a52, 0xfffaf0, 0x3a7ad0) },
  witch: { id: 'witch', name: 'Witch', weaponType: 'staff', markings: 'plain', starterWeapon: 'staff.basic',
    fur: fur(0xf2eefc, 0xb8b0d4, 0xffffff, 0x9a5ae0) },
  alchemist: { id: 'alchemist', name: 'Alchemist', weaponType: 'flasks', markings: 'patches', starterWeapon: 'flasks.basic',
    fur: fur(0xfff3e0, 0xe08a3a, 0xffffff, 0x3f9e5a) },
};

