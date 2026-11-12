import { expect, it } from 'vitest';
import { BaseError, ChainMismatchError, InsufficientFundsError } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { friendlyError } from './errors';

it.each([
  [new BaseError('Transaction on Avalanche Fuji', { cause: new InsufficientFundsError() }), 'No gas. Open faucet.'],
  [new BaseError('Fuji RPC request failed'), 'Unavailable. Retry.'],
  [new BaseError('Transaction reverted. Chain: Avalanche Fuji'), 'Transaction failed. Retry.'],
  [new BaseError('Execution on Fuji', { cause: new Error('Cooldown() reverted') }), 'Wait 10 minutes.'],
  [new BaseError('Fuji wallet: user rejected the request'), 'Cancelled. Retry.'],
  [new BaseError('Wallet request', { cause: new ChainMismatchError({ chain: avalancheFuji, currentChainId: 1 }) }), 'Switch to Fuji.'],
  [new Error('Switch to Fuji.'), 'Switch to Fuji.'],
  [new Error('Sign in again.'), 'Sign in again.'],
])('reports the cause of a chain failure (%#)', (error, expected) => {
  expect(friendlyError(error)).toBe(expected);
});
