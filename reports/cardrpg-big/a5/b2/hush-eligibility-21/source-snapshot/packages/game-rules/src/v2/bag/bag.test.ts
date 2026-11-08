import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { deriveStats, powerRating } from '../combat/stats';
import type { CatState } from '../combat/types';
import { V2_CONFIG } from '../config';
import { CLASSES, GEAR_RARITIES, GEAR_RARITY_IDS, GEAR_SLOTS, ITEMS, STAT_IDS, type ItemDef } from '../content';
import { bagUsage, bestLoadout, compareItems, salvageCandidates, sortItems, type BagItem } from './index';

const cat: CatState = { classId: 'warrior', level: 20 };
function item(id: string, itemKey = 'wpn.sword.twig', extra: Partial<BagItem> = {}): BagItem {
  const def = ITEMS.find((entry) => entry.id === itemKey)!;
  return { id, itemKey, slot: def.slot, weaponType: def.weaponType, rarity: def.rarity, level: 1, bonus: [], locked: false, equipped: false, ...extra };
}

/** Independent API-to-engine adapter used to check returned power and stat differences. */
function engineStats(catState: CatState, worn: readonly BagItem[]) {
  const defs = new Map<string, ItemDef>(worn.map((entry) => [entry.id, {
    ...ITEMS.find((def) => def.id === entry.itemKey)!, id: entry.id, rarity: entry.rarity,
  }]));
  return deriveStats(catState, worn.map((entry) => ({ itemId: entry.id, level: entry.level, bonusLines: entry.bonus })), defs);
}
function apply(items: readonly BagItem[], ids: readonly string[]) {
  const replacements = items.filter((entry) => ids.includes(entry.id));
  return items.map((entry) => ({
    ...entry,
    equipped: ids.includes(entry.id) || (entry.equipped && !replacements.some((next) => next.slot === entry.slot)),
  }));
}

/** Independent uncapped contributions for proving salvage never destroys a stat tradeoff. */
function rawStats(entry: BagItem) {
  const def = ITEMS.find((candidate) => candidate.id === entry.itemKey)!;
  const rarity = GEAR_RARITIES.find((candidate) => candidate.id === entry.rarity)!;
  return STAT_IDS.map((stat) => (def.baseStats[stat] ?? 0) * rarity.statMultiplier
    * (1 + V2_CONFIG.cat.itemLevelGrowth * (Math.min(entry.level, rarity.maxLevel) - 1))
    + entry.bonus.filter((line) => line.stat === stat).reduce((total, line) => total + line.value, 0));
}

describe('compareItems', () => {
  it('reports identical items as same, including zero differences for every derived stat', () => {
    const worn = item('worn', 'wpn.sword.twig', { equipped: true });
    const result = compareItems(cat, [worn], item('copy'));
    expect(result.verdict).toBe('same');
    expect(result.powerBefore).toBe(result.powerAfter);
    expect(result.stats).toHaveLength(Object.keys(engineStats(cat, [worn])).length - 2);
    expect(result.stats.every((stat) => stat.delta === 0 && stat.before === stat.after)).toBe(true);
  });

  it('calls a higher rarity weapon better and the reverse worse', () => {
    const common = item('common');
    const rare = item('rare', 'wpn.sword.silver');
    expect(compareItems(cat, [common], rare).verdict).toBe('better');
    expect(compareItems(cat, [rare], common).verdict).toBe('worse');
  });

  it('uses API rarity and instance bonuses, even with the same catalog key', () => {
    const common = item('common');
    const rare = item('rare', common.itemKey, { rarity: 'rare', bonus: [{ stat: 'critChance', value: 0.05 }] });
    const result = compareItems(cat, [common], rare);
    expect(result.verdict).toBe('better');
    expect(result.stats.find((stat) => stat.stat === 'atk')!.after).toBe(engineStats(cat, [rare]).atk);
    expect(result.stats.find((stat) => stat.stat === 'critChance')!.delta).toBeCloseTo(0.05);
  });

  it('replaces only the candidate slot and derives capped stats and attack interval', () => {
    const armor = item('armor', 'arm.cozy.armor.rare');
    const boots = item('boots', 'arm.cozy.boots.common');
    const upgrade = item('new', boots.itemKey, { bonus: [{ stat: 'attackSpeed', value: 2 }, { stat: 'dodge', value: 2 }] });
    const result = compareItems(cat, [armor, boots], upgrade);
    const expected = engineStats(cat, [armor, upgrade]);
    for (const stat of result.stats) expect(stat.after).toBe(expected[stat.stat]);
    expect(result.stats.find((stat) => stat.stat === 'attackIntervalMs')!.delta).toBeLessThan(0);
    expect(expected.dodge).toBe(V2_CONFIG.caps.dodge);
  });

  it('ignores locked-by-level accessories and wrong-class weapons through deriveStats', () => {
    const lowCat = { ...cat, level: 1 };
    expect(compareItems(lowCat, [], item('ring', 'acc.ring.paw.legendary')).verdict).toBe('same');
    expect(compareItems(lowCat, [], item('bow', 'wpn.bow.aurora')).verdict).toBe('same');
  });
});

