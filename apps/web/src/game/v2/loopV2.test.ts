import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { GameApiV2, GainsV2, ItemV2, ServerStateV2 } from '../../api/GameApiV2';
import { diffProgressEventsV2, type LoopEventV2 } from './events';
import { CLAIM_INTERVAL_MS_V2, GameLoopV2 } from './loopV2';

function state(): ServerStateV2 {
  return {
    cat: { classId: 'warrior', level: 3, xp: 0, xpToNext: 100 },
    progress: { chapter: 1, round: 2, kills: 0, killsPerRound: 10, gated: false, neededPower: 0 },
    currencies: { fish: 0, yarn: 0, keys: 1 }, materials: {}, inventory: [], bagLimit: 100,
    equipped: { weapon: null, helmet: null, armor: null, gloves: null, boots: null, collar: null, earring: null, ring: null, charm: null },
    unlockedSlots: ['weapon'], bosses: { chapters: [], cooldownUntil: null },
    forge: { blockedBy: null, forgedToday: false, pending: null, today: null }, founder: false, serverTime: 0,
  };
}

class FakeDocument {
  visibilityState = 'visible';
  private listeners = new Set<() => void>();
  addEventListener(_name: string, fn: () => void) { this.listeners.add(fn); }
  removeEventListener(_name: string, fn: () => void) { this.listeners.delete(fn); }
  setVisibility(value: string) {
    this.visibilityState = value;
    this.listeners.forEach((fn) => fn());
  }
  asDocument(): Document { return this as unknown as Document; }
}

const zero = (): GainsV2 => ({ xp: 0, levelsGained: 0, fish: 0, yarn: 0, keys: 0, materials: {}, items: [], autoSalvaged: [] });
const item: ItemV2 = { id: 'i1', itemKey: 'wpn.sword.starter', slot: 'weapon', rarity: 'common', level: 1, bonus: [], locked: false, equipped: false };

