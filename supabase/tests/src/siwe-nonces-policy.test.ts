import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { as, migratedDb } from "./game-db.ts";

// U-2: the real migration must keep siwe_nonces closed to browsers even if a later change
// grants privileges or adds a permissive policy.
let db: PGlite;
beforeAll(async () => {
  db = await migratedDb();
  await db.exec("insert into siwe_nonces (nonce) values ('u2-seed-nonce')");
});

describe("siwe_nonces is server-only", () => {
  it("has RLS on and a restrictive deny-all policy for client roles", async () => {
    const rls = await db.query<{ relrowsecurity: boolean }>("select relrowsecurity from pg_class where oid = 'public.siwe_nonces'::regclass");
    expect(rls.rows[0]!.relrowsecurity).toBe(true);
    const pol = await db.query<{ permissive: string }>("select permissive from pg_policies where tablename = 'siwe_nonces' and policyname = 'siwe_nonces_server_only'");
    expect(pol.rows).toEqual([{ permissive: "RESTRICTIVE" }]);
  });
  it("denies anon and authenticated direct access", async () => {
    for (const role of ["anon", "authenticated"] as const) {
      await expect(as(db, role, null, () => db.query("select * from siwe_nonces"))).rejects.toThrow(/permission denied|row-level security/);
      await expect(as(db, role, null, () => db.query("insert into siwe_nonces(nonce) values ('x')"))).rejects.toThrow(/permission denied|row-level security/);
      await expect(as(db, role, null, () => db.query("delete from siwe_nonces"))).rejects.toThrow(/permission denied|row-level security/);
    }
  });
  it("still stays closed after an accidental grant plus permissive policy", async () => {
    await db.exec("grant select, insert, update, delete on siwe_nonces to anon, authenticated");
    await db.exec("create policy accidental_allow on siwe_nonces for all to anon, authenticated using (true) with check (true)");
    for (const role of ["anon", "authenticated"] as const) {
      expect((await as(db, role, null, () => db.query("select * from siwe_nonces"))).rows).toEqual([]);
      await expect(as(db, role, null, () => db.query("insert into siwe_nonces(nonce) values ('y')"))).rejects.toThrow();
    }
  });
  it("lets service_role read and write", async () => {
    await as(db, "service_role", null, () => db.query("insert into siwe_nonces(nonce) values ('svc-nonce')"));
    expect((await as(db, "service_role", null, () => db.query("select nonce from siwe_nonces where nonce = 'svc-nonce'"))).rows).toHaveLength(1);
  });
  it("is idempotent when applied twice", async () => {
    const { readFileSync } = await import("node:fs");
    const sql = readFileSync(new URL("../../migrations/20261103000000_siwe_nonces_server_only.sql", import.meta.url), "utf8");
    await db.exec(sql);
    await db.exec(sql);
  });
});
