import { withConfigV2 } from "../../../packages/game-rules/src/v2/sim/config.ts";
import type { PGlite } from "@electric-sql/pglite";
import { deriveSeed, v2 } from "@taskbar-hero/game-rules";
import type { BossFightResultV2 } from "../../../apps/web/src/api/GameApiV2.ts";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { dayDate, GameError } from "../../functions/_shared/game.ts";
import { fightBossV2 } from "../../functions/_shared/v2/boss.ts";
import { chooseClassV2, getStateV2, type V2Deps } from "../../functions/_shared/v2/game.ts";
import { handlerV2 } from "../../functions/_shared/v2/http.ts";
import { v2BossSeed } from "../../functions/_shared/v2/seeds.ts";
import { toPlayerStateV2 } from "../../functions/_shared/v2/snapshot.ts";
import { migratedDb } from "../src/game-db.ts";
import { fn, manyItems, newPlayer, readyForBoss, setStacks, stack } from "./helpers.ts";
import { pgliteV2Store } from "./v2-store.ts";

let db: PGlite;
let clock = Date.now();
const store = pgliteV2Store(() => db);
const deps: V2Deps = { store, seedSecret: "test-seed-secret", now: () => clock };
const chapter = v2.CHAPTERS[0]!;
const body = { chapter: chapter.index };
const unknown = "00000000-0000-4000-8000-0000000000ff";
beforeAll(async () => { db = await migratedDb(); });
afterAll(async () => { await db.close(); });
// SQL cooldowns use now(), so the injected clock follows wall time for each test.
beforeEach(() => { clock = Date.now(); });
async function raw(p: string) { return (await store.snapshot(p, dayDate(Math.floor(clock / 1000))))!; }
async function fresh(chosen = true) {
  const p = await newPlayer(db);
  await getStateV2(deps, p);
  if (chosen) await chooseClassV2(deps, p, { classId: "warrior" });
  return p;
}
async function ready(strong = false, keys: number = v2.V2_CONFIG.boss.keyCost) {
  const p = await fresh();
  await readyForBoss(db, p, keys);
  // readyForBoss does not fill the kills required by applyBossResult.
  await db.query(`update cat_state set round = $2, kills = $3, level = $4 where player_id = $1`,
    [p, chapter.roundsPerChapter, chapter.killsPerRound, strong ? v2.V2_CONFIG.cat.maxLevel : 1]);
  return p;
}
async function simulation(p: string) {
  const before = await raw(p);
  const state = toPlayerStateV2(before);
  const classId = state.classId!;
  const stats = v2.deriveStats({ classId, level: state.level }, v2.claimInputV2(state, { today: dayDate(Math.floor(clock / 1000)), offline: false }).equipped);
  const seed = await v2BossSeed(deps.seedSecret, p, before.fights);
  return { before, stats, seed, result: v2.simulateBossV2(stats, classId, v2.bossOfChapter(chapter.index), seed) };
}
async function fight(p: string, using = deps) {
  const start = performance.now();
  try { return await fightBossV2(using, p, body); }
  finally { console.log(`V10 PGlite fight ${p}: ${(performance.now() - start).toFixed(2)} ms`); }
}
function endpoint(p: string, using = deps) {
  return handlerV2({ authenticate: async req => {
    if (!/^Bearer\s+\S+$/i.test(req.headers.get("Authorization") ?? "")) throw new GameError("unauthenticated");
    return p;
  }, json: (_req, result, status = 200) => new Response(JSON.stringify(result), { status }) },
  (player, b) => fightBossV2(using, player, b));
}
const request = (method = "POST", content = JSON.stringify(body), auth = true) => new Request("https://example.test", {
  method, ...(method === "POST" ? { body: content } : {}), headers: auth ? { Authorization: "Bearer test" } : {},
});
async function audit(p: string) {
  return (await db.query<{ fight_no: number; won: boolean; key_spent: boolean; chest: { added: v2.StacksV2; salvaged: v2.StacksV2; items: v2.ItemViewV2[]; autoSalvaged: v2.AutoSalvagedViewV2[] } }>(
    `select fight_no, won, key_spent, chest from boss_fights where player_id = $1 order by fight_no`, [p])).rows;
}
async function wins(p: string) {
  return (await db.query<{ chapter: number; wins: number }>(`select chapter, wins from boss_clears where player_id = $1 order by chapter`, [p])).rows;
}

