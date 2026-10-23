import { describe, expect, it } from 'vitest';
import { FUJI_CHAIN_ID, addresses } from './index';

describe('chain', () => {
  it('targets Fuji', () => {
    expect(FUJI_CHAIN_ID).toBe(43113);
  });
  it('has no addresses yet', () => {
    expect(addresses.RelicNFT).toBeUndefined();
    expect(addresses.RelicMarket).toBeUndefined();
  });
});
