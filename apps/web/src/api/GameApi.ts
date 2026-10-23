import type { BossResult, Gear } from '@taskbar-hero/game-rules';

/** A gear item the player owns. `id` is the server's row id. */
export interface OwnedGear extends Gear {
  id: string;
  equipped: boolean;
}

/** Today's boss status. "Today" resets at midnight UTC+7 (game-rules dayIndex). */
export interface BossStatus {
  /** Boss the player faces next. */
  level: number;
  attemptsToday: number;
  /** CONFIG.boss.maxAttemptsPerDay minus attemptsToday, never below 0. */
  attemptsLeft: number;
  /** True once today's Boss Key has been granted. */
  keyEarnedToday: boolean;
}

/** Authoritative account snapshot. The server's numbers always win. */
export interface ServerState {
  gold: number;
  shards: number;
  /** Equipped gear only, at most one per slot. Drives power. */
  gear: Gear[];
  /** Every item the player owns, equipped ones included. */
  inventory: OwnedGear[];
  bossLevel: number;
  /** Unspent Boss Keys. */
  bossKeys: number;
  boss: BossStatus;
  power: number;
  goldPerSecond: number;
  /** Unix seconds on the server clock. */
  serverTime: number;
}

export interface ClaimResult extends ServerState {
  /** Gear dropped since the previous claim, already added to inventory. */
  drops: OwnedGear[];
}

export interface BossFightResult {
  /** The server's fight; the client replays `result.log` and never re-simulates. */
  result: BossResult;
  /** True when this win granted today's Boss Key. */
  keyGranted: boolean;
  /** State after the fight (attempts, keys, boss level). */
  state: ServerState;
}

/** Error codes a call can reject with (`GameApiError.code`). */
export type GameApiErrorCode =
  | 'unauthenticated'
  | 'not_owner'
  | 'not_found'
  | 'rate_limited'
  | 'no_attempts_left'
  | 'server_error';

export class GameApiError extends Error {
  constructor(
    readonly code: GameApiErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = 'GameApiError';
  }
}

/**
 * Seam between the client and the server. MockGameApi runs in the browser;
 * the Supabase implementation (B3, B4) calls the Edge Functions in docs/api.md.
 */
export interface GameApi {
  getState(): Promise<ServerState>;
  /** Credit everything earned since the last claim and return the new totals. */
  claim(): Promise<ClaimResult>;
  /** Equip an owned item, replacing whatever was in its slot. */
  equip(gearId: string): Promise<ServerState>;
  /** Fight the current boss once. Rejects with `no_attempts_left` at the daily limit. */
  fightBoss(): Promise<BossFightResult>;
}
