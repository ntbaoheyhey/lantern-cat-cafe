import type { PGlite } from "@electric-sql/pglite";
import { CONFIG, computeClaimGains, gearStat, goldPerSecond, heroPower, starterGear } from "@taskbar-hero/game-rules";
import { beforeAll, describe, expect, it } from "vitest";
import type { ClaimResult, OwnedGear, ServerState } from "../../../apps/web/src/api/GameApi.ts";
import {
  GameError,
  claim,
  claimSeed,
  dayDate,
  equip,
  gameHandler,
  getState,
  routes,
  type GameDeps,
} from "../../functions/_shared/game.ts";
import { as as asRole, migratedDb, pgliteStore, type Role } from "./game-db.ts";

const A = "00000000-0000-4000-8000-0000000000a1";
const B = "00000000-0000-4000-8000-0000000000b1";
const SECRET = "test-seed-secret";
const T0 = Date.UTC(2026, 10, 1, 0, 0, 0); // ms

let db: PGlite;

const as = <T>(role: Role, claims: object | null, fn: () => Promise<T>) => asRole(db, role, claims, fn);
const service = <T>(fn: () => Promise<T>) => as("service_role", null, fn);
const store = pgliteStore(() => db);

let clock = T0;
const deps: GameDeps = { store, seedSecret: SECRET, now: () => clock };

async function newPlayer(id: string, wallet: string) {
  await db.query(`insert into players (id, wallet) values ($1, $2)`, [id, wallet]);
  await db.query(`insert into idle_state (player_id, last_claim_at) values ($1, $2)`, [id, new Date(T0).toISOString()]);
}
async function setLastClaim(id: string, ms: number) {
  await db.query(`update idle_state set last_claim_at = $2 where player_id = $1`, [id, new Date(ms).toISOString()]);
}
async function row(id: string) {
  return (await db.query<{ gold: string; shards: number; last: string }>(
    `select gold::text, shards, public.game_epoch_micros(last_claim_at)::text last from idle_state where player_id = $1`,
    [id],
  )).rows[0]!;
}
/** What docs/api.md says a claim from lastMs to nowMs should credit. */
async function expectedGains(id: string, state: ServerState, lastMs: number, nowMs: number) {
  const seed = await claimSeed(SECRET, id, lastMs * 1000);
  return computeClaimGains({ gear: state.gear, bossLevel: state.bossLevel }, (nowMs - lastMs) / 1000, seed);
}

beforeAll(async () => {
  db = await migratedDb();
  await newPlayer(A, "0x" + "1".repeat(40));
  await newPlayer(B, "0x" + "2".repeat(40));
});

describe("game-state", () => {
  it("gives a new player the 4 starter items, equipped, exactly once", async () => {
    clock = T0;
    const s = await getState(deps, A);
    expect(s.inventory).toHaveLength(CONFIG.slots.length);
    expect(s.inventory.every((g) => g.equipped)).toBe(true);
    expect(s.gear).toEqual(starterGear());
    expect(s.power).toBe(heroPower(starterGear()));
    expect(s).toMatchObject({ gold: 0, shards: 0, bossLevel: 1, bossKeys: 0, serverTime: T0 / 1000 });
    expect(s.boss).toEqual({ level: 1, attemptsToday: 0, attemptsLeft: CONFIG.boss.maxAttemptsPerDay, keyEarnedToday: false });
    expect((await getState(deps, A)).inventory.map((g) => g.id)).toEqual(s.inventory.map((g) => g.id));
    const power = (await db.query<{ power: number }>(`select power from gear where player_id = $1 and slot = 'weapon'`, [A])).rows[0]!;
    expect(power.power).toBe(Math.round(gearStat({ slot: "weapon", rarity: "common", level: 1 })));
  });

  it("is not_found for an unknown player", async () => {
    await expect(getState(deps, "00000000-0000-4000-8000-0000000000ff")).rejects.toMatchObject({ code: "not_found", status: 404 });
  });

  it("counts today's boss attempts and keys by UTC+7 day", async () => {
    const vnMidnight = Date.UTC(2026, 10, 20, 17, 0, 0); // 2026-11-21 00:00 UTC+7
    expect(dayDate(vnMidnight / 1000)).toBe("2026-11-21");
    expect(dayDate(vnMidnight / 1000 - 1)).toBe("2026-11-20");
    await db.exec(`
      insert into boss_attempts (player_id, day, won) values ('${B}', '2026-11-21', false), ('${B}', '2026-11-21', true), ('${B}', '2026-11-20', true);
      insert into boss_keys (player_id, day) values ('${B}', '2026-11-21');
      insert into boss_keys (player_id, day, spent_at) values ('${B}', '2026-11-19', now());
    `);
    clock = vnMidnight + 3600_000;
    const s = await getState(deps, B);
    expect(s.boss).toEqual({ level: 1, attemptsToday: 2, attemptsLeft: CONFIG.boss.maxAttemptsPerDay - 2, keyEarnedToday: true });
    expect(s.bossKeys).toBe(1);
    clock = T0;
  });
});

