import { useSyncExternalStore } from 'react';
import { MockGameApiV2 } from '../../api/MockGameApiV2';
import { SupabaseGameApiV2 } from '../../api/SupabaseGameApiV2';
import type { GameApiV2 } from '../../api/GameApiV2';
import { withSessionGuardV2 } from '../../api/sessionGuardV2';
import { getSessionStore } from '../store';
import { ApiSwitchV2, type ApiSwitchV2Options } from './apiSwitchV2';
import type { GameLoopV2 } from './loopV2';

export type ActionNoticeErrorCode = 'rate_limited' | 'server_busy' | 'offline';

export interface ActionNoticeState {
  code: ActionNoticeErrorCode;
  retryAfterS?: number;
  until?: number;
}

let currentNotice: ActionNoticeState | null = null;
const noticeListeners = new Set<() => void>();

export function getActionNoticeState(): ActionNoticeState | null {
  return currentNotice;
}

export function setActionNoticeState(state: ActionNoticeState | null): void {
  currentNotice = state;
  noticeListeners.forEach((fn) => fn());
}

export function subscribeActionNotice(fn: () => void): () => void {
  noticeListeners.add(fn);
  return () => {
    noticeListeners.delete(fn);
  };
}

export function useActionNoticeState(): ActionNoticeState | null {
  return useSyncExternalStore(subscribeActionNotice, getActionNoticeState, () => null);
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (currentNotice?.code === 'offline') {
      setActionNoticeState(null);
    }
  });
  window.addEventListener('offline', () => {
    setActionNoticeState({ code: 'offline' });
  });
}

export function withNoticeGuardV2(api: GameApiV2, onUnauthenticated: () => void): GameApiV2 {
  const base = withSessionGuardV2(api, onUnauthenticated);
  const wrap = <T>(p: Promise<T>): Promise<T> =>
    p.then(
      (res) => {
        if (currentNotice?.code === 'server_busy') {
          setActionNoticeState(null);
        }
        return res;
      },
      (err: unknown) => {
        if (typeof err === 'object' && err !== null && 'code' in err) {
          const code = (err as { code: unknown }).code;
          if (code === 'rate_limited') {
            const retryAfterS = (err as { retryAfterS?: number }).retryAfterS ?? 5;
            setActionNoticeState({
              code: 'rate_limited',
              retryAfterS,
              until: Date.now() + retryAfterS * 1000,
            });
          } else if (code === 'server_busy') {
            setActionNoticeState({ code: 'server_busy' });
          } else if (code === 'offline') {
            setActionNoticeState({ code: 'offline' });
          }
        }
        throw err;
      }
    );
  return {
    getState: () => wrap(base.getState()),
    claim: () => wrap(base.claim()),
    equip: (itemId, slot) => wrap(base.equip(itemId, slot)),
    chooseClass: (classId) => wrap(base.chooseClass(classId)),
    fightBoss: (chapter, reqId) => wrap(base.fightBoss(chapter, reqId)),
    craft: (recipeId, slot, reqId) => wrap(base.craft(recipeId, slot, reqId)),
    salvage: (itemIds) => wrap(base.salvage(itemIds)),
    setLocked: (itemId, locked) => wrap(base.setLocked(itemId, locked)),
    forgeRelic: () => wrap(base.forgeRelic()),
  };
}

export function createStageStoreV2(options: Pick<ApiSwitchV2Options, 'sessions' | 'env'> & Partial<Pick<ApiSwitchV2Options, 'demo' | 'server'>>) {
  const store = new ApiSwitchV2({
    ...options,
    demo: () => withNoticeGuardV2(options.demo ? options.demo() : new MockGameApiV2(), () => {}),
    server: (opts) => withNoticeGuardV2(options.server ? options.server(opts) : new SupabaseGameApiV2(opts), () => {}),
    guard: withNoticeGuardV2,
  });
  store.loop.onEvent((event) => {
    if (event.type === 'refused' && event.code === 'rate_limited') {
      if (!currentNotice || currentNotice.code !== 'rate_limited') {
        setActionNoticeState({ code: 'rate_limited', retryAfterS: 5, until: Date.now() + 5000 });
      }
    } else if (event.type === 'error') {
      if (event.message === 'server_busy' || event.message.includes('503')) {
        setActionNoticeState({ code: 'server_busy' });
      } else if (event.message === 'offline') {
        setActionNoticeState({ code: 'offline' });
      }
    }
  });
  return store;
}
let stageStore: ApiSwitchV2 | null = null;
export function getStageStoreV2() {
  return stageStore ??= createStageStoreV2({ sessions: getSessionStore(), env: { supabaseUrl: import.meta.env.VITE_SUPABASE_URL, anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY } });
}
export const getGameLoopV2 = () => {
  const loop = getStageStoreV2().loop;
  if (import.meta.env.DEV || import.meta.env.MODE === 'g1-perf') {
    (window as unknown as { __g1Loop: GameLoopV2 }).__g1Loop = loop;
  }
  return loop;
};
export function useGameSnapshotV2(loop: GameLoopV2 = getGameLoopV2()) {
  return useSyncExternalStore(loop.subscribe, loop.getSnapshot);
}
export function useGameModeV2() {
  const store = getStageStoreV2();
  return useSyncExternalStore(store.subscribe, store.getMode);
}

/** Sequential, deduplicated equip intents. The running intent stays in the map. */
export function createEquipQueueV2(loop: GameLoopV2) {
  let tail = Promise.resolve(), generation = 0, disposed = false;
  let hadState = loop.getSnapshot().state !== null;
  const intents = new Map<string, Promise<void>>();
  const unsubscribe = loop.subscribe(() => {
    const hasState = loop.getSnapshot().state !== null;
    if (hadState && !hasState) {
      hadState = false;
      generation++; intents.clear(); tail = Promise.resolve(); loop.setEquipQueued(0);
    } else hadState = hasState;
  });
  return {
    equip(itemId: string | null, slot: Parameters<GameLoopV2['equip']>[1]): Promise<void> {
      if (disposed) return Promise.resolve();
      const key = JSON.stringify([slot, itemId]);
      const duplicate = intents.get(key);
      if (duplicate) return duplicate;
      if (loop.getSnapshot().state?.equipped[slot] === itemId) return Promise.resolve();
      const queuedGeneration = generation;
      const next = tail.then(async () => {
        await loop.whenIdle();
        if (disposed || queuedGeneration !== generation) return;
        if (loop.getSnapshot().state?.equipped[slot] === itemId) return;
        await loop.equip(itemId, slot);
      }).finally(() => {
        if (queuedGeneration !== generation || disposed) return;
        intents.delete(key); loop.setEquipQueued(intents.size);
      });
      intents.set(key, next); loop.setEquipQueued(intents.size);
      tail = next.catch(() => {});
      return next;
    },
    dispose() { disposed = true; intents.clear(); loop.setEquipQueued(0); unsubscribe(); },
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
