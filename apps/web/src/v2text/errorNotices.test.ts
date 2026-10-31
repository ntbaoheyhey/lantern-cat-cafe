import { describe, expect, it } from 'vitest';
import {
  OFFLINE_NOTICE,
  SERVER_BUSY_NOTICE,
  formatShortAddress,
  rateLimitedNotice,
  wrongWalletNotice,
} from './errorNotices';

describe('errorNotices', () => {
  it('formats rateLimitedNotice with live seconds', () => {
    expect(rateLimitedNotice(7)).toBe('Easy, hero! Try again in 7 s.');
    expect(rateLimitedNotice(1)).toBe('Easy, hero! Try again in 1 s.');
  });

  it('exposes constant server busy and offline notices', () => {
    expect(SERVER_BUSY_NOTICE).toBe(
      'The cafe kitchen is busy. Nothing was spent. Try again in a minute.'
    );
    expect(OFFLINE_NOTICE).toBe(
      'You are offline. Your cat keeps working; we will sync when you are back.'
    );
  });

  it('formats short address with 6 chars, three dots, 4 chars', () => {
    expect(formatShortAddress('0x70997970C51812dc3A010C7d01b50e0d17dc79C8')).toBe(
      '0x7099...79C8'
    );
    expect(formatShortAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(
      '0x1234...5678'
    );
  });

  it('formats wrongWalletNotice correctly', () => {
    expect(
      wrongWalletNotice('0x70997970C51812dc3A010C7d01b50e0d17dc79C8')
    ).toBe(
      'This Relic belongs to 0x7099...79C8. Switch to that wallet to mint it.'
    );
  });
});
