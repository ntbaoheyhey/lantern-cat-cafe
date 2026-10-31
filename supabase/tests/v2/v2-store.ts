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
    actionResult: (p, route, requestId, intent) => one(`public.v2_action_result($1, $2, $3, $4::jsonb)`, [p, route, requestId, j(intent)]),
    snapshot: (p, day) => one(`public.v2_snapshot($1, $2)`, [p, day]),
    chooseClass: (p, cls, wt, starter) => one(`public.v2_choose_class($1, $2, $3, $4::jsonb)`, [p, cls, wt, j(starter)]),
    claim: a => one(`public.v2_claim($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, $9, $10)`,
      [a.playerId, a.expectedLastMicros, a.expectedRev, a.nowIso, j(a.progress), j(a.stackDeltas), j(a.caps), j(a.items), a.bagLimit, a.dailyKeyDay]),
    bossFight: a => a.requestId ? one(`public.v2_boss_fight_once($1, $2, $3::jsonb, $4::jsonb, $5::jsonb)`,
      [a.playerId, a.requestId, j(a.intent), j({ chapter: a.chapter, expectedRev: a.expectedRev, won: a.won, fightNo: a.fightNo,
        keyCost: a.keyCost, cooldownS: a.cooldownS, chest: a.chest, bagLimit: a.bagLimit, caps: a.caps, bossRound: a.bossRound }), j(a.timeline)]) : one(`public.v2_boss_fight($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10::jsonb, $11)`,
      [a.playerId, a.chapter, a.expectedRev, a.won, a.fightNo, a.keyCost, a.cooldownS, j(a.chest), a.bagLimit, j(a.caps), a.bossRound]),
    equip: (p, id, slot, cls, wt, unlocked) => one(`public.v2_equip($1, $2, $3, $4, $5, $6::jsonb)`, [p, id, slot, cls, wt, j(unlocked)]),
    craft: (p, cost, item, bag, requestId, intent) => requestId
      ? one(`public.v2_craft_once($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6)`, [p, requestId, j(intent), j(cost), j(item), bag])
      : one(`public.v2_craft($1, $2::jsonb, $3::jsonb, $4)`, [p, j(cost), j(item), bag]),
    salvage: (p, ids, gains, caps) => one(`public.v2_salvage($1, $2::uuid[], $3::jsonb, $4::jsonb)`, [p, ids, j(gains), j(caps)]),
    lock: (p, id, locked) => one(`public.v2_lock($1, $2, $3)`, [p, id, locked]),
    relicForge: a => one(`public.v2_relic_forge($1, $2, $3, $4, $5, $6, $7)`, [a.playerId, a.day, a.relicId, a.rarity, a.yarnCost, a.pearlCost, a.expiresAt]),
    voucherReissue: (p, nonce, now, expires) => one(`public.game_voucher_reissue($1, $2, $3, $4)`, [p, nonce, now, expires]),
    voucherResolveReissue: (p, nonce, token, used) => one(`public.game_voucher_reissue_resolve($1, $2, $3, $4)`, [p, nonce, token, used]),
    async voucherMinted(p, nonce, hash) { await one(`public.game_voucher_minted($1, $2, $3)`, [p, nonce, hash]); },
    voucherCancelReissue: (p, nonce, expires) => one(`public.game_voucher_cancel_reissue($1, $2, $3)`, [p, nonce, expires]),
    voucherSign: (p, nonce, signature) => one(`public.game_voucher_sign($1, $2, $3)`, [p, nonce, signature]),
  };
}
