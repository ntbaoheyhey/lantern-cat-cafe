import { describe, expect, it } from 'vitest';
import { FUJI_CHAIN_ID, VOUCHER_TTL_SECONDS } from './constants';

describe('chain constants', () => {
  it('uses Avalanche Fuji chain id 43113', () => {
    expect(FUJI_CHAIN_ID).toBe(43113);
  });

  it('expires vouchers after 30 minutes, within the 24-hour backend limit', () => {
    expect(VOUCHER_TTL_SECONDS).toBe(1800);
    expect(Number.isInteger(VOUCHER_TTL_SECONDS)).toBe(true);
    expect(VOUCHER_TTL_SECONDS).toBeGreaterThan(0);
    expect(VOUCHER_TTL_SECONDS).toBeLessThanOrEqual(24 * 60 * 60);
  });
});
