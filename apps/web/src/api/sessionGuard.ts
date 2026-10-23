import { GameApiError, type GameApi } from './GameApi';

/** Wraps a GameApi so an `unauthenticated` answer (expired or bad JWT) calls `onUnauthenticated` before rejecting. */
export function withSessionGuard(api: GameApi, onUnauthenticated: () => void): GameApi {
  const guard = <T>(p: Promise<T>): Promise<T> =>
    p.catch((e: unknown) => {
      if (e instanceof GameApiError && e.code === 'unauthenticated') onUnauthenticated();
      throw e;
    });
  return {
    getState: () => guard(api.getState()),
    claim: () => guard(api.claim()),
    equip: (gearId) => guard(api.equip(gearId)),
    fightBoss: () => guard(api.fightBoss()),
    upgrade: (gearId) => guard(api.upgrade(gearId)),
    forgeRelic: () => guard(api.forgeRelic()),
    reportMint: (nonce, txHash) => guard(api.reportMint(nonce, txHash)),
  };
}
