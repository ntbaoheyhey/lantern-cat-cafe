import { useSyncExternalStore } from 'react';
import type { GameApi } from '../api/GameApi';
import { MockGameApi } from '../api/MockGameApi';
import { demoInventory } from '../inventory/demoItems';
import { GameLoop, type GameSnapshot } from './gameState';

let api: GameApi | null = null;
let loop: GameLoop | null = null;

/** App-wide API. B3 swaps MockGameApi for the real API here. */
export function getGameApi(): GameApi {
  return (api ??= new MockGameApi({ inventory: demoInventory() }));
}

/** App-wide loop. */
export function getGameLoop(): GameLoop {
  return (loop ??= new GameLoop({ api: getGameApi() }));
}

export function useGameSnapshot(l: GameLoop = getGameLoop()): GameSnapshot {
  return useSyncExternalStore(l.subscribe, l.getSnapshot);
}
