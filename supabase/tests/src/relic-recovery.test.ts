import type { PGlite } from "@electric-sql/pglite";
import type { RelicVoucher } from "@taskbar-hero/api-contract";
import { CONFIG } from "@taskbar-hero/game-rules";
import { encodeAbiParameters, encodeEventTopics, parseAbi, type Hex } from "viem";
import { generatePrivateKey } from "viem/accounts";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { forgeRelic, gameHandler, getState, reportMint, type GameDeps, type GameStore } from "../../functions/_shared/game.ts";
import { REISSUE_GRACE_SECONDS, voucherSigner, type ChainReader, type MintReceipt } from "../../functions/_shared/relic.ts";
import { forgeRelicV2, type ForgeDepsV2 } from "../../functions/_shared/v2/forge.ts";
import { getStateV2 } from "../../functions/_shared/v2/game.ts";
import { handlerV2 } from "../../functions/_shared/v2/http.ts";
import { pgliteV2Store } from "../v2/v2-store.ts";
import { as, migratedDb } from "./game-db.ts";
import { pgliteStore } from "./game-db.ts";

const NFT = "0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D";
const T0 = Date.UTC(2026, 10, 1, 10);
const TX = `0x${"12".repeat(32)}` as Hex;
const signer = voucherSigner(generatePrivateKey(), NFT);
const event = parseAbi(["event RelicForged(address indexed player, uint256 indexed relicId, uint8 rarity, uint256 nonce)"]);
let db: PGlite;
let clock = T0;
let nextPlayer = 7000;
let reads: bigint[] = [];
let read: (nonce: bigint) => Promise<boolean>;
let minted: boolean | Hex;
const receipts = new Map<string, MintReceipt>();
const chain: ChainReader = {
  receipt: async hash => receipts.get(hash) ?? null,
  nonceUsed: async nonce => { reads.push(nonce); return read(nonce); },
  nonceMinted: async () => minted,
};
const store = pgliteStore(() => db);
const v2Store = pgliteV2Store(() => db);
const deps = (): GameDeps => ({ store, seedSecret: "recovery-test", now: () => clock, relic: { signer, chain, nft: NFT } });
const depsV2 = (): ForgeDepsV2 => ({ store: v2Store, seedSecret: "recovery-test", now: () => clock, relic: { signer, chain } });
beforeAll(async () => { db = await migratedDb(); });
afterAll(async () => { await db.close(); });
beforeEach(() => { clock = T0; reads = []; read = async () => false; minted = false; receipts.clear(); });

