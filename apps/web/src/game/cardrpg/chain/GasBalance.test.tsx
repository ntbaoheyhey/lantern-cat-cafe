import {act, cleanup, render, screen, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {GasBalance} from './GasBalance';
import {ChainApiError,chainPost} from './api';
import {publicChain} from './runtime';

vi.mock('../../../wallet/WalletProvider', () => ({useSession: () => session}));
vi.mock('./api', async importOriginal => ({...await importOriginal<typeof import('./api')>(),chainPost: vi.fn()}));
vi.mock('./runtime', () => ({loadChainConfig: vi.fn(async () => ({})), publicChain: vi.fn()}));
const session = {wallet: '0x0000000000000000000000000000000000000001', token: 'test-session'};
const balance = vi.fn();
beforeEach(() => {
  vi.mocked(chainPost).mockResolvedValue({status: 'confirmed'});
  vi.mocked(publicChain).mockReturnValue({getChainId: async () => 43113, getBalance: balance} as unknown as ReturnType<typeof publicChain>);
  balance.mockResolvedValue(50_000_000_000_000_000n);
});
afterEach(() => {cleanup(); vi.resetAllMocks();});
it('shows existing gas even when the sponsor service is unavailable', async () => {
  vi.mocked(chainPost).mockRejectedValue(new Error('unavailable'));
  render(<GasBalance/>);
  await waitFor(() => expect(screen.getByTestId('chain-gas').textContent).toBe('0.0500'));
  expect(screen.queryByRole('link', {name: 'Faucet'})).toBeNull();
});
it('explains low sponsor funds without hiding an existing usable balance', async () => {
  vi.mocked(chainPost).mockRejectedValue(new ChainApiError('sponsor_low'));balance.mockResolvedValue(0n);
  render(<GasBalance/>);
  await screen.findByText('Café gas is low. Ask the host to refill it.');
  balance.mockResolvedValue(50_000_000_000_000_000n);act(() => window.dispatchEvent(new Event('chain:changed')));
  await waitFor(() => expect(screen.getByTestId('chain-gas').textContent).toBe('0.0500'));
  expect(screen.queryByText('Café gas is low. Ask the host to refill it.')).toBeNull();expect(chainPost).toHaveBeenCalledTimes(1);
});
it('updates spent gas without requesting a second grant', async () => {
  render(<GasBalance/>);
  await waitFor(() => expect(screen.getByTestId('chain-gas').textContent).toBe('0.0500'));
  balance.mockResolvedValue(17_000_000_000_000_000n);
  act(() => window.dispatchEvent(new Event('chain:changed')));
  await waitFor(() => expect(screen.getByTestId('chain-gas').textContent).toBe('0.0170'));
  expect(chainPost).toHaveBeenCalledTimes(1);
});
it('offers the faucet when a previously confirmed grant has been spent', async () => {
  balance.mockResolvedValue(0n); render(<GasBalance/>);
  await waitFor(() => expect(screen.getByText('No gas. Open faucet.')).toBeTruthy());
  expect(screen.getByRole('link', {name: 'Faucet'})).toBeTruthy();
});
it('clears stale funds on an RPC failure', async () => {
  render(<GasBalance/>);
  await waitFor(() => expect(screen.getByTestId('chain-gas').textContent).toBe('0.0500'));
  balance.mockRejectedValue(new Error('RPC unavailable'));
  act(() => window.dispatchEvent(new Event('chain:changed')));
  await waitFor(() => expect(screen.getByText('Fuji connection unavailable. Retry.')).toBeTruthy());
  expect(screen.getByTestId('chain-gas').textContent).toBe('');
});
