import { useSyncExternalStore } from 'react';
import { MockGameApi } from '../api/MockGameApi';
import { GameLoop, type GameSnapshot } from './gameState';

let loop: GameLoop | null = null;

/** App-wide loop. B3 swaps MockGameApi for the real API here. */
export function getGameLoop(): GameLoop {
  return (loop ??= new GameLoop({ api: new MockGameApi() }));
}

export function useGameSnapshot(): GameSnapshot {
  const l = getGameLoop();
  return useSyncExternalStore(l.subscribe, l.getSnapshot);
}
