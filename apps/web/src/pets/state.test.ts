import { afterEach, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import * as petsRules from '@taskbar-hero/game-rules/src/v2/meta/pets';
import { MockGameApiV2 } from '../api/MockGameApiV2';
import { GameLoopV2 } from '../game/v2/loopV2';
import { emptyGainsV2, sampleGainsV2, sampleServerStateV2 } from '../layout/a11y/fixtures';
import { bindPetsToLoop, getPetsStore, parsePetsState, PETS_LEGACY_STORAGE_KEY, PETS_STORAGE_KEY, PetsStore, usePetsState } from './state';

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

it('does not credit a same-round refresh when a later claim reuses its snapshot', async () => {
  const api = new MockGameApiV2({ storage: null });
  const loaded = sampleServerStateV2({ kills: 0 });
  const refreshed = sampleServerStateV2({ kills: 4 });
  const getState = vi.spyOn(api, 'getState').mockResolvedValue(loaded);
  const claim = vi.spyOn(api, 'claim').mockResolvedValue({ gains: sampleGainsV2(), state: refreshed });
  const loop = new GameLoopV2({ api });
  const store = new PetsStore(null), dispose = bindPetsToLoop(loop, store);
  try {
    await loop.start(document);
    getState.mockResolvedValue(refreshed);
    await loop.retry();
    await loop.claimNow();
    expect(store.getSnapshot().killCounts).toEqual({});
    claim.mockResolvedValue({ gains: sampleGainsV2(), state: sampleServerStateV2({ kills: 6 }) });
    await loop.claimNow();
    expect(store.getSnapshot().killCounts).toEqual(kills(2));
  } finally { dispose(); loop.stop(); }
});

it('does not backfill a refresh that overtakes an in-flight claim', async () => {
  const api = new MockGameApiV2({ storage: null });
  const loaded = sampleServerStateV2({ kills: 0 });
  const refreshed = sampleServerStateV2({ kills: 4 });
  const getState = vi.spyOn(api, 'getState').mockResolvedValue(loaded);
  let finish!: (result: Awaited<ReturnType<typeof api.claim>>) => void;
  const claim = vi.spyOn(api, 'claim').mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const loop = new GameLoopV2({ api });
  const store = new PetsStore(null), dispose = bindPetsToLoop(loop, store);
  try {
    await loop.start(document);
    const flight = loop.claimNow();
    await vi.waitFor(() => expect(claim).toHaveBeenCalledOnce());
    getState.mockResolvedValue(refreshed);
    await loop.retry();
    finish({ gains: sampleGainsV2(), state: refreshed });
    await flight;
    expect(store.getSnapshot().killCounts).toEqual({});
  } finally { dispose(); loop.stop(); }
});

it('retired cleanup cannot remove the guard for a replacement binding', () => {
  const loop = new GameLoopV2({ api: new MockGameApiV2({ storage: null }) });
  const store = new PetsStore(null), retired = bindPetsToLoop(loop, store);
  retired();
  const current = bindPetsToLoop(loop, store);
  retired();
  const repeated = bindPetsToLoop(loop, store);
  try { expect(repeated).toBe(current); } finally { current(); repeated(); }
});

it('exposes a stable singleton and a reactive immutable hook that unsubscribes', () => {
  expect(getPetsStore()).toBe(getPetsStore());
  const store = new PetsStore(null);
  const off = vi.fn(), subscribe = store.subscribe;
  vi.spyOn(store, 'subscribe').mockImplementation(listener => {
    const unsubscribe = subscribe(listener);
    return () => { off(); unsubscribe(); };
  });
  const { result, unmount } = renderHook(() => usePetsState(store));
  const initial = result.current;
  expect(initial).toBe(store.getSnapshot());
  expect(Object.isFrozen(initial)).toBe(true);
  expect(Object.isFrozen(initial.equipped)).toBe(true);
  act(() => { store.equip(first); }); // Locked: no publication.
  expect(result.current).toBe(initial);
  act(() => { store.recordClaimedKills(petsRules.PET_DEFS[0]!.unlock.count); });
  expect(result.current.killCounts).toEqual(kills(petsRules.PET_DEFS[0]!.unlock.count));
  act(() => { store.equip(first); });
  expect(result.current.equipped).toEqual([first]);
  expect(initial.killCounts).toEqual({});
  unmount();
  expect(off).toHaveBeenCalledOnce();
});

it('keeps valid current data over legacy and discards unsupported kill targets', () => {
  const storage = memory();
  storage.setItem(PETS_LEGACY_STORAGE_KEY, JSON.stringify({ version: 0, kills: 99, equipped: [first] }));
  storage.setItem(PETS_STORAGE_KEY, JSON.stringify({ version: 1, killCounts: { ...kills(7), boss: 999 }, equipped: [] }));
  expect(new PetsStore(storage).getSnapshot()).toEqual({ version: 1, killCounts: kills(7), equipped: [] });
  expect(JSON.parse(storage.getItem(PETS_STORAGE_KEY)!)).toEqual({ version: 1, killCounts: kills(7), equipped: [] });
  expect(parsePetsState(JSON.stringify({ version: 1, killCounts: kills(Number.MAX_SAFE_INTEGER + 1), equipped: [] })).killCounts).toEqual({});
});

it('keeps the store selection unchanged on locked, unknown, duplicate and overflow requests', () => {
  const store = new PetsStore(null), [a, b, c] = petsRules.PET_DEFS.map(pet => pet.id);
  const initial = store.getSnapshot();
  expect(store.equip(a!)).toEqual({ ok: false, reason: 'locked' });
  expect(store.equip('pet.unknown')).toEqual({ ok: false, reason: 'unknown' });
  store.unequip(a!);
  expect(store.getSnapshot()).toBe(initial);
  store.recordClaimedKills(petsRules.PET_DEFS[2]!.unlock.count);
  expect(store.equip(a!)).toEqual({ ok: true, equipped: [a] });
  expect(store.equip(b!)).toEqual({ ok: true, equipped: [a, b] });
  const equipped = store.getSnapshot();
  expect(store.equip(a!)).toEqual({ ok: false, reason: 'duplicate' });
  expect(store.equip(c!)).toEqual({ ok: false, reason: 'limit' });
  expect(store.getSnapshot()).toBe(equipped);
  store.unequip(a!);
  expect(store.equip(c!)).toEqual({ ok: true, equipped: [b, c] });
});

it('deduplicates concurrent claims and equal cloned snapshots across round rollover', async () => {
  const api = new MockGameApiV2({ storage: null });
  const loaded = sampleServerStateV2({ round: 2, kills: 5 });
  const advanced = sampleServerStateV2({ round: 4, kills: 2 });
  vi.spyOn(api, 'getState').mockResolvedValue(loaded);
  const claim = vi.spyOn(api, 'claim').mockImplementation(async () => ({ gains: sampleGainsV2(), state: structuredClone(advanced) }));
  const loop = new GameLoopV2({ api }), store = new PetsStore(null), dispose = bindPetsToLoop(loop, store);
  try {
    await loop.start(document);
    await Promise.all([loop.claimNow(), loop.claimNow(), loop.claimNow()]);
    expect(claim).toHaveBeenCalledOnce();
    expect(store.getSnapshot().killCounts).toEqual(kills(9)); // (4 - 2) * 6 + 2 - 5
    await loop.claimNow();
    expect(claim).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot().killCounts).toEqual(kills(9));
  } finally { dispose(); loop.stop(); }
});