describe('bestLoadout', () => {
  it('improves power, returns only final changes, and is idempotent after applying them', () => {
    const bag = [item('worn', 'wpn.sword.twig', { equipped: true }), item('rare', 'wpn.sword.silver'), item('best', 'wpn.sword.ninelives')];
    const result = bestLoadout(cat, bag);
    expect(result.equip).toEqual(['best']);
    expect(result.powerAfter).toBeGreaterThan(result.powerBefore);
    expect(bestLoadout(cat, apply(bag, result.equip))).toEqual({ equip: [], powerBefore: result.powerAfter, powerAfter: result.powerAfter });
  });

  it.each(CLASSES)('restricts weapons to $id class', (cls) => {
    const bag = ITEMS.filter((def) => def.slot === 'weapon').map((def) => item(def.id, def.id));
    const result = bestLoadout({ classId: cls.id, level: 1 }, bag);
    expect(result.equip).toHaveLength(1);
    expect(bag.find((entry) => entry.id === result.equip[0])!.weaponType).toBe(cls.weaponType);
  });

  it('skips locked accessory slots at level 1 but permits the unlocked collar', () => {
    const bag = [item('earring', 'acc.earring.feather.legendary'), item('ring', 'acc.ring.paw.legendary'), item('charm', 'acc.charm.star.legendary'), item('collar', 'acc.collar.bell.legendary')];
    expect(bestLoadout({ ...cat, level: 1 }, bag).equip).toEqual(['collar']);
    expect(bestLoadout(cat, bag).equip).toHaveLength(bag.length);
  });

  it('retains ties and allows locked items to be equipped', () => {
    const worn = item('worn', 'wpn.sword.twig', { equipped: true });
    expect(bestLoadout(cat, [worn, item('tie')]).equip).toEqual([]);
    expect(bestLoadout(cat, [item('locked', 'wpn.sword.ninelives', { locked: true })]).equip).toEqual(['locked']);
    expect(bestLoadout(cat, []).equip).toEqual([]);
  });
});

describe('salvageCandidates', () => {
  const options = { keepBest: true, maxRarity: 'rare' } as const;
  it('never lists equipped or locked items and respects the inclusive rarity ceiling', () => {
    const bag = [item('worn', 'wpn.sword.twig', { equipped: true }), item('locked', 'wpn.sword.twig', { locked: true }), item('bad'), item('rare', 'wpn.sword.silver'), item('epic', 'wpn.sword.sunfang'), item('best', 'wpn.sword.ninelives')];
    expect(salvageCandidates(bag, options).map((entry) => entry.id)).toEqual(['bad', 'rare']);
  });

  it('keeps best owned items, exact ties, other weapon types and stat tradeoffs', () => {
    const bag = [item('sword'), item('copy'), item('bow', 'wpn.bow.aurora'), item('xp', 'acc.collar.ribbon.common'), item('crit', 'acc.collar.bell.legendary')];
    expect(salvageCandidates(bag, options)).toEqual([]);
  });

  it('uses level and bonuses rather than assuming rarity is always better', () => {
    const highCommon = item('high', 'wpn.sword.twig', { level: 10, locked: true });
    const uncommon = item('uncommon', 'wpn.sword.tin');
    expect(salvageCandidates([highCommon, uncommon], options)).toEqual([uncommon]);
    const tradeoff = { ...uncommon, bonus: [{ stat: 'xpBonus' as const, value: 0.05 }] };
    expect(salvageCandidates([highCommon, tradeoff], options)).toEqual([]);
  });
});

describe('bagUsage and sortItems', () => {
  it('reads the default bag limit and near-full threshold from config, including boundaries', () => {
    const threshold = Math.ceil(V2_CONFIG.bag.limit * V2_CONFIG.bag.nearFullRatio);
    const bag = Array.from({ length: V2_CONFIG.bag.limit + 1 }, (_, i) => item(String(i)));
    expect(bagUsage([])).toEqual({ used: 0, limit: V2_CONFIG.bag.limit, full: false, nearFull: false });
    expect(bagUsage(bag.slice(0, threshold - 1)).nearFull).toBe(false);
    expect(bagUsage(bag.slice(0, threshold)).nearFull).toBe(true);
    expect(bagUsage(bag.slice(0, V2_CONFIG.bag.limit)).full).toBe(true);
    expect(bagUsage(bag).full).toBe(true);
    expect(bagUsage(bag.slice(0, 9), 10)).toEqual({ used: 9, limit: 10, full: false, nearFull: true });
  });

  it.each(['rarity', 'level', 'slot'] as const)('sorts %s stably without changing the input', (by) => {
    const bag = [item('a'), item('b'), item('c')];
    const result = sortItems(bag, by);
    expect(result).toEqual(bag);
    expect(result).not.toBe(bag);
    expect(bag.map((entry) => entry.id)).toEqual(['a', 'b', 'c']);
  });

  it('orders by the selected key with descending rarity then level as tie breakers', () => {
    const bag = [item('common', 'wpn.sword.twig', { level: 10 }), item('rare', 'arm.cozy.helmet.rare'), item('highRare', 'wpn.sword.silver', { level: 2 })];
    expect(sortItems(bag, 'rarity').map((entry) => entry.id)).toEqual(['highRare', 'rare', 'common']);
    expect(sortItems(bag, 'level').map((entry) => entry.id)).toEqual(['common', 'highRare', 'rare']);
    expect(sortItems(bag, 'slot').map((entry) => entry.id)).toEqual(['highRare', 'common', 'rare']);
    expect(sortItems(bag, 'recent').map((entry) => entry.id)).toEqual(['highRare', 'rare', 'common']);
  });
});

