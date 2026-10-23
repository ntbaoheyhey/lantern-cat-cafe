import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "../../migrations");
const A = "00000000-0000-4000-8000-00000000000a";
const B = "00000000-0000-4000-8000-00000000000b";
const WALLET_A = "0x" + "a".repeat(40);
const WALLET_B = "0x" + "b".repeat(40);

let db: PGlite;

/** Run statements as a role with the given JWT claims, always resetting afterwards. */
async function as<T>(role: "anon" | "authenticated" | "service_role", claims: object | null, fn: () => Promise<T>) {
  await db.exec(`set role ${role}`);
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [claims ? JSON.stringify(claims) : ""]);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
    await db.exec("reset request.jwt.claims");
  }
}
const jwt = (sub: string, wallet: string) => ({ sub, wallet, role: "authenticated" });

beforeAll(async () => {
  db = new PGlite();
  await db.exec(readFileSync(join(here, "../sql/bootstrap.sql"), "utf8"));
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  expect(files.length).toBeGreaterThan(0);
  for (const f of files) await db.exec(readFileSync(join(migrationsDir, f), "utf8"));

  await db.exec(`
    insert into players (id, wallet) values ('${A}', '${WALLET_A}'), ('${B}', '${WALLET_B}');
    insert into idle_state (player_id, gold) values ('${A}', 10), ('${B}', 20);
    insert into gear (player_id, item_key, slot, power) values ('${A}','sword','weapon',5), ('${B}','axe','weapon',6);
    insert into boss_attempts (player_id, day, won) values ('${A}','2026-01-01',true), ('${B}','2026-01-01',false);
    insert into boss_keys (player_id, day) values ('${A}','2026-01-01'), ('${B}','2026-01-01');
    insert into relic_vouchers (player_id, relic_id, rarity, expires_at)
      values ('${A}', 1, 'rare', now() + interval '1 hour'), ('${B}', 2, 'epic', now() + interval '1 hour');
    insert into siwe_nonces (nonce) values ('abc');
  `);
});

const playerTables = ["idle_state", "gear", "boss_attempts", "boss_keys", "relic_vouchers"];
const allTables = ["players", ...playerTables, "siwe_nonces"];

describe("migrations", () => {
  it("applied: all tables exist with RLS enabled", async () => {
    const r = await db.query<{ relname: string; relrowsecurity: boolean }>(
      `select c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' order by 1`,
    );
    expect(r.rows.map((x) => x.relname).sort()).toEqual([...allTables].sort());
    expect(r.rows.every((x) => x.relrowsecurity)).toBe(true);
  });

  it("has no write policies at all", async () => {
    const r = await db.query<{ cmd: string }>(`select cmd from pg_policies where schemaname = 'public'`);
    expect(r.rows.length).toBe(6);
    expect(r.rows.every((x) => x.cmd === "SELECT")).toBe(true);
  });
});

describe("row level security", () => {
  it("player A sees only own rows in every table", async () => {
    for (const t of playerTables) {
      const rows = await as("authenticated", jwt(A, WALLET_A), () =>
        db.query<{ player_id: string }>(`select player_id from ${t}`),
      );
      expect(rows.rows.map((r) => r.player_id), t).toEqual([A]);
    }
    const p = await as("authenticated", jwt(A, WALLET_A), () => db.query<{ id: string }>(`select id from players`));
    expect(p.rows.map((r) => r.id)).toEqual([A]);
  });

  it("player A cannot read player B by id filter", async () => {
    const r = await as("authenticated", jwt(A, WALLET_A), () =>
      db.query(`select * from idle_state where player_id = '${B}'`),
    );
    expect(r.rows).toEqual([]);
  });

  it("service role sees everything", async () => {
    const r = await as("service_role", null, () => db.query(`select * from idle_state`));
    expect(r.rows.length).toBe(2);
  });

  it("anon reads nothing and authenticated without sub reads nothing", async () => {
    await expect(as("anon", null, () => db.query(`select * from players`))).rejects.toThrow(/permission denied/);
    const r = await as("authenticated", {}, () => db.query(`select * from players`));
    expect(r.rows).toEqual([]);
  });

  it("siwe_nonces is inaccessible to anon and authenticated", async () => {
    for (const role of ["anon", "authenticated"] as const) {
      await expect(as(role, jwt(A, WALLET_A), () => db.query(`select * from siwe_nonces`))).rejects.toThrow(/permission denied/);
      await expect(as(role, jwt(A, WALLET_A), () => db.query(`insert into siwe_nonces (nonce) values ('x')`))).rejects.toThrow(/permission denied/);
    }
    const r = await as("service_role", null, () => db.query(`select * from siwe_nonces`));
    expect(r.rows.length).toBe(1);
  });

  it("anon and authenticated cannot insert, update or delete", async () => {
    const stmts = [
      `insert into players (wallet) values ('0x${"c".repeat(40)}')`,
      `update idle_state set gold = 999999 where player_id = '${A}'`,
      `delete from gear where player_id = '${A}'`,
      `insert into boss_keys (player_id, day) values ('${A}', '2026-02-02')`,
      `update boss_keys set spent_at = now() where player_id = '${A}'`,
      `insert into relic_vouchers (player_id, relic_id, rarity, expires_at) values ('${A}', 9, 'rare', now() + interval '1 day')`,
    ];
    for (const sql of stmts) {
      await expect(as("anon", null, () => db.query(sql)), `anon: ${sql}`).rejects.toThrow(/permission denied|row-level security/);
      await expect(as("authenticated", jwt(A, WALLET_A), () => db.query(sql)), `auth: ${sql}`).rejects.toThrow(/permission denied|row-level security/);
    }
    const r = await as("service_role", null, () => db.query<{ gold: string }>(`select gold from idle_state where player_id = '${A}'`));
    expect(Number(r.rows[0]!.gold)).toBe(10);
  });
});

describe("constraints", () => {
  it("boss_keys unique (player_id, day)", async () => {
    await expect(
      as("service_role", null, () => db.query(`insert into boss_keys (player_id, day) values ('${A}', '2026-01-01')`)),
    ).rejects.toThrow(/duplicate key|unique/);
    await as("service_role", null, () => db.query(`insert into boss_keys (player_id, day) values ('${A}', '2026-01-02')`));
  });

  it("gold and shards cannot go negative", async () => {
    await expect(
      as("service_role", null, () => db.query(`update idle_state set gold = -1 where player_id = '${A}'`)),
    ).rejects.toThrow(/check constraint/);
    await expect(
      as("service_role", null, () => db.query(`update idle_state set shards = -1 where player_id = '${A}'`)),
    ).rejects.toThrow(/check constraint/);
  });

  it("wallet must be lowercase and unique", async () => {
    await expect(
      as("service_role", null, () => db.query(`insert into players (wallet) values ('0x${"A".repeat(40)}')`)),
    ).rejects.toThrow(/check constraint/);
    await expect(
      as("service_role", null, () => db.query(`insert into players (wallet) values ('${WALLET_A}')`)),
    ).rejects.toThrow(/duplicate key/);
  });

  it("relic voucher status is limited", async () => {
    await expect(
      as("service_role", null, () =>
        db.query(`update relic_vouchers set status = 'bogus' where player_id = '${A}'`),
      ),
    ).rejects.toThrow(/check constraint/);
    await as("service_role", null, () => db.query(`update relic_vouchers set status = 'minted' where player_id = '${A}'`));
  });
});
