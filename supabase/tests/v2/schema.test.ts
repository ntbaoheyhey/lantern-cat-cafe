import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { as, migratedDb } from "../src/game-db.ts";
import { newPlayer, fn, rollbackSql, setStacks, v1OnlyDb, v2MigrationSql } from "./helpers.ts";

const TABLES = ["cat_state", "items", "player_stacks", "boss_clears", "boss_fights", "founder_grants"];
const INTEGRITY_FUNCS = ["v2_action_result", "v2_craft_once", "v2_boss_fight_once"];
const BUDGET_FUNCS = ["v2_take_budgets", "v2_cleanup_budgets"];
const API_FUNCS = ["v2_snapshot", "v2_choose_class", "v2_claim", "v2_equip", "v2_boss_fight", "v2_craft", "v2_salvage", "v2_lock", "v2_relic_forge", "v2_grant_founder"];
const HELPERS = ["v2_equipment_revision","v2_apply_stacks", "v2_insert_items", "v2_items_json", "v2_item_json"];
const DENIED = /permission denied|row-level security/;
const jwt = (sub: string) => ({ sub, role: "authenticated" });

let db: PGlite;
let A: string;
let B: string;

beforeAll(async () => {
  db = await migratedDb();
  A = await newPlayer(db);
  B = await newPlayer(db);
  for (const p of [A, B]) {
    await fn(db).snapshot(p);
    await fn(db).choose(p, "warrior", "sword");
    await setStacks(db, p, { fish: 5 });
    await db.query(`insert into boss_clears (player_id, chapter, first_cleared_at, last_won_at) values ($1, 1, now(), now())`, [p]);
    await db.query(`insert into boss_fights (player_id, fight_no, chapter, won, key_spent) values ($1, 0, 1, true, true)`, [p]);
    await fn(db).founder(p);
  }
});

describe("RLS on the six v2 tables", () => {
  it("has RLS enabled and exactly one select policy each", async () => {
    for (const t of TABLES) {
      const r = await db.query<{ relrowsecurity: boolean }>(`select relrowsecurity from pg_class where oid = ('public.' || $1)::regclass`, [t]);
      expect(r.rows[0]!.relrowsecurity, t).toBe(true);
      const p = await db.query<{ cmd: string }>(`select cmd from pg_policies where schemaname = 'public' and tablename = $1`, [t]);
      expect(p.rows.map((x) => x.cmd), t).toEqual(["SELECT"]);
    }
  });

  it("anon cannot read or write; authenticated cannot write", async () => {
    for (const t of TABLES) {
      await expect(as(db, "anon", null, () => db.query(`select * from public.${t}`)), t).rejects.toThrow(DENIED);
      for (const role of ["anon", "authenticated"] as const) {
        const claims = role === "anon" ? null : jwt(A);
        for (const sql of [`insert into public.${t} default values`, `update public.${t} set player_id = player_id`, `delete from public.${t}`, `truncate public.${t}`]) {
          await expect(as(db, role, claims, () => db.query(sql)), `${role}: ${sql}`).rejects.toThrow(DENIED);
        }
      }
    }
  });

  it("authenticated reads only own rows", async () => {
    for (const t of TABLES) {
      const rows = (await as(db, "authenticated", jwt(A), () => db.query<{ player_id: string }>(`select player_id from public.${t}`))).rows;
      expect(rows.length, t).toBeGreaterThan(0);
      expect(new Set(rows.map((r) => r.player_id)), t).toEqual(new Set([A]));
      const none = (await as(db, "authenticated", {}, () => db.query(`select 1 from public.${t}`))).rows;
      expect(none, `${t} without sub`).toEqual([]);
    }
  });
});

