/**
 * The 7 cat classes and their weapon types (plan sections 1 and 6).
 *
 * Stat multipliers shape the shared base stats (deriveStats, V2). ATK is per hit, so slow or
 * multi-hit classes carry a per-hit ATK that keeps damage per second close to the Warrior's once
 * the passive is counted; the boss-time test in V2 checks this. Tuned in V6.
 */
export const WEAPON_TYPE_IDS = ['sword', 'hammer', 'daggers', 'spear', 'bow', 'staff', 'flasks'] as const;
export type WeaponType = (typeof WEAPON_TYPE_IDS)[number];

export interface WeaponProfile {
  id: WeaponType;
  /** Time from attack start to the first frame of the swing or throw. */
  windupMs: number;
  /**
   * Hit moments in ms from attack start, one per hit of one attack (daggers hit twice). For
   * projectile weapons this is the release; the hit lands `projectile.travelMs` later.
   */
  hitAtMs: readonly number[];
  projectile: null | { kind: 'arrow' | 'bolt' | 'flask'; travelMs: number };
}

export const WEAPON_TYPES: readonly WeaponProfile[] = [
  { id: 'sword', windupMs: 180, hitAtMs: [240], projectile: null },
  { id: 'hammer', windupMs: 420, hitAtMs: [520], projectile: null },
  { id: 'daggers', windupMs: 90, hitAtMs: [140, 300], projectile: null },
  { id: 'spear', windupMs: 220, hitAtMs: [300], projectile: null },
  { id: 'bow', windupMs: 300, hitAtMs: [300], projectile: { kind: 'arrow', travelMs: 200 } },
  { id: 'staff', windupMs: 500, hitAtMs: [500], projectile: { kind: 'bolt', travelMs: 350 } },
  { id: 'flasks', windupMs: 260, hitAtMs: [260], projectile: { kind: 'flask', travelMs: 450 } },
];

export const CLASS_IDS = ['warrior', 'guardian', 'rogue', 'hunter', 'archer', 'witch', 'alchemist'] as const;
export type ClassId = (typeof CLASS_IDS)[number];

/** Passive ids; params are documented per passive below and read by V2/V3. */
export type ClassPassive =
  /** Every `every`-th attack also hits the next monster for `splash` of the damage. */
  | { id: 'cleave'; params: { every: number; splash: number } }
  /** Each hit pushes the target's next attack back by `delayMs`. */
  | { id: 'bonk'; params: { delayMs: number } }
  /** Two hits per attack (see daggers hitAtMs). */
  | { id: 'twinStrike'; params: { hits: number } }
  /** First hit marks the target: it takes `damageTaken` more damage. Also +materialFind. */
  | { id: 'markPrey'; params: { damageTaken: number; materialFind: number } }
  /** Every `every`-th shot fires `arrows` arrows; extra arrows deal `extraArrowDamage` each. */
  | { id: 'volley'; params: { every: number; arrows: number; extraArrowDamage: number } }
  /** Bolts splash `splash` to nearby monsters and burn for `burnFraction` of the hit over `durationMs`. */
  | { id: 'burn'; params: { splash: number; burnFraction: number; durationMs: number; tickMs: number } }
  /** Flasks poison for `poisonFraction` of the hit over `durationMs`; heal `healOnKill` of max HP per kill. */
  | { id: 'poison'; params: { poisonFraction: number; durationMs: number; tickMs: number; healOnKill: number } };

export type Range = 'melee' | 'reach' | 'ranged';

export interface ClassDef {
  id: ClassId;
  name: string;
  weaponType: WeaponType;
  /** Multipliers on the shared base HP, ATK (per hit) and DEF. */
  stats: { hp: number; atk: number; def: number };
  /** Time between attack starts at 0 attackSpeed. */
  attackIntervalMs: number;
  critChance: number;
  critMultiplier: number;
  /** Base chance to avoid a hit. */
  dodge: number;
  range: Range;
  passive: ClassPassive;
  /** Free Common weapon of this class's weapon type (items.ts). */
  starterWeaponId: string;
}

export const CLASSES: readonly ClassDef[] = [
  {
    id: 'warrior',
    name: 'Warrior',
    weaponType: 'sword',
    stats: { hp: 1, atk: 1, def: 1 },
    attackIntervalMs: 1000,
    critChance: 0.05,
    critMultiplier: 1.5,
    dodge: 0,
    range: 'melee',
    passive: { id: 'cleave', params: { every: 3, splash: 0.5 } },
    starterWeaponId: 'wpn.sword.twig',
  },
  {
    id: 'guardian',
    name: 'Guardian',
    weaponType: 'hammer',
    stats: { hp: 1.3, atk: 1.35, def: 1.3 },
    attackIntervalMs: 1400,
    critChance: 0.05,
    critMultiplier: 1.5,
    dodge: 0,
    range: 'melee',
    passive: { id: 'bonk', params: { delayMs: 500 } },
    starterWeaponId: 'wpn.hammer.mallet',
  },
  {
    id: 'rogue',
    name: 'Rogue',
    weaponType: 'daggers',
    stats: { hp: 0.85, atk: 0.3, def: 0.85 },
    attackIntervalMs: 800,
    critChance: 0.25,
    critMultiplier: 2.5,
    dodge: 0.1,
    range: 'melee',
    passive: { id: 'twinStrike', params: { hits: 2 } },
    starterWeaponId: 'wpn.daggers.claws',
  },
  {
    id: 'hunter',
    name: 'Hunter',
    weaponType: 'spear',
    stats: { hp: 1, atk: 0.9, def: 0.85 },
    attackIntervalMs: 1100,
    critChance: 0.05,
    critMultiplier: 1.5,
    dodge: 0,
    range: 'reach',
    passive: { id: 'markPrey', params: { damageTaken: 0.2, materialFind: 0.1 } },
    starterWeaponId: 'wpn.spear.reed',
  },
  {
    id: 'archer',
    name: 'Archer',
    weaponType: 'bow',
    stats: { hp: 0.85, atk: 0.75, def: 0.85 },
    attackIntervalMs: 900,
    critChance: 0.05,
    critMultiplier: 1.5,
    dodge: 0,
    range: 'ranged',
    passive: { id: 'volley', params: { every: 5, arrows: 3, extraArrowDamage: 0.5 } },
    starterWeaponId: 'wpn.bow.willow',
  },
  {
    id: 'witch',
    name: 'Witch',
    weaponType: 'staff',
    stats: { hp: 0.85, atk: 1.2, def: 0.7 },
    attackIntervalMs: 1600,
    critChance: 0.05,
    critMultiplier: 1.5,
    dodge: 0,
    range: 'ranged',
    passive: { id: 'burn', params: { splash: 0.4, burnFraction: 0.3, durationMs: 3000, tickMs: 1000 } },
    starterWeaponId: 'wpn.staff.branch',
  },
  {
    id: 'alchemist',
    name: 'Alchemist',
    weaponType: 'flasks',
    stats: { hp: 1, atk: 0.85, def: 0.85 },
    attackIntervalMs: 1300,
    critChance: 0.05,
    critMultiplier: 1.5,
    dodge: 0,
    range: 'ranged',
    passive: { id: 'poison', params: { poisonFraction: 0.5, durationMs: 4000, tickMs: 1000, healOnKill: 0.03 } },
    starterWeaponId: 'wpn.flasks.vial',
  },
];