describe("v2 boss Edge Function over migrated SQL", () => {
  it("commits exactly one parallel first clear and refuses the other as stale", async () => {
    const p = await ready(true);
    const expected = await simulation(p);
    // Max configured cat level + the registry starter wins with fightsBefore=0.
    expect(expected.before.fights).toBe(0); expect(expected.result.won).toBe(true);
    // Hold both initial snapshots until both readers have the same CAS values.
    let arrivals = 0;
    let release!: () => void;
    const both = new Promise<void>(resolve => { release = resolve; });
    const snapshot: typeof store.snapshot = async (...args) => {
      const result = await store.snapshot(...args);
      if (arrivals < 2) { if (++arrivals === 2) release(); await both; }
      return result;
    };
    const racing = { ...deps, store: { ...store, snapshot } };
    const results = await Promise.allSettled([fight(p, racing), fight(p, racing)]);
    const successes = results.filter(r => r.status === "fulfilled");
    const failures = results.filter(r => r.status === "rejected");
    expect(successes).toHaveLength(1); expect(failures).toHaveLength(1);
    if (successes[0]!.status !== "fulfilled" || failures[0]!.status !== "rejected") throw new Error("race results");
    const r: BossFightResultV2 = successes[0]!.value;
    expect(r).toMatchObject({ won: true, keySpent: true, chest: { autoSalvaged: [] } });
    expect(failures[0]!.reason).toMatchObject({ code: "stale" });
    expect(await stack(db, p, "catKey")).toBe(r.chest!.keys);
    const rolled = v2.rollChestV2({ chapter: chapter.index, firstClear: true, classId: "warrior", level: expected.before.level }, deriveSeed(expected.seed, 1));
    expect(r.chest).toEqual({ ...v2.lootViewV2(rolled.stackDeltas, rolled.items, []),
      items: rolled.items.map(item => ({ ...v2.itemViewV2(item), source: "chest", id: expect.any(String) })) });
    expect(await wins(p)).toEqual([{ chapter: chapter.index, wins: 1 }]);
    expect(await audit(p)).toEqual([expect.objectContaining({ won: true, key_spent: true })]);
    expect(r.state.progress).toMatchObject({ chapter: chapter.index + 1, round: 1, kills: 0 });
    expect((await raw(p)).fights).toBe(expected.before.fights + 1);
  });

  it("keeps the key on a weak-cat loss and returns the stored cooldown through HTTP", async () => {
    const p = await ready();
    const expected = await simulation(p);
    expect(expected.before.fights).toBe(0); expect(expected.result.won).toBe(false);
    const r = await fight(p);
    expect(r.won).toBe(false); expect(r.keySpent).toBe(false); expect(r).not.toHaveProperty("chest");
    expect(await stack(db, p, "catKey")).toBe(v2.V2_CONFIG.boss.keyCost);
    const stored = (await raw(p)).cooldownUntil!;
    expect(r.state.bosses.cooldownUntil).toBe(stored);
    expect(Math.abs(stored - (Math.floor(clock / 1000) + v2.V2_CONFIG.boss.lossCooldownSeconds))).toBeLessThanOrEqual(5);
    const response = await endpoint(p)(request());
    expect(response.status).toBe(409); expect(await response.json()).toEqual({ error: "cooldown", cooldownUntil: stored });
    expect((await raw(p)).fights).toBe(expected.before.fights + 1);
    expect(await audit(p)).toEqual([expect.objectContaining({ won: false, key_spent: false, chest: null })]);
    expect(await wins(p)).toEqual([]);
  });

  it("refuses unreached rounds and insufficient kills before missing keys, without writing", async () => {
    for (const [round, kills] of [[chapter.roundsPerChapter - 1, chapter.killsPerRound], [chapter.roundsPerChapter, chapter.killsPerRound - 1]]) {
      const p = await ready(false, 0);
      await db.query(`update cat_state set round = $2, kills = $3 where player_id = $1`, [p, round, kills]);
      const before = await raw(p);
      await expect(fight(p)).rejects.toMatchObject({ code: "not_reached" });
      const after = await raw(p);
      expect(after.fights).toBe(before.fights); expect(after.progressRev).toBe(before.progressRev);
      expect(after.stacks).toEqual(before.stacks); expect(await audit(p)).toEqual([]);
    }
  });

  it("refuses no_key at a reached boss without writing", async () => {
    const p = await ready(false, 0);
    const before = await raw(p);
    await expect(fight(p)).rejects.toMatchObject({ code: "no_key" });
    expect((await raw(p)).fights).toBe(before.fights);
    expect(await audit(p)).toEqual([]); expect(await stack(db, p, "catKey")).toBe(0);
  });

  it("refuses missing players and no_class before cooldown, reach and keys", async () => {
    await expect(fight(unknown)).rejects.toMatchObject({ code: "not_found" });
    const p = await fresh(false);
    await db.query(`update cat_state set boss_cooldown_until = now() + $2 * interval '1 second' where player_id = $1`, [p, v2.V2_CONFIG.boss.lossCooldownSeconds]);
    await expect(fight(p)).rejects.toMatchObject({ code: "no_class" });
    expect((await raw(p)).fights).toBe(0); expect(await audit(p)).toEqual([]);
  });

  it("checks cooldown before not_reached and no_key without invoking the write", async () => {
    const p = await ready(false, 0);
    await db.query(`update cat_state set round = 1, boss_cooldown_until = now() + $2 * interval '1 second' where player_id = $1`, [p, v2.V2_CONFIG.boss.lossCooldownSeconds]);
    const bossFight = vi.fn(store.bossFight);
    await expect(fight(p, { ...deps, store: { ...store, bossFight } })).rejects.toMatchObject({ code: "cooldown", extra: { cooldownUntil: (await raw(p)).cooldownUntil } });
    expect(bossFight).not.toHaveBeenCalled(); expect(await audit(p)).toEqual([]);
  });

  it("rejects invalid chapters before loading state", async () => {
    const snapshot = vi.fn(store.snapshot);
    for (const invalid of [{ chapter: 0 }, { chapter: v2.CHAPTERS.length + 1 }, { chapter: "x" }, { chapter: 1.5 }, {}]) {
      await expect(fightBossV2({ ...deps, store: { ...store, snapshot } }, unknown, invalid)).rejects.toMatchObject({ code: "invalid_request" });
    }
    expect(snapshot).not.toHaveBeenCalled();
  });

  it("returns the exact seeded timeline, nonnegative HP and D2 boss flags", async () => {
    const p = await ready();
    const expected = await simulation(p);
    const r = await fight(p);
    expect(r.timeline).toEqual(v2.timelineViewV2(expected.result.log));
    expect(r.timeline.at(-1)!.type).toBe("end");
    for (const event of r.timeline) {
      if (event.catHp !== undefined) expect(event.catHp).toBeGreaterThanOrEqual(0);
      if (event.bossHp !== undefined) expect(event.bossHp).toBeGreaterThanOrEqual(0);
      if (event.type === "boss_windup" || event.type === "boss_impact") expect(typeof event.big).toBe("boolean");
      if (event.type === "boss_impact") {
        expect(typeof event.dodged).toBe("boolean");
        if (event.dodged) expect(event.damage).toBe(0);
      }
      expect(Object.values(event).every(value => value !== undefined)).toBe(true);
    }
    expect(r.timeline.some(event => event.type === "boss_windup")).toBe(true);
    expect(r.timeline.some(event => event.type === "boss_impact")).toBe(true);
    console.log(`V10 D2 sample: ${JSON.stringify(r.timeline.filter(event => event.type === "boss_windup" || event.type === "boss_impact").slice(0, 2))}`);
  });

  it("derives distinct player seeds and repeats the same player/fights timeline", async () => {
    const p = await ready(); const q = await ready();
    const a = await simulation(p); const b = await simulation(q);
    expect(a.before.fights).toBe(b.before.fights); expect(a.stats).toEqual(b.stats); expect(a.seed).not.toBe(b.seed);
    const repeated = await v2BossSeed(deps.seedSecret, p, a.before.fights);
    expect(repeated).toBe(a.seed);
    expect(v2.simulateBossV2(a.stats, "warrior", v2.bossOfChapter(chapter.index), repeated).log).toEqual(a.result.log);
  });

  it("uses the rematch chest under the SQL lock and preserves progress", async () => {
    const p = await ready(true);
    expect((await fight(p)).won).toBe(true);
    await setStacks(db, p, { catKey: v2.V2_CONFIG.boss.keyCost });
    const before = await simulation(p);
    const rolled = v2.rollChestV2({ chapter: chapter.index, firstClear: false, classId: "warrior", level: before.before.level }, deriveSeed(before.seed, 2));
    const r = await fight(p);
    expect(r.won).toBe(true); expect(r.keySpent).toBe(true);
    expect(r.state.progress).toMatchObject({ chapter: before.before.chapter, round: before.before.round, kills: before.before.kills });
    expect((await raw(p)).progressRev).toBe(before.before.progressRev);
    expect(await wins(p)).toEqual([{ chapter: chapter.index, wins: 2 }]);
    const rows = await audit(p);
    expect(rows).toHaveLength(2);
    expect(rows[1]!.chest).toEqual({ added: rolled.stackDeltas, salvaged: {}, autoSalvaged: [],
      items: rolled.items.map(item => ({ ...v2.itemViewV2(item), source: "chest", id: expect.any(String) })) });
    expect(r.chest).toEqual({ ...v2.lootViewV2(rolled.stackDeltas, rolled.items, []), items: rows[1]!.chest.items });
  });

  it("auto-salvages every chest item at the configured bag limit and returns actual credits", async () => {
    const p = await ready(true);
    const before = await raw(p);
    await fn(db).claim(p, { micros: before.lastClaimMicros, rev: before.progressRev, now: new Date(before.lastClaimMicros / 1000 + 10_000),
      items: manyItems(v2.V2_CONFIG.bag.limit - before.inventory.length), bag: v2.V2_CONFIG.bag.limit });
    const expected = await simulation(p);
    const roll = v2.rollChestV2({ chapter: chapter.index, firstClear: true, classId: "warrior", level: expected.before.level }, deriveSeed(expected.seed, 1));
    const r = await fight(p);
    expect(r.won).toBe(true); expect(r.chest!.autoSalvaged.length).toBeGreaterThan(0);
    expect(r.chest!.autoSalvaged).toHaveLength(roll.items.length);
    expect(r.chest!.items).toEqual([]); expect(r.state.inventory).toHaveLength(v2.V2_CONFIG.bag.limit);
    const saved = (await audit(p))[0]!.chest;
    const credited: v2.StacksV2 = { ...saved.added };
    for (const [id, qty] of Object.entries(saved.salvaged)) {
      const key = id as v2.StateStackIdV2;
      credited[key] = (credited[key] ?? 0) + qty;
    }
    expect(r.chest).toEqual({ ...v2.lootViewV2(credited, [], []), autoSalvaged: saved.autoSalvaged });
    expect(r.chest!.fish).toBe(r.state.currencies.fish);
    expect(r.chest!.yarn).toBe(r.state.currencies.yarn);
    expect(r.chest!.materials).toEqual(r.state.materials);
  });

  it("maps SQL refusals, includes SQL cooldown extras and never retries stale", async () => {
    const p = await ready(true);
    const before = await raw(p);
    for (const error of ["stale", "cooldown", "not_reached", "no_key", "not_found", "unknown_sql_error"]) {
      const cooldownUntil = Math.floor(clock / 1000) + v2.V2_CONFIG.boss.lossCooldownSeconds;
      const bossFight = vi.fn().mockResolvedValue({ error, ...(error === "cooldown" ? { cooldownUntil } : {}) });
      await expect(fight(p, { ...deps, store: { ...store, bossFight } })).rejects.toMatchObject({
        code: error === "unknown_sql_error" ? "server_error" : error, extra: error === "cooldown" ? { cooldownUntil } : {},
      });
      expect(bossFight).toHaveBeenCalledOnce();
      expect(bossFight.mock.calls[0]![0]).toMatchObject({ playerId: p, chapter: chapter.index, expectedRev: before.progressRev, fightNo: before.fights,
        keyCost: v2.V2_CONFIG.boss.keyCost, cooldownS: v2.V2_CONFIG.boss.lossCooldownSeconds, bagLimit: v2.V2_CONFIG.bag.limit,
        caps: v2.STACK_CAPS_V2, bossRound: chapter.roundsPerChapter });
    }
    expect((await raw(p)).fights).toBe(before.fights); expect(await audit(p)).toEqual([]);
  });

  it("enforces GET/auth and validates malformed HTTP bodies", async () => {
    const p = await ready(); const handle = endpoint(p);
    expect((await handle(request("GET"))).status).toBe(405);
    const missing = await handle(request("POST", JSON.stringify(body), false));
    expect(missing.status).toBe(401); expect(await missing.json()).toEqual({ error: "unauthenticated" });
    for (const malformed of ["{", "null", "[]", "42", JSON.stringify({ chapter: "x" })]) {
      const response = await handle(request("POST", malformed));
      expect(response.status).toBe(400); expect(await response.json()).toEqual({ error: "invalid_request" });
    }
    expect((await raw(p)).fights).toBe(0);
  });
});


