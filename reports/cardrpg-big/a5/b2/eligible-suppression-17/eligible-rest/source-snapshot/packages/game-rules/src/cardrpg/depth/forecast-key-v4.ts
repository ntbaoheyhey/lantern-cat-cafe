import type { BattleSetup } from './contract';

/** Encounter RNG is excluded: every forecast uses the same registered training seeds. */
export function forecastKeyV4(setup: BattleSetup): string {
  const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical)
    : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right)).map(([key, v]) => [key, canonical(v)])) : value;
  const { seed: ignored, ...build } = setup;
  void ignored;
  return JSON.stringify(canonical(build));
}
