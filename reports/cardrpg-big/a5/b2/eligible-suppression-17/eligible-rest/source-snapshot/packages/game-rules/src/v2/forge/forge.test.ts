import { describe, expect, it, vi } from 'vitest';
import { v2 } from '../../index';
import { dayIndex, rollRelicRarity as rollV1 } from '../../rules';
import { CLASSES } from '../content/classes';
import { ITEMS } from '../content/items';
import { GEAR_RARITIES } from '../content/rarities';
import { RECIPES, RELIC_RECIPE, SALVAGE, type MaterialCost } from '../content/recipes';
import { GEAR_SLOT_IDS } from '../content/slots';
import { BONUS_LINE_RANGES, STATS } from '../content/stats';
import { craft, craftBlock, relicForgeBlockV2, rollRelicRarity, salvage, type ForgeState } from './index';

// Production gear recipes do not yet spend Moon Pearls. A test-only recipe exercises every
// ordered shortage, deliberately declaring its costs in the opposite order.
vi.mock('../content/recipes', async (importOriginal) => {
  const original = await importOriginal<typeof import('../content/recipes')>();
  return {
    ...original,
    RECIPES: [...original.RECIPES, {
      id: 'test.order', rarity: 'common', fish: 1,
      materials: { moonPearl: 1, starlightScale: 1, catnipCrystal: 1, shinyButton: 1, fluffTuft: 1, yarn: 1 },
    }],
  };
});

const recipes = RECIPES.filter((recipe) => recipe.id !== 'test.order');
const rich: ForgeState = Object.freeze({
  stacks: Object.freeze({
    yarn: 1_000_000, fluffTuft: 1_000_000, shinyButton: 1_000_000,
    catnipCrystal: 1_000_000, starlightScale: 1_000_000, moonPearl: 1_000_000, fish: 1_000_000,
  }),
  lastRelicDay: -1,
});
const materialValue = (materials: MaterialCost): number =>
  Object.values(materials).reduce((total, count) => total + count, 0);

describe('craftBlock', () => {
  it('validates recipe before slot, and slot before costs', () => {
    const empty: ForgeState = { stacks: {}, lastRelicDay: -1 };
    expect(craftBlock(empty, 'missing', 'missing')).toBe('unknown_recipe');
    expect(craftBlock(empty, 'toString', 'weapon')).toBe('unknown_recipe');
    expect(craftBlock(empty, recipes[0]!.id, 'missing')).toBe('unknown_slot');
    expect(craftBlock(empty, recipes[0]!.id, 'toString')).toBe('unknown_slot');
    expect(craftBlock(empty, recipes[0]!.id, 'weapon')).toBe('not_enough_yarn');
  });

  it('returns every exact shortage in the required order, including Moon Pearl before Fish', () => {
    const state: ForgeState = { stacks: {}, lastRelicDay: -1 };
    const order = ['yarn', 'fluffTuft', 'shinyButton', 'catnipCrystal', 'starlightScale', 'moonPearl', 'fish'] as const;
    for (const id of order) {
      expect(craftBlock(state, 'test.order', 'weapon')).toBe(`not_enough_${id}`);
      state.stacks[id] = 1;
    }
    expect(craftBlock(state, 'test.order', 'weapon')).toBeNull();
  });

  it.each(recipes)('$id accepts exact balances and rejects one unit short of each cost', (recipe) => {
    const state: ForgeState = { stacks: { ...recipe.materials, fish: recipe.fish }, lastRelicDay: -1 };
    expect(craftBlock(state, recipe.id, 'weapon')).toBeNull();
    for (const [id, cost] of Object.entries(state.stacks)) {
      expect(craftBlock({ ...state, stacks: { ...state.stacks, [id]: cost - 1 } }, recipe.id, 'weapon'))
        .toBe(`not_enough_${id}`);
    }
  });

  it('does not require unused materials or Cat Keys', () => {
    expect(craftBlock({ stacks: { yarn: 10, fluffTuft: 4, fish: 50 }, lastRelicDay: -1 },
      'rcp.common', 'charm')).toBeNull();
  });
});

