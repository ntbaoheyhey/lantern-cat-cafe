import type { PGlite } from "@electric-sql/pglite";
import { createHmac } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { v2 } from "@taskbar-hero/game-rules";
import type { ServerStateV2 } from "../../../apps/web/src/api/GameApiV2.ts";
import { HTTP_STATUS_V2 as CLIENT_STATUS } from "../../../apps/web/src/api/GameApiV2.ts";
import { GameError, dayDate } from "../../functions/_shared/game.ts";
import { getStateV2, chooseClassV2, claimV2, equipV2, routesV2, type V2Deps } from "../../functions/_shared/v2/game.ts";
import { handlerV2, HTTP_STATUS_V2, V2Error } from "../../functions/_shared/v2/http.ts";
import { toPlayerStateV2 } from "../../functions/_shared/v2/snapshot.ts";
import { v2ClaimSeed, v2BossSeed, v2CraftSeed } from "../../functions/_shared/v2/seeds.ts";
import { migratedDb } from "../src/game-db.ts";
import { call, item, newPlayer, setStacks, stack } from "./helpers.ts";
import { pgliteV2Store } from "./v2-store.ts";

let db: PGlite;
let clock = Date.UTC(2026, 10, 1);
const store = pgliteV2Store(() => db);
const deps: V2Deps = { store, seedSecret: "test-seed-secret", now: () => clock };
const unknown = "00000000-0000-4000-8000-0000000000ff";
beforeAll(async () => { db = await migratedDb(); });
afterAll(async () => { await db.close(); });
async function fresh(chosen = true) {
  const p = await newPlayer(db);
  await getStateV2(deps, p);
  if (chosen) await chooseClassV2(deps, p, { classId: "warrior" });
  const raw = (await store.snapshot(p, dayDate(clock / 1000)))!;
  clock = raw.lastClaimMicros / 1000 + 600_000;
  return p;
}
async function raw(p: string) { return (await store.snapshot(p, dayDate(clock / 1000)))!; }
async function insert(p: string, slot: string, extra = {}) {
  const result = await call(db, `public.v2_claim($1, $2, $3, $4, '{}'::jsonb, '{}'::jsonb, $5::jsonb, $6::jsonb, $7, null)`,
    [p, (await raw(p)).lastClaimMicros, (await raw(p)).progressRev, new Date(clock).toISOString(), JSON.stringify(v2.STACK_CAPS_V2), JSON.stringify([item(slot, "common", extra)]), v2.V2_CONFIG.bag.limit]);
  return result!.items[0].id as string;
}

