import {
  ANIM_NAMES, CLASS_IDS, CLASS_LOOKS, GEAR_RARITIES, type AnimName, type ClassId, type EquippedVisuals,
  type GearRarity,
} from '../game/rig';

export type GearChoice = 'none' | 'cozy';
export const GEAR_CHOICES: readonly GearChoice[] = ['none', 'cozy'];

export interface PreviewFilters {
  cls: ClassId | 'all';
  gear: GearChoice | 'all';
  rarity: GearRarity | 'all';
  anim: AnimName | 'all';
}
export const DEFAULT_FILTERS: PreviewFilters = { cls: 'all', gear: 'all', rarity: 'rare', anim: 'all' };

/** Filters from /?dev=sprites&cls=..&gear=..&rarity=..&anim=..; unknown values fall back to the defaults. */
export function filtersFromQuery(q: URLSearchParams): PreviewFilters {
  const one = <T extends string>(name: string, all: readonly T[], fallback: T | 'all'): T | 'all' => {
    const v = q.get(name);
    return v === 'all' || (all as readonly string[]).includes(v ?? '') ? (v as T | 'all') : fallback;
  };
  return {
    cls: one('cls', CLASS_IDS, DEFAULT_FILTERS.cls),
    gear: one('gear', GEAR_CHOICES, DEFAULT_FILTERS.gear),
    rarity: one('rarity', GEAR_RARITIES, DEFAULT_FILTERS.rarity),
    anim: one('anim', ANIM_NAMES, DEFAULT_FILTERS.anim),
  };
}

export interface PreviewRow {
  readonly cls: ClassId;
  readonly gear: GearChoice;
  readonly rarity: GearRarity;
  readonly label: string;
  readonly visuals: EquippedVisuals;
}

/** What one row of the grid wears: the class's starter weapon, plus the armor set if chosen. */
export function visualsFor(cls: ClassId, gear: GearChoice, rarity: GearRarity): EquippedVisuals {
  const weapon = { set: CLASS_LOOKS[cls].starterWeapon, rarity };
  if (gear === 'none') return { weapon };
  const piece = { set: gear, rarity };
  return { weapon, helmet: piece, armor: piece, gloves: piece, boots: piece };
}

/** Rows are class x gear x rarity, columns are animations, each narrowed by its filter. */
export function previewGrid(f: PreviewFilters): { rows: PreviewRow[]; anims: AnimName[] } {
  const pick = <T,>(all: readonly T[], one: T | 'all'): T[] => (one === 'all' ? [...all] : [one]);
  const rows: PreviewRow[] = [];
  for (const cls of pick(CLASS_IDS, f.cls)) {
    for (const gear of pick(GEAR_CHOICES, f.gear)) {
      for (const rarity of pick(GEAR_RARITIES, f.rarity)) {
        rows.push({
          cls, gear, rarity,
          label: `${CLASS_LOOKS[cls].name} · ${gear === 'none' ? 'no armor' : gear} · ${rarity}`,
          visuals: visualsFor(cls, gear, rarity),
        });
      }
    }
  }
  return { rows, anims: pick(ANIM_NAMES, f.anim) };
}
