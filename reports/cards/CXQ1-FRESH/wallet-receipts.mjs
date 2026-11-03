// CXQ1 evidence only: public reads, never a wallet client, signer, key, or raw calldata output.
export const NFT = '0xb1a1edb7a75db6e7067e747ddee32b39c2296f2d';
export const MARKET = '0x10fcc46e439d3e31fb1720b337c45cadb9b2ff93';
const ZERO = '0x' + '0'.repeat(40);
const address = value => typeof value === 'string' && /^0x[0-9a-f]{40}$/i.test(value);
const hash = value => typeof value === 'string' && /^0x[0-9a-f]{64}$/i.test(value);
const same = (a, b) => typeof a === 'string' && typeof b === 'string' && a.toLowerCase() === b.toLowerCase();
const check = (condition, code) => { if (!condition) throw new Error(code); };

export function validateManifest(input, now = Date.now()) {
  check(input && typeof input === 'object' && !Array.isArray(input), 'MANIFEST_OBJECT_REQUIRED');
  const keys = ['chainId', 'startedAt', 'seller', 'buyer', 'mint', 'list', 'buy'];
  check(Object.keys(input).length === keys.length && keys.every(key => Object.hasOwn(input, key)), 'MANIFEST_FIELDS_INVALID');
  check(input.chainId === 43113, 'MANIFEST_NOT_FUJI');
  check(address(input.seller) && address(input.buyer), 'WALLET_ADDRESS_INVALID');
  check(![ZERO, NFT, MARKET, input.buyer].some(value => same(input.seller, value)), 'SELLER_NOT_DISTINCT_WALLET');
  check(![ZERO, NFT, MARKET].some(value => same(input.buyer, value)), 'BUYER_NOT_WALLET');
  check(['mint', 'list', 'buy'].every(key => hash(input[key])), 'TRANSACTION_HASH_INVALID');
  check(new Set(['mint', 'list', 'buy'].map(key => input[key].toLowerCase())).size === 3, 'TRANSACTION_HASH_REUSED');
  check(typeof input.startedAt === 'string' && /^2026-11-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(input.startedAt), 'RUN_START_INVALID');
  const start = Date.parse(input.startedAt);
  check(Number.isFinite(start) && start >= Date.parse('2026-11-03T00:00:00Z') && start <= now, 'RUN_START_OUTSIDE_MISSION');
  return { ...input, startSeconds: BigInt(Math.floor(start / 1000)) };
}

