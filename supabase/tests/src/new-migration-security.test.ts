import type { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, migratedDb } from "./game-db.ts";

let db: PGlite;
beforeAll(async () => { db = await migratedDb(); });
afterAll(async () => { await db.close(); });
const clients = ["anon", "authenticated"] as const;
const migrations = new URL("../../migrations/", import.meta.url);
const files = readdirSync(migrations).filter(f => /^(20261103|20261104|20261106|20261107).*\.sql$/.test(f)).sort();
const sources = files.map(f => readFileSync(new URL(f, migrations), "utf8"));
const functions = [...new Set(sources.flatMap(sql => [...sql.matchAll(/create\s+(?:or\s+replace\s+)?function\s+public\.(\w+)/gi)].map(m => m[1]!)))].sort();
const serverTables = [...new Set(["public.siwe_nonces", ...sources.flatMap(sql =>
  [...sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?((?:public|private)\.\w+)/gi)].map(m => m[1]!))])].sort();
const quote = (s: string) => `"${s.replaceAll('"', '""')}"`;

describe("new migrations retain server-only privileges", () => {
  it("includes all four migrations, including the CXN1 race guard", () => {
    expect(files).toHaveLength(4);
    expect(functions).toContain("game_voucher_reissue_resolve");
  });

  // 20261103 hardens the existing nonce table; 20261104 adds a private budget table.
  // 20261106/07 alter relic_vouchers but add no tables. Its owner-read policy is intentional.
  it.each(serverTables)("%s has RLS and denies every client DML privilege", async table => {
    const [schema, name] = table.split(".");
    const identifier = `${quote(schema!)}.${quote(name!)}`;
    const metadata = await db.query<{ relrowsecurity: boolean }>("select relrowsecurity from pg_class where oid=$1::regclass", [table]);
    expect(metadata.rows).toEqual([{ relrowsecurity: true }]);
    const column = (await db.query<{ attname: string }>("select attname from pg_attribute where attrelid=$1::regclass and attnum > 0 and not attisdropped order by attnum limit 1", [table])).rows[0]!.attname;
    for (const role of clients) {
      for (const privilege of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
        expect((await db.query<{ ok: boolean }>("select has_table_privilege($1,$2,$3) ok", [role, table, privilege])).rows[0]!.ok).toBe(false);
      }
      for (const privilege of ["SELECT", "INSERT", "UPDATE"]) {
        expect((await db.query<{ ok: boolean }>("select has_any_column_privilege($1,$2,$3) ok", [role, table, privilege])).rows[0]!.ok).toBe(false);
      }
      for (const sql of [`select * from ${identifier}`, `insert into ${identifier} default values`,
        `update ${identifier} set ${quote(column)}=${quote(column)}`, `delete from ${identifier}`]) {
        await expect(as(db, role, null, () => db.query(sql))).rejects.toThrow(/permission denied/);
      }
    }
  });

  it.each(functions.filter(name => name !== "game_voucher_json"))("public.%s is denied to both client roles and executes as service_role", async name => {
    const routines = (await db.query<{ oid: number; args: string[] }>(
      `select p.oid, array(select format_type(t, null) from unnest(p.proargtypes::oid[]) t) args
       from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=$1`, [name])).rows;
    expect(routines.length).toBeGreaterThan(0);
    for (const routine of routines) {
      const args = routine.args.map(type => {
        if (type === "jsonb") return name === "v2_take_budgets" ? `'[{"key":"n2:grants","perMinute":1,"burst":1}]'::jsonb` : `'[]'::jsonb`;
        if (type === "uuid") return "'00000000-0000-4000-8000-000000000099'::uuid";
        if (type === "bigint") return "-1::bigint";
        if (type === "text") return "'n2-test'::text";
        if (type === "boolean") return "false";
        if (type === "date") return "'2026-11-01'::date";
        if (type === "timestamp with time zone") return "'2026-11-01T00:00:00Z'::timestamptz";
        if (type === "relic_vouchers") return "null::public.relic_vouchers";
        throw new Error(`Provide safe test arguments for ${name}: ${type}`);
      });
      const query = () => db.query(`select public.${quote(name)}(${args.join(",")})`);
      for (const role of clients) {
        expect((await db.query<{ ok: boolean }>("select has_function_privilege($1,$2::oid,'EXECUTE') ok", [role, routine.oid])).rows[0]!.ok).toBe(false);
        await expect(as(db, role, null, query)).rejects.toThrow(/permission denied/);
      }
      expect((await db.query<{ ok: boolean }>("select has_function_privilege('service_role',$1::oid,'EXECUTE') ok", [routine.oid])).rows[0]!.ok).toBe(true);
      await as(db, "service_role", null, query);
    }
  });

  it("game_voucher_json remains denied to both client roles", async () => {
    for (const role of clients) await expect(as(db, role, null, () => db.query("select public.game_voucher_json(null::public.relic_vouchers)"))).rejects.toThrow(/permission denied/);
  });

  // This is an existing internal helper, not a new RPC: 20260106 explicitly
  // revokes it from service_role. Security-definer RPCs execute it as their owner.
  it("the existing game_voucher_json helper retains its deliberate service_role denial", async () => {
    await expect(as(db, "service_role", null, () => db.query("select public.game_voucher_json(null::public.relic_vouchers)"))).rejects.toThrow(/permission denied/);
  });
});

it("ALL public tables have RLS enabled, with no public-table exceptions", async () => {
  // Deliberately empty. A future exception requires a documented truly public table.
  const allowlist: string[] = [];
  const tables = (await db.query<{ name: string; enabled: boolean }>(
    `select c.relname name, c.relrowsecurity enabled from pg_class c join pg_namespace n on n.oid=c.relnamespace
     where n.nspname='public' and c.relkind in ('r','p') order by c.relname`)).rows;
  expect(tables.length).toBeGreaterThan(0);
  expect(tables.filter(t => !t.enabled && !allowlist.includes(t.name))).toEqual([]);
  expect(allowlist).toEqual([]);
});
