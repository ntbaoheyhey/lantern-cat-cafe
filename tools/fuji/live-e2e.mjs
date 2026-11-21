#!/usr/bin/env node
// Live Avalanche Fuji end-to-end run of the judge path, against the deployed
// Supabase backend and the deployed, verified Fuji contracts.
//
//   seller guest: SIWE sign-in -> chain-judge voucher -> guest-drip gas
//                 -> RelicNFT.mint -> setApprovalForAll -> RelicMarketV2.list (AVAX)
//   buyer guest:  SIWE sign-in -> 0.005 AVAX from seller -> RelicMarketV2.buy
//   seller guest: RelicMarketV2.withdraw -> final ownership read
//
// Every step waits for a successful receipt and records the public hash, payer,
// fee and Snowtrace link. Guest keys are generated in memory and never written.
// Spends one 0.05 test AVAX café grant (testnet, no value). The sponsor must hold
// at least 1.05 AVAX plus gas: guest-drip refuses grants below a 1 AVAX reserve.
//
// Usage: LIVE_FUJI=YES node tools/fuji/live-e2e.mjs [--domain host] [--action finale|boss] [--out file.json]
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

// The repository root has no viem; reuse the web app's pinned copy.
const webRequire = createRequire(new URL('../../apps/web/package.json', import.meta.url));
const load = id => import(pathToFileURL(webRequire.resolve(id)).href);
const { createPublicClient, createWalletClient, formatEther, http, parseAbi, parseEther, getAddress } = await load('viem');
const { generatePrivateKey, privateKeyToAccount } = await load('viem/accounts');
const { avalancheFuji } = await load('viem/chains');
const { createSiweMessage } = await load('viem/siwe');

const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; };
const FUNCTIONS = (process.env.SUPABASE_FUNCTIONS_URL || 'https://qoalewtxflagoprrxrgh.supabase.co/functions/v1').replace(/\/+$/, '');
const RPC = process.env.FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
const DOMAIN = arg('domain', 'lantern-cat-cafe.vercel.app');
const ACTION = arg('action', 'finale');
const OUT = arg('out');
const C = {
  RelicNFT: getAddress('0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D'),
  RelicMarketV2: getAddress('0x6Fe415494D791E63d87613B8FBCdbb24743C7eb4'),
};
const nftAbi = parseAbi([
  'struct Voucher { address player; uint256 relicId; uint8 rarity; uint256 nonce; uint256 expiry; }',
  'function mint(Voucher v, bytes signature)',
  'function setApprovalForAll(address operator, bool approved)',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
]);
const marketAbi = parseAbi([
  'function list(uint256 relicId, uint256 amount, uint256 price, uint8 currency) returns (uint256 id)',
  'function buy(uint256 id) payable',
  'function withdraw(uint8 currency, address recipient)',
  'function proceeds(address seller, uint8 currency) view returns (uint256)',
  'function quote(uint256 price) view returns (uint256 fee, uint256 burned, uint256 toTreasury, uint256 toSeller)',
  'event Listed(uint256 indexed id, address indexed seller, uint256 indexed relicId, uint256 amount, uint256 price, uint8 currency)',
]);
const explorer = hash => `https://testnet.snowtrace.io/tx/${hash}`;
const client = createPublicClient({ chain: avalancheFuji, transport: http(RPC, { timeout: 20_000, retryCount: 2 }) });
const steps = [];

