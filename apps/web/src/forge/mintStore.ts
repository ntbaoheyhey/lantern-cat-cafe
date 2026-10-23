/** A mint tx whose report has not reached the server yet. Survives a closed tab. */
export interface UnreportedMint {
  nonce: string;
  hash: `0x${string}`;
}

const KEY = 'taskbar-hero.unreportedMint';

function storage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function loadUnreported(): UnreportedMint | null {
  try {
    const raw = storage()?.getItem(KEY);
    const v = raw ? (JSON.parse(raw) as UnreportedMint) : null;
    return v && typeof v.nonce === 'string' && /^0x[0-9a-fA-F]{64}$/.test(v.hash) ? v : null;
  } catch {
    return null;
  }
}

export function saveUnreported(m: UnreportedMint): void {
  try {
    storage()?.setItem(KEY, JSON.stringify(m));
  } catch {
    /* memory only: the report is retried while the tab stays open */
  }
}

export function clearUnreported(): void {
  try {
    storage()?.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
