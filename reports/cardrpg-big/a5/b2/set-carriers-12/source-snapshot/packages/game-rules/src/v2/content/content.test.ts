import { describe, expect, it } from 'vitest';
import { relicIdOf, v2, RARITIES } from '../../index';
import {
  CHAPTERS,
  CHESTS,
  CLASSES,
  CODE_KEY,
  CONTENT,
  GEAR_RARITIES,
  GEAR_SLOTS,
  ITEMS,
  MATERIALS,
  MONSTERS,
  STORED_ID,
  validateContent,
  type ContentRegistry,
  type ItemDef,
} from './index';

const withPatch = (patch: Partial<ContentRegistry>): ContentRegistry => ({ ...CONTENT, ...patch });

describe('v2 content registry', () => {
  it('is consistent', () => {
    expect(validateContent()).toEqual([]);
  });

  it('is exported as the v2 namespace from the package root', () => {
    expect(v2.CLASSES).toBe(CLASSES);
    expect(v2.validateContent()).toEqual([]);
  });

  it('uses unique ids in the expected format', () => {
    const stored = [
      ...ITEMS.map((i) => i.id),
      ...CLASSES.map((c) => c.id),
      ...GEAR_SLOTS.map((s) => s.id),
      ...GEAR_RARITIES.map((r) => r.id),
      ...MONSTERS.map((m) => m.id),
      ...CHAPTERS.map((c) => c.id),
      ...Object.keys(CHESTS),
    ];
    for (const id of stored) expect(id).toMatch(STORED_ID);
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
    expect(new Set(MONSTERS.map((m) => m.id)).size).toBe(MONSTERS.length);
    for (const m of MATERIALS) expect(m.id).toMatch(CODE_KEY);
  });

  it('has the planned amounts of content', () => {
    expect(CLASSES).toHaveLength(7);
    expect(new Set(CLASSES.map((c) => c.weaponType)).size).toBe(7);
    expect(ITEMS.filter((i) => i.slot === 'weapon')).toHaveLength(35);
    expect(ITEMS.filter((i) => ['helmet', 'armor', 'gloves', 'boots'].includes(i.slot))).toHaveLength(60);
    expect(ITEMS.filter((i) => ['collar', 'earring', 'ring', 'charm'].includes(i.slot))).toHaveLength(60);
    expect(CHAPTERS).toHaveLength(5);
    expect(CHAPTERS.map((c) => c.killsPerRound)).toEqual([6, 10, 10, 10, 10]);
    expect(GEAR_SLOTS.filter((s) => s.group === 'accessory').map((s) => s.unlockLevel)).toEqual([1, 5, 10, 20]);
    expect(GEAR_RARITIES.map((r) => [r.statMultiplier, r.bonusLines, r.maxLevel])).toEqual([
      [1, 0, 10],
      [1.3, 1, 20],
      [1.7, 2, 30],
      [2.3, 3, 40],
      [3.2, 4, 50],
    ]);
  });

  it('keeps chapter 1 chests at the plan numbers', () => {
    const first = CHESTS['chest.ch1.first'];
    expect(first?.lines[0]?.count).toEqual([30, 50]); // x10 Fish = 300-500
    expect(first?.lines[1]?.count).toEqual([15, 25]);
    expect(first?.lines.map((l) => l.chance)).toEqual([1, 1, 1, 0.4, 1, 0.5, 1]);
    const weights = CHESTS['gear.ch1.first.main']?.lines[0]?.pick.map((e) => [('rarity' in e.value && e.value.rarity) || '', e.weight]);
    expect(weights).toEqual([
      ['uncommon', 60],
      ['rare', 30],
      ['epic', 9],
      ['legendary', 1],
    ]);
    expect(CHESTS['chest.ch1.repeat']?.lines.map((l) => l.chance)).toEqual([1, 1, 1, 0.2, 0.7, 0.25, 0.3]);
  });

  it('snapshots every item id so renames show up in review', () => {
    expect(ITEMS.map((i) => i.id)).toMatchSnapshot();
  });

  it('does not touch the on-chain Relic tiers', () => {
    expect(RARITIES.map((r) => [r.id, r.relicId])).toEqual([
      ['common', 1],
      ['rare', 2],
      ['epic', 3],
      ['legendary', 4],
    ]);
    expect(['common', 'rare', 'epic', 'legendary'].map((r) => relicIdOf(r as 'common'))).toEqual([1, 2, 3, 4]);
  });

  it('accepts a new item with a single entry', () => {
    const dummy: ItemDef = {
      id: 'wpn.sword.test',
      slot: 'weapon',
      weaponType: 'sword',
      rarity: 'rare',
      name: 'Test Sword',
      baseStats: { atk: 9 },
      visual: { set: 'sword', palette: 'rare' },
      dropChapters: [1],
    };
    expect(validateContent(withPatch({ items: [...ITEMS, dummy] }))).toEqual([]);
  });

  describe('catches broken content', () => {
    const first = ITEMS[0] as ItemDef;
    const cases: [string, Partial<ContentRegistry>, RegExp][] = [
      ['duplicate item id', { items: [...ITEMS, first] }, /duplicate item id/],
      ['bad id format', { items: [...ITEMS, { ...first, id: 'Wpn Bad' }] }, /does not match/],
      ['unknown slot', { items: [...ITEMS, { ...first, id: 'x.1', slot: 'tail' as 'weapon' }] }, /unknown slot/],
      ['missing primary stat', { items: [...ITEMS, { ...first, id: 'x.2', baseStats: { hp: 1 } }] }, /missing primary stat atk/],
      ['flat stat on accessory', { items: [...ITEMS, { ...first, id: 'x.3', slot: 'ring', weaponType: undefined }] }, /secondary stats only/],
      ['unknown drop chapter', { items: [...ITEMS, { ...first, id: 'x.4', dropChapters: [9] }] }, /unknown chapter 9/],
      [
        'starter weapon of the wrong type',
        { classes: CLASSES.map((c) => (c.id === 'warrior' ? { ...c, starterWeaponId: 'wpn.bow.willow' } : c)) },
        /starter weapon must be a common sword/,
      ],
      ['chapter without boss', { chapters: CHAPTERS.map((c) => (c.index === 2 ? { ...c, boss: 'mon.nope' } : c)) }, /mon.nope not found/],
      [
        'chapter without chest',
        { chapters: CHAPTERS.map((c) => (c.index === 3 ? { ...c, chests: { ...c.chests, repeat: 'chest.none' } } : c)) },
        /chest chest.none not found/,
      ],
      [
        'zero weight',
        { chests: { ...CHESTS, 'chest.bad': { id: 'chest.bad', lines: [{ chance: 1, count: [1, 1], pick: [{ weight: 0, value: { kind: 'fish', amount: 1 } }] }] } } },
        /weight must be > 0/,
      ],
      [
        'unknown nested table',
        { chests: { ...CHESTS, 'chest.bad': { id: 'chest.bad', lines: [{ chance: 1, count: [1, 1], pick: [{ weight: 1, value: { table: 'nope' } }] }] } } },
        /unknown table nope/,
      ],
      [
        'nested cycle',
        {
          chests: {
            ...CHESTS,
            'a.a': { id: 'a.a', lines: [{ chance: 1, count: [1, 1], pick: [{ weight: 1, value: { table: 'b.b' } }] }] },
            'b.b': { id: 'b.b', lines: [{ chance: 1, count: [1, 1], pick: [{ weight: 1, value: { table: 'a.a' } }] }] },
          },
        },
        /cycle/,
      ],
      ['missing coverage', { items: ITEMS.filter((i) => i.id !== 'arm.cozy.boots.epic') }, /chapter ch1: no epic boots drops/],
    ];
    it.each(cases)('%s', (_name, patch, expected) => {
      const errs = validateContent(withPatch(patch));
      expect(errs.some((e) => expected.test(e)), errs.join('\n')).toBe(true);
    });
  });
});
