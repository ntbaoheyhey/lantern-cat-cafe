import { expect, it } from 'vitest';
import { sampleServerStateV2 } from './a11y/fixtures';
import { ARENA_FIXTURES } from '../game/arena/arenaFixtures';
import type { GameSnapshotV2 } from '../game/v2/loopV2';
import { bossPresentation, INITIAL_BOSS_PRESENTATION, type BossPresentationAction } from './bossPresentation';

const snapshot: GameSnapshotV2 = { state: sampleServerStateV2(), busy: null, pending: null,
  loadFailed: false, paused: false, queued: 0, claimInFlight: false, lastError: null, lastEvent: null, eventSeq: 0 };
const begin: BossPresentationAction = { type: 'begin', snapshot, syncStatus: 'live', chapter: 1, maxHp: 100, firstClear: true };
const resolved: BossPresentationAction = { type: 'resolved', result: ARENA_FIXTURES[0]!.result, immediate: false };

it('holds the entire pre-request display snapshot and status while the store/result advances', () => {
  const pending = bossPresentation(INITIAL_BOSS_PRESENTATION, begin);
  const replaying = bossPresentation(pending, resolved);
  expect(pending.hold?.snapshot).toBe(snapshot);
  expect(replaying.hold?.snapshot).toBe(snapshot);
  expect(replaying.hold?.syncStatus).toBe('live');
  expect(replaying.fight?.result.state.progress.chapter).toBe(2);
  expect(replaying.hold?.snapshot.state?.progress.chapter).toBe(1);
  expect(replaying.fight?.complete).toBe(false);
  expect(bossPresentation(replaying, begin)).toBe(replaying);
  expect(bossPresentation(replaying, resolved)).toBe(replaying);
});

it('releases all display values and the confirmed banner atomically and exactly once', () => {
  const replaying = bossPresentation(bossPresentation(INITIAL_BOSS_PRESENTATION, begin), resolved);
  const released = bossPresentation(replaying, { type: 'release' });
  expect(released.hold).toBeNull();
  expect(released.fight?.complete).toBe(true);
  expect(released.fight?.result).toBe(ARENA_FIXTURES[0]!.result);
  expect(bossPresentation(released, { type: 'release' })).toBe(released);
});

it('reduced motion reveals the result immediately without a replay hold', () => {
  const result = bossPresentation(bossPresentation(INITIAL_BOSS_PRESENTATION, begin), { ...resolved, immediate: true });
  expect(result.hold).toBeNull(); expect(result.fight?.complete).toBe(true);
  expect(bossPresentation(result, { type: 'release' })).toBe(result);
});

it('hidden return or reduced-motion change during the request releases as soon as the result exists', () => {
  const pending = bossPresentation(INITIAL_BOSS_PRESENTATION, begin);
  const returned = bossPresentation(pending, { type: 'release' });
  expect(returned.hold?.snapshot).toBe(snapshot);
  expect(returned.fight).toBeNull();
  expect(bossPresentation(returned, { type: 'release' })).toBe(returned);
  const result = bossPresentation(returned, resolved);
  expect(result.hold).toBeNull(); expect(result.fight?.complete).toBe(true);
});

it('a refused/failed request restores live display without inventing an outcome', () => {
  const pending = bossPresentation(INITIAL_BOSS_PRESENTATION, begin);
  const cancelled = bossPresentation(pending, { type: 'close' });
  expect(cancelled).toBe(INITIAL_BOSS_PRESENTATION);
  expect(bossPresentation(cancelled, resolved)).toBe(cancelled);
});

it('records history only on release, once; close preserves it, reset clears it', () => {
  const replaying = bossPresentation(bossPresentation(INITIAL_BOSS_PRESENTATION, begin), resolved);
  expect(replaying.history).toEqual([]);
  const released = bossPresentation(replaying, { type: 'release' });
  expect(released.history).toEqual([{ chapter: 1, won: resolved.result.won, firstClear: true,
    durationMs: resolved.result.timeline.at(-1)!.t }]);
  expect(bossPresentation(released, { type: 'release' }).history).toHaveLength(1);
  const closed = bossPresentation(released, { type: 'close' });
  expect(closed.history).toBe(released.history);
  expect(bossPresentation(closed, { type: 'reset' })).toBe(INITIAL_BOSS_PRESENTATION);
  const failed = bossPresentation(bossPresentation(closed, begin), { type: 'close' });
  expect(failed.history).toBe(released.history);
});

it('records immediate outcomes and bounds session history to 30 newest results', () => {
  let state = INITIAL_BOSS_PRESENTATION;
  for (let i = 1; i <= 32; i++) {
    state = bossPresentation(state, { ...begin, chapter: i });
    state = bossPresentation(state, { ...resolved, immediate: true });
    state = bossPresentation(state, { type: 'close' });
  }
  expect(state.history).toHaveLength(30);
  expect(state.history[0]?.chapter).toBe(32);
  expect(state.history.at(-1)?.chapter).toBe(3);
});
