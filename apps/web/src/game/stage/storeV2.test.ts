import { afterEach, expect, it, vi } from 'vitest';
import {
  createStageStoreV2,
  getActionNoticeState,
  setActionNoticeState,
} from '../v2/storeV2';
import { createSessionStore } from '../../wallet/session';
import { MockGameApiV2 } from '../../api/MockGameApiV2';
import { GameApiErrorV2 } from '../../api/GameApiErrorV2';
import { claimedKills } from './progress';
import { sampleServerStateV2 } from '../../layout/a11y/fixtures';
import { SERVER_BUSY_NOTICE, OFFLINE_NOTICE, rateLimitedNotice } from '../../v2text/errorNotices';

afterEach(() => {
  setActionNoticeState(null);
  vi.restoreAllMocks();
});
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
  const server = vi.fn((_options: { getToken: () => string | null | undefined }) => api), store = createStageStoreV2({ sessions, env: { supabaseUrl: 'https://test', anonKey: 'anon' }, server });
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

it('T6: 503 sets server_busy notice and leaves store state unchanged', async () => {
  const sessions = createSessionStore(undefined);
  const api = new MockGameApiV2({ storage: null });
  const store = createStageStoreV2({ sessions, env: {}, demo: () => api });
  const initialDoc = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    visibilityState: 'visible',
  } as unknown as Document;
  await store.loop.start(initialDoc);

  const beforeSnap = store.loop.getSnapshot().state;

  vi.spyOn(api, 'craft').mockRejectedValueOnce(new GameApiErrorV2('server_busy'));

  await store.loop.craft('rcp.common', 'weapon');

  expect(getActionNoticeState()).toMatchObject({ code: 'server_busy' });
  const afterSnap = store.loop.getSnapshot().state;
  expect(afterSnap).toEqual(beforeSnap);
});

it('T1-T4: 429 sets rate_limited notice with clamped retryAfterS and countdown until', async () => {
  const sessions = createSessionStore(undefined);
  const api = new MockGameApiV2({ storage: null });
  const store = createStageStoreV2({ sessions, env: {}, demo: () => api });
  const initialDoc = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    visibilityState: 'visible',
  } as unknown as Document;
  await store.loop.start(initialDoc);

  vi.spyOn(api, 'craft').mockRejectedValueOnce(
    new GameApiErrorV2('rate_limited', { retryAfterS: 7 })
  );

  await store.loop.craft('rcp.common', 'weapon');

  const notice = getActionNoticeState();
  expect(notice).toMatchObject({ code: 'rate_limited', retryAfterS: 7 });
  expect(notice?.until).toBeGreaterThan(Date.now());
});

it('T7: offline sets offline notice and online event clears it', async () => {
  const sessions = createSessionStore(undefined);
  const api = new MockGameApiV2({ storage: null });
  const store = createStageStoreV2({ sessions, env: {}, demo: () => api });

  vi.spyOn(api, 'craft').mockRejectedValueOnce(new GameApiErrorV2('offline'));
  await store.loop.craft('rcp.common', 'weapon');

  expect(getActionNoticeState()).toMatchObject({ code: 'offline' });

  window.dispatchEvent(new Event('online'));
  expect(getActionNoticeState()).toBeNull();
});
