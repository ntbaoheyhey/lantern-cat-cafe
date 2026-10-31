import type { PGlite } from "@electric-sql/pglite";
import { CONFIG, relicIdFor, rollRelicRarity, v2 } from "@taskbar-hero/game-rules";
import { verifyTypedData, type Address } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { dayDate, relicSeed } from "../../functions/_shared/game.ts";
import { REISSUE_GRACE_SECONDS, VOUCHER_TTL_SECONDS, VOUCHER_TYPES, voucherDomain, voucherSigner, type ChainReader } from "../../functions/_shared/relic.ts";
import { chooseClassV2, claimV2, getStateV2 } from "../../functions/_shared/v2/game.ts";
import { craftV2, forgeRelicV2, lockV2, salvageV2, type ForgeDepsV2 } from "../../functions/_shared/v2/forge.ts";
import { handlerV2 } from "../../functions/_shared/v2/http.ts";
import { migratedDb } from "../src/game-db.ts";
import { call, fn, item, manyItems, newPlayer, setStacks, stack } from "./helpers.ts";
import { pgliteV2Store } from "./v2-store.ts";

let db: PGlite;
let clock = Date.UTC(2026, 10, 1, 10);
const key = generatePrivateKey();
const nft: Address = "0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D";
const used = new Set<bigint>();
const chain: ChainReader = { nonceUsed: vi.fn(async nonce => used.has(nonce)), receipt: async () => null };
const store = pgliteV2Store(() => db);
const deps: ForgeDepsV2 = { store, seedSecret: "test-seed-secret", now: () => clock, relic: { signer: voucherSigner(key, nft), chain } };
const recipe = v2.RECIPES.find(r => r.id === "rcp.common")!;
const cost = { ...recipe.materials, fish: recipe.fish };
const relicCost = { ...v2.RELIC_RECIPE.materials };
const craftBody = { recipeId: recipe.id, slot: "weapon" };
const unknown = "00000000-0000-4000-8000-0000000000ff";
beforeAll(async () => { db = await migratedDb(); });
afterAll(async () => { await db.close(); });
beforeEach(() => { clock = Date.UTC(2026, 10, 1, 10); used.clear(); vi.mocked(chain.nonceUsed).mockClear(); });
async function fresh(chosen = true) {
  const p = await newPlayer(db);
  await getStateV2(deps, p);
  if (chosen) await chooseClassV2(deps, p, { classId: "warrior" });
  return p;
}
async function raw(p: string) { return (await store.snapshot(p, dayDate(clock / 1000)))!; }
async function insert(p: string, items = [item()]) {
  const before = await raw(p);
  const result = await fn(db).claim(p, { micros: before.lastClaimMicros, rev: before.progressRev, now: new Date(clock), items, bag: v2.V2_CONFIG.bag.limit });
  return result!.items as v2.ItemViewV2[];
}
async function http(fn: (p: string, body: Record<string, unknown>) => Promise<unknown>, p: string, body = {}) {
  return handlerV2({ authenticate: async () => p, json: (_req, result, status = 200) => new Response(JSON.stringify(result), { status }) }, fn)(new Request("https://example.test", { method: "POST", body: JSON.stringify(body) }));
}
const forge = (p: string) => forgeRelicV2(deps, p);
const blocked = (reason: string) => ({ code: "forge_blocked", extra: { reason } });

