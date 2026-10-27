import { describe, expect, it } from 'vitest';
import { deriveSeed, v2 } from '@taskbar-hero/game-rules';
import type { ClassId, GameApiV2, StackId } from './GameApiV2';
import { DEMO_SIGNATURE } from './MockGameApi';
import { MockGameApiV2, MOCK_V2_STORAGE_KEY } from './MockGameApiV2';

function memory(initial?: string) {
  const values = new Map<string, string>(initial === undefined ? [] : [[MOCK_V2_STORAGE_KEY, initial]]);
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}
function fixture(overrides: Partial<v2.PlayerStateV2> = {}, counter = 0) {
  const r = v2.emptyState(); if (!r.ok) throw new Error('empty');
  return JSON.stringify({ v: 1, state: { ...r.state, classId: 'warrior', ...overrides }, lastClaimMs: 0, counter, voucherNonce: 0, founder: false });
}
function gear(strong: boolean): v2.StateOwnedItemV2[] {
  const keys = strong ? ['wpn.sword.ninelives', ...['helmet', 'armor', 'gloves', 'boots'].map(slot => `arm.cozy.${slot}.legendary`)] : [];
  return keys.map((key, i) => {
    const def = v2.ITEMS.find(item => item.id === key)!;
    return { id: `gear:${i}`, itemId: key, itemKey: key, slot: def.slot, rarity: def.rarity, ...(def.weaponType ? { weaponType: def.weaponType } : {}), level: 50, bonus: [], bonusLines: [], locked: false, equipped: true, source: 'drop' };
  });
}
const ready = (strong = false): Partial<v2.PlayerStateV2> => ({ level: strong ? 60 : 1, items: gear(strong), round: 10, kills: v2.CHAPTERS[0]!.killsPerRound, stacks: { catKey: 1 } });

