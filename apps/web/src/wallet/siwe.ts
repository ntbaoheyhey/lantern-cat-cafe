import { FUJI_CHAIN_ID } from '@taskbar-hero/chain';
import { getAddress } from 'viem';
import { createSiweMessage } from 'viem/siwe';

export const SIWE_TTL_MS = 10 * 60 * 1000;

export function buildSiweMessage(opts: { address: string; nonce: string; now?: Date }): string {
  const issuedAt = opts.now ?? new Date();
  return createSiweMessage({
    domain: window.location.host,
    address: getAddress(opts.address),
    statement: 'Sign in to Taskbar Hero.',
    uri: window.location.origin,
    chainId: FUJI_CHAIN_ID,
    version: '1',
    nonce: opts.nonce,
    issuedAt,
    expirationTime: new Date(issuedAt.getTime() + SIWE_TTL_MS),
  });
}
