import { describe, expect, it, vi } from 'vitest';
const rpc = vi.hoisted(() => ({ getBlockNumber: vi.fn(), getLogs: vi.fn(), getBlock: vi.fn() }));
vi.mock('viem', async original => ({ ...await original<typeof import('viem')>(), createPublicClient: () => rpc }));
import { fujiReader } from '../../functions/_shared/relic.ts';

describe('RelicForged lookup transaction attribution', () => {
  it('returns the matched nonce transaction hash and filters by the deployed NFT, player and Relic', async () => {
    const nft = '0x0000000000000000000000000000000000000001';
    const player = '0x0000000000000000000000000000000000000002';
    const tx = `0x${'12'.repeat(32)}` as const;
    rpc.getBlockNumber.mockResolvedValue(100n);
    rpc.getLogs.mockResolvedValue([{ args: { nonce: 8n }, transactionHash: `0x${'34'.repeat(32)}` }, { args: { nonce: 9n }, transactionHash: tx }]);
    expect(await fujiReader('http://unused.local', nft).nonceMinted!(player, 1n, 9n, 1000)).toBe(tx);
    expect(rpc.getLogs).toHaveBeenCalledWith(expect.objectContaining({ address: nft, args: { player, relicId: 1n } }));
  });
});