describe("v2 craft, salvage and lock over migrated SQL", () => {
  it("returns the first recipe shortage as HTTP 409 and spends nothing", async () => {
    const p = await fresh();
    const before = await raw(p);
    const block = v2.craftBlock({ stacks: before.stacks, lastRelicDay: -1 }, recipe.id, "weapon")!;
    const response = await http((p, b) => craftV2(deps, p, b), p, craftBody);
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "not_enough", stack: block.slice("not_enough_".length) });
    expect((await raw(p)).stacks).toEqual(before.stacks);
    await setStacks(db, p, { ...recipe.materials, fish: 0 });
    await expect(craftV2(deps, p, craftBody)).rejects.toMatchObject({ code: "not_enough", extra: { stack: "fish" } });
  });
  it("crafts a real UUID sword and pays exactly the configured recipe", async () => {
    const p = await fresh();
    await setStacks(db, p, cost);
    const r = await craftV2(deps, p, craftBody);
    expect(r.item.id).toMatch(/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/);
    expect(r.item).toMatchObject({ rarity: "common", slot: "weapon", weaponType: "sword", locked: false, equipped: false });
    expect(r.state.inventory).toContainEqual(r.item);
    for (const id of Object.keys(cost)) expect(await stack(db, p, id)).toBe(0);
  });
  it("refuses a full bag without spending", async () => {
    const p = await fresh();
    await setStacks(db, p, cost);
    await insert(p, manyItems(v2.V2_CONFIG.bag.limit - 1));
    const before = await raw(p);
    await expect(craftV2(deps, p, craftBody)).rejects.toMatchObject({ code: "bag_full" });
    expect((await raw(p)).stacks).toEqual(before.stacks);
  });
  it("checks ownership, equipment and locks atomically; returns summed salvage", async () => {
    const p = await fresh();
    const [a, b] = await insert(p, [item(), item("armor", "rare")]);
    const equipped = (await raw(p)).inventory.find(i => i.equipped)!;
    await expect(salvageV2(deps, p, { itemIds: [equipped.id] })).rejects.toMatchObject({ code: "equipped" });
    await lockV2(deps, p, { itemId: a!.id, locked: true });
    await expect(salvageV2(deps, p, { itemIds: [a!.id] })).rejects.toMatchObject({ code: "locked" });
    await expect(salvageV2(deps, p, { itemIds: [unknown] })).rejects.toMatchObject({ code: "not_owner" });
    const before = await raw(p);
    await expect(salvageV2(deps, p, { itemIds: [b!.id, unknown] })).rejects.toMatchObject({ code: "not_owner" });
    await expect(salvageV2(deps, p, { itemIds: [a!.id, equipped.id] })).rejects.toMatchObject({ code: "equipped" });
    expect((await raw(p)).inventory).toEqual(before.inventory);
    expect((await raw(p)).stacks).toEqual(before.stacks);
    await lockV2(deps, p, { itemId: a!.id, locked: false });
    const sum: Record<string, number> = {};
    for (const i of [a!, b!]) for (const [id, qty] of Object.entries(v2.salvage(i))) sum[id] = (sum[id] ?? 0) + qty;
    // Duplicate and uppercase UUIDs must not inflate credits.
    const result = await salvageV2(deps, p, { itemIds: [a!.id.toUpperCase(), b!.id, a!.id] });
    const expected = v2.lootViewV2(sum, [], []);
    expect(result.gains).toEqual({ fish: expected.fish, yarn: expected.yarn, materials: expected.materials });
    expect(result.state.inventory.map(i => i.id)).not.toContain(a!.id);
    expect(result.state.inventory.map(i => i.id)).not.toContain(b!.id);
  });
  it("craft then salvage returns less than the input per stack", async () => {
    const p = await fresh();
    await setStacks(db, p, cost);
    const crafted = await craftV2(deps, p, craftBody);
    await salvageV2(deps, p, { itemIds: [crafted.item.id] });
    const returned = (await raw(p)).stacks;
    for (const [id, amount] of Object.entries(cost)) expect(returned[id] ?? 0).toBeLessThanOrEqual(amount);
    expect(Object.entries(cost).some(([id, amount]) => (returned[id] ?? 0) < amount)).toBe(true);
  });
  it("toggles locks and refuses another player's item", async () => {
    const p = await fresh(); const q = await fresh();
    const [a] = await insert(p);
    expect((await lockV2(deps, p, { itemId: a!.id, locked: true })).inventory.find(i => i.id === a!.id)?.locked).toBe(true);
    await expect(lockV2(deps, q, { itemId: a!.id, locked: false })).rejects.toMatchObject({ code: "not_owner" });
    await expect(salvageV2(deps, p, { itemIds: [a!.id] })).rejects.toMatchObject({ code: "locked" });
    expect((await lockV2(deps, p, { itemId: a!.id, locked: false })).inventory.find(i => i.id === a!.id)?.locked).toBe(false);
  });
  it("preserves simultaneous craft and claim credits", async () => {
    const p = await fresh();
    await setStacks(db, p, cost);
    clock = (await raw(p)).lastClaimMicros / 1000 + 600_000;
    const start = await stack(db, p, "fish");
    const [, claimed] = await Promise.all([craftV2(deps, p, craftBody), claimV2(deps, p)]);
    expect(await stack(db, p, "fish")).toBe(start + claimed.gains.fish - recipe.fish);
  });
  it("rejects malformed bodies and requires a class for craft", async () => {
    const p = await fresh(false);
    for (const body of [{ recipeId: "rcp.relic" }, { recipeId: recipe.id, slot: "hat" }, {}, { recipeId: "toString", slot: "weapon" }]) {
      expect((await http((p, b) => craftV2(deps, p, b), p, body)).status).toBe(400);
    }
    for (const itemIds of ["x", [], ["not-a-uuid"], Array(v2.V2_CONFIG.bag.limit + 1).fill(unknown)]) {
      expect((await http((p, b) => salvageV2(deps, p, b), p, { itemIds })).status).toBe(400);
    }
    expect((await http((p, b) => lockV2(deps, p, b), p, { itemId: unknown })).status).toBe(400);
    await expect(craftV2(deps, p, craftBody)).rejects.toMatchObject({ code: "no_class" });
  });
  it("maps SQL refusals after prechecks without changing balances", async () => {
    const p = await fresh(); await setStacks(db, p, cost);
    for (const result of [{ error: "bag_full" }, { error: "not_enough", stack: "fish" }]) {
      await expect(craftV2({ ...deps, store: { ...store, craft: async () => result } }, p, craftBody)).rejects.toMatchObject({ code: result.error, ...(result.stack ? { extra: { stack: result.stack } } : {}) });
    }
    const [a] = await insert(p);
    await expect(salvageV2({ ...deps, store: { ...store, salvage: async () => ({ error: "locked" }) } }, p, { itemIds: [a!.id] })).rejects.toMatchObject({ code: "locked" });
    expect((await raw(p)).stacks).toEqual(cost);
  });
});