describe('MockGameApiV2', () => {
  it('implements GameApiV2, starts classless, and rejects a claim', async () => {
    const api: GameApiV2 = new MockGameApiV2({ storage: null });
    expect((await api.getState()).cat.classId).toBeNull();
    await expect(api.claim()).rejects.toMatchObject({ code: 'no_class' });
  });
  it('chooses and equips exactly one starter and rejects unknown classes and slots', async () => {
    const api = new MockGameApiV2({ storage: null });
    const state = await api.chooseClass('warrior');
    expect(state.inventory).toHaveLength(1);
    expect(state.inventory[0]).toMatchObject({ itemKey: 'wpn.sword.twig', equipped: true });
    expect(state.equipped.weapon).toBe(state.inventory[0]!.id);
    expect((await api.chooseClass('warrior')).inventory).toHaveLength(1);
    await expect(api.chooseClass('nope' as ClassId)).rejects.toMatchObject({ code: 'invalid_request' });
    await expect(api.equip(null, 'nope' as v2.GearSlotId)).rejects.toMatchObject({ code: 'invalid_request' });
  });
  it('claims ten minutes of XP, fish and the daily key; short claims change nothing', async () => {
    let now = 0; const storage = memory(); const api = new MockGameApiV2({ now: () => now, storage });
    await api.chooseClass('warrior'); now = 600_000;
    const result = await api.claim();
    expect(result.gains.xp).toBeGreaterThan(0); expect(result.state.currencies.fish).toBeGreaterThan(0); expect(result.gains.keys).toBe(1);
    const before = storage.getItem(MOCK_V2_STORAGE_KEY);
    now += 5000; const short = await api.claim();
    expect(short.gains).toEqual({ fish: 0, yarn: 0, keys: 0, materials: {}, items: [], autoSalvaged: [], xp: 0, levelsGained: 0 });
    expect(short.state).toEqual({ ...result.state, serverTime: now / 1000 });
    expect(storage.getItem(MOCK_V2_STORAGE_KEY)).toBe(before);
    now += 5000; await api.claim(); expect(JSON.parse(storage.getItem(MOCK_V2_STORAGE_KEY)!).lastClaimMs).toBe(now);
  });
  it('reports a weak chapter-three gate after claiming', async () => {
    const api = new MockGameApiV2({ storage: memory(fixture({ chapter: 3 })), now: () => 600_000, start: { fish: 100 } });
    expect((await api.claim()).state.progress).toMatchObject({ gated: true });
    expect((await api.getState()).progress.neededPower).toBeGreaterThan(0);
  });
  it('wins first clears and rematches with the correct seeded chests and key accounting', async () => {
    let found = false;
    for (let seed = 1; seed <= 200; seed++) {
      const storage = memory(fixture(ready(true)));
      const api = new MockGameApiV2({ seed, storage, now: () => 0 });
      const result = await api.fightBoss(1);
      if (!result.won) continue;
      found = true;
      expect(result.keySpent).toBe(true); expect(result.chest).toBeDefined();
      expect(result.state.currencies.keys).toBe(result.chest!.keys);
      expect(result.state.progress.chapter).toBe(2); expect(result.state.bosses.chapters[0]).toMatchObject({ cleared: true, wins: 1 });
      const rolled = v2.rollChestV2({ chapter: 1, firstClear: true, classId: 'warrior', level: 60 }, deriveSeed(seed, 1));
      expect(result.chest!.fish).toBe(rolled.stackDeltas.fish);
      const saved = JSON.parse(storage.getItem(MOCK_V2_STORAGE_KEY)!); saved.state.stacks.catKey = 1;
      storage.setItem(MOCK_V2_STORAGE_KEY, JSON.stringify(saved));
      const rematch = await new MockGameApiV2({ seed, storage, now: () => 0 }).fightBoss(1);
      expect(rematch.won).toBe(true); expect(rematch.state.bosses.chapters[0]!.wins).toBe(2);
      const repeated = v2.rollChestV2({ chapter: 1, firstClear: false, classId: 'warrior', level: 60 }, deriveSeed(seed, 3));
      expect(rematch.chest!.fish).toBe(repeated.stackDeltas.fish);
      break;
    }
    expect(found).toBe(true);
  });
  it('loses without spending a key, omits chest and enforces the loss cooldown', async () => {
    let found = false;
    for (let seed = 1; seed <= 200; seed++) {
      let now = 0; const storage = memory(fixture(ready()));
      const api = new MockGameApiV2({ seed, storage, now: () => now });
      const result = await api.fightBoss(1); if (result.won) continue;
      found = true; expect(result.keySpent).toBe(false); expect('chest' in result).toBe(false);
      expect(result.state.currencies.keys).toBe(1); expect(result.state.bosses.cooldownUntil).toBe(v2.V2_CONFIG.boss.lossCooldownSeconds);
      const saved = storage.getItem(MOCK_V2_STORAGE_KEY); now = 30_000;
      await expect(api.fightBoss(1)).rejects.toMatchObject({ code: 'cooldown', cooldownUntil: 60 });
      expect(storage.getItem(MOCK_V2_STORAGE_KEY)).toBe(saved);
      now = 61_000; await expect(api.fightBoss(1)).resolves.toHaveProperty('won'); break;
    }
    expect(found).toBe(true);
  });
  it('carries big and dodged flags through a mock fight timeline', async () => {
    const api = new MockGameApiV2({ storage: memory(fixture(ready())), seed: 9, now: () => 0 });
    const result = await api.fightBoss(1);
    const expected = v2.simulateBossV2(v2.deriveStats({ classId: 'warrior', level: 1 }, []), 'warrior', v2.bossOfChapter(1), deriveSeed(9, 0));
    expect(result.timeline).toEqual(v2.timelineViewV2(expected.log));
    const windups = result.timeline.filter(event => event.type === 'boss_windup');
    const impacts = result.timeline.filter(event => event.type === 'boss_impact');
    expect(windups.length).toBeGreaterThan(0); expect(impacts.length).toBeGreaterThan(0);
    for (const event of [...windups, ...impacts]) expect(typeof event.big).toBe('boolean');
    for (const event of impacts) expect(typeof event.dodged).toBe('boolean');
    expect(windups.some(event => event.big)).toBe(true);
  });
  it('refuses unreached bosses and missing keys without changing persisted state or seeds', async () => {
    for (const [overrides, chapter, code] of [[{}, 2, 'not_reached'], [{ ...ready(), stacks: {} }, 1, 'no_key']] as const) {
      const storage = memory(fixture(overrides)); const api = new MockGameApiV2({ storage, now: () => 0 });
      const before = storage.getItem(MOCK_V2_STORAGE_KEY);
      await expect(api.fightBoss(chapter)).rejects.toMatchObject({ code });
      expect(storage.getItem(MOCK_V2_STORAGE_KEY)).toBe(before);
    }
  });
  it('crafts and salvages at a loss for every paid stack', async () => {
    const recipe = v2.RECIPES.find(r => r.id === 'rcp.common')!;
    const paid = { ...recipe.materials, fish: recipe.fish };
    const api = new MockGameApiV2({ storage: null, start: paid }); await api.chooseClass('warrior');
    const crafted = await api.craft('rcp.common', 'weapon'); const salvaged = await api.salvage([crafted.item.id]);
    const returned: Partial<Record<StackId, number>> = { ...salvaged.gains.materials, fish: salvaged.gains.fish, yarn: salvaged.gains.yarn };
    let strictlyLess = false;
    for (const [key, value] of Object.entries(paid) as [StackId, number][]) {
      expect(returned[key] ?? 0).toBeLessThanOrEqual(value); if ((returned[key] ?? 0) < value) strictlyLess = true;
    }
    expect(strictlyLess).toBe(true);
  });
  it('maps the first missing craft stack and never saves a refusal', async () => {
    const storage = memory(fixture({ stacks: { yarn: 10, fluffTuft: 4 } })); const api = new MockGameApiV2({ storage });
    const before = storage.getItem(MOCK_V2_STORAGE_KEY);
    expect(v2.craftBlock({ stacks: { yarn: 10, fluffTuft: 4 }, lastRelicDay: -1 }, 'rcp.common', 'weapon')).toBe('not_enough_fish');
    await expect(api.craft('rcp.common', 'weapon')).rejects.toMatchObject({ code: 'not_enough', stackId: 'fish' });
    expect(storage.getItem(MOCK_V2_STORAGE_KEY)).toBe(before);
  });
  it('refuses equipped, locked and unknown items and can unlock/equip/unequip', async () => {
    const api = new MockGameApiV2({ storage: null, start: { fish: 50, yarn: 10, fluffTuft: 4 } });
    const state = await api.chooseClass('warrior');
    await expect(api.salvage([state.equipped.weapon!])).rejects.toMatchObject({ code: 'equipped' });
    const item = (await api.craft('rcp.common', 'weapon')).item;
    await api.setLocked(item.id, true); await expect(api.salvage([item.id])).rejects.toMatchObject({ code: 'locked' });
    await expect(api.salvage(['missing'])).rejects.toMatchObject({ code: 'not_owner' });
    await api.setLocked(item.id, false); await api.equip(item.id, 'weapon');
    expect((await api.equip(null, 'weapon')).equipped.weapon).toBeNull();
    await expect(api.salvage([])).rejects.toMatchObject({ code: 'invalid_request' });
    await api.salvage([item.id]);
  });
  it('reloads identical state and continues the persisted seed stream', async () => {
    const storage = memory(fixture(ready())); const first = new MockGameApiV2({ storage, seed: 9, now: () => 0 });
    await first.fightBoss(1); const saved = JSON.parse(storage.getItem(MOCK_V2_STORAGE_KEY)!);
    const second = new MockGameApiV2({ storage, seed: 9, now: () => 0 });
    expect(await second.getState()).toEqual(await first.getState());
    expect(saved.counter).toBeGreaterThan(0); expect(deriveSeed(9, saved.counter)).not.toBe(deriveSeed(9, 0));
    const later = new MockGameApiV2({ storage, seed: 9, now: () => 61_000 });
    const result = await later.fightBoss(1);
    const expected = v2.simulateBossV2(v2.deriveStats({ classId: 'warrior', level: 1 }, []), 'warrior', v2.bossOfChapter(1), deriveSeed(9, saved.counter));
    expect(result.timeline).toEqual(v2.timelineViewV2(expected.log));
  });
  it.each(['{oops', '{"v":99}', '{"v":1,"state":{"level":"x"}}', fixture({ xp: NaN })])('overwrites corrupt saves: %s', async raw => {
    const storage = memory(raw); const api = new MockGameApiV2({ storage, now: () => 0 });
    expect((await api.getState()).cat.classId).toBeNull(); expect(storage.getItem(MOCK_V2_STORAGE_KEY)).not.toBe(raw);
    await api.chooseClass('warrior'); expect(JSON.parse(storage.getItem(MOCK_V2_STORAGE_KEY)!).v).toBe(1);
  });
  it('continues in memory when every storage operation throws', async () => {
    const fail = () => { throw new Error('private'); };
    const api = new MockGameApiV2({ storage: { getItem: fail, setItem: fail, removeItem: fail } });
    expect((await api.chooseClass('warrior')).cat.classId).toBe('warrior');
  });
  it('forges once, persists pending vouchers, refreshes expiry, and refuses a missing pearl', async () => {
    let now = 0; const storage = memory();
    const api = new MockGameApiV2({ storage, now: () => now, start: { yarn: 30, moonPearl: 1 } });
    const forged = await api.forgeRelic(); expect(forged.voucher.signature).toBe(DEMO_SIGNATURE); expect(forged.state.currencies.yarn).toBe(0);
    expect((await api.forgeRelic()).voucher).toEqual(forged.voucher);
    const reload = new MockGameApiV2({ storage, now: () => now });
    expect(await reload.getState()).toEqual(await api.getState()); expect((await reload.forgeRelic()).voucher).toEqual(forged.voucher);
    now = (forged.voucher.expiry + 1) * 1000; const refreshed = await reload.forgeRelic();
    expect(refreshed.voucher.relicId).toBe(forged.voucher.relicId); expect(refreshed.voucher.nonce).not.toBe(forged.voucher.nonce); expect(refreshed.voucher.expiry).toBeGreaterThan(now / 1000);
    await expect(new MockGameApiV2({ storage: null, start: { yarn: 30 } }).forgeRelic()).rejects.toMatchObject({ code: 'forge_blocked', reason: 'no_moon_pearl' });
  });
  it('returns isolated snapshots, loot, bonuses and vouchers', async () => {
    const api = new MockGameApiV2({ storage: null, start: { yarn: 30, moonPearl: 1 } });
    const first = await api.chooseClass('warrior'); first.inventory[0]!.bonus.push({ stat: 'hp', value: 100 }); first.currencies.yarn = 999;
    expect((await api.getState()).inventory[0]!.bonus).toEqual([]);
    const result = await api.forgeRelic(); result.voucher.nonce = 'bad'; result.state.forge.pending!.nonce = 'also bad';
    expect((await api.forgeRelic()).voucher.nonce).not.toContain('bad');
  });
  it('uses the UTC+7 day at the boundary and handles final-chapter farming', async () => {
    let now = Date.parse('2026-10-24T16:59:00Z'); const api = new MockGameApiV2({ storage: null, now: () => now });
    await api.chooseClass('warrior'); now += 10_000; expect((await api.claim()).gains.keys).toBe(1);
    now = Date.parse('2026-10-24T17:00:00Z'); expect((await api.claim()).gains.keys).toBe(1);
    const final = new MockGameApiV2({ storage: memory(fixture({ chapter: 6, level: 60, items: gear(true) })), now: () => 600_000 });
    expect((await final.claim()).state.progress).toMatchObject({ chapter: 5, round: 10, kills: v2.CHAPTERS[4]!.killsPerRound });
  });
});

