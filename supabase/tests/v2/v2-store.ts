import type { PGlite } from "@electric-sql/pglite";
import type { V2Store } from "../../functions/_shared/v2/game.ts";
import { call } from "./helpers.ts";

/** Serialize role switching per connection, while allowing concurrent handlers to race their CAS. */
export function pgliteV2Store(getDb: () => PGlite): V2Store {
  let tail: Promise<unknown> = Promise.resolve();
  const one = <T>(sql: string, params: unknown[]): Promise<T> => {
    const result = tail.then(() => call(getDb(), sql, params));
    tail = result.catch(() => undefined);
    return result as Promise<T>;
  };
  const j = JSON.stringify;
  return {
    snapshot: (p, day) => one(`public.v2_snapshot($1, $2)`, [p, day]),
    chooseClass: (p, cls, wt, starter) => one(`public.v2_choose_class($1, $2, $3, $4::jsonb)`, [p, cls, wt, j(starter)]),
    claim: a => one(`public.v2_claim($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, $9, $10)`,
      [a.playerId, a.expectedLastMicros, a.expectedRev, a.nowIso, j(a.progress), j(a.stackDeltas), j(a.caps), j(a.items), a.bagLimit, a.dailyKeyDay]),
    equip: (p, id, slot, cls, wt, unlocked) => one(`public.v2_equip($1, $2, $3, $4, $5, $6::jsonb)`, [p, id, slot, cls, wt, j(unlocked)]),
    async voucherSign(p, nonce, signature) { await one(`public.game_voucher_sign($1, $2, $3)`, [p, nonce, signature]); },
  };
}
