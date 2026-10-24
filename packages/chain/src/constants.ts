// Chain facts shared by the web client, the Edge Functions and the tests. Runtime-neutral and free
// of JSON imports, so Deno can load it (index.ts reads the deployment files, which Deno cannot
// import without import attributes).
import { relicNftAbi } from './abi';

export const FUJI_CHAIN_ID = 43113;
export const ANVIL_CHAIN_ID = 31337;

/** Voucher lifetime (docs/contracts.md rule 2: short, never over 24 h). */
export const VOUCHER_TTL_SECONDS = 30 * 60;

type RelicNftItem = (typeof relicNftAbi)[number];

function fragment<T extends RelicNftItem>(type: T['type'], name: string): T {
  const item = relicNftAbi.find((i) => i.type === type && 'name' in i && i.name === name);
  if (!item) throw new Error(`relicNftAbi has no ${type} ${name}`);
  return item as T;
}

/** The RelicForged event, taken from the generated RelicNFT ABI. */
export const relicForgedAbi = [fragment<Extract<RelicNftItem, { type: 'event'; name: 'RelicForged' }>>('event', 'RelicForged')] as const;

/** RelicNFT.usedNonces(nonce), taken from the generated RelicNFT ABI. */
export const usedNoncesAbi = [fragment<Extract<RelicNftItem, { type: 'function'; name: 'usedNonces' }>>('function', 'usedNonces')] as const;
