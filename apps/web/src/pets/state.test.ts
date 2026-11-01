import { afterEach, expect, it, vi } from 'vitest';
import * as petsRules from '@taskbar-hero/game-rules/src/v2/meta/pets';
import { MockGameApiV2 } from '../api/MockGameApiV2';
import { GameLoopV2 } from '../game/v2/loopV2';
import { sampleGainsV2, sampleServerStateV2 } from '../layout/a11y/fixtures';
import { bindPetsToLoop, parsePetsState, PETS_LEGACY_STORAGE_KEY, PETS_STORAGE_KEY, PetsStore } from './state';

// DEMO_PREVIEW: fixture kill counts and selections are unsigned preview data.
// Storage versions and test call counts describe the format/test, not balance.
const memory = () => {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
};
const kills = (n: number) => ({ [petsRules.PET_KILL_TARGET]: n });
const first = petsRules.PET_DEFS[0]!.id;

afterEach(() => vi.restoreAllMocks());

it('falls back to empty on corrupt, malformed and future storage', () => {
  for (const raw of [null, '{', 'null', '[]', '{}', JSON.stringify({ version: 9, equipped: [], killCounts: kills(7) }),
    ...[-1, 0.1, '7', null].map(n => JSON.stringify({ version: 1, killCounts: { [petsRules.PET_KILL_TARGET]: n }, equipped: [] })),
    JSON.stringify({ version: 1, killCounts: kills(7), equipped: [null] })]) {
    expect(parsePetsState(raw)).toEqual({ version: 1, killCounts: {}, equipped: [] });
  }
});

it('migrates version zero to the versioned key, retaining valid selection', () => {
  const storage = memory();
  storage.setItem(PETS_LEGACY_STORAGE_KEY, JSON.stringify({ version: 0, kills: 29, equipped: [first] }));
  const store = new PetsStore(storage);
  expect(store.getSnapshot()).toEqual({ version: 1, killCounts: kills(29), equipped: [first] });
  expect(JSON.parse(storage.getItem(PETS_STORAGE_KEY)!)).toEqual(store.getSnapshot());
  expect(new PetsStore(storage).getSnapshot()).toEqual(store.getSnapshot());
});

it('also migrates version zero payload in the current key; corrupt current data wins over legacy', () => {
  const storage = memory();
  storage.setItem(PETS_STORAGE_KEY, JSON.stringify({ version: 0, kills: 29, equipped: [] }));
  expect(new PetsStore(storage).getSnapshot().killCounts).toEqual(kills(29));
  storage.setItem(PETS_LEGACY_STORAGE_KEY, JSON.stringify({ version: 0, kills: 29, equipped: [] }));
  storage.setItem(PETS_STORAGE_KEY, '{');
  expect(new PetsStore(storage).getSnapshot().killCounts).toEqual({});
});

it('sanitizes stored selections, discarding duplicates, locked, unknown and overflow pets', () => {
  const ids = petsRules.PET_DEFS.map(p => p.id);
  const raw = JSON.stringify({ version: 1, killCounts: kills(29), equipped: ['unknown', ids[3], ids[0], ids[0], ids[1], ids[2]] });
  expect(parsePetsState(raw).equipped).toEqual(ids.slice(0, 2));
});

it('persists local kills and selection, publishes changes and supports unsubscribe', () => {
  const storage = memory(), store = new PetsStore(storage), listener = vi.fn();
  const off = store.subscribe(listener);
  store.recordClaimedKills(29);
  expect(store.equip(first).ok).toBe(true);
  const snapshot = store.getSnapshot();
  expect(store.equip(first)).toEqual({ ok: false, reason: 'duplicate' });
  expect(store.getSnapshot()).toBe(snapshot);
  expect(listener).toHaveBeenCalledTimes(2);
  expect(new PetsStore(storage).getSnapshot()).toEqual(snapshot);
  expect(Object.isFrozen(snapshot.killCounts)).toBe(true);
  off(); store.unequip(first);
  expect(listener).toHaveBeenCalledTimes(2);
  expect(store.getSnapshot().equipped).toEqual([]);
  expect(new PetsStore(storage).getSnapshot().equipped).toEqual([]);
});

it('handles unavailable storage and rejects invalid deltas without breaking play', () => {
  const store = new PetsStore({ getItem() { throw Error('denied'); }, setItem() { throw Error('quota'); } });
  const initial = store.getSnapshot();
  for (const n of [-1, 0, NaN, Infinity, 0.1]) store.recordClaimedKills(n);
  expect(store.getSnapshot()).toBe(initial);
  store.recordClaimedKills(Number.MAX_SAFE_INTEGER);
  store.recordClaimedKills(1);
  expect(store.getSnapshot().killCounts).toEqual(kills(Number.MAX_SAFE_INTEGER));
  expect(store.equip(first).ok).toBe(true);
});

it('observes acknowledged claims once across rounds; ignores loads, errors, resets and disposal', async () => {
  const api = new MockGameApiV2({ storage: null });
  const loaded = sampleServerStateV2({ round: 1, kills: 0 });
  const advanced = sampleServerStateV2({ round: 3, kills: 1 });
  const getState = vi.spyOn(api, 'getState').mockResolvedValue(loaded);
  const claim = vi.spyOn(api, 'claim').mockResolvedValue({ gains: sampleGainsV2(), state: advanced });
  const loop = new GameLoopV2({ api });
  const store = new PetsStore(null), dispose = bindPetsToLoop(loop, store);
  expect(bindPetsToLoop(loop, store)).toBe(dispose);
  try {
    await loop.start(document);
    expect(store.getSnapshot().killCounts).toEqual({});
    await loop.claimNow();
    const expected = (advanced.progress.round - loaded.progress.round) * advanced.progress.killsPerRound + 1;
    expect(store.getSnapshot().killCounts).toEqual(kills(expected));
    await loop.claimNow(); // same snapshot, no replay
    expect(store.getSnapshot().killCounts).toEqual(kills(expected));
    claim.mockRejectedValueOnce(new Error('offline'));
    await loop.claimNow();
    expect(store.getSnapshot().killCounts).toEqual(kills(expected));
    getState.mockResolvedValue(sampleServerStateV2({ round: 5, kills: 2 }));
    await loop.retry(); // larger load does not backfill
    claim.mockResolvedValue({ gains: sampleGainsV2(), state: sampleServerStateV2({ chapter: 2, round: 1, kills: 0 }) });
    await loop.claimNow(); // chapter boundary deliberately not inferred
    loop.switchApi(api);
    await loop.retry();
    expect(store.getSnapshot().killCounts).toEqual(kills(expected));
    dispose();
    claim.mockResolvedValue({ gains: sampleGainsV2(), state: sampleServerStateV2({ round: 6, kills: 2 }) });
    await loop.claimNow();
    expect(store.getSnapshot().killCounts).toEqual(kills(expected));
  } finally { dispose(); loop.stop(); }
});
