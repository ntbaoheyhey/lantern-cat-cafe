import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { NFT, MARKET, validateManifest, verifyWalletRun } from './wallet-receipts.mjs';
const require = createRequire(resolve(process.cwd(), 'apps/web/package.json'));
const { encodeEventTopics, encodeAbiParameters, encodeFunctionData, decodeEventLog, decodeFunctionData } = require('viem');
const source = readFileSync('packages/chain/src/abi.ts', 'utf8');
const abi = name => JSON.parse(source.match(new RegExp('export const ' + name + ' = (\\[[\\s\\S]*?\\]) as const;'))[1]);
const nftAbi = abi('relicNftAbi'), marketAbi = abi('relicMarketAbi');
const NOW = Date.parse('2026-11-03T12:00:00Z');
const ZERO = '0x' + '0'.repeat(40), SELLER = '0x' + '1'.repeat(40), BUYER = '0x' + '2'.repeat(40);
const txHash = digit => '0x' + digit.repeat(64);
function fixture() {
  const manifest = { chainId: 43113, startedAt: '2026-11-03T10:00:00Z', seller: SELLER, buyer: BUYER, mint: txHash('3'), list: txHash('4'), buy: txHash('5') };
  const start = BigInt(Date.parse(manifest.startedAt) / 1000);
  const voucher = { player: SELLER, relicId: 3n, rarity: 1, nonce: 42n, expiry: start + 1800n };
  const args = [[voucher, '0x' + '11'.repeat(65)], [3n, 1n, 1000n], [7n]];
  const blocks = {}, transactions = {}, receipts = {};
  for (const [i, name] of ['mint', 'list', 'buy'].entries()) {
    const number = BigInt(i + 10), blockHash = txHash(String(i + 6));
    blocks[String(number)] = { number, hash: blockHash, timestamp: start + BigInt(i) };
    const tx = { hash: manifest[name], from: name === 'buy' ? BUYER : SELLER, to: name === 'mint' ? NFT : MARKET, chainId: 43113, blockNumber: number, blockHash, transactionIndex: 0, value: name === 'buy' ? 1000n : 0n, input: encodeFunctionData({ abi: name === 'mint' ? nftAbi : marketAbi, functionName: name, args: args[i] }) };
    transactions[name] = tx;
    receipts[name] = { transactionHash: tx.hash, from: tx.from, to: tx.to, status: 'success', blockNumber: number, blockHash, transactionIndex: 0, logs: [] };
  }
  const addEvent = (stage, contract, eventName, values) => {
    const contractAbi = contract === NFT ? nftAbi : marketAbi;
    const event = contractAbi.find(entry => entry.type === 'event' && entry.name === eventName);
    const inputs = event.inputs.filter(entry => !entry.indexed);
    const receipt = receipts[stage];
    receipt.logs.push({ address: contract, topics: encodeEventTopics({ abi: contractAbi, eventName, args: values }), data: encodeAbiParameters(inputs, inputs.map(entry => values[entry.name])), removed: false, transactionHash: receipt.transactionHash, blockHash: receipt.blockHash, blockNumber: receipt.blockNumber, transactionIndex: 0, logIndex: receipt.logs.length });
  };
  addEvent('mint', NFT, 'RelicForged', { player: SELLER, relicId: 3n, rarity: 1, nonce: 42n });
  addEvent('mint', NFT, 'TransferSingle', { operator: SELLER, from: ZERO, to: SELLER, id: 3n, value: 1n });
  addEvent('list', MARKET, 'Listed', { listingId: 7n, seller: SELLER, relicId: 3n, amount: 1n, price: 1000n });
  addEvent('list', NFT, 'TransferSingle', { operator: MARKET, from: SELLER, to: MARKET, id: 3n, value: 1n });
  addEvent('buy', MARKET, 'Bought', { listingId: 7n, buyer: BUYER, seller: SELLER, relicId: 3n, amount: 1n, price: 1000n });
  addEvent('buy', NFT, 'TransferSingle', { operator: MARKET, from: MARKET, to: BUYER, id: 3n, value: 1n });
  const reads = [], client = {
    getChainId: async () => 43113,
    getBlockNumber: async () => 14n,
    getTransactionReceipt: async ({ hash }) => receipts[Object.keys(manifest).find(key => manifest[key] === hash)],
    getTransaction: async ({ hash }) => transactions[Object.keys(manifest).find(key => manifest[key] === hash)],
    getBlock: async ({ blockNumber }) => blocks[String(blockNumber)],
    readContract: async options => {
      reads.push(options);
      if (options.functionName === 'relicNFT') return NFT;
      if (options.functionName === 'isActive') return false;
      if (options.functionName === 'balanceOf') return 1n;
      throw new Error('Unexpected read');
    },
  };
  const run = () => verifyWalletRun(manifest, { client, nftAbi, marketAbi, decodeEventLog, decodeFunctionData, now: NOW });
  return { manifest, blocks, transactions, receipts, reads, client, run, addEvent, voucher };
}

