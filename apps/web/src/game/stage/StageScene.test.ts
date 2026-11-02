import { EventEmitter } from 'node:events';
import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('phaser', () => ({ default: { Scene: class {}, Scenes: { Events: { CREATE: 'create', SHUTDOWN: 'shutdown', DESTROY: 'destroy' } } } }));
vi.mock('../rig', () => ({ CLASS_LOOKS: { warrior: { name: 'warrior' }, witch: { name: 'witch' } }, bakeCat: vi.fn(() => ({
  key: 'cat-sheet', origin: { x: 0.5, y: 1 }, anims: { idle: { key: 'cat-idle', frames: ['idle:0'] }, walk: { key: 'cat-walk' }, attack: { key: 'cat-attack', frames: ['attack:0'], frameMs: [240], hitFrames: [0] }, hurt: { key: 'cat-hurt' } },
})) }));
vi.mock('../arena/assets', () => ({ equippedVisuals: vi.fn(() => ({})), bakeMonster: () => ({ walk: 'monster-walk', hit: 'monster-hit', defeat: 'monster-defeat' }), preloadMonsterArt: vi.fn() }));
vi.mock('../combat', async () => ({ ...await vi.importActual('../combat/timeline'), ...await vi.importActual('../combat/pool') }));
import { StageScene } from './StageScene';
import { equippedVisuals } from '../arena/assets';
import { bakeCat, CLASS_LOOKS } from '../rig';
import { sampleServerStateV2 } from '../../layout/a11y/fixtures';

beforeEach(() => vi.clearAllMocks());

function sceneHarness() {
  const scene = new StageScene(), events = new EventEmitter();
  let active = false;
  const sprite = () => {
    const s = { x: 0, y: 84, alpha: 1, originX: .5, originY: 1, scaleX: 1, scaleY: 1, frame: { width: 24, height: 24, name: '0' }, texture: { key: 'test' }, setOrigin: vi.fn(), play: vi.fn(), stop: vi.fn(), setFrame: vi.fn(), setScale: vi.fn(), setPosition: vi.fn(), clearTint: vi.fn(), setTexture: vi.fn(), setAlpha: vi.fn(), destroy: vi.fn() };
    for (const key of ['setOrigin', 'play', 'stop', 'setFrame', 'setScale', 'setPosition', 'clearTint', 'setTexture', 'setAlpha'] as const) s[key].mockReturnValue(s);
    s.setPosition.mockImplementation((x, y) => { s.x = x; s.y = y; return s; });
    s.setFrame.mockImplementation(name => { s.frame.name = name; return s; });
    s.setScale.mockImplementation(scale => { s.scaleX = scale; s.scaleY = scale; return s; });
    return s;
  };
  const cat = sprite(), monster = sprite();
  const add = vi.fn().mockReturnValueOnce(cat).mockReturnValueOnce(monster);
  const graphics = () => {
    const g = { setDepth: vi.fn(), clear: vi.fn(), fillStyle: vi.fn(), fillEllipse: vi.fn(), fillRect: vi.fn(), destroy: vi.fn() };
    for (const key of ['setDepth', 'clear', 'fillStyle', 'fillEllipse', 'fillRect'] as const) g[key].mockReturnValue(g);
    return g;
  };
  const effects = () => {
    const fx = { setOrigin: vi.fn(), setDepth: vi.fn(), setScale: vi.fn(), setPosition: vi.fn(), setVisible: vi.fn(), setAlpha: vi.fn(), setTexture: vi.fn(), setText: vi.fn(), setColor: vi.fn(), destroy: vi.fn() };
    for (const key of ['setOrigin', 'setDepth', 'setScale', 'setPosition', 'setVisible', 'setAlpha', 'setTexture', 'setText', 'setColor'] as const) fx[key].mockReturnValue(fx);
    return fx;
  };
  const text = vi.fn(effects), image = vi.fn(effects);
  Object.assign(scene, { game: { canvas: document.createElement('canvas') }, events, sys: { isActive: () => active }, scale: { width: 320, height: 96 }, textures: { getPixelAlpha: () => 255, exists: () => true }, add: { sprite: add, graphics, text, image } });
  // Phaser invokes create while CREATING, then enters RUNNING and emits CREATE.
  const start = () => { scene.create(); expect(add).not.toHaveBeenCalled(); active = true; events.emit('create'); };
  return { scene, events, add, cat, monster, start, text, image };
}

