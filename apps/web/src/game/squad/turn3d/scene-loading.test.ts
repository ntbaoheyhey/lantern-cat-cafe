import { afterEach, expect, it, vi } from 'vitest';
import type { TurnActor } from '@taskbar-hero/game-rules/src/squad/turn/types';
import { TurnScene, type SceneView } from './scene';
import { loadModel } from './assets';

vi.mock('./assets', () => ({ loadModel: vi.fn() }));
afterEach(() => vi.clearAllMocks());

it.each([['clover', { old: 'clover' }], ['alchemist', undefined]] as const)(
  'keeps the original actor model %s when the preview navigates during loading',
  async (expected, models) => {
    const actor = { id: 'old', role: 'alchemist' } as TurnActor;
    const original = { actors: [actor], models, boss: false } as SceneView;
    const scene = Object.create(TurnScene.prototype) as TurnScene;
    // No WebGL context is needed: cancel after the real loading request.
    Object.assign(scene, {
      puppets: new Map(), pending: new Set(), disposed: false,
      view: () => ({ actors: [{ id: 'new', role: 'guardian' }], models: { new: 'mochi' } }),
    });
    vi.mocked(loadModel).mockImplementationOnce(async () => {
      Object.assign(scene, { disposed: true });
      return {} as Awaited<ReturnType<typeof loadModel>>;
    });
    await scene['ensure'](actor, false, original);
    expect(loadModel).toHaveBeenCalledExactlyOnceWith(expected);
    expect(scene['pending'].size).toBe(0);
    expect(scene['puppets'].size).toBe(0);
  },
);
