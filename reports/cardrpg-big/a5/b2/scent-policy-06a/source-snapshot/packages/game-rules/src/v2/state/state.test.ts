import { describe, expect, it } from 'vitest';
import { Rng } from '../../rng';
import { v2 } from '../../index';
import { V2_CONFIG } from '../config';
import { CHAPTERS, CLASSES, GEAR_SLOT_IDS, ITEMS, MATERIAL_IDS, RECIPES, RELIC_RECIPE } from '../content';
import { craft, salvage } from '../forge';
import { addItems, applyBossResult, applyClaim, applyCraft, applyRelicForge, applySalvage,
  applyStacks, CAT_KEY_CAP, chooseClass, emptyState, equip, lockItem } from './index';
import type { BossApplicationV2 } from './apply';
import type { ClaimDeltaV2 as IdleClaimDeltaV2 } from '../idle/types';
import type { ClaimDeltaV2, OwnedItem, PlayerStateV2, StackId, StateResultV2 } from './types';

function success<T extends object>(result: StateResultV2<T>) {
  if (!result.ok) throw new Error(JSON.stringify(result));
  return result;
}
function state(overrides: Partial<PlayerStateV2> = {}): PlayerStateV2 {
  return { ...success(emptyState()).state, classId: 'warrior', ...overrides };
}
function item(id: string, key = 'wpn.sword.twig', overrides: Partial<OwnedItem> = {}): OwnedItem {
  const def = ITEMS.find((entry) => entry.id === key)!;
  return { id, itemId: key, itemKey: key, slot: def.slot, weaponType: def.weaponType,
    rarity: def.rarity, level: 1, bonus: [], bonusLines: [], locked: false,
    equipped: false, source: 'drop', ...overrides };
}
function fullBag(): OwnedItem[] {
  return Array.from({ length: V2_CONFIG.bag.limit }, (_, i) => item(`bag:${i}`));
}
const rich = { fish: 100000, yarn: 10000, fluffTuft: 1000, shinyButton: 1000,
  catnipCrystal: 1000, starlightScale: 1000, moonPearl: 3, catKey: 5 };
const ready = () => state({ round: CHAPTERS[0]!.roundsPerChapter,
  kills: CHAPTERS[0]!.killsPerRound, stacks: { catKey: 5 } });
const boss: BossApplicationV2 = { won: true, chapter: 1, chest: { stackDeltas: { fish: 10 }, items: [] },
  keyCost: 1, cooldownS: 60, now: 100 };
const claim: ClaimDeltaV2 = { progress: { level: 5, xp: 12, chapter: 1, round: 2, kills: 3, bestStage: 1 },
  stackDeltas: { fish: 10, catKey: 3 }, items: [], gated: true, neededPower: 100, dailyKeyDay: '2026-10-25' };

function freezeDeep<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) freezeDeep(child);
  }
  return value;
}

