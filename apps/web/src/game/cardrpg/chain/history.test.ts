import { expect, it } from 'vitest';
import { createPublicClient, custom, type Hash } from 'viem';
import { readChainHistory } from './history';

it('shows a just-confirmed transaction even when the RPC client cached the previous head', async () => {
  const address = '0x0000000000000000000000000000000000000001' as const;
  const hash = `0x${'a'.repeat(64)}` as Hash;
  let head = '0x1';
  const client = createPublicClient({cacheTime: 60_000, transport: custom({request: async ({method, params}) => {
    if (method === 'eth_blockNumber') return head;
    if (method === 'eth_getLogs') {
      const filter = (params as [{toBlock: string}])[0];
      if (filter.toBlock !== '0x2') return [];
      return [{address, transactionHash: hash, blockNumber: '0x2', transactionIndex: '0x0',
        blockHash: `0x${'b'.repeat(64)}`, logIndex: '0x0', data: '0x', topics: [], removed: false}];
    }
    throw new Error(`Unexpected RPC ${method}`);
  }})});
  expect(await client.getBlockNumber()).toBe(1n);
  head = '0x2';
  expect(await client.getBlockNumber()).toBe(1n); // Reproduce the stale viem cache, without timers or sleeps.
  expect(await readChainHistory(client, [address])).toEqual([{hash, block: 2n, index: 0}]);
});
