import {beforeEach, expect, it, vi} from 'vitest';
import * as T from 'three';
import type {SceneView} from '../../squad/turn3d/scene';
import type {SpineActor} from './assets';
import {SpineScene} from './scene';

const {load} = vi.hoisted(() => ({load: vi.fn()}));
vi.mock('./assets', () => ({loadSpineActor: load}));
beforeEach(() => load.mockReset());

function request() {
  let resolve!: (actor: SpineActor) => void, reject!: (error: Error) => void;
  const promise = new Promise<SpineActor>((yes, no) => {resolve = yes; reject = no;});
  return {promise, resolve, reject};
}
function actor() {
  return {root: new T.Group(), dispose: vi.fn(), onCue: () => {}} as unknown as SpineActor;
}
// Exercise the real scene lifecycle without constructing a WebGL context.
function fixture() {
  let view = {actors: []} as unknown as SceneView;
  const scene: SpineScene = Object.assign(Object.create(SpineScene.prototype) as SpineScene, {
    scene: new T.Scene(), actors: new Map(), pending: new Map(), failed: new Set(), lanes: new Map(), sampled: new Map(), homes: new Map(),
    trails: {dispose: vi.fn()}, bossPhase: {dispose: vi.fn()},
    loading: {completed: 0, total: 0}, stats: {loaded: 0}, time: 0, disposed: false, ready: false,
    geometry: new T.PlaneGeometry(), ringGeometry: new T.RingGeometry(), shadowTexture: new T.Texture(),
    onFailure: vi.fn(), view: () => view,
    resize: {disconnect: vi.fn()}, stage: {dispose: vi.fn()}, effects: {dispose: vi.fn()}, bodyFx: {dispose: vi.fn()}, cinema: {dispose: vi.fn()}, postFx: {dispose: vi.fn()}, numbers: {dispose: vi.fn()},
    renderer: {domElement: document.createElement('canvas'), dispose: vi.fn(), forceContextLoss: vi.fn()},
  });
  const switchTo = (...ids: string[]) => {
    view = {actors: ids.map(id => ({id, side: 'enemy', cardRpg: {cardId: id}}))} as unknown as SceneView;
    scene.prepare(view);
  };
  return {scene, switchTo};
}

it('releases an obsolete load gate and enemy lane before its image arrives', async () => {
  const old = request(), next = request(); load.mockReturnValueOnce(old.promise).mockReturnValueOnce(next.promise);
  const {scene, switchTo} = fixture(); switchTo('old'); switchTo('next');
  next.resolve(actor()); await vi.waitFor(() => expect(scene.ready).toBe(true));
  expect(scene.loading).toMatchObject({completed: 1, total: 1});
  expect(scene.actors.get('next')?.lane).toBe(0);
  const obsolete = actor(); old.resolve(obsolete);
  await vi.waitFor(() => expect(obsolete.dispose).toHaveBeenCalledOnce());
  expect([...scene.actors.keys()]).toEqual(['next']); expect(scene.ready).toBe(true);
  scene.dispose();
});

it('does not let a late first request replace or complete the same actor requested again', async () => {
  const first = request(), latest = request(); load.mockReturnValueOnce(first.promise).mockReturnValueOnce(latest.promise);
  const {scene, switchTo} = fixture(); switchTo('returning'); switchTo(); switchTo('returning');
  const obsolete = actor(); first.resolve(obsolete);
  await vi.waitFor(() => expect(obsolete.dispose).toHaveBeenCalledOnce());
  expect(scene.ready).toBe(false); expect(scene.actors.size).toBe(0);
  const current = actor(); latest.resolve(current);
  await vi.waitFor(() => expect(scene.ready).toBe(true));
  expect(scene.actors.get('returning')?.actor).toBe(current);
  scene.dispose();
});

it('ignores an obsolete failure while preserving failures for the current roster', async () => {
  const old = request(), next = request(); load.mockReturnValueOnce(old.promise).mockReturnValueOnce(next.promise);
  const {scene, switchTo} = fixture(); switchTo('old'); switchTo('next');
  const failure = (scene as unknown as {onFailure: ReturnType<typeof vi.fn>}).onFailure;
  old.reject(new Error('removed load')); next.resolve(actor());
  await vi.waitFor(() => expect(scene.ready).toBe(true)); expect(failure).not.toHaveBeenCalled();
  load.mockRejectedValueOnce(new Error('current load')); switchTo('broken');
  await vi.waitFor(() => expect(failure).toHaveBeenCalledOnce()); expect(scene.ready).toBe(false);
  expect(scene.loading).toMatchObject({completed: 0, total: 1});
  switchTo(); expect(scene.ready).toBe(true); expect(scene.loading.total).toBe(0);
  scene.dispose();
});

it('disposes late actors without changing or reporting to a destroyed scene', async () => {
  const one = request(), two = request(); load.mockReturnValueOnce(one.promise).mockReturnValueOnce(two.promise);
  const {scene, switchTo} = fixture(); switchTo('one', 'two'); scene.dispose();
  const obsolete = actor(); one.resolve(obsolete); two.reject(new Error('late failure'));
  await vi.waitFor(() => expect(obsolete.dispose).toHaveBeenCalledOnce());
  const internal = scene as unknown as {onFailure: ReturnType<typeof vi.fn>; pending: Map<string, symbol>; lanes: Map<string, unknown>};
  expect(internal.onFailure).not.toHaveBeenCalled(); expect(scene.ready).toBe(false);
  expect(scene.actors.size).toBe(0); expect(internal.pending.size).toBe(0); expect(internal.lanes.size).toBe(0);
  switchTo('ignored'); expect(load).toHaveBeenCalledTimes(2);
});