describe('v2 state and stacks', () => {
  it('exports the state functions beside the existing idle API and creates independent empty saves', () => {
    expect(v2.emptyState).toBe(emptyState);
    expect(v2.computeClaimV2).toBeTypeOf('function');
    const a = success(emptyState()).state;
    expect(a).toEqual({ classId: null, level: 1, xp: 0, chapter: 1, round: 1, kills: 0, bestStage: 0,
      stacks: {}, items: [], bossClears: {}, bossCooldownUntil: null, fights: 0,
      lastDailyKeyDay: null, lastRelicDay: null, progressRev: 0 });
    a.stacks.fish = 5;
    expect(success(emptyState()).state.stacks).toEqual({});
  });

  it('keeps balances nonnegative and capped across 2,000 deterministic random operations', () => {
    const rng = new Rng(12490);
    const ids: StackId[] = ['fish', ...MATERIAL_IDS];
    let stacks: PlayerStateV2['stacks'] = {};
    for (let n = 0; n < 2000; n++) {
      const id = ids[rng.int(0, ids.length - 1)]!;
      const delta = rng.int(-20, 20);
      const before = { ...stacks };
      const result = applyStacks(freezeDeep(stacks), { [id]: delta }, { fish: 100, catKey: 100 });
      if (result.ok) {
        expect(result.added[id]).toBe(result.stacks[id]! - (before[id] ?? 0));
        stacks = result.stacks;
      } else {
        expect(result).toEqual({ ok: false, code: `not_enough:${id}` });
        expect(stacks).toEqual(before);
      }
      for (const qty of Object.values(stacks)) expect(qty).toBeGreaterThanOrEqual(0);
      expect(stacks.catKey ?? 0).toBeLessThanOrEqual(CAT_KEY_CAP);
    }
  });

  it.each(['fish', ...MATERIAL_IDS])('refuses an atomic shortage of %s', (id) => {
    const stacks = freezeDeep({ fish: 5, yarn: 5 });
    expect(applyStacks(stacks, { catKey: 3, [id]: -10 })).toEqual({ ok: false, code: `not_enough:${id}` });
    expect(stacks).toEqual({ fish: 5, yarn: 5 });
  });

  it('uses the key cap of five and returns actual capped credits and debits', () => {
    expect(CAT_KEY_CAP).toBe(5);
    expect(applyStacks({ catKey: 4, fish: 10 }, { catKey: 10, fish: -3 })).toEqual({
      ok: true, stacks: { catKey: 5, fish: 7 }, added: { catKey: 1, fish: -3 } });
    expect(applyStacks({}, { catKey: 9 }, {})).toEqual({ ok: true, stacks: { catKey: 5 }, added: { catKey: 5 } });
    expect(applyStacks({ catKey: 4 }, { catKey: 3 }, { catKey: 4 })).toEqual({
      ok: true, stacks: { catKey: 4 }, added: { catKey: 0 } });
    expect(applyStacks({ fish: 20 }, { fish: 10 }, { fish: 10 })).toEqual({
      ok: true, stacks: { fish: 20 }, added: { fish: 0 } });
    for (const qty of [NaN, Infinity, 0.1, Number.MAX_SAFE_INTEGER + 1])
      expect(applyStacks({}, { yarn: qty })).toEqual({ ok: false, code: 'invalid_request' });
  });

  it('inserts to the bag limit, salvages extras with real gains, and never equips drops', () => {
    const input = freezeDeep(state({ items: fullBag().slice(1) }));
    const drops = freezeDeep([item('kept', undefined, { equipped: true }), item('overflow', 'wpn.sword.silver')]);
    const result = success(addItems(input, drops, V2_CONFIG.bag.limit, salvage));
    expect(result.state.items).toHaveLength(V2_CONFIG.bag.limit);
    expect(result.items.map((entry) => entry.id)).toEqual(['kept']);
    expect(result.items[0]!.equipped).toBe(false);
    expect(result.autoSalvaged).toEqual([{ item: drops[1], gains: salvage(drops[1]!) }]);
    expect(result.state.stacks).toEqual(salvage(drops[1]!));
    expect(result.gains).toEqual(salvage(drops[1]!));
    expect(input.items).toHaveLength(V2_CONFIG.bag.limit - 1);
    expect(success(addItems(state(), [item('zero')], 0, salvage)).autoSalvaged).toHaveLength(1);
    expect(addItems(state(), [item('dup'), item('dup')], 3, salvage)).toEqual({ ok: false, code: 'invalid_request' });
    expect(addItems(state({ items: [item('dup')] }), [item('dup')], 3, salvage))
      .toEqual({ ok: false, code: 'invalid_request' });
  });
});

