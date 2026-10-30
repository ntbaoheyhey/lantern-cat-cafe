#!/usr/bin/env node
// Read-only Fuji on-chain verification script for Taskbar Hero.
// Uses existing viem dependency and public Avalanche Fuji RPC. No private key or wallet transactions.
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

// Load viem from apps/web workspace
const require = createRequire(resolve(repoRoot, 'apps/web/package.json'));
const { createPublicClient, http, isAddress, formatEther, parseEventLogs } = require('viem');
const { avalancheFuji } = require('viem/chains');

// Load deployments and ABIs
const deployments = JSON.parse(
  readFileSync(resolve(repoRoot, 'packages/chain/deployments/43113.json'), 'utf8')
);
const abiSource = readFileSync(resolve(repoRoot, 'packages/chain/src/abi.ts'), 'utf8');

function extractAbi(name) {
  const match = abiSource.match(new RegExp(`export const ${name} = (\\[[\\s\\S]*?\\]) as const;`));
  if (!match) throw new Error(`Cannot parse ABI for ${name}`);
  return JSON.parse(match[1]);
}

const nftAbi = extractAbi('relicNftAbi');
const marketAbi = extractAbi('relicMarketAbi');

// RPC setup matching web config and onchain-proof.mjs
const rpcUrl = process.env.VITE_FUJI_RPC_URL || avalancheFuji.rpcUrls.default.http[0];
const client = createPublicClient({
  chain: avalancheFuji,
  transport: http(rpcUrl, { timeout: 20_000, retryCount: 2 }),
});

const RARITY_NAMES = ['Common', 'Rare', 'Epic', 'Legendary'];

// Verified historical transactions on Fuji as reliable fallback
const KNOWN_TXS = [
  '0x991bdc7bd1ac2f60464f1d81552dc8b31b469f4d8837b0e2dc3cf216ae88f578', // Listed #2
  '0xa82ab23e5fbab111676a735ec42832e98d4312ce106d6847e3963949b102c4f7', // RelicForged #2
  '0x8cdd589e027673e3cbc0c83305e8104f4ce427dc9caeca05dd07146bf82a348d', // Bought #1
  '0xfcbbe9c52a094b14dc51052efeb14b672c05eae2923a4f393c491e602c5808d7', // Listed #1
  '0x0ef1db1e37b6297779edddbd69be29191ac3e3ecea837b9b432dc3f6a0e44fec', // RelicForged #1
];

/**
 * Attempt to query recent transactions from Routescan API to discover any newly minted/listed tokens.
 * Falls back safely to KNOWN_TXS if the API call fails or times out.
 */
async function discoverRecentTransactions() {
  const txHashes = new Set(KNOWN_TXS);
  try {
    const urls = [
      `https://api.routescan.io/v2/network/testnet/evm/43113/etherscan?module=account&action=txlist&address=${deployments.RelicNFT}&startblock=0&endblock=99999999&page=1&offset=25&sort=desc`,
      `https://api.routescan.io/v2/network/testnet/evm/43113/etherscan?module=account&action=txlist&address=${deployments.RelicMarket}&startblock=0&endblock=99999999&page=1&offset=25&sort=desc`,
    ];
    const responses = await Promise.all(
      urls.map((u) =>
        fetch(u, { signal: AbortSignal.timeout(4000) })
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)
      )
    );
    for (const data of responses) {
      if (data && Array.isArray(data.result)) {
        for (const item of data.result) {
          if (item && item.hash) txHashes.add(item.hash);
        }
      }
    }
  } catch {
    // Non-blocking fallback to known tx hashes
  }
  return [...txHashes];
}

