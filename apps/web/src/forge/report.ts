import { GameApiError, type GameApi } from '../api/GameApi';
import type { GameLoop } from '../game/gameState';
import { clearUnreported, type UnreportedMint } from './mintStore';

export type ReportOutcome = 'ok' | 'retry' | 'gone';

/**
 * Tell the server about a mint tx. Clears the stored hash once the server confirms it, or when the
 * server does not know the nonce; keeps it for a later retry on anything else (not confirmed yet,
 * offline, signed out).
 */
export async function reportMint(api: GameApi, loop: GameLoop, m: UnreportedMint): Promise<ReportOutcome> {
  try {
    loop.adopt(await api.reportMint(m.nonce, m.hash));
    clearUnreported();
    return 'ok';
  } catch (e) {
    if (e instanceof GameApiError && e.code === 'not_found') {
      clearUnreported();
      return 'gone';
    }
    return 'retry';
  }
}