describe('class and equipment', () => {
  it.each(CLASSES)('$id returns its Common starter for the caller to insert, then equips it', (cls) => {
    const result = success(chooseClass(freezeDeep(state()), cls.id));
    expect(result.state.classId).toBe(cls.id);
    expect(result.state.progressRev).toBe(1);
    expect(result.starterWeapon).toMatchObject({ itemId: cls.starterWeaponId, rarity: 'common', source: 'starter' });
    const inserted = success(addItems(result.state, [result.starterWeapon!], V2_CONFIG.bag.limit, salvage));
    expect(success(equip(inserted.state, result.starterWeapon!.id, 'weapon')).state.items[0]!.equipped).toBe(true);
  });

  it('chooses the strongest owned matching weapon, unequips others, and never gives a duplicate starter', () => {
    const input = state({ items: [item('old', 'wpn.bow.willow', { equipped: true }), item('weak'),
      item('strong', 'wpn.sword.ninelives', { level: 20 })] });
    const result = success(chooseClass(freezeDeep(input), 'warrior'));
    expect(result.starterWeapon).toBeNull();
    expect(result.state.items.filter((entry) => entry.equipped).map((entry) => entry.id)).toEqual(['strong']);
    const changed = success(chooseClass(result.state, 'witch'));
    expect(changed.state.items.every((entry) => !entry.equipped)).toBe(true);
    expect(changed.starterWeapon?.weaponType).toBe('staff');
    expect(chooseClass(input, 'toString')).toEqual({ ok: false, code: 'invalid_request' });
  });

  it('ranks API bonus lines when selecting the best owned weapon', () => {
    const result = success(chooseClass(state({ items: [item('base'), item('bonus', undefined, {
      bonus: [{ stat: 'atk', value: 100 }], bonusLines: undefined,
    })] }), 'warrior'));
    expect(result.state.items.filter((entry) => entry.equipped).map((entry) => entry.id)).toEqual(['bonus']);
  });

  it('maintains at most one equipped item per slot over 2,000 random equips and class switches', () => {
    const rng = new Rng(854);
    let current = state({ level: 60, items: ITEMS.map((def, i) => item(`item:${i}`, def.id)) });
    for (let n = 0; n < 2000; n++) {
      if (n % 11 === 0) current = success(chooseClass(current, CLASSES[rng.int(0, CLASSES.length - 1)]!.id)).state;
      const picked = current.items[rng.int(0, current.items.length - 1)]!;
      const result = equip(current, n % 5 === 0 ? null : picked.id, picked.slot);
      if (result.ok) current = result.state;
      for (const slot of GEAR_SLOT_IDS)
        expect(current.items.filter((entry) => entry.slot === slot && entry.equipped).length).toBeLessThanOrEqual(1);
    }
  });

  it('returns all equipment refusal codes and supports unequipping', () => {
    const input = freezeDeep(state({ items: [item('sword'), item('bow', 'wpn.bow.willow'),
      item('ring', 'acc.ring.paw.common')] }));
    expect(equip({ ...input, classId: null }, 'sword', 'weapon')).toEqual({ ok: false, code: 'no_class' });
    expect(equip(input, 'sword', 'weapon', 'witch')).toEqual({ ok: false, code: 'stale' });
    expect(equip(input, null, 'toString')).toEqual({ ok: false, code: 'invalid_request' });
    expect(equip(input, 'missing', 'weapon')).toEqual({ ok: false, code: 'not_owner' });
    expect(equip(input, 'sword', 'armor')).toEqual({ ok: false, code: 'wrong_slot' });
    expect(equip(input, 'ring', 'ring')).toEqual({ ok: false, code: 'slot_locked' });
    expect(equip(input, 'bow', 'weapon')).toEqual({ ok: false, code: 'wrong_weapon' });
    const equipped = success(equip(input, 'sword', 'weapon')).state;
    expect(success(equip(equipped, null, 'weapon')).state.items.every((entry) => !entry.equipped)).toBe(true);
  });
});