test('accepts matching canonical Fuji mint/list/buy, pins final reads, outputs no input or signature', async () => {
  const f = fixture(), result = await f.run();
  assert.equal(result.status, 'FRESH_FUJI_RECEIPTS_VERIFIED');
  assert.equal(result.stages.length, 3); assert.equal(result.transactionsSentByVerifier, 0);
  assert.equal(f.reads.length, 3); assert.ok(f.reads.every(read => read.blockNumber === 12n));
  assert.ok(!JSON.stringify(result).includes(f.transactions.mint.input));
  assert.ok(!Object.hasOwn(result, 'voucher')); assert.ok(!Object.hasOwn(result, 'signature'));
});
for (const [name, mutation, reason] of [
  ['mainnet manifest', f => { f.manifest.chainId = 43114; }, 'MANIFEST_NOT_FUJI'],
  ['unrecognized private input', f => { f.manifest.privateKey = 'DO_NOT_ECHO'; }, 'MANIFEST_FIELDS_INVALID'],
  ['same wallet', f => { f.manifest.buyer = SELLER; }, 'SELLER_NOT_DISTINCT_WALLET'],
  ['zero buyer', f => { f.manifest.buyer = ZERO; }, 'BUYER_NOT_WALLET'],
  ['contract seller', f => { f.manifest.seller = MARKET; }, 'SELLER_NOT_DISTINCT_WALLET'],
  ['reused transaction', f => { f.manifest.buy = f.manifest.list; }, 'TRANSACTION_HASH_REUSED'],
  ['malformed hash', f => { f.manifest.buy = 'DO_NOT_ECHO'; }, 'TRANSACTION_HASH_INVALID'],
  ['old mission start', f => { f.manifest.startedAt = '2026-11-02T10:00:00Z'; }, 'RUN_START_OUTSIDE_MISSION'],
  ['future run start', f => { f.manifest.startedAt = '2026-11-04T10:00:00Z'; }, 'RUN_START_OUTSIDE_MISSION'],
  ['wrong RPC chain', f => { f.client.getChainId = async () => 43114; }, 'RPC_NOT_FUJI'],
  ['reverted purchase', f => { f.receipts.buy.status = 'reverted'; }, 'RECEIPT_REVERTED'],
  ['foreign contract', f => { f.receipts.list.to = BUYER; }, 'TARGET_MISMATCH'],
  ['wrong sender', f => { f.transactions.mint.from = BUYER; }, 'SENDER_MISMATCH'],
  ['foreign transaction chain', f => { f.transactions.buy.chainId = 43114; }, 'TRANSACTION_NOT_FUJI'],
  ['wrong receipt hash', f => { f.receipts.buy.transactionHash = txHash('9'); }, 'RECEIPT_HASH_MISMATCH'],
  ['unconfirmed purchase', f => { f.client.getBlockNumber = async () => 12n; }, 'RECEIPT_UNCONFIRMED'],
  ['transaction receipt disagree', f => { f.transactions.buy.blockNumber = 11n; }, 'TRANSACTION_RECEIPT_DISAGREE'],
  ['noncanonical block', f => { f.blocks['12'].hash = txHash('a'); }, 'NONCANONICAL_BLOCK'],
  ['historical mint reused', f => { f.blocks['10'].timestamp -= 1n; }, 'TRANSACTION_OUTSIDE_RUN'],
  ['removed transfer', f => { f.receipts.buy.logs[1].removed = true; }, 'LOG_IDENTITY_INVALID'],
  ['foreign log transaction', f => { f.receipts.list.logs[0].transactionHash = txHash('9'); }, 'LOG_IDENTITY_INVALID'],
  ['malformed event', f => { f.receipts.list.logs[0].data = '0x'; }, 'LOG_DECODE_FAILED'],
  ['missing transfer', f => { f.receipts.buy.logs.pop(); }, 'EVENT_MISSING_OR_AMBIGUOUS'],
  ['forged event address', f => { f.receipts.mint.logs[0].address = BUYER; }, 'EVENT_MISSING_OR_AMBIGUOUS'],
  ['duplicate purchase event', f => { f.receipts.buy.logs.push({ ...f.receipts.buy.logs[0] }); }, 'EVENT_MISSING_OR_AMBIGUOUS'],
  ['wrong mint voucher', f => { f.transactions.mint.input = encodeFunctionData({ abi: nftAbi, functionName: 'mint', args: [{ ...f.voucher, nonce: 43n }, '0x' + '11'.repeat(65)] }); }, 'MINT_VOUCHER_MISMATCH'],
  ['wrong listing calldata', f => { f.transactions.list.input = encodeFunctionData({ abi: marketAbi, functionName: 'list', args: [3n, 1n, 2000n] }); }, 'LIST_CALL_MISMATCH'],
  ['wrong buy calldata', f => { f.transactions.buy.input = encodeFunctionData({ abi: marketAbi, functionName: 'buy', args: [8n] }); }, 'BUY_PAYMENT_MISMATCH'],
  ['wrong payment', f => { f.transactions.buy.value = 999n; }, 'BUY_PAYMENT_MISMATCH'],
  ['unexpected mint payment', f => { f.transactions.mint.value = 1n; }, 'UNEXPECTED_PAYMENT'],
  ['cancel substituted for buy', f => { f.transactions.buy.input = encodeFunctionData({ abi: marketAbi, functionName: 'cancel', args: [7n] }); }, 'WRONG_METHOD'],
  ['still active listing', f => { const read = f.client.readContract; f.client.readContract = async o => o.functionName === 'isActive' ? true : read(o); }, 'LISTING_STILL_ACTIVE'],
  ['buyer owns nothing', f => { const read = f.client.readContract; f.client.readContract = async o => o.functionName === 'balanceOf' ? 0n : read(o); }, 'BUYER_BALANCE_MISSING'],
  ['wrong NFT linkage', f => { const read = f.client.readContract; f.client.readContract = async o => o.functionName === 'relicNFT' ? BUYER : read(o); }, 'MARKET_LINKAGE_MISMATCH'],
  ['reorg during verification', f => { const get = f.client.getBlock; let reads = 0; f.client.getBlock = async o => { const b = await get(o); return ++reads > 3 ? { ...b, hash: txHash('a') } : b; }; }, 'BLOCK_CHANGED_DURING_CHECK'],
]) {
  test('rejects ' + name, async () => {
    const f = fixture(); mutation(f);
    await assert.rejects(f.run, error => error.message === reason && !error.message.includes('DO_NOT_ECHO'));
  });
}
test('manifest failures occur before any RPC call', async () => {
  const f = fixture(); let called = false;
  f.client.getChainId = async () => { called = true; throw new Error('Must not call'); };
  f.manifest.chainId = 1;
  await assert.rejects(f.run, /MANIFEST_NOT_FUJI/); assert.equal(called, false);
  assert.throws(() => validateManifest(null, NOW), /MANIFEST_OBJECT_REQUIRED/);
});
