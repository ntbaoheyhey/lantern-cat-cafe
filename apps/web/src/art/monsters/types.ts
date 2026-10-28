/**
 * Pixel art format for v2 monsters and bosses. Art is rows of palette characters ('.' is transparent),
 * drawn facing LEFT (the cat walks right and meets the monster), with the feet on the bottom row and
 * the horizontal centre of the body on the middle column. One file per chapter (ch1.ts ... ch5.ts)
 * exports a MonsterArt for each of that chapter's monsters, keyed by the content registry id
 * (for example 'mon.dust.bunny'; see packages/game-rules/src/v2/content/monsters.ts).
 */
export type MonsterKind = 'regular' | 'elite' | 'boss';
export type MonsterAnim = 'idle' | 'walk' | 'windup' | 'attack' | 'hit' | 'defeat';

/** A colour as 0xRRGGBB. */
export type Color = number;

export interface MonsterArt {
  /** Registry id, e.g. 'mon.dust.bunny'. */
  id: string;
  kind: MonsterKind;
  /** Frame size in art pixels; every row of every frame has exactly this width, every frame this many rows. */
  size: { w: number; h: number };
  /** Character -> colour. '.' is transparent and must not appear here. 'k' is the outline. */
  palette: Readonly<Record<string, Color>>;
  frames: Readonly<Partial<Record<MonsterAnim, readonly (readonly string[])[]>>>;
  /** Additive fields for art direction / pilot previews */
  name?: string;
  role?: 'balanced' | 'swift' | 'sturdy' | 'elite' | 'boss';
  attackType?: 'melee' | 'ranged';
  isPilot?: boolean;
}

/** Largest frame per kind, and the animations (with frame counts [min, max]) each kind must have. */
export const MONSTER_LIMITS: Readonly<Record<MonsterKind, { maxSize: number; anims: Readonly<Partial<Record<MonsterAnim, readonly [number, number]>>> }>> = {
  regular: { maxSize: 20, anims: { walk: [2, 4], hit: [1, 1], defeat: [3, 3] } },
  elite: { maxSize: 28, anims: { walk: [2, 4], hit: [1, 1], defeat: [3, 4] } },
  boss: { maxSize: 56, anims: { idle: [4, 4], attack: [4, 4], windup: [3, 3], hit: [1, 1], defeat: [6, 6] } },
};

/** Pilot limits under Owner Decision D-G3 Option A (24x24 regular, 28x28 elite, 40x40 boss). */
export const MONSTER_PILOT_LIMITS: Readonly<Record<MonsterKind, { targetSize: number; maxSize: number; anims: Readonly<Partial<Record<MonsterAnim, readonly [number, number]>>> }>> = {
  regular: { targetSize: 24, maxSize: 24, anims: { walk: [4, 6], attack: [3, 4], hit: [2, 2], defeat: [4, 4] } },
  elite: { targetSize: 28, maxSize: 28, anims: { walk: [4, 6], attack: [3, 4], hit: [2, 2], defeat: [4, 4] } },
  boss: { targetSize: 40, maxSize: 40, anims: { walk: [4, 6], attack: [3, 4], hit: [2, 2], defeat: [4, 6] } },
};

