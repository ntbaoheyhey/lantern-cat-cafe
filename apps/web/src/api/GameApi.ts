import type { Gear } from '@taskbar-hero/game-rules';

/** Authoritative account snapshot. The server's numbers always win. */
export interface ServerState {
  gold: number;
  shards: number;
  gear: Gear[];
  bossLevel: number;
  power: number;
  goldPerSecond: number;
  /** Unix seconds on the server clock. */
  serverTime: number;
}

export interface ClaimResult extends ServerState {
  /** Gear dropped since the previous claim. */
  drops: Gear[];
}

/** Seam between the client and the server. B3 provides the real implementation. */
export interface GameApi {
  getState(): Promise<ServerState>;
  /** Credit everything earned since the last claim and return the new totals. */
  claim(): Promise<ClaimResult>;
}
