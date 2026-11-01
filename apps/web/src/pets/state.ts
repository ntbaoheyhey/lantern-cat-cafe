import * as petsRules from '@taskbar-hero/game-rules/src/v2/meta/pets';
import type { GameLoopV2 } from '../game/v2/loopV2';
import { claimedKills } from '../game/stage/progress';

/** DEMO_PREVIEW: browser-local companion progress; never sent to any API. */
export const PETS_STORAGE_KEY = 'taskbar-hero.pets.DEMO_PREVIEW.v1';
export const PETS_LEGACY_STORAGE_KEY = 'taskbar-hero.pets.DEMO_PREVIEW.v0';
const VERSION = 1; // Storage format version, not a game number.
export interface PetsState {
  readonly version: typeof VERSION;
  readonly killCounts: petsRules.PetKillCounts;
  readonly equipped: readonly string[];
}
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
const empty = (): PetsState => Object.freeze({ version: VERSION, killCounts: Object.freeze({}), equipped: Object.freeze([]) });
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const count = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

/** v0 was {version: 0, kills: number, equipped: string[]}; no rewards migrate. */
export function parsePetsState(raw: string | null): PetsState {
  if (raw === null) return empty();
  try {
    const data: unknown = JSON.parse(raw);
    if (!record(data) || !Array.isArray(data.equipped) || !data.equipped.every(id => typeof id === 'string')) return empty();
    let killCounts: Record<string, number>;
    if (data.version === 0 && count(data.kills)) {
      killCounts = { [petsRules.PET_KILL_TARGET]: data.kills };
    } else if (data.version === VERSION && record(data.killCounts) && Object.values(data.killCounts).every(count)) {
      // Only the target actually observed by this client is supported.
      killCounts = Object.hasOwn(data.killCounts, petsRules.PET_KILL_TARGET)
        ? { [petsRules.PET_KILL_TARGET]: data.killCounts[petsRules.PET_KILL_TARGET] as number } : {};
    } else return empty();
    let equipped: readonly string[] = [];
    for (const id of data.equipped) {
      const result = petsRules.equipPet(equipped, id, killCounts);
      if (result.ok) equipped = result.equipped;
    }
    return Object.freeze({ version: VERSION, killCounts: Object.freeze(killCounts), equipped: Object.freeze(equipped) });
  } catch { return empty(); }
}

function browserStorage(): StoragePort | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; }
}

export class PetsStore {
  private state: PetsState;
  private readonly listeners = new Set<() => void>();
  constructor(private readonly storage: StoragePort | null = browserStorage()) {
    let raw: string | null = null;
    try { raw = storage?.getItem(PETS_STORAGE_KEY) ?? storage?.getItem(PETS_LEGACY_STORAGE_KEY) ?? null; } catch { /* memory-only */ }
    this.state = parsePetsState(raw);
    // Persist migration in the current key; preserve the legacy key for recovery.
    this.persist();
  }
  readonly getSnapshot = (): PetsState => this.state;
  readonly subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  };
  private persist(): void {
    try { this.storage?.setItem(PETS_STORAGE_KEY, JSON.stringify(this.state)); } catch { /* memory-only */ }
  }
  private publish(state: PetsState): void {
    this.state = Object.freeze(state);
    this.persist();
    this.listeners.forEach(fn => fn());
  }
  /** DEMO_PREVIEW count delta, sourced only by the read-only claim adapter below. */
  recordClaimedKills(delta: number): void {
    if (!count(delta) || delta === 0) return;
    const old = this.state.killCounts[petsRules.PET_KILL_TARGET] ?? 0;
    const next = Math.min(Number.MAX_SAFE_INTEGER, old + delta);
    this.publish({ ...this.state, killCounts: Object.freeze({ [petsRules.PET_KILL_TARGET]: next }) });
  }
  equip(id: string): petsRules.PetEquipResult {
    const result = petsRules.equipPet(this.state.equipped, id, this.state.killCounts);
    if (result.ok) this.publish({ ...this.state, equipped: result.equipped });
    return result;
  }
  unequip(id: string): void {
    if (this.state.equipped.includes(id)) this.publish({ ...this.state, equipped: Object.freeze(this.state.equipped.filter(pet => pet !== id)) });
  }
}

let pets: PetsStore | undefined;
export const getPetsStore = (): PetsStore => pets ??= new PetsStore();
type ClaimSource = Pick<GameLoopV2, 'getSnapshot' | 'subscribe' | 'onEvent'>;
const bindings = new WeakMap<ClaimSource, () => void>();

/**
 * Single kill-counter read boundary: existing progress snapshots + claimed event.
 * No history backfill, inferred species, animation kills or boss rewards. The
 * existing claimedKills helper deliberately ignores chapter changes and resets.
 * This observer has no API methods and never mutates the game snapshot.
 */
export function bindPetsToLoop(loop: ClaimSource, store: PetsStore = getPetsStore()): () => void {
  const bound = bindings.get(loop);
  if (bound) return bound;
  let previous = loop.getSnapshot().state;
  let pending = 0;
  const unsubscribe = loop.subscribe(() => {
    const next = loop.getSnapshot().state;
    if (next === previous) return;
    pending = next ? claimedKills(previous, next) : 0;
    previous = next;
  });
  const offEvent = loop.onEvent(event => {
    if (event.type === 'claimed') store.recordClaimedKills(pending);
    pending = 0;
  });
  const dispose = () => { unsubscribe(); offEvent(); bindings.delete(loop); };
  bindings.set(loop, dispose);
  return dispose;
}
