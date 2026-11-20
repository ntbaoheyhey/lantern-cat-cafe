import { CONFIG } from '@taskbar-hero/game-rules/src/config';

/** Explicit demo/guest context only. No session store is loaded to make this decision. */
export function squadEnabled(search: string, guest: boolean): boolean {
  const query = new URLSearchParams(search);
  return guest && (CONFIG.features.squadCombat || query.get('squad') === '1');
}
