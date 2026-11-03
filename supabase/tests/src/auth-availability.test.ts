import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { as } from './standalone-db.ts';

let db: PGlite;
let endpoint: (req: Request) => Promise<Response>;
let missingEnv = '';
let rpcFailure = false;
let rpcCalls = 0;
const origin = 'https://taskbarhero.test';
const env: Record<string, string> = { SUPABASE_URL: 'http://db.local', SUPABASE_SERVICE_ROLE_KEY: 'local-only', SIWE_ALLOWED_ORIGIN: origin };

vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({
  rpc: async (fn: string, args: { p_nonce: string }) => {
    rpcCalls++;
    if (rpcFailure) return { error: { message: 'private database details' } };
    try {
      await as(db, 'service_role', null, () => db.query(`select public.${fn}($1)`, [args.p_nonce]));
      return { error: null };
    } catch (error) { return { error: { message: (error as Error).message } }; }
  },
}) }));

beforeAll(async () => {
  // Model the pre-hardening migration state; no connection to a live database.
  db = new PGlite();
  await db.exec(readFileSync(new URL('../sql/bootstrap.sql', import.meta.url), 'utf8'));
  const migrations = new URL('../../migrations/', import.meta.url);
  for (const file of readdirSync(migrations).filter(f => f.endsWith('.sql') && f < '20261103000000').sort()) {
    await db.exec(readFileSync(new URL(file, migrations), 'utf8'));
  }
  missingEnv = 'SUPABASE_SERVICE_ROLE_KEY';
  vi.stubGlobal('Deno', {
    env: { get: (key: string) => key === missingEnv ? undefined : env[key] },
    serve: (handler: typeof endpoint) => { endpoint = handler; },
  });
  // Worker startup itself must survive missing configuration.
  await import('../../functions/auth-nonce/index.ts');
  missingEnv = '';
});
afterAll(async () => { vi.unstubAllGlobals(); await db?.close(); });
const post = () => new Request('http://local/auth-nonce', { method: 'POST', headers: { Origin: origin } });

async function unavailable() {
  const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  try {
    const response = await endpoint(post());
    expect(response.status).toBe(503);
    expect(response.headers.get('retry-after')).toBe('30');
    expect(response.headers.get('access-control-allow-origin')).toBe(origin);
    expect(response.headers.get('access-control-expose-headers')).toBe('Retry-After');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ error: 'auth_unavailable', retryAfter: 30 });
    expect(log.mock.calls).toEqual([['auth-nonce dependency unavailable']]);
  } finally { log.mockRestore(); }
}

describe('nonce dependency availability', () => {
  it('works without November 3/4/6 migrations, disproving a missing budget-table explanation', async () => {
    const table = await db.query<{ name: string | null }>("select to_regclass('private.v2_request_budgets')::text as name");
    expect(table.rows[0]!.name).toBeNull();
    const response = await endpoint(post());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ nonce: expect.stringMatching(/^[0-9a-f]{32}$/) });
  });

  it('returns a clear 503 for a missing nonce RPC and issues no challenge', async () => {
    await db.exec('begin; drop function public.create_siwe_nonce(text)');
    try { await unavailable(); } finally { await db.exec('rollback'); }
  });

  it('fails closed for an unavailable database without exposing its error', async () => {
    rpcFailure = true;
    try { await unavailable(); } finally { rpcFailure = false; }
  });

  it.each(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'])('returns 503 rather than crashing for missing %s', async key => {
    const before = rpcCalls;
    missingEnv = key;
    try { await unavailable(); expect(rpcCalls).toBe(before); } finally { missingEnv = ''; }
  });

  it('serves preflight and method rejection even when dependencies are unavailable', async () => {
    missingEnv = 'SUPABASE_URL';
    const before = rpcCalls;
    try {
      const response = await endpoint(new Request('http://local/auth-nonce', { method: 'OPTIONS', headers: { Origin: origin } }));
      expect(response.status).toBe(204);
      expect(response.headers.get('access-control-allow-origin')).toBe(origin);
      expect((await endpoint(new Request('http://local/auth-nonce'))).status).toBe(405);
      expect(rpcCalls).toBe(before);
    } finally { missingEnv = ''; }
  });
});
