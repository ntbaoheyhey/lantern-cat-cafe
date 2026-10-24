import type { WeaponPose } from './gear';
import type { Face, TailPose, TorsoShape } from './parts';
import type { AnimName, Point, WeaponType } from './types';

/*
 * The cat rig's animations as poses. A pose says where the torso, head, paws and feet are; limbs,
 * gear and the weapon follow from that. Coordinates are cat-cell pixels (32 x 32, feet on row 31).
 */

/** Cat cell size. Frames are bigger (see FRAME) so weapons can reach past the cat. */
export const CELL = 32;

/** Standing pose, absolute cell coordinates (top-left of each part; paws are centres). */
export const STAND = {
  body: { x: 11, y: 20 },
  head: { x: 9, y: 10 },
  pawFront: { x: 20, y: 25 },
  pawBack: { x: 12, y: 25 },
  footFront: { x: 16, y: 30 },
  footBack: { x: 11, y: 30 },
} as const;

/** One frame, written as changes from STAND. Everything is optional. */
export interface PoseSpec {
  /** Moves the upper body (torso, head, arms, tail). Feet stay put unless ff/fb move them. */
  dx?: number;
  dy?: number;
  /** Extra head offset on top of dx/dy. */
  head?: [number, number];
  /** Paw offsets on top of dx/dy. */
  pf?: [number, number];
  pb?: [number, number];
  /** Foot offsets from STAND (not moved by dx/dy). */
  ff?: [number, number];
  fb?: [number, number];
  torso?: TorsoShape;
  face?: Face;
  tail?: TailPose;
  /** Weapon angle in degrees (multiple of 45). Missing means the weapon's carry angle; 'drop' its lying angle. */
  angle?: number | 'drop';
  /** Angle of the second weapon of a dual wielder (back paw). Missing means `angle`. */
  offAngle?: number;
  /** Draw the weapon behind the body (wind-ups over the shoulder). */
  weaponBehind?: boolean;
  weaponPose?: WeaponPose;
}

export interface Pose {
  readonly body: Point;
  readonly head: Point;
  readonly pawFront: Point;
  readonly pawBack: Point;
  readonly footFront: Point;
  readonly footBack: Point;
  readonly torso: TorsoShape;
  readonly face: Face;
  readonly tail: TailPose;
  readonly angle: number | 'drop' | undefined;
  readonly offAngle: number | undefined;
  readonly weaponBehind: boolean;
  readonly weaponPose: WeaponPose;
}

export function pose(s: PoseSpec = {}): Pose {
  const dx = s.dx ?? 0;
  const dy = s.dy ?? 0;
  const at = (p: Point, off: [number, number] = [0, 0], moved = true): Point => ({
    x: p.x + off[0] + (moved ? dx : 0),
    y: p.y + off[1] + (moved ? dy : 0),
  });
  return {
    body: at(STAND.body),
    head: at(STAND.head, s.head),
    pawFront: at(STAND.pawFront, s.pf),
    pawBack: at(STAND.pawBack, s.pb),
    footFront: at(STAND.footFront, s.ff, false),
    footBack: at(STAND.footBack, s.fb, false),
    torso: s.torso ?? 'stand',
    face: s.face ?? 'open',
    tail: s.tail ?? 'up',
    angle: s.angle,
    offAngle: s.offAngle,
    weaponBehind: s.weaponBehind ?? false,
    weaponPose: s.weaponPose ?? 'base',
  };
}

export interface AnimDef {
  readonly frames: readonly Pose[];
  /** How long each frame shows, in ms (same length as frames). */
  readonly frameMs: readonly number[];
  readonly loop: boolean;
  /**
   * Attack only: frames where the blow lands, or where a projectile leaves the paw. V15 times damage
   * from the attack profile; these line up with the plan's "hit at" times (start of the frame).
   */
  readonly hitFrames?: readonly number[];
}

function anim(frames: PoseSpec[], frameMs: number[] | number, loop: boolean, hitFrames?: number[]): AnimDef {
  const ms = typeof frameMs === 'number' ? frames.map(() => frameMs) : frameMs;
  return { frames: frames.map(pose), frameMs: ms, loop, ...(hitFrames ? { hitFrames } : {}) };
}

