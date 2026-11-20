import { afterEach, describe, expect, it, vi } from 'vitest';
import { AUTH_UNAVAILABLE_MESSAGE, createHttpAuthApi, defaultAuthApi } from './authApi';

const input = { message: `x\n0x${'a'.repeat(40)}`, signature: '0x00' };

function stub(env: { PROD: boolean; url?: string; allow?: string }) {
  vi.stubEnv('PROD', env.PROD);
  vi.stubEnv('VITE_SUPABASE_URL', env.url ?? '');
  vi.stubEnv('VITE_ALLOW_MOCK_AUTH', env.allow ?? '');
}

describe('defaultAuthApi', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('production without a backend refuses to sign in', async () => {
    stub({ PROD: true });
    const api = defaultAuthApi();
    await expect(api.getNonce()).rejects.toThrow(/unavailable/);
    await expect(api.verify(input)).rejects.toThrow(/unavailable/);
  });

  it('production with a backend uses HTTP, never mock', async () => {
    stub({ PROD: true, url: 'https://x.supabase.co' });
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ nonce: 'n' })));
    vi.stubGlobal('fetch', fetchMock);
    expect(await defaultAuthApi().getNonce()).toBe('n');
    expect(fetchMock.mock.calls[0]![0]).toBe('https://x.supabase.co/functions/v1/auth-nonce');
    vi.unstubAllGlobals();
  });

  it('production demo build opts in explicitly with VITE_ALLOW_MOCK_AUTH=1', async () => {
    stub({ PROD: true, allow: '1' });
    expect((await defaultAuthApi().verify(input)).token).toMatch(/^mock\./);
  });

  it('development without a backend uses the mock', async () => {
    stub({ PROD: false });
    expect((await defaultAuthApi().verify(input)).token).toMatch(/^mock\./);
  });
});

describe('HTTP auth availability', () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('backs off after a raw 502 and recovers without signing twice', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('Bad Gateway', { status: 502 }))
      .mockResolvedValueOnce(new Response('Bad Gateway', { status: 502 }))
      .mockResolvedValueOnce(new Response('{"nonce":"recovered"}'));
    vi.stubGlobal('fetch', fetchMock);
    const result = createHttpAuthApi('https://auth.test').getNonce();
    await vi.advanceTimersByTimeAsync(249);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(499);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(await result).toBe('recovered');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it.each(['gateway', 'network'])('bounds persistent %s errors and explains guest play', async kind => {
    vi.useFakeTimers();
    const fetchMock = kind === 'gateway'
      ? vi.fn().mockImplementation(async () => new Response('secret upstream details', { status: 502 }))
      : vi.fn().mockRejectedValue(new TypeError('private network details'));
    vi.stubGlobal('fetch', fetchMock);
    const assertion = expect(createHttpAuthApi('https://auth.test').getNonce()).rejects.toThrow(AUTH_UNAVAILABLE_MESSAGE);
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('honours Retry-After without retrying an unavailable dependency', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"error":"auth_unavailable"}', { status: 503, headers: { 'Retry-After': '30' } }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(createHttpAuthApi('https://auth.test').getNonce()).rejects.toThrow(AUTH_UNAVAILABLE_MESSAGE);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('never retries a single-use verification, even after a gateway failure', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('Bad Gateway', { status: 502 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(createHttpAuthApi('https://auth.test').verify(input)).rejects.toThrow(AUTH_UNAVAILABLE_MESSAGE);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('preserves client rejection and never retries it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"error":"invalid_nonce"}', { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(createHttpAuthApi('https://auth.test').getNonce()).rejects.toThrow('Request failed (401)');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(['not json', '{}', 'null', '{"nonce":null}'])('rejects malformed nonce success %s without a retry', async body => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(body));
    vi.stubGlobal('fetch', fetchMock);
    await expect(createHttpAuthApi('https://auth.test').getNonce()).rejects.toThrow(AUTH_UNAVAILABLE_MESSAGE);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
