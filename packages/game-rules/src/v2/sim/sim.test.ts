import { describe, expect, it } from 'vitest';
import { CLASS_IDS, GEAR_SLOT_IDS } from '../content';
import { V2_CONFIG } from '../config';
import { withConfigV2, type ConfigOverridesV2 } from './config';
import { simulateV2, simulateWithStateForTest } from './simulate';
import { checkTargetsV2, craftSalvageCheckV2, medianV2 } from './targets';
import { PROPOSED_V2_OVERRIDES } from './proposal';
import { renderNumbersReportV2 } from './report';

// Share the same 21 deterministic runs between target and state assertions.
let proposedRuns: ReturnType<typeof simulateWithStateForTest>[] | undefined;
function proposedMatrix() {
  return proposedRuns ??= CLASS_IDS.flatMap((classId) => [1, 2, 3].map((seed) => simulateWithStateForTest({ classId, seed, overrides: PROPOSED_V2_OVERRIDES })));
}

// Node provides this global at runtime; the game-rules tsconfig intentionally excludes DOM/Node types.
declare function structuredClone<T>(value: T): T;

describe('config override transaction', () => {
  it('restores exact previous leaves after returning and throwing', () => {
    const before = structuredClone(V2_CONFIG);
    expect(withConfigV2({ monster: { hpBase: 999 } }, () => V2_CONFIG.monster.hpBase)).toBe(999);
    expect(V2_CONFIG).toEqual(before);
    expect(() => withConfigV2({ monster: { hpBase: 999 } }, () => { throw new Error('callback failed'); })).toThrow('callback failed');
    expect(V2_CONFIG).toEqual(before);
  });
  it('validates all paths before mutating anything, including unknown nested and load-captured content paths', () => {
    const before = structuredClone(V2_CONFIG);
    const invalid = { monster: { hpBase: 999, unknown: 1 } } as ConfigOverridesV2;
    expect(() => withConfigV2(invalid, () => { throw new Error('must not run'); })).toThrow('unknown config path: monster.unknown');
    // There are no captured V2_CONFIG leaves; stack caps are captured from content instead.
    const captured = { MATERIALS: { catKey: { maxStack: 10 } } } as unknown as ConfigOverridesV2;
    expect(() => withConfigV2(captured, () => null)).toThrow('unknown config path: MATERIALS');
    const structural = { idle: { materialDrops: { length: 1 } } } as unknown as ConfigOverridesV2;
    expect(() => withConfigV2(structural, () => null)).toThrow('unknown config path: idle.materialDrops.length');
    expect(V2_CONFIG).toEqual(before);
  });
  it('rejects nesting and invalid leaf values and restores the outer transaction', () => {
    const before = structuredClone(V2_CONFIG);
    expect(() => withConfigV2({ monster: { hpBase: 999 } }, () => withConfigV2({}, () => null))).toThrow('nested');
    expect(() => withConfigV2({ monster: { hpBase: NaN } }, () => null)).toThrow('invalid config value');
    expect(V2_CONFIG).toEqual(before);
  });
});

it('is deterministic and responds to a different seed', () => {
  const first = simulateV2({ classId: 'warrior', seed: 1 });
  expect(simulateV2({ classId: 'warrior', seed: 1 })).toEqual(first);
  expect(simulateV2({ classId: 'warrior', seed: 2 })).not.toEqual(first);
// Three full 1,800-minute runs can exceed Vitest's 5s default under workspace CPU contention.
}, 90000);

// User-approved fallback: keep the exact failed balance targets visible without changing thresholds.
it('records the fallback target failures across seven classes and three seeds', () => {
  const results = proposedMatrix().map((run) => run.result);
  const checks = checkTargetsV2(results);
  expect(checks.filter((check) => !check.ok).map((check) => check.id)).toEqual(["first-boss", "chapter-growth", "class-spread", "chapter-bounds", "boss-check"]);
  expect(checks.find((check) => check.id === 'walk-share')?.ok).toBe(true);
  expect(checks.find((check) => check.id === 'guardrails')?.ok).toBe(true);
}, 180000);

it('detects a six-hour stall with broken monster attack', () => {
  const result = simulateV2({ classId: 'warrior', seed: 1, overrides: { monster: { atkBase: 400 } } });
  expect(result.stuck).toEqual({ at: 360, chapter: 1, round: 1 });
  expect(checkTargetsV2([result]).find((check) => check.id === 'never-stuck')?.ok).toBe(false);
});

it('crafting then salvaging loses weighted value under current and proposed numbers', () => {
  expect(craftSalvageCheckV2().ok).toBe(true);
  expect(withConfigV2(PROPOSED_V2_OVERRIDES, () => craftSalvageCheckV2().ok)).toBe(true);
});

it('preserves stack and equipment invariants in the final state of every class and seed', () => {
  for (const { finalState } of proposedMatrix()) {
    expect(Object.values(finalState.stacks).every((value) => Number.isSafeInteger(value) && value >= 0)).toBe(true);
    for (const slot of GEAR_SLOT_IDS) expect(finalState.items.filter((item) => item.equipped && item.slot === slot).length).toBeLessThanOrEqual(1);
    expect(finalState.items.length).toBeLessThanOrEqual(V2_CONFIG.bag.limit);
  }
}, 180000);

it('treats missing milestones as failures and renders the same report twice', () => {
  expect(medianV2([10, null, null])).toBe(Infinity);
  expect(checkTargetsV2([]).filter((check) => check.id !== 'craft-salvage-loss' && check.id !== 'guardrails').every((check) => !check.ok)).toBe(true);
  const current = [simulateV2({ classId: 'warrior', seed: 1, maxActiveMinutes: 10 })];
  const report = renderNumbersReportV2(current, current);
  expect(report).toBe(renderNumbersReportV2(current, current));
  expect(report).toContain('Proposal only. V2_CONFIG unchanged.');
  expect(report).toContain('NOT READY FOR SIGN-OFF');
  expect(report).toContain('User: ____ (approved / changes)');
  expect(report).toContain('StepMinutes 1 diagnostic');
});
