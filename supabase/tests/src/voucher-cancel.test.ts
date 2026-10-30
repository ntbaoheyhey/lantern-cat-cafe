// Relic recovery (docs/proposals/relic-recovery.md, fix 1): a used nonce is only a mint when a
// RelicForged log says so. A nonce burned by RelicNFT.cancelNonce gets a fresh voucher for the same forge.
import type { PGlite } from "@electric-sql/pglite";
import { CONFIG } from "@taskbar-hero/game-rules";
import { generatePrivateKey } from "viem/accounts";
import { beforeAll, describe, expect, it } from "vitest";
import { forgeRelic, type GameDeps } from "../../functions/_shared/game.ts";
import { REISSUE_GRACE_SECONDS, voucherSigner, type ChainReader } from "../../functions/_shared/relic.ts";
import { migratedDb, pgliteStore } from "./game-db.ts";

const NFT = "0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D";
const KEY = generatePrivateKey();
const T0 = Date.UTC(2026, 10, 1, 10, 0, 0);

const used = new Set<bigint>();
const minted = new Set<bigint>();
let searchFails = false;
const calls: Array<{ nonce: bigint; sinceS: number }> = [];
const chain: ChainReader = {
  receipt: async () => null,
  nonceUsed: async (n) => used.has(n),
  async nonceMinted(_player, _relicId, nonce, sinceS) {
    calls.push({ nonce, sinceS });
    if (searchFails) throw new Error("log search incomplete");
    return minted.has(nonce);
  },
};

let db: PGlite;
let clock = T0;
const deps = (): GameDeps => ({ store: pgliteStore(() => db), seedSecret: "s", now: () => clock, relic: { signer: voucherSigner(KEY, NFT), chain, nft: NFT } });
let n = 100;
async function player() {
  const id = `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;
  await db.query(`insert into players (id, wallet) values ($1, $2)`, [id, "0x" + (0xdef000 + n).toString(16).padStart(40, "0")]);
  await db.query(`insert into idle_state (player_id, shards) values ($1, $2)`, [id, CONFIG.relic.shardCost]);
  await db.query(`insert into boss_keys (player_id, day) values ($1, '2026-10-31')`, [id]);
  return id;
}
const rows = async (id: string) =>
  (await db.query<{ nonce: string; status: string; relic_id: number; rarity: string }>(
    `select nonce::text, status, relic_id, rarity from relic_vouchers where player_id = $1 order by nonce`, [id])).rows;
const afterGrace = (expiry: number) => (clock = (expiry + REISSUE_GRACE_SECONDS + 1) * 1000);

beforeAll(async () => { db = await migratedDb(); });

describe("cancelled nonce recovery", () => {
  it("nonce used with a RelicForged log: recorded as minted, daily limit applies", async () => {
    clock = T0;
    const id = await player();
    const v = (await forgeRelic(deps(), id)).voucher;
    used.add(BigInt(v.nonce)); minted.add(BigInt(v.nonce));
    afterGrace(v.expiry);
    await expect(forgeRelic(deps(), id)).rejects.toMatchObject({ code: "forge_blocked", reason: "daily_limit" });
    expect((await rows(id)).map((r) => r.status)).toEqual(["minted"]);
  });

  it("nonce used without a log (cancelNonce): cancelled and re-issued for the same forge, nothing re-charged", async () => {
    clock = T0;
    const id = await player();
    const first = (await forgeRelic(deps(), id)).voucher;
    used.add(BigInt(first.nonce));
    afterGrace(first.expiry);
    calls.length = 0;
    const second = (await forgeRelic(deps(), id)).voucher;
    expect(calls).toEqual([{ nonce: BigInt(first.nonce), sinceS: first.expiry - 1800 }]);
    expect(second.nonce).not.toBe(first.nonce);
    expect(second).toMatchObject({ relicId: first.relicId, rarity: first.rarity, player: first.player });
    expect(second.signature).toMatch(/^0x[0-9a-f]{130}$/);
    const r = await rows(id);
    expect(r.map((x) => x.status)).toEqual(["cancelled", "issued"]);
    expect(r[0]).toMatchObject({ relic_id: r[1]!.relic_id, rarity: r[1]!.rarity });
    expect((await db.query<{ s: number }>(`select shards s from idle_state where player_id = $1`, [id])).rows[0]!.s).toBe(0);
    // A second call returns the same live voucher: still exactly one issued row.
    expect((await forgeRelic(deps(), id)).voucher.nonce).toBe(second.nonce);
    expect((await rows(id)).filter((x) => x.status === "issued")).toHaveLength(1);
  });

  it("a cancelled voucher can be cancelled again if the replacement is burned too", async () => {
    clock = T0;
    const id = await player();
    const a = (await forgeRelic(deps(), id)).voucher;
    used.add(BigInt(a.nonce)); afterGrace(a.expiry);
    const b = (await forgeRelic(deps(), id)).voucher;
    used.add(BigInt(b.nonce)); afterGrace(b.expiry);
    const c = (await forgeRelic(deps(), id)).voucher;
    expect(new Set([a.nonce, b.nonce, c.nonce]).size).toBe(3);
    expect((await rows(id)).map((x) => x.status)).toEqual(["cancelled", "cancelled", "issued"]);
  });

  it("if the log search cannot be completed nothing changes and the call fails", async () => {
    clock = T0;
    const id = await player();
    const v = (await forgeRelic(deps(), id)).voucher;
    used.add(BigInt(v.nonce)); afterGrace(v.expiry);
    searchFails = true;
    await expect(forgeRelic(deps(), id)).rejects.toThrow("log search incomplete");
    searchFails = false;
    expect((await rows(id)).map((x) => x.status)).toEqual(["issued"]);
  });

  it("a live, unused voucher is never cancelled (chain says unused: normal expiry re-issue)", async () => {
    clock = T0;
    const id = await player();
    const v = (await forgeRelic(deps(), id)).voucher;
    afterGrace(v.expiry);
    calls.length = 0;
    await forgeRelic(deps(), id);
    expect(calls).toEqual([]);
    expect((await rows(id)).map((x) => x.status)).toEqual(["expired", "issued"]);
  });

  it("game_voucher_cancel_reissue refuses a nonce that is not the player's issued voucher", async () => {
    clock = T0;
    const id = await player();
    const other = await player();
    const v = (await forgeRelic(deps(), id)).voucher;
    const store = pgliteStore(() => db);
    expect(await store.voucherCancelReissue(other, v.nonce, new Date(T0 + 1000).toISOString())).toBeNull();
    expect(await store.voucherCancelReissue(id, "999999999", new Date(T0 + 1000).toISOString())).toBeNull();
    expect((await rows(id)).map((x) => x.status)).toEqual(["issued"]);
  });
});
