import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { RelicVoucher } from '@taskbar-hero/api-contract';
import type { ServerStateV2 } from '../../api/GameApiV2';
import type { UnreportedMint } from '../../forge/mintStore';
const fake = vi.hoisted(() => ({ connected: true, state: null as unknown as ServerStateV2, demo: true,
  start: vi.fn(async () => {}), stop: vi.fn(), retry: vi.fn(async () => {}), forge: vi.fn(),
  mint: vi.fn(), callback: null as ((mint: UnreportedMint, confirmed: boolean) => void) | null,
  report: vi.fn(async (_api: unknown, _loop: unknown, _mint: unknown): Promise<'ok' | 'retry' | 'gone'> => 'ok'),
}));
vi.mock('wagmi', async importOriginal => ({ ...await importOriginal<typeof import('wagmi')>(), useAccount: () => ({ isConnected: fake.connected, address: fake.connected ? '0x0000000000000000000000000000000000000001' : undefined }) }));
vi.mock('../../wallet/WalletButton', () => ({ WalletButton: () => <button>Wallet</button> }));
vi.mock('./StageCanvas', () => ({ StageCanvas: () => <div /> }));
vi.mock('../../forge/MintPanel', () => ({ MintPanel: (props: { voucher: RelicVoucher; onMinted: (mint: UnreportedMint, confirmed: boolean) => void }) => {
  fake.mint(props.voucher); fake.callback = props.onMinted;
  return <p data-testid="mint-flow">Voucher {props.voucher.nonce}</p>;
} }));
vi.mock('../../forge/report', () => ({ reportMint: fake.report }));
let cached: { state: unknown; lastEvent: null; busy: null; loadFailed: boolean; paused: boolean; eventSeq: number } | undefined;
const loop = { setEquipQueued: vi.fn(), whenIdle: vi.fn(async () => {}), start: fake.start, stop: fake.stop, retry: fake.retry, forgeRelic: fake.forge, onEvent: () => () => {}, subscribe: () => () => {},
  // useSyncExternalStore (SyncStatus) needs a stable snapshot per state, not a fresh object per call.
  getSnapshot: () => {
    if (cached?.state !== fake.state) cached = { state: fake.state, lastEvent: null, busy: null, loadFailed: false, paused: false, eventSeq: 0 };
    return cached;
  } };
vi.mock('../v2/storeV2', async importOriginal => ({ ...await importOriginal<typeof import('../v2/storeV2')>(),
  getGameLoopV2: () => loop, useGameSnapshotV2: () => loop.getSnapshot(), useGameModeV2: () => ({ demo: fake.demo, notice: null }) }));