describe("function privileges", () => {
  const oids = async (names: string[]) =>
    (await db.query<{ oid: number; sig: string }>(
      `select p.oid::int oid, p.oid::regprocedure::text sig from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = any ($1)`,
      [names],
    )).rows;
  const can = async (role: string, oid: number) =>
    (await db.query<{ ok: boolean }>(`select has_function_privilege($1, $2::oid, 'EXECUTE') ok`, [role, oid])).rows[0]!.ok;

  it("API functions are executable by service_role only", async () => {
    const fs = await oids([...API_FUNCS, ...INTEGRITY_FUNCS]);
    expect(fs.length).toBe(API_FUNCS.length + INTEGRITY_FUNCS.length);
    for (const f of fs) {
      expect(await can("service_role", f.oid), f.sig).toBe(true);
      expect(await can("anon", f.oid), f.sig).toBe(false);
      expect(await can("authenticated", f.oid), f.sig).toBe(false);
    }
  });

  it("helpers are executable by no API role, service_role included", async () => {
    const fs = await oids(HELPERS);
    expect(fs.length).toBe(HELPERS.length);
    for (const f of fs) for (const role of ["anon", "authenticated", "service_role"]) expect(await can(role, f.oid), `${role} ${f.sig}`).toBe(false);
    await expect(as(db, "service_role", null, () => db.query(`select public.v2_apply_stacks($1, '{"fish":1}'::jsonb, '{}'::jsonb)`, [A]))).rejects.toThrow(DENIED);
    await expect(as(db, "authenticated", jwt(A), () => db.query(`select public.v2_snapshot($1, '2026-11-01')`, [A]))).rejects.toThrow(DENIED);
  });

  it("every v2 function is security definer with an empty search_path", async () => {
    const r = await db.query<{ proname: string; prosecdef: boolean; proconfig: string[] | null }>(
      `select proname, prosecdef, proconfig from pg_proc where pronamespace = 'public'::regnamespace and proname like 'v2\\_%'`,
    );
    expect(r.rows.length).toBe(API_FUNCS.length + INTEGRITY_FUNCS.length + BUDGET_FUNCS.length + HELPERS.length);
    for (const f of r.rows) {
      expect(f.prosecdef, f.proname).toBe(true);
      expect(f.proconfig ?? [], f.proname).toContain('search_path=""');
    }
  });
});

describe("table constraints", () => {
  it("rejects structurally invalid rows", async () => {
    const bad = (sql: string, params: unknown[] = []) => expect(db.query(sql, params)).rejects.toThrow(/check constraint|violates/i);
    const ins = (slot: string, wt: string | null, rarity: string, level = 1, bonus = "[]") =>
      db.query(`insert into items (player_id, item_key, slot, weapon_type, rarity, level, bonus, source) values ($1, 'x.y', $2, $3, $4, $5, $6::jsonb, 'drop')`, [A, slot, wt, rarity, level, bonus]);
    await ins("gloves", null, "uncommon");
    await expect(ins("helm", null, "common")).rejects.toThrow(/check/i);
    await expect(ins("helmet", null, "mythic")).rejects.toThrow(/check/i);
    await expect(ins("weapon", null, "common")).rejects.toThrow(/check/i);
    await expect(ins("helmet", "sword", "common")).rejects.toThrow(/check/i);
    await expect(ins("weapon", "whip", "common")).rejects.toThrow(/check/i);
    await expect(ins("helmet", null, "common", 101)).rejects.toThrow(/check/i);
    await expect(ins("helmet", null, "common", 1, "[1,2,3,4,5]")).rejects.toThrow(/check/i);
    await expect(ins("helmet", null, "common", 1, "{}")).rejects.toThrow(/check/i);
    await bad(`insert into player_stacks (player_id, stack_id, qty) values ($1, 'fish', -1)`, [A]);
    await bad(`insert into player_stacks (player_id, stack_id, qty) values ($1, 'Fish!', 1)`, [A]);
    await bad(`update cat_state set round = 0 where player_id = $1`, [A]);
    // Two equipped items in one slot.
    await db.query(`insert into items (player_id, item_key, slot, rarity, level, source, equipped) values ($1, 'a.b', 'ring', 'common', 1, 'drop', true)`, [A]);
    await bad(`insert into items (player_id, item_key, slot, rarity, level, source, equipped) values ($1, 'a.c', 'ring', 'common', 1, 'drop', true)`, [A]);
  });
});

