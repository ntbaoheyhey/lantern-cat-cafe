import type { PGlite } from "@electric-sql/pglite";
import { CONFIG, upgradeCost } from "@taskbar-hero/game-rules";
import { encodeAbiParameters, encodeEventTopics, parseAbi, type Address, type Hex } from "viem";
import { generatePrivateKey } from "viem/accounts";
import { beforeAll, describe, expect, it } from "vitest";
import type { RelicVoucher } from "../../../apps/web/src/api/GameApi.ts";
import {
  GameError,
  claim,
  dayDate,
  fightBoss,
  forgeRelic,
  getState,
  reportMint,
  upgrade,
  type GameDeps,
} from "../../functions/_shared/game.ts";
import { REISSUE_GRACE_SECONDS, voucherSigner, type ChainReader, type MintReceipt } from "../../functions/_shared/relic.ts";
import { migratedDb, pgliteStore } from "./game-db.ts";

// Parallel duplicate calls must never double-pay or exceed a daily limit. PGlite has a single
// connection, so Promise.all interleaves the calls' statements (each Edge Function does several
// round trips) but SQL functions run one at a time. These tests cover the application-level
// read-then-write races and the row locks in the SQL, not Postgres lock timing.

const SECRET = "test-seed-secret";
const NFT: Address = "0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D";
const KEY = generatePrivateKey(); // throwaway, never a real signer key
const T0 = Date.UTC(2026, 10, 1, 10, 0, 0);
const PARALLEL = 8;

const receipts = new Map<string, MintReceipt>();
const usedNonces = new Set<bigint>();
const chain: ChainReader = {
  async receipt(hash) {
    return receipts.get(hash.toLowerCase()) ?? null;
  },
  async nonceUsed(nonce) {
    return usedNonces.has(nonce);
  },
};

let db: PGlite;
let clock = T0;
const store = pgliteStore(() => db);
const deps: GameDeps = {
  store,
  seedSecret: SECRET,
  now: () => clock,
  relic: { signer: voucherSigner(KEY, NFT), chain, nft: NFT },
};

