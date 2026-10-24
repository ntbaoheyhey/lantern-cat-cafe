import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { GameApiV2, ServerStateV2 } from '../../api/GameApiV2';
import { createSessionStore, type SessionStore } from '../../wallet/session';
import { EXPIRED_NOTICE } from '../apiSwitch';
import { ApiSwitchV2, type ApiSwitchV2Options } from './apiSwitchV2';

function state(): ServerStateV2 {
  return {
    cat: { classId: 'warrior', level: 3, xp: 0, xpToNext: 100 },
    progress: { chapter: 1, round: 2, kills: 0, killsPerRound: 10, gated: false, neededPower: 0 },
    currencies: { fish: 0, yarn: 0, keys: 1 }, materials: {}, inventory: [], bagLimit: 100,
    equipped: { weapon: null, helmet: null, armor: null, gloves: null, boots: null, collar: null, earring: null, ring: null, charm: null },
    unlockedSlots: ['weapon'], bosses: { chapters: [], cooldownUntil: null },
    forge: { blockedBy: null, forgedToday: false, pending: null, today: null }, founder: false, serverTime: 0,
  };
}

class FakeDocument {
  visibilityState = 'visible';
  private listeners = new Set<() => void>();
  addEventListener(_name: string, fn: () => void) { this.listeners.add(fn); }
  removeEventListener(_name: string, fn: () => void) { this.listeners.delete(fn); }
  setVisibility(value: string) {
    this.visibilityState = value;
    this.listeners.forEach((fn) => fn());
  }
  asDocument(): Document { return this as unknown as Document; }
}

class FakeApiV2 implements GameApiV2 {
  getState = vi.fn<GameApiV2['getState']>().mockResolvedValue(state());
  claim = vi.fn<GameApiV2['claim']>();
  chooseClass = vi.fn<GameApiV2['chooseClass']>();
  equip = vi.fn<GameApiV2['equip']>();
  fightBoss = vi.fn<GameApiV2['fightBoss']>();
  craft = vi.fn<GameApiV2['craft']>();
  salvage = vi.fn<GameApiV2['salvage']>();
  setLocked = vi.fn<GameApiV2['setLocked']>();
  forgeRelic = vi.fn<GameApiV2['forgeRelic']>();
}

const env = { supabaseUrl: 'https://example.invalid', anonKey: 'public-anon' };
const switches: ApiSwitchV2[] = [];
beforeEach(() => { sessionStorage.clear(); vi.useFakeTimers(); });
afterEach(() => { switches.forEach((sw) => sw.loop.stop()); switches.length = 0; vi.useRealTimers(); });
function signIn(sessions: SessionStore, token = 'jwt-1') {
  sessions.set({ token, playerId: 'p1', wallet: '0x1', expiresAt: Date.now() + 3_600_000 });
}
function setup(options: { signedIn?: boolean; env?: ApiSwitchV2Options['env']; guard?: ApiSwitchV2Options['guard'] } = {}) {
  const sessions = createSessionStore(undefined);
  if (options.signedIn) signIn(sessions);
  const demoApi = new FakeApiV2();
  const serverApi = new FakeApiV2();
  serverApi.getState.mockResolvedValue({ ...state(), serverTime: 4242 });
  const demo = vi.fn(() => demoApi);
  const server = vi.fn<ApiSwitchV2Options['server']>(() => serverApi);
  const sw = new ApiSwitchV2({ sessions, env: options.env ?? env, demo, server, guard: options.guard });
  switches.push(sw);
  return { sessions, demoApi, serverApi, demo, server, sw };
}

it('uses the demo without a token', async () => {
  const { sw, demoApi, server } = setup();
  expect(sw.api).toBe(demoApi);
  expect(sw.getMode()).toEqual({ demo: true, notice: null });
  await sw.loop.start(new FakeDocument().asDocument());
  expect(sw.loop.getSnapshot().state).toEqual(state());
  expect(server).not.toHaveBeenCalled();
});

it.each([{}, { supabaseUrl: env.supabaseUrl }, { anonKey: env.anonKey }])('uses demo without both env values: %j', (missing) => {
  const { sw, demoApi, server } = setup({ signedIn: true, env: missing });
  expect(sw.api).toBe(demoApi);
  expect(server).not.toHaveBeenCalled();
});

it('injects server options with a live session token getter', async () => {
  const { sw, sessions, serverApi, server, demo } = setup({ signedIn: true });
  expect(sw.api).toBe(serverApi);
  expect(sw.getMode()).toEqual({ demo: false, notice: null });
  expect(demo).not.toHaveBeenCalled();
  const options = server.mock.calls[0]![0];
  expect(options).toMatchObject({ baseUrl: env.supabaseUrl, anonKey: env.anonKey });
  expect(options.getToken()).toBe('jwt-1');
  await sw.loop.start(new FakeDocument().asDocument());
  expect(sw.loop.getSnapshot().state?.serverTime).toBe(4242);
  signIn(sessions, 'jwt-2');
  expect(options.getToken()).toBe('jwt-2');
});

it('swaps on token change, restarts the loop, and builds demo only once', async () => {
  const { sw, sessions, demoApi, serverApi, demo, server } = setup();
  const changes = vi.fn();
  const unsubscribe = sw.subscribe(changes);
  await sw.loop.start(new FakeDocument().asDocument());
  const initialMode = sw.getMode();
  signIn(sessions);
  expect(sw.api).toBe(serverApi);
  expect(sw.loop.getSnapshot().state).toBeNull();
  await vi.advanceTimersByTimeAsync(0);
  expect(serverApi.getState).toHaveBeenCalledTimes(1);
  signIn(sessions); // unchanged token does not rebuild or restart
  expect(server).toHaveBeenCalledTimes(1);
  signIn(sessions, 'jwt-2');
  expect(server).toHaveBeenCalledTimes(2);
  await vi.advanceTimersByTimeAsync(0);
  expect(serverApi.getState).toHaveBeenCalledTimes(2);
  sessions.clear();
  expect(sw.api).toBe(demoApi);
  await vi.advanceTimersByTimeAsync(0);
  expect(demoApi.getState).toHaveBeenCalledTimes(2);
  expect(sw.getMode()).toEqual(initialMode);
  signIn(sessions, 'jwt-3');
  sessions.clear();
  expect(demo).toHaveBeenCalledTimes(1);
  expect(changes).toHaveBeenCalledTimes(4);
  unsubscribe();
});

it('guarded unauthenticated response expires the session and loads demo with the notice', async () => {
  let fail = true;
  const guard = vi.fn<NonNullable<ApiSwitchV2Options['guard']>>((api, expire) => ({
    ...api,
    getState: async () => {
      if (fail) { expire(); throw { code: 'unauthenticated' }; }
      return api.getState();
    },
  }));
  const { sw, sessions, demoApi } = setup({ signedIn: true, guard });
  await sw.loop.start(new FakeDocument().asDocument());
  await vi.advanceTimersByTimeAsync(0);
  expect(sessions.get()).toBeNull();
  expect(sw.api).toBe(demoApi);
  expect(sw.getMode()).toEqual({ demo: true, notice: EXPIRED_NOTICE });
  expect(sw.loop.getSnapshot().state).toEqual(state());
  fail = false;
  signIn(sessions, 'jwt-2');
  expect(sw.getMode()).toEqual({ demo: false, notice: null });
  expect(guard).toHaveBeenCalledTimes(2);
});