describe('claims and bosses', () => {
  it('applies claims purely, including XP, date, revision, gating, capped keys and overflow yield', () => {
    const input = freezeDeep(state({ items: fullBag(), stacks: { catKey: 4 }, progressRev: 10 }));
    const delta = freezeDeep({ ...claim, items: [item('drop')] });
    const before = JSON.stringify(input);
    const result = success(applyClaim(input, delta));
    expect(JSON.stringify(input)).toBe(before);
    expect(result.state).toMatchObject({ ...claim.progress, progressRev: 11, lastDailyKeyDay: claim.dailyKeyDay,
      stacks: { fish: 10, catKey: 5, ...salvage(delta.items[0]!) } });
    expect(result.stackDeltas).toEqual({ fish: 10, catKey: 1, ...salvage(delta.items[0]!) });
    expect(result.items).toEqual([]);
    expect(result.autoSalvaged).toHaveLength(1);
    expect(result.gated).toBe(true);
    expect(result.neededPower).toBe(100);
    result.state.items[0]!.bonus.push({ stat: 'atk', value: 1 });
    expect(input.items[0]!.bonus).toEqual([]);
    const noDay = { ...claim, dailyKeyDay: undefined };
    expect(success(applyClaim(state({ lastDailyKeyDay: '2026-10-24' }), noDay)).state.lastDailyKeyDay).toBe('2026-10-24');
    expect(applyClaim({ ...input, classId: null }, delta)).toEqual({ ok: false, code: 'no_class' });
    expect(applyClaim(input, delta, 9)).toEqual({ ok: false, code: 'stale' });
    expect(applyClaim(input, { ...delta, stackDeltas: { fish: -1 } })).toEqual({ ok: false, code: 'not_enough:fish' });
  });

  it('accepts the existing V3 delta directly and allocates deterministic, distinct owned ids', () => {
    const delta: IdleClaimDeltaV2 = freezeDeep({ ...claim, items: [
      { itemKey: 'wpn.sword.twig', slot: 'weapon', weaponType: 'sword', rarity: 'common', level: 1,
        bonus: [{ stat: 'atk', value: 1 }], locked: false, equipped: false, source: 'drop' },
      { itemKey: 'wpn.sword.twig', slot: 'weapon', weaponType: 'sword', rarity: 'common', level: 1,
        bonus: [], locked: false, equipped: false, source: 'drop' },
    ] });
    const input = freezeDeep(state({ items: [item('drop:1')] }));
    const result = success(applyClaim(input, delta));
    expect(result.items[0]!.itemId).toBe(delta.items[0]!.itemKey);
    expect(result.items[0]!.bonusLines).toEqual(delta.items[0]!.bonus);
    expect(new Set(result.state.items.map((entry) => entry.id)).size).toBe(3);
    expect(applyClaim(input, delta)).toEqual(result);
    expect(input.items).toHaveLength(1);
    expect('id' in delta.items[0]!).toBe(false);
  });

  it('advances first clear exactly once, counts rematch wins, and spends keys before chest credit', () => {
    const input = freezeDeep(ready());
    const first = success(applyBossResult(input, boss));
    expect(first.firstClear).toBe(true);
    expect(first.state).toMatchObject({ chapter: 2, round: 1, kills: 0, bestStage: 10, progressRev: 1,
      fights: 1, bossClears: { 1: { wins: 1 } }, stacks: { catKey: 4, fish: 10 } });
    const second = success(applyBossResult(first.state, boss));
    expect(second.firstClear).toBe(false);
    expect(second.state).toMatchObject({ chapter: 2, round: 1, fights: 2, progressRev: 2,
      bossClears: { 1: { wins: 2 } }, stacks: { catKey: 3, fish: 20 } });
    expect(applyBossResult(first.state, { ...boss, expectedFights: 0 })).toEqual({ ok: false, code: 'stale' });
    expect(applyBossResult(first.state, { ...boss, expectedProgressRev: 0 })).toEqual({ ok: false, code: 'stale' });
    const keyChest = success(applyBossResult(ready(), { ...boss, chest: { stackDeltas: { catKey: 2 }, items: [] } }));
    expect(keyChest.state.stacks.catKey).toBe(5);
  });

  it('keeps loss keys and chest untouched, sets cooldown, and allows a fight at its expiry', () => {
    const input = ready();
    const loss = success(applyBossResult(input, { ...boss, won: false }));
    expect(loss.state.stacks).toEqual(input.stacks);
    expect(loss.state.bossClears).toEqual({});
    expect(loss.state.progressRev).toBe(0);
    expect(loss.state.fights).toBe(1);
    expect(loss.state.bossCooldownUntil).toBe(160);
    expect(loss.keySpent).toBe(false);
    expect(applyBossResult(loss.state, { ...boss, now: 159 })).toEqual({ ok: false, code: 'cooldown', cooldownUntil: 160 });
    expect(success(applyBossResult(loss.state, { ...boss, now: 160 })).state.bossCooldownUntil).toBeNull();
  });

  it('checks reach, class, keys and malformed arguments, and salvages overflowing chest items', () => {
    expect(applyBossResult({ ...ready(), classId: null }, boss)).toEqual({ ok: false, code: 'no_class' });
    expect(applyBossResult(state(), boss)).toEqual({ ok: false, code: 'not_reached' });
    expect(applyBossResult({ ...ready(), kills: 0 }, boss)).toEqual({ ok: false, code: 'not_reached' });
    expect(applyBossResult(ready(), { ...boss, chapter: 2 })).toEqual({ ok: false, code: 'not_reached' });
    expect(applyBossResult({ ...ready(), stacks: {} }, boss)).toEqual({ ok: false, code: 'no_key' });
    expect(applyBossResult(ready(), { ...boss, keyCost: 0 })).toEqual({ ok: false, code: 'invalid_request' });
    const result = success(applyBossResult({ ...ready(), items: fullBag() }, {
      ...boss, chest: { stackDeltas: {}, items: [item('chest', undefined, { source: 'chest' })] } }));
    expect(result.state.items).toHaveLength(V2_CONFIG.bag.limit);
    expect(result.autoSalvaged).toHaveLength(1);
    expect(result.state.stacks).toEqual({ catKey: 4, yarn: 1, fluffTuft: 2 });
  });
});

