import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { as, migratedDb } from "./game-db.ts";

// A systematic access matrix over the whole migrated public schema. schema.test.ts checks chosen
// statements; this checks every table and function found in the catalog, so a table or function
// added by a later migration without the right revokes fails here.

const A = "00000000-0000-4000-8000-00000000000a";
const B = "00000000-0000-4000-8000-00000000000b";
const WALLET_A = "0x" + "a".repeat(40);
const WALLET_B = "0x" + "b".repeat(40);
const jwt = (sub: string) => ({ sub, role: "authenticated" });
const API_ROLES = ["anon", "authenticated"] as const;
const DENIED = /permission denied|row-level security/;

let db: PGlite;
let tables: string[] = [];
let functions: { oid: number; name: string; args: string }[] = [];

beforeAll(async () => {
  db = await migratedDb();
  await db.exec(`
    insert into players (id, wallet) values ('${A}', '${WALLET_A}'), ('${B}', '${WALLET_B}');
    insert into idle_state (player_id, gold) values ('${A}', 10), ('${B}', 20);
    insert into siwe_nonces (nonce) values ('seed0001');
  `);
  tables = (
    await db.query<{ relname: string }>(
      `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm', 'f') order by 1`,
    )
  ).rows.map((r) => r.relname);
  functions = (
    await db.query<{ oid: number; name: string; args: string }>(
      `select p.oid::int oid, p.proname name, pg_get_function_identity_arguments(p.oid) args
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' order by 1, 2`,
    )
  ).rows;
});

describe("every public table", () => {
  it("is found, has RLS enabled, and nothing in public is a view", async () => {
    expect(tables.length).toBeGreaterThanOrEqual(8);
    const r = await db.query<{ relname: string; relkind: string; relrowsecurity: boolean }>(
      `select c.relname, c.relkind, c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind <> 'i' and c.relkind <> 'S' and c.relkind <> 'c' and c.relkind <> 't'`,
    );
    for (const t of r.rows) {
      expect(t.relkind, `${t.relname} must be a plain table (views bypass RLS)`).toBe("r");
      expect(t.relrowsecurity, `${t.relname} RLS`).toBe(true);
    }
  });

  it("grants anon nothing, and authenticated at most SELECT", async () => {
    for (const t of tables) {
      for (const priv of ["SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"]) {
        const anon = (await db.query<{ ok: boolean }>(`select has_table_privilege('anon', 'public.${t}', '${priv}') ok`)).rows[0]!.ok;
        expect(anon, `anon ${priv} on ${t}`).toBe(false);
        const authed = (await db.query<{ ok: boolean }>(`select has_table_privilege('authenticated', 'public.${t}', '${priv}') ok`)).rows[0]!.ok;
        if (priv !== "SELECT") expect(authed, `authenticated ${priv} on ${t}`).toBe(false);
      }
    }
  });

  it("grants no column-level writes to anon or authenticated", async () => {
    const r = await db.query<{ table_name: string; grantee: string; privilege_type: string }>(
      `select table_name, grantee, privilege_type from information_schema.column_privileges
       where table_schema = 'public' and grantee in ('anon', 'authenticated') and privilege_type <> 'SELECT'`,
    );
    expect(r.rows).toEqual([]);
  });

  it("anon and authenticated cannot insert, update, delete or truncate any table", async () => {
    for (const t of tables) {
      for (const role of API_ROLES) {
        const claims = role === "anon" ? null : jwt(A);
        for (const sql of [
          `insert into public.${t} default values`,
          `update public.${t} set ${await firstColumn(t)} = default`,
          `delete from public.${t}`,
          `truncate public.${t}`,
        ]) {
          await expect(as(db, role, claims, () => db.query(sql)), `${role}: ${sql}`).rejects.toThrow(DENIED);
        }
      }
    }
    // Nothing was touched.
    expect((await db.query(`select 1 from players`)).rows).toHaveLength(2);
    expect((await db.query(`select 1 from idle_state`)).rows).toHaveLength(2);
  });

  it("anon cannot select any table", async () => {
    for (const t of tables) {
      await expect(as(db, "anon", null, () => db.query(`select * from public.${t}`)), t).rejects.toThrow(DENIED);
    }
  });

  it("authenticated cannot read the server-only tables, and sees only own rows in the others", async () => {
    // Tables with a SELECT policy keyed on the caller; the rest must be unreadable.
    const policies = (await db.query<{ tablename: string }>(`select tablename from pg_policies where schemaname = 'public' and policyname <> 'siwe_nonces_server_only'`)).rows.map((r) => r.tablename);
    for (const t of tables) {
      const read = as(db, "authenticated", jwt(A), () => db.query<Record<string, unknown>>(`select * from public.${t}`));
      if (!policies.includes(t)) {
        await expect(read, `authenticated select ${t}`).rejects.toThrow(DENIED);
        continue;
      }
      const rows = (await read).rows;
      for (const row of rows) expect([row.id, row.player_id], `${t} row not owned by A`).toContain(A);
    }
  });

  it("a caller with no sub, or an unknown sub, reads nothing", async () => {
    for (const claims of [{}, { role: "authenticated" }, jwt("00000000-0000-4000-8000-0000000000ff")]) {
      for (const t of ["players", "idle_state", "gear", "boss_keys", "boss_attempts", "relic_vouchers", "relic_forges"]) {
        const r = await as(db, "authenticated", claims, () => db.query(`select * from public.${t}`));
        expect(r.rows, `${t} with ${JSON.stringify(claims)}`).toEqual([]);
      }
    }
  });

  it("a forged wallet claim does not widen what the caller sees", async () => {
    const r = await as(db, "authenticated", { sub: A, wallet: WALLET_B, role: "authenticated" }, () =>
      db.query<{ id: string }>(`select id from players`),
    );
    expect(r.rows.map((x) => x.id)).toEqual([A]);
  });
});

