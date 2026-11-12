import { getAddress, isAddressEqual, zeroAddress, type Address, type Hash } from 'viem';
import { requireFuji } from './guest';

/** The adapter uses receipt-confirmed transactions. Each retry reads remaining
 * assets again, so interruption never duplicates an already-completed transfer. */
export interface MoveAdapter {
  chainId(): Promise<number>;
  address: Address;
  cancelListings(): Promise<void>;
  withdrawProceeds(): Promise<void>;
  relics(): Promise<{ id: bigint; amount: bigint }[]>;
  moveRelics(to: Address, ids: bigint[], amounts: bigint[]): Promise<Hash>;
  yarnBalance(): Promise<bigint>;
  moveYarn(to: Address, amount: bigint): Promise<Hash>;
  balance(): Promise<bigint>;
  sweep(to: Address, balance: bigint): Promise<Hash | undefined>;
}
export async function moveGuestAssets(adapter: MoveAdapter, destination: string, onReceipt: (hash: Hash) => void) {
  const to = getAddress(destination);
  if (isAddressEqual(to, adapter.address) || isAddressEqual(to, zeroAddress)) throw new Error('Choose another wallet.');
  const guard = async () => requireFuji(await adapter.chainId());
  await guard(); await adapter.cancelListings();
  await guard(); await adapter.withdrawProceeds();
  const holdings = (await adapter.relics()).filter(r => r.amount > 0n);
  if (holdings.length) { await guard(); onReceipt(await adapter.moveRelics(to, holdings.map(r => r.id), holdings.map(r => r.amount))); }
  const yarn = await adapter.yarnBalance();
  if (yarn > 0n) { await guard(); onReceipt(await adapter.moveYarn(to, yarn)); }
  await guard();
  const hash = await adapter.sweep(to, await adapter.balance());
  if (hash) onReceipt(hash);
  // Keep the key: pending vouchers, dust or later transfers may still need it.
}
