// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Tabs } from '../ui';
import { FujiProofPanel } from './FujiProofPanel';
import { PROOF_CONTRACTS } from './fujiProof';
const mocked = vi.hoisted(() => ({ client: null as unknown }));
vi.mock('wagmi', () => ({ usePublicClient: ({ chainId }: { chainId: number }) => { expect(chainId).toBe(43113); return mocked.client; } }));
let calls: { getChainId: ReturnType<typeof vi.fn>; getBlockNumber: ReturnType<typeof vi.fn>; getBlock: ReturnType<typeof vi.fn>; getCode: ReturnType<typeof vi.fn>; readContract: ReturnType<typeof vi.fn>; getLogs: ReturnType<typeof vi.fn> };
beforeEach(() => {
  calls = { getChainId: vi.fn().mockResolvedValue(43113), getBlockNumber: vi.fn().mockResolvedValue(1000n), getBlock: vi.fn().mockResolvedValue({ hash: `0x${'ab'.repeat(32)}` }), getCode: vi.fn().mockResolvedValue('0x6001'), readContract: vi.fn().mockImplementation(async ({ functionName }: { functionName: string }) => functionName === 'relicNFT' ? PROOF_CONTRACTS.RelicNFT : 1n), getLogs: vi.fn().mockResolvedValue([]) };
  mocked.client = calls;
});
afterEach(cleanup);
function setup(enabled = true) {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = (active: boolean) => <QueryClientProvider client={cache}><Tabs label="Help sections" tabs={[{ id: 'guide', label: 'Guide', content: <p>Guide content</p> }, { id: 'proof', label: 'On-chain proof', lazy: true, content: <FujiProofPanel enabled={active} /> }]} /></QueryClientProvider>;
  return { ...render(view(enabled)), view, cache };
}
it('mounts and reads only on the active proof tab, keeps Guide, and reuses the cached snapshot', async () => {
  const { cache } = setup();
  expect(screen.queryByRole('region', { name: 'Avalanche Fuji on-chain proof' })).toBeNull(); expect(calls.getChainId).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('tab', { name: 'On-chain proof' }));
  expect((await screen.findByTestId('proof-snapshot')).textContent).toContain('1000');
  expect(screen.getByTestId('proof-linkage').textContent).toContain('Matches');
  expect(screen.getByText('Not exposed by this NFT contract')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Refresh proof' }));
  await waitFor(() => expect(calls.getChainId).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole('tab', { name: 'Guide' }));
  expect(screen.queryByRole('region', { name: 'Avalanche Fuji on-chain proof' })).toBeNull();
  fireEvent.click(screen.getByRole('tab', { name: 'On-chain proof' }));
  await screen.findByTestId('proof-snapshot'); expect(calls.getChainId).toHaveBeenCalledTimes(1); cache.clear();
});
it('does not read when Help is hidden, even if proof was selected', async () => {
  const { rerender, view, cache } = setup(false); fireEvent.click(screen.getByRole('tab', { name: 'On-chain proof' }));
  expect(calls.getChainId).not.toHaveBeenCalled();
  expect((screen.getByRole('button', { name: 'Refresh proof' }) as HTMLButtonElement).disabled).toBe(true);
  rerender(view(true)); await screen.findByTestId('proof-snapshot'); expect(calls.getChainId).toHaveBeenCalledTimes(1); cache.clear();
});
it('exposes unavailable reads and code/linkage mismatches without claiming verified supply', async () => {
  calls.getCode.mockResolvedValue('0x'); calls.getLogs.mockRejectedValue(new Error('429'));
  calls.readContract.mockImplementation(async ({ functionName }: { functionName: string }) => { if (functionName === 'relicNFT') return '0x0000000000000000000000000000000000000001'; throw new Error('RPC token redacted'); });
  const { cache } = setup(); fireEvent.click(screen.getByRole('tab', { name: 'On-chain proof' })); await screen.findByTestId('proof-snapshot');
  expect(screen.getByTestId('proof-code-RelicNFT').textContent).toBe('No code at this block');
  expect(screen.getByTestId('proof-linkage').textContent).toContain('Mismatch'); expect(screen.getByText(/Recent events unavailable/)).toBeTruthy();
  expect(screen.queryByText(/RPC token/)).toBeNull(); cache.clear();
});
it('keeps the contract explorer links when the RPC chain is wrong', async () => {
  calls.getChainId.mockResolvedValue(1); const { cache } = setup();
  fireEvent.click(screen.getByRole('tab', { name: 'On-chain proof' }));
  await screen.findByRole('alert'); expect(screen.queryByTestId('proof-snapshot')).toBeNull();
  expect(screen.getAllByRole('link')).toHaveLength(2); expect(calls.getCode).not.toHaveBeenCalled(); cache.clear();
});
