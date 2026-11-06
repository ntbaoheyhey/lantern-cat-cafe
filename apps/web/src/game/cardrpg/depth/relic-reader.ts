import { createPublicClient, custom, isAddress, type EIP1193Provider } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { relicNftAbi } from '@taskbar-hero/chain';
import { FUJI_RELIC_ADDRESS, RELIC_EFFECTS, type RelicHolding } from '@taskbar-hero/game-rules/src/cardrpg/depth/bridge';

/** Reads an already connected wallet. All RPC methods here are read-only. */
export async function readConnectedRelics(provider: EIP1193Provider) {
  const [accounts, chain] = await Promise.all([
    provider.request({ method: 'eth_accounts' }),
    provider.request({ method: 'eth_chainId' }),
  ]);
  const address = accounts[0];
  if (!address || !isAddress(address)) throw new Error('Connect a wallet to this app before reading its Relics.');
  if (Number(chain) !== 43113) throw new Error('Select Avalanche Fuji 43113 in your wallet, then retry.');
  const client = createPublicClient({ chain: avalancheFuji, transport: custom(provider) });
  const blockNumber = await client.getBlockNumber();
  const balances = await client.readContract({
    address: FUJI_RELIC_ADDRESS, abi: relicNftAbi, functionName: 'balanceOfBatch',
    args: [RELIC_EFFECTS.map(() => address), RELIC_EFFECTS.map(r => BigInt(r.id))], blockNumber,
  });
  const owned = RELIC_EFFECTS.filter((_, index) => balances[index]! > 0n);
  const holdings: RelicHolding[] = await Promise.all(owned.map(async relic => ({
    id: relic.id,
    balance: balances[RELIC_EFFECTS.indexOf(relic)]!.toString(),
    rarity: await client.readContract({ address: FUJI_RELIC_ADDRESS, abi: relicNftAbi,
      functionName: 'rarityOf', args: [BigInt(relic.id)], blockNumber }),
  })));
  return { address, chainId: 43113, block: blockNumber.toString(), holdings };
}
