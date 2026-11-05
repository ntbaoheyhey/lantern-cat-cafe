import { CONFIG } from '@taskbar-hero/game-rules';
import { ERROR_CODES_V2 } from '../../api/GameApiV2';
import type {
  BossFightResultV2, ClassId, CraftResultV2, ForgeResultV2, GameApiV2,
  GearSlotId, RecipeId, SalvageResultV2, ServerStateV2,
} from '../../api/GameApiV2';
import { diffProgressEventsV2, type ActionNameV2, type LoopEventV2 } from './events';

export const CLAIM_INTERVAL_MS_V2 = CONFIG.gameplay.claimIntervalMs;

export interface PendingActionV2 {
  action: ActionNameV2;
  slot?: GearSlotId;
  itemId?: string | null;
  recipeId?: RecipeId;
  chapter?: number;
}

export interface GameSnapshotV2 {
  state: ServerStateV2 | null;
  loadFailed: boolean;
  paused: boolean;
  busy: ActionNameV2 | null;
  pending: PendingActionV2 | null;
  /** Accepted bulk equip intents, including the one currently running. */
  queued: number;
  claimInFlight: boolean;
  lastError: string | null;
  lastEvent: LoopEventV2 | null;
  eventSeq: number;
}

export interface GameLoopV2Options {
  api: GameApiV2;
  /** Clock in milliseconds, also used for event timestamps. */
  now?: () => number;
}