async function firstColumn(t: string): Promise<string> {
  const r = await db.query<{ column_name: string }>(
    `select column_name from information_schema.columns where table_schema = 'public' and table_name = $1 order by ordinal_position limit 1`,
    [t],
  );
  return r.rows[0]!.column_name;
}

describe("every public function", () => {
  it("is found", () => {
    expect(functions.map((f) => f.name)).toEqual(
      expect.arrayContaining(["consume_siwe_nonce", "create_siwe_nonce", "upsert_player_by_wallet", "game_claim", "game_forge", "game_upgrade"]),
    );
  });

  it("is executable by service_role only or by nobody, never by anon or authenticated", async () => {
    const leaks: string[] = [];
    for (const f of functions) {
      for (const role of API_ROLES) {
        const r = await db.query<{ ok: boolean }>(`select has_function_privilege($1, $2::oid, 'EXECUTE') ok`, [role, f.oid]);
        if (r.rows[0]!.ok) leaks.push(`${role} can execute ${f.name}(${f.args})`);
      }
    }
    expect(leaks).toEqual([]);
  });

  it("security definer functions pin an empty search_path", async () => {
    const r = await db.query<{ proname: string; proconfig: string[] | null }>(
      `select p.proname, p.proconfig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.prosecdef`,
    );
    expect(r.rows.length).toBeGreaterThan(0);
    for (const f of r.rows) expect(f.proconfig ?? [], f.proname).toContain('search_path=""');
  });
});

describe("SIWE nonce edges", () => {
  const consume = (nonce: string | null) =>
    as(db, "service_role", null, async () => (await db.query<{ ok: boolean }>(`select public.consume_siwe_nonce($1) ok`, [nonce])).rows[0]!.ok);
  const insert = (nonce: string, ago: string) => db.query(`insert into siwe_nonces (nonce, created_at) values ($1, now() - $2::interval)`, [nonce, ago]);

  it("a null or empty nonce is refused and consumes nothing", async () => {
    expect(await consume(null)).toBe(false);
    expect(await consume("")).toBe(false);
    expect((await db.query<{ n: number }>(`select count(*)::int n from siwe_nonces where used_at is not null`)).rows[0]!.n).toBe(0);
  });

  it("nonces are case-sensitive: a differently cased copy of a fresh nonce is not accepted", async () => {
    await insert("CaseNonce01", "0 seconds");
    expect(await consume("casenonce01")).toBe(false);
    expect(await consume("CaseNonce01")).toBe(true);
    expect(await consume("CaseNonce01")).toBe(false);
  });

  it("a used nonce stays refused even if reused inside the window, and a stale unused one stays refused", async () => {
    await insert("UsedOnce01", "1 second");
    expect(await consume("UsedOnce01")).toBe(true);
    for (let i = 0; i < 3; i++) expect(await consume("UsedOnce01")).toBe(false);
    await insert("ExpiredNo1", "1 hour");
    expect(await consume("ExpiredNo1")).toBe(false);
    expect(await consume("ExpiredNo1")).toBe(false);
  });

  it("consuming a nonce does not create a player or any game row", async () => {
    const count = async () => (await db.query<{ n: number }>(`select count(*)::int n from players`)).rows[0]!.n;
    const before = await count();
    await insert("NoSideFx01", "0 seconds");
    await consume("NoSideFx01");
    expect(await count()).toBe(before);
  });

  it("the same nonce string cannot be inserted twice, so a challenge cannot be duplicated", async () => {
    await insert("DupNonce01", "0 seconds");
    await expect(insert("DupNonce01", "0 seconds")).rejects.toThrow(/duplicate key|unique/);
  });

  it("create_siwe_nonce refuses to overwrite an existing nonce", async () => {
    await expect(as(db, "service_role", null, () => db.query(`select public.create_siwe_nonce('DupNonce01')`))).rejects.toThrow(/duplicate key|unique/);
  });

  it("upsert_player_by_wallet cannot be used by a signed-in player to create another account", async () => {
    await expect(
      as(db, "authenticated", jwt(A), () => db.query(`select public.upsert_player_by_wallet('0x${"d".repeat(40)}')`)),
    ).rejects.toThrow(DENIED);
    expect((await db.query(`select 1 from players where wallet = '0x${"d".repeat(40)}'`)).rows).toEqual([]);
  });
});
