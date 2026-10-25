import { afterEach, expect, it, vi } from 'vitest';
import { createStageStoreV2 } from '../v2/storeV2';
import { createSessionStore } from '../../wallet/session';
import { MockGameApiV2 } from '../../api/MockGameApiV2';
import { GameApiErrorV2 } from '../../api/GameApiErrorV2';
import { claimedKills } from './progress';
import { sampleServerStateV2 } from '../../layout/a11y/fixtures';
afterEach(() => vi.restoreAllMocks());
it('uses the persistent demo without env even with a session', async () => {
  const sessions = createSessionStore(undefined), demo = vi.fn(() => new MockGameApiV2({ storage: null })), server = vi.fn();
  sessions.set({ token: 'test', playerId: 'p', wallet: 'w', expiresAt: Date.now() + 60000 });
  const store = createStageStoreV2({ sessions, env: {}, demo, server });
  expect(store.getMode().demo).toBe(true);
  expect((await store.api.getState()).cat.classId).toBeNull();
  expect(demo).toHaveBeenCalledOnce(); expect(server).not.toHaveBeenCalled();
});
it('injects the session into server mode and applies the existing session guard', async () => {
  const sessions = createSessionStore(undefined);
  sessions.set({ token: 'test', playerId: 'p', wallet: 'w', expiresAt: Date.now() + 60000 });
  const api = new MockGameApiV2({ storage: null });
  vi.spyOn(api, 'getState').mockRejectedValue(new GameApiErrorV2('unauthenticated'));
  const server = vi.fn(() => api), store = createStageStoreV2({ sessions, env: { supabaseUrl: 'https://test', anonKey: 'anon' }, server });
  expect(store.getMode().demo).toBe(false);
  expect(server.mock.calls[0]![0].getToken()).toBe('test');
  await expect(store.api.getState()).rejects.toMatchObject({ code: 'unauthenticated' });
  expect(sessions.get()).toBeNull(); expect(store.getMode().demo).toBe(true);
});
it('counts only authoritative claim progress, including round boundaries', () => {
  const before = sampleServerStateV2({ round: 2, kills: 4 });
  expect(claimedKills(before, sampleServerStateV2({ round: 3, kills: 2 }))).toBe(4);
  expect(claimedKills(before, sampleServerStateV2({ chapter: 2, round: 1, kills: 0 }))).toBe(0);
  expect(claimedKills(null, before)).toBe(0);
});