/** Animations every class shares. The weapon uses its carry angle unless a frame says otherwise. */
export const SHARED_ANIMS: Readonly<Record<Exclude<AnimName, 'attack'>, AnimDef>> = {
  idle: anim([
    {},
    { head: [0, 1], tail: 'mid' },
    { dy: 1, head: [0, -1], pf: [0, -1], pb: [0, -1], tail: 'mid' },
    { head: [0, 1] },
  ], 220, true),
  walk: anim([
    { ff: [2, 0], fb: [-2, 0], pf: [-1, 0], pb: [1, 0] },
    { dy: 1, ff: [1, 0], fb: [-1, 0], tail: 'mid' },
    { dy: -1, fb: [0, -1], pf: [1, 0], pb: [-1, 0], tail: 'mid' },
    { ff: [-2, 0], fb: [2, 0], pf: [1, 0], pb: [-1, 0] },
    { dy: 1, ff: [-1, 0], fb: [1, 0], tail: 'mid' },
    { dy: -1, ff: [0, -1], pf: [-1, 0], pb: [1, 0], tail: 'mid' },
  ], 100, true),
  hurt: anim([
    { dx: -2, head: [-1, -1], pf: [-2, -2], pb: [-1, -2], ff: [-1, 0], fb: [-1, 0], face: 'squint', tail: 'down' },
    { dx: -1, pf: [-1, -1], face: 'squint', tail: 'down' },
  ], 120, false),
  defeat: anim([
    { dx: -2, head: [-1, -1], pf: [-2, -3], pb: [-1, -2], face: 'squint', tail: 'down' },
    { dx: -2, dy: 2, torso: 'crouch', pf: [-1, 2], pb: [0, 2], ff: [-2, 0], face: 'ko', tail: 'down', angle: 'drop' },
    { dx: -3, dy: 4, head: [1, 1], torso: 'crouch', pf: [1, 1], pb: [0, 1], ff: [1, 0], fb: [-1, 0], face: 'ko', tail: 'flat', angle: 'drop' },
    { dx: -4, dy: 7, head: [5, 4], torso: 'flat', pf: [4, -1], pb: [2, -1], ff: [-2, 0], fb: [-3, 0], face: 'ko', tail: 'flat', angle: 'drop' },
  ], [120, 140, 160, 400], false),
  victory: anim([
    { dy: 1, torso: 'crouch', pf: [0, 1], pb: [0, 1], face: 'happy' },
    { dy: -3, ff: [0, -3], fb: [0, -3], pf: [0, -6], face: 'happy', angle: 90 },
    { dy: -4, ff: [0, -4], fb: [0, -4], pf: [-1, -8], pb: [0, -2], face: 'happy', angle: 90 },
    { pf: [-1, -7], face: 'happy', angle: 90 },
  ], [120, 140, 200, 240], true),
};

/**
 * Attack per weapon type: 6 frames (twin daggers 8). Frame times put the hit frame's start at the
 * plan's "hit at" time: sword 240, hammer 520, daggers 140 + 300, spear 300, and the release for
 * bow (300), staff (500) and flasks (260).
 */
