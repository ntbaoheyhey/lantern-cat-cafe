import { expect, it } from 'vitest';
import { DepthModel } from './model';
import { galleryFixture } from './feel-lab';
import { createActionPlan } from '../../squad/turn3d/effects';
import { createCardActionPlan } from './card-action-plan';

it('changes presentation identity while preserving existing action and target IDs', () => {
  const fixture = galleryFixture('enemy:button-guard:basic');
  expect(fixture.plan.skillId).toBe('guardAttack');
  expect(fixture.plan.presentationId).toBe('enemy:button-guard:basic');
  expect(fixture.plan.name).toBe('Button tap');
  const events = fixture.plan.events;
  const unknown = createCardActionPlan(events, 'future-effect');
  expect(unknown).toEqual(createActionPlan(events));
  expect(events).toEqual(fixture.plan.events);
});

it('gives each starter ultimate a bounded presentation duration', () => {
  for (const id of ['mochi-4', 'soot-4', 'clover-4']) {
    const { plan } = galleryFixture(id);
    expect(plan.ultimate).toBe(true);
    expect(plan.duration).toBeGreaterThanOrEqual(1200);
    expect(plan.duration).toBeLessThanOrEqual(1800);
  }
});

it('returns from preview to the precise in-progress battle without changing saved progress', () => {
  const model = new DepthModel(true);
  model.start(1);
  model.enter('0-0');
  model.fight();
  model.sceneReady = true;
  model.step();
  model.animationAt = 137;
  const before = JSON.stringify(model.state);
  const plan = model.plan;
  expect(plan).toBeTruthy();
  model.inspect('soot-2', .5, true);
  model.gallerySpeed = .25;
  const time = model.animationAt;
  model.tick(100);
  expect(model.animationAt).toBe(time + 25);
  model.inspect('clover-4', .6);
  model.closeGallery();
  expect(model.plan).toBe(plan);
  expect(model.animationAt).toBe(137);
  expect(model.paused).toBe(false);
  expect(JSON.stringify(model.state)).toBe(before);
});
