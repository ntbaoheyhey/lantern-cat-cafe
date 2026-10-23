import type { PGlite } from "@electric-sql/pglite";
import { CONFIG, rarityIndex, relicIdFor, rollRelicRarity } from "@taskbar-hero/game-rules";
import { encodeAbiParameters, encodeEventTopics, getAddress, parseAbi, recoverTypedDataAddress, type Address, type Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { beforeAll, describe, expect, it } from "vitest";
import type { ForgeResult, RelicVoucher } from "../../../apps/web/src/api/GameApi.ts";
import {
  GameError,
  dayDate,
  forgeRelic,
  gameHandler,
  getState,
  relicSeed,
  reportMint,
  routes,
  type GameDeps,
} from "../../functions/_shared/game.ts";
import {
  REISSUE_GRACE_SECONDS,
  VOUCHER_TTL_SECONDS,
  VOUCHER_TYPES,
  voucherDomain,
  voucherSigner,
  type ChainReader,
  type MintReceipt,
} from "../../functions/_shared/relic.ts";
import { as, migratedDb, pgliteStore } from "./game-db.ts";

const SECRET = "test-seed-secret";
const NFT: Address = "0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D";
const OTHER: Address = "0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93";
// Throwaway key, new every run. Never a real signer key.
const KEY = generatePrivateKey();
const SIGNER = privateKeyToAccount(KEY).address;
// 2026-11-01 10:00 UTC = 17:00 UTC+7.
const T0 = Date.UTC(2026, 10, 1, 10, 0, 0);
const COST: number = CONFIG.relic.shardCost;

/** Fake Fuji: receipts by tx hash, used nonces, and a switch to make the RPC fail. */
const receipts = new Map<string, MintReceipt>();
const usedNonces = new Set<bigint>();
let rpcDown = false;
const chain: ChainReader = {
  async receipt(hash) {
    if (rpcDown) throw new Error("rpc down");
    return receipts.get(hash.toLowerCase()) ?? null;
  },
  async nonceUsed(nonce) {
    if (rpcDown) throw new Error("rpc down");
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
/** A player with `shards` shards and an unspent Boss Key for each day in `keyDays`. */
async function player(shards: number = COST, keyDays: string[] = ["2026-10-31"]): Promise<{ id: string; wallet: string }> {
  const n = nextId++;
  const id = `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const wallet = "0x" + (0xabc000 + n).toString(16).padStart(40, "0");
  await db.query(`insert into players (id, wallet) values ($1, $2)`, [id, wallet]);
  await db.query(`insert into idle_state (player_id, shards) values ($1, $2)`, [id, shards]);
  for (const day of keyDays) await db.query(`insert into boss_keys (player_id, day) values ($1, $2)`, [id, day]);
  return { id, wallet };
}
const shards = async (id: string) => (await db.query<{ s: number }>(`select shards s from idle_state where player_id = $1`, [id])).rows[0]!.s;
const keys = async (id: string) =>
  (await db.query<{ day: string; spent: boolean }>(
    `select day::text, spent_at is not null spent from boss_keys where player_id = $1 order by day`,
    [id],
  )).rows;
const vouchers = async (id: string) =>
  (await db.query<{ nonce: string; status: string; relic_id: number; rarity: string; tx_hash: string | null }>(
    `select nonce::text, status, relic_id, rarity, tx_hash from relic_vouchers where player_id = $1 order by nonce`,
    [id],
  )).rows;

const recover = (v: RelicVoucher) =>
  recoverTypedDataAddress({
    domain: voucherDomain(NFT),
    types: VOUCHER_TYPES,
    primaryType: "Voucher",
    message: { player: v.player, relicId: BigInt(v.relicId), rarity: v.rarity, nonce: BigInt(v.nonce), expiry: BigInt(v.expiry) },
    signature: v.signature,
  });

const relicForged = parseAbi(["event RelicForged(address indexed player, uint256 indexed relicId, uint8 rarity, uint256 nonce)"]);
let txCount = 0;
/** Store a receipt for a mint of `v` (with overrides) and return its tx hash. */
function mintTx(v: RelicVoucher, o: { address?: Address; nonce?: bigint; player?: Address; status?: "success" | "reverted" } = {}): Hex {
  const hash = `0x${(++txCount).toString(16).padStart(64, "0")}` as Hex;
  const topics = encodeEventTopics({
    abi: relicForged,
    eventName: "RelicForged",
    args: { player: o.player ?? v.player, relicId: BigInt(v.relicId) },
  }) as Hex[];
  const data = encodeAbiParameters([{ type: "uint8" }, { type: "uint256" }], [v.rarity, o.nonce ?? BigInt(v.nonce)]);
  receipts.set(hash, { status: o.status ?? "success", logs: [{ address: o.address ?? NFT, topics, data }] });
  return hash;
}

beforeAll(async () => {
  db = await migratedDb();
});

describe("relic-forge", () => {
  it("spends shards and the oldest Boss Key and returns a voucher signed by the server key", async () => {
    clock = T0;
    const p = await player(COST + 5, ["2026-10-30", "2026-10-31"]);
    const r = await forgeRelic(deps, p.id);
    const day = dayDate(T0 / 1000);
    const rarity = rollRelicRarity(await relicSeed(SECRET, p.id, day));

    expect(r.voucher).toMatchObject({
      player: getAddress(p.wallet),
      relicId: String(relicIdFor(rarity)),
      rarity: rarityIndex(rarity),
      rarityName: rarity,
      expiry: T0 / 1000 + VOUCHER_TTL_SECONDS,
    });
    expect(r.voucher.signature).toMatch(/^0x[0-9a-f]{130}$/);
    expect(await recover(r.voucher)).toBe(SIGNER);

    expect(await shards(p.id)).toBe(5);
    expect(await keys(p.id)).toEqual([
      { day: "2026-10-30", spent: true },
      { day: "2026-10-31", spent: false },
    ]);
    expect(r.state).toMatchObject({ shards: 5, bossKeys: 1 });
    expect(r.state.forge).toEqual({ blockedBy: null, forgedToday: true, pending: r.voucher });
    expect(await vouchers(p.id)).toEqual([
      { nonce: r.voucher.nonce, status: "issued", relic_id: relicIdFor(rarity), rarity, tx_hash: null },
    ]);
    // game-state shows the same pending voucher.
    expect((await getState(deps, p.id)).forge.pending).toEqual(r.voucher);
  });

  it("a second call the same day returns the same voucher and spends nothing", async () => {
    clock = T0;
    const p = await player(COST * 2, ["2026-10-30", "2026-10-31"]);
    const first = await forgeRelic(deps, p.id);
    clock = T0 + 60_000;
    const again = await forgeRelic(deps, p.id);
    expect(again.voucher).toEqual(first.voucher);
    expect(await shards(p.id)).toBe(COST);
    expect((await keys(p.id)).filter((k) => k.spent)).toHaveLength(1);
    expect(await vouchers(p.id)).toHaveLength(1);
  });

  it("after expiry re-signs the same Relic with a new nonce and expiry; the old voucher becomes expired", async () => {
    clock = T0;
    const p = await player();
    const first = (await forgeRelic(deps, p.id)).voucher;

    // Inside the grace period the expired voucher is still returned as is.
    clock = (first.expiry + REISSUE_GRACE_SECONDS) * 1000;
    expect((await forgeRelic(deps, p.id)).voucher).toEqual(first);

    clock = (first.expiry + REISSUE_GRACE_SECONDS + 1) * 1000;
    const second = (await forgeRelic(deps, p.id)).voucher;
    expect(second.nonce).not.toBe(first.nonce);
    expect(BigInt(second.nonce)).toBeGreaterThan(BigInt(first.nonce));
    expect(second).toMatchObject({ relicId: first.relicId, rarity: first.rarity, rarityName: first.rarityName, player: first.player });
    expect(second.expiry).toBe(clock / 1000 + VOUCHER_TTL_SECONDS);
    expect(await recover(second)).toBe(SIGNER);
    expect((await vouchers(p.id)).map((v) => v.status)).toEqual(["expired", "issued"]);
    expect(await shards(p.id)).toBe(0);
    clock = T0;
  });

  it("an expired voucher that was minted anyway is recorded, not re-signed", async () => {
    clock = T0;
    const p = await player();
    const v = (await forgeRelic(deps, p.id)).voucher;
    usedNonces.add(BigInt(v.nonce));
    clock = (v.expiry + REISSUE_GRACE_SECONDS + 1) * 1000; // same game day (T0 + ~32 min)
    await expect(forgeRelic(deps, p.id)).rejects.toMatchObject({ code: "forge_blocked", reason: "daily_limit" });
    expect(await vouchers(p.id)).toEqual([expect.objectContaining({ nonce: v.nonce, status: "minted", tx_hash: null })]);
    clock = T0;
  });

  it("does not re-sign when the chain cannot be read", async () => {
    clock = T0;
    const p = await player();
    const v = (await forgeRelic(deps, p.id)).voucher;
    clock = (v.expiry + REISSUE_GRACE_SECONDS + 1) * 1000;
    rpcDown = true;
    try {
      await expect(forgeRelic(deps, p.id)).rejects.toThrow(/rpc down/);
    } finally {
      rpcDown = false;
    }
    expect((await vouchers(p.id)).map((x) => x.status)).toEqual(["issued"]);
    clock = T0;
  });

  it("after a mint: blocked for the rest of the day, allowed again the next day", async () => {
    clock = T0;
    const p = await player(COST * 2, ["2026-10-30", "2026-10-31"]);
    const v = (await forgeRelic(deps, p.id)).voucher;
    await reportMint(deps, p.id, v.nonce, mintTx(v));

    clock = T0 + 3600_000;
    const blocked = await getState(deps, p.id);
    expect(blocked.forge).toEqual({ blockedBy: "daily_limit", forgedToday: true, pending: null });
    await expect(forgeRelic(deps, p.id)).rejects.toMatchObject({ code: "forge_blocked", reason: "daily_limit" });

    clock = Date.UTC(2026, 10, 1, 17, 0, 1); // 00:00:01 UTC+7 on 2026-11-02
    expect((await getState(deps, p.id)).forge).toEqual({ blockedBy: null, forgedToday: false, pending: null });
    const next = await forgeRelic(deps, p.id);
    expect(next.voucher.nonce).not.toBe(v.nonce);
    expect(await shards(p.id)).toBe(0);
    expect((await keys(p.id)).every((k) => k.spent)).toBe(true);
    clock = T0;
  });

  it("refuses with no_boss_key or not_enough_shards and spends nothing", async () => {
    clock = T0;
    const noKey = await player(COST * 3, []);
    await expect(forgeRelic(deps, noKey.id)).rejects.toEqual(new GameError("forge_blocked", "no_boss_key"));
    expect(await shards(noKey.id)).toBe(COST * 3);

    const poor = await player(COST - 1);
    await expect(forgeRelic(deps, poor.id)).rejects.toEqual(new GameError("forge_blocked", "not_enough_shards"));
    expect(await shards(poor.id)).toBe(COST - 1);
    expect(await keys(poor.id)).toEqual([{ day: "2026-10-31", spent: false }]);
    expect(await vouchers(poor.id)).toEqual([]);
    expect((await getState(deps, poor.id)).forge).toEqual({ blockedBy: "not_enough_shards", forgedToday: false, pending: null });
  });

  it("two concurrent forges spend once and both get the same voucher", async () => {
    clock = T0;
    const p = await player(COST * 3, ["2026-10-29", "2026-10-30", "2026-10-31"]);
    const [a, b] = await Promise.all([forgeRelic(deps, p.id), forgeRelic(deps, p.id)]);
    expect(a.voucher).toEqual(b.voucher);
    expect(await shards(p.id)).toBe(COST * 2);
    expect((await keys(p.id)).filter((k) => k.spent)).toHaveLength(1);
    expect(await vouchers(p.id)).toHaveLength(1);
    expect(Number((await db.query<{ n: string }>(`select count(*) n from relic_forges where player_id = $1`, [p.id])).rows[0]!.n)).toBe(1);
  });

  it("game-state signs a voucher left unsigned by an interrupted forge, or hides it without a signer", async () => {
    clock = T0;
    const p = await player();
    const out = await store.forge({
      playerId: p.id,
      day: dayDate(T0 / 1000),
      relicId: 1,
      rarity: "common",
      shardCost: COST,
      keyCost: 1,
      expiresAt: new Date(T0 + VOUCHER_TTL_SECONDS * 1000).toISOString(),
    });
    expect(out.status).toBe("new");
    const noSigner: GameDeps = { ...deps, relic: { chain, nft: NFT } };
    expect((await getState(noSigner, p.id)).forge).toEqual({ blockedBy: "daily_limit", forgedToday: true, pending: null });
    const pending = (await getState(deps, p.id)).forge.pending!;
    expect(await recover(pending)).toBe(SIGNER);
    expect((await getState(noSigner, p.id)).forge.pending).toEqual(pending);
  });

  it("answers server_error when the signer is not configured, before spending anything", async () => {
    clock = T0;
    const p = await player();
    await expect(forgeRelic({ ...deps, relic: { chain, nft: NFT } }, p.id)).rejects.toMatchObject({ code: "server_error" });
    expect(await shards(p.id)).toBe(COST);
  });
});

describe("relic-mint-report", () => {
  async function forged() {
    clock = T0;
    const p = await player();
    return { p, v: (await forgeRelic(deps, p.id)).voucher };
  }

  it("a valid receipt marks the voucher minted and clears forge.pending; a repeat is unchanged", async () => {
    const { p, v } = await forged();
    const tx = mintTx(v);
    const s = await reportMint(deps, p.id, v.nonce, tx.toUpperCase().replace("0X", "0x"));
    expect(s.forge).toEqual({ blockedBy: "daily_limit", forgedToday: true, pending: null });
    expect(await vouchers(p.id)).toEqual([expect.objectContaining({ status: "minted", tx_hash: tx })]);
    const again = await reportMint(deps, p.id, v.nonce, tx);
    expect(again).toEqual(s);
    // Already minted: even a hash that proves nothing returns the state unchanged.
    expect(await reportMint(deps, p.id, v.nonce, mintTx(v, { status: "reverted" }))).toEqual(s);
  });

  it("refuses receipts that do not mint exactly this voucher", async () => {
    const { p, v } = await forged();
    const bad = [
      mintTx(v, { nonce: BigInt(v.nonce) + 1n }),
      mintTx(v, { status: "reverted" }),
      mintTx(v, { address: OTHER }),
      mintTx(v, { player: OTHER }),
      `0x${"f".repeat(64)}`, // unknown tx
      "0x1234", // not a tx hash
    ];
    for (const tx of bad) {
      await expect(reportMint(deps, p.id, v.nonce, tx), tx).rejects.toEqual(new GameError("mint_not_confirmed"));
    }
    rpcDown = true;
    try {
      await expect(reportMint(deps, p.id, v.nonce, mintTx(v))).rejects.toEqual(new GameError("mint_not_confirmed"));
    } finally {
      rpcDown = false;
    }
    expect((await vouchers(p.id)).map((x) => x.status)).toEqual(["issued"]);
  });

  it("another player's or an unknown nonce is not_found", async () => {
    const { v } = await forged();
    const other = await player();
    await expect(reportMint(deps, other.id, v.nonce, mintTx(v))).rejects.toEqual(new GameError("not_found"));
    for (const nonce of ["999999", "0", "-1", "1e3", "99999999999999999999", 7]) {
      await expect(reportMint(deps, other.id, nonce, mintTx(v))).rejects.toEqual(new GameError("not_found"));
    }
  });
});

describe("HTTP", () => {
  const http = {
    authenticate: async (req: Request) => {
      const id = /^Bearer (\S+)$/.exec(req.headers.get("Authorization") ?? "")?.[1];
      if (!id) throw new GameError("unauthenticated");
      return id;
    },
    json: (_req: Request, body: unknown, status = 200) => Response.json(body, { status }),
  };
  const call = (name: "relic-forge" | "relic-mint-report", auth: string, body: unknown = {}) =>
    gameHandler(http, routes(deps)[name])(
      new Request(`http://local/${name}`, { method: "POST", headers: { Authorization: `Bearer ${auth}` }, body: JSON.stringify(body) }),
    );

  it("relic-forge returns the ForgeResult shape and ignores body fields", async () => {
    clock = T0;
    const p = await player();
    const res = await call("relic-forge", p.id, { rarity: "legendary", relicId: 4, player: OTHER, now: 0 });
    expect(res.status).toBe(200);
    const body = (await res.json()) as ForgeResult;
    const fixture: ForgeResult = {
      voucher: { player: OTHER, relicId: "1", rarity: 0, rarityName: "common", nonce: "1", expiry: 1, signature: "0x" },
      state: {
        gold: 0,
        shards: 0,
        gear: [{ slot: "weapon", rarity: "common", level: 1 }],
        inventory: [{ id: "x", slot: "weapon", rarity: "common", level: 1, equipped: true }],
        bossLevel: 1,
        bossKeys: 0,
        boss: { level: 1, attemptsToday: 0, attemptsLeft: 5, keyEarnedToday: false },
        forge: {
          blockedBy: null,
          forgedToday: true,
          pending: { player: OTHER, relicId: "1", rarity: 0, rarityName: "common", nonce: "1", expiry: 1, signature: "0x" },
        },
        power: 1,
        goldPerSecond: 1,
        serverTime: 1,
      },
    };
    const shape = (v: unknown): unknown =>
      Array.isArray(v) ? "array" : v && typeof v === "object"
        ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, shape(x)]))
        : typeof v;
    expect(shape(body)).toEqual(shape(fixture));
    expect(body.voucher.player).toBe(getAddress(p.wallet));
    const day = dayDate(T0 / 1000);
    expect(body.voucher.rarityName).toBe(rollRelicRarity(await relicSeed(SECRET, p.id, day)));
  });

  it("forge_blocked is 409 with the reason; mint_not_confirmed and not_found map to 409 and 404", async () => {
    clock = T0;
    const p = await player(0);
    const blocked = await call("relic-forge", p.id);
    expect(blocked.status).toBe(409);
    expect(await blocked.json()).toEqual({ error: "forge_blocked", reason: "not_enough_shards" });
    const missing = await call("relic-mint-report", p.id, { nonce: "424242", txHash: `0x${"a".repeat(64)}` });
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: "not_found" });
  });

  it("server_error never leaks a reason", async () => {
    clock = T0;
    const p = await player();
    const res = await gameHandler(http, routes({ ...deps, relic: undefined })["relic-forge"])(
      new Request("http://local/relic-forge", { method: "POST", headers: { Authorization: `Bearer ${p.id}` }, body: "{}" }),
    );
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "server_error" });
  });
});

