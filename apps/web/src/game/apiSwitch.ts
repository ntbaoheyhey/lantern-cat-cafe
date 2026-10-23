import type { GameApi } from '../api/GameApi';
import { withSessionGuard } from '../api/sessionGuard';
import { SupabaseGameApi } from '../api/SupabaseGameApi';
import type { SessionStore } from '../wallet/session';
import { GameLoop } from './gameState';

export interface GameEnv {
  supabaseUrl?: string;
  anonKey?: string;
}

export interface GameMode {
  /** True while the mock API runs (signed out, or no Supabase env). */
  demo: boolean;
  /** One-off message, e.g. after the session expired. */
  notice: string | null;
}

export const EXPIRED_NOTICE = 'Your session expired, so you are back in demo mode. Sign in again to play on the server.';

export interface ApiSwitchOptions {
  sessions: SessionStore;
  env: GameEnv;
  /** Builds the demo (mock) API; called once and reused. */
  demo: () => GameApi;
  fetch?: typeof fetch;
}

/**
 * Picks the game API from the wallet session: SupabaseGameApi when signed in and the
 * Supabase env is set, the demo mock otherwise. Owns the one GameLoop and restarts it on a swap.
 */
export class ApiSwitch {
  readonly loop: GameLoop;
  private current: GameApi;
  private demoApi: GameApi | null = null;
  private token: string | null = null;
  private mode: GameMode = { demo: true, notice: null };
  private readonly listeners = new Set<() => void>();

  constructor(private readonly opts: ApiSwitchOptions) {
    this.current = this.build();
    this.loop = new GameLoop({ api: this.current });
    opts.sessions.subscribe(this.refresh);
  }

  get api(): GameApi {
    return this.current;
  }

  readonly getMode = (): GameMode => this.mode;

  readonly subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private serverToken(): string | null {
    const { supabaseUrl, anonKey } = this.opts.env;
    if (!supabaseUrl || !anonKey) return null;
    return this.opts.sessions.get()?.token ?? null;
  }

  private build(): GameApi {
    this.token = this.serverToken();
    if (!this.token) {
      this.setMode({ demo: true, notice: this.mode.notice });
      return (this.demoApi ??= this.opts.demo());
    }
    this.setMode({ demo: false, notice: null });
    const api = new SupabaseGameApi({
      baseUrl: this.opts.env.supabaseUrl,
      anonKey: this.opts.env.anonKey,
      getToken: () => this.opts.sessions.get()?.token,
      fetch: this.opts.fetch,
    });
    return withSessionGuard(api, this.expire);
  }

  /** Session changed: swap the API and restart the loop if the server token changed. */
  private readonly refresh = (): void => {
    if (this.serverToken() === this.token) return;
    this.current = this.build();
    this.loop.switchApi(this.current);
  };

  private readonly expire = (): void => {
    if (this.mode.demo) return;
    this.setMode({ demo: false, notice: EXPIRED_NOTICE });
    this.opts.sessions.clear(); // emits, which calls refresh
    this.refresh(); // in case the session was already gone
  };

  private setMode(next: GameMode): void {
    if (next.demo === this.mode.demo && next.notice === this.mode.notice) return;
    this.mode = next;
    this.listeners.forEach((fn) => fn());
  }
}
