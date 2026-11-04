import { ARMOR_SETS, diagonalOf, weaponFor, type WeaponDef } from './gear';
import {
  classTail, classTorso, POINT_PAW, POINT_FOOT, ANKLE, EYE_SPOTS, EYES, FOOT, HEAD, HEAD_TOP, HIP_BACK, HIP_FRONT, MARKINGS, PAW, PAW_RING, SHOULDER_BACK,
  SHOULDER_FRONT, TAIL_ROOT,
} from './parts';
import { RARITY_PALETTES, SET_PALETTES, WEAPON_PALETTE } from './palettes';
import { animsFor, CELL, type Pose } from './poses';
import { atAngle } from './spriteMap';
import type { AnimName, Anchors, ClassLook, Color, EquippedVisuals, Palette, Point, SpriteMap } from './types';

/**
 * A baked frame is bigger than the 32 x 32 cat cell so a spear thrust or a raised hammer fits.
 * The cell sits at (cellX, cellY); the sprite origin is the cat's feet, bottom centre of the cell.
 */
export const FRAME = { w: 56, h: 48, cellX: 12, cellY: 14 } as const;
export const FRAME_ORIGIN = {
  x: (FRAME.cellX + CELL / 2) / FRAME.w,
  y: (FRAME.cellY + CELL) / FRAME.h,
} as const;

/** One composed frame: colours (or -1 for transparent), row-major, FRAME.w x FRAME.h. */
export interface ComposedFrame {
  readonly pixels: Int32Array;
  /** Anchors in cat-cell coordinates. Add FRAME.cellX / cellY for frame pixels. */
  readonly anchors: Anchors;
  /** Pixels that fell outside the frame (should always be 0; the rig tests check it). */
  readonly clipped: number;
}

class Canvas {
  readonly pixels = new Int32Array(FRAME.w * FRAME.h).fill(-1);
  clipped = 0;

  set(cellX: number, cellY: number, color: Color): void {
    const x = cellX + FRAME.cellX;
    const y = cellY + FRAME.cellY;
    if (x < 0 || y < 0 || x >= FRAME.w || y >= FRAME.h) {
      this.clipped++;
      return;
    }
    this.pixels[y * FRAME.w + x] = color;
  }

  /** Draw a map with its pivot on `at`. Unknown characters throw, so a bad map fails loudly in tests. */
  draw(map: SpriteMap, at: Point, palette: Palette): void {
    map.rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x]!;
        if (ch === '.') continue;
        const color = palette[ch];
        if (color === undefined) throw new Error(`rig: '${ch}' has no colour`);
        this.set(at.x - map.pivot.x + x, at.y - map.pivot.y + y, color);
      }
    });
  }

  /** A 2 px thick limb from a to b. */
  limb(a: Point, b: Point, color: Color): void {
    const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y), 1);
    for (let i = 0; i <= steps; i++) {
      const x = Math.round(a.x + ((b.x - a.x) * i) / steps);
      const y = Math.round(a.y + ((b.y - a.y) * i) / steps);
      this.set(x, y, color);
      this.set(x - 1, y, color);
      this.set(x, y - 1, color);
      this.set(x - 1, y - 1, color);
    }
  }

  /** 1 px outline around everything drawn so far. */
  outline(color: Color): void {
    const { w, h } = FRAME;
    const src = this.pixels.slice();
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (src[y * w + x] !== -1) continue;
        const near =
          (x > 0 && src[y * w + x - 1] !== -1) || (x < w - 1 && src[y * w + x + 1] !== -1) ||
          (y > 0 && src[(y - 1) * w + x] !== -1) || (y < h - 1 && src[(y + 1) * w + x] !== -1);
        if (near) this.pixels[y * w + x] = color;
      }
    }
  }
}

const add = (p: Point, q: Point): Point => ({ x: p.x + q.x, y: p.y + q.y });

/** The weapon the cat shows: the equipped drawing if it fits the class, else the starter weapon. */
export function shownWeapon(look: ClassLook, gear: EquippedVisuals): WeaponDef {
  const def = weaponFor(gear.weapon?.set, look.starterWeapon);
  return def.type === look.weaponType ? def : weaponFor(look.starterWeapon, look.starterWeapon);
}

export function anchorsOf(p: Pose, weapon: WeaponDef): Anchors {
  return {
    head: add(p.head, HEAD_TOP),
    body: p.body,
    pawFront: p.pawFront,
    pawBack: p.pawBack,
    footFront: p.footFront,
    footBack: p.footBack,
    grip: p.pawFront,
    gripAngle: p.angle === 'drop' ? weapon.dropAngle ?? 0 : p.angle ?? weapon.carryAngle,
  };
}

