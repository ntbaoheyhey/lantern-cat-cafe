import { deriveSeed, Rng, type Seed } from './rng';

export type WeightedEntry<T> = { weight: number; value: T | { table: string } };
export type LootLine<T> = {
  chance: number;
  count: [min: number, max: number];
  pick: WeightedEntry<T>[];
};
export type LootTable<T> = { id: string; lines: LootLine<T>[] };
export type LootRegistry<T> = Record<string, LootTable<T>>;

const MAX_DEPTH = 4;

// Objects with a string-valued `table` field are reserved for references.
function isReference<T>(value: T | { table: string }): value is { table: string } {
  return typeof value === 'object' && value !== null && 'table' in value &&
    typeof value.table === 'string';
}

function getTable<T>(registry: LootRegistry<T>, id: string): LootTable<T> {
  if (!Object.hasOwn(registry, id)) throw new Error(`Unknown loot table: ${id}`);
  return registry[id]!;
}

/** Report structural problems across the entire registry, including unused tables. */
export function validateRegistry<T>(registry: LootRegistry<T>): string[] {
  const problems: string[] = [];
  for (const [id, table] of Object.entries(registry)) {
    table.lines.forEach((line, lineIndex) => {
      const location = `Table ${id}, line ${lineIndex}`;
      if (!Number.isFinite(line.chance) || line.chance < 0 || line.chance > 1) {
        problems.push(`${location}: chance must be finite and within 0..1`);
      }
      const [min, max] = line.count;
      if (min > max) problems.push(`${location}: count min > max`);
      if (min < 0 || max < 0) problems.push(`${location}: negative counts`);
      if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max)) {
        problems.push(`${location}: counts must be finite safe integers`);
      }
      if (line.pick.length === 0) problems.push(`${location}: empty pick list`);
      line.pick.forEach((entry, entryIndex) => {
        if (!Number.isFinite(entry.weight) || entry.weight <= 0) {
          problems.push(`${location}, pick ${entryIndex}: weight must be finite and positive`);
        }
        if (isReference(entry.value) && !Object.hasOwn(registry, entry.value.table)) {
          problems.push(`${location}, pick ${entryIndex}: unknown table ${entry.value.table}`);
        }
      });
    });
  }

  const visited = new Set<string>();
  const active = new Set<string>();
  const visit = (id: string): void => {
    if (active.has(id)) {
      problems.push(`Table ${id}: cycle detected`);
      return;
    }
    if (visited.has(id)) return;
    active.add(id);
    for (const line of getTable(registry, id).lines) {
      for (const { value } of line.pick) {
        if (isReference(value) && Object.hasOwn(registry, value.table)) visit(value.table);
      }
    }
    active.delete(id);
    visited.add(id);
  };
  for (const id of Object.keys(registry)) visit(id);
  return problems;
}

function assertValid<T>(registry: LootRegistry<T>): void {
  const problems = validateRegistry(registry);
  if (problems.length) throw new Error(`Invalid loot registry:\n${problems.join('\n')}`);
}

// Scaling first keeps the sum finite even when individual weights are near MAX_VALUE.
function probabilities<T>(entries: WeightedEntry<T>[]): number[] {
  const scale = entries.reduce((max, entry) => Math.max(max, entry.weight), 0);
  const weights = entries.map((entry) => entry.weight / scale);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => weight / total);
}

function assertDepth(depth: number): void {
  if (depth > MAX_DEPTH) throw new Error(`Loot nesting depth exceeds ${MAX_DEPTH}`);
}

/** Roll in line/unit order. The root is depth 0; at most four nested references are allowed. */
export function rollLoot<T>(registry: LootRegistry<T>, tableId: string, seed: Seed): T[] {
  assertValid(registry);
  const rng = new Rng(deriveSeed(seed, 0));
  const rewards: T[] = [];
  const roll = (id: string, depth: number): void => {
    assertDepth(depth);
    for (const line of getTable(registry, id).lines) {
      if (!rng.chance(line.chance)) continue;
      const count = rng.int(...line.count);
      const odds = probabilities(line.pick);
      for (let unit = 0; unit < count; unit++) {
        let remaining = rng.next();
        let selected = line.pick[line.pick.length - 1]!;
        for (let index = 0; index < line.pick.length; index++) {
          remaining -= odds[index]!;
          if (remaining < 0) {
            selected = line.pick[index]!;
            break;
          }
        }
        if (isReference(selected.value)) roll(selected.value.table, depth + 1);
        else rewards.push(selected.value);
      }
    }
  };
  roll(tableId, 0);
  return rewards;
}

/** Analytic expected counts (subject to floating-point precision), with no random sampling. */
export function expectedCounts<T>(
  registry: LootRegistry<T>,
  tableId: string,
  key: (value: T) => string,
): Record<string, number> {
  assertValid(registry);
  const counts = new Map<string, number>();
  const visit = (id: string, depth: number, multiplier: number): void => {
    assertDepth(depth);
    for (const line of getTable(registry, id).lines) {
      const meanCount = line.count[0] / 2 + line.count[1] / 2;
      if (line.chance === 0 || meanCount === 0) continue;
      const odds = probabilities(line.pick);
      line.pick.forEach(({ value }, index) => {
        const expected = multiplier * line.chance * meanCount * odds[index]!;
        if (isReference(value)) visit(value.table, depth + 1, expected);
        else {
          const rewardKey = key(value);
          counts.set(rewardKey, (counts.get(rewardKey) ?? 0) + expected);
        }
      });
    }
  };
  visit(tableId, 0, 1);
  return Object.fromEntries(counts);
}
