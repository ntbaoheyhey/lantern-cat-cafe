import type { GameApiV2 } from '../../api/GameApiV2';
import type { SessionStore } from '../../wallet/session';
import { EXPIRED_NOTICE, type GameMode } from '../apiSwitch';
import { GameLoopV2 } from './loopV2';

export interface ApiSwitchV2Options {
  sessions: SessionStore;
  env: { supabaseUrl?: string; anonKey?: string };
  /** Builds the demo (mock) API; called once and reused. */
  demo: () => GameApiV2;
  server: (opts: { baseUrl: string; anonKey: string; getToken: () => string | null | undefined }) => GameApiV2;
  guard?: (api: GameApiV2, onUnauthenticated: () => void) => GameApiV2;
}

/**
 * Picks the injected server API when signed in with the environment set, or the
 * cached demo otherwise. Owns one loop and restarts it on a token change.
 */
export class ApiSwitchV2 {
  readonly loop: GameLoopV2;
  private current: GameApiV2;
  private demoApi: GameApiV2 | null = null;
  private token: string | null = null;
  private mode: GameMode = { demo: true, notice: null };
  private readonly listeners = new Set<() => void>();

  constructor(private readonly opts: ApiSwitchV2Options) {
    this.current = this.build();
    this.loop = new GameLoopV2({ api: this.current });
    opts.sessions.subscribe(this.refresh);
  }

  get api(): GameApiV2 {
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

  private build(): GameApiV2 {
    this.token = this.serverToken();
    if (!this.token) {
      this.setMode({ demo: true, notice: this.mode.notice });
      return (this.demoApi ??= this.opts.demo());
    }
    this.setMode({ demo: false, notice: null });
    const api = this.opts.server({
      baseUrl: this.opts.env.supabaseUrl!,
      anonKey: this.opts.env.anonKey!,
      getToken: () => this.opts.sessions.get()?.token,
    });
    return this.opts.guard ? this.opts.guard(api, this.expire) : api;
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
