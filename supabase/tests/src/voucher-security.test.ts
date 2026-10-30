// Relic voucher security (docs/security-test-matrix.md): EIP-712 tampering, mint receipt matching and
// replay of used nonces. Complements forge.test.ts, which covers the happy paths and re-issue rules.
import type { PGlite } from "@electric-sql/pglite";
import { CONFIG } from "@taskbar-hero/game-rules";
import { FUJI_CHAIN_ID } from "@taskbar-hero/chain";
import { encodeAbiParameters, encodeEventTopics, parseAbi, recoverTypedDataAddress, type Address, type Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { beforeAll, describe, expect, it } from "vitest";
import type { RelicVoucher } from "../../../apps/web/src/api/GameApi.ts";
import { GameError, forgeRelic, reportMint, type GameDeps } from "../../functions/_shared/game.ts";
import {
  VOUCHER_TYPES,
  receiptMintsVoucher,
  voucherDomain,
  voucherSigner,
  type ChainReader,
  type MintReceipt,
  type VoucherFields,
} from "../../functions/_shared/relic.ts";
import { migratedDb, pgliteStore } from "./game-db.ts";

const NFT: Address = "0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D";
const OTHER_NFT: Address = "0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93";
const PLAYER: Address = "0x00000000000000000000000000000000000abc01";
const OTHER_PLAYER: Address = "0x00000000000000000000000000000000000abc02";
// Throwaway keys, new every run. Never a real signer key.
const KEY = generatePrivateKey();
const SIGNER = privateKeyToAccount(KEY).address;
const ATTACKER_KEY = generatePrivateKey();
const T0 = Date.UTC(2026, 10, 1, 10, 0, 0);

const FIELDS: VoucherFields = { player: PLAYER, relicId: 7n, rarity: 2, nonce: 424242n, expiry: 1_800_000_000n };

const sign = (v: VoucherFields, contract: Address = NFT) => voucherSigner(KEY, contract).sign(v);

/** Recover the signer of `signature` for `message` under an arbitrary domain. */
const recoverUnder = (
  signature: Hex,
  message: VoucherFields,
  domain: Record<string, unknown> = voucherDomain(NFT),
): Promise<Address | "rejected"> =>
  recoverTypedDataAddress({
    domain: domain as ReturnType<typeof voucherDomain>,
    types: VOUCHER_TYPES,
    primaryType: "Voucher",
    message,
    signature,
  }).catch(() => "rejected" as const);

describe("voucher signature binds every field and the domain", () => {
  it("recovers the signer for the exact voucher and domain (control)", async () => {
    expect(await recoverUnder(await sign(FIELDS), FIELDS)).toBe(SIGNER);
  });

  it.each([
    ["player", { player: OTHER_PLAYER }],
    ["relicId", { relicId: 8n }],
    ["rarity", { rarity: 3 }],
    ["nonce", { nonce: 424243n }],
    ["expiry", { expiry: 1_800_000_001n }],
  ] as [string, Partial<VoucherFields>][])("changing %s does not recover the signer", async (_name, change) => {
    const signature = await sign(FIELDS);
    expect(await recoverUnder(signature, { ...FIELDS, ...change })).not.toBe(SIGNER);
  });

  it("another contract address, chain id, domain name or version does not recover the signer", async () => {
    const signature = await sign(FIELDS);
    const base = voucherDomain(NFT);
    expect(FUJI_CHAIN_ID).toBe(43113);
    for (const domain of [
      voucherDomain(OTHER_NFT),
      { ...base, chainId: 1 },
      { ...base, chainId: 43114 },
      { ...base, name: "OtherGame" },
      { ...base, version: "2" },
    ]) {
      expect(await recoverUnder(signature, FIELDS, domain), JSON.stringify(domain, (_k, v) => (typeof v === "bigint" ? String(v) : v))).not.toBe(SIGNER);
    }
    // A signature made for another contract does not verify at this one.
    expect(await recoverUnder(await sign(FIELDS, OTHER_NFT), FIELDS)).not.toBe(SIGNER);
  });

  it("a different signing key never recovers the server signer", async () => {
    const forged = await privateKeyToAccount(ATTACKER_KEY).signTypedData({
      domain: voucherDomain(NFT),
      types: VOUCHER_TYPES,
      primaryType: "Voucher",
      message: FIELDS,
    });
    const recovered = await recoverUnder(forged, FIELDS);
    expect(recovered).toBe(privateKeyToAccount(ATTACKER_KEY).address);
    expect(recovered).not.toBe(SIGNER);
  });

  it("flipping a bit of the signature or its recovery byte does not recover the signer", async () => {
    const signature = await sign(FIELDS);
    const flipped = (i: number) => {
      const bytes = signature.slice(2).match(/../g)!;
      bytes[i] = ((parseInt(bytes[i]!, 16) ^ 1) & 0xff).toString(16).padStart(2, "0");
      return `0x${bytes.join("")}` as Hex;
    };
    for (const i of [0, 31, 32, 63, 64]) expect(await recoverUnder(flipped(i), FIELDS), `byte ${i}`).not.toBe(SIGNER);
    expect(await recoverUnder("0x1234" as Hex, FIELDS)).toBe("rejected");
  });

  it("the signer refuses a malformed private key without echoing it", () => {
    for (const bad of ["", "0x12", "not-a-key", KEY.slice(2)]) {
      let message = "";
      try {
        voucherSigner(bad, NFT);
      } catch (e) {
        message = (e as Error).message;
      }
      expect(message, bad).toContain("not a 32-byte hex key");
      expect(message).not.toContain(KEY);
    }
  });
});

const relicForged = parseAbi(["event RelicForged(address indexed player, uint256 indexed relicId, uint8 rarity, uint256 nonce)"]);
function forgedLog(v: VoucherFields, o: { address?: Address; player?: Address; relicId?: bigint; rarity?: number; nonce?: bigint } = {}) {
  const topics = encodeEventTopics({
    abi: relicForged,
    eventName: "RelicForged",
    args: { player: o.player ?? v.player, relicId: o.relicId ?? v.relicId },
  }) as Hex[];
  const data = encodeAbiParameters([{ type: "uint8" }, { type: "uint256" }], [o.rarity ?? v.rarity, o.nonce ?? v.nonce]);
  return { address: o.address ?? NFT, topics, data };
}
const success = (...logs: MintReceipt["logs"][number][]): MintReceipt => ({ status: "success", logs });

describe("receiptMintsVoucher matches player, relicId, rarity, nonce, contract and success", () => {
  it("accepts the exact mint, also among unrelated logs (control)", () => {
    expect(receiptMintsVoucher(success(forgedLog(FIELDS)), NFT, FIELDS)).toBe(true);
    const noise = { address: NFT, topics: [] as unknown as readonly Hex[], data: "0x" as Hex };
    expect(receiptMintsVoucher(success(noise, forgedLog(FIELDS)), NFT, FIELDS)).toBe(true);
  });

  it.each([
    ["another player", { player: OTHER_PLAYER }],
    ["another relicId", { relicId: 8n }],
    ["another rarity", { rarity: 3 }],
    ["another nonce", { nonce: 424243n }],
    ["another contract", { address: OTHER_NFT }],
  ] as [string, Parameters<typeof forgedLog>[1]][])("rejects a log with %s", (_name, override) => {
    expect(receiptMintsVoucher(success(forgedLog(FIELDS, override)), NFT, FIELDS)).toBe(false);
  });

  it("rejects reverted, missing and log-less receipts and undecodable logs", () => {
    expect(receiptMintsVoucher({ status: "reverted", logs: [forgedLog(FIELDS)] }, NFT, FIELDS)).toBe(false);
    expect(receiptMintsVoucher(null, NFT, FIELDS)).toBe(false);
    expect(receiptMintsVoucher(success(), NFT, FIELDS)).toBe(false);
    const garbage = { address: NFT, topics: forgedLog(FIELDS).topics, data: "0x00" as Hex };
    expect(receiptMintsVoucher(success(garbage), NFT, FIELDS)).toBe(false);
  });

  it("does not accept a mint of a different voucher even if only the nonce differs by one", () => {
    expect(receiptMintsVoucher(success(forgedLog({ ...FIELDS, nonce: FIELDS.nonce + 1n })), NFT, FIELDS)).toBe(false);
  });
});

describe("replay of a used nonce or a reused mint transaction", () => {
  const receipts = new Map<string, MintReceipt>();
  const chain: ChainReader = {
    receipt: async (hash) => receipts.get(hash.toLowerCase()) ?? null,
    nonceUsed: async () => false,
  };
  let db: PGlite;
  const deps: GameDeps = {
    store: pgliteStore(() => db),
    seedSecret: "test-seed-secret",
    now: () => T0,
    relic: { signer: voucherSigner(KEY, NFT), chain, nft: NFT },
  };
  let n = 5000;
  async function forgedFor(): Promise<{ id: string; v: RelicVoucher }> {
    const id = `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;
    const wallet = "0x" + n.toString(16).padStart(40, "0");
    await db.query(`insert into players (id, wallet) values ($1, $2)`, [id, wallet]);
    await db.query(`insert into idle_state (player_id, shards) values ($1, $2)`, [id, CONFIG.relic.shardCost]);
    await db.query(`insert into boss_keys (player_id, day) values ($1, $2)`, [id, "2026-10-31"]);
    return { id, v: (await forgeRelic(deps, id)).voucher };
  }
  const put = (hash: Hex, v: RelicVoucher) =>
    receipts.set(hash, success(forgedLog({ player: v.player, relicId: BigInt(v.relicId), rarity: v.rarity, nonce: BigInt(v.nonce), expiry: BigInt(v.expiry) })));

  beforeAll(async () => {
    db = await migratedDb();
  });

  it("one player's mint transaction cannot mark another player's voucher minted", async () => {
    const a = await forgedFor();
    const b = await forgedFor();
    const tx = `0x${"a1".repeat(32)}` as Hex;
    put(tx, a.v);
    await reportMint(deps, a.id, a.v.nonce, tx);
    await expect(reportMint(deps, b.id, b.v.nonce, tx)).rejects.toEqual(new GameError("mint_not_confirmed"));
    await expect(reportMint(deps, b.id, a.v.nonce, tx)).rejects.toEqual(new GameError("not_found"));
    const status = await db.query<{ status: string }>(`select status from relic_vouchers where player_id = $1`, [b.id]);
    expect(status.rows.map((r) => r.status)).toEqual(["issued"]);
  });

  it("a second report for an already minted nonce keeps the first transaction hash", async () => {
    const a = await forgedFor();
    const first = `0x${"b1".repeat(32)}` as Hex;
    const second = `0x${"b2".repeat(32)}` as Hex;
    put(first, a.v);
    put(second, a.v);
    await reportMint(deps, a.id, a.v.nonce, first);
    await reportMint(deps, a.id, a.v.nonce, second);
    const row = await db.query<{ status: string; tx_hash: string }>(`select status, tx_hash from relic_vouchers where player_id = $1`, [a.id]);
    expect(row.rows).toEqual([{ status: "minted", tx_hash: first }]);
  });

  it("a minted voucher is not issued again the same day: the forge returns the same nonce, spends nothing", async () => {
    const a = await forgedFor();
    const tx = `0x${"c1".repeat(32)}` as Hex;
    put(tx, a.v);
    await reportMint(deps, a.id, a.v.nonce, tx);
    await expect(forgeRelic(deps, a.id)).rejects.toEqual(new GameError("forge_blocked", "daily_limit"));
    const rows = await db.query<{ nonce: string }>(`select nonce::text from relic_vouchers where player_id = $1`, [a.id]);
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0]!.nonce).toBe(String(a.v.nonce));
  });
});
