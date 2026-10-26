import type { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { v2 } from "@taskbar-hero/game-rules";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chooseClassV2, equipV2, getStateV2 } from "../../functions/_shared/v2/game.ts";
import { craftV2, salvageV2 } from "../../functions/_shared/v2/forge.ts";
import { as, migratedDb } from "../src/game-db.ts";
import { call, newPlayer, setStacks, stack } from "./helpers.ts";
import { pgliteV2Store } from "./v2-store.ts";

// Apply proposal text ONLY to this disposable in-memory clone. These are not migrations,
// and the unmodified-schema expected failures in security-races.test.ts must remain visible.
let db: PGlite;
const store = pgliteV2Store(() => db);
const deps = { store, seedSecret: "proposal-test-only" };
function sqlBlocks(file: string) {
  const doc = readFileSync(new URL(`../../../docs/proposals/${file}`, import.meta.url), "utf8");
  return [...doc.matchAll(/```sql\n([\s\S]*?)```/g)].map(m => m[1]!).filter(sql => /^create /m.test(sql));
}
beforeAll(async () => {
  db = await migratedDb();
  for (const file of ["rate-limit-v2.md", "v2-state-integrity.md"]) for (const sql of sqlBlocks(file)) await db.exec(sql);
  await db.exec(readFileSync(new URL("../../../docs/proposals/sql/siwe-nonces-rls.sql", import.meta.url), "utf8"));
});
afterAll(async () => { await db.close(); });
async function fresh(classId = "warrior") {
  const p = await newPlayer(db);
  await getStateV2(deps, p);
  await chooseClassV2(deps, p, { classId });
  return p;
}
const raw = (p: string) => store.snapshot(p, "2026-10-26");

describe("S2 proposal SQL in a disposable database only", () => {
  it("preserves service-only nonce access even with a future permissive client policy", async () => {
    await as(db, "service_role", null, () => db.query("insert into siwe_nonces(nonce) values ('s2-proposal-nonce')"));
    await db.exec("grant select, insert on siwe_nonces to anon, authenticated");
    await db.exec("create policy accidental_allow on siwe_nonces for all to anon, authenticated using (true) with check (true)");
    for (const role of ["anon", "authenticated"] as const) {
      expect((await as(db, role, null, () => db.query("select * from siwe_nonces"))).rows).toEqual([]);
      await expect(as(db, role, null, () => db.query("insert into siwe_nonces(nonce) values ('blocked')"))).rejects.toThrow();
    }
  });
  it("admits only the configured burst across parallel shared-budget calls", async () => {
    const budgets = JSON.stringify([{ key: "ip:test:all", perMinute: 1, burst: 2 }]);
    const invoke = async () => (await db.query<{ r: { allowed: boolean; retryAfter?: number } }>("select public.v2_take_budgets($1::jsonb) r", [budgets])).rows[0]!.r;
    const rs = await Promise.all([invoke(), invoke(), invoke(), invoke()]);
    expect(rs.filter(r => r.allowed)).toHaveLength(2);
    for (const refusal of rs.filter(r => !r.allowed)) expect(refusal.retryAfter).toBeGreaterThan(0);
    expect(await call(db, "public.v2_take_budgets($1::jsonb)", [JSON.stringify([{ key: "ip:other:all", perMinute: 1, burst: 2 }])])).toEqual({ allowed: true });
  });
  it("admits a signed-envelope request id once across parallel deliveries", async () => {
    const id = "00000000-0000-4000-8000-000000000001";
    const invoke = async () => (await db.query<{ r: boolean }>("select public.v2_admit_proxy_request($1) r", [id])).rows[0]!.r;
    expect((await Promise.all([invoke(), invoke()])).filter(Boolean)).toHaveLength(1);
  });
  it("denies anonymous budget RPC execution", async () => {
    await expect(as(db, "anon", null, () => db.query("select public.v2_take_budgets('[]'::jsonb)"))).rejects.toThrow(/permission denied/);
  });
  it("invalidates a stale combat snapshot on unequip and leaves idempotent unequip stable", async () => {
    const p = await fresh(); const before = (await raw(p))!;
    await equipV2(deps, p, { slot: "weapon", itemId: null });
    const changed = (await raw(p))!;
    expect(changed.progressRev).toBeGreaterThan(before.progressRev);
    await equipV2(deps, p, { slot: "weapon", itemId: null });
    expect((await raw(p))!.progressRev).toBe(changed.progressRev);
    expect(await store.bossFight({ playerId: p, chapter: 1, expectedRev: before.progressRev, fightNo: before.fights, won: true,
      keyCost: 1, cooldownS: 60, chest: { first: { stacks: {}, items: [] }, rematch: { stacks: {}, items: [] } }, bagLimit: 200, caps: {}, bossRound: 10 })).toMatchObject({ error: "stale" });
  });
  it.each(v2.CLASSES.map(cls => cls.id))("blocks free starter salvage for %s without blocking a paid common craft", async classId => {
    const p = await fresh(classId); const starter = (await raw(p))!.inventory[0]!;
    // Make the starter unequipped, leaving the rest of the batch valid.
    await equipV2(deps, p, { slot: "weapon", itemId: null });
    const recipe = v2.RECIPES.find(r => r.id === "rcp.common")!;
    await setStacks(db, p, { ...recipe.materials, fish: recipe.fish });
    const crafted = await craftV2(deps, p, { recipeId: recipe.id, slot: "weapon" });
    const before = (await raw(p))!;
    await expect(salvageV2(deps, p, { itemIds: [starter.id, crafted.item.id] })).rejects.toMatchObject({ code: "invalid_request" });
    expect((await raw(p))!.stacks).toEqual(before.stacks);
    expect((await raw(p))!.inventory).toHaveLength(2);
    await expect(salvageV2(deps, p, { itemIds: [starter.id] })).rejects.toMatchObject({ code: "invalid_request" });
    await salvageV2(deps, p, { itemIds: [crafted.item.id] });
    expect(await stack(db, p, "yarn")).toBe(v2.salvage(crafted.item).yarn);
    await chooseClassV2(deps, p, { classId });
    expect((await raw(p))!.inventory).toHaveLength(1);
  });
});
