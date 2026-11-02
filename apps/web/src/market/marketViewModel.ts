import type { Rarity } from '@taskbar-hero/game-rules';
import { relicName } from '../forge/forgeText';
import { RELIC_IDS, rarityOf } from './marketText';

export interface Listing {
  id: bigint;
  seller: `0x${string}`;
  relicId: bigint;
  amount: bigint;
  price: bigint;
}
export type ListingFilter = 'all' | 'mine' | Rarity;
export type ListingSort = 'name' | 'rarity' | 'quantity' | 'seller' | 'price';
export type SortDirection = 'asc' | 'desc';
export const listingName = (listing: Listing) => {
  const rarity = rarityOf(listing.relicId);
  return rarity ? relicName(rarity) : `Relic #${listing.relicId}`;
};
export const isOwnListing = (listing: Listing, address: string) => listing.seller.toLowerCase() === address.toLowerCase();
const compare = (a: bigint, b: bigint) => a < b ? -1 : a > b ? 1 : 0;

/** Presentation only. Keep amounts/prices as bigint and never mutate the queried rows. */
export function visibleListings(listings: readonly Listing[], filter: ListingFilter, sort: ListingSort, direction: SortDirection, address: string): Listing[] {
  return listings.filter(listing => filter === 'all' || (filter === 'mine'
    ? isOwnListing(listing, address) : rarityOf(listing.relicId) === filter)).sort((a, b) => {
    let order: number;
    if (sort === 'price') order = compare(a.price, b.price);
    else if (sort === 'quantity') order = compare(a.amount, b.amount);
    else if (sort === 'name') order = listingName(a).localeCompare(listingName(b));
    else if (sort === 'seller') order = a.seller.toLowerCase().localeCompare(b.seller.toLowerCase());
    else order = RELIC_IDS.findIndex(row => row.relicId === a.relicId) - RELIC_IDS.findIndex(row => row.relicId === b.relicId);
    return order === 0 ? compare(a.id, b.id) : direction === 'asc' ? order : -order;
  });
}

/** Snowtrace is Routescan's Fuji explorer; use its established contract route. */
export const fujiContractUrl = (address: string) => `https://testnet.snowtrace.io/address/${address}`;