it('credits only the post-refresh delta when a refresh overtakes a claim with fresh cloned state', async () => {
  const api = new MockGameApiV2({ storage: null });
  const getState = vi.spyOn(api, 'getState').mockResolvedValue(sampleServerStateV2({ kills: 0 }));
  let finish!: (result: Awaited<ReturnType<typeof api.claim>>) => void;
  const claim = vi.spyOn(api, 'claim').mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const loop = new GameLoopV2({ api }), store = new PetsStore(null), dispose = bindPetsToLoop(loop, store);
  try {
    await loop.start(document);
    const flight = loop.claimNow();
    await vi.waitFor(() => expect(claim).toHaveBeenCalledOnce());
    getState.mockResolvedValue(sampleServerStateV2({ kills: 4 }));
    await loop.retry();
    expect(store.getSnapshot().killCounts).toEqual({});
    getState.mockImplementation(async () => sampleServerStateV2({ kills: 6 }));
    finish({ gains: sampleGainsV2(), state: sampleServerStateV2({ kills: 4 }) });
    await flight;
    expect(store.getSnapshot().killCounts).toEqual(kills(2));
    claim.mockResolvedValue({ gains: sampleGainsV2(), state: sampleServerStateV2({ kills: 6 }) });
    await loop.claimNow();
    expect(store.getSnapshot().killCounts).toEqual(kills(2));
  } finally { dispose(); loop.stop(); }
});

it('ignores progress without a claimed event and rejects an older claim response', async () => {
  const api = new MockGameApiV2({ storage: null });
  vi.spyOn(api, 'getState').mockResolvedValue(sampleServerStateV2({ kills: 0 }));
  const claim = vi.spyOn(api, 'claim').mockResolvedValue({ gains: emptyGainsV2(), state: sampleServerStateV2({ kills: 4 }) });
  const loop = new GameLoopV2({ api }), store = new PetsStore(null), dispose = bindPetsToLoop(loop, store);
  try {
    await loop.start(document);
    await loop.claimNow();
    expect(store.getSnapshot().killCounts).toEqual({});
    claim.mockResolvedValue({ gains: sampleGainsV2(), state: { ...sampleServerStateV2({ kills: 6 }), serverTime: 999 } });
    await loop.claimNow();
    expect(store.getSnapshot().killCounts).toEqual({});
    claim.mockResolvedValue({ gains: sampleGainsV2(), state: sampleServerStateV2({ kills: 6 }) });
    await loop.claimNow();
    expect(store.getSnapshot().killCounts).toEqual(kills(2));
  } finally { dispose(); loop.stop(); }
});
