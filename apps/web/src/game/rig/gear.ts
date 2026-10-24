import { SET_PALETTES } from './palettes';
import { sprite } from './spriteMap';
import type { Palette, SpriteMap, WeaponType } from './types';

// Populate SET_PALETTES for ranger and moon without modifying palettes.ts directly:
const palettes = SET_PALETTES as Record<string, Palette>;
if (!palettes.ranger) {
  palettes.ranger = { a: 0x4e6e3c, b: 0x6e482b };
}
if (!palettes.moon) {
  palettes.moon = { a: 0x4a6584, b: 0xc0d0e0 };
}

/*
 * Gear drawings. Armor maps use a/b (set palette) and t/T/h (rarity palette); weapon maps use the
 * fixed WEAPON_PALETTE materials plus the rarity characters. One drawing per set, recoloured per
 * rarity, so 1 set gives 5 looks per slot.
 */

export interface ArmorSet {
  /** Pivot lands on the head anchor (skull top centre). */
  readonly helmet: SpriteMap;
  /** Pivot lands on the body anchor (torso top-left). */
  readonly armor: SpriteMap;
  /** Drawn on both paws, pivot on the paw centre. */
  readonly gloves: SpriteMap;
  /** Drawn on both feet, pivot on the foot's top-left. */
  readonly boots: SpriteMap;
}

export const ARMOR_SETS: Readonly<Record<string, ArmorSet>> = {
  // Cozy knit: beanie with a pom-pom, cable sweater, mittens, booties.
  cozy: {
    helmet: sprite([
      '.....tt......',
      '....tttt.....',
      '...aaaaaaa...',
      '..aaaaaaaaa..',
      '.aaaaaaaaaaa.',
      'bbbbbbbbbbbbb',
      'btbtbtbtbtbtb',
    ], { x: 6, y: 5 }),
    armor: sprite([
      '..ttttttt..',
      'aaaaaaaaaaa',
      'aabaaaaabaa',
      'aaabaaabaaa',
      'aabaaaaabaa',
      'aaaaaaaaaaa',
      'ttttttttttt',
    ], { x: 1, y: 0 }),
    gloves: sprite(['.aa.', 'aaaa', 'aaaa', 'tt..'], { x: 1, y: 1 }),
    boots: sprite(['tttt.', 'aaaa.', 'aaaaa'], { x: 0, y: 1 }),
  },
  // Ranger leather: hooded cap with a feather, leather vest with a belt and strap, fingerless gloves, tall boots.
  ranger: {
    helmet: sprite([
      '...h.........',
      '..hTt........',
      '.Ttaaaaaaa...',
      '..aaaaaaaaa..',
      '..abbbbbbba..',
      'bbbbbbbbbbbbb',
      'btbbbaaabbttb',
    ], { x: 6, y: 5 }),
    armor: sprite([
      '..tbb.bbt..',
      'aabbaaaaaba',
      'aaabbbaaaaa',
      'aaaabtbaaaa',
      'aaaaabbbaaa',
      'bbbbthtbbbb',
      '.atbbbbbta.',
    ], { x: 1, y: 0 }),
    gloves: sprite([
      'b..b',
      'baab',
      'bbbb',
      'tTTt',
    ], { x: 1, y: 1 }),
    boots: sprite([
      'bb.t.',
      'baab.',
      'bbbbb',
    ], { x: 0, y: 1 }),
  },
  // Moon knight: crescent-crest helm, plate chest with a moon emblem, gauntlets, greaves.
  moon: {
    helmet: sprite([
      '....h...h....',
      '.....bbb.....',
      '...aaaaaaa...',
      '..aabaaabaa..',
      '.abaaaaaaaba.',
      'bbbbbbbbbbbbb',
      'bb..ttttt..bb',
    ], { x: 6, y: 5 }),
    armor: sprite([
      '.t.bbbbb.t.',
      'abbbbabbbba',
      'aaaabhtaaaa',
      'aaabhbaaaaa',
      'aaaabhtaaaa',
      'abbbbabbbba',
      'bb.ttttt.bb',
    ], { x: 1, y: 0 }),
    gloves: sprite([
      '.bb.',
      'baab',
      'aaaa',
      'tttt',
    ], { x: 1, y: 1 }),
    boots: sprite([
      'b.tt.',
      'abaa.',
      'bbaaa',
    ], { x: 0, y: 1 }),
  },
};

export interface WeaponDef {
  readonly type: WeaponType;
  /** Angle used outside attacks (idle, walk, hurt). */
  readonly carryAngle: number;
  /** Angle when the cat falls (defeat): the weapon lies flat. Default 0. */
  readonly dropAngle?: number;
  /** Drawings pointing right, pivot on the handle. `base` always exists; attacks may pick others. */
  readonly poses: Readonly<Record<string, SpriteMap>> & { readonly base: SpriteMap };
  /** Hand-drawn 45 degree versions of some poses (pointing up-right, pivot on the handle). Others use diagonalOf. */
  readonly diagonals?: Readonly<Record<string, SpriteMap>>;
  /** Twin weapons: a second copy is drawn in the back paw. */
  readonly dual?: boolean;
}

/** Weapon pose names a frame can ask for. 'hidden' draws nothing (a thrown flask is in the air). */
export type WeaponPose = 'base' | 'drawn' | 'glow' | 'hidden';

