import { describe, expect, it, vi } from 'vitest';
import { GameApiErrorV2 } from './GameApiErrorV2';
import { ERROR_CODES_V2, type GameApiV2 } from './GameApiV2';
import { withSessionGuardV2 } from './sessionGuardV2';

const calls: [keyof GameApiV2, (api: GameApiV2) => Promise<unknown>, unknown[]][] = [
  ['getState', api => api.getState(), []],
  ['claim', api => api.claim(), []],
  ['equip', api => api.equip(null, 'ring'), [null, 'ring']],
  ['chooseClass', api => api.chooseClass('warrior'), ['warrior']],
  ['fightBoss', api => api.fightBoss(3), [3]],
  ['craft', api => api.craft('rcp.common', 'ring'), ['rcp.common', 'ring']],
  ['salvage', api => api.salvage(['item-1']), [['item-1']]],
  ['setLocked', api => api.setLocked('item-1', false), ['item-1', false]],
  ['forgeRelic', api => api.forgeRelic(), []],
];

function setup(perform: () => Promise<never>) {
  const api = {
    getState: vi.fn(perform), claim: vi.fn(perform), equip: vi.fn(perform),
    chooseClass: vi.fn(perform), fightBoss: vi.fn(perform), craft: vi.fn(perform),
    salvage: vi.fn(perform), setLocked: vi.fn(perform), forgeRelic: vi.fn(perform),
  } satisfies GameApiV2;
  const onUnauthenticated = vi.fn();
  return { api, onUnauthenticated, guarded: withSessionGuardV2(api, onUnauthenticated) };
}

describe('withSessionGuardV2', () => {
  it.each(calls)('%s notifies once per unauthenticated call and rethrows the same error', async (name, call, args) => {
    const error = new GameApiErrorV2('unauthenticated');
    const { api, guarded, onUnauthenticated } = setup(() => Promise.reject(error));
    await expect(call(guarded)).rejects.toBe(error);
    expect(onUnauthenticated).toHaveBeenCalledTimes(1);
    expect(api[name]).toHaveBeenCalledExactlyOnceWith(...args);
    await expect(call(guarded)).rejects.toBe(error);
    expect(onUnauthenticated).toHaveBeenCalledTimes(2);
  });

  it.each(calls)('%s passes arguments and the resolved value through unchanged', async (name, call, args) => {
    // The guard treats results as opaque; the sentinel checks identity for every return type.
    const result = { sentinel: name };
    const { api, guarded, onUnauthenticated } = setup(() => Promise.resolve(result as never));
    await expect(call(guarded)).resolves.toBe(result);
    expect(api[name]).toHaveBeenCalledExactlyOnceWith(...args);
    expect(onUnauthenticated).not.toHaveBeenCalled();
  });

  it.each(ERROR_CODES_V2.filter(code => code !== 'unauthenticated'))('does not notify for %s on any method', async code => {
    const error = new GameApiErrorV2(code);
    const { guarded, onUnauthenticated } = setup(() => Promise.reject(error));
    for (const [, call] of calls) await expect(call(guarded)).rejects.toBe(error);
    expect(onUnauthenticated).not.toHaveBeenCalled();
  });

  it('rethrows unrelated errors without notifying', async () => {
    for (const error of [new Error('offline'), { code: 'unauthenticated' }]) {
      const { guarded, onUnauthenticated } = setup(() => Promise.reject(error));
      await expect(guarded.getState()).rejects.toBe(error);
      expect(onUnauthenticated).not.toHaveBeenCalled();
    }
  });
});
