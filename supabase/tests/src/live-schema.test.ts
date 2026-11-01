import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { afterAll, beforeAll, expect, it } from "vitest";
import { migratedDb } from "./game-db.ts";

const sql = readFileSync(new URL("../../../docs/proposals/sql/check-live-schema.sql", import.meta.url), "utf8");
const migrations = new URL("../../migrations/", import.meta.url);
let full: PGlite;
let old: PGlite;
beforeAll(async () => {
  full = await migratedDb();
  old = new PGlite();
  await old.exec(readFileSync(new URL("../sql/bootstrap.sql", import.meta.url), "utf8"));
  for (const file of readdirSync(migrations).filter(f => f.endsWith(".sql") && f.slice(0, 14) <= "20261102000000").sort()) {
    await old.exec(readFileSync(new URL(file, migrations), "utf8"));
  }
});
afterAll(async () => { await full?.close(); await old?.close(); });

it("is one catalog-only inventory with no write keywords, even in comments", () => {
  expect(sql).not.toMatch(/\b(?:insert|update|delete|alter|create|drop|grant)\b/i);
  expect(sql.match(/;/g)).toHaveLength(1);
  const relations = [...sql.matchAll(/\b(?:from|join)\s+([\w.]+)/gi)].map(m => m[1]!);
  expect(relations.length).toBeGreaterThan(0);
  expect(relations.every(r => r.startsWith("pg_catalog."))).toBe(true);
});
it("all 17 expected objects are present with all migrations", async () => {
  const { rows } = await full.query<{ object: string; present: boolean }>(sql);
  expect(rows).toHaveLength(17);
  expect(new Set(rows.map(r => r.object)).size).toBe(17);
  expect(rows.filter(r => !r.present)).toEqual([]);
  console.log(`live-schema all migrations: ${rows.length}/${rows.length} true`);
});
it("only the seven newer objects are false through 20261102", async () => {
  const { rows } = await old.query<{ object: string; present: boolean }>(sql);
  expect(rows).toHaveLength(17);
  expect(rows.filter(r => !r.present).map(r => r.object)).toEqual([
    "constraint public.relic_vouchers.relic_vouchers_status_check allows cancelled",
    "function public.game_voucher_cancel_reissue(uuid,bigint,timestamptz)",
    "function public.game_voucher_reissue_resolve(uuid,bigint,uuid,boolean)",
    "function public.v2_cleanup_budgets()",
    "function public.v2_take_budgets(jsonb)",
    "policy public.siwe_nonces.siwe_nonces_server_only",
    "table private.v2_request_budgets",
  ]);
  console.log(`live-schema through 20261102: ${rows.filter(r => r.present).length} true, ${rows.filter(r => !r.present).length} false`);
});
