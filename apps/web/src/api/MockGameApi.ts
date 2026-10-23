import {
  computeIdleGains,
  deriveSeed,
  goldPerSecond,
  heroPower,
  newPlayer,
  type Gear,
  type PlayerState,
  type Seed,
} from '@taskbar-hero/game-rules';
import type { ClaimResult, GameApi, ServerState } from './GameApi';

export interface MockGameApiOptions {
  seed?: Seed;
  /** Clock in milliseconds; inject a fake one in tests. */
  now?: () => number;
}

/** In-memory stand-in for the server, computing with game-rules. */
export class MockGameApi implements GameApi {
  private readonly player: PlayerState = newPlayer();
  private readonly inventory: Gear[] = [];
  private readonly seed: Seed;
  private readonly now: () => number;
  private lastClaimMs: number;
  private claims = 0;

  constructor(opts: MockGameApiOptions = {}) {
    this.seed = opts.seed ?? 12345;
    this.now = opts.now ?? Date.now;
    this.lastClaimMs = this.now();
  }

  private snapshot(): ServerState {
    const power = heroPower(this.player.gear);
    return {
      gold: this.player.gold,
      shards: this.player.shards,
      gear: this.player.gear.map((g) => ({ ...g })),
      bossLevel: this.player.bossLevel,
      power,
      goldPerSecond: goldPerSecond(power),
      serverTime: this.now() / 1000,
    };
  }

  getState(): Promise<ServerState> {
    return Promise.resolve(this.snapshot());
  }

  claim(): Promise<ClaimResult> {
    const nowMs = this.now();
    const elapsed = Math.max(0, (nowMs - this.lastClaimMs) / 1000);
    this.lastClaimMs = nowMs;
    const gains = computeIdleGains(this.player, elapsed, deriveSeed(this.seed, ++this.claims));
    this.player.gold += gains.gold;
    this.player.shards += gains.shards;
    this.inventory.push(...gains.drops);
    return Promise.resolve({ ...this.snapshot(), drops: gains.drops });
  }
}
