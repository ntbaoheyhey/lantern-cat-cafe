export interface VerifyResult {
  token: string;
  playerId: string;
  wallet: string;
}

export interface AuthApi {
  getNonce(): Promise<string>;
  verify(input: { message: string; signature: string }): Promise<VerifyResult>;
}

async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

/** Talks to the Supabase edge functions auth-nonce / auth-verify. */
export function createHttpAuthApi(baseUrl = import.meta.env.VITE_SUPABASE_URL): AuthApi {
  const root = (baseUrl ?? '').replace(/\/+$/, '');
  if (!root) throw new Error('VITE_SUPABASE_URL is not set');
  return {
    async getNonce() {
      const { nonce } = await post<{ nonce: string }>(`${root}/functions/v1/auth-nonce`);
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
