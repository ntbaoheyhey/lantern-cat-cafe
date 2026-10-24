/**
 * Types for the v2 cat rig. Ids match the v2 content registry (packages/game-rules v2/content):
 * class ids, weapon types, visible slots and the five gear rarities. They are repeated here as string
 * unions so the rig has no runtime dependency on the rules package; V22/V23 can switch to the
 * registry's types once it is merged.
 */

export type ClassId = 'warrior' | 'guardian' | 'rogue' | 'hunter' | 'archer' | 'witch' | 'alchemist';
export type WeaponType = 'sword' | 'hammer' | 'daggers' | 'spear' | 'bow' | 'staff' | 'flasks';
export type GearRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
/** Main slots that change the cat's look. Accessories are stat-only and never drawn. */
export type VisibleSlot = 'weapon' | 'helmet' | 'armor' | 'gloves' | 'boots';
export type AnimName = 'idle' | 'walk' | 'attack' | 'hurt' | 'defeat' | 'victory';

export const CLASS_IDS: readonly ClassId[] = ['warrior', 'guardian', 'rogue', 'hunter', 'archer', 'witch', 'alchemist'];
export const WEAPON_TYPES: readonly WeaponType[] = ['sword', 'hammer', 'daggers', 'spear', 'bow', 'staff', 'flasks'];
export const GEAR_RARITIES: readonly GearRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
export const VISIBLE_SLOTS: readonly VisibleSlot[] = ['weapon', 'helmet', 'armor', 'gloves', 'boots'];
export const ANIM_NAMES: readonly AnimName[] = ['idle', 'walk', 'attack', 'hurt', 'defeat', 'victory'];

/** A colour as 0xRRGGBB. */
export type Color = number;
/** Map character -> colour. '.' is always transparent and never appears in a palette. */
export type Palette = Readonly<Record<string, Color>>;

/** A small sprite drawn as rows of palette characters, with a pivot that lands on its anchor. */
export interface SpriteMap {
  readonly rows: readonly string[];
  /** The pixel (column, row) inside `rows` that is placed on the anchor. */
  readonly pivot: Point;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * Anchor points of one frame, in cat-cell pixels (0..31, feet on row 31). Gear is drawn on these:
 * helmet on head, armor on body, gloves on both paws, boots on both feet, the weapon on grip.
 * The card's "feet" anchor is the pair footFront / footBack.
 */
export interface Anchors {
  readonly head: Point;
  readonly body: Point;
  readonly pawFront: Point;
  readonly pawBack: Point;
  readonly footFront: Point;
  readonly footBack: Point;
  /** Where the weapon's handle sits (the front paw). */
  readonly grip: Point;
  /** Weapon direction in degrees, multiples of 45: 0 points forward (right), 90 points up. */
  readonly gripAngle: number;
}
export const ANCHOR_NAMES = ['head', 'body', 'pawFront', 'pawBack', 'footFront', 'footBack', 'grip'] as const;

/** Body palette of a class: the characters every body part map uses. */
export interface BodyPalette {
  /** Outline. */ k: Color;
  /** Main fur. */ o: Color;
  /** Darker fur: stripes, far limbs. */ d: Color;
  /** Light fur: muzzle, belly, paws. */ w: Color;
  /** Inner ear and nose. */ n: Color;
  /** Eyes. */ e: Color;
}

/** What a class looks like before gear: fur, weapon type and the weapon set it shows when unarmed. */
export interface ClassLook {
  readonly id: ClassId;
  readonly name: string;
  readonly weaponType: WeaponType;
  readonly fur: BodyPalette;
  /** Fur pattern, drawn with the dark fur colour. */
  readonly markings: Markings;
  /** Weapon set drawn when nothing is equipped in the weapon slot (the class's starter look). */
  readonly starterWeapon: string;
}
export type Markings = 'plain' | 'tabby' | 'patches' | 'points';

/** A drawn item: which drawing (visual set) and which rarity palette. Mirrors ItemDef.visual. */
export interface EquipVisual {
  readonly set: string;
  readonly rarity: GearRarity;
}
export type EquippedVisuals = Readonly<Partial<Record<VisibleSlot, EquipVisual>>>;
