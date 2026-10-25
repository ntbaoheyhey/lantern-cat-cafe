import { expect, it, vi } from 'vitest';
import type { RelicVoucher } from '@taskbar-hero/api-contract';
import type { GameSnapshotV2 } from '../v2/loopV2';
import { forgeRelicForWalletV2 } from '../v2/storeV2';
import { sampleServerStateV2 } from '../../layout/a11y/fixtures';
export const voucher: RelicVoucher = { player: '0x0000000000000000000000000000000000000001', relicId: '7', rarity: 1, rarityName: 'rare', nonce: '42', expiry: 2000000000, signature: '0x00' };
function setup(reason: 'not_enough_yarn' | 'no_moon_pearl' | 'daily_limit' | null = null) {
  const state = sampleServerStateV2(); state.forge.blockedBy = reason;
  const snapshot: GameSnapshotV2 = { state, paused: false, loadFailed: false, busy: null, eventSeq: 0, lastEvent: null };
  const loop = { getSnapshot: () => snapshot, forgeRelic: vi.fn(async () => ({ voucher, state })), retry: vi.fn(async () => {}) };
  const mint = vi.fn(async (_v: RelicVoucher) => {});
  return { loop, mint, snapshot };
}
it('passes the unchanged voucher to the existing mint handoff once, including duplicate clicks', async () => {
  const { loop, mint } = setup();
  expect(await Promise.all([forgeRelicForWalletV2(loop, { connected: true, mint }), forgeRelicForWalletV2(loop, { connected: true, mint })])).toEqual([null, null]);
  expect(loop.forgeRelic).toHaveBeenCalledOnce(); expect(mint).toHaveBeenCalledExactlyOnceWith(voucher);
});
for (const reason of ['not_enough_yarn', 'no_moon_pearl', 'daily_limit'] as const) it(`does not mint when ${reason}`, async () => {
  const { loop, mint } = setup(reason);
  expect(await forgeRelicForWalletV2(loop, { connected: true, mint })).toBeTruthy();
  expect(mint).not.toHaveBeenCalled(); expect(loop.forgeRelic).not.toHaveBeenCalled();
});
it('requires a wallet without spending or invoking the mint flow', async () => {
  const { loop, mint } = setup();
  expect(await forgeRelicForWalletV2(loop, { connected: false, mint })).toContain('Connect your wallet');
  expect(loop.forgeRelic).not.toHaveBeenCalled(); expect(mint).not.toHaveBeenCalled();
});
it('returns one mint-flow error and allows a later retry', async () => {
  const { loop, mint } = setup(); mint.mockRejectedValueOnce(new Error('Wallet handoff failed'));
  expect(await forgeRelicForWalletV2(loop, { connected: true, mint })).toBe('Wallet handoff failed');
  expect(mint).toHaveBeenCalledOnce();
  expect(await forgeRelicForWalletV2(loop, { connected: true, mint })).toBeNull();
});
it('reloads the reason after a server refusal race, then never invokes mint', async () => {
  const { loop, mint, snapshot } = setup();
  loop.forgeRelic.mockImplementationOnce(async () => null as never);
  loop.retry.mockImplementationOnce(async () => { snapshot.state!.forge.blockedBy = 'daily_limit'; });
  expect(await forgeRelicForWalletV2(loop, { connected: true, mint })).toContain('shared');
  expect(mint).not.toHaveBeenCalled(); expect(loop.retry).toHaveBeenCalledOnce();
});
