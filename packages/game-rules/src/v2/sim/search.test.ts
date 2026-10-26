// @ts-expect-error Node APIs run only in the opt-in test harness.
import { readFileSync, writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { CLASS_IDS } from '../content';
import { candidatesV2 } from './proposal';
import { simulateV2 } from './simulate';
import { checkTargetsV2, guardrailsCheckV2, medianV2 } from './targets';
import type { ConfigOverridesV2 } from './config';
declare const console: { log(message: string): void };
declare const process: { env: Record<string, string | undefined> };
it.runIf(process.env.V2_SIM_SEARCH === '1')('ranks only D1 S-B candidates in the bounded directed family', () => {
  const evaluate = (overrides: ConfigOverridesV2, seeds: number, horizon: number) => {
    expect(guardrailsCheckV2(overrides).ok).toBe(true);
    expect(overrides.boss?.firstClearKeys).toBe(1);
    expect(overrides.idle?.dailyKeys).toBeLessThanOrEqual(3);
    const runs = CLASS_IDS.flatMap(classId => Array.from({ length: seeds }, (_, i) => simulateV2({ classId, seed: i + 1, overrides, maxActiveMinutes: horizon })));
    const checks = checkTargetsV2(runs, overrides);
    const first = runs.filter(r => r.minutesToFirstBossWin !== null && r.minutesToFirstBossWin >= 10 && r.minutesToFirstBossWin <= 15).length / runs.length;
    return { overrides, checks, score: checks.filter(c => c.ok).length * 1000 + runs.filter(r => r.minutesToChapterBossWin[5] !== null).length / runs.length * 100 + first * 10 };
  };
  const screened = candidatesV2().map((overrides, i) => { const result = evaluate(overrides, 1, 120); console.log(`screened ${i + 1}/29`); return result; }).sort((a, b) => b.score - a.score);
  const ranked = [...new Map([...screened.slice(0, 5), ...screened.filter(c => !c.overrides.chapters)].map(c => [JSON.stringify(c.overrides), c])).values()].map(c => {
    const candidate = evaluate(c.overrides, 3, 1800);
    const cohorts = [1, 2].map(stepMinutes => CLASS_IDS.flatMap(classId => [1, 2, 3].map(seed => simulateV2({ classId, seed, overrides: c.overrides, maxActiveMinutes: 60, stepMinutes }))));
    const stable = CLASS_IDS.every(id => Math.abs(medianV2(cohorts[0]!.filter(r => r.classId === id).map(r => r.minutesToFirstBossWin)) - medianV2(cohorts[1]!.filter(r => r.classId === id).map(r => r.minutesToFirstBossWin))) <= 1);
    return { ...candidate, stable };
  }).sort((a, b) => Number(b.stable) - Number(a.stable) || b.score - a.score);
  console.log(JSON.stringify({ candidateCount: screened.length, ranked }, null, 2));
  if (process.env.V2_SIM_SEARCH_OUTPUT) writeFileSync(process.env.V2_SIM_SEARCH_OUTPUT, JSON.stringify({ candidateCount: screened.length, ranked: ranked.slice(0, 3), refined: ranked }));
}, 180000);


// Retain the existing opt-in fine-search and selection checks, restricted to the approved S-B lane.
it.runIf(process.env.V2_SIM_FINE === '1' || process.env.V2_SIM_LOCAL === '1' || process.env.V2_SIM_CALIBRATE === '1' || process.env.V2_SIM_TIMING === '1')('refines the first-boss neighborhood with independent XP and HP growth', () => {
  const base = candidatesV2()[2]!;
  const ranked = [];
  for (const baseAtk of [10, 12, 14, 16]) for (const hpGrowth of [1.06, 1.08, 1.10]) for (const xpGrowth of [1.12, 1.16, 1.20]) {
    const overrides: ConfigOverridesV2 = { ...base, cat: { ...base.cat, baseAtk, xpGrowth }, monster: { ...base.monster, hpGrowth } };
    expect(guardrailsCheckV2(overrides).ok).toBe(true);
    const cohorts = [1, 2].map(stepMinutes => CLASS_IDS.flatMap(classId => [1, 2, 3].map(seed => simulateV2({ classId, seed, overrides, maxActiveMinutes: 60, stepMinutes }))));
    const stable = CLASS_IDS.every(id => Math.abs(medianV2(cohorts[0]!.filter(r => r.classId === id).map(r => r.minutesToFirstBossWin)) - medianV2(cohorts[1]!.filter(r => r.classId === id).map(r => r.minutesToFirstBossWin))) <= 1);
    const checks = checkTargetsV2(cohorts[1]!, overrides);
    ranked.push({ overrides, stable, checks, score: Number(checks[0]!.ok) * 1000 + Number(stable) * 100 });
  }
  ranked.sort((a, b) => b.score - a.score);
  expect(ranked).toHaveLength(36);
  if (process.env.V2_SIM_SEARCH_OUTPUT) writeFileSync(process.env.V2_SIM_SEARCH_OUTPUT, JSON.stringify({ ranked }));
}, 180000);

it.runIf(process.env.V2_SIM_SELECT === '1')('selects measured candidates with a stable claim-size diagnostic', () => {
  type Candidate = { overrides: ConfigOverridesV2; stable: boolean; checks: ReturnType<typeof checkTargetsV2>; score: number };
  const files = (process.env.V2_SIM_SELECT_INPUTS ?? '').split(',').filter(Boolean);
  if (!files.length) throw new Error('selection requires search result inputs');
  const candidates = files.flatMap(path => (JSON.parse(readFileSync(path, 'utf8')) as { ranked: Candidate[] }).ranked);
  const eligible = candidates.filter(c => c.overrides.boss?.firstClearKeys === 1 && (c.overrides.idle?.dailyKeys ?? Infinity) <= 3 && guardrailsCheckV2(c.overrides).ok).filter(c => {
    const run = (stepMinutes: number) => CLASS_IDS.flatMap(classId => [1, 2, 3, 4, 5].map(seed => simulateV2({ classId, seed, overrides: c.overrides, stepMinutes, maxActiveMinutes: 60 })));
    const a = run(1), b = run(2);
    c.stable = [3, 5].every(cohort => CLASS_IDS.every(id => Math.abs(medianV2(a.filter(r => r.classId === id && r.seed <= cohort).map(r => r.minutesToFirstBossWin)) - medianV2(b.filter(r => r.classId === id && r.seed <= cohort).map(r => r.minutesToFirstBossWin))) <= 1));
    return c.stable;
  });
  eligible.sort((a, b) => b.checks.filter(c => c.ok).length - a.checks.filter(c => c.ok).length || b.score - a.score);
  if (!eligible.length) throw new Error('no main candidate satisfies measurement acceptance');
  if (process.env.V2_SIM_SEARCH_OUTPUT) writeFileSync(process.env.V2_SIM_SEARCH_OUTPUT, JSON.stringify({ ranked: eligible }));
}, 180000);
