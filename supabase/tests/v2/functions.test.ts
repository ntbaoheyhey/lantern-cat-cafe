import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { migratedDb } from "../src/game-db.ts";
import { call, count, fn, item, newPlayer, readyForBoss, setStacks, stack, type J } from "./helpers.ts";

let db: PGlite;
let f: ReturnType<typeof fn>;
beforeAll(async () => {
  db = await migratedDb();
  f = fn(db);
});

const ids = async (p: string, where = "true") => (await db.query<{ id: string }>(`select id from items where player_id = $1 and ${where} order by created_at, id`, [p])).rows.map((r) => r.id);
const bagSize = (p: string) => count(db, `select 1 from items where player_id = $1`, p);
async function withClass(cls = "warrior", wt = "sword") {
  const p = await newPlayer(db);
  await f.snapshot(p);
  await f.choose(p, cls, wt);
  return p;
}
const NOW = () => new Date(Date.now() + 3600_000);

describe("v2_snapshot", () => {
  it("is null for an unknown player and creates cat_state once", async () => {
    expect(await f.snapshot("00000000-0000-4000-8000-0000000000aa")).toBeNull();
    const p = await newPlayer(db);
    const s = (await f.snapshot(p))!;
    expect(s).toMatchObject({ classId: null, level: 1, chapter: 1, round: 1, kills: 0, fights: 0, progressRev: 0, cooldownUntil: null, founder: false, forgedToday: false, pending: null, today: null, stacks: {}, inventory: [], equipped: {}, bossClears: [] });
    expect(typeof s.lastClaimMicros).toBe("number");
    await f.snapshot(p);
    expect(await count(db, `select 1 from cat_state where player_id = $1`, p)).toBe(1);
  });
});

describe("v2_choose_class", () => {
  it("gives and equips the starter, bumps progress_rev, and swaps weapon types", async () => {
    const p = await newPlayer(db);
    await f.snapshot(p);
    expect(await f.choose(p, "warrior", "sword")).toMatchObject({ status: "ok" });
    let s = (await f.snapshot(p))!;
    expect(s.classId).toBe("warrior");
    expect(s.progressRev).toBe(2); // class selection plus starter equip
    expect(s.inventory).toHaveLength(1);
    expect(s.inventory[0]).toMatchObject({ slot: "weapon", weaponType: "sword", equipped: true, rarity: "common" });
    expect(s.inventory[0].salvage).toBeUndefined();

    await f.choose(p, "archer", "bow");
    s = (await f.snapshot(p))!;
    expect(s.inventory).toHaveLength(2);
    expect(s.inventory.filter((i: J) => i.equipped).map((i: J) => i.weaponType)).toEqual(["bow"]);

    // Back to sword: no second starter, and the owned (best) sword is equipped.
    await db.query(`insert into items (player_id, item_key, slot, weapon_type, rarity, level, source) values ($1, 'wpn.sword.x', 'weapon', 'sword', 'rare', 3, 'drop')`, [p]);
    await f.choose(p, "warrior", "sword");
    s = (await f.snapshot(p))!;
    expect(s.inventory).toHaveLength(3);
    const eq = s.inventory.filter((i: J) => i.equipped);
    expect(eq).toHaveLength(1);
    expect(eq[0]).toMatchObject({ weaponType: "sword", rarity: "rare" });
  });
  it("keeps an already equipped weapon of the right type", async () => {
    const p = await withClass();
    const before = await ids(p, "equipped");
    await f.choose(p, "guardian", "sword");
    expect(await ids(p, "equipped")).toEqual(before);
    expect(await bagSize(p)).toBe(1);
  });
});