describe("migration and rollback", () => {
  async function listing(d: PGlite) {
    const q = async (sql: string) => (await d.query(sql)).rows;
    return {
      tables: await q(`select table_schema, table_name, table_type from information_schema.tables where table_schema in ('public','auth') order by 1,2,3`),
      columns: await q(`select table_name, column_name, data_type, is_nullable, column_default from information_schema.columns where table_schema = 'public' order by 1,2`),
      routines: await q(`select routine_name, specific_name, security_type from information_schema.routines where routine_schema = 'public' order by 1,2`),
      procs: await q(`select proname, pg_get_function_identity_arguments(oid) args, prosecdef, proconfig::text, proacl::text from pg_proc where pronamespace = 'public'::regnamespace order by 1,2`),
      classes: await q(`select relname, relkind, relrowsecurity, relacl::text from pg_class where relnamespace = 'public'::regnamespace order by 1`),
      policies: await q(`select tablename, policyname, cmd from pg_policies where schemaname = 'public' order by 1,2`),
      constraints: await q(`select conrelid::regclass::text t, conname from pg_constraint where connamespace = 'public'::regnamespace order by 1,2`),
    };
  }

  it("applies on top of v1, and rollback.sql restores the v1 listing exactly", async () => {
    const d = await v1OnlyDb();
    const before = await listing(d);
    expect(before.tables.map((t: any) => t.table_name)).not.toContain("cat_state");
    await d.exec(v2MigrationSql());
    const during = await listing(d);
    expect(during.tables.map((t: any) => t.table_name)).toEqual(expect.arrayContaining(TABLES));
    expect(during.procs.map((p: any) => p.proname)).toEqual(expect.arrayContaining([...API_FUNCS, ...HELPERS.filter(name => name !== "v2_equipment_revision")]));
    await d.exec(rollbackSql());
    expect(await listing(d)).toEqual(before);
    // Shared data is untouched and the migration can be applied again.
    await d.exec(v2MigrationSql());
    expect((await listing(d)).tables).toEqual(during.tables);
    await d.close();
  }, 60_000);

  it("migration is additive: rollback keeps v1 behaviour", async () => {
    const d = await v1OnlyDb();
    await d.exec(v2MigrationSql());
    const p = await newPlayer(d);
    await d.query(`insert into idle_state (player_id, shards) values ($1, 50)`, [p]);
    await d.exec(rollbackSql());
    expect((await d.query<{ shards: number }>(`select shards from idle_state where player_id = $1`, [p])).rows[0]!.shards).toBe(50);
    await d.close();
  }, 60_000);
});


it("action results have RLS, no client policies or privileges and service-role access", async () => {
  const rows = await db.query<{ relrowsecurity: boolean }>("select relrowsecurity from pg_class where oid='public.v2_action_results'::regclass");
  expect(rows.rows[0]!.relrowsecurity).toBe(true);
  expect((await db.query("select 1 from pg_policies where tablename='v2_action_results'")).rows).toEqual([]);
  for (const role of ["anon", "authenticated"] as const) {
    for (const privilege of ["SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"]) {
      expect((await db.query<{ ok: boolean }>("select has_table_privilege($1, 'public.v2_action_results', $2) ok", [role, privilege])).rows[0]!.ok).toBe(false);
    }
    await expect(as(db, role, null, () => db.query("select * from public.v2_action_results"))).rejects.toThrow(DENIED);
  }
  expect((await as(db, "service_role", null, () => db.query("select * from public.v2_action_results"))).rows).toEqual([]);
});

it("integrity migration and manual rollback preserve the original function bodies/grants and can reapply", async () => {
  const { readFileSync } = await import("node:fs");
  const d = await v1OnlyDb();
  try {
    await d.exec(v2MigrationSql());
    const original = async () => (await d.query(`select proname, pg_get_functiondef(oid) body, proacl::text
      from pg_proc where pronamespace='public'::regnamespace and proname in ('v2_salvage','v2_item_json') order by proname`)).rows;
    const before = await original();
    const migration = readFileSync(new URL("../../migrations/20261102000000_v2_integrity.sql", import.meta.url), "utf8");
    await d.exec(migration);
    expect((await original())).not.toEqual(before);
    await d.exec(readFileSync(new URL("../../../docs/proposals/sql/v2-integrity-rollback.sql", import.meta.url), "utf8"));
    expect(await original()).toEqual(before);
    expect((await d.query("select to_regclass('public.v2_action_results') t")).rows).toEqual([{ t: null }]);
    expect((await d.query("select 1 from pg_proc where proname=any($1)", [[...INTEGRITY_FUNCS, "v2_equipment_revision"]])).rows).toEqual([]);
    await d.exec(migration);
    expect((await d.query("select to_regclass('public.v2_action_results')::text t")).rows).toEqual([{ t: "v2_action_results" }]);
  } finally { await d.close(); }
});
