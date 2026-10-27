import { describe, expect, it } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import { GameApiErrorV2 } from './GameApiErrorV2';
import { MockGameApiV2, MOCK_V2_STORAGE_KEY } from './MockGameApiV2';
import { MOCK_V2_FIXTURE_KINDS, mockV2Save, mockV2SaveJson, type MockV2FixtureKind } from './mockV2Fixtures';

const nowMs = Date.parse('2026-10-25T03:00:00Z');
function memory(json: string) {
  const values = new Map([[MOCK_V2_STORAGE_KEY, json]]);
  return { getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); } };
}
function apiFor(kind: MockV2FixtureKind, classId: v2.ClassId, seed = 1, chapter?: number) {
  const json = mockV2SaveJson(kind, { nowMs, classId, chapter });
  const storage = memory(json);
  return { storage, json, api: new MockGameApiV2({ storage, now: () => nowMs, seed }) };
}

for (const kind of MOCK_V2_FIXTURE_KINDS) {
  describe(kind, () => {
    it.each(v2.CLASS_IDS)('loads the intended %s save without silent fallback and is deterministic', async classId => {
      const opts = { nowMs, classId };
      const expected = mockV2Save(kind, opts);
      const { api, storage, json } = apiFor(kind, classId);
      const actual = await api.getState();
      expect(actual.cat).toMatchObject({ classId, level: expected.state.level, xp: expected.state.xp });
      expect(actual.progress).toMatchObject({ chapter: expected.state.chapter, round: expected.state.round, kills: expected.state.kills });
      expect(actual.inventory).toHaveLength(expected.state.items.length);
      expect(actual.currencies.keys).toBe(expected.state.stacks.catKey ?? 0);
      const weapon = expected.state.items.find(item => item.equipped && item.slot === 'weapon')!;
      expect(actual.inventory.find(item => item.id === actual.equipped.weapon)?.itemKey).toBe(weapon.itemKey);
      expect(actual.inventory).toEqual(expected.state.items.map(item => ({ ...v2.itemViewV2(item), source: item.source })));
      expect(storage.getItem(MOCK_V2_STORAGE_KEY)).toBe(json);
      expect(expected.lastClaimMs).toBe(nowMs);
      expect(mockV2SaveJson(kind, opts)).toBe(mockV2SaveJson(kind, opts));
      expect(new Set(expected.state.items.map(item => item.id)).size).toBe(expected.state.items.length);
    });

    it.each(v2.CLASS_IDS)('persists %s progress through a ten-minute claim and reload', async classId => {
      let now = nowMs;
      const storage = memory(mockV2SaveJson(kind, { nowMs, classId }));
      const api = new MockGameApiV2({ storage, now: () => now, seed: 3 });
      now += 10 * 60_000;
      const claimed = await api.claim();
      expect(claimed.gains.xp).toBeGreaterThanOrEqual(0);
      expect(JSON.parse(storage.getItem(MOCK_V2_STORAGE_KEY)!).lastClaimMs).toBe(now);
      const reloaded = await new MockGameApiV2({ storage, now: () => now, seed: 3 }).getState();
      expect(reloaded.cat).toEqual(claimed.state.cat);
      expect(reloaded.currencies).toEqual(claimed.state.currencies);
      expect(reloaded.inventory).toEqual(claimed.state.inventory);
      expect(reloaded.progress).toMatchObject({ chapter: claimed.state.progress.chapter,
        round: claimed.state.progress.round, kills: claimed.state.progress.kills });
      // claim() carries the last simulated gate; getState() recomputes it from saved progress.
      expect(reloaded).toEqual(await api.getState());
    });
  });
}