describe("v2 Edge Function logic over migrated SQL", () => {
  it("returns a complete typed new-player state and rejects unknown players", async () => {
    const p = await fresh(false);
    const s: ServerStateV2 = await getStateV2(deps, p);
    expect(s.cat.classId).toBeNull();
    expect(Object.values(s.equipped)).toEqual(Array(9).fill(null));
    expect(s.bagLimit).toBe(v2.V2_CONFIG.bag.limit);
    expect(s.bosses.chapters).toHaveLength(5);
    expect(s.forge).toEqual({ blockedBy: "not_enough_yarn", forgedToday: false, pending: null, today: null });
    await expect(getStateV2(deps, unknown)).rejects.toMatchObject({ code: "not_found" });
    expect(HTTP_STATUS_V2).toEqual(CLIENT_STATUS);
    expect(Object.keys(routesV2(deps))).toEqual(["v2-state", "v2-claim", "v2-equip", "v2-choose-class", "v2-craft", "v2-salvage", "v2-lock", "v2-relic-forge", "v2-boss-fight"]);
  });
  it("requires a class and chooses a registry starter only once", async () => {
    const p = await fresh(false);
    await expect(claimV2(deps, p)).rejects.toMatchObject({ code: "no_class" });
    await expect(equipV2(deps, p, { itemId: null, slot: "weapon" })).rejects.toMatchObject({ code: "no_class" });
    const s = await chooseClassV2(deps, p, { classId: "warrior" });
    expect(s.inventory).toHaveLength(1);
    expect(s.inventory[0]).toMatchObject({ itemKey: "wpn.sword.twig", equipped: true });
    expect((await chooseClassV2(deps, p, { classId: "warrior" })).inventory).toHaveLength(1);
    for (const classId of ["nope", 42, null]) await expect(chooseClassV2(deps, p, { classId })).rejects.toMatchObject({ code: "invalid_request" });
  });
  it("credits deterministic ten-minute gains, grants the daily key, and does not write under ten seconds", async () => {
    const p = await fresh();
    const before = await raw(p);
    const state = toPlayerStateV2(before);
    const seed = await v2ClaimSeed(deps.seedSecret, p, before.lastClaimMicros);
    const expected = v2.computeClaimV2(v2.claimInputV2(state, { today: dayDate(clock / 1000), offline: false }), 600, seed);
    const r = await claimV2(deps, p);
    expect(r.gains.xp).toBeGreaterThan(0);
    expect(r.gains.fish).toBeGreaterThan(0);
    expect(r.gains.fish).toBe(expected.stackDeltas.fish);
    expect(r.gains.keys).toBe(1);
    expect(r.state.currencies.keys).toBe(1);
    const last = (await raw(p)).lastClaimMicros;
    clock += 5000;
    expect((await claimV2(deps, p)).gains).toEqual({ ...v2.lootViewV2({}, [], []), xp: 0, levelsGained: 0 });
    expect((await raw(p)).lastClaimMicros).toBe(last);
    const sqlLast = (await db.query<{ micros: string }>(`select public.game_epoch_micros(last_claim_at)::text micros from cat_state where player_id = $1`, [p])).rows[0]!.micros;
    expect(Number(sqlLast)).toBe(last);
  });
  it("credits a parallel claim once", async () => {
    const p = await fresh();
    const results = await Promise.all([claimV2(deps, p), claimV2(deps, p)]);
    expect(results.filter(r => r.gains.fish > 0)).toHaveLength(1);
    expect(await stack(db, p, "fish")).toBe(results.reduce((sum, r) => sum + r.gains.fish, 0));
  });
  it("recomputes once with the new snapshot and seed, then refuses a second stale write", async () => {
    const p = await fresh();
    const old = await raw(p);
    const claim = vi.fn().mockImplementationOnce(async () => {
      await db.query(`update cat_state set last_claim_at = last_claim_at + interval '10 seconds', progress_rev = progress_rev + 1 where player_id = $1`, [p]);
      return null;
    }).mockImplementation(store.claim);
    const r = await claimV2({ ...deps, store: { ...store, claim } }, p);
    expect(r.gains.fish).toBeGreaterThan(0);
    expect(claim).toHaveBeenCalledTimes(2);
    expect(claim.mock.calls[1]![0]).toMatchObject({ expectedLastMicros: old.lastClaimMicros + 10_000_000, expectedRev: old.progressRev + 1 });
    clock += 600_000;
    const stale = vi.fn().mockResolvedValue(null);
    await expect(claimV2({ ...deps, store: { ...store, claim: stale } }, p)).rejects.toMatchObject({ code: "stale" });
    expect(stale).toHaveBeenCalledTimes(2);
    const poor = vi.fn().mockResolvedValue({ error: "not_enough", stack: "fish" });
    await expect(claimV2({ ...deps, store: { ...store, claim: poor } }, p)).rejects.toMatchObject({ code: "not_enough", extra: { stack: "fish" } });
  });
  it("maps equipment refusals and empties the weapon slot", async () => {
    const p = await fresh();
    const weapon = (await getStateV2(deps, p)).equipped.weapon!;
    await expect(equipV2(deps, p, { itemId: unknown, slot: "weapon" })).rejects.toMatchObject({ code: "not_owner" });
    await expect(equipV2(deps, p, { itemId: weapon, slot: "helmet" })).rejects.toMatchObject({ code: "wrong_slot" });
    const ring = await insert(p, "ring");
    await expect(equipV2(deps, p, { itemId: ring, slot: "ring" })).rejects.toMatchObject({ code: "slot_locked" });
    clock += 600_000;
    const bow = await insert(p, "weapon", { weaponType: "bow" });
    await expect(equipV2(deps, p, { itemId: bow, slot: "weapon" })).rejects.toMatchObject({ code: "wrong_weapon" });
    for (const body of [{ itemId: weapon, slot: "hat" }, { itemId: "x", slot: "weapon" }, { slot: "weapon" }]) {
      await expect(equipV2(deps, p, body)).rejects.toMatchObject({ code: "invalid_request" });
    }
    expect((await equipV2(deps, p, { itemId: null, slot: "weapon" })).equipped.weapon).toBeNull();
    await expect(equipV2({ ...deps, store: { ...store, equip: async () => ({ error: "stale" }) } }, p, { itemId: weapon, slot: "weapon" })).rejects.toMatchObject({ code: "stale" });
  });
  it("returns capped SQL credits, real item ids and actual overflow salvage", async () => {
    const p = await fresh();
    await setStacks(db, p, { catKey: v2.STACK_CAPS_V2.catKey });
    await db.query(`insert into items (player_id, item_key, slot, rarity, level, source) select $1, 'helmet.test', 'helmet', 'common', 1, 'drop' from generate_series(1, $2::integer)`, [p, v2.V2_CONFIG.bag.limit - 1]);
    clock += 28_800_000;
    const r = await claimV2(deps, p);
    expect(r.gains.keys).toBe(0);
    expect(r.gains.items).toEqual([]);
    expect(r.gains.autoSalvaged.length).toBeGreaterThan(0);
    expect(r.gains.fish).toBe(r.state.currencies.fish);
    expect(r.gains.yarn).toBe(r.state.currencies.yarn);
    expect(r.gains.materials).toEqual(r.state.materials);
    const q = await fresh();
    clock += 28_800_000;
    const added = (await claimV2(deps, q)).gains.items;
    expect(added.length).toBeGreaterThan(0);
    expect(added.every(i => /^[0-9a-f-]{36}$/.test(i.id))).toBe(true);
  });
  it("builds forge reasons and signs only unsigned pending vouchers", async () => {
    const p = await fresh();
    await setStacks(db, p, { yarn: v2.RELIC_RECIPE.materials.yarn });
    expect((await getStateV2(deps, p)).forge.blockedBy).toBe("no_moon_pearl");
    await setStacks(db, p, { moonPearl: v2.RELIC_RECIPE.materials.moonPearl });
    expect((await getStateV2(deps, p)).forge.blockedBy).toBeNull();
    const day = dayDate(clock / 1000);
    await call(db, `public.v2_relic_forge($1, $2, 7, 'rare', $3, $4, $5)`, [p, day, v2.RELIC_RECIPE.materials.yarn, v2.RELIC_RECIPE.materials.moonPearl, new Date(clock + 3600_000).toISOString()]);
    expect((await getStateV2(deps, p)).forge).toMatchObject({ pending: null, forgedToday: true, blockedBy: null });
    const signature = `0x${"AB".repeat(65)}`;
    const sign = vi.fn().mockResolvedValue(signature);
    const signedDeps = { ...deps, relic: { signer: { sign, verifyingContract: "0x0000000000000000000000000000000000000000" as const } } };
    const s = await getStateV2(signedDeps, p);
    expect(s.forge.pending?.signature).toBe(signature.toLowerCase());
    expect(s.forge.today).toMatchObject({ relicId: "7", rarityName: "rare", minted: false, txHash: null });
    expect((await getStateV2(deps, p)).forge.pending).toEqual(s.forge.pending);
    await getStateV2(signedDeps, p);
    expect(sign).toHaveBeenCalledTimes(1);
    const snapshot = await raw(p);
    const state = toPlayerStateV2(snapshot, day);
    state.items[0]!.bonus.push({ stat: "hp", value: 99 });
    expect(snapshot.inventory[0]!.bonus).toEqual([]);
    expect(state.lastRelicDay).toBe(day);
    const withoutPending = { ...snapshot, pending: null };
    expect((await getStateV2({ ...deps, store: { ...store, snapshot: async () => withoutPending } }, p)).forge.blockedBy).toBe("daily_limit");
  });
  it("completes an eight-hour claim in under 500 ms", async () => {
    const p = await fresh();
    clock = (await raw(p)).lastClaimMicros / 1000 + 28_800_000;
    const start = performance.now();
    await claimV2(deps, p);
    const elapsed = performance.now() - start;
    console.log(`V9 eight-hour claim: ${elapsed.toFixed(2)} ms`);
    expect(elapsed).toBeLessThan(500);
  });
});

