import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { inject } from "vitest";
import type { GameStore } from "../../functions/_shared/game.ts";

import { as, buildMigratedDb } from "./standalone-db.ts";
export { as, buildMigratedDb, type Role } from "./standalone-db.ts";

/**
 * PGlite with the Supabase stubs and every migration applied. Starts from the template that
 * global-setup.ts dumped once per run, or migrates from scratch if there is none.
 */
export async function migratedDb(): Promise<PGlite> {
  let template: string | undefined;
  try {
    template = inject("pgliteTemplate");
  } catch {
    // Not running under vitest's global setup.
  }
  if (!template) return buildMigratedDb();
  const db = new PGlite({ loadDataDir: new Blob([readFileSync(template)]) });
  await db.waitReady;
  return db;
}

/**
 * GameStore over PGlite, calling the SQL functions as service_role like the Edge Functions do.
 * Takes a getter so tests can build it before beforeAll creates the database.
 */
export function pgliteStore(getDb: () => PGlite): GameStore {
  let tail: Promise<unknown> = Promise.resolve();
  const one = <T>(sql: string, params: unknown[]): Promise<T> => {
    const result = tail.then(() => {
      const db = getDb();
      return as(db, "service_role", null, async () => (await db.query<{ r: T }>(sql, params)).rows[0]!.r);
    });
    tail = result.catch(() => undefined);
    return result;
  };
  return {
    snapshot: (p, day, starter) => one(`select public.game_snapshot($1, $2, $3::jsonb) r`, [p, day, JSON.stringify(starter)]),
    claim: (a) =>
      one(`select public.game_claim($1, $2, $3, $4, $5, $6::jsonb) r`, [
        a.playerId,
        a.expectedLastMicros,
        a.now,
        a.gold,
        a.shards,
        JSON.stringify(a.drops),
      ]),
    equip: (p, g) => one(`select public.game_equip($1, $2) r`, [p, g]),
    upgrade: (a) =>
      one(`select public.game_upgrade($1, $2, $3, $4, $5, $6) r`, [a.playerId, a.gearId, a.expectedLevel, a.cost, a.maxLevel, a.power]),
    bossFight: (a) =>
      one(`select public.game_boss_fight($1, $2, $3, $4, $5, $6) r`, [a.playerId, a.day, a.bossLevel, a.won, a.maxAttempts, a.maxLevel]),
    forge: (a) =>
      one(`select public.game_forge($1, $2, $3, $4, $5, $6, $7) r`, [
        a.playerId,
        a.day,
        a.relicId,
        a.rarity,
        a.shardCost,
        a.keyCost,
        a.expiresAt,
      ]),
    voucherSign: (p, nonce, sig) => one(`select public.game_voucher_sign($1, $2, $3) r`, [p, nonce, sig]),
    voucherReissue: (p, nonce, now, exp) => one(`select public.game_voucher_reissue($1, $2, $3, $4) r`, [p, nonce, now, exp]),
    voucherResolveReissue: (p, nonce, token, used) => one(`select public.game_voucher_reissue_resolve($1, $2, $3, $4) r`, [p, nonce, token, used]),
    voucherCancelReissue: (p, nonce, exp) => one(`select public.game_voucher_cancel_reissue($1, $2, $3) r`, [p, nonce, exp]),
    voucher: (p, nonce) => one(`select public.game_voucher($1, $2) r`, [p, nonce]),
    voucherMinted: (p, nonce, tx) => one(`select public.game_voucher_minted($1, $2, $3) r`, [p, nonce, tx]),
  };
}

declare module "vitest" {
  export interface ProvidedContext {
    /** Path of the migrated data-directory dump made by global-setup.ts. */
    pgliteTemplate: string;
  }
}
