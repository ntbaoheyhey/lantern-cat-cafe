import {beforeEach, expect, it, vi} from 'vitest';
import * as T from 'three';
import type {SceneView} from '../../squad/turn3d/scene';
import {SpineScene} from './scene';

const {load} = vi.hoisted(() => ({load: vi.fn()}));
vi.mock('./assets', () => ({loadSpineActor: load}));
vi.mock('../vfx-craft/drawn-poses', () => ({loadDrawnPoseSet: vi.fn().mockResolvedValue(undefined)}));
beforeEach(() => load.mockImplementation(async () => ({root: new T.Group(), dispose() {}, onCue() {}})));

function fixture() {
  const effects = {prepare: vi.fn().mockResolvedValue(undefined), ready: Promise.resolve(),
    overrides: {effects: new Map<string, unknown>()}, clear: vi.fn()};
  const scene: SpineScene = Object.assign(Object.create(SpineScene.prototype) as SpineScene, {
    scene: new T.Scene(), actors: new Map(), pending: new Map(), failed: new Set(), lanes: new Map(), sampled: new Map(), homes: new Map(),
    craftEffects: {effects: {}, prepare: vi.fn().mockResolvedValue(undefined)}, effects,
    loading: {completed: 0, total: 0}, stats: {loaded: 0}, time: 0, disposed: false, ready: false,
    onFailure: vi.fn(), battleKey: undefined, view: () => view, shadowTexture: new T.Texture(),
  });
  const view = {formationC2: true, battleKey: {formationC2: true, gameplayA6: true},
    actors: [{id: 'needle-moth', side: 'enemy', cardRpg: {cardId: 'needle-moth'}}]} as SceneView;
  return {scene, effects, view};
}

it('holds scene readiness until a newly present override has its fallback atlas', async () => {
  const {scene, effects, view} = fixture();
  scene.prepare(view);
  await vi.waitFor(() => expect(scene.ready).toBe(true));
  expect(effects.prepare).toHaveBeenLastCalledWith([], true);
  let release!: () => void;
  effects.prepare.mockImplementation(() => new Promise<void>(resolve => {release = resolve;}));
  effects.overrides.effects.set('enemy:needle-moth', {});
  scene.prepare(view);
  expect(scene.ready).toBe(false);
  await vi.waitFor(() => expect(effects.prepare).toHaveBeenLastCalledWith(['needle-moth'], true));
  release();
  await vi.waitFor(() => expect(scene.ready).toBe(true));
});

it('reloads fallback readiness for the same roster in an archived C2 battle', async () => {
  const {scene, effects, view} = fixture();
  scene.prepare(view);
  await vi.waitFor(() => expect(scene.ready).toBe(true));
  scene.prepare({...view, battleKey: {formationC2: true, gameplayA6: false}});
  await vi.waitFor(() => expect(scene.ready).toBe(true));
  expect(effects.prepare).toHaveBeenLastCalledWith(['needle-moth'], true);
});

it('does not let a superseded narrow request release a charge fallback gate', async () => {
  const {scene, effects, view} = fixture();
  let releaseOld!: () => void, releaseCurrent!: () => void;
  effects.prepare.mockImplementationOnce(() => new Promise<void>(resolve => {releaseOld = resolve;}))
    .mockImplementationOnce(() => new Promise<void>(resolve => {releaseCurrent = resolve;}));
  scene.prepare(view);
  await vi.waitFor(() => expect(effects.prepare).toHaveBeenCalledTimes(1));
  scene.prepare({...view, frame: {plan: {actorId: 'needle-moth', events: [{type: 'charge', actorId: 'needle-moth'}]}}} as SceneView);
  await vi.waitFor(() => expect(effects.prepare).toHaveBeenCalledTimes(2));
  expect(effects.prepare).toHaveBeenLastCalledWith(['needle-moth'], true);
  releaseOld();
  await Promise.resolve();await Promise.resolve();await Promise.resolve();
  expect(scene.ready).toBe(false);
  releaseCurrent();
  await vi.waitFor(() => expect(scene.ready).toBe(true));
});
