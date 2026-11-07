import { expect, it } from 'vitest';
import * as T from 'three';
import { CARD_CAMERAS, FACE_LIMIT, HEAD_YAW_LIMIT, cardBodyYaw, cardFormation, cardFrameHeight, focusCardHead } from './card-staging';

it('orders the three camera widths and keeps front and rear rows distinct', () => {
  expect(CARD_CAMERAS.close.worldWidth).toBeLessThan(CARD_CAMERAS.wide.worldWidth);
  expect(CARD_CAMERAS.wide.worldWidth).toBeLessThan(CARD_CAMERAS.far.worldWidth);
  for (const side of ['party', 'enemy'] as const) {
    const actor = { side, slot: 0, role: 'guardian' as const };
    expect(Math.abs(cardFormation(actor, 'front').x)).toBeLessThan(Math.abs(cardFormation(actor, 'rear').x));
    for (const aspect of [1.6, 2, 2.8]) expect(cardFrameHeight(aspect, 'wide')).toBeGreaterThanOrEqual(4.8);
  }
});

it('keeps atelier camera choices distinct when a short desktop stage reaches the height floor', () => {
  const previous = window.__LOOK_V2__;
  try {
    window.__LOOK_V2__ = true;
    for (const aspect of [3.2, 4.5]) {
      const close = cardFrameHeight(aspect, 'close');
      const wide = cardFrameHeight(aspect, 'wide');
      const far = cardFrameHeight(aspect, 'far');
      expect(close).toBeLessThan(wide);
      expect(wide).toBeLessThan(far);
      expect(wide).toBe(4.8);
    }
    window.__LOOK_V2__ = false;
    for (const preset of ['close', 'wide', 'far'] as const) {
      expect(cardFrameHeight(4.5, preset)).toBe(4.8);
    }
  } finally { window.__LOOK_V2__ = previous; }
});

it('keeps head yaw bounded and animated face directions inside the 55 degree cone', () => {
  const model = new T.Group();
  const head = new T.Object3D();
  model.add(head);
  head.position.y = 1.5;
  const camera = new T.PerspectiveCamera();
  camera.position.set(0, 7.2, 11.6);
  const forward = new T.Vector3();
  const position = new T.Vector3();
  const target = new T.Vector3();
  const gaze = { yaw: 0, pitch: 0 };
  for (const side of ['party', 'enemy']) {
    for (let sample = 0; sample < 80; sample++) {
      model.rotation.y = cardBodyYaw(side, sample * .17, sample % 5 / 4);
      head.rotation.set(Math.sin(sample) * .7, Math.cos(sample) * 1.8, Math.sin(sample * .7) * .4);
      target.set(Math.sin(sample) * 5, 1.3, Math.cos(sample) * 3);
      focusCardHead(head, camera, target, gaze, 1 / 60, true);
      head.getWorldDirection(forward);
      head.getWorldPosition(position);
      expect(forward.angleTo(camera.position.clone().sub(position))).toBeLessThanOrEqual(FACE_LIMIT + 1e-7);
      expect(Math.abs(gaze.yaw)).toBeLessThanOrEqual(HEAD_YAW_LIMIT);
    }
  }
});

it('damps a changing gaze and freezes its progress while paused', () => {
  const parent = new T.Group();
  const head = new T.Object3D();
  parent.add(head);
  const camera = new T.PerspectiveCamera();
  camera.position.set(0, 7.2, 11.6);
  const target = new T.Vector3(4, 1, 0);
  const gaze = { yaw: 0, pitch: 0 };
  focusCardHead(head, camera, target, gaze, 1 / 60, false);
  expect(gaze.yaw).toBeGreaterThan(0);
  expect(gaze.yaw).toBeLessThan(HEAD_YAW_LIMIT);
  const firstYaw = gaze.yaw;
  head.quaternion.identity();
  focusCardHead(head, camera, target, gaze, 0, false);
  expect(gaze.yaw).toBe(firstYaw);
  head.quaternion.identity();
  focusCardHead(head, camera, target, gaze, 1 / 60, false);
  expect(gaze.yaw).toBeGreaterThan(firstYaw);
  expect(gaze.yaw).toBeLessThan(HEAD_YAW_LIMIT);
});
