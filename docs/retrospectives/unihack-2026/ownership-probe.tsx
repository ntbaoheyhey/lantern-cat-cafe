// Run against the contest tag in the isolated JSDOM harness described in GITHUB.md.
import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { JudgeRewardV9 } from './src/game/cardrpg/chain/JudgeRewardV9';

const mock = vi.hoisted(() => {
  const address = '0x46F4bf236Ed633762e8b045dcc7243e5Ea014A6B';
  return {
    address,
    wallet: {account: {address}},
    config: {rpcUrl: 'https://example.invalid', RelicNFT: '0x0000000000000000000000000000000000000001'},
    runtime: {guard: vi.fn(), funding: vi.fn(), write: vi.fn(), silenceSounds: vi.fn()},
    post: vi.fn()
  };
});
vi.mock('wagmi', () => ({useWalletClient: () => ({data: mock.wallet}), useAccount: () => ({})}));
vi.mock('./src/wallet/WalletProvider', () => ({useSession: () => ({wallet: mock.address, token: 'test-only'})}));
vi.mock('./src/game/cardrpg/chain/guest', () => ({existingGuestAddress: () => undefined, guestClient: () => undefined}));
vi.mock('./src/game/cardrpg/chain/flags', () => ({chainFlags: () => ({chainLoop: true})}));
vi.mock('./src/game/cardrpg/chain/runtime', () => ({
  loadChainConfig: async () => mock.config, chainRuntime: () => mock.runtime
}));
vi.mock('./src/game/cardrpg/chain/api', () => ({chainPost: mock.post}));
vi.mock('./src/game/cardrpg/chain/ReceiptToast', () => ({ReceiptToast: () => null}));
vi.mock('./src/game/cardrpg/chain/FujiCollection', () => ({FujiCollection: () => null}));

beforeEach(() => vi.stubEnv('VITE_SUPABASE_URL', 'https://example.invalid'));
it('shows a present ownership claim for a previously consumed voucher without reading balances', async () => {
  mock.post.mockResolvedValue({battle: {won: true}, vouchers: [{relicId: '3', used: true, player: mock.address}]});
  render(<JudgeRewardV9/>);
  const claim = screen.getByRole('button', {name: 'Mint my Relic on Fuji'}) as HTMLButtonElement;
  await waitFor(() => expect(claim.disabled).toBe(false));
  fireEvent.click(claim);
  await screen.findByText('Your reward is in your Fuji Collection.');
  expect(mock.post.mock.calls.map(args => args[0])).toEqual(['chain-judge']);
  expect(mock.runtime.write).not.toHaveBeenCalled();
  expect(mock.runtime.funding).not.toHaveBeenCalled();
});