describe('craft and salvage', () => {
  it('exports the forge API through v2', () => {
    expect(v2.craft).toBe(craft);
    expect(v2.craftBlock).toBe(craftBlock);
    expect(v2.salvage).toBe(salvage);
    expect(v2.relicForgeBlockV2).toBe(relicForgeBlockV2);
    expect(v2.rollRelicRarity).toBe(rollV1);
  });

  it.each(recipes)('$id always loses Yarn-equivalent value when crafted then salvaged', (recipe) => {
    for (const slot of GEAR_SLOT_IDS) {
      for (let seed = 0; seed < 32; seed++) {
        const { item, spent } = craft(rich, recipe.id, slot, 'sword', 100, seed);
        expect(spent).toEqual({ materials: recipe.materials, fish: recipe.fish });
        expect(salvage(item)).toEqual(SALVAGE.find((entry) => entry.rarity === item.rarity)!.materials);
        expect(materialValue(salvage(item))).toBeLessThan(materialValue(spent.materials) + spent.fish * 0.01);
      }
    }
  });

  it.each(GEAR_RARITIES)('$id rolls exactly its bonus line count from eligible content ranges', (rarity) => {
    const recipe = recipes.find((entry) => entry.rarity === rarity.id)!;
    for (let seed = 0; seed < 128; seed++) {
      const { item } = craft(rich, recipe.id, 'weapon', 'bow', 12, seed);
      expect(item.rarity).toBe(rarity.id);
      expect(item.bonusLines).toHaveLength(rarity.bonusLines);
      expect(new Set(item.bonusLines.map((line) => line.stat)).size).toBe(rarity.bonusLines);
      for (const { stat, value } of item.bonusLines) {
        expect(STATS.find((entry) => entry.id === stat)?.bonusLine).toBe(true);
        const [min, max] = BONUS_LINE_RANGES[stat]![rarity.id];
        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThanOrEqual(max);
      }
    }
  });

  it('uses the selected slot, recipe rarity and every class weapon type with a matching catalog id', () => {
    for (const recipe of recipes) {
      for (const slot of GEAR_SLOT_IDS) {
        for (const cls of CLASSES) {
          const { item } = craft(rich, recipe.id, slot, cls.weaponType, 8, 42);
          const definition = ITEMS.find((entry) => entry.id === item.itemKey)!;
          expect(item.slot).toBe(slot);
          expect(item.rarity).toBe(recipe.rarity);
          expect(item.weaponType).toBe(slot === 'weapon' ? cls.weaponType : undefined);
          expect(definition.slot).toBe(slot);
          expect(definition.rarity).toBe(item.rarity);
          expect(definition.weaponType).toBe(item.weaponType);
        }
      }
    }
  });

  it.each(GEAR_RARITIES)('$id derives integer levels from bestStage within its cap', (rarity) => {
    const recipe = recipes.find((entry) => entry.rarity === rarity.id)!;
    for (const bestStage of [-10, 0, 1, 2, 7.9, rarity.maxLevel - 1, rarity.maxLevel, 500, Number.MAX_SAFE_INTEGER]) {
      const { item } = craft(rich, recipe.id, 'ring', 'staff', bestStage, 1);
      expect(item.itemLevel).toBe(Math.min(rarity.maxLevel, Math.max(1, Math.floor(bestStage))));
      expect(item.itemLevel).toBeLessThanOrEqual(rarity.maxLevel);
    }
  });

  it('is repeatable per seed and produces different rolls across seeds', () => {
    const results = [];
    for (let seed = 0; seed < 64; seed++) {
      const args = [rich, 'rcp.legendary', 'helmet', 'hammer', 18, seed] as const;
      expect(craft(...args)).toEqual(craft(...args));
      results.push(JSON.stringify(craft(...args).item));
    }
    expect(new Set(results).size).toBeGreaterThan(1);
  });

  it('rejects blocked crafts and nonfinite stages', () => {
    expect(() => craft(rich, 'missing', 'weapon', 'sword', 1, 1)).toThrow('unknown_recipe');
    expect(() => craft(rich, 'rcp.common', 'missing', 'sword', 1, 1)).toThrow('unknown_slot');
    expect(() => craft({ stacks: {}, lastRelicDay: -1 }, 'rcp.common', 'weapon', 'sword', 1, 1))
      .toThrow('not_enough_yarn');
    for (const stage of [NaN, Infinity, -Infinity]) {
      expect(() => craft(rich, 'rcp.common', 'weapon', 'sword', stage, 1)).toThrow(RangeError);
    }
  });

  it('never changes caller state or shares mutable results with registry data or subsequent rolls', () => {
    const before = JSON.stringify(rich);
    const original = craft(rich, 'rcp.legendary', 'weapon', 'sword', 50, 42);
    const changed = craft(rich, 'rcp.legendary', 'weapon', 'sword', 50, 42);
    changed.spent.materials.yarn = 0;
    changed.item.bonusLines[0]!.value = -1;
    const returned = salvage(original.item);
    returned.yarn = 0;
    expect(salvage(original.item)).toEqual({ yarn: 50, starlightScale: 1 });
    expect(craft(rich, 'rcp.legendary', 'weapon', 'sword', 50, 42)).toEqual(original);
    expect(JSON.stringify(rich)).toBe(before);
  });
});

