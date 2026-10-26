import { useSyncExternalStore } from 'react';
import { MockGameApiV2 } from '../../api/MockGameApiV2';
import { SupabaseGameApiV2 } from '../../api/SupabaseGameApiV2';
import { withSessionGuardV2 } from '../../api/sessionGuardV2';
import { getSessionStore } from '../store';
import { ApiSwitchV2, type ApiSwitchV2Options } from './apiSwitchV2';
import type { GameLoopV2 } from './loopV2';

export function createStageStoreV2(options: Pick<ApiSwitchV2Options, 'sessions' | 'env'> & Partial<Pick<ApiSwitchV2Options, 'demo' | 'server'>>) {
  return new ApiSwitchV2({ ...options, demo: options.demo ?? (() => new MockGameApiV2()),
    server: options.server ?? (opts => new SupabaseGameApiV2(opts)), guard: withSessionGuardV2 });
}
let stageStore: ApiSwitchV2 | null = null;
export function getStageStoreV2() {
  return stageStore ??= createStageStoreV2({ sessions: getSessionStore(), env: { supabaseUrl: import.meta.env.VITE_SUPABASE_URL, anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY } });
}
export const getGameLoopV2 = () => getStageStoreV2().loop;
export function useGameSnapshotV2(loop: GameLoopV2 = getGameLoopV2()) {
  return useSyncExternalStore(loop.subscribe, loop.getSnapshot);
}
export function useGameModeV2() {
  const store = getStageStoreV2();
  return useSyncExternalStore(store.subscribe, store.getMode);
}

/** Serialize a bag's bulk equip callbacks without changing the loop's busy guard. */
export function createEquipQueueV2(loop: GameLoopV2) {
  let tail = Promise.resolve();
  let generation = 0;
  let disposed = false;
  const unsubscribe = loop.subscribe(() => {
    if (loop.getSnapshot().state === null) generation++;
  });
  return {
    equip(itemId: string | null, slot: Parameters<GameLoopV2['equip']>[1]): Promise<void> {
      const queuedGeneration = generation;
      const next = tail.then(async () => {
        if (!disposed && queuedGeneration === generation) await loop.equip(itemId, slot);
      });
      // A rejected caller still receives its error; later independent requests can recover.
      tail = next.catch(() => {});
      return next;
    },
    dispose() { disposed = true; unsubscribe(); },
  };
}

export interface RelicWalletV2 {
  connected: boolean;
  /** Hand off to the existing wallet mint UI; this store never submits a transaction. */
  mint(voucher: import('@taskbar-hero/api-contract').RelicVoucher): void | Promise<void>;
}
type RelicLoopV2 = Pick<GameLoopV2, 'getSnapshot' | 'forgeRelic' | 'retry'>;
const relicFlights = new WeakMap<RelicLoopV2, Promise<string | null>>();
const relicBlockMessage = (reason: string) => ({
  not_enough_yarn: 'Not enough Yarn to forge a Relic.',
  no_moon_pearl: 'A Moon Pearl is needed to forge a Relic.',
  daily_limit: 'The Relic daily limit is shared across classic and v2.',
} as Record<string, string>)[reason] ?? 'Could not forge a Relic. Try again.';
/** One serialized forge -> voucher handoff. Returns one user-facing message on refusal/error. */
export function forgeRelicForWalletV2(loop: RelicLoopV2, wallet: RelicWalletV2): Promise<string | null> {
  if (!wallet.connected) return Promise.resolve('Connect your wallet before forging a Relic.');
  const pending = relicFlights.get(loop);
  if (pending) return pending;
  const flight = (async () => {
    const state = loop.getSnapshot().state;
    if (!state) return 'Load your cat before forging a Relic.';
    if (state.forge.blockedBy) return relicBlockMessage(state.forge.blockedBy);
    const result = await loop.forgeRelic();
    if (!result) {
      await loop.retry();
      const snapshot = loop.getSnapshot(), reason = snapshot.state?.forge.blockedBy;
      if (reason) return relicBlockMessage(reason);
      return snapshot.lastEvent?.type === 'error' ? snapshot.lastEvent.message : 'Could not forge a Relic. Try again.';
    }
    await wallet.mint(result.voucher);
    return null;
  })().catch((error: unknown) => error instanceof Error ? error.message : 'Could not open Relic minting. Try again.').finally(() => relicFlights.delete(loop));
  relicFlights.set(loop, flight);
  return flight;
}
