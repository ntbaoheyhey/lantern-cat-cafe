export interface VerifyResult {
  token: string;
  playerId: string;
  wallet: string;
}

export interface AuthApi {
  getNonce(): Promise<string>;
  verify(input: { message: string; signature: string }): Promise<VerifyResult>;
}

export const AUTH_UNAVAILABLE_MESSAGE = 'Wallet sign-in is temporarily unavailable, guest play still works.';

export class AuthUnavailableError extends Error {
  constructor() { super(AUTH_UNAVAILABLE_MESSAGE); this.name = 'AuthUnavailableError'; }
}

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

async function post<T>(url: string, body?: unknown, retryNonce = false): Promise<T> {
  // Only nonce issuance can be retried. A signed verification is single-use.
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      if (!retryNonce || attempt >= 2) throw new AuthUnavailableError();
      await wait(250 * 2 ** attempt);
      continue;
    }
    if (res.status >= 500) {
      // Honour a server cooldown by letting the user try later. Do not hammer
      // a missing dependency or hold the wallet UI for a 30-second retry.
      const retryAfter = res.headers.get('retry-after');
      if (!retryNonce || attempt >= 2 || retryAfter !== null) throw new AuthUnavailableError();
      await wait(250 * 2 ** attempt);
      continue;
    }
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    try { return await res.json() as T; } catch { throw new AuthUnavailableError(); }
  }
}

/** Talks to the Supabase edge functions auth-nonce / auth-verify. */
export function createHttpAuthApi(baseUrl = import.meta.env.VITE_SUPABASE_URL): AuthApi {
  const root = (baseUrl ?? '').replace(/\/+$/, '');
  if (!root) throw new Error('VITE_SUPABASE_URL is not set');
  return {
    async getNonce() {
      const result = await post<{ nonce?: unknown } | null>(`${root}/functions/v1/auth-nonce`, undefined, true);
      const nonce = result?.nonce;
      if (typeof nonce !== 'string' || !nonce) throw new AuthUnavailableError();
      return nonce;
    },
    verify: (input) => post<VerifyResult>(`${root}/functions/v1/auth-verify`, input),
  };
}

/** Offline implementation for dev and tests. Accepts any signature. */
export function createMockAuthApi(): AuthApi {
  let n = 0;
  return {
    async getNonce() {
      n += 1;
      return `mocknonce${String(n).padStart(8, '0')}`;
    },
    async verify({ message }) {
      const wallet = /^0x[0-9a-fA-F]{40}$/m.exec(message)?.[0] ?? '';
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ sub: wallet, exp }));
      return { token: `mock.${payload}.sig`, playerId: `mock-${wallet.slice(2, 10).toLowerCase()}`, wallet };
    },
  };
}

/** Fails closed: every call rejects, so a production build never mints a mock session. */
export function createBlockedAuthApi(): AuthApi {
  const fail = () => Promise.reject(new Error('Sign-in is unavailable: this build has no backend configured'));
  return { getNonce: fail, verify: fail };
}

/**
 * HTTP when VITE_SUPABASE_URL is set. Without it, mock sign-in is allowed only in
 * development or in a build that opts in with VITE_ALLOW_MOCK_AUTH=1 (demo/e2e);
 * any other production build refuses to sign in.
 */
export function defaultAuthApi(): AuthApi {
  if (import.meta.env.VITE_SUPABASE_URL) return createHttpAuthApi();
  if (!import.meta.env.PROD || import.meta.env.VITE_ALLOW_MOCK_AUTH === '1') return createMockAuthApi();
  return createBlockedAuthApi();
}
