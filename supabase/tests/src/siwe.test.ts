import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "../../migrations");
const WALLET = "0x" + "c".repeat(40);

let db: PGlite;

async function as<T>(role: "anon" | "authenticated" | "service_role", fn: () => Promise<T>) {
  await db.exec(`set role ${role}`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}
const consume = (nonce: string) =>
  as("service_role", async () => (await db.query<{ ok: boolean }>(`select public.consume_siwe_nonce($1) as ok`, [nonce])).rows[0]!.ok);

beforeAll(async () => {
  db = new PGlite();
  await db.exec(readFileSync(join(here, "../sql/bootstrap.sql"), "utf8"));
  for (const f of readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(join(migrationsDir, f), "utf8"));
  }
  await db.exec(`
    insert into siwe_nonces (nonce) values ('fresh0001'), ('fresh0002');
    insert into siwe_nonces (nonce, created_at) values ('stale0001', now() - interval '10 minutes 1 second');
    insert into siwe_nonces (nonce, created_at) values ('almost001', now() - interval '9 minutes 50 seconds');
  `);
});

describe("consume_siwe_nonce", () => {
  it("marks a fresh nonce used exactly once", async () => {
    expect(await consume("fresh0001")).toBe(true);
    expect(await consume("fresh0001")).toBe(false);
    const r = await db.query<{ used_at: Date | null }>(`select used_at from siwe_nonces where nonce = 'fresh0001'`);
    expect(r.rows[0]!.used_at).toBeInstanceOf(Date);
  });

  it("issued concurrently, exactly one call wins", async () => {
    const results = await Promise.all([1, 2, 3, 4].map(() => consume("fresh0002")));
    expect(results.filter(Boolean).length).toBe(1);
  });

  it("refuses stale and unknown nonces, accepts one just inside the window", async () => {
    expect(await consume("stale0001")).toBe(false);
    expect(await consume("unknown01")).toBe(false);
    expect(await consume("almost001")).toBe(true);
    const r = await db.query<{ used_at: Date | null }>(`select used_at from siwe_nonces where nonce = 'stale0001'`);
    expect(r.rows[0]!.used_at).toBeNull();
  });

  it("is not callable by anon or authenticated", async () => {
    await db.exec(`insert into siwe_nonces (nonce) values ('fresh0003')`);
    for (const role of ["anon", "authenticated"] as const) {
      await expect(as(role, () => db.query(`select public.consume_siwe_nonce('fresh0003')`))).rejects.toThrow(/permission denied/);
      await expect(as(role, () => db.query(`select public.upsert_player_by_wallet('${WALLET}')`))).rejects.toThrow(/permission denied/);
    }
    expect(await consume("fresh0003")).toBe(true);
  });
});

describe("create_siwe_nonce", () => {
  const create = (nonce: string) => as("service_role", () => db.query(`select public.create_siwe_nonce($1)`, [nonce]));
  const exists = async (nonce: string) => (await db.query(`select 1 from siwe_nonces where nonce = $1`, [nonce])).rows.length === 1;

  it("inserts the nonce and deletes used and stale rows, keeping fresh ones", async () => {
    await db.exec(`
      insert into siwe_nonces (nonce) values ('keepfresh1');
      insert into siwe_nonces (nonce, used_at) values ('usedrow01', now());
      insert into siwe_nonces (nonce, created_at) values ('staleold1', now() - interval '11 minutes');
    `);
    await create("newnonce01");
    expect(await exists("newnonce01")).toBe(true);
    expect(await exists("keepfresh1")).toBe(true);
    expect(await exists("usedrow01")).toBe(false);
    expect(await exists("staleold1")).toBe(false);
  });

  it("deletes at most 1000 rows per call", async () => {
    await db.exec(`insert into siwe_nonces (nonce, used_at) select 'bulk' || g, now() from generate_series(1, 1500) g`);
    await create("newnonce02");
    const r = await db.query<{ n: number }>(`select count(*)::int as n from siwe_nonces where nonce like 'bulk%'`);
    expect(r.rows[0]!.n).toBe(500);
    await create("newnonce03");
    expect((await db.query(`select 1 from siwe_nonces where nonce like 'bulk%'`)).rows.length).toBe(0);
  });

  it("is not callable by anon or authenticated", async () => {
    for (const role of ["anon", "authenticated"] as const) {
      await expect(as(role, () => db.query(`select public.create_siwe_nonce('denied0001')`))).rejects.toThrow(/permission denied/);
    }
  });
});

describe("default privileges", () => {
  it("a table or function created after the migrations is not accessible to anon/authenticated", async () => {
    await db.exec(`create table public.later_table (id int); insert into public.later_table values (1);`);
    await db.exec(`create function public.later_fn() returns int language sql as 'select 1'`);
    for (const role of ["anon", "authenticated"] as const) {
      await expect(as(role, () => db.query(`select * from public.later_table`))).rejects.toThrow(/permission denied/);
      await expect(as(role, () => db.query(`select public.later_fn()`))).rejects.toThrow(/permission denied/);
    }
  });
});

describe("upsert_player_by_wallet", () => {
  it("creates the player and idle_state once, then returns the same id", async () => {
    const call = () =>
      as("service_role", async () => (await db.query<{ id: string }>(`select public.upsert_player_by_wallet($1) as id`, [WALLET])).rows[0]!.id);
    const a = await call();
    const b = await call();
    expect(b).toBe(a);
    const p = await db.query(`select * from players where wallet = $1`, [WALLET]);
    expect(p.rows.length).toBe(1);
    const s = await db.query<{ gold: string }>(`select gold from idle_state where player_id = $1`, [a]);
    expect(s.rows.length).toBe(1);
    expect(Number(s.rows[0]!.gold)).toBe(0);
  });

  it("rejects a non-lowercase wallet", async () => {
    await expect(
      as("service_role", () => db.query(`select public.upsert_player_by_wallet($1)`, ["0x" + "C".repeat(40)])),
    ).rejects.toThrow(/check constraint/);
  });
});
