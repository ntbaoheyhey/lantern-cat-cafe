import {
  GameApiError,
  type BossFightResult,
  type ClaimResult,
  type ForgeResult,
  type GameApi,
  type GameApiErrorCode,
  type ServerState,
} from './GameApi';

export interface SupabaseGameApiOptions {
  /** Session JWT from auth-verify; null or undefined when signed out. Read on every call. */
  getToken: () => string | null | undefined;
  /** Supabase project URL. Defaults to VITE_SUPABASE_URL. */
  baseUrl?: string;
  /** Anon/publishable key, sent as `apikey`. Defaults to VITE_SUPABASE_ANON_KEY. */
  anonKey?: string;
  /** Inject a fake fetch in tests. */
  fetch?: typeof fetch;
}

const CODES: readonly GameApiErrorCode[] = [
  'unauthenticated',
  'not_owner',
  'not_found',
  'rate_limited',
  'no_attempts_left',
  'forge_blocked',
  'mint_not_confirmed',
  'server_error',
];

/** GameApi over the Supabase Edge Functions in docs/api.md. */
export class SupabaseGameApi implements GameApi {
  private readonly root: string;
  private readonly anonKey: string | undefined;
  private readonly getToken: () => string | null | undefined;
  private readonly fetch: typeof fetch;

  constructor(opts: SupabaseGameApiOptions) {
    this.root = (opts.baseUrl ?? import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '');
    if (!this.root) throw new Error('VITE_SUPABASE_URL is not set');
    this.anonKey = opts.anonKey ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
    this.getToken = opts.getToken;
    this.fetch = opts.fetch ?? ((input, init) => fetch(input, init));
  }

  private async post<T>(name: string, body: object = {}): Promise<T> {
    const token = this.getToken();
    if (!token) throw new GameApiError('unauthenticated');
    const headers: Record<string, string> = { 'content-type': 'application/json', authorization: `Bearer ${token}` };
    if (this.anonKey) headers.apikey = this.anonKey;
    let res: Response;
    try {
      res = await this.fetch(`${this.root}/functions/v1/${name}`, { method: 'POST', headers, body: JSON.stringify(body) });
    } catch (e) {
      throw new GameApiError('server_error', e instanceof Error ? e.message : String(e));
    }
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const { error: code, reason } = (data as { error?: unknown; reason?: unknown } | null) ?? {};
      if (CODES.includes(code as GameApiErrorCode)) {
        throw new GameApiError(code as GameApiErrorCode, typeof reason === 'string' ? reason : undefined);
      }
      throw new GameApiError(res.status === 401 ? 'unauthenticated' : 'server_error', `${name} failed (${res.status})`);
    }
    return data as T;
  }

  getState(): Promise<ServerState> {
    return this.post('game-state');
  }

  claim(): Promise<ClaimResult> {
    return this.post('idle-claim');
  }

  equip(gearId: string): Promise<ServerState> {
    return this.post('equip', { gearId });
  }

  fightBoss(): Promise<BossFightResult> {
    return this.post('boss-fight');
  }

  forgeRelic(): Promise<ForgeResult> {
    return this.post('relic-forge');
  }

  reportMint(nonce: string, txHash: `0x${string}`): Promise<ServerState> {
    return this.post('relic-mint-report', { nonce, txHash });
  }
}
