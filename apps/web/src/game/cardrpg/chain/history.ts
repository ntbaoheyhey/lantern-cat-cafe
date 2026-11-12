import type { Address, Hash, PublicClient } from 'viem';

export interface HistoryRow { hash: Hash; block: bigint; index: number }

export async function readChainHistory(
  client: Pick<PublicClient, 'getBlockNumber' | 'getLogs'>,
  addresses: Address[], start = 0n,
): Promise<HistoryRow[]> {
  // A transaction may confirm inside viem's head-cache lifetime. Using that cached
  // head as toBlock would permanently omit the receipt from this history snapshot.
  let to = await client.getBlockNumber({cacheTime: 0});
  const found = new Map<Hash, HistoryRow>();
  for (let windows = 0; windows < 12 && to >= start && found.size < 20; windows++) {
    const from = to - start > 9999n ? to - 9999n : start;
    const logs = await client.getLogs({address: addresses, fromBlock: from, toBlock: to});
    for (const log of logs) if (log.transactionHash && log.blockNumber !== null) {
      found.set(log.transactionHash, {hash: log.transactionHash, block: log.blockNumber, index: log.transactionIndex ?? 0});
    }
    if (from === start) break;
    to = from - 1n;
  }
  return [...found.values()].sort((a, b) => a.block === b.block ? b.index - a.index : a.block > b.block ? -1 : 1).slice(0, 20);
}
