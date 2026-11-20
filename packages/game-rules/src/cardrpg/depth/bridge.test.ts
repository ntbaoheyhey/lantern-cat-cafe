import { expect, it } from 'vitest';
import { createDepthAccount, battleCats } from './state';
import { acceptIdleResult, acceptRelicSnapshot, claimIdleService, designEligibility, IDLE_RECEIPT_FIXTURE, idlePreview, RELIC_FIXTURE, reserveDesignPreview, selectRelic } from './bridge';

it('shares the idle cap, rejects replay and never grants beyond two services', () => {
  const state = createDepthAccount(1, 0);
  expect(idlePreview(state, 1000 * 3600 * 100).elapsed).toBe(8 * 3600);
  const first = claimIdleService(state, 1000 * 3600 * 100);
  expect(first.ok).toBe(true);
  expect(first.state.account.daily.service).toBe(2);
  expect(claimIdleService(first.state, 1000 * 3600 * 101).ok).toBe(false);
  expect(claimIdleService(state, -1).ok).toBe(false);
});
it('deduplicates idle receipts and shares the run material cap', () => {
  let state = createDepthAccount();
  state = acceptIdleResult(state, IDLE_RECEIPT_FIXTURE).state;
  expect(state.materials).toBe(5);
  expect(acceptIdleResult(state, IDLE_RECEIPT_FIXTURE).ok).toBe(false);
  for (let i = 0; i < 20; i++) state = acceptIdleResult(state, { ...IDLE_RECEIPT_FIXTURE, id: `result-${i}` }).state;
  expect(state.materials).toBe(30);
  expect(acceptIdleResult(state, { ...IDLE_RECEIPT_FIXTURE, day: 2 }).ok).toBe(false);
});
it('validates Fuji attributes, caps quantity power and clears lost holdings', () => {
  const initial = createDepthAccount();
  expect(acceptRelicSnapshot(initial, 1, RELIC_FIXTURE).ok).toBe(false);
  expect(acceptRelicSnapshot(initial, 43113, [{ id: 1, rarity: 3, balance: '1' }]).ok).toBe(false);
  const state = selectRelic(acceptRelicSnapshot(initial, 43113, RELIC_FIXTURE).state, 4).state;
  expect(battleCats(state)[0]!.bonuses.openingCharge).toBe(8);
  expect(battleCats(state)[1]!.bonuses.openingCharge ?? 0).toBe(0);
  expect(acceptRelicSnapshot(state, 43113, []).state.selectedRelic).toBeNull();
  expect(selectRelic(initial, 4).ok).toBe(false);
});
it('reserves effort designs atomically against global and seasonal caps', () => {
  const state = createDepthAccount();
  state.seals = 10;
  state.cleared = [1, 2, 3];
  state.towerBest = 5;
  expect(designEligibility(state, 'golden-maneki').eligible).toBe(true);
  const claimed = reserveDesignPreview(state, 'golden-maneki');
  expect(claimed.ok).toBe(true);
  expect(claimed.state.seals).toBe(0);
  expect(reserveDesignPreview(claimed.state, 'golden-maneki').ok).toBe(false);
  state.account.scarcity['golden-maneki']!.seasonIssuedDesign = state.account.scarcity['golden-maneki']!.seasonCap;
  expect(reserveDesignPreview(state, 'golden-maneki').ok).toBe(false);
});

it('refreshes actual calendar allowances once and never grants skipped-day rewards', async () => {
  const { syncCalendarDay } = await import('./bridge');
  const state = createDepthAccount(1, 0);
  state.account.daily.service = 2;
  const first = syncCalendarDay(state, 86400000 * 8);
  expect(first.state.account.day).toBe(9);
  expect(first.state.account.daily.service).toBe(0);
  expect(first.state.account.currencies).toEqual(state.account.currencies);
  expect(syncCalendarDay(first.state, 86400000 * 8).state.account.day).toBe(9);
});