/** Problems with one monster's art; an empty list means it follows the format. */
export function monsterArtProblems(
  art: MonsterArt,
  customLimits: Readonly<Record<MonsterKind, { maxSize: number; anims: Readonly<Partial<Record<MonsterAnim, readonly [number, number]>>> }>> = art.isPilot ? MONSTER_PILOT_LIMITS : MONSTER_LIMITS,
): string[] {
  const out: string[] = [];
  const at = art.id;
  const limits = customLimits[art.kind];
  if (!/^mon\.[a-z0-9.]+$/.test(art.id)) out.push(`${at}: id must look like mon.dust.bunny`);
  if (art.size.w > limits.maxSize || art.size.h > limits.maxSize) out.push(`${at}: size ${art.size.w}x${art.size.h} is over the ${limits.maxSize}px limit for ${art.kind}`);
  if (art.size.w < 8 || art.size.h < 8) out.push(`${at}: size ${art.size.w}x${art.size.h} is under 8px`);
  if ('.' in art.palette) out.push(`${at}: palette must not define '.'`);
  if (!('k' in art.palette)) out.push(`${at}: palette needs an outline colour 'k'`);
  for (const [anim, range] of Object.entries(limits.anims) as [MonsterAnim, readonly [number, number]][]) {
    const frames = art.frames[anim];
    if (!frames) { out.push(`${at}: missing ${anim} frames`); continue; }
    if (frames.length < range[0] || frames.length > range[1]) out.push(`${at}: ${anim} has ${frames.length} frames, expected ${range[0]} to ${range[1]}`);
  }
  for (const [anim, frames] of Object.entries(art.frames)) {
    (frames ?? []).forEach((rows, i) => {
      const name = `${at} ${anim}[${i}]`;
      if (rows.length !== art.size.h) out.push(`${name}: ${rows.length} rows, expected ${art.size.h}`);
      rows.forEach((row, y) => {
        if (row.length !== art.size.w) out.push(`${name} row ${y}: width ${row.length}, expected ${art.size.w}`);
        for (const ch of row) if (ch !== '.' && !(ch in art.palette)) out.push(`${name} row ${y}: character '${ch}' is not in the palette`);
      });
      if (!rows[rows.length - 1]?.split('').some((ch) => ch !== '.')) out.push(`${name}: bottom row is empty, feet must stand on the last row`);
    });
  }
  return out;
}

export function monsterPilotArtProblems(art: MonsterArt): string[] {
  return monsterArtProblems(art, MONSTER_PILOT_LIMITS);
}

/** Standalone Cat sprite sheet art format for the G4 Art Pilot (Option A: 32 px tall). */
export type CatPilotAnim = 'idle' | 'walk' | 'attack' | 'hit';

export interface CatPilotArt {
  id: string;
  name: string;
  classId: string;
  size: { w: number; h: number };
  palette: Readonly<Record<string, Color>>;
  frames: Readonly<Record<CatPilotAnim, readonly (readonly string[])[]>>;
}

export function catPilotArtProblems(cat: CatPilotArt): string[] {
  const out: string[] = [];
  const at = cat.id;
  if (cat.size.w !== 32 || cat.size.h !== 32) out.push(`${at}: expected size 32x32, got ${cat.size.w}x${cat.size.h}`);
  if ('.' in cat.palette) out.push(`${at}: palette must not define '.'`);
  if (!('k' in cat.palette)) out.push(`${at}: palette needs an outline colour 'k'`);
  const requiredAnims: CatPilotAnim[] = ['idle', 'walk', 'attack', 'hit'];
  for (const anim of requiredAnims) {
    const frames = cat.frames[anim];
    if (!frames || frames.length === 0) out.push(`${at}: missing ${anim} frames`);
  }
  for (const [anim, frames] of Object.entries(cat.frames) as [CatPilotAnim, readonly (readonly string[])[]][]) {
    (frames ?? []).forEach((rows, i) => {
      const name = `${at} ${anim}[${i}]`;
      if (rows.length !== cat.size.h) out.push(`${name}: ${rows.length} rows, expected ${cat.size.h}`);
      rows.forEach((row, y) => {
        if (row.length !== cat.size.w) out.push(`${name} row ${y}: width ${row.length}, expected ${cat.size.w}`);
        for (const ch of row) if (ch !== '.' && !(ch in cat.palette)) out.push(`${name} row ${y}: character '${ch}' is not in the palette`);
      });
      if (!rows[rows.length - 1]?.split('').some((ch) => ch !== '.')) out.push(`${name}: bottom row is empty, feet must stand on the last row`);
    });
  }
  return out;
}