describe("idle-claim", () => {
  it("one hour after the last claim credits what computeClaimGains predicts", async () => {
    await setLastClaim(A, T0);
    clock = T0;
    const before = await getState(deps, A);
    clock = T0 + 3600_000;
    const want = await expectedGains(A, before, T0, clock);
    const r = await claim(deps, A);
    expect(r.gold).toBe(before.gold + want.gold);
    expect(r.shards).toBe(before.shards + want.shards);
    expect(want.gold).toBeGreaterThan(0);
    expect(r.drops.map(({ slot, rarity, level }) => ({ slot, rarity, level }))).toEqual(want.drops);
    expect(r.drops.every((d) => !d.equipped)).toBe(true);
    expect(r.inventory).toHaveLength(before.inventory.length + want.drops.length);
    expect(r.inventory.map((g) => g.id)).toEqual(expect.arrayContaining(r.drops.map((d) => d.id)));
    expect((await row(A)).last).toBe(String(clock * 1000));
  });

  it("a second claim within 10 s adds nothing and does not move last_claim_at", async () => {
    const before = await row(A);
    const lastMs = Number(before.last) / 1000;
    for (const dt of [0, 5_000, 9_999]) {
      clock = lastMs + dt;
      const r = await claim(deps, A);
      expect(r.drops).toEqual([]);
      expect(await row(A)).toEqual(before);
    }
    clock = lastMs + 10_000;
    await claim(deps, A);
    expect((await row(A)).last).toBe(String(clock * 1000));
  });

  it("time past the offline cap is capped", async () => {
    const cap = CONFIG.idle.offlineCapSeconds;
    await setLastClaim(A, T0);
    clock = T0 + 3 * cap * 1000;
    const before = await getState(deps, A);
    const seed = await claimSeed(SECRET, A, T0 * 1000);
    const atCap = computeClaimGains({ gear: before.gear, bossLevel: before.bossLevel }, cap, seed);
    const r = await claim(deps, A);
    expect(r.gold - before.gold).toBe(atCap.gold);
    expect(r.shards - before.shards).toBe(atCap.shards);
    expect(r.drops).toHaveLength(atCap.drops.length);
  });

  it("pays the full rate for the first 5 minutes and 50% after, capped at 8 hours", async () => {
    const { onlineWindowSeconds: w, offlineCapSeconds: cap, offlineEfficiency: eff } = CONFIG.idle;
    for (const [gap, want] of [
      [120, (gps: number) => Math.floor(gps * 120)],
      [7200, (gps: number) => Math.floor(gps * w) + Math.floor(gps * (7200 - w) * eff)],
      [cap + 3600, (gps: number) => Math.floor(gps * w) + Math.floor(gps * (cap - w) * eff)],
    ] as const) {
      await setLastClaim(A, T0);
      clock = T0 + gap * 1000;
      const before = await getState(deps, A);
      const r = await claim(deps, A);
      expect(r.gold - before.gold, `gap ${gap}s`).toBe(want(goldPerSecond(before.power)));
    }
  });

  it("a claim that lost a race to another claim changes nothing", async () => {
    await setLastClaim(A, T0);
    const before = await row(A);
    const stale = await store.claim({ playerId: A, expectedLastMicros: T0 * 1000 - 1, now: new Date(T0 + 60_000).toISOString(), gold: 5, shards: 1, drops: [] });
    expect(stale).toBeNull();
    expect(await row(A)).toEqual(before);
  });

  it("refuses negative gains", async () => {
    await expect(store.claim({ playerId: A, expectedLastMicros: T0 * 1000, now: new Date(T0 + 60_000).toISOString(), gold: -1, shards: 0, drops: [] })).rejects.toThrow(/negative/);
  });
});

