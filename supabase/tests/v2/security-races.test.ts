import type { PGlite } from "@electric-sql/pglite";
import { v2 } from "@taskbar-hero/game-rules";
import { generatePrivateKey } from "viem/accounts";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { dayDate } from "../../functions/_shared/game.ts";
import { voucherSigner, type ChainReader } from "../../functions/_shared/relic.ts";
import { fightBossV2 } from "../../functions/_shared/v2/boss.ts";
import { craftV2, forgeRelicV2, lockV2, salvageV2, type ForgeDepsV2 } from "../../functions/_shared/v2/forge.ts";
import { chooseClassV2, claimV2, equipV2, getStateV2, type V2Store } from "../../functions/_shared/v2/game.ts";
import { migratedDb } from "../src/game-db.ts";
import { count, fn, item, newPlayer, setStacks, stack } from "./helpers.ts";
import { pgliteV2Store } from "./v2-store.ts";

let db: PGlite;
let clock = Date.now();
const store = pgliteV2Store(() => db);
const chain: ChainReader = { nonceUsed: async () => false, receipt: async () => null };
const deps: ForgeDepsV2 = { store, seedSecret: "security-test-only", now: () => clock,
  relic: { signer: voucherSigner(generatePrivateKey(), "0x1111111111111111111111111111111111111111"), chain } };
const recipe = v2.RECIPES.find(r => r.id === "rcp.common")!;
const cost = { ...recipe.materials, fish: recipe.fish };
const craftBody = { recipeId: recipe.id, slot: "weapon" };
const chapter = v2.CHAPTERS[0]!;
beforeAll(async () => { db = await migratedDb(); });
afterAll(async () => { await db.close(); });
beforeEach(() => { clock = Date.now(); });
const raw = (p: string) => store.snapshot(p, dayDate(Math.floor(clock / 1000)));
async function fresh() {
  const p = await newPlayer(db);
  await getStateV2(deps, p);
  await chooseClassV2(deps, p, { classId: "warrior" });
  return p;
}
async function insert(p: string) {
  const s = (await raw(p))!;
  const result = await fn(db).claim(p, { micros: s.lastClaimMicros, rev: s.progressRev,
    now: new Date(s.lastClaimMicros / 1000 + 10_000), items: [item(), item()] });
  return result!.items as v2.ItemViewV2[];
}
async function readyBoss() {
  const p = await fresh();
  await db.query(`update cat_state set round = $2, kills = $3, level = $4 where player_id = $1`,
    [p, chapter.roundsPerChapter, chapter.killsPerRound, v2.V2_CONFIG.cat.maxLevel]);
  await setStacks(db, p, { catKey: v2.V2_CONFIG.boss.keyCost });
  return p;
}
/** Both handlers MUST see the same initial state. Subsequent loads run normally.
 * SQL statements serialize on PGlite's one connection; this proves stale-snapshot CAS, not
 * independent-connection PostgreSQL lock scheduling or deadlock freedom. */
function racing(): ForgeDepsV2 {
  let arrivals = 0;
  let release!: () => void;
  const both = new Promise<void>(resolve => { release = resolve; });
  const snapshot: V2Store["snapshot"] = async (...args) => {
    const result = await store.snapshot(...args);
    if (arrivals < 2) { if (++arrivals === 2) release(); await both; }
    return result;
  };
  return { ...deps, store: { ...store, snapshot } };
}
const fulfilled = <T>(rs: PromiseSettledResult<T>[]) => rs.filter(r => r.status === "fulfilled");

