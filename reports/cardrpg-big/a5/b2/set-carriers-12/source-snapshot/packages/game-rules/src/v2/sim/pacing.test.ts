// @ts-expect-error Node APIs are used only by the opt-in measurement harness.
import { readFileSync, writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { CLASS_IDS } from '../content';
import type { ConfigOverridesV2 } from './config';
import { PROPOSED_V2_OVERRIDES } from './proposal';
import { relaxedTargetsV2 } from './report';
import { simulateV2, type SimResultV2 } from './simulate';
import { checkTargetsV2, guardrailsCheckV2 } from './targets';
declare const process: { env: Record<string, string | undefined> };
declare const console: { log(message: string): void };

const cohort = (overrides: ConfigOverridesV2, stepMinutes: number, seeds = [1, 2, 3]) =>
  CLASS_IDS.flatMap(classId => seeds.map(seed => simulateV2({ classId, seed, overrides, stepMinutes })));

it.runIf(process.env.V6H_BASELINE === '1')('records the frozen proposal at both claim cadences', () => {
  const rows = [1, 2].map(step => {
    const runs = cohort(PROPOSED_V2_OVERRIDES, step);
    return { step, runs, strict: checkTargetsV2(runs), relaxed: relaxedTargetsV2(runs) };
  });
  writeFileSync('/tmp/v6h-logs/baseline.json', JSON.stringify(rows));
  expect(rows.every(row => row.runs.length === 21)).toBe(true);
}, 180000);

const pacingRanked: { overrides: ConfigOverridesV2; strict: ReturnType<typeof checkTargetsV2>; score: number; runs: SimResultV2[] }[] = [];
it.runIf(process.env.V6H_SEARCH === '1').each([0, 1, 2, 3])('measures every bounded pacing candidate in batch %i without changing targets', (batch) => {
  const ranked = pacingRanked;
  let index = 0;
  // Prefer chapter leaves, then independently test global growth only where arrays saturate.
  for (const kills of [[10, 15, 21, 28, 30], [12, 18, 24, 30, 30], [18, 22, 26, 30, 30]] as const)
    for (const hpGrowth of [1.06, 1.08, 1.10, 1.12])
      for (const xpGrowth of [1.06, 1.11]) {
        if (Math.floor(index++ / 6) !== batch) continue;
        const overrides: ConfigOverridesV2 = {
          ...PROPOSED_V2_OVERRIDES,
          chapters: { killsPerRound: [...kills] },
          monster: { ...PROPOSED_V2_OVERRIDES.monster, hpGrowth, xpGrowth },
        };
        expect(guardrailsCheckV2(overrides).ok).toBe(true);
        const runs = cohort(overrides, 2);
        const strict = checkTargetsV2(runs, overrides);
        const score = strict.filter(c => c.ok).length;
        ranked.push({ overrides, strict, score, runs });
        console.log(`pacing ${ranked.length}/24: ${score}/9`);
      }
  expect(ranked).toHaveLength((batch + 1) * 6);
  if (batch === 3) {
    ranked.sort((a, b) => b.score - a.score);
    writeFileSync('/tmp/v6h-logs/pacing.json', JSON.stringify({ ranked }));
  }
}, 180000);

it.runIf(process.env.V6H_PRESSURE === '1')('measures chapter boss pressure on the best pacing families', () => {
  const input = JSON.parse(readFileSync('/tmp/v6h-logs/pacing.json', 'utf8')) as { ranked: { overrides: ConfigOverridesV2 }[] };
  const ranked = [];
  for (const base of input.ranked.slice(0, 3)) for (const factor of [1.5, 2, 2.5, 3]) {
    const overrides: ConfigOverridesV2 = { ...base.overrides, boss: {
      ...base.overrides.boss,
      chapterAtkMul: [0.85 * factor, 1.5 * factor, Math.min(7.5, 2.5 * factor), Math.min(7.5, 3 * factor), Math.min(7.5, 3.5 * factor)],
    } };
    expect(guardrailsCheckV2(overrides).ok).toBe(true);
    const runs = cohort(overrides, 2), strict = checkTargetsV2(runs, overrides);
    ranked.push({ overrides, strict, score: strict.filter(c => c.ok).length, runs });
    console.log(`pressure ${ranked.length}/12: ${strict.filter(c => c.ok).length}/9`);
  }
  ranked.sort((a, b) => b.score - a.score);
  writeFileSync('/tmp/v6h-logs/pressure.json', JSON.stringify({ ranked }));
  expect(ranked).toHaveLength(12);
}, 180000);

it.runIf(process.env.V6H_REVIEW === '1')('rechecks the closest candidates at both cadences and holds out seeds 4–8 after a strict pass', () => {
  const sources = ['pacing', 'pressure'].flatMap(name =>
    (JSON.parse(readFileSync(`/tmp/v6h-logs/${name}.json`, 'utf8')) as { ranked: { overrides: ConfigOverridesV2; score: number; runs: SimResultV2[] }[] }).ranked);
  sources.push({ overrides: PROPOSED_V2_OVERRIDES, score: 0, runs: cohort(PROPOSED_V2_OVERRIDES, 2) });
  const unique = [...new Map(sources.map(row => [JSON.stringify(row.overrides), row])).values()];
  // Recompute ranking from strict targets, without using relaxed results.
  const measured = unique.map(row => {
    const runs = row.runs, strict = checkTargetsV2(runs, row.overrides);
    return { ...row, runs, strict, score: strict.filter(c => c.ok).length };
  }).sort((a, b) => b.score - a.score);
  const reviews = measured.slice(0, 3).map(row => {
    const step1 = cohort(row.overrides, 1);
    return { ...row, step1, strictStep1: checkTargetsV2(step1, row.overrides), relaxed: relaxedTargetsV2(row.runs, row.overrides) };
  });
  const holdouts = measured.filter(row => row.strict.every(c => c.ok)).map(row => {
    const runs = cohort(row.overrides, 2, [4, 5, 6, 7, 8]);
    return { overrides: row.overrides, runs, strict: checkTargetsV2(runs, row.overrides) };
  });
  writeFileSync('/tmp/v6h-logs/review.json', JSON.stringify({ measured, reviews, holdouts }));
  expect(measured.every(row => guardrailsCheckV2(row.overrides).ok)).toBe(true);
}, 180000);
