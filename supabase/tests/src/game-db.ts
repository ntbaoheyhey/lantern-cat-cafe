import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { GameStore } from "../../functions/_shared/game.ts";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "../../migrations");

export type Role = "anon" | "authenticated" | "service_role";

/** PGlite with the Supabase stubs and every migration applied. */
export async function migratedDb(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(readFileSync(join(here, "../sql/bootstrap.sql"), "utf8"));
  for (const f of readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(join(migrationsDir, f), "utf8"));
  }
  return db;
}

/** Run statements as a role with the given JWT claims, always resetting afterwards. */
export async function as<T>(db: PGlite, role: Role, claims: object | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${role}`);
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [claims ? JSON.stringify(claims) : ""]);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
    await db.exec("reset request.jwt.claims");
  }
}

/**
 * GameStore over PGlite, calling the SQL functions as service_role like the Edge Functions do.
 * Takes a getter so tests can build it before beforeAll creates the database.
 */
export function pgliteStore(getDb: () => PGlite): GameStore {
  const one = <T>(sql: string, params: unknown[]) => {
    const db = getDb();
    return as(db, "service_role", null, async () => (await db.query<{ r: T }>(sql, params)).rows[0]!.r);
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
    voucher: (p, nonce) => one(`select public.game_voucher($1, $2) r`, [p, nonce]),
    voucherMinted: (p, nonce, tx) => one(`select public.game_voucher_minted($1, $2, $3) r`, [p, nonce, tx]),
  };
}