function errorCode(error: unknown): unknown {
  return typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Authoritative v2 state, visible-tab claims, and serialized UI actions. */
export class GameLoopV2 {
  private api: GameApiV2;
  private readonly now: () => number;
  private gen = 0;
  private actionEpoch = 0;
  private stateEpoch = 0;
  private doc: Document | null = null;
  private loaded = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private firstClaimTimer: ReturnType<typeof setTimeout> | null = null;
  private claimFlight: Promise<void> | null = null;
  private actionFlight: Promise<unknown> | null = null;
  private readonly listeners = new Set<() => void>();
  private readonly eventListeners = new Set<(event: LoopEventV2) => void>();
  private snap: GameSnapshotV2 = {
    state: null, loadFailed: false, paused: true, busy: null, pending: null, queued: 0, claimInFlight: false, lastError: null, lastEvent: null, eventSeq: 0,
  };

  constructor(opts: GameLoopV2Options) {
    this.api = opts.api;
    this.now = opts.now ?? Date.now;
  }

  readonly subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  readonly getSnapshot = (): GameSnapshotV2 => this.snap;

  onEvent(fn: (event: LoopEventV2) => void): () => void {
    this.eventListeners.add(fn);
    return () => this.eventListeners.delete(fn);
  }

  private publish(patch: Partial<GameSnapshotV2>): void {
    const next = { ...this.snap, ...patch };
    if ((Object.keys(next) as (keyof GameSnapshotV2)[]).every((key) => next[key] === this.snap[key])) return;
    this.snap = next;
    this.listeners.forEach((fn) => fn());
  }

  private emit(event: LoopEventV2): void {
    this.publish({ lastEvent: event, eventSeq: this.snap.eventSeq + 1, ...(event.type === 'error' ? { lastError: event.message } : event.type === 'refused' && event.code === 'server_error' ? { lastError: 'Server request failed.' } : {}) });
    this.eventListeners.forEach((fn) => fn(event));
  }

  private adopt(state: ServerStateV2, gen: number, event?: LoopEventV2): void {
    if (gen !== this.gen || (this.snap.state && state.serverTime < this.snap.state.serverTime)) return;
    this.stateEpoch++;
    const progress = diffProgressEventsV2(this.snap.state, state, event?.at ?? this.now());
    this.publish({ state, loadFailed: false, lastError: null });
    for (const next of [...(event ? [event] : []), ...progress]) {
      if (gen !== this.gen) return;
      this.emit(next);
    }
  }

  async start(doc: Document = document): Promise<void> {
    if (this.doc) return;
    this.doc = doc;
    doc.addEventListener('visibilitychange', this.onVisibility);
    const gen = this.gen;
    await this.load(this.api, gen);
    if (gen !== this.gen) return;
    this.loaded = true;
    this.updateVisibility();
  }

  stop(): void {
    if (this.firstClaimTimer !== null) clearTimeout(this.firstClaimTimer);
    this.firstClaimTimer = null;
    this.gen++;
    this.doc?.removeEventListener('visibilitychange', this.onVisibility);
    this.doc = null;
    this.loaded = false;
    this.claimFlight = null;
    this.actionFlight = null;
    this.pause();
    this.publish({ busy: null, pending: null, queued: 0, claimInFlight: false, lastError: null });
  }

  switchApi(api: GameApiV2): void {
    const doc = this.doc;
    this.stop();
    this.api = api;
    this.publish({ state: null, loadFailed: false, lastEvent: null });
    if (doc) void this.start(doc);
  }

  private pause(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    this.publish({ paused: true });
  }

  private updateVisibility(): void {
    if (!this.loaded || !this.doc || this.doc.visibilityState === 'hidden') {
      this.pause();
      return;
    }
    if (this.timer === null) this.timer = setInterval(() => void this.claimNow(), CLAIM_INTERVAL_MS_V2);
    this.publish({ paused: false });
  }

  private readonly onVisibility = (): void => {
    const wasPaused = this.snap.paused;
    this.updateVisibility();
    if (wasPaused && !this.snap.paused) void this.claimNow();
  };

  /** Wait for an action without reserving the action guard (used by the equip queue). */
  async whenIdle(): Promise<void> {
    const gen = this.gen;
    while (gen === this.gen && this.actionFlight) await this.actionFlight;
  }

  setEquipQueued(queued: number): void { this.publish({ queued }); }

  private async readState(api: GameApiV2, gen: number, duringAction = false): Promise<ServerStateV2 | null> {
    while (gen === this.gen) {
      if (!duringAction && this.actionFlight) await this.whenIdle();
      if (gen !== this.gen) return null;
      const actionEpoch = this.actionEpoch, stateEpoch = this.stateEpoch;
      const state = await api.getState();
      if (gen !== this.gen) return null;
      if (actionEpoch === this.actionEpoch && stateEpoch === this.stateEpoch) return state;
    }
    return null;
  }

  private async load(api: GameApiV2, gen: number, duringAction = false, reportError = true): Promise<void> {
    try {
      const state = await this.readState(api, gen, duringAction);
      if (state && gen === this.gen) this.adopt(state, gen);
    } catch (error) {
      if (gen !== this.gen) return;
      this.publish({ loadFailed: this.snap.state === null });
      if (reportError) this.emit({ type: 'error', action: 'load', message: message(error), at: this.now() });
      else this.publish({ lastError: message(error) });
    }
  }

  retry(): Promise<void> {
    return this.load(this.api, this.gen);
  }

  claimNow(): Promise<void> {
    if (this.claimFlight) return this.claimFlight;
    const gen = this.gen;
    const api = this.api;
    this.publish({ claimInFlight: true });
    const flight = Promise.resolve().then(async () => {
      // A timer may fire during an action; wait for its authoritative result first.
      while (gen === this.gen && this.snap.busy !== null && this.actionFlight) {
        await this.actionFlight;
      }
      if (gen !== this.gen || !this.snap.state?.cat.classId || this.doc?.visibilityState === 'hidden') return;
      try {
        const actionEpoch = this.actionEpoch, stateEpoch = this.stateEpoch;
        const result = await api.claim();
        if (gen !== this.gen) return;
        const gains = result.gains;
        const gained = [gains.xp, gains.levelsGained, gains.fish, gains.yarn, gains.keys,
          ...Object.values(gains.materials)].some((n) => n > 0) || gains.items.length > 0 || gains.autoSalvaged.length > 0;
        // An action (or another authoritative read) overtook this claim. Preserve its
        // credited gains once, but read state after the action before showing anything.
        const state = actionEpoch !== this.actionEpoch || stateEpoch !== this.stateEpoch
          ? await this.readState(api, gen) : result.state;
        if (state && gen === this.gen) this.adopt(state, gen, gained ? { type: 'claimed', gains, at: this.now() } : undefined);
      } catch (error) {
        if (gen !== this.gen) return;
        const code = errorCode(error);
        if (code === 'no_class') return;
        if (code === 'stale') await this.load(api, gen);
        else this.emit({ type: 'error', action: 'claim', message: message(error), at: this.now() });
      }
    }).finally(() => {
      if (this.claimFlight === flight) {
        this.claimFlight = null;
        this.publish({ claimInFlight: false });
      }
    });
    this.claimFlight = flight;
    return flight;
  }

  private action<T extends ServerStateV2 | { state: ServerStateV2 }>(
    action: ActionNameV2, call: (api: GameApiV2) => Promise<T>,
    event?: (result: T, at: number) => LoopEventV2,
    detail?: Omit<PendingActionV2, 'action'>,
  ): Promise<T | null> {
    if (this.snap.busy !== null) {
      this.emit({ type: 'refused', action, code: 'busy', at: this.now() });
      return Promise.resolve(null);
    }
    const gen = this.gen;
    const api = this.api;
    this.actionEpoch++;
    this.publish({ busy: action, pending: { action, ...detail } });
    const flight = Promise.resolve().then(async () => {
      if (gen !== this.gen) return null;
      try {
        const result = await call(api);
        if (gen !== this.gen) return null;
        this.adopt('state' in result ? result.state : result, gen, event?.(result, this.now()));
        return result;
      } catch (error) {
        if (gen !== this.gen) return null;
        const code = errorCode(error);
        if (typeof code === 'string' && ERROR_CODES_V2.some((known) => known === code)) {
          this.emit({ type: 'refused', action, code, at: this.now() });
          if (code === 'stale' && gen === this.gen) await this.load(api, gen, true, false);
        } else this.emit({ type: 'error', action, message: message(error), at: this.now() });
        return null;
      } finally {
        if (gen === this.gen) {
          this.actionFlight = null;
          this.publish({ busy: null, pending: null });
        }
      }
    });
    this.actionFlight = flight;
    return flight;
  }

  async chooseClass(classId: ClassId): Promise<void> {
    const first = this.snap.state?.cat.classId === null;
    const result = await this.action('chooseClass', (api) => api.chooseClass(classId));
    if (first && result && this.doc && this.firstClaimTimer === null) {
      // Anchor the regular cadence after the first claim. An independent timer
      // could otherwise request again inside the server's ten-second minimum.
      if (this.timer !== null) clearInterval(this.timer);
      this.timer = null;
      this.firstClaimTimer = setTimeout(() => {
        this.firstClaimTimer = null;
        this.updateVisibility();
        void this.claimNow();
      }, CONFIG.gameplay.firstClaimMs);
    }
  }

  async equip(itemId: string | null, slot: GearSlotId): Promise<void> {
    await this.action('equip', (api) => api.equip(itemId, slot), undefined, { itemId, slot });
  }

  fightBoss(chapter: number): Promise<BossFightResultV2 | null> {
    return this.action('fightBoss', (api) => api.fightBoss(chapter), (result, at) => ({ type: 'bossFight', result, at }), { chapter });
  }

  craft(recipeId: RecipeId, slot: GearSlotId): Promise<CraftResultV2 | null> {
    return this.action('craft', (api) => api.craft(recipeId, slot), (result, at) => ({ type: 'crafted', result, at }), { recipeId, slot });
  }

  salvage(itemIds: string[]): Promise<SalvageResultV2 | null> {
    return this.action('salvage', (api) => api.salvage(itemIds), (result, at) => ({ type: 'salvaged', result, at }));
  }

  async setLocked(itemId: string, locked: boolean): Promise<void> {
    await this.action('setLocked', (api) => api.setLocked(itemId, locked));
  }

  forgeRelic(): Promise<ForgeResultV2 | null> {
    return this.action('forgeRelic', (api) => api.forgeRelic(), (result, at) => ({ type: 'forged', result, at }));
  }
}
