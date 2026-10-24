import { describe, expect, it } from 'vitest';
import {
  expectedCounts,
  rollLoot,
  validateRegistry,
  type LootLine,
  type LootRegistry,
  type LootTable,
  type WeightedEntry,
} from './index';
import { deriveSeed } from './rng';

const sample: LootRegistry<string> = {
  root: {
    id: 'root',
    lines: [
      {
        chance: 0.8,
        count: [2, 4],
        pick: [{ weight: 3, value: 'a' }, { weight: 1, value: { table: 'nested' } }],
      },
      { chance: 0.5, count: [1, 1], pick: [{ weight: 1, value: 'b' }] },
    ],
  },
  nested: {
    id: 'nested',
    lines: [{
      chance: 1,
      count: [2, 4],
      pick: [{ weight: 1, value: 'b' }, { weight: 2, value: 'c' }],
    }],
  },
};

function singleLine(overrides: Partial<LootLine<string>> = {}): LootRegistry<string> {
  const table: LootTable<string> = {
    id: 'root',
    lines: [{ chance: 1, count: [1, 1], pick: [{ weight: 1, value: 'a' }], ...overrides }],
  };
  return { root: table };
}

function chain(references: number): LootRegistry<string> {
  const registry: LootRegistry<string> = {};
  for (let depth = 0; depth <= references; depth++) {
    const value: WeightedEntry<string>['value'] = depth === references
      ? 'reward'
      : { table: String(depth + 1) };
    registry[String(depth)] = {
      id: String(depth),
      lines: [{ chance: 1, count: [1, 1], pick: [{ weight: 1, value }] }],
    };
  }
  return registry;
}

describe('rollLoot', () => {
  it('is deterministic for every seed and varies over 100 different seeds', () => {
    const outputs = new Set<string>();
    for (let seed = 0; seed < 100; seed++) {
      const result = rollLoot(sample, 'root', seed);
      expect(rollLoot(sample, 'root', seed)).toEqual(result);
      outputs.add(JSON.stringify(result));
    }
    expect(outputs.size).toBeGreaterThan(1);
  });

  it('chance 0 never drops', () => {
    const registry = singleLine({ chance: 0 });
    for (let seed = 0; seed < 100; seed++) expect(rollLoot(registry, 'root', seed)).toEqual([]);
  });

  it('chance 1 always drops and counts include both bounds of the uniform range', () => {
    const registry = singleLine({ count: [2, 5] });
    const counts = new Set<number>();
    for (let seed = 0; seed < 100; seed++) {
      const result = rollLoot(registry, 'root', seed);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.length).toBeLessThanOrEqual(5);
      expect(result.every((value) => value === 'a')).toBe(true);
      counts.add(result.length);
    }
    expect([...counts].sort()).toEqual([2, 3, 4, 5]);
  });

  it('handles zero counts and empty tables', () => {
    expect(rollLoot(singleLine({ count: [0, 0] }), 'root', 1)).toEqual([]);
    expect(rollLoot({ root: { id: 'root', lines: [] } }, 'root', 1)).toEqual([]);
  });

  it('rolls a nested table once for each picked unit with fresh random draws', () => {
    const registry: LootRegistry<string> = {
      ...sample,
      root: {
        id: 'root',
        lines: [{ chance: 1, count: [20, 20], pick: [{ weight: 1, value: { table: 'nested' } }] }],
      },
    };
    const result = rollLoot(registry, 'root', 42);
    expect(result.length).toBeGreaterThanOrEqual(40);
    expect(result.length).toBeLessThanOrEqual(80);
    expect(new Set(result)).toEqual(new Set(['b', 'c']));
  });

  it('returns caller-defined objects and null values without changing the registry', () => {
    const reward = Object.freeze({ kind: 'custom', amount: 7 });
    const registry: LootRegistry<typeof reward | null> = {
      root: {
        id: 'root',
        lines: [
          { chance: 1, count: [1, 1], pick: [{ weight: 1, value: reward }] },
          { chance: 1, count: [1, 1], pick: [{ weight: 1, value: null }] },
        ],
      },
    };
    const before = JSON.stringify(registry);
    const result = rollLoot(registry, 'root', 3);
    expect(result).toEqual([reward, null]);
    expect(result[0]).toBe(reward);
    expect(JSON.stringify(registry)).toBe(before);
    expect(expectedCounts(registry, 'root', (value) => value?.kind ?? 'null')).toEqual({ custom: 1, null: 1 });
  });

  it('allows exactly four nested references', () => {
    expect(rollLoot(chain(4), '0', 1)).toEqual(['reward']);
    expect(expectedCounts(chain(4), '0', String)).toEqual({ reward: 1 });
  });

  it('throws when nesting is deeper than four', () => {
    expect(() => rollLoot(chain(5), '0', 1)).toThrow(/depth exceeds 4/);
    expect(() => expectedCounts(chain(5), '0', String)).toThrow(/depth exceeds 4/);
  });

  it('rejects missing tables, including inherited object property names', () => {
    for (const id of ['missing', 'toString', '__proto__']) {
      expect(() => rollLoot(sample, id, 1)).toThrow(/Unknown loot table/);
      expect(() => expectedCounts(sample, id, String)).toThrow(/Unknown loot table/);
    }
  });

  it('rejects invalid registries before rolling or calculating expectations', () => {
    const registry = singleLine({ count: [0, Infinity] });
    expect(() => rollLoot(registry, 'root', 1)).toThrow(/Invalid loot registry/);
    expect(() => expectedCounts(registry, 'root', String)).toThrow(/Invalid loot registry/);
  });

  it('handles finite weights whose unscaled sum would overflow', () => {
    const registry = singleLine({ pick: [
      { weight: Number.MAX_VALUE, value: 'a' },
      { weight: Number.MAX_VALUE, value: 'b' },
    ] });
    const outputs = new Set(Array.from({ length: 100 }, (_, seed) => rollLoot(registry, 'root', seed)[0]));
    expect(outputs).toEqual(new Set(['a', 'b']));
    expect(expectedCounts(registry, 'root', String)).toEqual({ a: 0.5, b: 0.5 });
  });
});

