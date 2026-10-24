import { describe, expect, it } from 'vitest';
import type { GainsV2, ItemV2, LootV2 } from '../../api/GameApiV2';
import { formatAmount, isEmptyLoot, lootLines } from './lootLines';

const SAMPLE_ITEM: ItemV2 = {
  id: 'item-1',
  itemKey: 'wpn.sword.twig',
  slot: 'weapon',
  weaponType: 'sword',
  rarity: 'common',
  level: 1,
  bonus: [],
  locked: false,
  equipped: false,
};

describe('lootLines', () => {
  it('orders and filters currencies and materials according to canonical rules', () => {
    // fish 10, yarn 0, keys 1, materials { moonPearl: 1, fluffTuft: 3 }
    // -> fish, keys, fluffTuft, moonPearl
    const input = {
      fish: 10,
      yarn: 0,
      keys: 1,
      materials: {
        moonPearl: 1,
        fluffTuft: 3,
      },
    };

    const lines = lootLines(input);

    expect(lines).toEqual([
      { id: 'fish', label: 'Fish', amount: 10 },
      { id: 'keys', label: 'Cat Key', amount: 1 },
      { id: 'fluffTuft', label: 'Fluff Tuft', amount: 3 },
      { id: 'moonPearl', label: 'Moon Pearl', amount: 1 },
    ]);
  });

  it('uses registry names for all labels and applies Math.floor', () => {
    const input = {
      fish: 5.9,
      yarn: 20.4,
      keys: 2.1,
      materials: {
        fluffTuft: 1.8,
        shinyButton: 2,
        catnipCrystal: 3,
        starlightScale: 4,
        moonPearl: 5,
      },
    };

    const lines = lootLines(input);

    expect(lines).toEqual([
      { id: 'fish', label: 'Fish', amount: 5 },
      { id: 'yarn', label: 'Yarn', amount: 20 },
      { id: 'keys', label: 'Cat Key', amount: 2 },
      { id: 'fluffTuft', label: 'Fluff Tuft', amount: 1 },
      { id: 'shinyButton', label: 'Shiny Button', amount: 2 },
      { id: 'catnipCrystal', label: 'Catnip Crystal', amount: 3 },
      { id: 'starlightScale', label: 'Starlight Scale', amount: 4 },
      { id: 'moonPearl', label: 'Moon Pearl', amount: 5 },
    ]);
  });

  it('omits zero and negative amounts', () => {
    const lines = lootLines({
      fish: 0,
      yarn: -1,
      keys: 0,
      materials: {
        fluffTuft: 0,
        shinyButton: -5,
      },
    });

    expect(lines).toEqual([]);
  });
});

describe('isEmptyLoot', () => {
  const EMPTY_BASE: LootV2 = {
    fish: 0,
    yarn: 0,
    keys: 0,
    materials: {},
    items: [],
    autoSalvaged: [],
  };

  it('returns true when all values are zero or empty', () => {
    expect(isEmptyLoot(EMPTY_BASE)).toBe(true);

    const emptyGains: GainsV2 = {
      ...EMPTY_BASE,
      xp: 0,
      levelsGained: 0,
    };
    expect(isEmptyLoot(emptyGains)).toBe(true);
  });

  it('returns false when items is non-empty', () => {
    const loot: LootV2 = {
      ...EMPTY_BASE,
      items: [SAMPLE_ITEM],
    };
    expect(isEmptyLoot(loot)).toBe(false);
  });

  it('returns false when autoSalvaged is non-empty', () => {
    const loot: LootV2 = {
      ...EMPTY_BASE,
      autoSalvaged: [
        {
          itemKey: 'hlm.leather.cap',
          slot: 'helmet',
          rarity: 'common',
          level: 1,
        },
      ],
    };
    expect(isEmptyLoot(loot)).toBe(false);
  });

  it('returns false when xp or levelsGained > 0 in GainsV2', () => {
    const withXp: GainsV2 = {
      ...EMPTY_BASE,
      xp: 1,
      levelsGained: 0,
    };
    expect(isEmptyLoot(withXp)).toBe(false);

    const withLevel: GainsV2 = {
      ...EMPTY_BASE,
      xp: 0,
      levelsGained: 1,
    };
    expect(isEmptyLoot(withLevel)).toBe(false);
  });

  it('returns false when currencies or materials are positive', () => {
    expect(isEmptyLoot({ ...EMPTY_BASE, fish: 1 })).toBe(false);
    expect(isEmptyLoot({ ...EMPTY_BASE, yarn: 1 })).toBe(false);
    expect(isEmptyLoot({ ...EMPTY_BASE, keys: 1 })).toBe(false);
    expect(isEmptyLoot({ ...EMPTY_BASE, materials: { fluffTuft: 1 } })).toBe(false);
  });
});

describe('formatAmount', () => {
  it('formats small amounts with comma separators and no M suffix', () => {
    expect(formatAmount(0)).toBe('0');
    expect(formatAmount(999)).toBe('999');
    expect(formatAmount(1000)).toBe('1,000');
    expect(formatAmount(1234)).toBe('1,234');
    expect(formatAmount(999_999)).toBe('999,999');
  });

  it('formats amounts >= 1,000,000 using the M rule', () => {
    // Under 10M: up to 2 decimals, trimming trailing zeros
    expect(formatAmount(1_000_000)).toBe('1M');
    expect(formatAmount(1_200_000)).toBe('1.2M');
    expect(formatAmount(1_250_000)).toBe('1.25M');
    expect(formatAmount(1_256_000)).toBe('1.26M');

    // 10M and above: up to 1 decimal, trimming trailing zeros
    expect(formatAmount(10_000_000)).toBe('10M');
    expect(formatAmount(12_345_678)).toBe('12.3M');
    expect(formatAmount(100_000_000)).toBe('100M');
  });
});