describe("v2_equip", () => {
  const UNL = ["weapon", "helmet", "armor", "gloves", "boots"];
  it("equips, replaces and empties a slot", async () => {
    const p = await withClass();
    await db.query(`insert into items (player_id, item_key, slot, rarity, level, source) select $1, 'h.' || n, 'helmet', 'common', 1, 'drop' from generate_series(1,2) n`, [p]);
    const [h1, h2] = await ids(p, "slot = 'helmet'");
    expect(await f.equip(p, h1!, "helmet", "warrior", "sword")).toEqual({ status: "ok" });
    expect(await f.equip(p, h2!, "helmet", "warrior", "sword")).toEqual({ status: "ok" });
    expect(await ids(p, "equipped and slot = 'helmet'")).toEqual([h2]);
    expect(await f.equip(p, null, "helmet", "warrior", "sword")).toEqual({ status: "ok" });
    expect(await ids(p, "equipped and slot = 'helmet'")).toEqual([]);
  });
  it("refuses not_owner, wrong_slot, slot_locked, wrong_weapon and stale", async () => {
    const p = await withClass();
    const q = await withClass();
    await db.query(`insert into items (player_id, item_key, slot, rarity, level, source) values ($1, 'h.a', 'helmet', 'common', 1, 'drop'), ($1, 'r.a', 'ring', 'common', 1, 'drop')`, [p]);
    await db.query(`insert into items (player_id, item_key, slot, weapon_type, rarity, level, source) values ($1, 'w.bow', 'weapon', 'bow', 'common', 1, 'drop')`, [p]);
    const [helm] = await ids(p, "slot = 'helmet'");
    const [ring] = await ids(p, "slot = 'ring'");
    const [bow] = await ids(p, "weapon_type = 'bow'");
    const [theirs] = await ids(q, "slot = 'weapon'");
    const before = await ids(p, "equipped");
    expect(await f.equip(p, theirs!, "weapon", "warrior", "sword")).toEqual({ error: "not_owner" });
    expect(await f.equip(p, "00000000-0000-4000-8000-0000000000ff", "weapon", "warrior", "sword")).toEqual({ error: "not_owner" });
    expect(await f.equip(p, helm!, "armor", "warrior", "sword")).toEqual({ error: "wrong_slot" });
    expect(await f.equip(p, ring!, "ring", "warrior", "sword", UNL)).toEqual({ error: "slot_locked" });
    expect(await f.equip(p, bow!, "weapon", "warrior", "sword")).toEqual({ error: "wrong_weapon" });
    expect(await f.equip(p, helm!, "helmet", "archer", "bow")).toEqual({ error: "stale" });
    expect(await f.equip(p, helm!, "helmet", null, null)).toEqual({ error: "stale" });
    expect(await ids(p, "equipped")).toEqual(before);
  });
});

describe("v2_claim", () => {
  it("credits stacks, items and progress, and moves last_claim_at", async () => {
    const p = await withClass();
    const s = (await f.snapshot(p))!;
    const r = (await f.claim(p, { micros: s.lastClaimMicros, rev: s.progressRev, now: NOW(), progress: { level: 3, xp: 40, kills: 2, bestStage: 4 }, stacks: { fish: 50, yarn: 7 }, items: [item("helmet"), item("gloves", "uncommon")], day: "2026-11-01" }))!;
    expect(r.status).toBe("ok");
    expect(r.added).toEqual({ fish: 50, yarn: 7 });
    expect(r.items).toHaveLength(2);
    expect(r.items[0]).toMatchObject({ slot: "helmet", equipped: false, locked: false });
    expect(r.items[0].salvage).toBeUndefined();
    expect(r.autoSalvaged).toEqual([]);
    const n = (await f.snapshot(p))!;
    expect(n).toMatchObject({ level: 3, xp: 40, kills: 2, bestStage: 4, lastDailyKeyDay: "2026-11-01", progressRev: s.progressRev + 1 });
    expect(n.lastClaimMicros).toBeGreaterThan(s.lastClaimMicros);
    expect(n.stacks).toMatchObject({ fish: 50, yarn: 7 });
  });
  it("returns null on a stale last_claim_at or progress_rev, and under 10 s", async () => {
    const p = await withClass();
    const s = (await f.snapshot(p))!;
    const base = { micros: s.lastClaimMicros, rev: s.progressRev, stacks: { fish: 1 } };
    expect(await f.claim(p, { ...base, micros: s.lastClaimMicros - 1, now: NOW() })).toBeNull();
    expect(await f.claim(p, { ...base, rev: s.progressRev - 1, now: NOW() })).toBeNull();
    expect(await f.claim(p, { ...base, now: new Date() })).toBeNull();
    expect(await f.claim("00000000-0000-4000-8000-0000000000aa", { ...base, now: NOW() })).toBeNull();
    expect(await stack(db, p, "fish")).toBe(0);
    expect(await f.claim(p, { ...base, now: NOW() })).toMatchObject({ status: "ok" });
  });
});

