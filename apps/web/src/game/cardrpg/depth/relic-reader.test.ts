import { beforeEach, expect, it, vi } from 'vitest';
import type { EIP1193Provider } from 'viem';
const rpc = vi.hoisted(() => ({ getBlockNumber: vi.fn(), readContract: vi.fn() }));
vi.mock('viem', async importOriginal => ({ ...await importOriginal<typeof import('viem')>(), createPublicClient: () => rpc }));
import { readConnectedRelics } from './relic-reader';
const address = '0x1111111111111111111111111111111111111111';
beforeEach(() => { rpc.getBlockNumber.mockResolvedValue(42n); rpc.readContract.mockImplementation(async args => args.functionName === 'balanceOfBatch' ? [1n, 0n, 2n, 0n] : Number(args.args[0]) - 1); });
it('reads existing Fuji holdings at one pinned block through read-only RPC', async () => {
  const request = vi.fn(async ({ method }) => method === 'eth_accounts' ? [address] : '0xa869');
  const result = await readConnectedRelics({ request, on: vi.fn(), removeListener: vi.fn() } as EIP1193Provider);
  expect(request.mock.calls.map(([call]) => call.method)).toEqual(['eth_accounts', 'eth_chainId']);
  expect(result.holdings.map(h => h.balance)).toEqual(['1', '2']);
  expect(result.block).toBe('42');
  for (const [call] of rpc.readContract.mock.calls) {
    expect(call.blockNumber).toBe(42n);
    expect(['balanceOfBatch', 'rarityOf']).toContain(call.functionName);
  }
});
it('accepts an empty wallet without reading default rarity values of unminted IDs', async () => {
  rpc.readContract.mockResolvedValueOnce([0n, 0n, 0n, 0n]);
  const request = vi.fn(async ({ method }) => method === 'eth_accounts' ? [address] : '0xa869');
  const result = await readConnectedRelics({ request, on: vi.fn(), removeListener: vi.fn() } as EIP1193Provider);
  expect(result.holdings).toEqual([]);
});
it('rejects a wrong chain or a disconnected account', async () => {
  await expect(readConnectedRelics({ request: async ({ method }) => method === 'eth_accounts' ? [address] : '0x1' } as EIP1193Provider)).rejects.toThrow('Fuji');
  await expect(readConnectedRelics({ request: async ({ method }) => method === 'eth_accounts' ? [] : '0xa869' } as EIP1193Provider)).rejects.toThrow('Connect');
});