describe("key-wall lever through HTTP and migrated SQL", () => {
  it.each([0, 1])("keeps the no-key wall with firstClearKeys=%i and writes nothing", async (firstClearKeys) => {
    const p = await ready(true, 0);
    const before = await raw(p);
    const bossFight = vi.fn(store.bossFight);
    const response = await withConfigV2({ boss: { firstClearKeys } }, async () => {
      const response = await endpoint(p, { ...deps, store: { ...store, bossFight } })(request());
      expect(v2.V2_CONFIG.boss.firstClearKeys).toBe(firstClearKeys);
      return response;
    });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "no_key" });
    expect(bossFight).not.toHaveBeenCalled();
    // serverTime is wall-clock seconds and can tick between the two snapshots.
    expect({ ...(await raw(p)), serverTime: 0 }).toEqual({ ...before, serverTime: 0 });
    expect(await audit(p)).toEqual([]);
    expect(await wins(p)).toEqual([]);
  });

  it.each([0, 1])("grants %i first-clear key, spends before credit, and never refunds rematches", async (firstClearKeys) => {
    const original = v2.V2_CONFIG.boss.firstClearKeys;
    const p = await ready(true, 1);
    await withConfigV2({ boss: { firstClearKeys } }, async () => {
      const before = await simulation(p);
      expect(before.result.won).toBe(true);
      const base = v2.rollChestV2({ chapter: 1, firstClear: true, classId: "warrior", level: before.before.level }, deriveSeed(before.seed, 1));
      const response = await endpoint(p)(request());
      expect(response.status).toBe(200);
      const result = await response.json() as BossFightResultV2;
      expect(result).toMatchObject({ won: true, keySpent: true, chest: { keys: firstClearKeys },
        state: { currencies: { keys: firstClearKeys }, progress: { chapter: 2, round: 1, kills: 0 } } });
      expect(result.chest).toEqual({ ...v2.lootViewV2(base.stackDeltas, base.items, []),
        items: base.items.map(item => ({ ...v2.itemViewV2(item), source: "chest", id: expect.any(String) })) });
      expect(await stack(db, p, "catKey")).toBe(firstClearKeys);
      expect((await audit(p))[0]!.chest.added.catKey ?? 0).toBe(firstClearKeys);
      expect(await wins(p)).toEqual([{ chapter: 1, wins: 1 }]);
      // A previously claimed daily grant cannot bypass the wall after spending the last key.
      if (firstClearKeys === 0) {
        const denied = await endpoint(p)(request());
        expect(denied.status).toBe(409);
        expect(await denied.json()).toEqual({ error: "no_key" });
      }
      await setStacks(db, p, { catKey: 1 });
      const rematch = await endpoint(p)(request());
      expect(rematch.status).toBe(200);
      expect(await rematch.json()).toMatchObject({ won: true, keySpent: true, chest: { keys: 0 }, state: { currencies: { keys: 0 } } });
      expect(await stack(db, p, "catKey")).toBe(0);
      expect(await wins(p)).toEqual([{ chapter: 1, wins: 2 }]);
      expect((await audit(p))[1]!.chest.added.catKey ?? 0).toBe(0);
      expect(v2.V2_CONFIG.boss.firstClearKeys).toBe(firstClearKeys);
    });
    expect(v2.V2_CONFIG.boss.firstClearKeys).toBe(original);
  });

  it("credits a first-clear refund after spending at the five-key cap", async () => {
    const p = await ready(true, v2.CAT_KEY_CAP);
    await withConfigV2({ boss: { firstClearKeys: 1 } }, async () => {
      const response = await endpoint(p)(request());
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ keySpent: true, chest: { keys: 1 }, state: { currencies: { keys: v2.CAT_KEY_CAP } } });
      expect(await stack(db, p, "catKey")).toBe(v2.CAT_KEY_CAP);
    });
  });
});
