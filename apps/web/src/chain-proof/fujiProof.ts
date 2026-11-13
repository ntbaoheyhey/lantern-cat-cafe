import { FUJI_CHAIN_ID, getAddresses, relicMarketAbi, relicNftAbi } from '@taskbar-hero/chain';
import { decodeEventLog, type Address, type Hex, type PublicClient } from 'viem';

export const PROOF_CACHE_MS = 30_000;
export const PROOF_BLOCK_WINDOW = 100n;
export const PROOF_EVENT_LIMIT = 10;
const registry = getAddresses(FUJI_CHAIN_ID);
// This proof describes the original NFT/market pair; registry additions serve
// their own readers and must not silently change this exported proof scope.
export const PROOF_CONTRACTS = {RelicNFT:registry.RelicNFT,RelicMarket:registry.RelicMarket};
export type ProofClient = Pick<PublicClient, 'getChainId' | 'getBlockNumber' | 'getBlock' | 'getCode' | 'readContract' | 'getLogs'>;
export type ReadFact<T> = { status: 'verified'; value: T } | { status: 'unavailable' };
export interface RecentEvent { address: Address; block: bigint; transaction: Hex; event: string }
export interface FujiProof {
  chainId: typeof FUJI_CHAIN_ID;
  block: bigint;
  fromBlock: bigint;
  checkedAt: number;
  blockHash: ReadFact<Hex>;
  nftCodeBytes: ReadFact<number>;
  marketCodeBytes: ReadFact<number>;
  linkedNft: ReadFact<Address>;
  activeListings: ReadFact<bigint>;
  events: ReadFact<RecentEvent[]>;
}
const unavailable = { status: 'unavailable' } as const;
async function fact<T>(read: () => Promise<T>): Promise<ReadFact<T>> {
  try { return { status: 'verified', value: await read() }; } catch { return unavailable; }
}
const codeBytes = (code: Hex | undefined) => code ? Math.max(0, (code.length - 2) / 2) : 0;

/** A bounded snapshot of public Fuji data. There is no wallet client or transaction method. */
export async function readFujiProof(client: ProofClient, now = Date.now()): Promise<FujiProof> {
  const { RelicNFT: nft, RelicMarket: market } = PROOF_CONTRACTS;
  if (!nft || !market) throw new Error('Fuji contract addresses are unavailable.');
  // Validate the RPC itself before accepting any deployment facts.
  if (await client.getChainId() !== FUJI_CHAIN_ID) throw new Error('The RPC did not confirm Avalanche Fuji.');
  const block = await client.getBlockNumber();
  const fromBlock = block >= PROOF_BLOCK_WINDOW - 1n ? block - PROOF_BLOCK_WINDOW + 1n : 0n;
  const [blockHash, nftCodeBytes, marketCodeBytes, linkedNft, activeListings, events] = await Promise.all([
    fact(async () => { const value = await client.getBlock({ blockNumber: block }); if (!value.hash) throw new Error(); return value.hash; }),
    fact(async () => codeBytes(await client.getCode({ address: nft, blockNumber: block }))),
    fact(async () => codeBytes(await client.getCode({ address: market, blockNumber: block }))),
    fact(async () => client.readContract({ address: market, abi: relicMarketAbi, functionName: 'relicNFT', blockNumber: block })),
    fact(async () => client.readContract({ address: market, abi: relicMarketAbi, functionName: 'activeListingCount', blockNumber: block })),
    fact(async () => {
      const logs = await client.getLogs({ address: [nft, market], fromBlock, toBlock: block });
      return logs.filter(log => !log.removed && log.blockNumber !== null && log.transactionHash !== null
        && log.blockNumber >= fromBlock && log.blockNumber <= block
        && [nft.toLowerCase(), market.toLowerCase()].includes(log.address.toLowerCase()))
        .sort((a, b) => a.blockNumber! > b.blockNumber! ? -1 : a.blockNumber! < b.blockNumber! ? 1 : (b.logIndex ?? 0) - (a.logIndex ?? 0))
        .slice(0, PROOF_EVENT_LIMIT).map(log => {
          let event = 'Contract event';
          try { event = decodeEventLog({ abi: log.address.toLowerCase() === nft.toLowerCase() ? relicNftAbi : relicMarketAbi, data: log.data, topics: log.topics, strict: false }).eventName; } catch { /* Unknown events remain labelled without guessing. */ }
          return { address: log.address, block: log.blockNumber!, transaction: log.transactionHash!, event };
        });
    }),
  ]);
  return { chainId: FUJI_CHAIN_ID, block, fromBlock, checkedAt: now, blockHash, nftCodeBytes, marketCodeBytes, linkedNft, activeListings, events };
}

/** Cache failures and in-flight reads too; repeated clicks cannot hammer a failing RPC. */
export function createProofReader(clock: () => number = Date.now) {
  const cache = new WeakMap<ProofClient, { at: number; result: Promise<FujiProof> }>();
  return (client: ProofClient) => {
    const now = clock(), previous = cache.get(client);
    if (previous && now - previous.at < PROOF_CACHE_MS) return previous.result;
    const result = readFujiProof(client, now);
    cache.set(client, { at: now, result });
    return result;
  };
}
export const readCachedFujiProof = createProofReader();
export const contractProofUrl = (address: string) => `https://testnet.snowtrace.io/address/${address}`;
export const transactionProofUrl = (hash: string) => `https://testnet.snowtrace.io/tx/${hash}`;
