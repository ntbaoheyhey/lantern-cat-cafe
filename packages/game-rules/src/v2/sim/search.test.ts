// @ts-expect-error Node APIs are available in the opt-in Vitest search only.
import { readFileSync, writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { Rng } from '../../rng';
import { CLASS_IDS } from '../content';
import { simulateV2 } from './simulate';
import { checkTargetsV2, guardrailsCheckV2, medianV2 } from './targets';
import { C5B_V2_OVERRIDES } from './proposal';
import type { ConfigOverridesV2 } from './config';
declare const process: { env: Record<string, string | undefined>; stdout: { write(message: string): void } };
declare const performance: { now(): number };

it.runIf(process.env.V2_SIM_SEARCH === '1')('searches the guardrailed space and both decision scenarios', () => {
  const start = performance.now();
  const rng = new Rng(6252026);
  const pick = (values: number[]) => values[rng.int(0, values.length - 1)]!;
  // Same finite family in all three spaces. No clearedChapterKeyChance search leaf.
  const candidates: ConfigOverridesV2[] = [{ ...C5B_V2_OVERRIDES, idle: { dailyKeys: 3, walkTimeMs: 1000 } }];
  for (let trial = 0; trial < 32; trial++) candidates.push({
    cat: { baseAtk: pick([10, 14, 22]), baseHp: pick([200, 300]), baseDef: pick([5, 10]), levelGrowth: pick([0.03, 0.045, 0.06]), xpGrowth: pick([1.12, 1.16, 1.20, 1.24]) },
    monster: { hpBase: pick([60, 90]), hpGrowth: pick([1.06, 1.10, 1.13, 1.16]), atkBase: pick([2, 4, 8]), atkGrowth: pick([1.01, 1.04, 1.06]), xpBase: pick([6, 12, 18]), xpGrowth: pick([1.02, 1.06, 1.11, 1.15]) },
    idle: { dailyKeys: 3, walkTimeMs: pick([330, 500, 1000]) },
    boss: { maxMs: 180000, attackIntervalMs: pick([3000, 4500]), bigEveryMs: pick([6000, 12000]), bigMultiplier: pick([0.83, 1.5]) },
  });
  const output = [];
  for (const scenario of [undefined, 'S-A', 'S-B'] as const) {
    const evaluate = (overrides: ConfigOverridesV2, seeds: number, horizon: number) => {
      if (!guardrailsCheckV2(overrides).ok) throw new Error('search escaped guardrails');
      const results = CLASS_IDS.flatMap((classId) => Array.from({ length: seeds }, (_, i) => simulateV2({ classId, seed: i + 1, overrides, scenario, maxActiveMinutes: horizon })));
      const effective = scenario === 'S-A' ? { ...overrides, idle: { ...overrides.idle, dailyKeys: 5 } } : overrides;
      const checks = checkTargetsV2(results, effective);
      // Target count dominates; partial credit breaks ties without redefining acceptance.
      const first = results.filter((r) => r.minutesToFirstBossWin !== null && r.minutesToFirstBossWin >= 10 && r.minutesToFirstBossWin <= 15).length / results.length;
      const clears = results.reduce((sum, r) => sum + Object.values(r.minutesToChapterBossWin).filter((v) => v !== null).length, 0) / results.length;
      const score = checks.filter((c) => c.ok).length * 1000 + first * 10 + clears;
      return { overrides, score, checks };
    };
    const screened = candidates.map((overrides, i) => {
      const candidate = evaluate(overrides, 1, 360);
      if ((i + 1) % 8 === 0) process.stdout.write(`${scenario ?? 'config'} screened ${i + 1}/${candidates.length}; ${((performance.now() - start) / 1000).toFixed(1)}s\n`);
      return candidate;
    }).sort((a, b) => b.score - a.score);
    const ranked = screened.slice(0, 3).map(({ overrides }, i) => {
      const candidate = evaluate(overrides, 5, 1800);
      process.stdout.write(`${scenario ?? 'config'} refined ${i + 1}/3; ${((performance.now() - start) / 1000).toFixed(1)}s\n`);
      return candidate;
    }).sort((a, b) => b.score - a.score);
    output.push({ scenario: scenario ?? 'config', ranked });
    process.stdout.write(`Best ${scenario ?? 'config'}: ${JSON.stringify(ranked[0])}\n`);
  }
  if (process.env.V2_SIM_SEARCH_OUTPUT) writeFileSync(process.env.V2_SIM_SEARCH_OUTPUT, JSON.stringify(output, null, 2));
  process.stdout.write(`Search runtime ${((performance.now() - start) / 1000).toFixed(3)}s\n`);
}, 1_800_000);

it.runIf(process.env.V2_SIM_FINE === '1' || process.env.V2_SIM_LOCAL === '1' || process.env.V2_SIM_CALIBRATE === '1' || process.env.V2_SIM_TIMING === '1')('refines the first-boss neighborhood with independent XP and HP growth', () => {
  const start = performance.now();
  const candidates: ConfigOverridesV2[] = [];
  for (const baseAtk of [10, 12, 14, 16]) for (const hpGrowth of [1.06, 1.08, 1.10]) for (const xpGrowth of [1.12, 1.16, 1.20]) {
    candidates.push({
      cat: { baseAtk, baseHp: 300, baseDef: 5, levelGrowth: 0.06, xpGrowth },
      monster: { hpBase: 90, hpGrowth, atkBase: 8, atkGrowth: 1.06, xpBase: 18, xpGrowth: Number(process.env.V2_SIM_FINE_XP ?? 1.11) },
      idle: { dailyKeys: 3, walkTimeMs: 1000 },
      boss: { maxMs: 180000, attackIntervalMs: 4500, bigEveryMs: 6000, bigMultiplier: 1.5 },
    });
  }
  if (process.env.V2_SIM_LOCAL === '1') {
    candidates.length = 0;
    for (const baseAtk of [12, 13, 14]) for (const baseHp of [240, 270, 300]) candidates.push({
      ...C5B_V2_OVERRIDES, cat: { ...C5B_V2_OVERRIDES.cat, baseAtk, baseHp, xpGrowth: 1.12 },
      monster: { ...C5B_V2_OVERRIDES.monster, xpGrowth: 1.11 }, idle: { dailyKeys: 3, walkTimeMs: 1000 },
    });
  }
  if (process.env.V2_SIM_CALIBRATE === '1' || process.env.V2_SIM_TIMING === '1') {
    candidates.length = 0;
    for (const baseAtk of [10, 14, 18, 22]) for (const baseHp of [240, 300]) for (const hpGrowth of [1.06, 1.10]) for (const xpGrowth of [1.11, 1.15]) candidates.push({
      ...C5B_V2_OVERRIDES, cat: { ...C5B_V2_OVERRIDES.cat, baseAtk, baseHp, xpGrowth: 1.12 },
      monster: { ...C5B_V2_OVERRIDES.monster, hpGrowth, xpGrowth }, idle: { dailyKeys: 3, walkTimeMs: 1000, gearDropChance: 0.0067 },
    });
  }
  if (process.env.V2_SIM_TIMING === '1') {
    candidates.length = 0;
    for (const baseAtk of [14, 16]) for (const baseHp of [240, 300]) for (const hpGrowth of [1.06, 1.08]) for (const lossCooldownSeconds of [20, 30, 60]) candidates.push({
      ...C5B_V2_OVERRIDES, cat: { ...C5B_V2_OVERRIDES.cat, baseAtk, baseHp, xpGrowth: 1.12 },
      monster: { ...C5B_V2_OVERRIDES.monster, hpGrowth, xpGrowth: 1.11 },
      idle: { dailyKeys: 3, walkTimeMs: 1000, gearDropChance: 0.0067 },
      boss: { ...C5B_V2_OVERRIDES.boss, lossCooldownSeconds },
    });
  }
  const screened = candidates.map((overrides, i) => {
    if (!guardrailsCheckV2(overrides).ok) throw new Error('search escaped guardrails');
    const seeds = (process.env.V2_SIM_LOCAL === '1' || process.env.V2_SIM_CALIBRATE === '1' || process.env.V2_SIM_TIMING === '1') ? [1, 2, 3, 4, 5] : [1, 2, 3];
    const runs = CLASS_IDS.flatMap((classId) => seeds.map((seed) => simulateV2({ classId, seed, overrides, maxActiveMinutes: 60 })));
    const stepOne = (process.env.V2_SIM_LOCAL === '1' || process.env.V2_SIM_CALIBRATE === '1' || process.env.V2_SIM_TIMING === '1') ? CLASS_IDS.flatMap((classId) => seeds.map((seed) => simulateV2({ classId, seed, overrides, stepMinutes: 1, maxActiveMinutes: 60 }))) : [];
    const stable = stepOne.length > 0 && [3, 5].every((cohort) => CLASS_IDS.every((classId) => Math.abs(medianV2(runs.filter((r) => r.classId === classId && r.seed <= cohort).map((r) => r.minutesToFirstBossWin)) - medianV2(stepOne.filter((r) => r.classId === classId && r.seed <= cohort).map((r) => r.minutesToFirstBossWin))) <= 1));
    const checks = checkTargetsV2(runs, overrides);
    const first = checks.find((c) => c.id === 'first-boss')!.ok;
    const inside = runs.filter((r) => r.minutesToFirstBossWin !== null && r.minutesToFirstBossWin >= 10 && r.minutesToFirstBossWin <= 15).length;
    process.stdout.write(`Fine ${i + 1}/${candidates.length}: ${JSON.stringify(overrides.cat)} hpGrowth=${overrides.monster?.hpGrowth} cooldown=${overrides.boss?.lossCooldownSeconds ?? 60}; first=${first}; stable=${stable}; ${checks[0]!.detail}\n`);
    return { overrides, stable, score: Number(first) * 1000 + Number(stable) * 100 + inside };
  }).sort((a, b) => b.score - a.score);
  const output = [];
  for (const scenario of [undefined, 'S-A', 'S-B'] as const) {
    const ranked = screened.slice(0, process.env.V2_SIM_TIMING === '1' ? 2 : 4).map(({ overrides, stable }) => {
      const runs = CLASS_IDS.flatMap((classId) => [1, 2, 3, 4, 5].map((seed) => simulateV2({ classId, seed, overrides, scenario })));
      const checks = checkTargetsV2(runs, scenario === 'S-A' ? { ...overrides, idle: { ...overrides.idle, dailyKeys: 5 } } : overrides);
      const first = runs.filter((r) => r.minutesToFirstBossWin !== null && r.minutesToFirstBossWin >= 10 && r.minutesToFirstBossWin <= 15).length / runs.length;
      const clears = runs.reduce((sum, r) => sum + Object.values(r.minutesToChapterBossWin).filter((v) => v !== null).length, 0) / runs.length;
      const score = checks.filter((c) => c.ok).length * 1000 + Number(stable) * 100 + first * 10 + clears;
      process.stdout.write(`Fine refined ${scenario ?? 'config'}: score ${score}; ${((performance.now() - start) / 1000).toFixed(1)}s\n`);
      return { overrides, stable, score, checks };
    }).sort((a, b) => b.score - a.score);
    output.push({ scenario: scenario ?? 'config', ranked });
  }
  if (process.env.V2_SIM_SEARCH_OUTPUT) writeFileSync(process.env.V2_SIM_SEARCH_OUTPUT, JSON.stringify(output, null, 2));
  process.stdout.write(`Fine search runtime ${((performance.now() - start) / 1000).toFixed(3)}s\n`);
}, 1_800_000);

// Separate selection makes the required timing reliability an explicit eligibility check.
it.runIf(process.env.V2_SIM_SELECT === '1')('selects measured candidates with a stable claim-size diagnostic', () => {
  type Candidate = { overrides: ConfigOverridesV2; score: number; checks: ReturnType<typeof checkTargetsV2>; stable?: boolean };
  type Group = { scenario: string; ranked: Candidate[] };
  const files = (process.env.V2_SIM_SELECT_INPUTS ?? '').split(',').filter(Boolean);
  if (!files.length) throw new Error('selection requires search result inputs');
  const groups = files.flatMap((path) => JSON.parse(readFileSync(path, 'utf8')) as Group[]);
  const stability = new Map<string, boolean>();
  const output = [];
  for (const scenario of ['config', 'S-A', 'S-B']) {
    const candidates = [...new Map(groups.filter((g) => g.scenario === scenario).flatMap((g) => g.ranked).map((c) => [JSON.stringify(c.overrides), c])).values()];
    for (const candidate of candidates) {
      const key = JSON.stringify(candidate.overrides);
      if (!stability.has(key)) {
        const run = (stepMinutes: number) => CLASS_IDS.flatMap((classId) => [1, 2, 3, 4, 5].map((seed) => simulateV2({ classId, seed, overrides: candidate.overrides, maxActiveMinutes: 60, stepMinutes })));
        const a = run(1); const b = run(2);
        const stable = [3, 5].every((cohort) => CLASS_IDS.every((id) => {
          const median = (runs: typeof a) => medianV2(runs.filter((r) => r.classId === id && r.seed <= cohort).map((r) => r.minutesToFirstBossWin));
          return Math.abs(median(a) - median(b)) <= 1;
        }));
        stability.set(key, stable);
      }
      candidate.stable = stability.get(key)!;
      process.stdout.write(`${scenario}: stable=${candidate.stable}, passing=${candidate.checks.filter((c) => c.ok).length}, ${JSON.stringify(candidate.overrides)}\n`);
    }
    const ranked = candidates.sort((a, b) => {
      // Measurement acceptance is mandatory for the main proposal. Scenario tables are diagnostic.
      if (scenario === 'config' && a.stable !== b.stable) return Number(b.stable) - Number(a.stable);
      return b.checks.filter((c) => c.ok).length - a.checks.filter((c) => c.ok).length || b.score - a.score;
    });
    if (scenario === 'config' && !ranked[0]?.stable) throw new Error('no main candidate satisfies measurement acceptance');
    output.push({ scenario, ranked });
  }
  if (process.env.V2_SIM_SEARCH_OUTPUT) writeFileSync(process.env.V2_SIM_SEARCH_OUTPUT, JSON.stringify(output, null, 2));
}, 600000);