describe('forge, salvage and locking', () => {
  it.each(RECIPES)('applies V5 $id costs and seeded rolls, including combat bonus lines', (recipe) => {
    const input = freezeDeep(state({ stacks: rich, bestStage: 7 }));
    const rolled = craft({ stacks: rich, lastRelicDay: -1 }, recipe.id, 'weapon', 'sword', 7, 42);
    const result = success(applyCraft(input, recipe.id, 'weapon', 42, 100));
    expect(result.item).toMatchObject({ itemId: rolled.item.itemKey, level: rolled.item.itemLevel,
      bonus: rolled.item.bonusLines, bonusLines: rolled.item.bonusLines, rarity: recipe.rarity, source: 'craft' });
    for (const [id, cost] of Object.entries(result.spent))
      expect(result.state.stacks[id as StackId]).toBe(rich[id as keyof typeof rich] - cost);
    expect(applyCraft(input, recipe.id, 'weapon', 42, 100)).toEqual(result);
    const again = success(applyCraft(result.state, recipe.id, 'weapon', 42, 100));
    expect(again.item.id).not.toBe(result.item.id);
    expect(new Set(again.state.items.map((entry) => entry.id)).size).toBe(2);
  });

  it('returns craft refusals without spending', () => {
    expect(applyCraft(state({ classId: null }), 'rcp.common', 'weapon', 1, 1)).toEqual({ ok: false, code: 'no_class' });
    expect(applyCraft(state(), 'missing', 'weapon', 1, 1)).toEqual({ ok: false, code: 'invalid_request' });
    expect(applyCraft(state(), 'rcp.common', 'toString', 1, 1)).toEqual({ ok: false, code: 'invalid_request' });
    expect(applyCraft(state(), 'rcp.common', 'weapon', 1, 1)).toEqual({ ok: false, code: 'not_enough', stack: 'yarn' });
    const input = freezeDeep(state({ stacks: rich, items: fullBag() }));
    expect(applyCraft(input, 'rcp.common', 'weapon', 1, 1)).toEqual({ ok: false, code: 'bag_full' });
    expect(input.stacks).toEqual(rich);
  });

  it('salvages atomically, deduplicates ids, locks/unlocks, and rejects equipped or locked items', () => {
    const input = freezeDeep(state({ items: [item('a'), item('b', 'wpn.sword.silver')] }));
    expect(applySalvage(input, [])).toEqual({ ok: false, code: 'invalid_request' });
    expect(applySalvage(input, ['a', 'missing'])).toEqual({ ok: false, code: 'not_owner' });
    const locked = success(lockItem(input, 'b', true)).state;
    expect(applySalvage(locked, ['a', 'b'])).toEqual({ ok: false, code: 'locked' });
    const equipped = success(equip(locked, 'a', 'weapon')).state;
    expect(applySalvage(equipped, ['a', 'b'])).toEqual({ ok: false, code: 'equipped' });
    expect(lockItem(input, 'missing', true)).toEqual({ ok: false, code: 'not_owner' });
    expect(success(lockItem(locked, 'b', false)).state.items[1]!.locked).toBe(false);
    const result = success(applySalvage(input, ['a', 'b', 'a']));
    expect(result.gains).toEqual({ yarn: 9, fluffTuft: 2, shinyButton: 2 });
    expect(result.state.items).toEqual([]);
    expect(input.items).toHaveLength(2);
  });

  it('applies the registry Relic cost once per explicit game day and returns every block reason', () => {
    const today = '2026-10-25';
    const input = freezeDeep(state({ stacks: { yarn: 90, moonPearl: 3 } }));
    expect(applyRelicForge(state({ lastRelicDay: today }), today)).toEqual({
      ok: false, code: 'forge_blocked', reason: 'daily_limit' });
    expect(applyRelicForge(state(), today)).toEqual({ ok: false, code: 'forge_blocked', reason: 'not_enough_yarn' });
    expect(applyRelicForge(state({ stacks: { yarn: 30 } }), today)).toEqual({
      ok: false, code: 'forge_blocked', reason: 'no_moon_pearl' });
    const result = success(applyRelicForge(input, today));
    expect(result.spent).toEqual(RELIC_RECIPE.materials);
    expect(result.state.stacks).toEqual({ yarn: 60, moonPearl: 2 });
    expect(result.state.lastRelicDay).toBe(today);
    expect(applyRelicForge(result.state, today)).toEqual({ ok: false, code: 'forge_blocked', reason: 'daily_limit' });
    expect(success(applyRelicForge(result.state, '2026-10-26')).state.stacks).toEqual({ yarn: 30, moonPearl: 1 });
    for (const date of ['garbage', '2026-02-30', '2026-1-1'])
      expect(applyRelicForge(input, date)).toEqual({ ok: false, code: 'invalid_request' });
  });
});