export const WEAPON_SETS: Readonly<Record<string, WeaponDef>> = {
  'sword.basic': {
    type: 'sword', carryAngle: 45,
    poses: { base: sprite(['...t........', 'gggtmmmmmmmh', '...t........'], { x: 1, y: 1 }) },
  },
  'hammer.basic': {
    type: 'hammer', carryAngle: 45,
    poses: { base: sprite([
      '........MmM',
      '........MmM',
      'GggggggtmmM',
      '........MmM',
      '........MmM',
    ], { x: 1, y: 2 }) },
  },
  'daggers.basic': {
    type: 'daggers', carryAngle: 315, dual: true,
    poses: { base: sprite(['.t.....', 'gtmmmmh', '.t.....'], { x: 0, y: 1 }) },
  },
  'spear.basic': {
    type: 'spear', carryAngle: 90,
    poses: { base: sprite([
      '...............m..',
      'GgggggggggggggtMmh',
      '...............m..',
    ], { x: 6, y: 1 }) },
  },
  'bow.basic': {
    type: 'bow', carryAngle: 0, dropAngle: 270,
    poses: {
      base: sprite([
        '.Gg..',
        '.s.g.',
        '.s..g',
        '.s..g',
        '.s..g',
        '.s..t',
        '.s..t',
        '.s..t',
        '.s..g',
        '.s..g',
        '.s..g',
        '.s.g.',
        '.Gg..',
      ], { x: 4, y: 6 }),
      drawn: sprite([
        '....Gg....',
        '....s.g...',
        '...s...g..',
        '...s...g..',
        '..s....g..',
        '..s....t..',
        'hsmmmmmmtm',
        '..s....t..',
        '..s....g..',
        '...s...g..',
        '...s...g..',
        '....s.g...',
        '....Gg....',
      ], { x: 7, y: 6 }),
    },
  },
  'staff.basic': {
    type: 'staff', carryAngle: 90,
    poses: {
      base: sprite(['............t.', 'GggggggggggtTt', '............t.'], { x: 4, y: 1 }),
      glow: sprite([
        '............h..',
        '...........hth.',
        'GggggggggggtThh',
        '...........hth.',
        '............h..',
      ], { x: 4, y: 2 }),
    },
  },
  'flasks.basic': {
    type: 'flasks', carryAngle: 90,
    poses: { base: sprite(['...qqq...', '..qlllt..', '..qlllttG', '..qLLLt..', '...qqq...'], { x: 0, y: 2 }) },
  },
};

const diagonals = new WeakMap<SpriteMap, SpriteMap>();

/**
 * The 45 degree drawing of a weapon that points right: a nearest-pixel turn of the straight drawing
 * around its pivot. Each output pixel takes exactly one source pixel, so colours stay exact and no
 * blur appears; lines along the weapon become clean staircases. A drawn diagonal can still be
 * supplied instead (WeaponDef.diagonals) when a weapon needs hand-placed pixels.
 */
export function diagonalOf(straight: SpriteMap): SpriteMap {
  const cached = diagonals.get(straight);
  if (cached) return cached;
  const { x: px, y: py } = straight.pivot;
  const src = (u: number, k: number): string => straight.rows[k + py]?.[u + px] ?? '.';
  // Corners of the source around the pivot, turned 45 degrees, bound the output.
  const w = straight.rows[0]?.length ?? 0;
  const h = straight.rows.length;
  const corners = [[-px, -py], [w - 1 - px, -py], [-px, h - 1 - py], [w - 1 - px, h - 1 - py]];
  const turned = corners.map(([u, k]) => [(u! + k!) / Math.SQRT2, (k! - u!) / Math.SQRT2]);
  const minX = Math.floor(Math.min(...turned.map((c) => c[0]!))) - 1;
  const maxX = Math.ceil(Math.max(...turned.map((c) => c[0]!))) + 1;
  const minY = Math.floor(Math.min(...turned.map((c) => c[1]!))) - 1;
  const maxY = Math.ceil(Math.max(...turned.map((c) => c[1]!))) + 1;
  const grid: string[][] = [];
  for (let y = minY; y <= maxY; y++) {
    const row: string[] = [];
    // Inverse of x' = (u + k) / sqrt2, y' = (k - u) / sqrt2 (u along the weapon, k across it).
    for (let x = minX; x <= maxX; x++) row.push(src(Math.round((x - y) / Math.SQRT2), Math.round((x + y) / Math.SQRT2)));
    grid.push(row);
  }
  // Trim empty edges, keeping the pivot inside.
  let top = 0, bottom = grid.length - 1, left = 0, right = grid[0]!.length - 1;
  const pivotRow = -minY, pivotCol = -minX;
  const emptyRow = (r: number) => grid[r]!.every((c) => c === '.');
  const emptyCol = (c: number) => grid.every((r) => r[c] === '.');
  while (top < pivotRow && emptyRow(top)) top++;
  while (bottom > pivotRow && emptyRow(bottom)) bottom--;
  while (left < pivotCol && emptyCol(left)) left++;
  while (right > pivotCol && emptyCol(right)) right--;
  const rows = grid.slice(top, bottom + 1).map((r) => r.slice(left, right + 1).join(''));
  const out = sprite(rows, { x: pivotCol - left, y: pivotRow - top });
  diagonals.set(straight, out);
  return out;
}

export function weaponFor(set: string | undefined, fallback: string): WeaponDef {
  return WEAPON_SETS[set ?? ''] ?? WEAPON_SETS[fallback]!;
}