export const ATTACKS: Readonly<Record<WeaponType, AnimDef>> = {
  sword: anim([
    { angle: 45 },
    { dx: -1, pf: [-1, -9], angle: 90, face: 'focus' },
    { dx: -1, pf: [-4, -11], angle: 135, face: 'focus', weaponBehind: true },
    { dx: 1, pf: [0, -7], angle: 45, face: 'focus', ff: [1, 0] },
    { dx: 2, pf: [3, -1], angle: 0, face: 'focus', ff: [2, 0] },
    { dx: 1, pf: [2, 1], angle: 315, ff: [1, 0] },
  ], [60, 60, 60, 60, 90, 90], false, [4]),
  hammer: anim([
    { angle: 45 },
    { dx: -1, pf: [-1, -9], angle: 90, face: 'focus' },
    { dx: -2, dy: 1, torso: 'crouch', pf: [-4, -11], angle: 135, face: 'focus', weaponBehind: true },
    { dx: 0, pf: [0, -9], angle: 90, face: 'focus' },
    { dx: 2, dy: 1, torso: 'crouch', pf: [3, -1], angle: 315, face: 'squint', ff: [2, 0] },
    { dx: 1, pf: [2, 0], angle: 0 },
  ], [100, 160, 160, 100, 120, 140], false, [4]),
  daggers: anim([
    { angle: 0 },
    { dx: 2, ff: [2, 0], fb: [1, 0], pf: [-1, 0], angle: 0, face: 'focus' },
    { dx: 2, ff: [2, 0], fb: [1, 0], pf: [-2, 0], pb: [1, 0], angle: 0, face: 'focus' },
    { dx: 3, ff: [3, 0], fb: [1, 0], pf: [4, -1], angle: 0, face: 'focus' },
    { dx: 2, ff: [2, 0], fb: [1, 0], pf: [0, 0], pb: [2, 0], angle: 0, face: 'focus' },
    { dx: 3, ff: [3, 0], fb: [1, 0], pf: [-1, 0], pb: [9, -1], angle: 0, offAngle: 0, face: 'focus' },
    { dx: 2, ff: [2, 0], fb: [1, 0], pf: [0, 0], pb: [2, 0], angle: 0 },
    { dx: 1, ff: [1, 0], angle: 0 },
  ], [50, 40, 50, 80, 80, 80, 80, 80], false, [3, 5]),
  spear: anim([
    { angle: 45 },
    { dx: -1, pf: [-3, -1], angle: 0, face: 'focus' },
    { dx: -2, dy: 1, torso: 'crouch', pf: [-5, -1], angle: 0, face: 'focus', fb: [-1, 0] },
    { dx: 1, pf: [1, -1], angle: 0, face: 'focus', ff: [1, 0] },
    { dx: 2, pf: [5, -1], angle: 0, face: 'focus', ff: [3, 0] },
    { dx: 1, pf: [1, 0], angle: 0, ff: [1, 0] },
  ], [70, 70, 80, 80, 100, 100], false, [4]),
  bow: anim([
    { pf: [2, -2], pb: [3, -2], angle: 0 },
    { pf: [3, -2], pb: [1, -2], angle: 0, face: 'focus', weaponPose: 'drawn' },
    { dx: -1, pf: [5, -2], pb: [-2, -2], angle: 0, face: 'focus', weaponPose: 'drawn' },
    { pf: [4, -2], pb: [-3, -3], angle: 0, face: 'focus' },
    { pf: [3, -2], pb: [-2, -1], angle: 0 },
    { pf: [1, 0], angle: 0 },
  ], [80, 110, 110, 80, 80, 100], false, [3]),
  staff: anim([
    { angle: 90 },
    { pf: [0, -3], angle: 90, face: 'focus' },
    { dy: -1, pf: [0, -5], angle: 90, face: 'focus', weaponPose: 'glow' },
    { dy: -1, pf: [0, -5], pb: [2, -4], angle: 90, face: 'blink', weaponPose: 'glow' },
    { dx: 1, pf: [3, -4], angle: 45, face: 'focus', weaponPose: 'glow', ff: [1, 0] },
    { pf: [1, -1], angle: 90 },
  ], [100, 150, 150, 100, 100, 120], false, [4]),
  flasks: anim([
    { angle: 90 },
    { dx: -1, pf: [-3, 1], angle: 135, face: 'focus' },
    { dx: -2, dy: 1, torso: 'crouch', pf: [-5, 2], angle: 180, face: 'focus' },
    { dx: 1, pf: [2, -3], angle: 45, face: 'focus', weaponPose: 'hidden', ff: [1, 0] },
    { dx: 1, pf: [3, -4], face: 'open', weaponPose: 'hidden', ff: [1, 0] },
    { pf: [0, 0], angle: 90 },
  ], [80, 90, 90, 80, 80, 100], false, [3]),
};

/** The six animations of a class with this weapon type. */
export function animsFor(weaponType: WeaponType): Readonly<Record<AnimName, AnimDef>> {
  return { ...SHARED_ANIMS, attack: ATTACKS[weaponType] };
}
