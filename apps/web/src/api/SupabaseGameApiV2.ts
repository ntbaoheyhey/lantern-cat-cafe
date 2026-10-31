import { GameApiErrorV2, isGameApiErrorCodeV2 } from './GameApiErrorV2';
import type {
  BossFightResultV2, ClaimResultV2, ClassId, CraftResultV2, ForgeResultV2,
  GameApiV2, GearSlotId, RecipeId, SalvageResultV2, ServerStateV2, StackId,
} from './GameApiV2';

export type EndpointV2 = 'v2-state' | 'v2-claim' | 'v2-equip' | 'v2-choose-class' | 'v2-boss-fight' | 'v2-craft' | 'v2-salvage' | 'v2-lock' | 'v2-relic-forge';

export interface SupabaseGameApiV2Options {
  /** Session JWT; read on every call. */
  getToken: () => string | null | undefined;
  /** Defaults to VITE_SUPABASE_URL. */
  baseUrl?: string;
  /** Defaults to VITE_SUPABASE_ANON_KEY; sent as apikey. */
  anonKey?: string;
  fetch?: typeof fetch;
}

/** Parses Retry-After from JSON body or response header, defaulting to 5 s and clamped to 1..300 s. */
export function parseRetryAfter(bodyVal?: unknown, headerVal?: string | null): number {
  let val: number | undefined;
  if (typeof bodyVal === 'number' && Number.isFinite(bodyVal)) {
    val = bodyVal;
  } else if (typeof bodyVal === 'string' && bodyVal.trim() !== '') {
    const n = Number(bodyVal);
    if (Number.isFinite(n)) val = n;
  }
  if (val === undefined && headerVal != null && headerVal.trim() !== '') {
    const n = Number(headerVal);
    if (Number.isFinite(n)) val = n;
  }
  if (val === undefined) {
    return 5;
  }
  return Math.min(300, Math.max(1, Math.round(val)));
}

/** Browser transport for the v2 Edge Functions in docs/api-v2.md. */
export class SupabaseGameApiV2 implements GameApiV2 {
  private readonly root: string;
  private readonly anonKey: string | undefined;
  private readonly getToken: SupabaseGameApiV2Options['getToken'];
  private readonly fetch: typeof fetch;

  constructor(opts: SupabaseGameApiV2Options) {
    this.root = (opts.baseUrl ?? import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '');
    if (!this.root) throw new Error('VITE_SUPABASE_URL is not set');
    this.anonKey = opts.anonKey ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
    this.getToken = opts.getToken;
    this.fetch = opts.fetch ?? ((input, init) => fetch(input, init));
  }

  private async post<T>(name: EndpointV2, body: object = {}, retryTransport = false): Promise<T> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new GameApiErrorV2('offline', {}, 'offline');
    }
    const token = this.getToken();
    if (!token) throw new GameApiErrorV2('unauthenticated');
    const headers: Record<string, string> = { 'content-type': 'application/json', authorization: `Bearer ${token}` };
    if (this.anonKey) headers.apikey = this.anonKey;
    const init = { method: 'POST', headers, body: JSON.stringify(body) };
    let res: Response;
    try {
      try { res = await this.fetch(`${this.root}/functions/v1/${name}`, init); }
      catch (error) {
        if (!retryTransport) throw error;
        res = await this.fetch(`${this.root}/functions/v1/${name}`, init);
      }
    } catch (e) {
      if ((typeof navigator !== 'undefined' && !navigator.onLine) || e instanceof TypeError) {
        throw new GameApiErrorV2('offline', {}, 'offline');
      }
      throw new GameApiErrorV2('server_error', {}, e instanceof Error ? e.message : String(e));
    }
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      if (res.ok) throw new GameApiErrorV2('server_error');
    }
    if (!res.ok) {
      const fields = typeof data === 'object' && data !== null ? data as Record<string, unknown> : {};
      if (res.status === 429 || (fields.error === 'rate_limited' && (fields.retryAfter !== undefined || res.headers?.has?.('retry-after')))) {
        const headerVal = res.headers?.get ? (res.headers.get('retry-after') ?? res.headers.get('Retry-After')) : null;
        const retryAfterS = parseRetryAfter(fields.retryAfter, headerVal);
        throw new GameApiErrorV2('rate_limited', { retryAfterS }, 'rate_limited');
      }
      if (res.status === 503 || fields.error === 'server_busy') {
        throw new GameApiErrorV2('server_busy', {}, 'server_busy');
      }
      if (isGameApiErrorCodeV2(fields.error)) {
        throw new GameApiErrorV2(fields.error, {
          reason: fields.reason === 'daily_limit' || fields.reason === 'not_enough_yarn' || fields.reason === 'no_moon_pearl'
            ? fields.reason : undefined,
          stack: typeof fields.stack === 'string' ? fields.stack as StackId : undefined,
          cooldownUntil: typeof fields.cooldownUntil === 'number' && Number.isFinite(fields.cooldownUntil)
            ? fields.cooldownUntil : undefined,
        });
      }
      throw new GameApiErrorV2(res.status === 401 ? 'unauthenticated' : 'server_error', {}, `${name} failed (${res.status})`);
    }
    return data as T;
  }

  getState(): Promise<ServerStateV2> { return this.post('v2-state'); }
  claim(): Promise<ClaimResultV2> { return this.post('v2-claim'); }
  equip(itemId: string | null, slot: GearSlotId): Promise<ServerStateV2> { return this.post('v2-equip', { itemId, slot }); }
  chooseClass(classId: ClassId): Promise<ServerStateV2> { return this.post('v2-choose-class', { classId }); }
  fightBoss(chapter: number, requestId = crypto.randomUUID()): Promise<BossFightResultV2> { return this.post('v2-boss-fight', { chapter, requestId }, true); }
  craft(recipeId: RecipeId, slot: GearSlotId, requestId = crypto.randomUUID()): Promise<CraftResultV2> { return this.post('v2-craft', { recipeId, slot, requestId }, true); }
  salvage(itemIds: string[]): Promise<SalvageResultV2> { return this.post('v2-salvage', { itemIds }); }
  setLocked(itemId: string, locked: boolean): Promise<ServerStateV2> { return this.post('v2-lock', { itemId, locked }); }
  forgeRelic(): Promise<ForgeResultV2> { return this.post('v2-relic-forge'); }
}