/** Exact mint/list/buy sequence. Passing verifies public receipts, not UI interaction or wallet custody. */
export async function verifyWalletRun(input, { client, nftAbi, marketAbi, decodeEventLog, decodeFunctionData, now = Date.now() }) {
  const m = validateManifest(input, now);
  check(await client.getChainId() === 43113, 'RPC_NOT_FUJI');
  const latest = await client.getBlockNumber({ cacheTime: 0 });
  const stages = [];
  for (const name of ['mint', 'list', 'buy']) {
    const receipt = await client.getTransactionReceipt({ hash: m[name] });
    const tx = await client.getTransaction({ hash: m[name] });
    const target = name === 'mint' ? NFT : MARKET;
    const sender = name === 'buy' ? m.buyer : m.seller;
    check(receipt.status === 'success', 'RECEIPT_REVERTED');
    check(same(receipt.transactionHash, m[name]) && same(tx.hash, m[name]), 'RECEIPT_HASH_MISMATCH');
    check(same(receipt.to, target) && same(tx.to, target), 'TARGET_MISMATCH');
    check(same(receipt.from, sender) && same(tx.from, sender), 'SENDER_MISMATCH');
    check(tx.chainId === 43113, 'TRANSACTION_NOT_FUJI');
    check(typeof receipt.blockNumber === 'bigint' && receipt.blockNumber > 0n && receipt.blockNumber < latest, 'RECEIPT_UNCONFIRMED');
    check(tx.blockNumber === receipt.blockNumber && tx.transactionIndex === receipt.transactionIndex && same(tx.blockHash, receipt.blockHash), 'TRANSACTION_RECEIPT_DISAGREE');
    const block = await client.getBlock({ blockNumber: receipt.blockNumber });
    check(same(block.hash, receipt.blockHash), 'NONCANONICAL_BLOCK');
    check(block.timestamp >= m.startSeconds && block.timestamp <= BigInt(Math.floor(now / 1000)), 'TRANSACTION_OUTSIDE_RUN');
    if (stages.length) {
      const previous = stages.at(-1).receipt;
      check(receipt.blockNumber > previous.blockNumber || (receipt.blockNumber === previous.blockNumber && receipt.transactionIndex > previous.transactionIndex), 'TRANSACTION_ORDER_INVALID');
    }
    const abi = name === 'mint' ? nftAbi : marketAbi;
    let call;
    try { call = decodeFunctionData({ abi, data: tx.input }); } catch { throw new Error('CALLDATA_INVALID'); }
    check(call.functionName === name, 'WRONG_METHOD');
    const events = [];
    for (const log of receipt.logs) {
      if (![NFT, MARKET].some(value => same(log.address, value))) continue;
      check(!log.removed && same(log.transactionHash, m[name]) && same(log.blockHash, block.hash) && log.blockNumber === receipt.blockNumber, 'LOG_IDENTITY_INVALID');
      try { events.push({ address: log.address, ...decodeEventLog({ abi: same(log.address, NFT) ? nftAbi : marketAbi, data: log.data, topics: log.topics, strict: true }) }); }
      catch { throw new Error('LOG_DECODE_FAILED'); }
    }
    stages.push({ name, receipt, tx, call, block, events });
  }
  const event = (stage, name, contract) => {
    const matches = stage.events.filter(value => value.eventName === name && same(value.address, contract));
    check(matches.length === 1, 'EVENT_MISSING_OR_AMBIGUOUS');
    return matches[0].args;
  };
  const [mint, list, buy] = stages;
  const forged = event(mint, 'RelicForged', NFT);
  const listed = event(list, 'Listed', MARKET);
  const bought = event(buy, 'Bought', MARKET);
  const voucher = mint.call.args[0];
  check(same(forged.player, m.seller) && same(voucher.player, m.seller), 'MINT_PLAYER_MISMATCH');
  check(forged.relicId === voucher.relicId && forged.rarity === voucher.rarity && forged.nonce === voucher.nonce && voucher.expiry >= mint.block.timestamp, 'MINT_VOUCHER_MISMATCH');
  check(mint.tx.value === 0n && list.tx.value === 0n, 'UNEXPECTED_PAYMENT');
  check(same(listed.seller, m.seller) && listed.relicId === forged.relicId && listed.amount === 1n && listed.price > 0n, 'LISTING_MISMATCH');
  check(list.call.args[0] === listed.relicId && list.call.args[1] === listed.amount && list.call.args[2] === listed.price, 'LIST_CALL_MISMATCH');
  check(same(bought.seller, m.seller) && same(bought.buyer, m.buyer) && bought.listingId === listed.listingId && bought.relicId === listed.relicId && bought.amount === listed.amount && bought.price === listed.price, 'PURCHASE_MISMATCH');
  check(buy.call.args[0] === listed.listingId && buy.tx.value === listed.price, 'BUY_PAYMENT_MISMATCH');
  for (const [stage, from, to, operator] of [[mint, ZERO, m.seller, m.seller], [list, m.seller, MARKET, MARKET], [buy, MARKET, m.buyer, MARKET]]) {
    const transfer = event(stage, 'TransferSingle', NFT);
    check(same(transfer.from, from) && same(transfer.to, to) && same(transfer.operator, operator) && transfer.id === forged.relicId && transfer.value === 1n, 'TRANSFER_MISMATCH');
  }
  const at = buy.receipt.blockNumber;
  check(same(await client.readContract({ address: MARKET, abi: marketAbi, functionName: 'relicNFT', blockNumber: at }), NFT), 'MARKET_LINKAGE_MISMATCH');
  check(await client.readContract({ address: MARKET, abi: marketAbi, functionName: 'isActive', args: [listed.listingId], blockNumber: at }) === false, 'LISTING_STILL_ACTIVE');
  check(await client.readContract({ address: NFT, abi: nftAbi, functionName: 'balanceOf', args: [m.buyer, forged.relicId], blockNumber: at }) >= 1n, 'BUYER_BALANCE_MISSING');
  for (const stage of stages) check(same((await client.getBlock({ blockNumber: stage.receipt.blockNumber })).hash, stage.receipt.blockHash), 'BLOCK_CHANGED_DURING_CHECK');
  return {
    status: 'FRESH_FUJI_RECEIPTS_VERIFIED', chainId: 43113, checkedAt: new Date(now).toISOString(), runStartedAt: m.startedAt,
    contracts: { RelicNFT: NFT, RelicMarket: MARKET }, seller: m.seller, buyer: m.buyer,
    relicId: String(forged.relicId), listingId: String(listed.listingId), amount: '1', priceWei: String(listed.price),
    stages: stages.map(stage => ({ name: stage.name, hash: m[stage.name], blockNumber: String(stage.receipt.blockNumber), blockHash: stage.receipt.blockHash, explorer: 'https://testnet.snowtrace.io/tx/' + m[stage.name] })),
    transactionsSentByVerifier: 0, limitations: ['Public RPC receipt verification only; this does not prove UI use, wallet custody or throwaway status.', 'Guest saves are not server mint eligibility. No voucher, signature, key or raw transaction input is retained.'],
  };
}
