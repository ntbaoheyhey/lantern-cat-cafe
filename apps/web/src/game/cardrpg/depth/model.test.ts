import { afterEach, expect, it, vi } from 'vitest';
import { DepthModel } from './model';
import { SAVE_KEY } from '@taskbar-hero/game-rules/src/cardrpg/depth/save';
import { firstInvitation } from '@taskbar-hero/game-rules/src/cardrpg/depth/onboarding';
import { exportSave } from '@taskbar-hero/game-rules/src/cardrpg/depth/save';
afterEach(() => { vi.unstubAllGlobals(); });
it('keeps the offline entry free of storage access and writes', () => {
  const getItem = vi.fn(() => { throw Error('forbidden'); });
  const setItem = vi.fn(() => { throw Error('forbidden'); });
  vi.stubGlobal('localStorage', { getItem, setItem });
  const model = new DepthModel(true);
  model.notify(); model.invite(true); model.shortcut('stamps');
  expect(getItem).not.toHaveBeenCalled(); expect(setItem).not.toHaveBeenCalled();
  expect(model.state.account.cards).toHaveLength(4);
  expect(firstInvitation(model.state, 4).ok).toBe(false);
});
it('restores app progress and reports storage failures with manual recovery', () => {
  const data = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key), setItem: (key: string, value: string) => data.set(key, value) });
  const model = new DepthModel(false);
  model.invite(true);
  expect(data.has(SAVE_KEY)).toBe(true);
  const restored = new DepthModel(false);
  expect(restored.state.account.history).toEqual(model.state.account.history);
  data.set(SAVE_KEY, 'damaged');
  const damaged = new DepthModel(false);
  expect(damaged.notice).toContain('needs attention');
  damaged.notify();
  expect(data.get(SAVE_KEY)).toBe('damaged');
});
it('mounts the battle scene when resuming a local or imported active encounter', () => {
  const source = new DepthModel(true);
  source.start(1);
  source.enter('0-0');
  const code = exportSave(source.state);
  vi.stubGlobal('localStorage', { getItem: () => code, setItem: vi.fn() });
  const restored = new DepthModel(false);
  expect(restored.battle).toBeTruthy();
  expect(restored.sceneStarted).toBe(true);
  const imported = new DepthModel(true);
  imported.import(code);
  expect(imported.battle).toEqual(source.battle);
  expect(imported.sceneStarted).toBe(true);
});
it('starts a new lesson and resets without inheriting a paused battle', () => {
  const model = new DepthModel(true);
  model.paused = true;
  model.tutorial();
  expect(model.paused).toBe(false);
  model.paused = true;
  model.auto = true;
  model.selectedSkill = 'mochi-1';
  model.reset();
  expect(model.paused).toBe(false);
  expect(model.auto).toBe(false);
  expect(model.selectedSkill).toBe('');
  expect(model.sceneStarted).toBe(false);
  expect(model.battle).toBeNull();
});

it('previews every authored skill and enemy without mutating account progress', () => {
  const model = new DepthModel(true);
  const original = exportSave(model.state);
  expect(model.galleryActions).toHaveLength(61);
  for (const action of model.galleryActions) {
    model.inspect(action.id, .5);
    expect(model.battle?.actors.some(actor => actor.catalogId === action.owner)).toBe(true);
    expect(model.plan?.actorId).toBeTruthy();
    expect(model.frame?.actionProgress).toBeCloseTo(.5);
    expect(model.canAct).toBe(false);
  }
  model.closeGallery();
  expect(model.battle).toBeNull();
  expect(exportSave(model.state)).toBe(original);
});
