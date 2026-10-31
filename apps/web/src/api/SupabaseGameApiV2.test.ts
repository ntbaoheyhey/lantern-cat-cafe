import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameApiErrorV2 } from './GameApiErrorV2';
import { ERROR_CODES_V2, type BossFightResultV2, type GameApiV2 } from './GameApiV2';
import { parseRetryAfter, SupabaseGameApiV2 } from './SupabaseGameApiV2';

const BASE = 'https://example.supabase.co/';
function setup(response: { status?: number; body?: unknown; raw?: string } = {}, token: string | null | undefined = 't') {
  const fetch = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) =>
    new Response(response.raw ?? JSON.stringify(response.body ?? {}), { status: response.status ?? 200 }),
  );
  const api: GameApiV2 = new SupabaseGameApiV2({ getToken: () => token, baseUrl: BASE, anonKey: 'anon', fetch });
  return { api, fetch };
}

const calls: [string, (api: GameApiV2) => Promise<unknown>, object][] = [
  ['v2-state', api => api.getState(), {}],
  ['v2-claim', api => api.claim(), {}],
  ['v2-equip', api => api.equip('item-1', 'weapon'), { itemId: 'item-1', slot: 'weapon' }],
  ['v2-choose-class', api => api.chooseClass('warrior'), { classId: 'warrior' }],
  ['v2-boss-fight', api => api.fightBoss(3), { chapter: 3 }],
  ['v2-craft', api => api.craft('rcp.common', 'ring'), { recipeId: 'rcp.common', slot: 'ring' }],
  ['v2-salvage', api => api.salvage(['item-1', 'item-2']), { itemIds: ['item-1', 'item-2'] }],
  ['v2-lock', api => api.setLocked('item-1', false), { itemId: 'item-1', locked: false }],
  ['v2-relic-forge', api => api.forgeRelic(), {}],
];

afterEach(() => vi.unstubAllEnvs());

