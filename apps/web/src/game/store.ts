import { useSyncExternalStore } from 'react';
import type { GameApi } from '../api/GameApi';
import { MockGameApi } from '../api/MockGameApi';
import { demoInventory } from '../inventory/demoItems';
import { createSessionStore, type SessionStore } from '../wallet/session';
import { ApiSwitch, type GameMode } from './apiSwitch';
import type { GameLoop, GameSnapshot } from './gameState';

let sessions: SessionStore | null = null;
let apiSwitch: ApiSwitch | null = null;

/** App-wide wallet session, shared by WalletProvider and the game. */
export function getSessionStore(): SessionStore {
  return (sessions ??= createSessionStore());
}

function getSwitch(): ApiSwitch {
  return (apiSwitch ??= new ApiSwitch({
    sessions: getSessionStore(),
    env: { supabaseUrl: import.meta.env.VITE_SUPABASE_URL, anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY },
    demo: () => new MockGameApi({ inventory: demoInventory() }),
  }));
}

/** App-wide API: the server when signed in, the demo mock otherwise. Changes on sign-in/out. */
export function getGameApi(): GameApi {
  return getSwitch().api;
}

/** App-wide loop. */
export function getGameLoop(): GameLoop {
  return getSwitch().loop;
}

export function useGameSnapshot(l: GameLoop = getGameLoop()): GameSnapshot {
  return useSyncExternalStore(l.subscribe, l.getSnapshot);
}

export function useGameMode(): GameMode {
  const s = getSwitch();
  return useSyncExternalStore(s.subscribe, s.getMode);
}
