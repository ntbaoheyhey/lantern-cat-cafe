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