it('defers a resize before scene boot and uses the latest scale when CREATE arrives', () => {
  const { scene, cat, start } = sceneHarness();
  // Phaser has not injected the scale plugin into a queued scene yet.
  Object.assign(scene, { scale: undefined });
  scene.show(sampleServerStateV2(), false);
  expect(() => scene.relayout()).not.toThrow();
  Object.assign(scene, { scale: { width: 453, height: 96 } });
  start();
  expect(cat.x).toBe(Math.round(453 * .3));
});

it('renders the latest queued state after Phaser enters RUNNING, without another state update', () => {
  const { scene, add, cat, monster, start } = sceneHarness();
  const first = sampleServerStateV2(), latest = sampleServerStateV2({ classId: 'witch' });
  scene.show(first, false); scene.show(latest, true);
  expect(add).not.toHaveBeenCalled();
  start();
  expect(add).toHaveBeenCalledTimes(2);
  expect(bakeCat).toHaveBeenCalledWith(scene, CLASS_LOOKS.witch, {});
  expect(cat.stop).toHaveBeenCalled();
  expect(monster.stop).toHaveBeenCalled();
});

it('draws a newly created replacement scene even when its state object is unchanged', () => {
  const state = sampleServerStateV2();
  for (let remount = 0; remount < 3; remount++) {
    const { scene, add, cat, start } = sceneHarness();
    scene.show(state, false); start();
    expect(add).toHaveBeenCalledTimes(2);
    expect(cat.play).toHaveBeenCalledWith('cat-idle', true);
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

for (const reduced of [false, true]) it(`renders the existing impact cue and cleans effects on shutdown (reduced=${reduced})`, () => {
  const { scene, start, text, image, monster, events } = sceneHarness();
  scene.show(sampleServerStateV2({ round: 1, kills: 0, level: 60 }), reduced); start();
  // Advance the real existing timeline until its first registered impact.
  for (let i = 0; i < 200 && !text.mock.results.some(r => r.value.setText.mock.calls.length > 0); i++) scene.update(i * 20, 20);
  expect(text).toHaveBeenCalled();
  expect(image).toHaveBeenCalled();
  const number = text.mock.results.find(r => r.value.setText.mock.calls.length > 0)!.value;
  const flash = image.mock.results.find(r => r.value.setTexture.mock.calls.length > 0)!.value;
  expect(number.setAlpha).toHaveBeenCalledWith(1);
  expect(flash.setVisible).toHaveBeenCalledWith(true);
  if (reduced) expect(monster.x).toBeLessThan(scene['homes'][1]);
  else expect(Number(scene['game'].canvas.dataset.stageContactGap)).toBe(2);
  expect(scene['hp']!.value).toBeLessThan(scene['hp']!.max);
  events.emit('shutdown');
  expect(number.destroy).toHaveBeenCalledOnce();
  expect(flash.destroy).toHaveBeenCalledOnce();
});

it('shows a muted Miss without flashing or shaking a dodging target', () => {
  const { scene, start, text, image, cat } = sceneHarness();
  scene.show(sampleServerStateV2({ gated: true }), true); start();
  scene['hit'](cat as never, 0, false, true);
  scene.update(0, 20);
  const number = text.mock.results.find(r => r.value.setText.mock.calls.some(([label]: string[]) => label === 'Miss'))!.value;
  expect(number.setText).toHaveBeenCalledWith('Miss');
  expect(number.setColor).toHaveBeenCalledWith('#b8a9c9');
  expect(image.mock.results.every(r => !r.value.setVisible.mock.calls.some(([visible]: boolean[]) => visible))).toBe(true);
});

it('preserves actors and the cue loop for plain claims and locks; mounts one pair for changed visuals', () => {
  const { scene, start, add, cat, monster } = sceneHarness();
  const initial = sampleServerStateV2({ kills: 0, round: 1 });
  scene.show(initial, false); start();
  const director = scene['director'];
  const destroy = vi.spyOn(director!, 'destroy');
  scene.show({ ...initial, serverTime: 1001 }, false);
  scene.show({ ...initial, inventory: initial.inventory.map(i => ({ ...i, locked: !i.locked })) }, false);
  scene.show({ ...initial, progress: { ...initial.progress, kills: 2 } }, false);
  expect(add).toHaveBeenCalledTimes(2);
  expect(scene['director']).toBe(director);
  expect(destroy).not.toHaveBeenCalled();
  expect(cat.destroy).not.toHaveBeenCalled();
  expect(monster.destroy).not.toHaveBeenCalled();
  // Each rebuild creates a fresh pair. Only the visual identity changes here.
  add.mockReturnValueOnce(cat).mockReturnValueOnce(monster);
  vi.mocked(equippedVisuals).mockReturnValueOnce({ weapon: { set: 'tin', rarity: 'uncommon' } });
  scene.show({ ...initial, equipped: { ...initial.equipped, weapon: initial.inventory[1]!.id } }, false);
  expect(add).toHaveBeenCalledTimes(4);
  expect(destroy).toHaveBeenCalledOnce();
  expect(cat.destroy).toHaveBeenCalledOnce();
});

it('relayouts existing actors on resize and applies reduced motion without a rebuild', () => {
  const { scene, start, add, cat, monster } = sceneHarness();
  const state = sampleServerStateV2();
  scene.show(state, false); start();
  Object.assign(scene.scale, { width: 500 });
  scene.relayout();
  expect(cat.setPosition).toHaveBeenCalledWith(150, expect.any(Number));
  expect(monster.setPosition).toHaveBeenCalledWith(expect.any(Number), expect.any(Number));
  expect(monster.x).toBeGreaterThan(500); // New arrival starts beyond the resized right edge.
  scene.show(state, true);
  expect(cat.stop).toHaveBeenCalled();
  expect(monster.stop).toHaveBeenCalled();
  expect(add).toHaveBeenCalledTimes(2);
});

it('never attacks or invents a defeat at a gate, and keeps the number pool capped', () => {
  const { scene, start, cat, text } = sceneHarness();
  scene.show(sampleServerStateV2({ gated: true, level: 1, round: 10, kills: 0 }), false); start();
  for (let i = 0; i < 1000; i++) scene.update(i * 16, 16);
  expect(cat.play).not.toHaveBeenCalledWith('cat-attack', true);
  expect(scene['hp']!.value).toBe(scene['hp']!.max);
  expect(scene['defeatedAt']).toBe(-1);
  expect(text).toHaveBeenCalledTimes(12);
  expect(scene['hits']!.size).toBe(12);
});

it('discards a pending montage after a long hidden period, without consuming each kill', () => {
  const { scene, start } = sceneHarness();
  const before = sampleServerStateV2({ round: 1, kills: 0, level: 60 });
  scene.show(before, false); start();
  scene.show({ ...before, progress: { ...before.progress, kills: 3 } }, false);
  expect(scene['plans']).toHaveLength(3);
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  const now = vi.spyOn(Date, 'now').mockReturnValue(1000);
  document.dispatchEvent(new Event('visibilitychange'));
  now.mockReturnValue(32000); hidden.mockReturnValue(false);
  document.dispatchEvent(new Event('visibilitychange'));
  expect(scene['plans']).toHaveLength(0);
  expect(scene['plan'].credited).toBe(false);
  scene['events'].emit('shutdown'); hidden.mockRestore(); now.mockRestore();
});


it('releases its visibility closure and effects on full destruction without a shutdown event', () => {
  const remove = vi.spyOn(document, 'removeEventListener');
  const { scene, start, events } = sceneHarness();
  scene.show(sampleServerStateV2(), false); start();
  const director = vi.spyOn(scene['director']!, 'destroy');
  events.emit('destroy');
  expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  expect(director).toHaveBeenCalledOnce();
  events.emit('shutdown');
  expect(director).toHaveBeenCalledOnce();
  remove.mockRestore();
});