describe("bag limit and auto-salvage", () => {
  it("claim drops beyond the limit are salvaged with their own value", async () => {
    const p = await withClass(); // bag holds the starter: 1 of 4
    const s = (await f.snapshot(p))!;
    const drops = [item("helmet", "common", { salvage: { fish: 10 } }), item("armor"), item("boots"), item("gloves", "rare", { salvage: { fish: 100, fluffTuft: 4 } }), item("ring", "epic", { itemKey: "ring.epic", weaponType: undefined, salvage: { fish: 1000 } })];
    const r = (await f.claim(p, { micros: s.lastClaimMicros, rev: s.progressRev, now: NOW(), stacks: { fish: 5 }, items: drops, bag: 4 }))!;
    expect(r.items).toHaveLength(3);
    expect(r.autoSalvaged).toEqual([
      { itemKey: "gloves.test", slot: "gloves", rarity: "rare", level: 1 },
      { itemKey: "ring.epic", slot: "ring", rarity: "epic", level: 1 },
    ]);
    expect(r.salvaged).toEqual({ fish: 1100, fluffTuft: 4 });
    expect(await bagSize(p)).toBe(4);
    expect(await stack(db, p, "fish")).toBe(1105);
    expect(await stack(db, p, "fluffTuft")).toBe(4);
  });
  it("a boss chest follows the same rule", async () => {
    const p = await withClass();
    await readyForBoss(db, p);
    const s = (await f.snapshot(p))!;
    const r = (await f.boss(p, { rev: s.progressRev, won: true, fightNo: s.fights, bag: 2, chest: { first: { stacks: { fish: 3 }, items: [item("helmet"), item("armor", "common", { salvage: { yarn: 9 } })] } } }))!;
    expect(r.chest.items).toHaveLength(1);
    expect(r.chest.autoSalvaged).toHaveLength(1);
    expect(r.chest.salvaged).toEqual({ yarn: 9 });
    expect(await stack(db, p, "yarn")).toBe(9);
  });
  it("craft into a full bag is bag_full and spends nothing", async () => {
    const p = await withClass();
    await setStacks(db, p, { yarn: 50 });
    expect(await f.craft(p, { yarn: 10 }, item("armor"), 1)).toEqual({ error: "bag_full" });
    expect(await stack(db, p, "yarn")).toBe(50);
    expect(await bagSize(p)).toBe(1);
  });
});

describe("v2_craft and stacks", () => {
  it("spends the cost and adds a craft item", async () => {
    const p = await withClass();
    await setStacks(db, p, { yarn: 50, fish: 10, fluffTuft: 3 });
    const r = (await f.craft(p, { yarn: 20, fluffTuft: 3 }, item("armor", "rare", { bonus: [{ stat: "hp", value: 5 }] })))!;
    expect(r.status).toBe("ok");
    expect(r.item).toMatchObject({ slot: "armor", rarity: "rare", equipped: false, bonus: [{ stat: "hp", value: 5 }] });
    expect(await stack(db, p, "yarn")).toBe(30);
    expect(await stack(db, p, "fluffTuft")).toBe(0);
    expect((await db.query<{ source: string }>(`select source from items where id = $1`, [r.item.id])).rows[0]!.source).toBe("craft");
  });
  it("not_enough names the first missing stack and changes nothing; balances never go negative", async () => {
    const p = await withClass();
    await setStacks(db, p, { yarn: 50, fish: 1 });
    expect(await f.craft(p, { yarn: 20, fish: 5 }, item("armor"))).toEqual({ error: "not_enough", stack: "fish" });
    expect(await f.craft(p, { yarn: 20, shinyButton: 1 }, item("armor"))).toEqual({ error: "not_enough", stack: "shinyButton" });
    expect(await stack(db, p, "yarn")).toBe(50);
    expect(await stack(db, p, "fish")).toBe(1);
    expect(await bagSize(p)).toBe(1);
    expect((await db.query(`select 1 from player_stacks where qty < 0`)).rows).toEqual([]);
  });
  it("positive deltas clamp to caps and report what was added", async () => {
    const p = await withClass();
    await setStacks(db, p, { catKey: 3 });
    const s = (await f.snapshot(p))!;
    const r = (await f.claim(p, { micros: s.lastClaimMicros, rev: s.progressRev, now: NOW(), stacks: { catKey: 4, fish: 2 } }))!;
    expect(r.added).toEqual({ catKey: 2, fish: 2 });
    expect(await stack(db, p, "catKey")).toBe(5);
    const s2 = (await f.snapshot(p))!;
    const r2 = (await f.claim(p, { micros: s2.lastClaimMicros, rev: s2.progressRev, now: new Date(Date.now() + 7200_000), stacks: { catKey: 1 } }))!;
    expect(r2.added).toEqual({ catKey: 0 });
    expect(await stack(db, p, "catKey")).toBe(5);
  });
});

