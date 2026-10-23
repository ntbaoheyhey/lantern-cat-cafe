import type { PGlite } from "@electric-sql/pglite";
import { CONFIG, simulateBoss } from "@taskbar-hero/game-rules";
import { beforeAll, describe, expect, it } from "vitest";
import type { BossFightResult } from "../../../apps/web/src/api/GameApi.ts";
import {
  GameError,
  bossSeed,
  dayDate,
  fightBoss,
  gameHandler,
  getState,
  routes,
  type GameDeps,
} from "../../functions/_shared/game.ts";
import { as, migratedDb, pgliteStore } from "./game-db.ts";

const SECRET = "test-seed-secret";
// 2026-11-01 10:00 UTC = 17:00 UTC+7, game day 2026-11-01.
const T0 = Date.UTC(2026, 10, 1, 10, 0, 0);
const MAX = CONFIG.boss.maxAttemptsPerDay;

let db: PGlite;
let clock = T0;
const deps: GameDeps = { store: pgliteStore(() => db), seedSecret: SECRET, now: () => clock };

let nextId = 1;
/** A player with starter gear; "strong" also equips legendary level 30 gear in every slot. */
async function player(opts: { strong?: boolean; bossLevel?: number } = {}): Promise<string> {
  const n = nextId++;
  const id = `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  await db.query(`insert into players (id, wallet) values ($1, $2)`, [id, "0x" + n.toString(16).padStart(40, "0")]);
  await db.query(`insert into idle_state (player_id, boss_level) values ($1, $2)`, [id, opts.bossLevel ?? 1]);
  await getState(deps, id); // starter gear
  if (opts.strong) {
    await db.query(`update gear set equipped = false where player_id = $1`, [id]);
    for (const slot of CONFIG.slots) {
      await db.query(
        `insert into gear (player_id, item_key, slot, rarity, level, equipped) values ($1, $2, $2, 'legendary', 30, true)`,
        [id, slot],
      );
    }
  }
  return id;
}
async function addAttempts(id: string, day: string, n: number) {
  for (let i = 0; i < n; i++) await db.query(`insert into boss_attempts (player_id, day, won) values ($1, $2, false)`, [id, day]);
}
const attempts = async (id: string, day: string) =>
  Number((await db.query<{ n: string }>(`select count(*) n from boss_attempts where player_id = $1 and day = $2`, [id, day])).rows[0]!.n);

beforeAll(async () => {
  db = await migratedDb();
});

describe("boss-fight", () => {
  it("a win grants today's key and raises bossLevel; a second win raises the level but grants no key", async () => {
    clock = T0;
    const p = await player({ strong: true });
    const first = await fightBoss(deps, p);
    expect(first.result.won).toBe(true);
    expect(first.keyGranted).toBe(true);
    expect(first.state).toMatchObject({ bossLevel: 2, bossKeys: 1 });
    expect(first.state.boss).toEqual({ level: 2, attemptsToday: 1, attemptsLeft: MAX - 1, keyEarnedToday: true });

    const second = await fightBoss(deps, p);
    expect(second.result.won).toBe(true);
    expect(second.keyGranted).toBe(false);
    expect(second.state).toMatchObject({ bossLevel: 3, bossKeys: 1 });
    expect(second.state.boss.attemptsToday).toBe(2);
  });

  it("a loss grants nothing and keeps bossLevel, but uses an attempt", async () => {
    clock = T0;
    const p = await player({ bossLevel: CONFIG.boss.maxLevel });
    const r = await fightBoss(deps, p);
    expect(r.result.won).toBe(false);
    expect(r.keyGranted).toBe(false);
    expect(r.state).toMatchObject({ bossLevel: CONFIG.boss.maxLevel, bossKeys: 0 });
    expect(r.state.boss).toEqual({
      level: CONFIG.boss.maxLevel,
      attemptsToday: 1,
      attemptsLeft: MAX - 1,
      keyEarnedToday: false,
    });
  });

  it("never raises bossLevel past boss.maxLevel", async () => {
    clock = T0;
    const p = await player({ bossLevel: CONFIG.boss.maxLevel });
    const ok = await deps.store.bossFight({ playerId: p, day: dayDate(T0 / 1000), bossLevel: CONFIG.boss.maxLevel, won: true, maxAttempts: MAX, maxLevel: CONFIG.boss.maxLevel });
    expect(ok).toBe(true);
    expect((await getState(deps, p)).bossLevel).toBe(CONFIG.boss.maxLevel);
  });

  it("uses the server seed for this attempt, and the log ends with the result", async () => {
    clock = T0;
    const p = await player();
    const before = await getState(deps, p);
    const r = await fightBoss(deps, p);
    const seed = await bossSeed(SECRET, p, dayDate(T0 / 1000), 1);
    expect(r.result).toEqual(simulateBoss(before.power, before.bossLevel, seed));
    expect(r.result.log.at(-1)).toEqual({ t: expect.any(Number), type: "end", won: r.result.won });
    // The next attempt has a different seed.
    expect(await bossSeed(SECRET, p, dayDate(T0 / 1000), 2)).not.toBe(seed);
  });

  it(`refuses attempt ${MAX + 1} in one day with no_attempts_left`, async () => {
    clock = T0;
    const p = await player();
    const day = dayDate(T0 / 1000);
    for (let i = 0; i < MAX; i++) await fightBoss(deps, p);
    expect(await attempts(p, day)).toBe(MAX);
    await expect(fightBoss(deps, p)).rejects.toEqual(new GameError("no_attempts_left"));
    expect(await attempts(p, day)).toBe(MAX);
    expect((await getState(deps, p)).boss.attemptsLeft).toBe(0);
  });

  it(`two parallel fights at attempt ${MAX} give exactly one success`, async () => {
    clock = T0;
    const p = await player();
    const day = dayDate(T0 / 1000);
    await addAttempts(p, day, MAX - 1);
    const results = await Promise.allSettled([fightBoss(deps, p), fightBoss(deps, p)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    expect(rejected).toHaveLength(1);
    expect(rejected[0]!.reason).toMatchObject({ code: "no_attempts_left" });
    expect(await attempts(p, day)).toBe(MAX);
  });

  it("the attempt limit resets at midnight UTC+7 (17:00 UTC)", async () => {
    const before = Date.UTC(2026, 10, 2, 16, 59, 0);
    const after = Date.UTC(2026, 10, 2, 17, 1, 0);
    expect(dayDate(before / 1000)).toBe("2026-11-02");
    expect(dayDate(after / 1000)).toBe("2026-11-03");
    const p = await player();
    await addAttempts(p, "2026-11-02", MAX);
    clock = before;
    await expect(fightBoss(deps, p)).rejects.toMatchObject({ code: "no_attempts_left" });
    clock = after;
    const r = await fightBoss(deps, p);
    expect(r.state.boss.attemptsToday).toBe(1);
    expect(await attempts(p, "2026-11-03")).toBe(1);
    clock = T0;
  });
});

describe("boss-fight HTTP", () => {
  const http = {
    authenticate: async (req: Request) => {
      const id = /^Bearer (\S+)$/.exec(req.headers.get("Authorization") ?? "")?.[1];
      if (!id) throw new GameError("unauthenticated");
      return id;
    },
    json: (_req: Request, body: unknown, status = 200) => Response.json(body, { status }),
  };
  const call = (auth: string, body: unknown = {}) =>
    gameHandler(http, routes(deps)["boss-fight"])(
      new Request("http://local/boss-fight", { method: "POST", headers: { Authorization: `Bearer ${auth}` }, body: JSON.stringify(body) }),
    );

  it("returns exactly the BossFightResult shape", async () => {
    clock = T0;
    const p = await player({ strong: true });
    const res = await call(p, { won: true, seed: 1, now: 0 });
    expect(res.status).toBe(200);
    const body = (await res.json()) as BossFightResult;
    const fixture: BossFightResult = {
      result: { won: true, log: [{ t: 1, type: "end", won: true }], bossMaxHp: 1, heroMaxHp: 1 },
      keyGranted: true,
      state: {
        gold: 0,
        shards: 0,
        gear: [{ slot: "weapon", rarity: "common", level: 1 }],
        inventory: [{ id: "x", slot: "weapon", rarity: "common", level: 1, equipped: true }],
        bossLevel: 1,
        bossKeys: 0,
        boss: { level: 1, attemptsToday: 0, attemptsLeft: 5, keyEarnedToday: false },
        forge: { blockedBy: "no_boss_key", forgedToday: false, pending: null },
        power: 1,
        goldPerSecond: 1,
        serverTime: 1,
      },
    };
    const keys = (v: unknown): unknown =>
      Array.isArray(v) ? "array" : v && typeof v === "object"
        ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, keys(x)]))
        : typeof v;
    expect(keys(body)).toEqual(keys(fixture));
    expect(body.result.log.at(-1)).toMatchObject({ type: "end", won: body.result.won });
  });

  it("answers 409 no_attempts_left at the daily limit", async () => {
    clock = T0;
    const p = await player();
    await addAttempts(p, dayDate(T0 / 1000), MAX);
    const res = await call(p);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "no_attempts_left" });
  });
});

describe("grants", () => {
  const sql = `select public.game_boss_fight('00000000-0000-4000-8000-000000000001', '2026-11-01', 1, true, 5, 50)`;

  it("anon and authenticated cannot execute game_boss_fight", async () => {
    await expect(as(db, "anon", null, () => db.query(sql))).rejects.toThrow(/permission denied/);
    await expect(
      as(db, "authenticated", { sub: "00000000-0000-4000-8000-000000000001", role: "authenticated" }, () => db.query(sql)),
    ).rejects.toThrow(/permission denied/);
  });

  it("authenticated cannot write attempts, keys or boss_level directly", async () => {
    const id = "00000000-0000-4000-8000-000000000001";
    const claims = { sub: id, role: "authenticated" };
    for (const stmt of [
      `insert into boss_attempts (player_id, day, won) values ('${id}', '2026-11-01', true)`,
      `insert into boss_keys (player_id, day) values ('${id}', '2026-12-01')`,
      `update idle_state set boss_level = 50 where player_id = '${id}'`,
    ]) {
      await expect(as(db, "authenticated", claims, () => db.query(stmt))).rejects.toThrow(/permission denied/);
    }
  });
});
