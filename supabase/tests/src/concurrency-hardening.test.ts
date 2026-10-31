/// <reference lib="dom" />
import type { PGlite } from "@electric-sql/pglite";
import { CONFIG, v2 } from "@taskbar-hero/game-rules";
import { encodeAbiParameters, encodeEventTopics, parseAbi, type Hex } from "viem";
import { generatePrivateKey } from "viem/accounts";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { MockGameApiV2 } from "../../../apps/web/src/api/MockGameApiV2.ts";
import { dayDate, forgeRelic, reportMint, type GameDeps } from "../../functions/_shared/game.ts";
import { REISSUE_GRACE_SECONDS, voucherSigner } from "../../functions/_shared/relic.ts";
import { claimV2, chooseClassV2, type V2Deps, type V2Store } from "../../functions/_shared/v2/game.ts";
import { newPlayer, stack } from "../v2/helpers.ts";
import { pgliteV2Store } from "../v2/v2-store.ts";
import { migratedDb, pgliteStore } from "./game-db.ts";

let db: PGlite;
beforeAll(async () => { db = await migratedDb(); });
afterAll(async () => { await db.close(); });

it("five v2 claims forced to read the same snapshot pay exactly one window in PGlite", async () => {
  const store = pgliteV2Store(() => db);
  let clock = Date.UTC(2026, 10, 1, 10);
  const deps: V2Deps = { store, seedSecret: "n2-races", now: () => clock };
  const p = await newPlayer(db);
  await chooseClassV2(deps, p, { classId: "warrior" });
  const initial = (await store.snapshot(p, dayDate(clock / 1000)))!;
  clock = initial.lastClaimMicros / 1000 + 3600_000;
  let arrivals = 0; let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const snapshot: V2Store["snapshot"] = async (...args) => {
    const row = await store.snapshot(...args);
    if (arrivals < 5) { if (++arrivals === 5) release(); await gate; }
    return row;
  };
  const claims = await Promise.all(Array.from({ length: 5 }, () => claimV2({ ...deps, store: { ...store, snapshot } }, p)));
  expect(claims.filter(r => r.gains.fish > 0)).toHaveLength(1);
  expect(await stack(db, p, "fish")).toBe(claims.reduce((total, r) => total + r.gains.fish, 0));
  expect(await stack(db, p, "catKey")).toBe(v2.V2_CONFIG.idle.dailyKeys);
  const after = (await store.snapshot(p, dayDate(clock / 1000)))!;
  expect(after.progressRev).toBe(initial.progressRev + 1);
  expect(after.lastClaimMicros).toBe(clock * 1000);
});

it("the in-memory demo store also pays one of five claims and spends once for a parallel craft requestId", async () => {
  let clock = 0;
  const api = new MockGameApiV2({ storage: null, now: () => clock });
  await api.chooseClass("warrior"); clock = 3600_000;
  const claims = await Promise.all(Array.from({ length: 5 }, () => api.claim()));
  expect(claims.filter(r => r.gains.fish > 0)).toHaveLength(1);
  expect((await api.getState()).currencies.fish).toBe(claims.reduce((total, r) => total + r.gains.fish, 0));
  const recipe = v2.RECIPES.find(r => r.id === "rcp.common")!;
  const craft = new MockGameApiV2({ storage: null, now: () => 0,
    start: Object.fromEntries(Object.entries({ ...recipe.materials, fish: recipe.fish }).map(([id, qty]) => [id, qty * 2])) });
  await craft.chooseClass("warrior");
  const requestId = crypto.randomUUID();
  const results = await Promise.all(Array.from({ length: 5 }, () => craft.craft("rcp.common", "weapon", requestId)));
  expect(new Set(results.map(r => r.item.id)).size).toBe(1);
  expect((await craft.getState()).currencies.fish).toBe(recipe.fish);
  expect((await craft.getState()).inventory).toHaveLength(2);
});

