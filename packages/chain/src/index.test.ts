import { describe, expect, it } from 'vitest';
import { ANVIL_CHAIN_ID, FUJI_CHAIN_ID, getAddresses, relicMarketAbi, relicNftAbi } from './index';

describe('chain', () => {
  it('targets Fuji', () => {
    expect(FUJI_CHAIN_ID).toBe(43113);
  });

  it('loads the local anvil deployment written by Deploy.s.sol', () => {
    expect(getAddresses(ANVIL_CHAIN_ID)).toEqual({
      RelicNFT: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      RelicMarket: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    });
  });

  it('has no Fuji addresses until C3b deploys', () => {
    expect(getAddresses(FUJI_CHAIN_ID)).toEqual({ RelicNFT: undefined, RelicMarket: undefined });
  });

  it('returns undefined addresses for unknown chains', () => {
    expect(getAddresses(1)).toEqual({ RelicNFT: undefined, RelicMarket: undefined });
  });

  it('exports both ABIs', () => {
    const names = (abi: readonly { type: string; name?: string }[]) =>
      abi.filter((e) => e.type === 'function').map((e) => e.name);
    expect(names(relicNftAbi)).toEqual(expect.arrayContaining(['mint', 'signer', 'hashVoucher']));
    expect(names(relicMarketAbi)).toEqual(expect.arrayContaining(['relicNFT']));
  });
});