async function player() {
  const n = ++nextPlayer;
  const id = `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  await db.query("insert into players (id, wallet) values ($1, $2)", [id, `0x${n.toString(16).padStart(40, "0")}`]);
  await db.query("insert into idle_state (player_id, shards) values ($1, $2)", [id, CONFIG.relic.shardCost * 2]);
  for (const day of ["2026-10-30", "2026-10-31"]) await db.query("insert into boss_keys (player_id, day) values ($1, $2)", [id, day]);
  for (const [key, qty] of [["yarn", 60], ["moonPearl", 2]]) {
    await db.query("insert into player_stacks (player_id, stack_id, qty) values ($1, $2, $3)", [id, key, qty]);
  }
  return id;
}
const rows = async (id: string) => (await db.query<{ nonce: string; status: string; signature: string | null; tx_hash: string | null; forge_id: string }>(
  "select nonce::text, status, signature, tx_hash, forge_id from relic_vouchers where player_id=$1 order by nonce", [id])).rows;
const balances = async (id: string) => ({
  idle: (await db.query("select shards from idle_state where player_id=$1", [id])).rows,
  keys: (await db.query("select day::text, spent_at is not null spent from boss_keys where player_id=$1 order by day", [id])).rows,
  stacks: (await db.query("select stack_id, qty from player_stacks where player_id=$1 order by stack_id", [id])).rows,
});
function receipt(v: RelicVoucher) {
  receipts.set(TX, { status: "success", logs: [{ address: NFT,
    topics: encodeEventTopics({ abi: event, eventName: "RelicForged", args: { player: v.player, relicId: BigInt(v.relicId) } }) as Hex[],
    data: encodeAbiParameters([{ type: "uint8" }, { type: "uint256" }], [v.rarity, BigInt(v.nonce)]),
  }] });
}
const afterGrace = (v: RelicVoucher) => { clock = (v.expiry + REISSUE_GRACE_SECONDS + 1) * 1000; };
const http = { authenticate: async () => "unused", json: (_req: Request, body: unknown, status = 200) => Response.json(body, { status }) };

describe.each(["v1", "v2"] as const)("%s paid Relic recovery", version => {
  const forge = (id: string) => version === "v1" ? forgeRelic(deps(), id) : forgeRelicV2(depsV2(), id);
  const state = (id: string) => version === "v1" ? getState(deps(), id) : getStateV2(depsV2(), id);
  const forgeWithStore = (id: string, recovery: Pick<GameStore, "voucherReissue">) => version === "v1"
    ? forgeRelic({ ...deps(), store: { ...store, ...recovery } }, id)
    : forgeRelicV2({ ...depsV2(), store: { ...v2Store, ...recovery } }, id);

  it("T1 used nonce with a matching RelicForged log stores its tx and never issues another voucher", async () => {
    const id = await player(); const first = await forge(id); afterGrace(first.voucher);
    read = async () => true; minted = TX;
    await expect(forge(id)).rejects.toMatchObject({ code: "forge_blocked" });
    expect(await rows(id)).toEqual([expect.objectContaining({ status: "minted", tx_hash: TX })]);
  });

  it("T2 used nonce without a mint log cancels and replaces the same Relic without spending", async () => {
    const id = await player(); const first = await forge(id); const before = await balances(id);
    afterGrace(first.voucher); read = async () => true;
    const next = await forge(id);
    expect(next.claimId).toBe(first.claimId);
    expect(next.voucher).toMatchObject({ claimId: first.claimId, relicId: first.voucher.relicId, rarity: first.voucher.rarity });
    expect(next.voucher.nonce).not.toBe(first.voucher.nonce);
    expect((await rows(id)).map(row => row.status)).toEqual(["cancelled", "issued"]);
    expect(await balances(id)).toEqual(before);
  });

  it("T3 forge, game-state and relic-mint-report carry the same existing forge claimId", async () => {
    const id = await player(); const first = await forge(id);
    expect(first.claimId).toBe((await rows(id))[0]!.forge_id);
    expect((await state(id)).forge.today?.claimId).toBe(first.claimId);
    receipt(first.voucher);
    const response = await gameHandler({ ...http, authenticate: async () => id }, (p, b) => reportMint(deps(), p, b.nonce, b.txHash))(
      new Request("http://local/relic-mint-report", { method: "POST", body: JSON.stringify({ nonce: first.voucher.nonce, txHash: TX }) }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ claimId: first.claimId, forge: { today: { claimId: first.claimId, minted: true } } });
  });

  it("T4 claimIds differ on day two and between players", async () => {
    const id = await player(); const other = await player();
    const first = await forge(id); const theirs = await forge(other);
    receipt(first.voucher); await reportMint(deps(), id, first.voucher.nonce, TX);
    clock = T0 + 86_400_000;
    const next = await forge(id);
    expect(new Set([first.claimId, theirs.claimId, next.claimId]).size).toBe(3);
  });

  it("T5 pending voucher without a signer stays visible with null signature and recoverable=true", async () => {
    const id = await player(); const first = await forge(id);
    await db.query("update relic_vouchers set signature=null where player_id=$1", [id]);
    const result = version === "v1"
      ? await getState({ ...deps(), relic: { chain, nft: NFT } }, id)
      : await getStateV2({ ...depsV2(), relic: { chain } }, id);
    expect(result.forge).toMatchObject({ blockedBy: null, recoverable: true,
      pending: { claimId: first.claimId, nonce: first.voucher.nonce, signature: null, recoverable: true },
      today: { claimId: first.claimId, recoverable: true } });
  });

  it("T6 pending voucher without a signer returns HTTP server_error, never forge_blocked or daily_limit", async () => {
    const id = await player(); await forge(id);
    await db.query("update relic_vouchers set signature=null where player_id=$1", [id]);
    const fn = version === "v1" ? gameHandler(http, () => forgeRelic({ ...deps(), relic: { chain } }, id))
      : handlerV2(http, () => forgeRelicV2({ ...depsV2(), relic: { chain } }, id));
    const response = await fn(new Request("http://local/forge", { method: "POST", body: "{}" }));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "server_error" });
  });

  it("T7 nonce becomes used after reissue: old voucher minted, new cancelled, no new signature in response", async () => {
    const id = await player(); const first = await forge(id); afterGrace(first.voucher);
    let count = 0; read = async () => ++count > 1;
    const result = await forge(id);
    expect(reads).toEqual([BigInt(first.voucher.nonce), BigInt(first.voucher.nonce)]);
    expect(result).toMatchObject({ claimId: first.claimId, voucher: first.voucher,
      state: { forge: { pending: null, today: { claimId: first.claimId, minted: true, txHash: null } } } });
    const stored = await rows(id);
    expect(stored.map(row => row.status)).toEqual(["minted", "cancelled"]);
    expect(stored[1]!.signature).toBeNull();
    expect(JSON.stringify(result)).not.toContain(`"nonce":"${stored[1]!.nonce}"`);
  });

  it("T8 nonce unused on both reads issues exactly one signed replacement", async () => {
    const id = await player(); const first = await forge(id); afterGrace(first.voucher);
    const before = await balances(id); const result = await forge(id);
    expect(reads).toEqual([BigInt(first.voucher.nonce), BigInt(first.voucher.nonce)]);
    expect(result.claimId).toBe(first.claimId);
    expect(result.voucher.nonce).not.toBe(first.voucher.nonce);
    expect(result.voucher.signature).toMatch(/^0x[0-9a-f]{130}$/);
    expect((await rows(id)).map(row => row.status)).toEqual(["expired", "issued"]);
    expect(await balances(id)).toEqual(before);
  });

  it("T9 concurrent expiry calls leave at most one issued voucher and all retries recover it", async () => {
    const id = await player(); const first = await forge(id); afterGrace(first.voucher);
    const before = await balances(id);
    const results = await Promise.allSettled([forge(id), forge(id)]);
    const successful = results.filter(result => result.status === "fulfilled");
    expect(successful.length).toBeGreaterThan(0);
    for (const result of results) if (result.status === "rejected") expect(result.reason).toMatchObject({ code: "server_error" });
    const issued = (await rows(id)).filter(row => row.status === "issued");
    expect(issued).toHaveLength(1);
    expect((await forge(id)).voucher.nonce).toBe(issued[0]!.nonce);
    expect(await balances(id)).toEqual(before);
    await expect(db.query("insert into relic_vouchers (player_id, forge_id, relic_id, rarity, expires_at) select player_id, forge_id, relic_id, rarity, expires_at from relic_vouchers where nonce=$1", [issued[0]!.nonce]))
      .rejects.toThrow(/relic_vouchers_one_issued_per_forge/);
  });

  it("T10 late mint report cancels the replacement and preserves the original claim", async () => {
    const id = await player(); const first = await forge(id); afterGrace(first.voucher);
    await forge(id); receipt(first.voucher);
    const result = await reportMint(deps(), id, first.voucher.nonce, TX);
    expect(result).toMatchObject({ claimId: first.claimId, forge: { pending: null, today: { minted: true, txHash: TX } } });
    expect((await rows(id)).map(row => row.status)).toEqual(["minted", "cancelled"]);
    expect((await state(id)).forge.pending).toBeNull();
  });

  it("state and a concurrent forge cannot sign a replacement before the creator's second chain read", async () => {
    const id = await player(); const first = await forge(id); afterGrace(first.voucher);
    let release!: () => void; let inserted!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const ready = new Promise<void>(resolve => { inserted = resolve; });
    const underlying = version === "v1" ? store : v2Store;
    const running = forgeWithStore(id, { voucherReissue: async (...args) => {
      const row = await underlying.voucherReissue(...args); inserted(); await gate; return row;
    } });
    await ready;
    try {
      const held = (await state(id)).forge.pending;
      expect(held).toMatchObject({ signature: null, recoverable: true, claimId: first.claimId });
      await expect(forge(id)).rejects.toMatchObject({ code: "server_error" });
      expect((await rows(id))[1]!.signature).toBeNull();
      read = async () => true;
    } finally { release(); }
    expect((await running).state.forge.pending).toBeNull();
    expect((await rows(id))[1]).toMatchObject({ status: "cancelled", signature: null });
  });

  it("an interrupted reissue is recoverable after its lease without another voucher or payment", async () => {
    const id = await player(); const first = await forge(id); afterGrace(first.voucher);
    const underlying = version === "v1" ? store : v2Store;
    await expect(forgeWithStore(id, { voucherReissue: async (...args) => {
      await underlying.voucherReissue(...args); throw new Error("interrupted after insert");
    } })).rejects.toThrow("interrupted after insert");
    const before = await balances(id); const held = (await rows(id))[1]!;
    expect((await state(id)).forge.pending).toMatchObject({ signature: null, recoverable: true });
    clock += (REISSUE_GRACE_SECONDS + 1) * 1000;
    const resumed = await forge(id);
    expect(resumed.voucher.nonce).toBe(held.nonce);
    expect(resumed.claimId).toBe(first.claimId);
    expect(await rows(id)).toHaveLength(2);
    expect(await balances(id)).toEqual(before);
  });

  it("a failing signer keeps state recoverable and forge fails without a daily-limit refusal", async () => {
    const id = await player(); await forge(id);
    await db.query("update relic_vouchers set signature=null where player_id=$1", [id]);
    const broken = { ...signer, sign: vi.fn(async () => { throw new Error("signer unavailable"); }) };
    const result = version === "v1" ? await getState({ ...deps(), relic: { signer: broken, chain } }, id)
      : await getStateV2({ ...depsV2(), relic: { signer: broken, chain } }, id);
    expect(result.forge).toMatchObject({ blockedBy: null, pending: { signature: null, recoverable: true } });
    const handle = version === "v1" ? gameHandler(http, () => forgeRelic({ ...deps(), relic: { signer: broken, chain } }, id))
      : handlerV2(http, () => forgeRelicV2({ ...depsV2(), relic: { signer: broken, chain } }, id));
    const response = await handle(new Request("http://local", { method: "POST", body: "{}" }));
    expect(response.status).toBe(500); expect(await response.json()).toEqual({ error: "server_error" });
  });
});

it("T12 all migrations apply in order; the new resolver is service_role only and the migration is idempotent", async () => {
  const id = await player(); const first = await forgeRelic(deps(), id); afterGrace(first.voucher);
  const held = (await store.voucherReissue(id, first.voucher.nonce, new Date(clock).toISOString(), new Date(clock + 1_800_000).toISOString()))!;
  expect(held.reissueCheckToken).toBeTruthy();
  const query = () => db.query("select public.game_voucher_reissue_resolve($1, $2, $3, false) r", [id, held.nonce, held.reissueCheckToken]);
  for (const role of ["anon", "authenticated"] as const) await expect(as(db, role, { sub: id }, query)).rejects.toThrow(/permission denied/);
  const result = await as(db, "service_role", null, query);
  expect(result.rows[0]).toMatchObject({ r: { status: "issued", reissuePending: false, claimId: first.claimId } });
  await db.exec(readFileSync(new URL("../../migrations/20261107000000_voucher_race_guard.sql", import.meta.url), "utf8"));
  expect((await getState(deps(), id)).forge.pending?.nonce).toBe(held.nonce);
});

it("a foreign player, incorrect token and expired lease owner cannot release a held replacement", async () => {
  const id = await player(); const other = await player();
  const first = await forgeRelic(deps(), id); afterGrace(first.voucher);
  const now = () => new Date(clock).toISOString();
  const expiry = () => new Date(clock + 1_800_000).toISOString();
  const held = (await store.voucherReissue(id, first.voucher.nonce, now(), expiry()))!;
  expect(await store.voucherSign(id, held.nonce, first.voucher.signature)).toBe(false);
  expect(await store.voucherResolveReissue(other, held.nonce, held.reissueCheckToken!, false)).toBeNull();
  expect(await store.voucherResolveReissue(id, held.nonce, other, false)).toBeNull();
  clock += (REISSUE_GRACE_SECONDS + 1) * 1000;
  const resumed = (await store.voucherReissue(id, held.nonce, now(), expiry()))!;
  expect(resumed.reissueCheckToken).not.toBe(held.reissueCheckToken);
  expect(await store.voucherResolveReissue(id, held.nonce, held.reissueCheckToken!, false)).toBeNull();
  const minted = await store.voucherResolveReissue(id, held.nonce, resumed.reissueCheckToken!, true);
  expect(minted).toMatchObject({ status: "minted", nonce: first.voucher.nonce, claimId: first.claimId });
  expect((await rows(id))[1]).toMatchObject({ status: "cancelled", signature: null });
});