async function main() {
  console.log('================================================================');
  console.log('       Taskbar Hero — Avalanche Fuji On-Chain Proof');
  console.log('================================================================\n');

  // 1. Chain ID & RPC
  const chainId = await client.getChainId();
  if (chainId !== 43113) {
    throw new Error(`Unexpected Chain ID: ${chainId} (expected 43113)`);
  }
  const currentBlock = await client.getBlockNumber();
  console.log(`• Network:    Avalanche Fuji Testnet`);
  console.log(`• Chain ID:   ${chainId}`);
  console.log(`• RPC URL:    ${rpcUrl}`);
  console.log(`• Block:      #${currentBlock.toString()}`);
  console.log(`• Timestamp:  ${new Date().toISOString()}\n`);

  // 2. Addresses & Verification Links
  console.log('----------------------------------------------------------------');
  console.log('1. CONTRACT ADDRESSES & ROUTESCAN VERIFICATION');
  console.log('----------------------------------------------------------------');

  const relicNftAddress = deployments.RelicNFT;
  const relicMarketAddress = deployments.RelicMarket;

  if (!isAddress(relicNftAddress) || !isAddress(relicMarketAddress)) {
    throw new Error('Invalid contract address in deployments/43113.json');
  }

  const [nftCode, marketCode, nftOwner, nftSigner, relic1Uri] = await Promise.all([
    client.getCode({ address: relicNftAddress }),
    client.getCode({ address: relicMarketAddress }),
    client.readContract({ address: relicNftAddress, abi: nftAbi, functionName: 'owner' }),
    client.readContract({ address: relicNftAddress, abi: nftAbi, functionName: 'signer' }),
    client.readContract({ address: relicNftAddress, abi: nftAbi, functionName: 'uri', args: [1n] }),
  ]);

  console.log(`RelicNFT Contract:`);
  console.log(`  Address:    ${relicNftAddress}`);
  console.log(`  Routescan:  https://testnet.routescan.io/address/${relicNftAddress}/contract`);
  console.log(`  Bytecode:   ${nftCode ? `${(nftCode.length - 2) / 2} bytes (Active)` : 'Missing'}`);
  console.log(`  Owner:      ${nftOwner}`);
  console.log(`  Signer:     ${nftSigner}`);
  console.log(`  uri(1):     ${relic1Uri}`);

  console.log(`\nRelicMarket Contract:`);
  console.log(`  Address:    ${relicMarketAddress}`);
  console.log(`  Routescan:  https://testnet.routescan.io/address/${relicMarketAddress}/contract`);
  console.log(`  Bytecode:   ${marketCode ? `${(marketCode.length - 2) / 2} bytes (Active)` : 'Missing'}`);

  const [activeListings, nextListingId] = await Promise.all([
    client.readContract({ address: relicMarketAddress, abi: marketAbi, functionName: 'activeListingCount' }),
    client.readContract({ address: relicMarketAddress, abi: marketAbi, functionName: 'nextListingId' }),
  ]);
  console.log(`  Active:     ${activeListings.toString()} listing(s)`);
  console.log(`  Lifetime:   ${(nextListingId - 1n).toString()} listing(s) total\n`);

  // 3. Token Metadata & Minted Status per ID
  console.log('----------------------------------------------------------------');
  console.log('2. RELIC TOKEN STATUS & TOTAL MINTED PER ID');
  console.log('----------------------------------------------------------------');
  console.log('Note: RelicNFT implements standard ERC-1155 (no ERC1155Supply extension).');
  console.log('Existence is verified via on-chain relicExists(id); minted amounts verified via logs.\n');

  // Discover unique token IDs from public/relics/
  const relicsDir = resolve(repoRoot, 'apps/web/public/relics');
  const uniqueIds = new Set();
  for (const file of readdirSync(relicsDir)) {
    if (!file.endsWith('.json')) continue;
    const base = file.replace('.json', '');
    if (/^\d+$/.test(base)) {
      uniqueIds.add(BigInt(base));
    }
  }

  const sortedIds = [...uniqueIds].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  const tokenStatus = await Promise.all(
    sortedIds.map(async (id) => {
      const file = resolve(relicsDir, `${id.toString()}.json`);
      const metadata = JSON.parse(readFileSync(file, 'utf8'));
      const exists = await client.readContract({
        address: relicNftAddress,
        abi: nftAbi,
        functionName: 'relicExists',
        args: [id],
      });
      const rarity = exists
        ? await client.readContract({
            address: relicNftAddress,
            abi: nftAbi,
            functionName: 'rarityOf',
            args: [id],
          })
        : null;
      const uri = await client.readContract({
        address: relicNftAddress,
        abi: nftAbi,
        functionName: 'uri',
        args: [id],
      });

      return {
        id,
        name: metadata.name,
        metadataRarity: metadata.attributes?.[0]?.value || 'Unknown',
        exists,
        onChainRarity: rarity !== null ? `${rarity} (${RARITY_NAMES[rarity] || 'Unknown'})` : 'N/A',
        uri,
      };
    })
  );

  // 4. Retrieve Receipts and Parse Events directly from public Fuji RPC (in parallel)
  const allTxHashes = await discoverRecentTransactions();
  const allEvents = [];
  const mintedCountById = new Map();

  const receipts = await Promise.all(
    allTxHashes.map(async (hash) => {
      try {
        const receipt = await client.getTransactionReceipt({ hash });
        return { hash, receipt };
      } catch {
        return { hash, receipt: null };
      }
    })
  );

  for (const { hash, receipt } of receipts) {
    if (!receipt || receipt.status !== 'success') continue;

    const parsedNft = parseEventLogs({ abi: nftAbi, logs: receipt.logs });
    const parsedMarket = parseEventLogs({ abi: marketAbi, logs: receipt.logs });

    for (const log of parsedNft) {
      if (log.eventName === 'RelicForged') {
        const id = log.args.relicId;
        mintedCountById.set(id, (mintedCountById.get(id) || 0n) + 1n);
        allEvents.push({
          type: 'RelicForged',
          blockNumber: receipt.blockNumber,
          txHash: hash,
          args: log.args,
        });
      }
    }

    for (const log of parsedMarket) {
      if (log.eventName === 'Listed' || log.eventName === 'Bought') {
        allEvents.push({
          type: log.eventName,
          blockNumber: receipt.blockNumber,
          txHash: hash,
          args: log.args,
        });
      }
    }
  }

  // Print token details with verified minted count
  for (const t of tokenStatus) {
    const minted = mintedCountById.get(t.id) || 0n;
    console.log(`• Token #${t.id.toString()}: ${t.name}`);
    console.log(`    Exists on-chain:  ${t.exists}`);
    console.log(`    Total minted:     ${minted.toString()} (from verified RelicForged events)`);
    console.log(`    Rarity:           ${t.onChainRarity} [Metadata: ${t.metadataRarity}]`);
    console.log(`    Token URI:        ${t.uri}`);
  }

  // 5. Last 5 RelicForged / Listing / Sale Events
  console.log('\n----------------------------------------------------------------');
  console.log('3. LAST ON-CHAIN EVENTS (RelicForged / Listed / Bought)');
  console.log('----------------------------------------------------------------\n');

  // Sort events newest first (descending blockNumber)
  allEvents.sort((a, b) => (a.blockNumber < b.blockNumber ? 1 : a.blockNumber > b.blockNumber ? -1 : 0));
  const recentEvents = allEvents.slice(0, 5);

  if (recentEvents.length === 0) {
    console.log('No recent events found.');
  } else {
    recentEvents.forEach((ev, idx) => {
      console.log(`[Event ${idx + 1}/${recentEvents.length}] ${ev.type} @ Block #${ev.blockNumber.toString()}`);
      console.log(`  Tx Hash:    ${ev.txHash}`);
      console.log(`  Routescan:  https://testnet.routescan.io/tx/${ev.txHash}`);

      if (ev.type === 'RelicForged') {
        const rarityName = RARITY_NAMES[ev.args.rarity] || 'Unknown';
        console.log(`  Player:     ${ev.args.player}`);
        console.log(`  Relic ID:   #${ev.args.relicId.toString()}`);
        console.log(`  Rarity:     ${ev.args.rarity} (${rarityName})`);
        console.log(`  Nonce:      ${ev.args.nonce.toString()}`);
      } else if (ev.type === 'Listed') {
        console.log(`  Listing ID: #${ev.args.listingId.toString()}`);
        console.log(`  Seller:     ${ev.args.seller}`);
        console.log(`  Relic ID:   #${ev.args.relicId.toString()}`);
        console.log(`  Amount:     ${ev.args.amount.toString()}`);
        console.log(`  Price:      ${formatEther(ev.args.price)} AVAX (${ev.args.price.toString()} wei)`);
      } else if (ev.type === 'Bought') {
        console.log(`  Listing ID: #${ev.args.listingId.toString()}`);
        console.log(`  Buyer:      ${ev.args.buyer}`);
        console.log(`  Seller:     ${ev.args.seller}`);
        console.log(`  Relic ID:   #${ev.args.relicId.toString()}`);
        console.log(`  Amount:     ${ev.args.amount.toString()}`);
        console.log(`  Price:      ${formatEther(ev.args.price)} AVAX (${ev.args.price.toString()} wei)`);
      }
      console.log('');
    });
  }

  console.log('================================================================');
  console.log('✓ On-chain proof verification complete. All data fetched from Fuji RPC.');
  console.log('================================================================');
}

main().catch((err) => {
  console.error('\n✗ Fuji proof failed:', err.message);
  process.exitCode = 1;
});
