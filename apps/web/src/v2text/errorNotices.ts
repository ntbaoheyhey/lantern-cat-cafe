/**
 * Centralized user-facing error notices for Cat RPG v2.
 * Cat-café tone: calm, clear, and reassuring.
 */

export const SERVER_BUSY_NOTICE =
  'The cafe kitchen is busy. Nothing was spent. Try again in a minute.';

export const OFFLINE_NOTICE =
  'You are offline. Your cat keeps working; we will sync when you are back.';

export function rateLimitedNotice(seconds: number): string {
  return `Easy, hero! Try again in ${seconds} s.`;
}

export function formatShortAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function wrongWalletNotice(playerAddress: string): string {
  return `This Relic belongs to ${formatShortAddress(playerAddress)}. Switch to that wallet to mint it.`;
}