describe('SupabaseGameApiV2', () => {
  it.each(calls)('posts the exact request to %s', async (name, call, body) => {
    const { api, fetch } = setup();
    await call(api);
    const expected = name === 'v2-craft' || name === 'v2-boss-fight'
      ? { ...body, requestId: JSON.parse(String(fetch.mock.calls[0]![1]!.body)).requestId } : body;
    if ('requestId' in expected) expect(expected.requestId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(fetch).toHaveBeenCalledExactlyOnceWith(`${BASE}functions/v1/${name}`, {
      method: 'POST',
      headers: { authorization: 'Bearer t', apikey: 'anon', 'content-type': 'application/json' },
      body: JSON.stringify(expected),
    });
  });

  it('sends null explicitly when emptying a slot', async () => {
    const { api, fetch } = setup();
    await api.equip(null, 'ring');
    expect(fetch.mock.calls[0]![1]!.body).toBe('{"itemId":null,"slot":"ring"}');
  });

  it.each([null, undefined, ''])('rejects a missing token %s without fetching', async token => {
    const { fetch } = setup();
    const api = new SupabaseGameApiV2({ baseUrl: BASE, getToken: () => token, fetch });
    await expect(api.getState()).rejects.toMatchObject({ code: 'unauthenticated' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(ERROR_CODES_V2)('recognizes the v2 error code %s', async error => {
    await expect(setup({ status: 409, body: { error } }).api.getState()).rejects.toEqual(new GameApiErrorV2(error));
  });

  it('preserves a missing stack without overwriting the error trace', async () => {
    const error: unknown = await setup({ status: 409, body: { error: 'not_enough', stack: 'fish' } }).api.claim().catch(e => e);
    expect(error).toBeInstanceOf(GameApiErrorV2);
    expect(error).toMatchObject({ code: 'not_enough', stackId: 'fish', stack: expect.stringContaining('GameApiErrorV2') });
  });

  it.each([
    [1730000000, 1730000000], ['soon', undefined], [null, undefined],
  ])('filters cooldownUntil %s', async (cooldownUntil, expected) => {
    await expect(setup({ status: 409, body: { error: 'cooldown', cooldownUntil } }).api.fightBoss(1))
      .rejects.toMatchObject({ code: 'cooldown', cooldownUntil: expected });
  });

  it.each(['NaN', 'Infinity', '-Infinity'])('ignores nonfinite cooldownUntil %s', async value => {
    const fetch = vi.fn(async () => ({ ok: false, status: 409, json: async () => ({ error: 'cooldown', cooldownUntil: Number(value) }) }) as Response);
    const api = new SupabaseGameApiV2({ baseUrl: BASE, getToken: () => 't', fetch });
    await expect(api.fightBoss(1)).rejects.toMatchObject({ code: 'cooldown', cooldownUntil: undefined });
  });

  it.each([
    ['daily_limit', 'daily_limit'], ['not_enough_yarn', 'not_enough_yarn'],
    ['no_moon_pearl', 'no_moon_pearl'], ['bogus', undefined], [42, undefined],
  ])('filters forge reason %s', async (reason, expected) => {
    await expect(setup({ status: 409, body: { error: 'forge_blocked', reason } }).api.forgeRelic())
      .rejects.toMatchObject({ code: 'forge_blocked', reason: expected });
  });

  it('ignores a stack with the wrong type', async () => {
    await expect(setup({ status: 409, body: { error: 'not_enough', stack: 7 } }).api.claim())
      .rejects.toMatchObject({ code: 'not_enough', stackId: undefined });
  });

  it.each([
    [400, '{"error":"nope"}', 'server_error'],
    [401, '', 'unauthenticated'],
    [500, '<html>unavailable</html>', 'server_error'],
    [400, 'null', 'server_error'],
    [400, '42', 'server_error'],
  ])('maps an unrecognized body for status %s', async (status, raw, code) => {
    await expect(setup({ status, raw }).api.getState()).rejects.toMatchObject({ code, message: `v2-state failed (${status})` });
  });

  it('rejects an unparsable successful response', async () => {
    await expect(setup({ raw: '' }).api.getState()).rejects.toBeInstanceOf(GameApiErrorV2);
    await expect(setup({ raw: 'invalid' }).api.getState()).rejects.toMatchObject({ code: 'server_error' });
  });

  it('maps network failures and keeps their message', async () => {
    const api = new SupabaseGameApiV2({ baseUrl: BASE, getToken: () => 't', fetch: () => Promise.reject(new TypeError('offline')) });
    await expect(api.claim()).rejects.toMatchObject({ code: 'offline', message: 'offline' });
  });

  it('returns the parsed boss fight and timeline unchanged', async () => {
    const result: BossFightResultV2 = {
      won: false, keySpent: false,
      timeline: [{ t: 0, type: 'attack_start' }, { t: 100, type: 'impact', damage: 7, crit: true, bossHp: 93 }, { t: 500, type: 'end', catHp: 0 }],
      state: {
        cat: { classId: 'warrior', level: 1, xp: 0, xpToNext: 10 },
        progress: { chapter: 1, round: 1, kills: 0, killsPerRound: 10, gated: false, neededPower: 0 },
        currencies: { fish: 3, yarn: 0, keys: 1 }, materials: {}, inventory: [], bagLimit: 100,
        equipped: { weapon: null, helmet: null, armor: null, gloves: null, boots: null, collar: null, earring: null, ring: null, charm: null },
        unlockedSlots: ['weapon'], bosses: { chapters: [], cooldownUntil: 1730000000 },
        forge: { blockedBy: 'not_enough_yarn', forgedToday: false, pending: null, today: null },
        founder: false, serverTime: 1729999970,
      },
    };
    await expect(setup({ body: result }).api.fightBoss(1)).resolves.toEqual(result);
    await expect(setup({ raw: 'null' }).api.getState()).resolves.toBeNull();
  });

  it('reads the token anew for every call', async () => {
    let token = 'first';
    const { fetch } = setup();
    const getToken = vi.fn(() => token);
    const api = new SupabaseGameApiV2({ baseUrl: BASE, getToken, fetch });
    await api.getState();
    token = 'second';
    await api.claim();
    expect(getToken).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls.map(([, init]) => init!.headers)).toEqual([
      expect.objectContaining({ authorization: 'Bearer first' }),
      expect.objectContaining({ authorization: 'Bearer second' }),
    ]);
  });

  it('uses environment defaults and strips all trailing slashes', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', `${BASE}///`);
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'env-anon');
    const { fetch } = setup();
    await new SupabaseGameApiV2({ getToken: () => 't', fetch }).getState();
    expect(fetch.mock.calls[0]![0]).toBe(`${BASE}functions/v1/v2-state`);
    expect(fetch.mock.calls[0]![1]!.headers).toHaveProperty('apikey', 'env-anon');
  });

  it('omits apikey when unset', async () => {
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    const { fetch } = setup();
    await new SupabaseGameApiV2({ baseUrl: BASE, getToken: () => 't', fetch }).getState();
    expect(fetch.mock.calls[0]![1]!.headers).not.toHaveProperty('apikey');
  });

  it('requires a nonempty base URL', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    expect(() => new SupabaseGameApiV2({ getToken: () => 't' })).toThrow('VITE_SUPABASE_URL is not set');
    expect(() => new SupabaseGameApiV2({ baseUrl: '', getToken: () => 't' })).toThrow('VITE_SUPABASE_URL is not set');
  });
});

it.each(['craft', 'boss'] as const)('%s retries one transport failure with the same requestId and exact bytes', async route => {
  const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValueOnce(new TypeError('lost response')).mockResolvedValue(new Response('{}'));
  const api = new SupabaseGameApiV2({ baseUrl: BASE, getToken: () => 't', fetch });
  if (route === 'craft') await api.craft('rcp.common', 'weapon'); else await api.fightBoss(1);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch.mock.calls[0]).toEqual(fetch.mock.calls[1]);
  const body = JSON.parse(String(fetch.mock.calls[0]![1]!.body));
  expect(body.requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});
it.each([400, 409, 500])('never retries HTTP %i or a received response that fails parsing', async status => {
  const fetch = vi.fn(async () => new Response('{}', { status }));
  const api = new SupabaseGameApiV2({ baseUrl: BASE, getToken: () => 't', fetch });
  await expect(api.craft('rcp.common', 'weapon')).rejects.toMatchObject({ code: 'server_error' });
  expect(fetch).toHaveBeenCalledTimes(1);
});
it('never retries HTTP 503 and rejects with server_busy', async () => {
  const fetch = vi.fn(async () => new Response('{}', { status: 503 }));
  const api = new SupabaseGameApiV2({ baseUrl: BASE, getToken: () => 't', fetch });
  await expect(api.craft('rcp.common', 'weapon')).rejects.toMatchObject({ code: 'server_busy' });
  expect(fetch).toHaveBeenCalledTimes(1);
});
it('generates fresh action IDs, bounds a repeated transport failure to two fetches, and does not retry corrupt successes', async () => {
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValueOnce(new Response('{}')).mockResolvedValueOnce(new Response('{}'));
  const api = new SupabaseGameApiV2({ baseUrl: BASE, getToken: () => 't', fetch });
  await api.fightBoss(1); await api.fightBoss(1);
  expect(JSON.parse(String(fetch.mock.calls[0]![1]!.body)).requestId).not.toBe(JSON.parse(String(fetch.mock.calls[1]![1]!.body)).requestId);
  fetch.mockClear().mockRejectedValue(new TypeError('offline'));
  await expect(api.fightBoss(1)).rejects.toMatchObject({ code: 'offline' }); expect(fetch).toHaveBeenCalledTimes(2);
  fetch.mockClear().mockResolvedValue(new Response('invalid'));
  await expect(api.fightBoss(1)).rejects.toMatchObject({ code: 'server_error' }); expect(fetch).toHaveBeenCalledTimes(1);
});

describe('parseRetryAfter', () => {
  it('reads retryAfter from body when present', () => {
    expect(parseRetryAfter(7, '10')).toBe(7);
    expect(parseRetryAfter('7', '10')).toBe(7);
  });

  it('reads retryAfter from header when body is missing', () => {
    expect(parseRetryAfter(undefined, '12')).toBe(12);
    expect(parseRetryAfter(null, '15')).toBe(15);
  });

  it('defaults to 5 s when neither is present or valid', () => {
    expect(parseRetryAfter(undefined, null)).toBe(5);
    expect(parseRetryAfter(null, undefined)).toBe(5);
    expect(parseRetryAfter('invalid', 'bogus')).toBe(5);
  });

  it('clamps values to 1..300 s', () => {
    expect(parseRetryAfter(9999)).toBe(300);
    expect(parseRetryAfter(0)).toBe(1);
    expect(parseRetryAfter(-10)).toBe(1);
    expect(parseRetryAfter(150)).toBe(150);
  });
});

describe('429 HTTP handling', () => {
  it('parses 429 with body retryAfter and sets retryAfterS', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ error: 'rate_limited', retryAfter: 7 }), { status: 429 }));
    const api = new SupabaseGameApiV2({ baseUrl: BASE, getToken: () => 't', fetch });
    await expect(api.claim()).rejects.toMatchObject({ code: 'rate_limited', retryAfterS: 7 });
  });

  it('parses 429 with header only', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429, headers: { 'Retry-After': '14' } }));
    const api = new SupabaseGameApiV2({ baseUrl: BASE, getToken: () => 't', fetch });
    await expect(api.claim()).rejects.toMatchObject({ code: 'rate_limited', retryAfterS: 14 });
  });

  it('parses 429 with neither and defaults to 5 s', async () => {
    const fetch = vi.fn(async () => new Response('{}', { status: 429 }));
    const api = new SupabaseGameApiV2({ baseUrl: BASE, getToken: () => 't', fetch });
    await expect(api.claim()).rejects.toMatchObject({ code: 'rate_limited', retryAfterS: 5 });
  });

  it('clamps 429 retryAfter 9999 to 300 s', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ error: 'rate_limited', retryAfter: 9999 }), { status: 429 }));
    const api = new SupabaseGameApiV2({ baseUrl: BASE, getToken: () => 't', fetch });
    await expect(api.claim()).rejects.toMatchObject({ code: 'rate_limited', retryAfterS: 300 });
  });
});
