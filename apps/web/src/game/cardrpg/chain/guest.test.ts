import { afterEach, expect, it, vi } from 'vitest';
import { recoverMessageAddress } from 'viem';
import { parseSiweMessage } from 'viem/siwe';
import { createSessionStore } from '../../../wallet/session';
import { chainFlags } from './flags';
import { GUEST_KEY, guestAccount, guestClient, guestSignIn, requireFuji } from './guest';

afterEach(() => { localStorage.clear(); sessionStorage.clear(); vi.unstubAllGlobals(); });
it('keeps the same address across sessions and sends only real SIWE proof', async () => {
  const network = vi.fn(); vi.stubGlobal('fetch', network);
  const account = guestAccount();
  const api = { getNonce: async () => '12345678nonce', verify: vi.fn(async (input: {message: string; signature: string}) => {
    expect(Object.keys(input).sort()).toEqual(['message', 'signature']);
    expect(JSON.stringify(input)).not.toContain(localStorage.getItem(GUEST_KEY));
    expect(await recoverMessageAddress({ message: input.message, signature: input.signature as `0x${string}` })).toBe(account.address);
    expect(parseSiweMessage(input.message).chainId).toBe(43113);
    return { token: 'test-session', playerId: 'same-player', wallet: account.address };
  }) };
  for (let i = 0; i < 2; i++) {
    const store = createSessionStore(); store.clear();
    expect(await guestSignIn(api, store)).toBe(account.address);
    expect(store.get()?.playerId).toBe('same-player');
  }
  expect(network).not.toHaveBeenCalled();
  expect(guestAccount().address).toBe(account.address);
});
it.each([0, 1, 43114, 31337, NaN, Infinity])('rejects non-Fuji chain %s before creating a key or contacting auth', async chain => {
  const api = {getNonce: vi.fn(), verify: vi.fn()};
  expect(() => requireFuji(chain)).toThrow('Fuji');
  await expect(guestSignIn(api, createSessionStore(), localStorage, chain)).rejects.toThrow('Fuji');
  expect(api.getNonce).not.toHaveBeenCalled(); expect(localStorage.length).toBe(0);
});
it('fails closed on unavailable/corrupt storage without replacing a key', () => {
  expect(() => guestAccount({ getItem: () => null, setItem: () => { throw new Error(); } })).toThrow('storage');
  localStorage.setItem(GUEST_KEY, 'broken');
  expect(() => guestAccount()).toThrow('recovery'); expect(localStorage.getItem(GUEST_KEY)).toBe('broken');
});
it('defaults every chain feature off and enables the demo build', () => {
  expect(Object.values(chainFlags({}))).toEqual([false, false, false, false]);
  expect(Object.values(chainFlags({ VITE_CHAIN_DEMO: '1' }))).toEqual([true, true, true, true]);
});
it('does not create a replacement transaction signer after browser storage is cleared', () => {
  expect(() => guestClient('http://127.0.0.1:5981')).toThrow('recovery');
  expect(localStorage.getItem(GUEST_KEY)).toBeNull();
  const account = guestAccount();
  expect(guestClient('http://127.0.0.1:5981').account.address).toBe(account.address);
  localStorage.clear();
  expect(() => guestClient('http://127.0.0.1:5981')).toThrow('recovery');
  expect(localStorage.getItem(GUEST_KEY)).toBeNull();
});
