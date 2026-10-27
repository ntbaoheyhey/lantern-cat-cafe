import { useSyncExternalStore } from 'react';
import { deriveSyncStatusV2 } from './syncStatus';
import { getGameLoopV2 } from './storeV2';
import type { GameLoopV2 } from './loopV2';

const subscribe = (onChange: () => void) => {
  document.addEventListener('visibilitychange', onChange);
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    document.removeEventListener('visibilitychange', onChange);
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
};
const browserStatus = () => `${document.visibilityState}:${navigator.onLine}`;
const serverStatus = () => 'visible:true';

export function useSyncStatusV2(loop: GameLoopV2 = getGameLoopV2()) {
  const browser = useSyncExternalStore(subscribe, browserStatus, serverStatus);
  const snapshot = useSyncExternalStore(loop.subscribe, loop.getSnapshot, loop.getSnapshot);
  return deriveSyncStatusV2({ visibility: browser.startsWith('hidden:') ? 'hidden' : 'visible',
    online: browser.endsWith(':true'), claimInFlight: snapshot.claimInFlight, lastError: snapshot.lastError });
}
