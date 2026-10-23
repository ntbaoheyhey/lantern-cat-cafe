import type { PGlite } from "@electric-sql/pglite";
import { CONFIG, gearStat, upgradeCost } from "@taskbar-hero/game-rules";
import { beforeAll, describe, expect, it } from "vitest";
import type { ServerState } from "../../../apps/web/src/api/GameApi.ts";
import { GameError, gameHandler, getState, routes, upgrade, type GameDeps } from "../../functions/_shared/game.ts";
import { as, migratedDb, pgliteStore } from "./game-db.ts";

const T0 = Date.UTC(2026, 10, 1, 10, 0, 0);
const MAX = CONFIG.gear.maxLevel;

let db: PGlite;
const deps: GameDeps = { store: pgliteStore(() => db), seedSecret: "test-seed-secret", now: () => T0 };

let nextId = 1;
/** A player with starter gear and `gold` gold; returns its id and equipped weapon. */
async function player(gold: number): Promise<{ id: string; weapon: string }> {
  const n = nextId++;
  const id = `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  await db.query(`insert into players (id, wallet) values ($1, $2)`, [id, "0x" + (0xdef000 + n).toString(16).padStart(40, "0")]);
  await db.query(`insert into idle_state (player_id, gold) values ($1, $2)`, [id, gold]);
  const s = await getState(deps, id);
  return { id, weapon: s.inventory.find((g) => g.slot === "weapon" && g.equipped)!.id };
}
const row = async (gearId: string) =>
  (await db.query<{ level: number; power: number }>(`select level, power from gear where id = $1`, [gearId])).rows[0]!;
const gold = async (id: string) => Number((await db.query<{ g: string }>(`select gold::text g from idle_state where player_id = $1`, [id])).rows[0]!.g);
const cost = (level: number, rarity: "common" | "rare" | "epic" | "legendary" = "common") =>
  upgradeCost({ slot: "weapon", rarity, level })!;

beforeAll(async () => {
  db = await migratedDb();
});

describe("upgrade", () => {
  it("spends exactly upgradeCost, raises the level by 1 and the power of an equipped item", async () => {
    const p = await player(1000);
    const before = await getState(deps, p.id);
    const s = await upgrade(deps, p.id, p.weapon);
    expect(await gold(p.id)).toBe(1000 - cost(1));
    expect(s.gold).toBe(1000 - cost(1));
    const item = s.inventory.find((g) => g.id === p.weapon)!;
    expect(item.level).toBe(2);
    expect(s.gear.find((g) => g.slot === "weapon")!.level).toBe(2);
    expect(s.power).toBeGreaterThan(before.power);
    expect(await row(p.weapon)).toEqual({ level: 2, power: Math.round(gearStat({ slot: "weapon", rarity: "common", level: 2 })) });

    await upgrade(deps, p.id, p.weapon);
    expect(await gold(p.id)).toBe(1000 - cost(1) - cost(2));
  });

  it("upgrades an unequipped item and prices by rarity", async () => {
    const p = await player(10_000);
    const [{ id: gearId }] = (
      await db.query<{ id: string }>(
        `insert into gear (player_id, item_key, slot, rarity, level, power, equipped) values ($1, 'ring', 'ring', 'epic', 5, 1, false) returning id`,
        [p.id],
      )
    ).rows as [{ id: string }];
    const before = (await getState(deps, p.id)).power;
    const s = await upgrade(deps, p.id, gearId);
    expect(await gold(p.id)).toBe(10_000 - cost(5, "epic"));
    expect(s.inventory.find((g) => g.id === gearId)).toMatchObject({ level: 6, equipped: false });
    expect(s.power).toBe(before);
  });

  it("not_enough_gold, max_level, another player's or an unknown item: error and nothing changes", async () => {
    const poor = await player(cost(1) - 1);
    await expect(upgrade(deps, poor.id, poor.weapon)).rejects.toEqual(new GameError("not_enough_gold"));
    expect(await row(poor.weapon)).toMatchObject({ level: 1 });
    expect(await gold(poor.id)).toBe(cost(1) - 1);

    const rich = await player(1_000_000_000);
    await db.query(`update gear set level = $2 where id = $1`, [rich.weapon, MAX]);
    await expect(upgrade(deps, rich.id, rich.weapon)).rejects.toEqual(new GameError("max_level"));
    expect(await row(rich.weapon)).toMatchObject({ level: MAX });

    for (const g of [poor.weapon, "00000000-0000-4000-8000-ffffffffffff", "not-a-uuid", 7, undefined]) {
      await expect(upgrade(deps, rich.id, g)).rejects.toEqual(new GameError("not_owner"));
    }
    expect(await gold(rich.id)).toBe(1_000_000_000);
    expect(await row(poor.weapon)).toMatchObject({ level: 1 });
  });

  it("SQL refuses a stale level or price and changes nothing", async () => {
    const p = await player(1000);
    const args = { playerId: p.id, gearId: p.weapon, cost: cost(1), maxLevel: MAX, power: 9 };
    expect(await deps.store.upgrade({ ...args, expectedLevel: 2 })).toBe("stale");
    expect(await deps.store.upgrade({ ...args, expectedLevel: 1, cost: 1001 })).toBe("not_enough_gold");
    expect(await row(p.weapon)).toMatchObject({ level: 1 });
    expect(await gold(p.id)).toBe(1000);
  });

  it("two concurrent upgrades with gold for one: exactly one succeeds", async () => {
    const p = await player(cost(1) + cost(2) - 1);
    const results = await Promise.allSettled([upgrade(deps, p.id, p.weapon), upgrade(deps, p.id, p.weapon)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    expect(rejected[0]!.reason).toEqual(new GameError("not_enough_gold"));
    expect(await row(p.weapon)).toMatchObject({ level: 2 });
    expect(await gold(p.id)).toBe(cost(2) - 1);
  });

  it("two concurrent upgrades with gold for both pay each level's own price", async () => {
    const p = await player(cost(1) + cost(2));
    await Promise.all([upgrade(deps, p.id, p.weapon), upgrade(deps, p.id, p.weapon)]);
    expect(await row(p.weapon)).toMatchObject({ level: 3 });
    expect(await gold(p.id)).toBe(0);
  });
});

describe("upgrade HTTP", () => {
  const http = {
    authenticate: async (req: Request) => {
      const id = /^Bearer (\S+)$/.exec(req.headers.get("Authorization") ?? "")?.[1];
      if (!id) throw new GameError("unauthenticated");
      return id;
    },
    json: (_req: Request, body: unknown, status = 200) => Response.json(body, { status }),
  };
  const call = (auth: string, body: unknown) =>
    gameHandler(http, routes(deps).upgrade)(
      new Request("http://local/upgrade", { method: "POST", headers: { Authorization: `Bearer ${auth}` }, body: JSON.stringify(body) }),
    );
  const shape = (v: unknown): unknown =>
    Array.isArray(v) ? "array" : v && typeof v === "object"
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, shape(x)]))
      : typeof v;

  it("returns exactly the ServerState shape and ignores other body fields", async () => {
    const p = await player(1000);
    const res = await call(p.id, { gearId: p.weapon, cost: 0, level: 30 });
    expect(res.status).toBe(200);
    const body = (await res.json()) as ServerState;
    expect(shape(body)).toEqual(shape(await getState(deps, p.id)));
    expect(body.inventory.find((g) => g.id === p.weapon)!.level).toBe(2);
    expect(await gold(p.id)).toBe(1000 - cost(1));
  });

  it("maps errors to 409 / 403", async () => {
    const p = await player(0);
    const poor = await call(p.id, { gearId: p.weapon });
    expect(poor.status).toBe(409);
    expect(await poor.json()).toEqual({ error: "not_enough_gold" });
    await db.query(`update gear set level = $2 where id = $1`, [p.weapon, MAX]);
    const maxed = await call(p.id, { gearId: p.weapon });
    expect(maxed.status).toBe(409);
    expect(await maxed.json()).toEqual({ error: "max_level" });
    const other = await call(p.id, { gearId: "00000000-0000-4000-8000-ffffffffffff" });
    expect(await other.json()).toEqual({ error: "not_owner" });
    expect(other.status).toBe(new GameError("not_owner").status);
  });
});

describe("upgrade grants", () => {
  const sql = `select public.game_upgrade('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 1, 0, 30, 1)`;

  it("anon and authenticated cannot execute game_upgrade or write gear level / gold", async () => {
    const id = "00000000-0000-4000-8000-000000000001";
    const claims = { sub: id, role: "authenticated" };
    await expect(as(db, "anon", null, () => db.query(sql))).rejects.toThrow(/permission denied/);
    await expect(as(db, "authenticated", claims, () => db.query(sql))).rejects.toThrow(/permission denied/);
    for (const stmt of [`update gear set level = 30 where player_id = '${id}'`, `update idle_state set gold = 999999 where player_id = '${id}'`]) {
      await expect(as(db, "authenticated", claims, () => db.query(stmt))).rejects.toThrow(/permission denied/);
    }
  });
});