describe("v2_salvage and v2_lock", () => {
  it("salvages all or nothing: not_owner, equipped, locked", async () => {
    const p = await withClass();
    const q = await withClass();
    await db.query(`insert into items (player_id, item_key, slot, rarity, level, source) select $1, 'h.' || n, 'helmet', 'common', 1, 'drop' from generate_series(1,3) n`, [p]);
    const [a, b, c] = await ids(p, "slot = 'helmet'");
    const [eq] = await ids(p, "equipped");
    const [theirs] = await ids(q, "true");
    await f.lock(p, c!, true);
    expect(await f.salvage(p, [a!, theirs!])).toEqual({ error: "not_owner" });
    expect(await f.salvage(p, [a!, eq!])).toEqual({ error: "equipped" });
    expect(await f.salvage(p, [a!, c!])).toEqual({ error: "locked" });
    expect(await f.salvage(p, [])).toEqual({ error: "invalid_request" });
    expect(await bagSize(p)).toBe(4);
    expect(await stack(db, p, "fish")).toBe(0);
    const ok = await f.salvage(p, [a!, b!, a!], { fish: 7, yarn: 2 });
    expect(ok).toEqual({ status: "ok", added: { fish: 7, yarn: 2 } });
    expect(await bagSize(p)).toBe(2);
    expect(await stack(db, p, "fish")).toBe(7);
    await f.lock(p, c!, false);
    expect(await f.salvage(p, [c!])).toMatchObject({ status: "ok" });
  });
  it("v2_lock refuses an item that is not the caller's", async () => {
    const p = await withClass();
    const q = await withClass();
    const [theirs] = await ids(q, "true");
    expect(await f.lock(p, theirs!, true)).toEqual({ error: "not_owner" });
    expect(await ids(q, "locked")).toEqual([]);
    expect(await f.lock(q, theirs!, true)).toEqual({ status: "ok" });
    expect(await ids(q, "locked")).toEqual([theirs]);
  });
});

describe("v2_boss_fight", () => {
  const chest: J = { first: { stacks: { fish: 100, catKey: 3, moonPearl: 1 }, items: [item("helmet", "uncommon")] }, rematch: { stacks: { fish: 10 }, items: [] } };

  it("first clear: spends the key, opens the first chest, advances the chapter", async () => {
    const p = await withClass();
    await readyForBoss(db, p, 2);
    const s = (await f.snapshot(p))!;
    const r = (await f.boss(p, { rev: s.progressRev, won: true, fightNo: s.fights, chest }))!;
    expect(r).toMatchObject({ status: "ok", won: true, keySpent: true, firstClear: true });
    expect(r.chest.added).toEqual({ catKey: 3, fish: 100, moonPearl: 1 });
    expect(r.chest.items).toHaveLength(1);
    const n = (await f.snapshot(p))!;
    expect(n).toMatchObject({ chapter: 2, round: 1, kills: 0, fights: 1, progressRev: s.progressRev + 1, bossClears: [{ chapter: 1, wins: 1 }] });
    expect(n.stacks.catKey).toBe(4); // 2 - 1 + 3
    // Rematch: not the first chest, no progress change, wins counted.
    const m = (await f.boss(p, { chapter: 1, rev: n.progressRev, won: true, fightNo: n.fights, chest }))!;
    expect(m).toMatchObject({ won: true, firstClear: false });
    expect(m.chest.added).toEqual({ fish: 10 });
    const n2 = (await f.snapshot(p))!;
    expect(n2).toMatchObject({ chapter: 2, round: 1, progressRev: n.progressRev, bossClears: [{ chapter: 1, wins: 2 }] });
    expect(await count(db, `select 1 from boss_fights where player_id = $1`, p)).toBe(2);
  });
  it("key cap 5: chest keys are clamped", async () => {
    const p = await withClass();
    await readyForBoss(db, p, 5);
    const s = (await f.snapshot(p))!;
    const r = (await f.boss(p, { rev: s.progressRev, won: true, fightNo: s.fights, chest: { first: { stacks: { catKey: 3 } } } }))!;
    expect(r.chest.added).toEqual({ catKey: 1 });
    expect(await stack(db, p, "catKey")).toBe(5);
  });
  it("loss keeps the key, sets one cooldown, and blocks every chapter", async () => {
    const p = await withClass();
    await readyForBoss(db, p);
    const s = (await f.snapshot(p))!;
    const r = (await f.boss(p, { rev: s.progressRev, won: false, fightNo: s.fights, cooldown: 60 }))!;
    expect(r).toMatchObject({ won: false, keySpent: false, chest: null });
    expect(r.cooldownUntil).toBeGreaterThan(Date.now() / 1000);
    expect(await stack(db, p, "catKey")).toBe(1);
    const n = (await f.snapshot(p))!;
    expect(n).toMatchObject({ fights: 1, cooldownUntil: r.cooldownUntil, chapter: 1 });
    for (const chapter of [1, 2]) {
      expect(await f.boss(p, { chapter, rev: n.progressRev, won: true, fightNo: n.fights })).toEqual({ error: "cooldown", cooldownUntil: r.cooldownUntil });
    }
    expect(await count(db, `select 1 from boss_clears where player_id = $1`, p)).toBe(0);
    await db.query(`update cat_state set boss_cooldown_until = now() - interval '1 second' where player_id = $1`, [p]);
    expect((await f.snapshot(p))!.cooldownUntil).toBeNull();
    expect(await f.boss(p, { rev: n.progressRev, won: true, fightNo: n.fights })).toMatchObject({ won: true, firstClear: true });
  });
  it("refuses stale, not_reached and no_key without changing anything", async () => {
    const p = await withClass();
    await readyForBoss(db, p, 0);
    const s = (await f.snapshot(p))!;
    const base = { rev: s.progressRev, won: true, fightNo: s.fights };
    expect(await f.boss(p, { ...base, fightNo: s.fights + 1 })).toEqual({ error: "stale" });
    expect(await f.boss(p, { ...base, rev: s.progressRev + 1 })).toEqual({ error: "stale" });
    expect(await f.boss(p, { ...base, chapter: 2 })).toEqual({ error: "not_reached" });
    expect(await f.boss(p, { ...base, bossRound: 11 })).toEqual({ error: "not_reached" });
    expect(await f.boss(p, base)).toEqual({ error: "no_key" });
    expect(await f.boss(p, { ...base, won: false })).toEqual({ error: "no_key" });
    expect(await f.snapshot(p)).toMatchObject({ fights: 0, chapter: 1, cooldownUntil: null });
    expect(await count(db, `select 1 from boss_fights where player_id = $1`, p)).toBe(0);
  });
});

