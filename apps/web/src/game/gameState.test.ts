// @vitest-environment jsdom
import { computeIdleGains, newPlayer } from '@taskbar-hero/game-rules';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MockGameApi } from '../api/MockGameApi';
import { GameLoop, reconcile, type Prediction } from './gameState';

const gear = newPlayer().gear;
const extra = {
  inventory: [],
  bossKeys: 0,
  boss: { level: 1, attemptsToday: 0, attemptsLeft: 5, keyEarnedToday: false },
};

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  vi.useFakeTimers();
  setVisibility('visible');
});
afterEach(() => vi.useRealTimers());

it('reconcile replaces predicted values with server values and resets the baseline', () => {
  const predicted: Prediction = {
    baseGold: 100, baseShards: 1, gear, power: 30, goldPerSecond: 4, elapsed: 12,
  };
  const next = reconcile(predicted, {
    gold: 7, shards: 9, gear, bossLevel: 1, power: 31, goldPerSecond: 4.1, serverTime: 5, ...extra,
  });
  expect(next).toEqual({
    baseGold: 7, baseShards: 9, gear, power: 31, goldPerSecond: 4.1, elapsed: 0,
  });
});

it('shows the gold computeIdleGains gives after 60 simulated seconds', async () => {
  const api = new MockGameApi({ seed: 7, now: Date.now });
  const loop = new GameLoop({ api, now: Date.now });
  await loop.start();
  await vi.advanceTimersByTimeAsync(29_000);
  const expected = (s: number) => computeIdleGains({ gear, bossLevel: 1 }, s, 7).gold;
  expect(loop.getSnapshot().gold).toBe(expected(29));
  await vi.advanceTimersByTimeAsync(31_000); // claims at 30 s and 60 s
  expect(loop.getSnapshot().gold).toBe(expected(60));
  expect(expected(60)).toBeGreaterThan(0);
  loop.stop();
});

it('server number wins on claim', async () => {
  const api = new MockGameApi({ now: Date.now });
  const loop = new GameLoop({ api, now: Date.now });
  await loop.start();
  await vi.advanceTimersByTimeAsync(10_000);
  const spy = vi.spyOn(api, 'claim').mockResolvedValue({
    gold: 5, shards: 2, gear, bossLevel: 1, power: 30, goldPerSecond: 4, serverTime: 0, drops: [], ...extra,
  });
  await loop.claim();
  expect(spy).toHaveBeenCalled();
  expect(loop.getSnapshot()).toMatchObject({ gold: 5, shards: 2 });
  loop.stop();
});

it('stops predicting while the tab is hidden and claims on return', async () => {
  const api = new MockGameApi({ now: Date.now });
  const claim = vi.spyOn(api, 'claim');
  const loop = new GameLoop({ api, now: Date.now });
  await loop.start();
  await vi.advanceTimersByTimeAsync(10_000);
  setVisibility('hidden');
  const frozen = loop.getSnapshot();
  expect(frozen.paused).toBe(true);
  claim.mockClear();
  await vi.advanceTimersByTimeAsync(120_000);
  expect(loop.getSnapshot().gold).toBe(frozen.gold);
  expect(claim).not.toHaveBeenCalled();

  setVisibility('visible');
  await vi.advanceTimersByTimeAsync(0);
  expect(claim).toHaveBeenCalledTimes(1);
  expect(loop.getSnapshot().paused).toBe(false);
  expect(loop.getSnapshot().gold).toBeGreaterThan(frozen.gold); // server counted the time away
  loop.stop();
});
