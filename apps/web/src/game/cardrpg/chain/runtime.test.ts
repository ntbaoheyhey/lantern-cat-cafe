import {expect, it, vi} from 'vitest';
import type {WalletClient} from 'viem';
import {requireWallet} from './runtime';

const address = '0x0000000000000000000000000000000000000001';
const other = '0x0000000000000000000000000000000000000002';
function wallet() {
  return {getChainId: vi.fn(async () => 43113), getAddresses: vi.fn(async () => [address]), account: {address}} as unknown as Pick<WalletClient, 'getChainId' | 'getAddresses' | 'account'>;
}
it('accepts only the authenticated signer on Fuji', async () => {
  await expect(requireWallet(wallet(), address)).resolves.toBeUndefined();
});
it('rejects a changed, disconnected or stale wallet account', async () => {
  for (const accounts of [[other], []]) {
    const client = wallet();
    vi.mocked(client.getAddresses).mockResolvedValue(accounts as `0x${string}`[]);
    await expect(requireWallet(client, address)).rejects.toThrow('Wallet changed');
  }
  const stale = wallet();
  stale.account = {...stale.account!, address: other};
  await expect(requireWallet(stale, address)).rejects.toThrow('Wallet changed');
});
it('rejects a chain switch before querying accounts', async () => {
  const client = wallet(); vi.mocked(client.getChainId).mockResolvedValue(43114);
  await expect(requireWallet(client, address)).rejects.toThrow('Fuji');
  expect(client.getAddresses).not.toHaveBeenCalled();
});
