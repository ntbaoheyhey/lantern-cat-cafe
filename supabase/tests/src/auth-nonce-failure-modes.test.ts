import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => database }));
let endpoint: (req: Request) => Promise<Response>;
const origin = 'https://local-rehearsal.test';
const env: Record<string, string> = {
  SUPABASE_URL: 'http://unused.local', SUPABASE_SERVICE_ROLE_KEY: 'local-fixture-only',
  SIWE_ALLOWED_ORIGIN: origin,
};
let missing = true;
const post = (allowedOrigin = origin) => new Request('http://unused.local/auth-nonce', {
  method: 'POST', headers: { Origin: allowedOrigin },
});

beforeAll(async () => {
  vi.stubGlobal('Deno', {
    env: { get: (key: string) => missing && key === 'SUPABASE_SERVICE_ROLE_KEY' ? undefined : env[key] },
    serve: (handler: typeof endpoint) => { endpoint = handler; },
  });
  await import('../../functions/auth-nonce/index.ts');
});
beforeEach(() => { database.rpc.mockReset(); missing = false; });
afterAll(() => vi.unstubAllGlobals());

async function expectUnavailable(response: Response) {
  expect(response.status).toBe(503);
  expect(response.headers.get('retry-after')).toBe('30');
  expect(response.headers.get('access-control-allow-origin')).toBe(origin);
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(await response.json()).toEqual({ error: 'auth_unavailable', retryAfter: 30 });
}

describe('repository-source nonce dependency rehearsal', () => {
  it('registers the worker with missing configuration, then recovers without changing source', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      expect(endpoint).toBeTypeOf('function'); missing = true;
      await expectUnavailable(await endpoint(post())); expect(database.rpc).not.toHaveBeenCalled();
      missing = false; database.rpc.mockResolvedValue({ error: null });
      const response = await endpoint(post()); expect(response.status).toBe(200);
      expect((await response.json()).nonce).toMatch(/^[0-9a-f]{32}$/);
    } finally { log.mockRestore(); }
  });

  it.each(['AbortError', 'TimeoutError', 'network failure'])('normalizes a rejected database request (%s) without disclosing details', async name => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = new Error('synthetic private diagnostic'); error.name = name;
    database.rpc.mockRejectedValue(error);
    try {
      await expectUnavailable(await endpoint(post()));
      expect(database.rpc).toHaveBeenCalledTimes(1);
      expect(log.mock.calls).toEqual([['auth-nonce dependency unavailable']]);
    } finally { log.mockRestore(); }
  });

  it('does not issue a nonce or bypass an upstream budget rejection', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    database.rpc.mockResolvedValue({ error: { code: '429', message: 'synthetic upstream limit' } });
    try { await expectUnavailable(await endpoint(post())); expect(database.rpc).toHaveBeenCalledTimes(1); }
    finally { log.mockRestore(); }
  });

  it('keeps preflight independent of database latency and rejects unlisted CORS origins', async () => {
    database.rpc.mockImplementation(() => new Promise(() => {}));
    const response = await endpoint(new Request('http://unused.local/auth-nonce', {
      method: 'OPTIONS', headers: { Origin: origin },
    }));
    expect(response.status).toBe(204); expect(response.headers.get('access-control-allow-origin')).toBe(origin);
    const other = await endpoint(new Request('http://unused.local/auth-nonce', {
      method: 'OPTIONS', headers: { Origin: 'https://unlisted.test' },
    }));
    expect(other.headers.get('access-control-allow-origin')).toBeNull();
    expect(database.rpc).not.toHaveBeenCalled();
  });

  it('documents that a pending upstream call is not an independently timed edge response', async () => {
    // This is a limit, not a claim that a gateway 502 has been reproduced or repaired.
    let release!: (value: { error: null }) => void;
    database.rpc.mockImplementation(() => new Promise(resolve => { release = resolve; }));
    let settled = false;
    const pending = endpoint(post()).then(response => { settled = true; return response; });
    await Promise.resolve(); await Promise.resolve();
    expect(settled).toBe(false); release({ error: null });
    expect((await pending).status).toBe(200);
  });
});
