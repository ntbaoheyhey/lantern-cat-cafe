import { EventEmitter } from 'node:events';
import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('phaser', () => ({ default: { Scene: class {}, Scenes: { Events: { CREATE: 'create', SHUTDOWN: 'shutdown' } } } }));
vi.mock('../rig', () => ({ CLASS_LOOKS: { warrior: { name: 'warrior' }, witch: { name: 'witch' } }, bakeCat: vi.fn(() => ({
  key: 'cat-sheet', origin: { x: 0.5, y: 1 }, anims: { idle: { key: 'cat-idle' }, walk: { key: 'cat-walk' }, attack: { key: 'cat-attack' }, hurt: { key: 'cat-hurt' } },
})) }));
vi.mock('../arena/assets', () => ({ equippedVisuals: () => ({}), bakeMonster: () => ({ walk: 'monster-walk' }) }));
vi.mock('../combat', () => ({ CombatDirector: class { destroy = vi.fn(); update = vi.fn(); play = vi.fn(); }, asCombatScene: () => ({}), weaponOf: () => 'sword', buildIdleCues: () => [] }));
import { StageScene } from './StageScene';
import { bakeCat, CLASS_LOOKS } from '../rig';
import { sampleServerStateV2 } from '../../layout/a11y/fixtures';

beforeEach(() => vi.clearAllMocks());

function sceneHarness() {
  const scene = new StageScene(), events = new EventEmitter();
  let active = false;
  const sprite = () => { const s = { setOrigin: vi.fn(), play: vi.fn(), destroy: vi.fn() }; s.setOrigin.mockReturnValue(s); return s; };
  const cat = sprite(), monster = sprite();
  const add = vi.fn().mockReturnValueOnce(cat).mockReturnValueOnce(monster);
  Object.assign(scene, { events, sys: { isActive: () => active }, scale: { width: 320 }, add: { sprite: add } });
  // Phaser invokes create while CREATING, then enters RUNNING and emits CREATE.
  const start = () => { scene.create(); expect(add).not.toHaveBeenCalled(); active = true; events.emit('create'); };
  return { scene, events, add, cat, monster, start };
}

it('renders the latest queued state after Phaser enters RUNNING, without another state update', () => {
  const { scene, add, cat, monster, start } = sceneHarness();
  const first = sampleServerStateV2(), latest = sampleServerStateV2({ classId: 'witch' });
  scene.show(first, false); scene.show(latest, true);
  expect(add).not.toHaveBeenCalled();
  start();
  expect(add).toHaveBeenCalledTimes(2);
  expect(bakeCat).toHaveBeenCalledWith(scene, CLASS_LOOKS.witch, {});
  expect(cat.play).toHaveBeenCalledWith('cat-idle');
  expect(monster.play).toHaveBeenCalledWith('monster-walk');
});

it('draws a newly created replacement scene even when its state object is unchanged', () => {
  const state = sampleServerStateV2();
  for (let remount = 0; remount < 3; remount++) {
    const { scene, add, cat, start } = sceneHarness();
    scene.show(state, false); start();
    expect(add).toHaveBeenCalledTimes(2);
    expect(cat.play).toHaveBeenCalledWith('cat-walk');
    const destroy = vi.spyOn(scene['director']!, 'destroy');
    scene['events'].emit('shutdown');
    expect(destroy).toHaveBeenCalledOnce();
  }
});

it('cancels a queued startup render when the scene shuts down before CREATE', () => {
  const { scene, events, add } = sceneHarness();
  scene.show(sampleServerStateV2(), false); scene.create();
  events.emit('shutdown');
  expect(events.listenerCount('create')).toBe(0);
  events.emit('create');
  expect(add).not.toHaveBeenCalled();
});