class FakeApiV2 implements GameApiV2 {
  getState = vi.fn<GameApiV2['getState']>().mockResolvedValue(state());
  claim = vi.fn<GameApiV2['claim']>().mockResolvedValue({ gains: zero(), state: state() });
  chooseClass = vi.fn<GameApiV2['chooseClass']>().mockResolvedValue(state());
  equip = vi.fn<GameApiV2['equip']>().mockResolvedValue(state());
  fightBoss = vi.fn<GameApiV2['fightBoss']>().mockResolvedValue({ won: true, timeline: [], keySpent: true, state: state() });
  craft = vi.fn<GameApiV2['craft']>().mockResolvedValue({ item, state: state() });
  salvage = vi.fn<GameApiV2['salvage']>().mockResolvedValue({ gains: { fish: 1, yarn: 0, materials: {} }, state: state() });
  setLocked = vi.fn<GameApiV2['setLocked']>().mockResolvedValue(state());
  forgeRelic = vi.fn<GameApiV2['forgeRelic']>();
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

let api: FakeApiV2;
let doc: FakeDocument;
let loop: GameLoopV2;
let events: LoopEventV2[];
beforeEach(() => {
  vi.useFakeTimers();
  api = new FakeApiV2();
  doc = new FakeDocument();
  loop = new GameLoopV2({ api, now: () => 1234 });
  events = [];
  loop.onEvent((event) => events.push(event));
});
afterEach(() => { loop.stop(); vi.useRealTimers(); });
const start = () => loop.start(doc.asDocument());

it('loads once, publishes the server answer and claims once every 30 seconds', async () => {
  const changed = vi.fn();
  loop.subscribe(changed);
  await start();
  expect(api.getState).toHaveBeenCalledTimes(1);
  expect(loop.getSnapshot().state).toEqual(state());
  expect(changed).toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(CLAIM_INTERVAL_MS_V2 - 1);
  expect(api.claim).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  expect(api.claim).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(CLAIM_INTERVAL_MS_V2);
  expect(api.claim).toHaveBeenCalledTimes(2);
});

it('skips all claims without a class', async () => {
  const unchosen = state();
  unchosen.cat.classId = null;
  api.getState.mockResolvedValue(unchosen);
  await start();
  await vi.advanceTimersByTimeAsync(90_000);
  expect(api.claim).not.toHaveBeenCalled();
});

it('pauses hidden tabs and claims immediately on return, then every 30 seconds', async () => {
  doc.setVisibility('hidden');
  await start();
  expect(loop.getSnapshot().paused).toBe(true);
  await vi.advanceTimersByTimeAsync(90_000);
  expect(api.claim).not.toHaveBeenCalled();
  doc.setVisibility('visible');
  await vi.advanceTimersByTimeAsync(0);
  expect(api.claim).toHaveBeenCalledTimes(1);
  expect(loop.getSnapshot().paused).toBe(false);
  await vi.advanceTimersByTimeAsync(30_000);
  expect(api.claim).toHaveBeenCalledTimes(2);
  doc.setVisibility('hidden');
  await vi.advanceTimersByTimeAsync(60_000);
  expect(api.claim).toHaveBeenCalledTimes(2);
});

it('ignores a pending initial load after stop', async () => {
  const pending = deferred<ServerStateV2>();
  api.getState.mockReturnValue(pending.promise);
  const loading = start();
  loop.stop();
  pending.resolve(state());
  await loading;
  expect(loop.getSnapshot()).toMatchObject({ state: null, paused: true });
  await vi.advanceTimersByTimeAsync(60_000);
  expect(api.claim).not.toHaveBeenCalled();
});

it('emits claimed, levelUp and roundUp in order, with sequence and timestamps', async () => {
  await start();
  const next = state();
  next.cat.level = 4;
  next.progress.round = 3;
  api.claim.mockResolvedValue({ gains: { ...zero(), xp: 1 }, state: next });
  await loop.claimNow();
  expect(events.map((e) => e.type)).toEqual(['claimed', 'levelUp', 'roundUp']);
  expect(events.every((e) => e.at === 1234)).toBe(true);
  expect(loop.getSnapshot()).toMatchObject({ state: next, eventSeq: 3, lastEvent: events[2] });
  events.length = 0;
  api.claim.mockResolvedValue({ gains: zero(), state: next });
  await loop.claimNow();
  expect(events).toEqual([]);
});

it.each(['materials', 'items', 'autoSalvaged'] as const)('recognizes gains from %s alone', async (field) => {
  await start();
  const gains = zero();
  if (field === 'materials') gains.materials = { fluffTuft: 1 };
  else gains[field] = [item];
  api.claim.mockResolvedValue({ gains, state: state() });
  await loop.claimNow();
  expect(events.map((e) => e.type)).toEqual(['claimed']);
});

it('refetches a stale claim and preserves state after an unexpected error', async () => {
  await start();
  const fresh = { ...state(), serverTime: 42 };
  api.getState.mockResolvedValue(fresh);
  api.claim.mockRejectedValueOnce({ code: 'stale' });
  await loop.claimNow();
  expect(api.getState).toHaveBeenCalledTimes(2);
  expect(loop.getSnapshot().state).toBe(fresh);
  api.claim.mockRejectedValueOnce(new Error('boom'));
  await loop.claimNow();
  expect(loop.getSnapshot().state).toBe(fresh);
  expect(events).toEqual([{ type: 'error', action: 'claim', message: 'boom', at: 1234 }]);
  api.claim.mockRejectedValueOnce({ code: 'no_class' });
  await loop.claimNow();
  expect(events).toHaveLength(1);
});

it('shares the same promise for concurrent claims', async () => {
  await start();
  const pending = deferred<Awaited<ReturnType<GameApiV2['claim']>>>();
  api.claim.mockReturnValue(pending.promise);
  const first = loop.claimNow();
  expect(loop.claimNow()).toBe(first);
  await vi.advanceTimersByTimeAsync(0);
  expect(api.claim).toHaveBeenCalledTimes(1);
  pending.resolve({ gains: zero(), state: state() });
  await first;
});

it('refuses a second action while crafting is busy', async () => {
  await start();
  const pending = deferred<Awaited<ReturnType<GameApiV2['craft']>>>();
  api.craft.mockReturnValue(pending.promise);
  const crafting = loop.craft('rcp.common', 'weapon');
  expect(loop.getSnapshot().busy).toBe('craft');
  expect(await loop.fightBoss(1)).toBeNull();
  expect(api.fightBoss).not.toHaveBeenCalled();
  pending.resolve({ item, state: state() });
  await crafting;
  expect(loop.getSnapshot().busy).toBeNull();
  expect(events.map((e) => e.type)).toEqual(['crafted']);
});

it('turns cooldown into a refusal and clears busy', async () => {
  await start();
  api.fightBoss.mockRejectedValue({ code: 'cooldown', cooldownUntil: 123 });
  expect(await loop.fightBoss(1)).toBeNull();
  expect(events).toEqual([{ type: 'refused', action: 'fightBoss', code: 'cooldown', at: 1234 }]);
  expect(loop.getSnapshot().busy).toBeNull();
});

it('emits bossFight before chapterUp on a win', async () => {
  await start();
  const next = state();
  next.progress = { ...next.progress, chapter: 2, round: 1 };
  const result = { won: true, timeline: [], keySpent: true, state: next };
  api.fightBoss.mockResolvedValue(result);
  expect(await loop.fightBoss(1)).toBe(result);
  expect(events.map((e) => e.type)).toEqual(['bossFight', 'chapterUp']);
});

it('waits for an in-flight boss fight before starting a timer claim', async () => {
  await start();
  const pending = deferred<Awaited<ReturnType<GameApiV2['fightBoss']>>>();
  api.fightBoss.mockReturnValue(pending.promise);
  const fighting = loop.fightBoss(1);
  await vi.advanceTimersByTimeAsync(60_000);
  expect(api.claim).not.toHaveBeenCalled();
  pending.resolve({ won: false, timeline: [], keySpent: false, state: state() });
  await fighting;
  await vi.advanceTimersByTimeAsync(0);
  expect(api.claim).toHaveBeenCalledTimes(1);
});

it('waits for an in-flight craft action before starting a timer claim', async () => {
  await start();
  const pending = deferred<Awaited<ReturnType<GameApiV2['craft']>>>();
  api.craft.mockReturnValue(pending.promise);
  const crafting = loop.craft('rcp.common', 'weapon');
  await vi.advanceTimersByTimeAsync(60_000);
  expect(api.claim).not.toHaveBeenCalled();
  pending.resolve({ item, state: state() });
  await crafting;
  await vi.advanceTimersByTimeAsync(0);
  expect(api.claim).toHaveBeenCalledTimes(1);
});

it('resets state on switch and ignores the old load, claim and action answers', async () => {
  await start();
  const claim = deferred<Awaited<ReturnType<GameApiV2['claim']>>>();
  const fight = deferred<Awaited<ReturnType<GameApiV2['fightBoss']>>>();
  api.claim.mockReturnValue(claim.promise);
  const claiming = loop.claimNow();
  await vi.advanceTimersByTimeAsync(0);
  api.fightBoss.mockReturnValue(fight.promise);
  const fighting = loop.fightBoss(1);
  await vi.advanceTimersByTimeAsync(0);
  const next = new FakeApiV2();
  const loading = deferred<ServerStateV2>();
  next.getState.mockReturnValue(loading.promise);
  loop.switchApi(next);
  expect(loop.getSnapshot().state).toBeNull();
  expect(next.getState).toHaveBeenCalledTimes(1);
  claim.resolve({ gains: { ...zero(), fish: 999 }, state: state() });
  fight.resolve({ won: true, timeline: [], keySpent: true, state: state() });
  await claiming;
  expect(await fighting).toBeNull();
  expect(loop.getSnapshot().state).toBeNull();
  expect(events).toEqual([]);
  const final = new FakeApiV2();
  loop.switchApi(final);
  await vi.advanceTimersByTimeAsync(0);
  const finalState = loop.getSnapshot().state;
  loading.resolve({ ...state(), serverTime: 999 });
  await vi.advanceTimersByTimeAsync(0);
  expect(loop.getSnapshot().state).toBe(finalState);
});

it('keeps snapshot identity stable when no fields change', async () => {
  expect(loop.getSnapshot()).toBe(loop.getSnapshot());
  await start();
  const snapshot = loop.getSnapshot();
  const unsubscribe = loop.subscribe(vi.fn());
  unsubscribe();
  await vi.advanceTimersByTimeAsync(1000);
  await start();
  expect(loop.getSnapshot()).toBe(snapshot);
  api.claim.mockResolvedValue({ gains: zero(), state: snapshot.state! });
  await loop.claimNow();
  expect(loop.getSnapshot()).toBe(snapshot);
});

it('reports initial failure and retries successfully', async () => {
  api.getState.mockRejectedValueOnce(new Error('offline'));
  await start();
  expect(loop.getSnapshot().loadFailed).toBe(true);
  expect(events[0]).toMatchObject({ type: 'error', action: 'load', message: 'offline' });
  await loop.retry();
  expect(loop.getSnapshot()).toMatchObject({ loadFailed: false, state: state() });
});

it('drops rejected old loads after switching and permits a new claim immediately', async () => {
  const pending = deferred<ServerStateV2>();
  api.getState.mockReturnValue(pending.promise);
  const loading = start();
  const next = new FakeApiV2();
  loop.switchApi(next);
  await vi.advanceTimersByTimeAsync(0);
  pending.reject(new Error('old load'));
  await loading;
  expect(loop.getSnapshot().loadFailed).toBe(false);
  expect(events).toEqual([]);
  await loop.claimNow();
  expect(next.claim).toHaveBeenCalledTimes(1);
});

it('wires void actions, salvage and forge to the contract and publishes action events', async () => {
  await start();
  await loop.chooseClass('warrior');
  await loop.equip(null, 'weapon');
  await loop.setLocked('i1', true);
  expect(api.chooseClass).toHaveBeenCalledWith('warrior');
  expect(api.equip).toHaveBeenCalledWith(null, 'weapon');
  expect(api.setLocked).toHaveBeenCalledWith('i1', true);
  expect(events).toEqual([]);
  await loop.salvage(['i1']);
  expect(api.salvage).toHaveBeenCalledWith(['i1']);
  const forged: Awaited<ReturnType<GameApiV2['forgeRelic']>> = {
    voucher: { player: '0x1', relicId: '1', rarity: 0, rarityName: 'common', nonce: '1', expiry: 1, signature: '0x' },
    state: state(),
  };
  api.forgeRelic.mockResolvedValue(forged);
  expect(await loop.forgeRelic()).toBe(forged);
  expect(events.map((e) => e.type)).toEqual(['salvaged', 'forged']);
});

it('refetches stale actions, reports unknown errors, and always releases busy', async () => {
  await start();
  const fresh = { ...state(), serverTime: 77 };
  api.getState.mockResolvedValue(fresh);
  api.equip.mockRejectedValue({ code: 'stale' });
  await loop.equip('i1', 'weapon');
  expect(loop.getSnapshot().state).toBe(fresh);
  expect(api.getState).toHaveBeenCalledTimes(2);
  api.craft.mockRejectedValue(new Error('boom'));
  expect(await loop.craft('rcp.common', 'weapon')).toBeNull();
  expect(events.map((e) => e.type)).toEqual(['refused', 'error']);
  expect(loop.getSnapshot().busy).toBeNull();
});

it('diffs only forward progress and never invents round events across chapters', () => {
  const before = state();
  expect(diffProgressEventsV2(null, before, 1)).toEqual([]);
  expect(diffProgressEventsV2(before, before, 1)).toEqual([]);
  const lower = state();
  lower.cat.level = 2;
  lower.progress.round = 1;
  expect(diffProgressEventsV2(before, lower, 1)).toEqual([]);
  const next = state();
  next.progress.chapter = 2;
  next.progress.round = 9;
  expect(diffProgressEventsV2(before, next, 1)).toEqual([{ type: 'chapterUp', chapter: 2, at: 1 }]);
});

it('does not run a queued claim after hiding or stopping during a boss fight', async () => {
  await start();
  const pending = deferred<Awaited<ReturnType<GameApiV2['fightBoss']>>>();
  api.fightBoss.mockReturnValue(pending.promise);
  const fighting = loop.fightBoss(1);
  await vi.advanceTimersByTimeAsync(30_000);
  const queued = loop.claimNow();
  doc.setVisibility('hidden');
  pending.resolve({ won: false, timeline: [], keySpent: false, state: state() });
  await fighting;
  await queued;
  expect(api.claim).not.toHaveBeenCalled();
  loop.stop();
  doc.setVisibility('visible');
  await vi.advanceTimersByTimeAsync(60_000);
  expect(api.claim).not.toHaveBeenCalled();
});

it('drops late claim/action rejections after stop and removes event subscriptions', async () => {
  await start();
  const observer = vi.fn();
  const unsubscribe = loop.onEvent(observer);
  unsubscribe();
  const claim = deferred<Awaited<ReturnType<GameApiV2['claim']>>>();
  api.claim.mockReturnValue(claim.promise);
  const claiming = loop.claimNow();
  await vi.advanceTimersByTimeAsync(0);
  const action = deferred<Awaited<ReturnType<GameApiV2['craft']>>>();
  api.craft.mockReturnValue(action.promise);
  const crafting = loop.craft('rcp.common', 'weapon');
  await vi.advanceTimersByTimeAsync(0);
  loop.stop();
  claim.reject(new Error('late claim'));
  action.reject({ code: 'stale' });
  await claiming;
  expect(await crafting).toBeNull();
  expect(events).toEqual([]);
  expect(observer).not.toHaveBeenCalled();
  expect(api.getState).toHaveBeenCalledTimes(1);
  expect(loop.getSnapshot().busy).toBeNull();
});

it('silently reloads a stale boss response without a refused/error toast and releases busy', async () => {
  await start();
  const fresh = { ...state(), serverTime: 88 }; api.getState.mockResolvedValue(fresh);
  api.fightBoss.mockRejectedValue({ code: 'stale' });
  expect(await loop.fightBoss(1)).toBeNull();
  expect(loop.getSnapshot().state).toBe(fresh);
  expect(loop.getSnapshot().busy).toBeNull();
  expect(api.getState).toHaveBeenCalledTimes(2);
  expect(events.filter(event => event.type === 'refused' || event.type === 'error')).toEqual([]);
});
