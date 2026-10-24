import type { Palette, Point, SpriteMap } from './types';

/** Shorthand for a map literal. Every row must have the same length (checked by the rig tests). */
export function sprite(rows: readonly string[], pivot: Point = { x: 0, y: 0 }): SpriteMap {
  return { rows, pivot };
}

export function mapWidth(map: SpriteMap): number {
  return map.rows[0]?.length ?? 0;
}

/** Problems with a map: ragged rows, characters missing from the palette, a pivot outside the map. */
export function mapProblems(map: SpriteMap, allowed: Palette | readonly string[], name: string): string[] {
  const chars = new Set(Array.isArray(allowed) ? allowed : Object.keys(allowed));
  const out: string[] = [];
  const w = mapWidth(map);
  if (map.rows.length === 0 || w === 0) out.push(`${name}: empty map`);
  map.rows.forEach((row, y) => {
    if (row.length !== w) out.push(`${name}: row ${y} is ${row.length} wide, expected ${w}`);
    for (const ch of row) {
      if (ch !== '.' && !chars.has(ch)) out.push(`${name}: row ${y} uses '${ch}', not in its palette`);
    }
  });
  const { x, y } = map.pivot;
  if (x < 0 || y < 0 || x >= w || y >= map.rows.length) out.push(`${name}: pivot ${x},${y} is outside the map`);
  return out;
}

/**
 * Turn a map a quarter turn counter-clockwise on screen (a sword pointing right then points up).
 * Pixel-exact, so weapon angles stay crisp: only 90 degree steps are ever generated.
 */
export function rotate90(map: SpriteMap): SpriteMap {
  const w = mapWidth(map);
  const h = map.rows.length;
  const rows: string[] = [];
  for (let y = 0; y < w; y++) {
    let row = '';
    for (let x = 0; x < h; x++) row += map.rows[x]![w - 1 - y];
    rows.push(row);
  }
  return { rows, pivot: { x: map.pivot.y, y: w - 1 - map.pivot.x } };
}

/** A map for a weapon angle (multiple of 45) from its two drawings: pointing right, and up-right. */
export function atAngle(straight: SpriteMap, diagonal: SpriteMap | undefined, angle: number): SpriteMap {
  const a = normalizeAngle(angle);
  // Without a diagonal drawing, snap to the nearest quarter turn below.
  const base = a % 90 === 0 || !diagonal ? straight : diagonal;
  let map = base;
  for (let turns = Math.floor(a / 90); turns > 0; turns--) map = rotate90(map);
  return map;
}

export function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}
