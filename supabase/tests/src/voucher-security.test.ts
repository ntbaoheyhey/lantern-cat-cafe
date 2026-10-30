import { encodeAbiParameters, encodeEventTopics, getAddress, parseAbi, recoverTypedDataAddress, type Address, type Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { describe, expect, it } from "vitest";
import { FUJI_CHAIN_ID } from "@taskbar-hero/chain";
import {
  VOUCHER_TYPES,
  receiptMintsVoucher,
  voucherDomain,
  voucherSigner,
  type MintReceipt,
  type VoucherFields,
} from "../../functions/_shared/relic.ts";

// EIP-712 voucher: replay and tampering, off chain. The contract side is covered by contracts/test.
const NFT: Address = "0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D";
const OTHER_NFT: Address = "0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93";
const KEY = generatePrivateKey(); // throwaway, new every run
const SIGNER = privateKeyToAccount(KEY).address;
const PLAYER = getAddress("0x1111111111111111111111111111111111111111");
const RELIC_FORGED = parseAbi(["event RelicForged(address indexed player, uint256 indexed relicId, uint8 rarity, uint256 nonce)"]);
const BASE: VoucherFields = { player: PLAYER, relicId: 3n, rarity: 2, nonce: 7n, expiry: 2_000_000_000n };

const recover = (v: VoucherFields, signature: Hex, contract: Address = NFT, chainId: number = FUJI_CHAIN_ID) =>
  recoverTypedDataAddress({
    domain: { ...voucherDomain(contract), chainId },
    types: VOUCHER_TYPES, primaryType: "Voucher", message: v, signature,
  });
const sign = (v: VoucherFields = BASE) => voucherSigner(KEY, NFT).sign(v);

describe("voucher signature binding", () => {
  it("recovers the server signer for the exact voucher", async () => {
    expect(await recover(BASE, await sign())).toBe(SIGNER);
  });

  it("is deterministic, so a re-issued identical voucher is not a new credential", async () => {
    expect(await sign()).toBe(await sign());
  });

  it.each([
    ["player", { player: getAddress("0x2222222222222222222222222222222222222222") }],
    ["relicId", { relicId: 4n }],
    ["rarity", { rarity: 3 }],
    ["nonce", { nonce: 8n }],
    ["expiry", { expiry: 2_000_000_001n }],
  ] as const)("tampering with %s no longer recovers the server signer", async (_, change) => {
    const signature = await sign();
    expect(await recover({ ...BASE, ...change }, signature)).not.toBe(SIGNER);
  });

  it("a signature for one RelicNFT or chain does not recover the signer on another", async () => {
    const signature = await sign();
    expect(await recover(BASE, signature, OTHER_NFT)).not.toBe(SIGNER);
    expect(await recover(BASE, signature, NFT, 1)).not.toBe(SIGNER);
  });

  it("a different key signs a voucher that does not recover the server signer", async () => {
    const forged = await voucherSigner(generatePrivateKey(), NFT).sign(BASE);
    expect(await recover(BASE, forged)).not.toBe(SIGNER);
  });

  it("refuses a malformed signing key without echoing it", () => {
    const bad = "0x1234";
    expect(() => voucherSigner(bad, NFT)).toThrow(/32-byte/);
    try { voucherSigner(bad, NFT); } catch (e) { expect(String(e)).not.toContain(bad); }
  });
});

describe("mint receipt matching (replay of someone else's mint)", () => {
  const abi = RELIC_FORGED;
  const receipt = (v: VoucherFields, o: { status?: "success" | "reverted"; address?: Address } = {}): MintReceipt => {
    const topics = encodeEventTopics({ abi, eventName: "RelicForged", args: { player: v.player, relicId: v.relicId } });
    const data = encodeAbiParameters([{ type: "uint8" }, { type: "uint256" }], [v.rarity, v.nonce]);
    return { status: o.status ?? "success", logs: [{ address: o.address ?? NFT, topics: topics as readonly Hex[], data }] };
  };

  it("accepts only the matching successful mint", () => {
    expect(receiptMintsVoucher(receipt(BASE), NFT, BASE)).toBe(true);
  });

  it.each([
    ["null receipt", null],
    ["reverted tx", receipt(BASE, { status: "reverted" })],
    ["log from another contract", receipt(BASE, { address: OTHER_NFT })],
    ["other player", receipt({ ...BASE, player: getAddress("0x2222222222222222222222222222222222222222") })],
    ["other relicId", receipt({ ...BASE, relicId: 4n })],
    ["other rarity", receipt({ ...BASE, rarity: 3 })],
    ["other nonce (a different voucher's mint)", receipt({ ...BASE, nonce: 8n })],
    ["no logs", { status: "success", logs: [] } as MintReceipt],
  ] as const)("rejects %s", (_, r) => {
    expect(receiptMintsVoucher(r, NFT, BASE)).toBe(false);
  });
});
