// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ServerState } from '../api/GameApi';
import { MockGameApi } from '../api/MockGameApi';
import { createSessionStore, type SessionStore } from '../wallet/session';
import { ApiSwitch, EXPIRED_NOTICE, type GameEnv } from './apiSwitch';

const ENV: GameEnv = { supabaseUrl: 'https://proj.supabase.co', anonKey: 'anon-1' };
let sw: ApiSwitch | null = null;

beforeEach(() => sessionStorage.clear());

afterEach(() => {
  sw?.loop.stop();
  sw = null;
});

function signIn(sessions: SessionStore, token = 'jwt-1') {
  sessions.set({ token, playerId: 'p1', wallet: '0x' + '1'.repeat(40), expiresAt: Date.now() + 3_600_000 });
}

/** fetch that answers like the Edge Functions: a server state with a marker gold value, or 401. */
function fakeServer(state: ServerState, status = 200) {
  return vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) =>
    new Response(JSON.stringify(status === 200 ? state : { error: 'unauthenticated' }), { status }),
  );
}

async function setup(opts: { env?: GameEnv; signedIn?: boolean; status?: number } = {}) {
  const sessions = createSessionStore();
  if (opts.signedIn) signIn(sessions);
  const demo = new MockGameApi();
  const serverState = { ...(await demo.getState()), gold: 4242 };
  const fetch = fakeServer(serverState, opts.status);
  sw = new ApiSwitch({ sessions, env: opts.env ?? ENV, demo: () => demo, fetch });
  return { sessions, demo, fetch, sw };
}

const serverGold = () => sw!.loop.getSnapshot().server?.gold;

it('uses the Supabase API when signed in with the env set', async () => {
  const { fetch, sw } = await setup({ signedIn: true });
  expect(sw.getMode()).toEqual({ demo: false, notice: null });
  await sw.loop.start(document);
  expect(serverGold()).toBe(4242);
  expect(fetch.mock.calls[0]![0]).toBe('https://proj.supabase.co/functions/v1/game-state');
  expect((fetch.mock.calls[0]![1]!.headers as Record<string, string>).authorization).toBe('Bearer jwt-1');
});

it('uses the demo mock when signed out', async () => {
  const { demo, fetch, sw } = await setup();
  expect(sw.api).toBe(demo);
  expect(sw.getMode().demo).toBe(true);
  await sw.loop.start(document);
  expect(serverGold()).toBe(0);
  expect(fetch).not.toHaveBeenCalled();
});

it('stays on the mock when the Supabase env is missing, even when signed in', async () => {
  const { demo, sw } = await setup({ signedIn: true, env: { supabaseUrl: 'https://proj.supabase.co' } });
  expect(sw.api).toBe(demo);
  expect(sw.getMode().demo).toBe(true);
});

it('sign-in and sign-out swap the API and restart the loop', async () => {
  const { sessions, demo, sw } = await setup();
  await sw.loop.start(document);
  expect(serverGold()).toBe(0);

  signIn(sessions);
  expect(sw.api).not.toBe(demo);
  await vi.waitFor(() => expect(serverGold()).toBe(4242));

  sessions.clear();
  expect(sw.api).toBe(demo);
  expect(sw.getMode()).toEqual({ demo: true, notice: null });
  await vi.waitFor(() => expect(serverGold()).toBe(0));
});

it('an unauthenticated answer clears the session and falls back to demo mode with a message', async () => {
  const { sessions, demo, sw } = await setup({ signedIn: true, status: 401 });
  await sw.loop.start(document);
  expect(sessions.get()).toBeNull();
  expect(sw.api).toBe(demo);
  expect(sw.getMode()).toEqual({ demo: true, notice: EXPIRED_NOTICE });
  await vi.waitFor(() => expect(serverGold()).toBe(0)); // demo state, not an error loop

  signIn(sessions, 'jwt-2'); // signing in again clears the message
  expect(sw.getMode()).toEqual({ demo: false, notice: null });
});
