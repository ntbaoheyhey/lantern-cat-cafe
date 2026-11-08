import type { MaterialId } from '../content/materials';

export type ForgeStackId = MaterialId | 'fish';

/** Balances are read only; the caller applies spending and records the successful Relic day. */
export interface ForgeState {
  stacks: Partial<Record<ForgeStackId, number>>;
  /** Game-day index, as returned by dayIndex; -1 means no previous Relic. */
  lastRelicDay: number;
}

export * from './craft';
export * from './salvage';
export * from './relic';
