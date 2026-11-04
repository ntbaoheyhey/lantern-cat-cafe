export interface Session {
  token: string;
  playerId: string;
  wallet: string;
  /** Unix ms. */
  expiresAt: number;
}

const KEY = 'taskbar-hero.session';
const DEFAULT_TTL_MS = 60 * 60 * 1000;

/** Expiry from the JWT `exp` claim, falling back to one hour. */
export function expiryFromToken(token: string, now = Date.now()): number {
  try {
    const part = token.split('.')[1] ?? '';
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    const exp = (JSON.parse(json) as { exp?: unknown }).exp;
    if (typeof exp === 'number' && Number.isFinite(exp)) return exp * 1000;
  } catch {
    /* not a decodable JWT */
  }
  return now + DEFAULT_TTL_MS;
}

function defaultStorage(): Storage | undefined {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

export interface SessionStore {
  get(): Session | null;
  set(s: Session): void;
  clear(): void;
  subscribe(fn: () => void): () => void;
}

/** In-memory session mirrored to sessionStorage; storage failures are ignored. */
export function createSessionStore(storage: Storage | null | undefined = defaultStorage(), now = () => Date.now()): SessionStore {
  const listeners = new Set<() => void>();
  const valid = (s: Session | null): s is Session => !!s && s.expiresAt > now();

  let current: Session | null = null;
  try {
    const raw = storage?.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Session) : null;
    if (valid(parsed) && parsed.token && parsed.playerId && parsed.wallet) current = parsed;
    else if (raw) storage?.removeItem(KEY);
  } catch {
    current = null;
  }

  const emit = () => listeners.forEach((l) => l());
  return {
    get() {
      if (current && !valid(current)) this.clear();
      return current;
    },
    set(s) {
      current = s;
      try {
        storage?.setItem(KEY, JSON.stringify(s));
      } catch {
        /* memory only */
      }
      emit();
    },
    clear() {
      if (!current) return;
      current = null;
      try {
        storage?.removeItem(KEY);
      } catch {
        /* ignore */
      }
      emit();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
