import { expect, it } from 'vitest';
import { DepthModel } from './model';

function playing(a6: boolean) {
  const model = new DepthModel(true, true, true, a6);
  model.start(1); model.enter('0-0'); model.fight();
  model.sceneReady = true; model.step();
  expect(model.plan).toBeTruthy();
  return model;
}

it('keeps A6 playback in real time when the canvas delta was clipped on a slow frame', () => {
  const model = playing(true);
  expect(model.a6Battle).toBe(true);
  model.tick(10, 1000);
  const before = model.animationAt;
  model.tick(100, 1200);
  expect(model.animationAt - before).toBe(200);
  expect(model.playbackAt).toBe(210);
});

it('does not catch up paused time or an entire suspended tab interval', () => {
  const model = playing(true);
  model.tick(10, 1000);
  model.paused = true; model.tick(100, 12000);
  expect(model.animationAt).toBe(10);
  model.paused = false; model.tick(100, 12100);
  expect(model.animationAt).toBe(110);
  model.tick(100, 50000);
  expect(model.animationAt).toBe(360);
});

it('preserves the caller-supplied OFF playback clock', () => {
  const model = playing(false);
  model.tick(10, 1000); model.tick(100, 1200);
  expect(model.animationAt).toBe(110);
  expect(model.playbackAt).toBe(110);
});

it('keeps gallery playback on its supplied clock even from an A6 account', () => {
  const model = playing(true);
  model.inspect(model.galleryActions[0]!.id, 0, true);
  model.tick(10, 1000); model.tick(100, 1200);
  expect(model.animationAt).toBe(110);
});

it('applies the selected A6 speed to elapsed time but keeps banner time at real speed', () => {
  const model = playing(true);
  model.state.settings.speed = 2;
  model.tick(10, 1000); model.tick(100, 1200);
  expect(model.animationAt).toBe(420);
  expect(model.playbackAt).toBe(210);
});