function weaponMap(def: WeaponDef, poseName: string, angle: number): SpriteMap | null {
  if (poseName === 'hidden') return null;
  const name = def.poses[poseName] ? poseName : 'base';
  const straight = def.poses[name]!;
  return atAngle(straight, def.diagonals?.[name] ?? diagonalOf(straight), angle);
}

/** Compose one frame of a dressed cat: body, gear layers and weapon, then the outline. */
export function composeFrame(look: ClassLook, gear: EquippedVisuals, animName: AnimName, index: number): ComposedFrame {
  const anim = animsFor(look.weaponType)[animName];
  const p = anim.frames[index];
  if (!p) throw new Error(`rig: ${animName} has no frame ${index}`);
  const fur = look.fur as unknown as Palette;
  const weapon = shownWeapon(look, gear);
  const anchors = anchorsOf(p, weapon);
  const c = new Canvas();

  const weaponPalette = { ...WEAPON_PALETTE, ...RARITY_PALETTES[gear.weapon?.rarity ?? 'common'] };
  const main = weaponMap(weapon, p.weaponPose, anchors.gripAngle);
  const drawMain = () => { if (main) c.draw(main, anchors.grip, weaponPalette); };
  const armor = (slot: 'helmet' | 'armor' | 'gloves' | 'boots', at: Point) => {
    const v = gear[slot];
    const set = v && ARMOR_SETS[v.set];
    const setPalette = v && SET_PALETTES[v.set];
    if (!v || !set || !setPalette) return;
    c.draw(set[slot], at, { ...setPalette, ...RARITY_PALETTES[v.rarity] });
  };

  // Original two-tone smear only on the authored contact frame; never changes hit timing.
  if (animName === 'attack' && anim.hitFrames?.includes(index) && !['bow', 'staff', 'flasks'].includes(look.weaponType)) {
    for (let trail = 1; trail <= 4; trail++) {
      c.set(p.pawFront.x - trail, p.pawFront.y - trail - 1, weaponPalette.h!);
      if (trail < 4) c.set(p.pawFront.x - trail - 1, p.pawFront.y - trail - 1, weaponPalette.T!);
    }
  }

  // Back to front: weapon held behind, the off-hand weapon, tail, far arm and leg, near leg, torso,
  // armor, head, helmet, weapon in front, near arm (the paw wraps the handle).
  if (p.weaponBehind) drawMain();
  if (weapon.dual) {
    const off = weaponMap(weapon, p.weaponPose, p.offAngle ?? anchors.gripAngle);
    if (off) c.draw(off, anchors.pawBack, weaponPalette);
  }
  const points = look.markings === 'points';
  const paw = points ? POINT_PAW : PAW;
  const foot = points ? POINT_FOOT : FOOT;
  c.draw(classTail(look.id, p.tail), add(p.body, TAIL_ROOT), points ? { ...fur, o: look.fur.d } : fur);
  c.limb(add(p.body, SHOULDER_BACK), p.pawBack, look.fur.d);
  c.draw(paw, p.pawBack, fur);
  armor('gloves', p.pawBack);
  c.limb(add(p.body, HIP_BACK), add(p.footBack, ANKLE), look.fur.d);
  c.draw(foot, p.footBack, fur);
  armor('boots', p.footBack);
  c.limb(add(p.body, HIP_FRONT), add(p.footFront, ANKLE), look.fur.o);
  c.draw(foot, p.footFront, fur);
  armor('boots', p.footFront);
  c.draw(classTorso(look.id, p.torso), p.body, fur);
  for (const [map, off] of MARKINGS[look.markings].torso) c.draw(map, add(p.body, off), fur);
  armor('armor', p.body);
  c.draw(HEAD, p.head, fur);
  for (const [map, off] of MARKINGS[look.markings].head) c.draw(map, add(p.head, off), fur);
  const [backEye, frontEye] = EYES[p.face];
  c.draw(backEye, add(p.head, EYE_SPOTS[0]), fur);
  c.draw(frontEye, add(p.head, EYE_SPOTS[1]), fur);
  armor('helmet', anchors.head);
  if (!p.weaponBehind) drawMain();
  c.limb(add(p.body, SHOULDER_FRONT), p.pawFront, look.fur.o);
  c.draw(PAW_RING, p.pawFront, fur);
  c.draw(paw, p.pawFront, fur);
  armor('gloves', p.pawFront);
  c.outline(look.fur.k);

  return { pixels: c.pixels, anchors, clipped: c.clipped };
}