describe('expectedCounts', () => {
  it('calculates nested expectations analytically and combines repeated reward keys', () => {
    const counts = expectedCounts(sample, 'root', String);
    expect(Object.keys(counts).sort()).toEqual(['a', 'b', 'c']);
    // root mean 3: a = .8*3*.75; nested mean 3: b = .8*3*.25*3/3 + .5.
    expect(counts.a).toBeCloseTo(1.8, 12);
    expect(counts.b).toBeCloseTo(1.1, 12);
    expect(counts.c).toBeCloseTo(1.2, 12);
    expect(expectedCounts(sample, 'root', () => 'all').all).toBeCloseTo(4.1, 12);
  });

  it('excludes zero-chance and zero-count rewards', () => {
    expect(expectedCounts(singleLine({ chance: 0 }), 'root', String)).toEqual({});
    expect(expectedCounts(singleLine({ count: [0, 0] }), 'root', String)).toEqual({});
  });

  it('handles reward keys that are object prototype names', () => {
    const result = expectedCounts(singleLine(), 'root', () => '__proto__');
    expect(Object.hasOwn(result, '__proto__')).toBe(true);
    expect(result['__proto__']).toBe(1);
  });

  it('matches observed reward counts within 2% relative error over 20,000 nested rolls', () => {
    const rolls = 20_000;
    const observed: Record<string, number> = {};
    for (let index = 0; index < rolls; index++) {
      for (const reward of rollLoot(sample, 'root', deriveSeed(42, index))) {
        observed[reward] = (observed[reward] ?? 0) + 1;
      }
    }
    const expected = expectedCounts(sample, 'root', String);
    expect(Object.keys(observed).sort()).toEqual(Object.keys(expected).sort());
    for (const [reward, mean] of Object.entries(expected)) {
      expect(Math.abs((observed[reward] ?? 0) / rolls - mean) / mean).toBeLessThan(0.02);
    }
  });
});

describe('validateRegistry', () => {
  it('accepts a good registry and shared nested tables without false cycles', () => {
    expect(validateRegistry({ ...sample, anotherRoot: sample.root! })).toEqual([]);
    expect(validateRegistry({})).toEqual([]);
  });

  it('catches unknown table references', () => {
    for (const table of ['missing', 'toString']) {
      expect(validateRegistry(singleLine({ pick: [{ weight: 1, value: { table } }] })))
        .toEqual([expect.stringContaining(`unknown table ${table}`)]);
    }
  });

  it('catches cycles, including self references and disconnected tables', () => {
    const cyclic = singleLine({ pick: [{ weight: 1, value: { table: 'root' } }] });
    expect(validateRegistry(cyclic)).toEqual([expect.stringContaining('cycle')]);
    const indirect = chain(2);
    indirect['2']!.lines[0]!.pick = [{ weight: 1, value: { table: '0' } }];
    expect(validateRegistry({ ...sample, ...indirect })).toEqual([expect.stringContaining('cycle')]);
  });

  it('catches weights that are not finite', () => {
    for (const weight of [NaN, Infinity, -Infinity]) {
      expect(validateRegistry(singleLine({ pick: [{ weight, value: 'a' }] })))
        .toEqual([expect.stringContaining('weight must be finite and positive')]);
    }
  });

  it('catches weights that are not positive', () => {
    for (const weight of [0, -1]) {
      expect(validateRegistry(singleLine({ pick: [{ weight, value: 'a' }] })))
        .toEqual([expect.stringContaining('weight must be finite and positive')]);
    }
  });

  it('catches chance outside 0..1, including non-finite values', () => {
    for (const chance of [-0.1, 1.1, NaN, Infinity, -Infinity]) {
      expect(validateRegistry(singleLine({ chance })))
        .toEqual([expect.stringContaining('chance must be finite and within 0..1')]);
    }
  });

  it('catches min > max', () => {
    expect(validateRegistry(singleLine({ count: [2, 1] })))
      .toEqual([expect.stringContaining('count min > max')]);
  });

  it('catches negative counts', () => {
    for (const count of [[-1, 1], [-2, -1]] as [number, number][]) {
      expect(validateRegistry(singleLine({ count })))
        .toEqual([expect.stringContaining('negative counts')]);
    }
  });

  it('catches empty pick lists', () => {
    expect(validateRegistry(singleLine({ pick: [] })))
      .toEqual([expect.stringContaining('empty pick list')]);
  });

  it('catches fractional, non-finite, and unsafe integer counts', () => {
    for (const count of [[0.5, 2], [0, 2.5], [NaN, 2], [0, Infinity], [0, 2 ** 53]] as [number, number][]) {
      expect(validateRegistry(singleLine({ count })))
        .toContainEqual(expect.stringContaining('counts must be finite safe integers'));
    }
  });
});
