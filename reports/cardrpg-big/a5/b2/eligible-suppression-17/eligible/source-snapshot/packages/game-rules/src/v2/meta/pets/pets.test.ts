import { expect, it } from 'vitest';
import { equipPet, PET_DEFS, PET_KILL_TARGET, petProgress } from './index';

// DEMO_PREVIEW fixtures; registry thresholds drive the boundary assertions.
const first = PET_DEFS[0]!;
const counts = (n: number) => ({ [PET_KILL_TARGET]: n });

it('contains twelve unique original ids and preview-only labels', () => {
  expect(PET_DEFS).toHaveLength(12);
  expect(new Set(PET_DEFS.map(p => p.id)).size).toBe(PET_DEFS.length);
  expect(new Set(PET_DEFS.map(p => p.name)).size).toBe(PET_DEFS.length);
  for (const p of PET_DEFS) {
    expect(p.status).toBe('DEMO_PREVIEW');
    expect(p.bonusKey).toMatch(/^preview\./);
    expect(p.flavour.length).toBeGreaterThan(0);
    expect(Object.isFrozen(p.perLevel)).toBe(true);
  }
});

for (const pet of PET_DEFS) it(`${pet.id} unlocks exactly at its threshold`, () => {
  expect(petProgress(counts(pet.unlock.count - 1))[pet.id]?.unlocked).toBe(false);
  expect(petProgress(counts(pet.unlock.count))[pet.id]).toEqual({ unlocked: true, level: 1, nextAt: pet.unlock.count * 2, pct: 0 });
});

it('steps levels at exact multiples, reports interval percentage and caps', () => {
  const step = first.unlock.count;
  expect(petProgress(counts(0))[first.id]).toEqual({ unlocked: false, level: 0, nextAt: step, pct: 0 });
  expect(petProgress(counts(step - 1))[first.id]?.pct).toBeCloseTo((step - 1) / step * 100);
  expect(petProgress(counts(step * 2 - 1))[first.id]?.level).toBe(1);
  expect(petProgress(counts(step * 2))[first.id]).toEqual({ unlocked: true, level: 2, nextAt: step * 3, pct: 0 });
  for (const n of [step * first.perLevel.length, Number.MAX_SAFE_INTEGER]) {
    expect(petProgress(counts(n))[first.id]).toEqual({ unlocked: true, level: first.perLevel.length, nextAt: null, pct: 100 });
  }
});

it('uses the supplied target and definitions without mutating inputs', () => {
  const defs = Object.freeze([{ ...first, unlock: { target: 'fixture', count: 11 } }]);
  const input = Object.freeze({ fixture: 22, [PET_KILL_TARGET]: 0 });
  expect(petProgress(input, defs)[first.id]?.level).toBe(2);
  expect(petProgress(input, defs)).toEqual(petProgress(input, defs));
  expect(petProgress({}, [])).toEqual({});
});

it('treats absent and invalid counters as empty', () => {
  for (const input of [{}, ...[-1, NaN, Infinity, 0.5, Number.MAX_SAFE_INTEGER + 1].map(counts)]) {
    expect(petProgress(input)[first.id]?.level).toBe(0);
  }
});

it('rejects duplicates, locked/unknown pets and a third companion', () => {
  const all = counts(Number.MAX_SAFE_INTEGER), a = PET_DEFS[0]!.id, b = PET_DEFS[1]!.id, c = PET_DEFS[2]!.id;
  expect(equipPet([], a, {})).toEqual({ ok: false, reason: 'locked' });
  expect(equipPet([], 'pet.unknown', all)).toEqual({ ok: false, reason: 'unknown' });
  expect(equipPet([], a, all)).toEqual({ ok: true, equipped: [a] });
  expect(equipPet([a], b, all)).toEqual({ ok: true, equipped: [a, b] });
  expect(equipPet([a], a, all)).toEqual({ ok: false, reason: 'duplicate' });
  expect(equipPet([a, b], c, all)).toEqual({ ok: false, reason: 'limit' });
});