describe("v2 Relic forge shares the v1 voucher lifecycle", () => {
  it("spends the content costs, signs verifiable typed data, and returns pending without spending", async () => {
    const p = await fresh(); await setStacks(db, p, relicCost);
    const first = await forge(p);
    expect(await stack(db, p, "yarn")).toBe(0);
    expect(await stack(db, p, "moonPearl")).toBe(0);
    const v = first.voucher;
    expect(await verifyTypedData({ address: privateKeyToAccount(key).address, domain: voucherDomain(nft), types: VOUCHER_TYPES, primaryType: "Voucher",
      message: { player: v.player, relicId: BigInt(v.relicId), rarity: v.rarity, nonce: BigInt(v.nonce), expiry: BigInt(v.expiry) }, signature: v.signature })).toBe(true);
    const rarity = rollRelicRarity(await relicSeed(deps.seedSecret, p, dayDate(clock / 1000)));
    expect(v.rarityName).toBe(rarity); expect(v.relicId).toBe(String(relicIdFor(rarity)));
    expect((await forge(p)).voucher).toEqual(v);
    expect((await raw(p)).stacks).toEqual({ yarn: 0, moonPearl: 0 });
    expect(chain.nonceUsed).not.toHaveBeenCalled();
    clock = (v.expiry + REISSUE_GRACE_SECONDS) * 1000;
    expect((await forge(p)).voucher).toEqual(v);
    expect(chain.nonceUsed).not.toHaveBeenCalled();
  });
  it("refuses pearl and yarn shortages in the SQL check order", async () => {
    const p = await fresh(); await setStacks(db, p, { yarn: relicCost.yarn });
    await expect(forge(p)).rejects.toMatchObject(blocked("no_moon_pearl"));
    await setStacks(db, p, { yarn: relicCost.yarn! - 1, moonPearl: relicCost.moonPearl });
    await expect(forge(p)).rejects.toMatchObject(blocked("not_enough_yarn"));
    expect(await stack(db, p, "yarn")).toBe(relicCost.yarn! - 1);
  });
  it("returns a live v1 pending voucher, then blocks once that v1 forge is minted", async () => {
    const p = await fresh(); await setStacks(db, p, relicCost);
    const day = dayDate(clock / 1000);
    await db.query(`insert into idle_state (player_id, shards) values ($1, $2)`, [p, CONFIG.relic.shardCost]);
    await db.query(`insert into boss_keys (player_id, day) values ($1, $2)`, [p, day]);
    const v1 = await call(db, `public.game_forge($1, $2, $3, $4, $5, $6, $7)`, [p, day, relicIdFor("rare"), "rare", CONFIG.relic.shardCost, CONFIG.relic.bossKeyCost, new Date(clock + VOUCHER_TTL_SECONDS * 1000).toISOString()]);
    expect(v1!.status).toBe("new");
    expect((await forge(p)).voucher.nonce).toBe(v1!.voucher.nonce);
    expect((await raw(p)).stacks).toEqual(relicCost);
    await store.voucherMinted(p, v1!.voucher.nonce, null);
    await expect(forge(p)).rejects.toMatchObject(blocked("daily_limit"));
    expect((await raw(p)).stacks).toEqual(relicCost);
  });
  it("reissues an expired unused nonce with the same Relic and no extra spend", async () => {
    const p = await fresh(); await setStacks(db, p, relicCost);
    const first = (await forge(p)).voucher;
    clock = (first.expiry + REISSUE_GRACE_SECONDS + 1) * 1000;
    const next = (await forge(p)).voucher;
    expect(chain.nonceUsed).toHaveBeenCalledWith(BigInt(first.nonce));
    expect(next.nonce).not.toBe(first.nonce);
    expect(next).toMatchObject({ relicId: first.relicId, rarityName: first.rarityName, rarity: first.rarity });
    expect(next.expiry).toBe(Math.floor(clock / 1000) + VOUCHER_TTL_SECONDS);
    expect((await raw(p)).stacks).toEqual({ yarn: 0, moonPearl: 0 });
    expect((await db.query<{ status: string }>(`select status from relic_vouchers where nonce = $1`, [first.nonce])).rows[0]!.status).toBe("expired");
  });
  it("records an expired used voucher minted before applying the daily limit", async () => {
    const p = await fresh(); await setStacks(db, p, relicCost);
    const first = (await forge(p)).voucher;
    used.add(BigInt(first.nonce)); clock = (first.expiry + REISSUE_GRACE_SECONDS + 1) * 1000;
    await expect(forge(p)).rejects.toMatchObject(blocked("daily_limit"));
    expect((await db.query<{ status: string; tx_hash: string | null }>(`select status, tx_hash from relic_vouchers where nonce = $1`, [first.nonce])).rows[0]).toEqual({ status: "minted", tx_hash: null });
  });
  it("keeps a competing unsigned replacement recoverable until its interrupted check can resume", async () => {
    const p = await fresh(); await setStacks(db, p, relicCost);
    const first = (await forge(p)).voucher;
    clock = (first.expiry + REISSUE_GRACE_SECONDS + 1) * 1000;
    const competing = vi.fn(async (...args: Parameters<typeof store.voucherReissue>) => { await store.voucherReissue(...args); return null; });
    const relicForge = vi.fn(store.relicForge);
    await expect(forgeRelicV2({ ...deps, store: { ...store, voucherReissue: competing, relicForge } }, p)).rejects.toMatchObject({ code: "server_error" });
    expect((await getStateV2(deps, p)).forge.pending).toMatchObject({ signature: null, recoverable: true });
    clock += (REISSUE_GRACE_SECONDS + 1) * 1000;
    const next = await forgeRelicV2(deps, p);
    expect(next.voucher.nonce).not.toBe(first.nonce);
    expect(next.voucher.relicId).toBe(first.relicId);
    expect(competing).toHaveBeenCalledOnce(); expect(relicForge).not.toHaveBeenCalled();
  });
  it("refuses missing configuration before spending or creating a voucher", async () => {
    const p = await fresh(); await setStacks(db, p, relicCost);
    const response = await http(p => forgeRelicV2({ ...deps, relic: { chain } }, p), p);
    expect(response.status).toBe(500); expect(await response.json()).toEqual({ error: "server_error" });
    expect((await raw(p)).pending).toBeNull(); expect((await raw(p)).stacks).toEqual(relicCost);
  });
  it("uses actual SQL capped salvage credits", async () => {
    const p = await fresh(); const [a] = await insert(p);
    await setStacks(db, p, { yarn: v2.STACK_CAPS_V2.yarn });
    const result = await salvageV2(deps, p, { itemIds: [a!.id] });
    expect(result.gains.yarn).toBe(0);
    expect(result.state.currencies.yarn).toBe(v2.STACK_CAPS_V2.yarn);
  });
});
