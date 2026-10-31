// Relic voucher signing (EIP-712, docs/contracts.md) and mint receipt checks for relic-forge and
// relic-mint-report. Runtime-neutral like game.ts: Deno gets viem from deno.json, the Node tests
// through the vitest alias.
import { FUJI_CHAIN_ID, VOUCHER_TTL_SECONDS, relicForgedAbi, usedNoncesAbi } from "@taskbar-hero/chain";
import {
  createPublicClient,
  decodeEventLog,
  getAddress,
  http,
  isAddressEqual,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

export { FUJI_CHAIN_ID, VOUCHER_TTL_SECONDS };
/**
 * An issued voucher is re-signed only this long after its expiry, so a mint that lands in a block
 * stamped just before the expiry is seen (via usedNonces) before a second voucher exists.
 */
export const REISSUE_GRACE_SECONDS = 120;

export const VOUCHER_TYPES = {
  Voucher: [
    { name: "player", type: "address" },
    { name: "relicId", type: "uint256" },
    { name: "rarity", type: "uint8" },
    { name: "nonce", type: "uint256" },
    { name: "expiry", type: "uint256" },
  ],
} as const;

export function voucherDomain(verifyingContract: Address) {
  return { name: "TaskbarHeroRelic", version: "1", chainId: FUJI_CHAIN_ID, verifyingContract } as const;
}

export interface VoucherFields {
  player: Address;
  relicId: bigint;
  rarity: number;
  nonce: bigint;
  expiry: bigint;
}

export interface VoucherSigner {
  /** RelicNFT address the signatures are bound to. */
  readonly verifyingContract: Address;
  sign(v: VoucherFields): Promise<Hex>;
}

/**
 * Signer from VOUCHER_SIGNER_PRIVATE_KEY. Throws a message without the key if it is malformed; the
 * key never leaves this closure.
 */
export function voucherSigner(privateKey: string, verifyingContract: Address): VoucherSigner {
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) throw new Error("VOUCHER_SIGNER_PRIVATE_KEY is not a 32-byte hex key");
  const account = privateKeyToAccount(privateKey as Hex);
  return {
    verifyingContract,
    sign: (message) =>
      account.signTypedData({ domain: voucherDomain(verifyingContract), types: VOUCHER_TYPES, primaryType: "Voucher", message }),
  };
}

/** EIP-55 checksummed form of a stored (lowercase) wallet. */
export function checksumAddress(address: string): Address {
  return getAddress(address);
}

export interface ReceiptLog {
  address: Address;
  topics: readonly Hex[];
  data: Hex;
}
export interface MintReceipt {
  status: "success" | "reverted";
  logs: readonly ReceiptLog[];
}

/** Fuji reads; injected so tests never touch the network. */
export interface ChainReader {
  /** The receipt, or null if the tx is unknown or not mined yet. */
  receipt(txHash: Hex): Promise<MintReceipt | null>;
  /** RelicNFT.usedNonces(nonce): true once the voucher was minted (or cancelled). */
  nonceUsed(nonce: bigint): Promise<boolean>;
  /**
   * The transaction hash (or true for legacy readers) when a RelicForged log exists, i.e. the used nonce was a
   * real mint and not RelicNFT.cancelNonce. `sinceS` is the voucher's creation time (unix seconds);
   * implementations must throw, never answer false, if they could not search back that far.
   * Optional: without it a used nonce is treated as minted (the old behaviour).
   */
  nonceMinted?(player: Address, relicId: bigint, nonce: bigint, sinceS: number): Promise<boolean | Hex>;
}

/** Fuji getLogs window and the most windows one lookup scans (about 2.3 days at 2 s blocks, newest first). */
const LOG_WINDOW = 10_000n;
const LOG_MAX_WINDOWS = 30;
/** Voucher creation is inferred from its expiry; look back this much further than that. */
export const LOG_LOOKBACK_SLACK_SECONDS = 3600;

export function fujiReader(rpcUrl: string, relicNft: Address): ChainReader {
  const client = createPublicClient({ transport: http(rpcUrl, { timeout: 10_000, retryCount: 1 }) });
  return {
    async receipt(hash) {
      try {
        const r = await client.getTransactionReceipt({ hash });
        return { status: r.status, logs: r.logs };
      } catch (e) {
        if (e instanceof Error && e.name === "TransactionReceiptNotFoundError") return null;
        throw e;
      }
    },
    nonceUsed: (nonce) => client.readContract({ address: relicNft, abi: usedNoncesAbi, functionName: "usedNonces", args: [nonce] }),
    async nonceMinted(player, relicId, nonce, sinceS) {
      const latest = await client.getBlockNumber();
      for (let i = 0n; i < BigInt(LOG_MAX_WINDOWS); i++) {
        const to = latest - i * LOG_WINDOW;
        const from = to >= LOG_WINDOW ? to - LOG_WINDOW + 1n : 0n;
        const logs = await client.getLogs({ address: relicNft, event: relicForgedAbi[0], args: { player, relicId }, fromBlock: from, toBlock: to });
        const mint = logs.find((l) => l.args.nonce === nonce);
        if (mint) return mint.transactionHash ?? true;
        if (from === 0n) return false;
        const start = await client.getBlock({ blockNumber: from });
        if (Number(start.timestamp) <= sinceS - LOG_LOOKBACK_SLACK_SECONDS) return false;
      }
      throw new Error("RelicForged log search did not reach the voucher's creation time");
    },
  };
}

/**
 * True only for a successful tx with a RelicForged log emitted by `relicNft` whose player,
 * relicId, rarity and nonce all equal the voucher's.
 */
export function receiptMintsVoucher(receipt: MintReceipt | null, relicNft: Address, v: VoucherFields): boolean {
  if (!receipt || receipt.status !== "success") return false;
  return receipt.logs.some((log) => {
    if (!isAddressEqual(log.address, relicNft)) return false;
    try {
      const { args } = decodeEventLog({ abi: relicForgedAbi, eventName: "RelicForged", topics: log.topics as [Hex, ...Hex[]], data: log.data });
      return (
        isAddressEqual(args.player, v.player) &&
        args.relicId === v.relicId &&
        args.rarity === v.rarity &&
        args.nonce === v.nonce
      );
    } catch {
      return false;
    }
  });
}