describe('boss fixtures', () => {
  for (const classId of v2.CLASS_IDS) {
    it.each([1, 2, 3, 4, 5])(`strong ${classId} wins chapter one with seed %s and accounts for chest keys`, async seed => {
      const { api } = apiFor('bossReadyStrong', classId, seed);
      expect((await api.getState()).currencies.keys).toBe(v2.V2_CONFIG.boss.keyCost);
      const result = await api.fightBoss(1);
      expect(result.won).toBe(true);
      expect(result.keySpent).toBe(true);
      expect(result.chest).toBeDefined();
      expect(result.state.currencies.keys).toBe(v2.V2_CONFIG.boss.keyCost - v2.V2_CONFIG.boss.keyCost + result.chest!.keys);
    });
    it.each([1, 2, 3, 4, 5])(`weak ${classId} loses with seed %s, keeps its key and waits for cooldown`, async seed => {
      let now = nowMs;
      const storage = memory(mockV2SaveJson('bossReadyWeak', { nowMs, classId }));
      const api = new MockGameApiV2({ storage, now: () => now, seed });
      const result = await api.fightBoss(1);
      expect(result.won).toBe(false);
      expect(result.keySpent).toBe(false);
      expect(result.chest).toBeUndefined();
      expect(result.state.currencies.keys).toBe(v2.V2_CONFIG.boss.keyCost);
      expect(result.state.bosses.cooldownUntil).toBe(nowMs / 1000 + v2.V2_CONFIG.boss.lossCooldownSeconds);
      await expect(api.fightBoss(1)).rejects.toBeInstanceOf(GameApiErrorV2);
      await expect(api.fightBoss(1)).rejects.toMatchObject({ code: 'cooldown' });
      now += v2.V2_CONFIG.boss.lossCooldownSeconds * 1000 - 1;
      await expect(api.fightBoss(1)).rejects.toMatchObject({ code: 'cooldown' });
      now += 1;
      await expect(api.fightBoss(1)).resolves.toHaveProperty('won');
    });
  }
  it.each(v2.CHAPTERS.slice(1).map(ch => ch.index))('records strongest warrior chapter %s outcomes without asserting balance', async chapter => {
    const wins: boolean[] = [];
    for (let seed = 1; seed <= 5; seed++) {
      const { api } = apiFor('bossReadyStrong', 'warrior', seed, chapter);
      expect((await api.getState()).progress.chapter).toBe(chapter);
      wins.push((await api.fightBoss(chapter)).won);
    }
    console.info(`Chapter ${chapter}, warrior max-level fixture, seeds 1-5: ${wins.map(won => won ? 'win' : 'loss').join(', ')}`);
  });
});

describe('fixture situations', () => {
  it.each(v2.CLASS_IDS)('forgeRich %s covers both recipes twice, crafts, salvages and refuses locked items', async classId => {
    const save = mockV2Save('forgeRich', { nowMs, classId });
    for (const recipe of v2.RECIPES.filter(entry => ['rcp.common', 'rcp.uncommon'].includes(entry.id))) {
      for (const [id, qty] of Object.entries({ ...recipe.materials, fish: recipe.fish }) as [v2.StateStackIdV2, number][]) {
        expect(save.state.stacks[id]).toBeGreaterThanOrEqual(qty * 2);
      }
    }
    const { api } = apiFor('forgeRich', classId);
    const before = await api.getState();
    const spare = before.inventory.filter(item => !item.equipped && !item.locked);
    expect(spare).toHaveLength(3);
    const locked = before.inventory.find(item => item.locked)!;
    const crafted = await api.craft('rcp.common', 'weapon');
    expect(crafted.state.inventory).toHaveLength(before.inventory.length + 1);
    const salvaged = await api.salvage([spare[0]!.id]);
    expect(salvaged.state.inventory).toHaveLength(before.inventory.length);
    expect(salvaged.gains.yarn + Object.values(salvaged.gains.materials).reduce((sum, n) => sum + n, 0)).toBeGreaterThan(0);
    expect(salvaged.state.currencies.yarn).toBeGreaterThan(crafted.state.currencies.yarn);
    const saved = await api.getState();
    await expect(api.salvage([locked.id])).rejects.toMatchObject({ code: 'locked' });
    expect(await api.getState()).toEqual(saved);
  });
  it.each(v2.CLASS_IDS)('bagNearFull %s meets the configured threshold', async classId => {
    const { api } = apiFor('bagNearFull', classId);
    const state = await api.getState();
    expect(state.inventory).toHaveLength(Math.ceil(v2.V2_CONFIG.bag.limit * v2.V2_CONFIG.bag.nearFullRatio));
    expect(state.inventory.length).toBeGreaterThanOrEqual(state.bagLimit * v2.V2_CONFIG.bag.nearFullRatio);
    expect(state.inventory.length).toBeLessThanOrEqual(state.bagLimit);
  });
  it.each(v2.CLASS_IDS)('midGame %s equips every unlocked slot at chapter 3', async classId => {
    const { api } = apiFor('midGame', classId, 1, 3);
    const state = await api.getState();
    expect(state.progress.chapter).toBe(3);
    expect(state.cat.level).toBe(Math.min(20, v2.V2_CONFIG.cat.maxLevel));
    for (const slot of state.unlockedSlots) expect(state.equipped[slot]).not.toBeNull();
  });
  it('rejects unusable timestamps, classes and chapters', () => {
    expect(() => mockV2Save('fresh', { nowMs: NaN })).toThrow(RangeError);
    expect(() => mockV2Save('fresh', { nowMs, classId: 'unknown' as v2.ClassId })).toThrow();
    expect(() => mockV2Save('bossReadyStrong', { nowMs, chapter: 0 })).toThrow(RangeError);
  });
});
