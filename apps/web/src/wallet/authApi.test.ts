import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultAuthApi } from './authApi';

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