it('preserves invariants over 500 seeded random bags', () => {
  const generatedItem = fc.record({
    def: fc.constantFrom(...ITEMS), level: fc.integer({ min: 1, max: 50 }),
    bonus: fc.array(fc.record({ stat: fc.constantFrom(...STAT_IDS), value: fc.integer({ min: 0, max: 10 }).map((v) => v / 100) }), { maxLength: 4 }),
    locked: fc.boolean(), worn: fc.boolean(),
  });
  fc.assert(fc.property(
    fc.constantFrom(...CLASSES), fc.integer({ min: 1, max: V2_CONFIG.cat.maxLevel }),
    fc.array(generatedItem, { maxLength: 60 }), fc.constantFrom(...GEAR_RARITY_IDS),
    (cls, level, entries, maxRarity) => {
      const state = { classId: cls.id, level };
      const filled = new Set<string>();
      const bag = entries.map((entry, i) => {
        const slot = GEAR_SLOTS.find((candidate) => candidate.id === entry.def.slot)!;
        const equipped = entry.worn && !filled.has(slot.id) && slot.unlockLevel <= level
          && (slot.id !== 'weapon' || entry.def.weaponType === cls.weaponType);
        if (equipped) filled.add(slot.id);
        return item(String(i), entry.def.id, { level: entry.level, locked: entry.locked, bonus: entry.bonus, equipped });
      });
      const original = bag.map((entry) => ({ ...entry, bonus: entry.bonus.map((line) => ({ ...line })) }));
      const result = bestLoadout(state, bag);
      expect(result.powerAfter).toBeGreaterThanOrEqual(result.powerBefore);
      expect(new Set(result.equip).size).toBe(result.equip.length);
      for (const id of result.equip) {
        const chosen = bag.find((entry) => entry.id === id)!;
        expect(GEAR_SLOTS.find((slot) => slot.id === chosen.slot)!.unlockLevel).toBeLessThanOrEqual(level);
        if (chosen.slot === 'weapon') expect(chosen.weaponType).toBe(cls.weaponType);
      }
      const next = apply(bag, result.equip);
      expect(new Set(next.filter((entry) => entry.equipped).map((entry) => entry.slot)).size).toBe(next.filter((entry) => entry.equipped).length);
      expect(result.powerAfter).toBe(powerRating(engineStats(state, next.filter((entry) => entry.equipped))));
      expect(bestLoadout(state, next)).toEqual({ equip: [], powerBefore: result.powerAfter, powerAfter: result.powerAfter });
      // A fixed point has no remaining individual power improvement.
      const worn = next.filter((entry) => entry.equipped);
      for (const candidate of bag) expect(compareItems(state, worn, candidate).powerAfter).toBeLessThanOrEqual(result.powerAfter);
      const salvaged = salvageCandidates(bag, { keepBest: true, maxRarity });
      for (const candidate of salvaged) {
        expect(candidate.equipped || candidate.locked).toBe(false);
        expect(GEAR_RARITY_IDS.indexOf(candidate.rarity)).toBeLessThanOrEqual(GEAR_RARITY_IDS.indexOf(maxRarity));
        const stats = rawStats(candidate);
        expect(bag.some((other) => {
          const better = rawStats(other);
          return other.id !== candidate.id && other.slot === candidate.slot && other.weaponType === candidate.weaponType
            && better.every((value, i) => value >= stats[i]!) && better.some((value, i) => value > stats[i]!);
        })).toBe(true);
      }
      for (const by of ['rarity', 'level', 'slot'] as const) {
        const sorted = sortItems(bag, by);
        expect(sortItems(sorted, by)).toEqual(sorted);
        expect(sorted).toHaveLength(bag.length);
        for (let i = 1; i < sorted.length; i++) {
          const a = sorted[i - 1]!;
          const b = sorted[i]!;
          if (a.slot === b.slot && a.rarity === b.rarity && a.level === b.level) expect(bag.indexOf(a)).toBeLessThan(bag.indexOf(b));
        }
      }
      expect(bag).toEqual(original);
    },
  ), { seed: 20261025, numRuns: 500 });
}, 30000);