describe("v2 seed message contracts", () => {
  const hmac = (message: string) => createHmac("sha256", "test-seed-secret").update(message).digest().readUInt32BE(0);
  it("uses v2claim:<player>:<micros>", async () => { expect(await v2ClaimSeed(deps.seedSecret, "player", 1234567890123456)).toBe(hmac("v2claim:player:1234567890123456")); });
  it("uses v2boss:<player>:<fightNo>", async () => { expect(await v2BossSeed(deps.seedSecret, "player", 42)).toBe(hmac("v2boss:player:42")); });
  it("uses v2craft:<player>:<key>", async () => {
    expect(await v2CraftSeed(deps.seedSecret, "player", "recipe:1")).toBe(hmac("v2craft:player:recipe:1"));
    expect(await v2CraftSeed(deps.seedSecret, "player", 42)).toBe(hmac("v2craft:player:42"));
  });
});

describe("handlerV2", () => {
  const http = { authenticate: async (req: Request) => {
    if (!req.headers.get("Authorization")) throw new GameError("unauthenticated");
    return "player";
  }, json: (_req: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Access-Control-Allow-Origin": "*" } }) };
  const req = (method = "POST", body = "{}", auth = true) => new Request("https://example.test", { method,
    ...(method === "POST" ? { body } : {}), headers: auth ? { Authorization: "Bearer test" } : {} });
  const ok = handlerV2(http, async () => ({}));
  it("handles CORS, method and authentication", async () => {
    const options = await ok(req("OPTIONS"));
    expect(options.status).toBe(204); expect(await options.text()).toBe("");
    expect(options.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect((await ok(req("GET"))).status).toBe(405);
    const missing = await ok(req("POST", "{}", false));
    expect(missing.status).toBe(401); expect(await missing.json()).toEqual({ error: "unauthenticated" });
  });
  it("maps defined error extras and hides unexpected errors", async () => {
    for (const [error, expected] of [[new V2Error("not_enough", { stack: "fish", reason: undefined }), { error: "not_enough", stack: "fish" }],
      [new V2Error("cooldown", { cooldownUntil: 5 }), { error: "cooldown", cooldownUntil: 5 }]] as const) {
      const r = await handlerV2(http, async () => { throw error; })(req());
      expect(r.status).toBe(409); expect(await r.json()).toEqual(expected);
    }
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const r = await handlerV2(http, async () => { throw new Error("private detail"); })(req());
      expect(r.status).toBe(500); expect(await r.json()).toEqual({ error: "server_error" }); expect(log).toHaveBeenCalledTimes(1);
    } finally { log.mockRestore(); }
  });
  it("treats malformed JSON and non-object bodies as empty objects", async () => {
    for (const body of ["{", "null", "42", "[]", '"string"']) {
      const r = await handlerV2(http, (p, b) => equipV2(deps, p, b))(req("POST", body));
      expect(r.status).toBe(400); expect(await r.json()).toEqual({ error: "invalid_request" });
    }
  });
});
