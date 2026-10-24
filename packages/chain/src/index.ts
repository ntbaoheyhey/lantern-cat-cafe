import fuji from '../deployments/43113.json';
import anvil from '../deployments/31337.json';

import { ANVIL_CHAIN_ID, FUJI_CHAIN_ID } from './constants';

export { relicMarketAbi, relicNftAbi } from './abi';
export * from './constants';

export type Address = `0x${string}`;

export interface Addresses {
  RelicNFT: Address | undefined;
  RelicMarket: Address | undefined;
}

// Files written by contracts/script/Deploy.s.sol. An empty string means "not deployed yet".
const deployments: Record<number, { RelicNFT: string; RelicMarket: string }> = {
  [FUJI_CHAIN_ID]: fuji,
  [ANVIL_CHAIN_ID]: anvil,
};

const asAddress = (value: string): Address | undefined =>
  /^0x[0-9a-fA-F]{40}$/.test(value) ? (value as Address) : undefined;

/** Deployed contract addresses for a chain; fields are undefined until deployed there. */
export function getAddresses(chainId: number): Addresses {
  const d = deployments[chainId];
  return {
    RelicNFT: d ? asAddress(d.RelicNFT) : undefined,
    RelicMarket: d ? asAddress(d.RelicMarket) : undefined,
  };
}