describe("grants and RLS", () => {
  const fns = [
    `select public.game_forge('00000000-0000-4000-8000-000000000001', '2026-11-01', 1, 'common', 60, 1, now() + interval '1 hour')`,
    `select public.game_voucher_sign('00000000-0000-4000-8000-000000000001', 1, '0x')`,
    `select public.game_voucher_reissue('00000000-0000-4000-8000-000000000001', 1, now(), now())`,
    `select public.game_voucher('00000000-0000-4000-8000-000000000001', 1)`,
    `select public.game_voucher_minted('00000000-0000-4000-8000-000000000001', 1, null)`,
    `select public.game_voucher_json(v) from relic_vouchers v limit 1`,
  ];

  it("anon and authenticated cannot execute the new functions", async () => {
    const claims = { sub: "00000000-0000-4000-8000-000000000001", role: "authenticated" };
    for (const sql of fns) {
      await expect(as(db, "anon", null, () => db.query(sql)), sql).rejects.toThrow(/permission denied/);
      await expect(as(db, "authenticated", claims, () => db.query(sql)), sql).rejects.toThrow(/permission denied/);
    }
    await expect(as(db, "service_role", null, () => db.query(fns[5]!))).rejects.toThrow(/permission denied/);
  });

  it("players read only their own forges and vouchers, and cannot write them", async () => {
    clock = T0;
    const a = await player();
    const b = await player();
    await forgeRelic(deps, a.id);
    await forgeRelic(deps, b.id);
    const claims = { sub: a.id, role: "authenticated" };
    for (const t of ["relic_forges", "relic_vouchers"]) {
      const rows = await as(db, "authenticated", claims, () => db.query<{ player_id: string }>(`select player_id from ${t}`));
      expect(new Set(rows.rows.map((r) => r.player_id)), t).toEqual(new Set([a.id]));
    }
    for (const sql of [
      `insert into relic_forges (player_id, day, relic_id, rarity) values ('${a.id}', '2026-12-01', 4, 'legendary')`,
      `update relic_vouchers set status = 'issued', rarity = 'legendary' where player_id = '${a.id}'`,
      `delete from relic_forges where player_id = '${a.id}'`,
    ]) {
      await expect(as(db, "authenticated", claims, () => db.query(sql)), sql).rejects.toThrow(/permission denied/);
    }
  });
});
