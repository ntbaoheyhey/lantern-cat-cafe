import { describe, expect, it } from 'vitest';
import { CHAPTERS, ITEMS, FISH_UNIT, SMART_LOOT } from '../content';
import { emptyState } from '../state';
import type { OwnedItem, PlayerStateV2 } from '../state/types';
import { deriveStats, bossOfChapter, simulateBossV2 } from '../combat';
import { xpToNextV2 } from '../idle';
import { itemViewV2, unlockedSlotsV2, stateViewV2, frontierV2, lootViewV2, gainsViewV2, rollChestV2, timelineViewV2, claimInputV2, gateOfV2 } from './index';
function empty(): PlayerStateV2 { const r = emptyState(); if (!r.ok) throw new Error('empty'); return r.state; }
const ctx = { nowS: 0, forge: null, founder: false, gate: { gated: false, neededPower: 0 } };

describe('v2 pure views', () => {
  it('copies only public item fields, omits absent weapon type, and isolates bonuses', () => {
    const item: OwnedItem = { id: 'a', itemId: 'armor', itemKey: 'armor', slot: 'armor', rarity: 'rare', level: 2, bonus: [{ stat: 'hp', value: 1 }], bonusLines: [], locked: false, equipped: false, source: 'chest' };
    const view = itemViewV2(item);
    expect(Object.keys(view).sort()).toEqual(['id', 'itemKey', 'slot', 'rarity', 'level', 'bonus', 'locked', 'equipped'].sort());
    expect('weaponType' in view).toBe(false);
    view.bonus[0]!.value = 99; expect(item.bonus[0]!.value).toBe(1);
  });
  it('unlocks slots in registry order at levels 1, 5, 10 and 20', () => {
    const base = ['weapon', 'helmet', 'armor', 'gloves', 'boots', 'collar'];
    expect(unlockedSlotsV2(1)).toEqual(base);
    expect(unlockedSlotsV2(5)).toEqual([...base, 'earring']);
    expect(unlockedSlotsV2(10)).toEqual([...base, 'earring', 'ring']);
    expect(unlockedSlotsV2(19)).not.toContain('charm');
    expect(unlockedSlotsV2(20)).toEqual([...base, 'earring', 'ring', 'charm']);
  });
  it('builds a complete empty snapshot and expires cooldown at equality', () => {
    const state = empty(); const view = stateViewV2(state, ctx);
    expect(Object.values(view.equipped)).toEqual(Array(9).fill(null));
    expect(view.materials).toEqual({}); expect(view.currencies).toEqual({ fish: 0, yarn: 0, keys: 0 });
    expect(view.bosses.chapters).toEqual(CHAPTERS.map(ch => ({ chapter: ch.index, wins: 0, cleared: false })));
    expect(view.bosses.cooldownUntil).toBeNull();
    state.bossCooldownUntil = 1000;
    expect(stateViewV2(state, { ...ctx, nowS: 999 }).bosses.cooldownUntil).toBe(1000);
    expect(stateViewV2(state, { ...ctx, nowS: 1000 }).bosses.cooldownUntil).toBeNull();
  });
  it('clamps the post-final-boss frontier and leaves earlier chapters unchanged', () => {
    expect(frontierV2({ chapter: 6, round: 1, kills: 0 })).toEqual({ chapter: 5, round: 10, kills: CHAPTERS[4]!.killsPerRound });
    expect(frontierV2({ chapter: 3, round: 4, kills: 2 })).toEqual({ chapter: 3, round: 4, kills: 2 });
    const state = { ...empty(), classId: 'warrior' as const, chapter: 6 };
    expect(claimInputV2(state, { today: '2026-10-25', offline: false }).chapter).toBe(5);
    expect(gateOfV2(state, '2026-10-25')).toEqual({ gated: false, neededPower: 0 });
  });
  it('separates stacks, omits zero materials and counts XP over level boundaries', () => {
    const loot = lootViewV2({ fish: 3, yarn: 2, catKey: 1, moonPearl: 2, fluffTuft: 0 }, [], []);
    expect(loot).toEqual({ fish: 3, yarn: 2, keys: 1, materials: { moonPearl: 2 }, items: [], autoSalvaged: [] });
    expect(gainsViewV2({ level: 1, xp: 50 }, { level: 2, xp: 10 }, loot)).toMatchObject({ xp: xpToNextV2(1) - 50 + 10, levelsGained: 1 });
    expect(gainsViewV2({ level: 2, xp: 10 }, { level: 2, xp: 19 }, loot).xp).toBe(9);
    expect(gainsViewV2({ level: 1, xp: 50 }, { level: 3, xp: 10 }, loot).xp).toBe(xpToNextV2(1) + xpToNextV2(2) - 40);
  });
  it('rolls deterministic, valid first-clear and repeat chests with smart weapons', () => {
    const input = { chapter: 1, firstClear: true, classId: 'warrior' as const, level: 30 };
    let weapons = 0; let own = 0; let differs = false;
    for (let seed = 1; seed <= 200; seed++) {
      const chest = rollChestV2(input, seed);
      expect(chest).toEqual(rollChestV2(input, seed));
      expect((chest.stackDeltas.fish ?? 0) % FISH_UNIT).toBe(0);
      if (seed <= 50 && JSON.stringify(chest) !== JSON.stringify(rollChestV2({ ...input, firstClear: false }, seed))) differs = true;
      for (const item of chest.items) {
        expect(ITEMS.some(def => def.id === item.itemKey && def.slot === item.slot && def.rarity === item.rarity)).toBe(true);
        if (item.slot === 'weapon') { weapons++; if (item.weaponType === 'sword') own++; }
      }
    }
    expect(differs).toBe(true); expect(weapons).toBeGreaterThan(0);
    expect(own / weapons).toBeGreaterThan(0.45); expect(own / weapons).toBeLessThan(0.75);
    expect(SMART_LOOT.classWeaponShare).toBe(0.6);
    // Accessory fallback is available even for a level-one cat; all chapters have candidates.
    for (let chapter = 1; chapter <= CHAPTERS.length; chapter++) expect(rollChestV2({ ...input, chapter, level: 1 }, 5).items.length).toBeGreaterThan(0);
  });
  it('strips internal timeline fields and never emits undefined', () => {
    const result = simulateBossV2(deriveStats({ classId: 'witch', level: 10 }, []), 'witch', bossOfChapter(1), 10);
    const view = timelineViewV2(result.log);
    expect(view).toHaveLength(result.log.length);
    for (const event of view) expect(Object.values(event).every(v => v !== undefined)).toBe(true);
    expect(timelineViewV2([{ t: 0, type: 'attack_start', attack: 1 }, { t: 1, type: 'boss_windup', big: true }, { t: 2, type: 'end', won: false }])).toEqual([{ t: 0, type: 'attack_start' }, { t: 1, type: 'boss_windup', big: true }, { t: 2, type: 'end' }]);
  });
  it('preserves true and false boss impact flags without undefined fields', () => {
    expect(timelineViewV2([
      { t: 1, type: 'boss_impact', big: true, dodged: true, damage: 0, catHp: 100 },
      { t: 2, type: 'boss_impact', big: false, dodged: false, damage: 5, catHp: 95 },
    ])).toEqual([
      { t: 1, type: 'boss_impact', big: true, dodged: true, damage: 0, catHp: 100 },
      { t: 2, type: 'boss_impact', big: false, dodged: false, damage: 5, catHp: 95 },
    ]);
  });
  it('rejects classless claims and maps keys and equipped bonuses', () => {
    const state = empty(); expect(() => claimInputV2(state, { today: '2026-10-25', offline: false })).toThrow('no_class');
    expect(gateOfV2(state, '2026-10-25')).toEqual({ gated: false, neededPower: 0 });
    state.classId = 'warrior'; state.stacks.catKey = 3;
    expect(claimInputV2(state, { today: '2026-10-25', offline: true })).toMatchObject({ keysHeld: 3, offline: true });
  });
});