it("parallel mint reports using one tx from two players credit only the voucher owner", async () => {
  const nft = "0x1111111111111111111111111111111111111111";
  const store = pgliteStore(() => db);
  const clock = Date.UTC(2026, 10, 1, 10);
  const deps: GameDeps = { store, seedSecret: "n2-mint", now: () => clock,
    relic: { signer: voucherSigner(generatePrivateKey(), nft), nft, chain: { nonceUsed: async () => false, receipt: async () => null } } };
  const [owner, other] = await Promise.all([newPlayer(db), newPlayer(db)]);
  for (const p of [owner, other]) {
    await db.query("insert into idle_state (player_id, shards) values ($1, $2)", [p, CONFIG.relic.shardCost]);
    await db.query("insert into boss_keys (player_id, day) values ($1, '2026-10-31')", [p]);
  }
  const ownVoucher = (await forgeRelic(deps, owner)).voucher;
  const otherVoucher = (await forgeRelic(deps, other)).voucher;
  const tx = `0x${"39".repeat(32)}` as Hex;
  const abi = parseAbi(["event RelicForged(address indexed player, uint256 indexed relicId, uint8 rarity, uint256 nonce)"]);
  deps.relic!.chain!.receipt = async () => ({ status: "success", logs: [{ address: nft,
    topics: encodeEventTopics({ abi, eventName: "RelicForged", args: { player: ownVoucher.player, relicId: BigInt(ownVoucher.relicId) } }) as Hex[],
    data: encodeAbiParameters([{ type: "uint8" }, { type: "uint256" }], [ownVoucher.rarity, BigInt(ownVoucher.nonce)]),
  }] });
  // The attacker tries both the owner's nonce and their own nonce against the same receipt.
  const results = await Promise.allSettled([
    reportMint(deps, owner, ownVoucher.nonce, tx), reportMint(deps, other, ownVoucher.nonce, tx), reportMint(deps, other, otherVoucher.nonce, tx),
  ]);
  expect(results[0]!.status).toBe("fulfilled");
  expect(results[1]).toMatchObject({ status: "rejected", reason: { code: "not_found" } });
  expect(results[2]).toMatchObject({ status: "rejected", reason: { code: "mint_not_confirmed" } });
  expect((await db.query("select player_id, nonce::text, tx_hash from relic_vouchers where status='minted'")).rows)
    .toEqual([{ player_id: owner, nonce: ownVoucher.nonce, tx_hash: tx }]);
  expect((await store.voucher(other, otherVoucher.nonce))!.status).toBe("issued");
});

it("five concurrent expiry forges leave one issued replacement and invoke its signer only once", async () => {
  const store = pgliteStore(() => db);
  const nft = "0x1111111111111111111111111111111111111111";
  const signer = voucherSigner(generatePrivateKey(), nft);
  const sign = vi.fn(signer.sign.bind(signer));
  let clock = Date.UTC(2026, 10, 1, 10);
  const deps: GameDeps = { store, seedSecret: "n2-reissue", now: () => clock,
    relic: { signer: { ...signer, sign }, nft, chain: { nonceUsed: async () => false, receipt: async () => null } } };
  const p = await newPlayer(db);
  await db.query("insert into idle_state (player_id, shards) values ($1, $2)", [p, CONFIG.relic.shardCost]);
  await db.query("insert into boss_keys (player_id, day) values ($1, '2026-10-31')", [p]);
  const first = (await forgeRelic(deps, p)).voucher;
  sign.mockClear(); clock = (first.expiry + REISSUE_GRACE_SECONDS + 1) * 1000;
  let arrivals = 0; let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const using: GameDeps = { ...deps, store: { ...store, snapshot: async (...args) => {
    const row = await store.snapshot(...args);
    if (arrivals < 5) { if (++arrivals === 5) release(); await gate; }
    return row;
  } } };
  const results = await Promise.allSettled(Array.from({ length: 5 }, () => forgeRelic(using, p)));
  expect(results.some(r => r.status === "fulfilled")).toBe(true);
  for (const result of results) if (result.status === "rejected") expect(result.reason).toMatchObject({ code: "server_error" });
  const rows = (await db.query<{ nonce: string; status: string; signature: string | null }>(
    "select nonce::text, status, signature from relic_vouchers where player_id=$1 order by nonce", [p])).rows;
  expect(rows.map(r => r.status)).toEqual(["expired", "issued"]);
  expect(rows[1]!.signature).toMatch(/^0x[0-9a-f]{130}$/);
  for (const result of results) if (result.status === "fulfilled") expect(result.value.voucher.nonce).toBe(rows[1]!.nonce);
  expect((await db.query("select shards from idle_state where player_id=$1", [p])).rows).toEqual([{ shards: 0 }]);
  expect(sign).toHaveBeenCalledTimes(1);
});
