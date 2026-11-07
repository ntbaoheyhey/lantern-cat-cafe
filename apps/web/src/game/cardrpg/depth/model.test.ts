import { afterEach, expect, it, vi } from 'vitest';
import { DepthModel } from './model';
import { SAVE_KEY } from '@taskbar-hero/game-rules/src/cardrpg/depth/save';
import { firstInvitation } from '@taskbar-hero/game-rules/src/cardrpg/depth/onboarding';
import { exportSave } from '@taskbar-hero/game-rules/src/cardrpg/depth/save';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { CARD_EFFECT_RECIPES } from '../../squad/turn3d/card-effect-data';
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
  source.fight();
  source.sceneReady = true;
  source.step();
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
  model.fight();
  model.reset();
  expect(model.paused).toBe(false);
  expect(model.watching).toBe(false);
  expect(model.sceneStarted).toBe(false);
  expect(model.battle).toBeNull();
});

it('waits at Prepare, then completes a fully automatic watched fight', () => {
  const model = new DepthModel(true);
  model.start(1); model.enter('0-0');
  expect(model.screen).toBe('prepare');
  expect(model.showBattle).toBe(false);
  expect(model.canAct).toBe(false);
  const expected = R.playBattle(R.createBattle(model.battle!.initial), 'auto');
  model.fight(); model.sceneReady = true;
  for (let index = 0; index < 900 && model.showBattle; index++) { model.step(); model.tick(100000); }
  expect(model.screen).toBe('result');
  expect(model.battle).toEqual(expected);
  expect(model.showBattle).toBe(false);
});

it.each(['campaign', 'daily', 'tower'] as const)('skips %s from a paused, partly watched fight and replays the same result', mode => {
  const model = new DepthModel(true);
  model.state.cleared = [1, 2, 3];
  model.start(1, mode); model.enter('0-0'); model.fight(); model.sceneReady = true;
  const expected = R.playBattle(R.createBattle(model.battle!.initial), 'auto');
  model.step(); model.paused = true;
  const paused = JSON.stringify(model.battle);
  model.tick(100000); model.step();
  expect(JSON.stringify(model.battle)).toBe(paused);
  model.skip();
  expect(model.battle).toEqual(expected);
  const account = exportSave(model.state);
  model.replayLast();
  for (let index = 0; index < 900 && model.showBattle; index++) { model.replayStep(); model.tick(100000); }
  expect(model.replay).toEqual(expected);
  expect(exportSave(model.state)).toBe(account);
  model.finish();
  expect(model.screen).toBe('result');
  model.replayLast(); model.skip();
  expect(model.replay).toEqual(expected);
});

it('keeps lesson, immediate battle, reward settlement and improvement usable', () => {
  const model = new DepthModel(true);
  model.tutorial();
  expect(model.screen).toBe('prepare');
  model.fight(); model.skip();
  expect(model.screen).toBe('result');
  model.finish();
  expect(model.state.tutorial).toBe(3);
  expect(model.screen).toBe('gacha');
  model.watchNow();
  expect(model.showBattle).toBe(true);
  model.skip(); model.improveTeam();
  expect(model.screen).toBe('team');
  expect(model.state.run!.complete).toBe(true);
  expect(model.battle).toBeNull();
  const saved = exportSave(model.state);
  model.finish();
  expect(exportSave(model.state)).toBe(saved);
});

it('restores an unstarted encounter to Prepare and a completed encounter to Result', () => {
  const source = new DepthModel(true);
  source.start(1); source.enter('0-0');
  const restored = new DepthModel(true);
  restored.import(exportSave(source.state));
  expect(restored.screen).toBe('prepare');
  expect(restored.sceneStarted).toBe(false);
  source.skip();
  restored.import(exportSave(source.state));
  expect(restored.screen).toBe('result');
  expect(restored.showBattle).toBe(false);
});

it('previews every authored skill and enemy without mutating account progress', () => {
  const model = new DepthModel(true);
  const original = exportSave(model.state);
  const passives = R.CATS.filter(cat => CARD_EFFECT_RECIPES[cat.passive.id]);
  const basics = R.ENEMIES.filter(enemy => CARD_EFFECT_RECIPES[`enemy:${enemy.id}:basic`]);
  const skills = R.CATS.flatMap(cat => cat.skills);
  expect(model.galleryActions).toHaveLength(skills.length + passives.length + basics.length + R.ENEMIES.length);
  expect(model.galleryActions.filter(action => action.id.endsWith('-passive')).map(action => action.id))
    .toEqual(passives.map(cat => cat.passive.id));
  expect(model.galleryActions.filter(action => action.id.endsWith(':basic'))).toHaveLength(basics.length);
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