it.each(v2.CLASSES)('protects the $id starter but allows a paid item with the same catalog key', async cls => {
  const storage = memory(); const recipe = v2.RECIPES.find(r => r.id === 'rcp.common')!;
  const api = new MockGameApiV2({ storage, start: { ...recipe.materials, fish: recipe.fish } });
  const chosen = await api.chooseClass(cls.id); const starter = chosen.inventory[0]!;
  expect(starter.source).toBe('starter'); await api.equip(null, 'weapon');
  const crafted = await api.craft('rcp.common', 'weapon'); expect(crafted.item.source).toBe('craft');
  expect(crafted.item.itemKey).toBe(starter.itemKey);
  const before = await api.getState();
  await expect(api.salvage([starter.id, crafted.item.id])).rejects.toMatchObject({ code: 'invalid_request' });
  expect(await api.getState()).toEqual(before);
  await expect(api.salvage([starter.id])).rejects.toMatchObject({ code: 'invalid_request' });
  await api.salvage([crafted.item.id]);
  expect((await api.chooseClass(cls.id)).inventory).toHaveLength(1);
  const saved = JSON.parse(storage.getItem(MOCK_V2_STORAGE_KEY)!);
  expect(saved.state.stacks.yarn).toBe(v2.salvage(crafted.item).yarn);
});
it('bumps equipment revision only for actual changes, including class selection', async () => {
  const storage = memory(); const api = new MockGameApiV2({ storage });
  const rev = () => JSON.parse(storage.getItem(MOCK_V2_STORAGE_KEY)!).state.progressRev as number;
  const chosen = await api.chooseClass('warrior'); expect(rev()).toBe(2);
  await api.equip(chosen.inventory[0]!.id, 'weapon'); expect(rev()).toBe(2);
  await api.equip(null, 'helmet'); expect(rev()).toBe(2);
  await api.equip(null, 'weapon'); expect(rev()).toBe(3);
  await api.equip(null, 'weapon'); expect(rev()).toBe(3);
  await api.chooseClass('archer'); expect(rev()).toBe(5); // class change and bow equip
});
it('persists craft retry identity, rejects changed intent, and returns a fresh state', async () => {
  const storage = memory(); const recipe = v2.RECIPES.find(r => r.id === 'rcp.common')!;
  const api = new MockGameApiV2({ storage, start: { ...recipe.materials, fish: recipe.fish } });
  await api.chooseClass('warrior'); const requestId = crypto.randomUUID();
  const first = await api.craft('rcp.common', 'weapon', requestId);
  const retry = await new MockGameApiV2({ storage }).craft('rcp.common', 'weapon', requestId);
  expect(retry.item).toEqual(first.item); expect(retry.state.currencies.fish).toBe(0);
  await expect(api.craft('rcp.common', 'helmet', requestId)).rejects.toMatchObject({ code: 'invalid_request' });
  expect((await api.getState()).inventory).toHaveLength(2);
});
it('keeps failed mock request IDs retryable after a top-up and treats a new ID as a new craft', async () => {
  const storage = memory(); const api = new MockGameApiV2({ storage }); await api.chooseClass('warrior');
  const requestId = crypto.randomUUID(); await expect(api.craft('rcp.common', 'weapon', requestId)).rejects.toMatchObject({ code: 'not_enough' });
  const saved = JSON.parse(storage.getItem(MOCK_V2_STORAGE_KEY)!); const recipe = v2.RECIPES.find(r => r.id === 'rcp.common')!;
  saved.state.stacks = Object.fromEntries(Object.entries({ ...recipe.materials, fish: recipe.fish }).map(([id, qty]) => [id, qty * 2]));
  storage.setItem(MOCK_V2_STORAGE_KEY, JSON.stringify(saved)); const funded = new MockGameApiV2({ storage });
  const first = await funded.craft('rcp.common', 'weapon', requestId);
  const second = await funded.craft('rcp.common', 'weapon', crypto.randomUUID());
  expect(first.item.id).not.toBe(second.item.id); expect(second.state.currencies.fish).toBe(0);
});
it('replays the original boss timeline across a save reload without another key or cooldown check', async () => {
  const storage = memory(fixture(ready(true))); const requestId = crypto.randomUUID();
  const api = new MockGameApiV2({ storage, now: () => 0 }); const first = await api.fightBoss(1, requestId);
  const retry = await new MockGameApiV2({ storage, now: () => 1000 }).fightBoss(1, requestId);
  expect(retry.timeline).toEqual(first.timeline); expect(retry.chest).toEqual(first.chest);
  expect(retry.state.serverTime).toBe(1);
  expect(JSON.parse(storage.getItem(MOCK_V2_STORAGE_KEY)!).state.fights).toBe(1);
  await expect(api.fightBoss(2, requestId)).rejects.toMatchObject({ code: 'invalid_request' });
});
it('loads a legacy save without source as drop without erasing progress', async () => {
  const storage = memory(); const api = new MockGameApiV2({ storage }); const chosen = await api.chooseClass('warrior');
  const saved = JSON.parse(storage.getItem(MOCK_V2_STORAGE_KEY)!); delete saved.state.items[0].source;
  storage.setItem(MOCK_V2_STORAGE_KEY, JSON.stringify(saved)); const restored = await new MockGameApiV2({ storage }).getState();
  expect(restored.inventory[0]!.id).toBe(chosen.inventory[0]!.id); expect(restored.inventory[0]!.source).toBe('drop');
});
it('never auto-salvages a starter grant from a full bag', async () => {
  const items = Array.from({ length: v2.V2_CONFIG.bag.limit }, (_, i) => ({ ...gear(true)[1]!, id: `bag:${i}`, equipped: false }));
  const storage = memory(fixture({ items, stacks: {} })); const api = new MockGameApiV2({ storage });
  await api.chooseClass('archer'); await api.chooseClass('archer');
  const state = await api.getState(); expect(state.inventory).toHaveLength(items.length + 1); expect(state.currencies.yarn).toBe(0);
  expect(state.inventory.filter(item => item.source === 'starter')).toHaveLength(1);
});
