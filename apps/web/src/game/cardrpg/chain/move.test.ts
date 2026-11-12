import { expect, it, vi } from 'vitest';
import { moveGuestAssets, type MoveAdapter } from './move';
const from = '0x0000000000000000000000000000000000000001', to = '0x0000000000000000000000000000000000000002';
const hash = `0x${'a'.repeat(64)}` as const;
function adapter() {
  const order: string[] = [];
  const a: MoveAdapter = {
    address: from, chainId: async () => 43113,
    cancelListings: async () => { order.push('cancel'); }, withdrawProceeds: async () => { order.push('withdraw'); },
    relics: async () => [{id: 3n, amount: 2n}], moveRelics: async () => { order.push('relics'); return hash; },
    yarnBalance: async () => 10n, moveYarn: async () => { order.push('yarn'); return hash; },
    balance: async () => 5n, sweep: async () => { order.push('avax'); return hash; },
  }; return { a, order };
}
it('recovers escrow and proceeds, moves tokens, and sweeps gas last', async () => {
  const {a,order} = adapter(), receipt = vi.fn(); await moveGuestAssets(a, to, receipt);
  expect(order).toEqual(['cancel','withdraw','relics','yarn','avax']); expect(receipt).toHaveBeenCalledTimes(3);
});
it('stops at a failed token receipt, preserving gas for retry', async () => {
  const {a,order} = adapter(); a.moveRelics = async () => {throw new Error('reverted');};
  await expect(moveGuestAssets(a, to, vi.fn())).rejects.toThrow('reverted'); expect(order).toEqual(['cancel','withdraw']);
});
it('refuses self-transfer and a network change before any asset movement', async () => {
  const {a,order} = adapter(); await expect(moveGuestAssets(a, from, vi.fn())).rejects.toThrow('another');
  a.chainId = async () => 43114; await expect(moveGuestAssets(a, to, vi.fn())).rejects.toThrow('Fuji'); expect(order).toEqual([]);
});