describe('Relic forge v2', () => {
  it('uses 30 Yarn + 1 Moon Pearl, with daily limit then Yarn then Pearl checks', () => {
    expect(RELIC_RECIPE.materials).toEqual({ yarn: 30, moonPearl: 1 });
    expect(RELIC_RECIPE.perDay).toBe(1);
    expect(relicForgeBlockV2({ stacks: {}, lastRelicDay: 100 }, 100)).toBe('daily_limit');
    expect(relicForgeBlockV2({ stacks: {}, lastRelicDay: -1 }, 100)).toBe('not_enough_yarn');
    expect(relicForgeBlockV2({ stacks: { yarn: 29, moonPearl: 1 }, lastRelicDay: -1 }, 100))
      .toBe('not_enough_yarn');
    expect(relicForgeBlockV2({ stacks: { yarn: 30, catKey: 5 }, lastRelicDay: -1 }, 100))
      .toBe('no_moon_pearl');
    expect(relicForgeBlockV2({ stacks: { yarn: 30, moonPearl: 0 }, lastRelicDay: -1 }, 100))
      .toBe('no_moon_pearl');
    expect(relicForgeBlockV2({ stacks: { yarn: 30, moonPearl: 1 }, lastRelicDay: -1 }, 100)).toBeNull();
  });

  it('blocks a second forge until the next UTC+7 game day after the caller records success', () => {
    const beforeMidnight = Date.UTC(2026, 9, 24, 16, 59, 59) / 1000;
    const today = dayIndex(beforeMidnight);
    const state: ForgeState = { stacks: { yarn: 90, moonPearl: 3 }, lastRelicDay: -1 };
    expect(relicForgeBlockV2(state, today)).toBeNull();
    const after: ForgeState = { stacks: { yarn: 60, moonPearl: 2 }, lastRelicDay: today };
    for (let repeat = 0; repeat < 5; repeat++) expect(relicForgeBlockV2(after, today)).toBe('daily_limit');
    expect(dayIndex(beforeMidnight + 1)).toBe(today + 1);
    expect(relicForgeBlockV2(after, dayIndex(beforeMidnight + 1))).toBeNull();
    expect(state).toEqual({ stacks: { yarn: 90, moonPearl: 3 }, lastRelicDay: -1 });
    expect(relicForgeBlockV2(rich, today)).toBeNull();
  });

  it('re-exports the identical v1 rarity function and preserves every sampled seed outcome', () => {
    expect(rollRelicRarity).toBe(rollV1);
    for (let seed = 0; seed < 10_000; seed++) expect(rollRelicRarity(seed)).toBe(rollV1(seed));
    for (const seed of [0xffffffff, 0x80000000, -1]) expect(rollRelicRarity(seed)).toBe(rollV1(seed));
  });
});
