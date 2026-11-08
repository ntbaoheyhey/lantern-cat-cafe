import * as T from 'three';
import { isReadableBattle } from './look-b2';
import { isLookV2 } from './look-v2';
import type { TurnActor } from '@taskbar-hero/game-rules/src/squad/turn/types';
import type { Position } from './formation';

export type CardCamera = 'close' | 'wide' | 'far';
export const CARD_CAMERAS = {
  close: { name: 'A · Closer', worldWidth: 12.4 },
  wide: { name: 'B · Medium', worldWidth: 13.8 },
  far: { name: 'C · Wider', worldWidth: 15.4 },
} as const;
export const FACE_LIMIT = 55 * Math.PI / 180;
export const HEAD_YAW_LIMIT = 35 * Math.PI / 180;

/** Front companions stand nearer the opposing half, with staggered depth lanes. */
export function cardFormation(actor: Pick<TurnActor, 'side' | 'slot' | 'role'>, row = 'front'): Position {
  const side = actor.side === 'party' ? -1 : 1;
  if (isReadableBattle()) {
    if (actor.role === 'yarn') return { x: 2.15, y: 0, z: -.6 };
    const lane = actor.slot % 3;
    const depth = [-.55, .75, -1.4][lane]!;
    const distance = actor.side === 'enemy' ? [1.3, 2.95, 3.45][lane]! + (row === 'rear' ? .12 : 0)
      : row === 'rear' ? [2.8, 3.4, 2.85][lane]! : [1.45, 2.85, 3.1][lane]!;
    return { x: side * distance, y: 0, z: depth };
  }
  if (actor.role === 'yarn') return { x: 2.8, y: 0, z: -.55 };
  const lane = actor.slot % 3;
  const depth = [-1.4, 1.15, -.1][lane]!;
  const distance = row === 'rear' ? 3.7 : 2.1;
  return { x: side * (distance + (lane === 1 ? .35 : 0)), y: 0, z: depth };
}

export function cardFrameHeight(aspect: number, preset: CardCamera) {
  if (isReadableBattle()) {
    const widths = { close: 9.6, wide: 10.6, far: 12.0 };
    return Math.max(3.8, widths.wide / aspect) * widths[preset] / widths.wide;
  }
  if (isLookV2()) {
    const medium = Math.max(4.8, CARD_CAMERAS.wide.worldWidth / aspect);
    return medium * CARD_CAMERAS[preset].worldWidth / CARD_CAMERAS.wide.worldWidth;
  }
  return Math.max(4.8, CARD_CAMERAS[preset].worldWidth / aspect);
}

export function cardBodyYaw(side: string, target: number, weight: number) {
  const rest = (side === 'party' ? 1 : -1) * 25 * Math.PI / 180;
  const turn = Math.atan2(Math.sin(target - rest), Math.cos(target - rest));
  return T.MathUtils.clamp(rest + turn * weight, -32 * Math.PI / 180, 32 * Math.PI / 180);
}

const position = new T.Vector3();
const direction = new T.Vector3();
const towardCamera = new T.Vector3();
const parentRotation = new T.Quaternion();
const worldRotation = new T.Quaternion();
const correction = new T.Quaternion();
const identity = new T.Quaternion();
const gazeEuler = new T.Euler();

/** Apply gaze after the authored pose, then keep the face within a camera-facing cone. */
export function focusCardHead(
  head: T.Object3D,
  camera: T.Camera,
  target: T.Vector3 | undefined,
  gaze: { yaw: number; pitch: number },
  delta: number,
  fixed: boolean,
) {
  head.getWorldPosition(position);
  head.parent!.getWorldQuaternion(parentRotation);
  direction.copy(target ?? camera.position).sub(position).applyQuaternion(correction.copy(parentRotation).invert());
  const yaw = T.MathUtils.clamp(Math.atan2(direction.x, direction.z), -HEAD_YAW_LIMIT, HEAD_YAW_LIMIT);
  const pitch = T.MathUtils.clamp(-Math.atan2(direction.y, Math.hypot(direction.x, direction.z)), -.17, .17);
  gaze.yaw = fixed ? yaw : T.MathUtils.damp(gaze.yaw, yaw, 9, delta);
  gaze.pitch = fixed ? pitch : T.MathUtils.damp(gaze.pitch, pitch, 9, delta);
  head.quaternion.multiply(correction.setFromEuler(gazeEuler.set(gaze.pitch, gaze.yaw, 0)));

  head.getWorldQuaternion(worldRotation);
  direction.set(0, 0, 1).applyQuaternion(worldRotation);
  towardCamera.copy(camera.position).sub(position).normalize();
  const angle = direction.angleTo(towardCamera);
  if (angle > FACE_LIMIT) {
    correction.setFromUnitVectors(direction, towardCamera).slerp(identity, FACE_LIMIT / angle);
    worldRotation.premultiply(correction);
    head.quaternion.copy(parentRotation.invert()).multiply(worldRotation);
  }
}