async function post(name, body, token) {
  const res = await fetch(`${FUNCTIONS}/${name}`, { method: 'POST', signal: AbortSignal.timeout(30_000),
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${name} ${res.status} ${json.error ?? ''}`.trim());
  return json;
}
async function guest(label) {
  const account = privateKeyToAccount(generatePrivateKey());
  const { nonce } = await post('auth-nonce');
  const issuedAt = new Date();
  const message = createSiweMessage({ domain: DOMAIN, address: account.address, statement: 'Sign in to Lantern Cat Cafe.',
    uri: `https://${DOMAIN}`, chainId: 43113, version: '1', nonce, issuedAt, expirationTime: new Date(issuedAt.getTime() + 600_000) });
  const session = await post('auth-verify', { message, signature: await account.signMessage({ message }) });
  if (getAddress(session.wallet) !== account.address) throw new Error('session wallet mismatch');
  console.log(`${label}: signed in ${account.address}`);
  return { label, account, token: session.token, wallet: createWalletClient({ account, chain: avalancheFuji, transport: http(RPC) }) };
}
async function record(action, actor, hash, startedAt) {
  const receipt = await client.waitForTransactionReceipt({ hash, timeout: 90_000 });
  if (receipt.status !== 'success') throw new Error(`${action} reverted: ${explorer(hash)}`);
  const row = { action, actor, hash, block: Number(receipt.blockNumber), payer: receipt.from,
    feeAvax: formatEther(receipt.gasUsed * receipt.effectiveGasPrice), confirmationMs: Math.round(performance.now() - startedAt), snowtrace: explorer(hash) };
  steps.push(row);
  console.log(`  ✓ ${action.padEnd(22)} ${row.confirmationMs} ms  ${row.snowtrace}`);
  return receipt;
}
async function write(g, action, request) {
  const { request: simulated } = await client.simulateContract({ ...request, account: g.account });
  const started = performance.now();
  const hash = await g.wallet.writeContract(simulated);
  return record(action, g.label, hash, started);
}
async function drip(g) {
  const started = performance.now();
  const gas = await post('guest-drip', {}, g.token);
  if (!gas.txHash || !['pending', 'confirmed'].includes(gas.status)) throw new Error(`guest-drip ${gas.status}`);
  const tx = await client.getTransaction({ hash: gas.txHash });
  if (getAddress(tx.to) !== g.account.address || tx.value !== parseEther('0.05')) throw new Error('drip mismatch');
  return record('Café gas (guest-drip)', 'sponsor', gas.txHash, started);
}

async function main() {
  if (process.env.LIVE_FUJI !== 'YES') throw new Error('Set LIVE_FUJI=YES to send real Fuji testnet transactions.');
  if (await client.getChainId() !== 43113) throw new Error('RPC is not Avalanche Fuji (43113).');
  const startedAt = new Date().toISOString();

  const seller = await guest('seller');
  const judge = await post('chain-judge', { action: ACTION }, seller.token);
  const relicId = ACTION === 'finale' || ACTION === 'intro' ? (ACTION === 'finale' ? '3' : '1') : undefined;
  const voucher = judge.vouchers.find(v => !v.used && (!relicId || v.relicId === relicId));
  if (!judge.battle.won || !voucher) throw new Error('No unused voucher for this guest.');
  console.log(`  server battle won in ${judge.battle.rounds ?? '?'} rounds; voucher Relic #${voucher.relicId} rarity ${voucher.rarity}`);
  await drip(seller);
  await write(seller, 'RelicNFT.mint', { address: C.RelicNFT, abi: nftAbi, functionName: 'mint', args: [{
    player: seller.account.address, relicId: BigInt(voucher.relicId), rarity: voucher.rarity, nonce: BigInt(voucher.nonce), expiry: BigInt(voucher.expiry) }, voucher.signature] });
  await write(seller, 'RelicNFT.setApprovalForAll', { address: C.RelicNFT, abi: nftAbi, functionName: 'setApprovalForAll', args: [C.RelicMarketV2, true] });
  const price = parseEther('0.001');
  const listed = await write(seller, 'RelicMarketV2.list', { address: C.RelicMarketV2, abi: marketAbi, functionName: 'list', args: [BigInt(voucher.relicId), 1n, price, 0] });
  const listingLog = listed.logs.find(l => l.address.toLowerCase() === C.RelicMarketV2.toLowerCase() && l.topics.length === 4);
  const listingId = BigInt(listingLog.topics[1]);

  // The drip allows few grants per IP per day, so the buyer is funded by the
  // seller (a plain, recorded AVAX transfer) instead of a second café grant.
  const buyer = await guest('buyer');
  const started = performance.now();
  const hash = await seller.wallet.sendTransaction({ to: buyer.account.address, value: parseEther('0.005') });
  await record('Seller funds buyer gas', 'seller', hash, started);
  await write(buyer, 'RelicMarketV2.buy', { address: C.RelicMarketV2, abi: marketAbi, functionName: 'buy', args: [listingId], value: price });
  const owed = await client.readContract({ address: C.RelicMarketV2, abi: marketAbi, functionName: 'proceeds', args: [seller.account.address, 0] });
  await write(seller, 'RelicMarketV2.withdraw', { address: C.RelicMarketV2, abi: marketAbi, functionName: 'withdraw', args: [0, seller.account.address] });
  const [fee, burned, toTreasury, toSeller] = await client.readContract({ address: C.RelicMarketV2, abi: marketAbi, functionName: 'quote', args: [price] });
  const [sellerHolds, buyerHolds] = await Promise.all([seller, buyer].map(g =>
    client.readContract({ address: C.RelicNFT, abi: nftAbi, functionName: 'balanceOf', args: [g.account.address, BigInt(voucher.relicId)] })));
  if (buyerHolds < 1n) throw new Error('Buyer does not hold the relic after purchase.');

  const proof = { kind: 'lantern-cat-cafe live Fuji E2E', chainId: 43113, startedAt, finishedAt: new Date().toISOString(),
    backend: FUNCTIONS.replace(/^https:\/\/([^.]+)\..*/, 'supabase:$1'), siweDomain: DOMAIN, judgeAction: ACTION,
    relic: { id: voucher.relicId, rarity: voucher.rarity, contract: C.RelicNFT },
    market: { contract: C.RelicMarketV2, listingId: listingId.toString(), priceAvax: formatEther(price), feeAvax: formatEther(fee),
      burnedAvax: formatEther(burned), treasuryAvax: formatEther(toTreasury), sellerAvax: formatEther(toSeller), withdrawnAvax: formatEther(owed) },
    wallets: { seller: seller.account.address, buyer: buyer.account.address },
    finalOwnership: { seller: sellerHolds.toString(), buyer: buyerHolds.toString() }, steps };
  const json = JSON.stringify(proof, null, 2) + '\n';
  if (OUT) writeFileSync(OUT, json); else process.stdout.write(json);
  console.log(`\nDone: ${steps.length} confirmed Fuji transactions. Buyer owns Relic #${voucher.relicId}.`);
}
main().catch(e => {
  console.error(`\nFAILED: ${e.message}`);
  if (/sponsor_low/.test(e.message)) console.error('The café sponsor is below its 1 AVAX reserve. Owner: send test AVAX to 0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000.');
  if (/ip_limit|daily_limit/.test(e.message)) console.error('Drip rate limit reached for this network address. Retry later or from another network.');
  if (steps.length) console.error(`Confirmed before failure:\n${steps.map(r => `  ${r.action}: ${r.snowtrace}`).join('\n')}`);
  process.exit(1);
});