let nextId = 1;
async function player(o: { gold?: number; shards?: number; keyDays?: string[]; lastClaimMs?: number } = {}): Promise<{ id: string; wallet: string }> {
  const n = nextId++;
  const id = `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const wallet = "0x" + (0xc0c000 + n).toString(16).padStart(40, "0");
  await db.query(`insert into players (id, wallet) values ($1, $2)`, [id, wallet]);
  await db.query(`insert into idle_state (player_id, gold, shards, last_claim_at) values ($1, $2, $3, $4)`, [
    id,
    o.gold ?? 0,
    o.shards ?? 0,
    new Date(o.lastClaimMs ?? T0).toISOString(),
  ]);
  for (const day of o.keyDays ?? []) await db.query(`insert into boss_keys (player_id, day) values ($1, $2)`, [id, day]);
  await getState(deps, id); // starter gear
  return { id, wallet };
}
const idle = async (id: string) =>
  (await db.query<{ gold: number; shards: number }>(`select gold::float8 gold, shards from idle_state where player_id = $1`, [id])).rows[0]!;
const count = async (sql: string, id: string) => Number((await db.query<{ n: string }>(sql, [id])).rows[0]!.n);
const vouchers = async (id: string) =>
  (await db.query<{ nonce: string; status: string; tx_hash: string | null }>(
    `select nonce::text, status, tx_hash from relic_vouchers where player_id = $1 order by nonce`,
    [id],
  )).rows;
const settle = <T>(ps: Promise<T>[]) => Promise.allSettled(ps);
const fulfilled = <T>(rs: PromiseSettledResult<T>[]) => rs.filter((r): r is PromiseFulfilledResult<T> => r.status === "fulfilled");
const rejected = (rs: PromiseSettledResult<unknown>[]) => rs.filter((r): r is PromiseRejectedResult => r.status === "rejected").map((r) => r.reason);

const relicForged = parseAbi(["event RelicForged(address indexed player, uint256 indexed relicId, uint8 rarity, uint256 nonce)"]);
let txCount = 0;
function mintTx(v: RelicVoucher): Hex {
  const hash = `0x${(++txCount).toString(16).padStart(64, "0")}` as Hex;
  const topics = encodeEventTopics({ abi: relicForged, eventName: "RelicForged", args: { player: v.player, relicId: BigInt(v.relicId) } }) as Hex[];
  const data = encodeAbiParameters([{ type: "uint8" }, { type: "uint256" }], [v.rarity, BigInt(v.nonce)]);
  receipts.set(hash, { status: "success", logs: [{ address: NFT, topics, data }] });
  return hash;
}

beforeAll(async () => {
  db = await migratedDb();
});

describe("idle-claim", () => {
  it("parallel claims credit one claim's worth, not one per call", async () => {
    clock = T0 + 3600_000;
    const p = await player();
    const starters = (await db.query<{ id: string }>(`select id from gear where player_id = $1`, [p.id])).rows.map((r) => r.id);
    const gearCount = () => count(`select count(*) n from gear where player_id = $1`, p.id);

    const results = await settle(Array.from({ length: PARALLEL }, () => claim(deps, p.id)));
    expect(rejected(results)).toEqual([]);
    const raced = { ...(await idle(p.id)), gear: await gearCount() };
    expect(raced.gold).toBeGreaterThan(0);

    // Same player, same seed: one sequential claim from the same starting point.
    await db.query(`update idle_state set gold = 0, shards = 0, last_claim_at = $2 where player_id = $1`, [p.id, new Date(T0).toISOString()]);
    await db.query(`delete from gear where player_id = $1 and id <> all($2::uuid[])`, [p.id, starters]);
    await claim(deps, p.id);
    expect({ ...(await idle(p.id)), gear: await gearCount() }).toEqual(raced);
    clock = T0;
  });
});

describe("boss-fight", () => {
  it("parallel fights never exceed the daily attempt cap and grant at most one key", async () => {
    clock = T0;
    const max = CONFIG.boss.maxAttemptsPerDay;
    const p = await player();
    // Win every fight so the single daily key is the thing under test.
    await db.query(`update idle_state set boss_level = 1 where player_id = $1`, [p.id]);
    await db.query(`update gear set equipped = false where player_id = $1`, [p.id]);
    for (const slot of CONFIG.slots) {
      await db.query(
        `insert into gear (player_id, item_key, slot, rarity, level, equipped) values ($1, $2, $2, 'legendary', 30, true)`,
        [p.id, slot],
      );
    }
    const results = await settle(Array.from({ length: max + 5 }, () => fightBoss(deps, p.id)));
    const day = dayDate(T0 / 1000);
    expect(await count(`select count(*) n from boss_attempts where player_id = $1 and day = '${day}'`, p.id)).toBe(max);
    expect(fulfilled(results)).toHaveLength(max);
    for (const e of rejected(results)) expect(e).toEqual(new GameError("no_attempts_left"));
    expect(fulfilled(results).filter((r) => r.value.keyGranted)).toHaveLength(1);
    expect(await count(`select count(*) n from boss_keys where player_id = $1 and day = '${day}'`, p.id)).toBe(1);
  });
});

describe("upgrade", () => {
  const price = (level: number) => upgradeCost({ slot: "weapon", rarity: "common", level })!;

  it("duplicate upgrades of the same level pay and raise once", async () => {
    const p = await player({ gold: price(1) * 100 });
    const weapon = (await getState(deps, p.id)).inventory.find((g) => g.slot === "weapon" && g.equipped)!.id;
    const results = await settle(Array.from({ length: PARALLEL }, () => upgrade(deps, p.id, weapon)));
    const ok = fulfilled(results).length;
    const level = (await db.query<{ level: number }>(`select level from gear where id = $1`, [weapon])).rows[0]!.level;
    // Each success raised exactly one level at that level's own price; nothing was charged twice.
    expect(level).toBe(1 + ok);
    let spent = 0;
    for (let l = 1; l < level; l++) spent += price(l);
    expect((await idle(p.id)).gold).toBe(price(1) * 100 - spent);
    for (const e of rejected(results)) expect(e).toBeInstanceOf(GameError);
  });
});

describe("relic-forge", () => {
  it("parallel forges pay once and every caller gets the same voucher", async () => {
    clock = T0;
    const cost = CONFIG.relic.shardCost;
    const p = await player({ shards: cost * 3, keyDays: ["2026-10-29", "2026-10-30", "2026-10-31"] });
    const results = await settle(Array.from({ length: PARALLEL }, () => forgeRelic(deps, p.id)));
    expect(rejected(results)).toEqual([]);
    const nonces = new Set(fulfilled(results).map((r) => r.value.voucher.nonce));
    expect(nonces.size).toBe(1);
    expect((await idle(p.id)).shards).toBe(cost * 2);
    expect(await count(`select count(*) n from boss_keys where player_id = $1 and spent_at is not null`, p.id)).toBe(1);
    expect(await vouchers(p.id)).toHaveLength(1);
  });

  it("parallel forges with shards for exactly one never go negative", async () => {
    clock = T0;
    const p = await player({ shards: CONFIG.relic.shardCost, keyDays: ["2026-10-31"] });
    const results = await settle(Array.from({ length: PARALLEL }, () => forgeRelic(deps, p.id)));
    expect(rejected(results)).toEqual([]);
    expect((await idle(p.id)).shards).toBe(0);
    expect(await vouchers(p.id)).toHaveLength(1);
  });

  it("parallel calls after expiry re-sign once: one live voucher, the old one expired", async () => {
    clock = T0;
    const p = await player({ shards: CONFIG.relic.shardCost, keyDays: ["2026-10-31"] });
    const first = (await forgeRelic(deps, p.id)).voucher;
    clock = (first.expiry + REISSUE_GRACE_SECONDS + 1) * 1000;
    const results = await settle(Array.from({ length: PARALLEL }, () => forgeRelic(deps, p.id)));
    expect(rejected(results)).toEqual([]);
    expect((await vouchers(p.id)).map((v) => v.status)).toEqual(["expired", "issued"]);
    expect((await idle(p.id)).shards).toBe(0);
    clock = T0;
  });
});

describe("mint voucher nonce replay", () => {
  async function forged() {
    clock = T0;
    const p = await player({ shards: CONFIG.relic.shardCost, keyDays: ["2026-10-31"] });
    return { p, v: (await forgeRelic(deps, p.id)).voucher };
  }

  it("reporting the same mint in parallel, or again with another tx, keeps the first tx hash", async () => {
    const { p, v } = await forged();
    const tx = mintTx(v);
    const results = await settle(Array.from({ length: PARALLEL }, () => reportMint(deps, p.id, v.nonce, tx)));
    expect(rejected(results)).toEqual([]);
    const second = mintTx(v);
    await reportMint(deps, p.id, v.nonce, second);
    expect(await vouchers(p.id)).toEqual([{ nonce: v.nonce, status: "minted", tx_hash: tx }]);
  });

  it("a minted nonce cannot be re-issued or re-signed", async () => {
    const { p, v } = await forged();
    await reportMint(deps, p.id, v.nonce, mintTx(v));
    const late = new Date((v.expiry + REISSUE_GRACE_SECONDS + 1) * 1000).toISOString();
    expect(await store.voucherReissue(p.id, v.nonce, late, late)).toBeNull();
    expect(await store.voucherSign(p.id, v.nonce, "0x" + "1".repeat(130))).toBe(false);
    expect(await vouchers(p.id)).toHaveLength(1);
  });

  it("another player cannot report a nonce they do not own, even with a matching receipt", async () => {
    const { p, v } = await forged();
    const thief = await player();
    await expect(reportMint(deps, thief.id, v.nonce, mintTx(v))).rejects.toEqual(new GameError("not_found"));
    expect((await vouchers(p.id))[0]!.status).toBe("issued");
  });

  it("an expired voucher whose nonce was used on chain is never re-signed, even in parallel", async () => {
    const { p, v } = await forged();
    usedNonces.add(BigInt(v.nonce));
    clock = (v.expiry + REISSUE_GRACE_SECONDS + 1) * 1000;
    const results = await settle(Array.from({ length: PARALLEL }, () => forgeRelic(deps, p.id)));
    expect(fulfilled(results)).toEqual([]);
    expect(await vouchers(p.id)).toEqual([{ nonce: v.nonce, status: "minted", tx_hash: null }]);
    clock = T0;
  });

  it("re-issued vouchers get strictly new nonces", async () => {
    const { p, v } = await forged();
    clock = (v.expiry + REISSUE_GRACE_SECONDS + 1) * 1000;
    const next = (await forgeRelic(deps, p.id)).voucher;
    expect(BigInt(next.nonce)).toBeGreaterThan(BigInt(v.nonce));
    clock = T0;
  });
});