describe("v2_relic_forge", () => {
  it("blocks in order, pays yarn and a pearl, returns the pending voucher first", async () => {
    const p = await withClass();
    expect(await f.forge(p)).toEqual({ status: "blocked", reason: "not_enough_yarn" });
    await setStacks(db, p, { yarn: 30 });
    expect(await f.forge(p)).toEqual({ status: "blocked", reason: "no_moon_pearl" });
    await setStacks(db, p, { moonPearl: 2 });
    const r = (await f.forge(p))!;
    expect(r).toMatchObject({ status: "new", voucher: { relicId: "7", rarityName: "rare", status: "issued" } });
    expect(await stack(db, p, "yarn")).toBe(0);
    expect(await stack(db, p, "moonPearl")).toBe(1);
    expect(await f.forge(p)).toEqual({ status: "pending", voucher: r.voucher });
    expect(await stack(db, p, "moonPearl")).toBe(1);
    const s = (await f.snapshot(p))!;
    expect(s).toMatchObject({ forgedToday: true, pending: { relicId: "7" }, today: { relicId: "7", minted: false } });
    // After the voucher is minted, the same day is daily_limit even with resources.
    await setStacks(db, p, { yarn: 100, moonPearl: 5 });
    await db.query(`update relic_vouchers set status = 'minted' where player_id = $1`, [p]);
    expect(await f.forge(p)).toEqual({ status: "blocked", reason: "daily_limit" });
    expect(await f.forge(p, "2026-11-02")).toMatchObject({ status: "new" });
  });
  it("daily_limit is shared with v1 game_forge", async () => {
    const p = await withClass();
    await setStacks(db, p, { yarn: 100, moonPearl: 5 });
    await db.query(`insert into idle_state (player_id, shards) values ($1, 100)`, [p]);
    await db.query(`insert into boss_keys (player_id, day) values ($1, '2026-10-30')`, [p]);
    const v1 = await call(db, `public.game_forge($1, '2026-11-01', 3, 'common', 30, 1, now() + interval '1 hour')`, [p]);
    expect(v1).toMatchObject({ status: "new" });
    await db.query(`update relic_vouchers set status = 'minted' where player_id = $1`, [p]);
    expect(await f.forge(p)).toEqual({ status: "blocked", reason: "daily_limit" });
    expect(await stack(db, p, "yarn")).toBe(100);
  });
});

describe("v2_grant_founder", () => {
  it("grants once", async () => {
    const p = await newPlayer(db);
    expect(await f.founder(p)).toEqual({ status: "granted" });
    expect(await f.founder(p)).toEqual({ status: "already" });
    expect(await f.founder(p, { fish: 999 })).toEqual({ status: "already" });
    expect(await stack(db, p, "fish")).toBe(100);
    expect(await stack(db, p, "catKey")).toBe(2);
    expect(await count(db, `select 1 from founder_grants where player_id = $1`, p)).toBe(1);
    expect((await f.snapshot(p))!.founder).toBe(true);
  });
});