import { StageLayout } from '../../layout/StageLayout';
import { resetHelpForTests } from '../../onboarding/helpStore';
import { sampleServerStateV2 } from '../../layout/a11y/fixtures';
import { clearUnreported, saveUnreported } from '../../forge/mintStore';
const voucher: RelicVoucher = { claimId: '00000000-0000-4000-8000-000000000042', player: '0x0000000000000000000000000000000000000001', relicId: '7', rarity: 1, rarityName: 'rare', nonce: '42', expiry: 2000000000, signature: '0x00' };
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear(); localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  act(() => resetHelpForTests());
  fake.connected = true; fake.demo = true; fake.state = sampleServerStateV2(); fake.state.forge.blockedBy = null;
  fake.forge.mockResolvedValue({ voucher, state: fake.state }); fake.report.mockImplementation(async () => { clearUnreported(); return 'ok'; });
});
afterEach(cleanup);
function forgePanel() {
  render(<StageLayout />);
  fireEvent.click(screen.getByRole('tab', { name: 'Forge' }));
  fireEvent.click(screen.getByTestId('tab-relic'));
}
async function forge() {
  await act(async () => { fireEvent.click(screen.getByTestId('relic-forge-btn')); });
  await act(async () => { fireEvent.click(screen.getByTestId('relic-confirm-btn')); });
}
it('hands the result to the existing MintPanel with the unchanged voucher', async () => {
  forgePanel(); await forge();
  expect(fake.forge).toHaveBeenCalledOnce(); expect(fake.mint).toHaveBeenCalledWith(voucher);
  expect(screen.getByTestId('mint-flow').textContent).toContain('42');
});
it('keeps unsigned recovery visible in the Relic footer without mounting MintPanel after the UI merge', () => {
  fake.state.forge.pending = { ...voucher, signature: null, recoverable: true };
  fake.state.forge.blockedBy = 'daily_limit';
  forgePanel();
  expect(screen.getByText('Your Relic is waiting. Try again in a moment.')).toBeTruthy();
  expect(screen.queryByText(/daily limit reached|already forged/i)).toBeNull();
  expect(screen.queryByTestId('mint-flow')).toBeNull();
  expect(fake.mint).not.toHaveBeenCalled();
  expect(screen.getAllByText(/Daily Relic limit \(1 per day\)/)).toHaveLength(1);
  fireEvent.click(screen.getByTestId('tab-craft'));
  expect(screen.queryByText('Your Relic is waiting. Try again in a moment.')).toBeNull();
  expect(screen.queryByText(/Daily Relic limit \(1 per day\)/)).toBeNull();
});
it('shows connect-wallet once and does not forge or mint without a wallet', async () => {
  fake.connected = false; forgePanel(); await forge();
  expect(fake.forge).not.toHaveBeenCalled(); expect(fake.mint).not.toHaveBeenCalled();
  expect(screen.getAllByText('Connect your wallet before forging a Relic.')).toHaveLength(1);
});
for (const [reason, text] of [['not_enough_yarn', /Not enough Yarn/], ['no_moon_pearl', /No Moon Pearl/], ['daily_limit', /already forged|daily limit/i]] as const) it(`renders ${reason} without a mint call`, () => {
  fake.state.forge.blockedBy = reason; forgePanel();
  expect(screen.getByTestId('relic-blocked-reason').textContent).toMatch(text);
  expect(screen.getByTestId('relic-forge-btn')).toHaveProperty('disabled', true);
  expect(fake.mint).not.toHaveBeenCalled();
});
it('surfaces a wallet handoff error once', async () => {
  // The store handoff is synchronous UI setup; errors are returned as one status message.
  fake.forge.mockRejectedValueOnce(new Error('Wallet handoff failed'));
  forgePanel(); await forge();
  expect(screen.getAllByText('Wallet handoff failed')).toHaveLength(1); expect(fake.mint).not.toHaveBeenCalled();
});
it('does not remount a consumed voucher while the v2 refresh is in flight', async () => {
  forgePanel(); await forge(); fake.state.forge.pending = voucher;
  const mint = { nonce: voucher.nonce, hash: ('0x' + '1'.repeat(64)) as `0x${string}` };
  await act(async () => { fake.callback!(mint, true); });
  expect(screen.queryByTestId('mint-flow')).toBeNull(); expect(fake.retry).toHaveBeenCalled();
});
it('reuses confirmation reporting after a confirmed chain mint, without another mint call', async () => {
  fake.demo = false; forgePanel(); await forge();
  const mint = { nonce: voucher.nonce, hash: ('0x' + '1'.repeat(64)) as `0x${string}` };
  saveUnreported(mint);
  await act(async () => { fake.callback!(mint, false); });
  expect(screen.queryByTestId('mint-flow')).toBeNull(); const previous = fake.mint.mock.calls.length;
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Retry saving mint confirmation' })); });
  expect(fake.report).toHaveBeenCalledWith(expect.anything(), expect.anything(), mint);
  expect(fake.mint).toHaveBeenCalledTimes(previous); expect(screen.queryByRole('button', { name: 'Retry saving mint confirmation' })).toBeNull();
});