describe("S2 route concurrency and replay over migrated SQL", () => {
  it("parallel claims credit one window and at most one daily key; immediate replay pays zero", async () => {
    const p = await fresh();
    clock = (await raw(p))!.lastClaimMicros / 1000 + 3600_000;
    const using = racing();
    const claims = await Promise.all([claimV2(using, p), claimV2(using, p)]);
    expect(claims.filter(r => r.gains.fish > 0)).toHaveLength(1);
    expect(await stack(db, p, "fish")).toBe(claims.reduce((n, r) => n + r.gains.fish, 0));
    expect(await stack(db, p, "catKey")).toBeLessThanOrEqual(v2.V2_CONFIG.idle.dailyKeys);
    const before = (await raw(p))!;
    expect((await claimV2(deps, p)).gains.fish).toBe(0);
    expect((await raw(p))!.stacks).toEqual(before.stacks);
  });
  it("two boss requests using the last key commit one fight and one first-clear chest", async () => {
    const p = await readyBoss(); const using = racing();
    const rs = await Promise.allSettled([fightBossV2(using, p, { chapter: 1 }), fightBossV2(using, p, { chapter: 1 })]);
    expect(fulfilled(rs)).toHaveLength(1);
    expect(rs.find(r => r.status === "rejected")).toMatchObject({ reason: { code: "stale" } });
    expect((await raw(p))!.fights).toBe(1);
    expect(await stack(db, p, "catKey")).toBeGreaterThanOrEqual(0);
    expect(await count(db, "select 1 from boss_fights where player_id = $1", p)).toBe(1);
    expect((await db.query<{ wins: number }>("select wins from boss_clears where player_id = $1", [p])).rows).toEqual([{ wins: 1 }]);
  });
  it("parallel crafts with exactly one recipe budget consume it once", async () => {
    const p = await fresh(); await setStacks(db, p, cost); const using = racing();
    const rs = await Promise.allSettled([craftV2(using, p, craftBody), craftV2(using, p, craftBody)]);
    expect(fulfilled(rs)).toHaveLength(1);
    expect(rs.find(r => r.status === "rejected")).toMatchObject({ reason: { code: "not_enough" } });
    for (const id of Object.keys(cost)) expect(await stack(db, p, id)).toBe(0);
    expect((await raw(p))!.inventory).toHaveLength(2);
  });
  it("parallel salvage and replay cannot consume or pay for the same item twice", async () => {
    const p = await fresh(); const [a] = await insert(p); const using = racing();
    const rs = await Promise.allSettled([salvageV2(using, p, { itemIds: [a!.id] }), salvageV2(using, p, { itemIds: [a!.id] })]);
    expect(fulfilled(rs)).toHaveLength(1);
    expect(rs.find(r => r.status === "rejected")).toMatchObject({ reason: { code: "not_owner" } });
    const paid = (await raw(p))!.stacks;
    await expect(salvageV2(deps, p, { itemIds: [a!.id] })).rejects.toMatchObject({ code: "not_owner" });
    expect((await raw(p))!.stacks).toEqual(paid);
    for (const [id, qty] of Object.entries(v2.salvage(a!))) expect(await stack(db, p, id)).toBe(qty);
  });
  it("parallel equips in one slot finish with exactly one requested item; replay is stable", async () => {
    const p = await fresh(); const [a, b] = await insert(p); const using = racing();
    await Promise.all([equipV2(using, p, { itemId: a!.id, slot: "helmet" }), equipV2(using, p, { itemId: b!.id, slot: "helmet" })]);
    const equipped = (await raw(p))!.inventory.filter(i => i.slot === "helmet" && i.equipped);
    expect(equipped).toHaveLength(1); expect([a!.id, b!.id]).toContain(equipped[0]!.id);
    await equipV2(deps, p, { itemId: equipped[0]!.id, slot: "helmet" });
    expect((await raw(p))!.inventory.filter(i => i.slot === "helmet" && i.equipped)).toEqual(equipped);
  });
  it("parallel forges and retry return one signed voucher, stable nonce, one resource spend", async () => {
    const p = await fresh(); await setStacks(db, p, v2.RELIC_RECIPE.materials); const using = racing();
    const [a, b] = await Promise.all([forgeRelicV2(using, p), forgeRelicV2(using, p)]);
    expect(a.voucher).toEqual(b.voucher); expect((await forgeRelicV2(deps, p)).voucher).toEqual(a.voucher);
    expect(await count(db, "select 1 from relic_forges where player_id = $1", p)).toBe(1);
    expect(await count(db, "select 1 from relic_vouchers where player_id = $1", p)).toBe(1);
    expect(await stack(db, p, "yarn")).toBe(0); expect(await stack(db, p, "moonPearl")).toBe(0);
    const q = await fresh(); await setStacks(db, q, v2.RELIC_RECIPE.materials);
    const other = await forgeRelicV2(deps, q);
    expect(other.voucher.nonce).not.toBe(a.voucher.nonce); expect(other.voucher.player).not.toBe(a.voucher.player);
  });
  it("parallel class selection of the same class grants only one starter", async () => {
    const p = await newPlayer(db); await getStateV2(deps, p); const using = racing();
    await Promise.all([chooseClassV2(using, p, { classId: "warrior" }), chooseClassV2(using, p, { classId: "warrior" })]);
    expect((await raw(p))!.inventory).toHaveLength(1);
  });
  it("replayed lock sets a value rather than toggling it", async () => {
    const p = await fresh(); const [a] = await insert(p);
    await Promise.all([lockV2(deps, p, { itemId: a!.id, locked: true }), lockV2(deps, p, { itemId: a!.id, locked: true })]);
    expect((await raw(p))!.inventory.find(i => i.id === a!.id)?.locked).toBe(true);
    await expect(salvageV2(deps, p, { itemIds: [a!.id] })).rejects.toMatchObject({ code: "locked" });
  });
  // Explicit expected failures retain the desired invariants. Fixing these durably needs an
  // approved SQL migration, outside S2. A future fix makes Vitest fail until .fails is removed.
  it.fails("PROPOSAL: replaying a funded craft must reuse the original result rather than charge again", async () => {
    const p = await fresh(); await setStacks(db, p, Object.fromEntries(Object.entries(cost).map(([id, qty]) => [id, qty * 2])));
    const first = await craftV2(deps, p, craftBody);
    const retry = await craftV2(deps, p, craftBody);
    expect(retry.item.id).toBe(first.item.id);
  });
  it.fails("PROPOSAL: a lost boss response replay must not spend another key on a rematch", async () => {
    const p = await readyBoss(); await setStacks(db, p, { catKey: v2.V2_CONFIG.boss.keyCost * 2 });
    await fightBossV2(deps, p, { chapter: 1 });
    await fightBossV2(deps, p, { chapter: 1 });
    expect((await raw(p))!.fights).toBe(1);
  });
  it.fails("PROPOSAL: an equip after combat snapshot must invalidate that boss result", async () => {
    const p = await readyBoss(); const before = (await raw(p))!;
    await equipV2(deps, p, { itemId: null, slot: "weapon" });
    expect(await store.bossFight({ playerId: p, chapter: 1, expectedRev: before.progressRev, fightNo: before.fights, won: true,
      keyCost: v2.V2_CONFIG.boss.keyCost, cooldownS: v2.V2_CONFIG.boss.lossCooldownSeconds, chest: { first: { stacks: {}, items: [] }, rematch: { stacks: {}, items: [] } },
      bagLimit: v2.V2_CONFIG.bag.limit, caps: v2.STACK_CAPS_V2, bossRound: chapter.roundsPerChapter })).toMatchObject({ error: "stale" });
  });
  it.fails("PROPOSAL: reject salvage of an unequipped starter so class switching cannot farm free materials", async () => {
    const p = await fresh();
    const starter = (await raw(p))!.inventory[0]!;
    await chooseClassV2(deps, p, { classId: "archer" });
    const before = (await raw(p))!;
    await expect(salvageV2(deps, p, { itemIds: [starter.id] })).rejects.toMatchObject({ code: "invalid_request" });
    expect((await raw(p))!.stacks).toEqual(before.stacks);
    await chooseClassV2(deps, p, { classId: "warrior" });
    expect((await raw(p))!.inventory.filter(i => i.weaponType === "sword")).toHaveLength(1);
  });
});
