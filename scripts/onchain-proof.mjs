#!/usr/bin/env node
// Read-only: uses the existing web workspace's viem, deployments and generated ABIs.
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { createPublicClient, http, isAddress } = require('viem');
const { avalancheFuji } = require('viem/chains');
const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const deployments = JSON.parse(read('../packages/chain/deployments/43113.json'));
const abiSource = read('../packages/chain/src/abi.ts');

// The generated file contains JSON arrays followed by `as const`; do not execute source text.
function abi(name) {
  const match = abiSource.match(new RegExp(`export const ${name} = (\\[[\\s\\S]*?\\]) as const;`));
  if (!match) throw new Error(`Cannot read generated ABI: ${name}`);
  return JSON.parse(match[1]);
}

const nftAbi = abi('relicNftAbi');
const marketAbi = abi('relicMarketAbi');
// Matches makeFujiChain's public fallback and optional VITE_FUJI_RPC_URL override.
const rpc = process.env.VITE_FUJI_RPC_URL || avalancheFuji.rpcUrls.default.http[0];
const client = createPublicClient({
  chain: avalancheFuji,
  transport: http(rpc, { timeout: 15_000, retryCount: 0 }),
});
const json = (value) => JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v);
const unavailable = (why) => `NOT VERIFIED: ${why}`;
const shortError = (error) => error.shortMessage || error.message;
let requiredReadFailed = false;

async function main() {
  const chainId = await client.getChainId();
  if (chainId !== avalancheFuji.id) throw new Error(`Wrong RPC chain: ${chainId}; expected ${avalancheFuji.id}`);
  const blockNumber = await client.getBlockNumber();
  const block = await client.getBlock({ blockNumber });
  console.log(json({ chainId, blockNumber, blockHash: block.hash, checkedAt: new Date().toISOString() }));
  const present = {};
  for (const name of ['RelicNFT', 'RelicMarket']) {
    const address = deployments[name];
    if (!isAddress(address)) throw new Error(`Invalid ${name} deployment address`);
    const code = await client.getCode({ address, blockNumber });
    present[name] = !!code && code !== '0x';
    console.log(json({ contract: name, address, codePresent: present[name], codeBytes: code ? (code.length - 2) / 2 : 0 }));
    if (!present[name]) process.exitCode = 1;
  }

  async function readContract(address, contractAbi, functionName, args = []) {
    try {
      return await client.readContract({ address, abi: contractAbi, functionName, args, blockNumber });
    } catch (error) {
      requiredReadFailed = true;
      return unavailable(`${functionName}: ${shortError(error)}`);
    }
  }

  // Discover the current game's token IDs from committed metadata, including 64-hex ERC-1155 names.
  // This is a catalogue, not an assertion that every possible on-chain ID was enumerated.
  const ids = new Set();
  for (const file of readdirSync(new URL('../apps/web/public/relics/', import.meta.url))) {
    const name = file.replace(/\.json$/, '');
    if (!file.endsWith('.json')) continue;
    if (/^[0-9a-fA-F]{64}$/.test(name)) ids.add(BigInt(`0x${name}`).toString());
    else if (/^\d+$/.test(name)) ids.add(BigInt(name).toString());
  }

  if (present.RelicNFT) {
    console.log(json({ contract: 'RelicNFT', owner: await readContract(deployments.RelicNFT, nftAbi, 'owner'),
      signer: await readContract(deployments.RelicNFT, nftAbi, 'signer'), tokenIdDiscovery: 'committed relic metadata; not exhaustive chain history' }));
    const hasSupply = nftAbi.some((f) => f.type === 'function' && f.name === 'totalSupply' && f.inputs.length === 1);
    for (const id of [...ids].map(BigInt).sort((a, b) => a < b ? -1 : a > b ? 1 : 0)) {
      console.log(json({ contract: 'RelicNFT', tokenId: id,
        exists: await readContract(deployments.RelicNFT, nftAbi, 'relicExists', [id]),
        uri: await readContract(deployments.RelicNFT, nftAbi, 'uri', [id]),
        totalSupply: hasSupply ? await readContract(deployments.RelicNFT, nftAbi, 'totalSupply', [id])
          : unavailable('no totalSupply(uint256) getter in this contract; full mint/transfer history not reconstructed'),
      }));
    }
  }
  if (present.RelicMarket) {
    const active = await readContract(deployments.RelicMarket, marketAbi, 'activeListingCount');
    const next = await readContract(deployments.RelicMarket, marketAbi, 'nextListingId');
    const linkedNft = await readContract(deployments.RelicMarket, marketAbi, 'relicNFT');
    console.log(json({ contract: 'RelicMarket', activeListingCount: active, nextListingId: next,
      lifetimeListingCount: typeof next === 'bigint' ? next - 1n : unavailable('nextListingId unreadable'), relicNFT: linkedNft }));
    if (typeof linkedNft === 'string' && isAddress(linkedNft) && linkedNft.toLowerCase() !== deployments.RelicNFT.toLowerCase()) {
      throw new Error('RelicMarket.relicNFT does not match the committed RelicNFT deployment');
    }
    const fees = marketAbi.filter((f) => f.type === 'function' && f.stateMutability === 'view' && f.inputs.length === 0 && /fee/i.test(f.name));
    if (!fees.length) console.log(json({ contract: 'RelicMarket', feeSettings: 'No fee getters in committed ABI; repository source charges no platform fee (network gas still applies)' }));
    for (const field of fees) console.log(json({ contract: 'RelicMarket', [field.name]: await readContract(deployments.RelicMarket, marketAbi, field.name) }));
  }
  // A failed supported read is not a successful proof; unsupported supply is explicitly labelled above.
  if (requiredReadFailed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(unavailable(shortError(error)));
  process.exitCode = 1;
});
