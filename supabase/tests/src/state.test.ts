import type { PGlite } from "@electric-sql/pglite";
import { CONFIG, heroPower, starterGear } from "@taskbar-hero/game-rules";
import { buildServerState, type OwnedGear, type ServerState, type StoredState } from "@taskbar-hero/api-contract";
import { beforeAll, describe, expect, it } from "vitest";
import { MockGameApi } from "../../../apps/web/src/api/MockGameApi.ts";
import { getState, type GameDeps } from "../../functions/_shared/game.ts";
import { migratedDb, pgliteStore } from "./game-db.ts";

const T0 = Date.UTC(2026, 10, 1, 5, 0, 0); // ms
const PLAYER = "00000000-0000-4000-8000-0000000000c1";

let db: PGlite;
const deps: GameDeps = { store: pgliteStore(() => db), seedSecret: "state-test-secret", now: () => T0 };

/** Item ids are minted by each side, so compare states with them blanked. */
const withoutIds = (s: ServerState): ServerState => ({ ...s, inventory: s.inventory.map((g) => ({ ...g, id: "" })) });

beforeAll(async () => {
  db = await migratedDb();
  await db.query(`insert into players (id, wallet) values ($1, $2)`, [PLAYER, "0x" + "c".repeat(40)]);
  await db.query(`insert into idle_state (player_id, last_claim_at, gold, shards) values ($1, $2, 750, 42)`, [
    PLAYER,
    new Date(T0).toISOString(),
  ]);
});

describe("shared state builder", () => {
  it("gives the Edge Function and MockGameApi the same ServerState for the same stored numbers", async () => {
    const server = await getState(deps, PLAYER);
    const mock = await new MockGameApi({ now: () => T0, start: { gold: 750, shards: 42 } }).getState();
    expect(withoutIds(mock)).toEqual(withoutIds(server));
    expect(server).toMatchObject({ gold: 750, shards: 42, power: heroPower(starterGear()) });
  });

  describe("buildServerState", () => {
    const item = (id: string, slot: OwnedGear["slot"], equipped: boolean): OwnedGear => ({ id, slot, rarity: "common", level: 1, equipped });
    const stored = (over: Partial<StoredState> = {}): StoredState => ({
      gold: 10,
      shards: 0,
      bossKeys: 0,
      bossLevel: 2,
      inventory: [item("a", "weapon", true), item("b", "weapon", false)],
      attemptsToday: 0,
      keyEarnedToday: false,
      forgedToday: false,
      pending: null,
      today: null,
      ...over,
    });
    const voucher = { player: "0x" + "1".repeat(40), relicId: 1, rarity: 0, rarityName: "common", nonce: "1", expiry: 1, signature: "0x" + "2".repeat(130) } as never;

    it("derives power and gold per second from equipped gear only, and clamps attempts left", () => {
      const s = buildServerState(stored({ attemptsToday: CONFIG.boss.maxAttemptsPerDay + 3 }), T0);
      expect(s.gear).toEqual([{ slot: "weapon", rarity: "common", level: 1 }]);
      expect(s.inventory).toHaveLength(2);
      expect(s.power).toBe(heroPower(s.gear));
      expect(s.boss).toEqual({ level: 2, attemptsToday: CONFIG.boss.maxAttemptsPerDay + 3, attemptsLeft: 0, keyEarnedToday: false });
      expect(s.serverTime).toBe(T0 / 1000);
    });

    it("blocks the forge in game-rules order, and a pending voucher unblocks it", () => {
      const block = (o: Partial<StoredState>) => buildServerState(stored(o), T0).forge.blockedBy;
      expect(block({ forgedToday: true, bossKeys: 5, shards: 999 })).toBe("daily_limit");
      expect(block({ shards: 999 })).toBe("no_boss_key");
      expect(block({ bossKeys: 1 })).toBe("not_enough_shards");
      expect(block({ bossKeys: 1, shards: CONFIG.relic.shardCost })).toBeNull();
      expect(block({ forgedToday: true, pending: voucher })).toBeNull();
    });

    it("does not alias the caller's objects", () => {
      const input = stored({ pending: voucher });
      const s = buildServerState(input, T0);
      expect(s.forge.pending).toEqual(input.pending);
      expect(s.forge.pending).not.toBe(input.pending);
      expect(s.inventory[0]).not.toBe(input.inventory[0]);
    });
  });
});
