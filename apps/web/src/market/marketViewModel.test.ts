import { describe, expect, it } from 'vitest';
import { visibleListings, isOwnListing, fujiContractUrl, type Listing } from './marketViewModel';

const me = `0x${'ab'.repeat(20)}` as const;
const other = `0x${'cd'.repeat(20)}` as const;
const rows: Listing[] = [
  { id: 9n, seller: me, relicId: 1n, amount: 2n, price: 9007199254740993n },
  { id: 3n, seller: other, relicId: 4n, amount: 10n, price: 9007199254740992n },
  { id: 7n, seller: other, relicId: 2n, amount: 1n, price: 5n },
];
describe('truthful market presentation', () => {
  it('sorts full-precision prices and quantities without mutating query data', () => {
    expect(visibleListings(rows, 'all', 'price', 'asc', me).map(row => row.id)).toEqual([7n, 3n, 9n]);
    expect(visibleListings(rows, 'all', 'price', 'desc', me).map(row => row.id)).toEqual([9n, 3n, 7n]);
    expect(visibleListings(rows, 'all', 'quantity', 'asc', me).map(row => row.id)).toEqual([7n, 9n, 3n]);
    expect(rows.map(row => row.id)).toEqual([9n, 3n, 7n]);
  });
  it('filters actual rarity and case-insensitive ownership, not invented equipment categories', () => {
    expect(visibleListings(rows, 'rare', 'price', 'asc', me).map(row => row.id)).toEqual([7n]);
    expect(visibleListings(rows, 'mine', 'price', 'asc', me).map(row => row.id)).toEqual([9n]);
    expect(isOwnListing(rows[0]!, `0x${'AB'.repeat(20)}`)).toBe(true);
    expect(visibleListings(rows, 'epic', 'price', 'asc', me)).toEqual([]);
  });
  it('uses a stable listing-id tie break and the configured rarity order', () => {
    const tied = rows.map(row => ({ ...row, price: 1n }));
    expect(visibleListings(tied, 'all', 'price', 'desc', me).map(row => row.id)).toEqual([3n, 7n, 9n]);
    expect(visibleListings(rows, 'all', 'rarity', 'asc', me).map(row => row.id)).toEqual([9n, 7n, 3n]);
  });
  it('links to the Fuji contract explorer without inventing a token-detail route', () => {
    expect(fujiContractUrl(me)).toBe(`https://testnet.snowtrace.io/address/${me}`);
  });
});
