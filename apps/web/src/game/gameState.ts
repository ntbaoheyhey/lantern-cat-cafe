import { computeIdleGains, type Gear } from '@taskbar-hero/game-rules';
import type { ClaimResult, GameApi, ServerState } from '../api/GameApi';

export const CLAIM_INTERVAL_MS = 30_000;
const TICK_MS = 250;
const PREDICTION_SEED = 1;

/** What the last server answer said, plus time predicted since then. */
export interface Prediction {
  baseGold: number;
  baseShards: number;
  gear: Gear[];
  power: number;
  goldPerSecond: number;
  /** Seconds of play since the baseline. */
  elapsed: number;
}

export interface GameSnapshot {
  gold: number;
  shards: number;
  power: number;
  goldPerSecond: number;
  paused: boolean;
}

export const EMPTY_PREDICTION: Prediction = {
  baseGold: 0, baseShards: 0, gear: [], power: 0, goldPerSecond: 0, elapsed: 0,
};

/** The server wins: drop the prediction, adopt its numbers, restart the baseline. */
export function reconcile(_predicted: Prediction, server: ServerState): Prediction {
  return {
    baseGold: server.gold,
    baseShards: server.shards,
    gear: server.gear,
    power: server.power,
    goldPerSecond: server.goldPerSecond,
    elapsed: 0,
  };
}

export function predict(p: Prediction): { gold: number; shards: number } {
  const gains = computeIdleGains({ gear: p.gear, bossLevel: 1 }, p.elapsed, PREDICTION_SEED);
  return { gold: p.baseGold + gains.gold, shards: p.baseShards + gains.shards };
}

export interface GameLoopOptions {
  api: GameApi;
  /** Clock in milliseconds. */
  now?: () => number;
}

/** Predicts gold/shards between claims; claims every 30 s while the tab is visible. */
export class GameLoop {
  private prediction = EMPTY_PREDICTION;
  private lastTick = 0;
  private running = false;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private claimTimer: ReturnType<typeof setInterval> | null = null;
  private doc: Document | null = null;
  private listeners = new Set<() => void>();
  private snap: GameSnapshot = this.compute();
  private readonly api: GameApi;
  private readonly now: () => number;

  constructor(opts: GameLoopOptions) {
    this.api = opts.api;
    this.now = opts.now ?? Date.now;
  }

  readonly subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  readonly getSnapshot = (): GameSnapshot => this.snap;

  private compute(): GameSnapshot {
    const { gold, shards } = predict(this.prediction);
    return {
      gold: Math.floor(gold),
      shards,
      power: this.prediction.power,
      goldPerSecond: this.prediction.goldPerSecond,
      paused: !this.running,
    };
  }

  private publish(): void {
    const next = this.compute();
    const s = this.snap;
    if (
      next.gold === s.gold && next.shards === s.shards && next.power === s.power &&
      next.goldPerSecond === s.goldPerSecond && next.paused === s.paused
    ) return;
    this.snap = next;
    this.listeners.forEach((fn) => fn());
  }

  private advance(): void {
    const t = this.now();
    if (this.running) this.prediction = { ...this.prediction, elapsed: this.prediction.elapsed + Math.max(0, t - this.lastTick) / 1000 };
    this.lastTick = t;
  }

  /** Begin predicting and claiming; follows `doc.visibilityState`. */
  async start(doc: Document = document): Promise<void> {
    if (this.doc) return;
    this.doc = doc;
    doc.addEventListener('visibilitychange', this.onVisibility);
    try {
      this.prediction = reconcile(this.prediction, await this.api.getState());
    } catch {
      /* keep zeros; the next claim will fill in */
    }
    if (this.doc !== doc) return; // stopped meanwhile
    if (doc.visibilityState === 'hidden') this.publish();
    else this.resume();
  }

  stop(): void {
    this.pause();
    this.doc?.removeEventListener('visibilitychange', this.onVisibility);
    this.doc = null;
  }

  private readonly onVisibility = (): void => {
    if (this.doc?.visibilityState === 'hidden') this.pause();
    else {
      this.resume();
      void this.claim(); // the server counted the time we were away
    }
  };

  private resume(): void {
    if (this.running) return;
    this.running = true;
    this.lastTick = this.now();
    this.tickTimer = setInterval(() => { this.advance(); this.publish(); }, TICK_MS);
    this.claimTimer = setInterval(() => void this.claim(), CLAIM_INTERVAL_MS);
    this.publish();
  }

  private pause(): void {
    if (!this.running) return;
    this.advance();
    this.running = false;
    if (this.tickTimer) clearInterval(this.tickTimer);
    if (this.claimTimer) clearInterval(this.claimTimer);
    this.tickTimer = this.claimTimer = null;
    this.publish();
  }

  /** Claim now and replace the prediction with the server's numbers. */
  async claim(): Promise<ClaimResult | null> {
    try {
      const result = await this.api.claim();
      this.advance();
      this.prediction = reconcile(this.prediction, result);
      this.publish();
      return result;
    } catch {
      return null; // keep predicting; retry on the next interval
    }
  }
}
