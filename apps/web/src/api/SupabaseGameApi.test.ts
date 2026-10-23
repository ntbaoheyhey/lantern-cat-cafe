import { describe, expect, it, vi } from 'vitest';
import { GameApiError, type ClaimResult } from './GameApi';
import { SupabaseGameApi } from './SupabaseGameApi';

const BASE = 'https://proj.supabase.co/';

function setup(response: { status?: number; body?: unknown } = {}, token: string | null = 'jwt-1') {
  const fetch = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) =>
    new Response(JSON.stringify(response.body ?? {}), { status: response.status ?? 200 }),
  );
  const api = new SupabaseGameApi({ baseUrl: BASE, anonKey: 'anon-1', getToken: () => token, fetch });
  return { api, fetch };
}

describe('SupabaseGameApi', () => {
  it('posts each call to its Edge Function with the session JWT', async () => {
    const { api, fetch } = setup({ body: { gold: 7 } });
    await expect(api.getState()).resolves.toEqual({ gold: 7 });
    await api.claim();
    await api.equip('gear-1');
    expect(fetch.mock.calls.map(([url, init]) => [url, init?.body])).toEqual([
      ['https://proj.supabase.co/functions/v1/game-state', '{}'],
      ['https://proj.supabase.co/functions/v1/idle-claim', '{}'],
      ['https://proj.supabase.co/functions/v1/equip', '{"gearId":"gear-1"}'],
    ]);
    const init = fetch.mock.calls[0]![1]!;
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ authorization: 'Bearer jwt-1', apikey: 'anon-1' });
  });

  it('returns the server JSON as-is', async () => {
    const result = { gold: 1, drops: [{ id: 'a', slot: 'ring', rarity: 'rare', level: 2, equipped: false }] };
    const { api } = setup({ body: result });
    expect(await api.claim()).toEqual(result as unknown as ClaimResult);
  });

  it('maps error bodies to GameApiError codes', async () => {
    await expect(setup({ status: 403, body: { error: 'not_owner' } }).api.equip('x')).rejects.toEqual(new GameApiError('not_owner'));
    await expect(setup({ status: 404, body: { error: 'not_found' } }).api.getState()).rejects.toMatchObject({ code: 'not_found' });
    await expect(setup({ status: 401, body: { msg: 'Invalid JWT' } }).api.getState()).rejects.toMatchObject({ code: 'unauthenticated' });
    await expect(setup({ status: 502, body: 'bad gateway' }).api.getState()).rejects.toMatchObject({ code: 'server_error' });
  });

  it('rejects unauthenticated without calling the server when signed out', async () => {
    const { api, fetch } = setup({}, null);
    await expect(api.getState()).rejects.toMatchObject({ code: 'unauthenticated' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('turns network failures into server_error', async () => {
    const api = new SupabaseGameApi({ baseUrl: BASE, getToken: () => 't', fetch: () => Promise.reject(new TypeError('offline')) });
    await expect(api.claim()).rejects.toMatchObject({ code: 'server_error', message: 'offline' });
  });

  it('fightBoss posts to boss-fight and maps no_attempts_left', async () => {
    const { api, fetch } = setup({ body: { keyGranted: true } });
    await expect(api.fightBoss()).resolves.toEqual({ keyGranted: true });
    expect(fetch.mock.calls[0]![0]).toBe('https://proj.supabase.co/functions/v1/boss-fight');
    await expect(setup({ status: 409, body: { error: 'no_attempts_left' } }).api.fightBoss()).rejects.toEqual(
      new GameApiError('no_attempts_left'),
    );
  });
});
