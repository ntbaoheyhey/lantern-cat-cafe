import {describe, expect, it, vi} from 'vitest';
import type {SceneView} from '../../squad/turn3d/scene';
import {canNarrowBattleAtlases, prepareBattleAtlases} from './effect-preload-selection';

const confirmed = {formationC2: true, battleKey: {formationC2: true, gameplayA6: true}} as SceneView;
const owners = ['mochi', 'clover', 'panko', 'soot', 'needle-moth', 'teacup-healer',
  'kettle-knight', 'yarn-giant', 'binding-thread', 'button-guard', 'sock-skipper',
  'spool-ram', 'crumb-sentinel', 'pollen-scout', 'future-enemy'];

describe('battle atlas readiness', () => {
  it('retains every party atlas, field consumer and unknown owner', async () => {
    const prepare = vi.fn().mockResolvedValue(undefined);
    await prepareBattleAtlases({ready: Promise.resolve(), overrides: {effects: new Map()}, prepare}, owners, true, canNarrowBattleAtlases(confirmed));
    expect(prepare).toHaveBeenCalledWith(['mochi', 'clover', 'panko', 'soot', 'button-guard',
      'sock-skipper', 'spool-ram', 'crumb-sentinel', 'pollen-scout', 'future-enemy'], true);
  });

  it.each([
    {}, {formationC2: true}, {...confirmed, battleKey: 'gallery'},
    {...confirmed, battleKey: {formationC2: true}},
    {...confirmed, battleKey: {formationC2: true, gameplayA6: false}},
    {...confirmed, battleKey: {gameplayA6: true}},
    {...confirmed, formationC2: false}, {...confirmed, galleryPreview: true},
    {...confirmed, model: {role: 'tank', clip: 'idle', angle: 0}},
    {...confirmed, frame: {plan: {events: [{type: 'charge'}]}}},
  ])('keeps complete fallback readiness outside a verified A6 battle: %j', async view => {
    expect(canNarrowBattleAtlases(view as SceneView)).toBe(false);
    const prepare = vi.fn().mockResolvedValue(undefined);
    await prepareBattleAtlases({ready: Promise.resolve(), overrides: {effects: new Map()}, prepare}, owners, true, canNarrowBattleAtlases(view as SceneView));
    expect(prepare).toHaveBeenCalledWith(owners, true);
  });

  it('waits for late override decoding and keeps all field fallback atlases', async () => {
    let resolve!: () => void;
    const ready = new Promise<void>(done => {resolve = done;});
    const effects = new Map<string, unknown>(), prepare = vi.fn().mockResolvedValue(undefined);
    const pending = prepareBattleAtlases({ready, overrides: {effects}, prepare}, owners, true, true);
    await Promise.resolve();
    expect(prepare).not.toHaveBeenCalled();
    effects.set('enemy:needle-moth', {});
    resolve();
    await pending;
    expect(prepare).toHaveBeenCalledWith(owners, true);
  });

  it('propagates decode and preload failures to the existing scene readiness gate', async () => {
    const failed = new Error('effect decoding failed');
    const prepare = vi.fn().mockResolvedValue(undefined);
    await expect(prepareBattleAtlases({ready: Promise.reject(failed), overrides: {effects: new Map()}, prepare}, owners, true, true)).rejects.toBe(failed);
    expect(prepare).not.toHaveBeenCalled();
    prepare.mockRejectedValue(failed);
    await expect(prepareBattleAtlases({ready: Promise.resolve(), overrides: {effects: new Map()}, prepare}, owners, true, true)).rejects.toBe(failed);
  });
});