describe("equip", () => {
  it("refuses an item the player does not own", async () => {
    clock = T0;
    const bItem = (await getState(deps, B)).inventory[0]!;
    await expect(equip(deps, A, bItem.id)).rejects.toEqual(new GameError("not_owner"));
    await expect(equip(deps, A, "00000000-0000-4000-8000-000000000000")).rejects.toMatchObject({ code: "not_owner", status: 403 });
    await expect(equip(deps, A, "not-a-uuid")).rejects.toMatchObject({ code: "not_owner" });
    expect((await getState(deps, B)).inventory.find((g) => g.id === bItem.id)!.equipped).toBe(true);
  });

  it("equipping an owned item swaps the slot and changes power; never trips the unique index", async () => {
    await db.query(
      `insert into gear (player_id, item_key, slot, rarity, level, power) values ($1, 'weapon:epic', 'weapon', 'epic', 3, 1)`,
      [A],
    );
    const before = await getState(deps, A);
    const epic = before.inventory.find((g) => g.rarity === "epic" && g.slot === "weapon" && g.level === 3)!;
    const oldWeapon = before.inventory.find((g) => g.slot === "weapon" && g.equipped)!;
    const after = await equip(deps, A, epic.id);
    const weapons = after.inventory.filter((g) => g.slot === "weapon" && g.equipped);
    expect(weapons.map((g) => g.id)).toEqual([epic.id]);
    expect(after.power).toBeCloseTo(before.power - gearStat(oldWeapon) + gearStat(epic));
    expect(after.power).toBeGreaterThan(before.power);
    // Equipping the already equipped item, then swapping back, keeps exactly one per slot.
    await equip(deps, A, epic.id);
    const back = await equip(deps, A, oldWeapon.id);
    expect(back.power).toBeCloseTo(before.power);
    for (const slot of CONFIG.slots) expect(back.inventory.filter((g) => g.slot === slot && g.equipped)).toHaveLength(1);
  });
});

describe("HTTP handler", () => {
  const http = {
    // Stand-in for the JWT check: "Bearer <player id>".
    authenticate: async (req: Request) => {
      const id = /^Bearer (\S+)$/.exec(req.headers.get("Authorization") ?? "")?.[1];
      if (!id) throw new GameError("unauthenticated");
      return id;
    },
    json: (_req: Request, body: unknown, status = 200) => Response.json(body, { status }),
  };
  const call = (name: keyof ReturnType<typeof routes>, auth: string | null, body: unknown) =>
    gameHandler(http, routes(deps)[name])(
      new Request(`http://local/${name}`, {
        method: "POST",
        headers: auth ? { Authorization: `Bearer ${auth}` } : {},
        body: JSON.stringify(body),
      }),
    );

  it("ignores a client timestamp, player id or wallet in the body", async () => {
    await setLastClaim(A, T0);
    clock = T0 + 3600_000;
    const before = await row(A);
    const hacked = await call("idle-claim", A, { now: T0 + 999 * 3600_000, serverTime: 9e9, playerId: B, wallet: "0x" + "2".repeat(40), elapsed: 1e9 });
    expect(hacked.status).toBe(200);
    const got = (await hacked.json()) as ClaimResult;
    const afterHacked = await row(A);

    // Same claim again without the extra fields gives the same result.
    await db.query(`update idle_state set gold = $2, shards = $3, last_claim_at = $4 where player_id = $1`, [A, before.gold, before.shards, new Date(T0).toISOString()]);
    await db.query(`delete from gear where player_id = $1 and id = any($2::uuid[])`, [A, got.drops.map((d) => d.id)]);
    const plain = (await (await call("idle-claim", A, {})).json()) as ClaimResult;
    expect(await row(A)).toEqual(afterHacked);
    expect(plain.gold).toBe(got.gold);
    expect(plain.drops.map(({ id: _, ...g }) => g)).toEqual(got.drops.map(({ id: _, ...g }) => g));
    expect(got.serverTime).toBe(clock / 1000);
    expect((await row(B)).last).toBe(String(T0 * 1000));
  });

  it("maps errors to docs/api.md statuses", async () => {
    expect((await call("game-state", null, {})).status).toBe(401);
    const r = await call("equip", A, { gearId: "00000000-0000-4000-8000-000000000000" });
    expect(r.status).toBe(403);
    expect(await r.json()).toEqual({ error: "not_owner" });
    expect((await call("game-state", "00000000-0000-4000-8000-0000000000ff", {})).status).toBe(404);
    const get = await gameHandler(http, routes(deps)["game-state"])(new Request("http://local/x", { method: "GET" }));
    expect(get.status).toBe(405);
  });

  it("response JSON has exactly the ServerState / ClaimResult shape", async () => {
    const gear: OwnedGear = { id: "x", slot: "weapon", rarity: "common", level: 1, equipped: true };
    const state: ServerState = {
      gold: 0,
      shards: 0,
      gear: [{ slot: "weapon", rarity: "common", level: 1 }],
      inventory: [gear],
      bossLevel: 1,
      bossKeys: 0,
      boss: { level: 1, attemptsToday: 0, attemptsLeft: 5, keyEarnedToday: false },
      forge: { blockedBy: "no_boss_key", forgedToday: false, pending: null },
      power: 1,
      goldPerSecond: 1,
      serverTime: 1,
    };
    const fixture: ClaimResult = { ...state, drops: [gear] };
    // Same keys and value types, recursively (arrays compared by their first element).
    const shape = (v: unknown): unknown =>
      Array.isArray(v) ? [v.length ? shape(v[0]) : "empty"] : v && typeof v === "object"
        ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, shape(x)]))
        : typeof v;

    await setLastClaim(A, T0 - 8 * 3600_000);
    clock = T0;
    const claimed = await (await call("idle-claim", A, {})).json();
    expect((claimed as ClaimResult).drops.length).toBeGreaterThan(0);
    expect(shape(claimed)).toEqual(shape(fixture));
    expect(shape(await (await call("game-state", A, {})).json())).toEqual(shape(state));
    expect(shape(await (await call("equip", A, { gearId: (claimed as ClaimResult).drops[0]!.id })).json())).toEqual(shape(state));
  });
});

describe("grants", () => {
  const calls = [
    `select public.game_snapshot('${A}', '2026-11-01', '[]'::jsonb)`,
    `select public.game_claim('${A}', 0, now(), 1, 1, '[]'::jsonb)`,
    `select public.game_equip('${A}', '${A}')`,
    `select public.game_insert_gear('${A}', '[]'::jsonb, false)`,
    `select public.game_epoch_micros(now())`,
  ];

  it("anon and authenticated cannot execute the new functions", async () => {
    for (const sql of calls) {
      await expect(as("anon", null, () => db.query(sql)), `anon: ${sql}`).rejects.toThrow(/permission denied/);
      await expect(as("authenticated", { sub: A, role: "authenticated" }, () => db.query(sql)), `auth: ${sql}`).rejects.toThrow(/permission denied/);
    }
  });

  it("service_role can execute only the three API functions", async () => {
    for (const sql of calls.slice(0, 3)) await expect(service(() => db.query(sql))).resolves.toBeDefined();
    for (const sql of calls.slice(3)) await expect(service(() => db.query(sql))).rejects.toThrow(/permission denied/);
  });

  it("authenticated still only SELECTs own rows, and cannot write the new columns", async () => {
    const jwtA = { sub: A, role: "authenticated" };
    const gear = await as("authenticated", jwtA, () => db.query<{ player_id: string }>(`select player_id, rarity, level from gear`));
    expect(gear.rows.length).toBeGreaterThan(0);
    expect(new Set(gear.rows.map((r) => r.player_id))).toEqual(new Set([A]));
    const idle = await as("authenticated", jwtA, () => db.query<{ player_id: string }>(`select player_id, boss_level from idle_state`));
    expect(idle.rows.map((r) => r.player_id)).toEqual([A]);
    for (const sql of [
      `update gear set rarity = 'legendary' where player_id = '${A}'`,
      `update idle_state set boss_level = 50 where player_id = '${A}'`,
    ]) {
      await expect(as("authenticated", jwtA, () => db.query(sql))).rejects.toThrow(/permission denied/);
    }
  });

  it("checks rarity, level and slot", async () => {
    for (const [rarity, level, slot] of [["mythic", 1, "weapon"], ["common", 0, "weapon"], ["common", 31, "weapon"], ["common", 1, "boots"]] as const) {
      await expect(
        db.query(`insert into gear (player_id, item_key, slot, rarity, level) values ($1, 'x', $2, $3, $4)`, [A, slot, rarity, level]),
      ).rejects.toThrow(/check constraint/);
    }
  });
});
