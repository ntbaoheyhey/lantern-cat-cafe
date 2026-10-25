// @ts-expect-error Node APIs are available in the opt-in Vitest search only.
import { readFileSync, writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { Rng } from '../../rng';
import { CLASS_IDS } from '../content';
import { simulateV2 } from './simulate';
import { checkTargetsV2, guardrailsCheckV2 } from './targets';
import type { ConfigOverridesV2 } from './config';
declare const process: { env: Record<string, string | undefined>; stdout: { write(message: string): void } };
declare const performance: { now(): number };

it.runIf(process.env.V2_SIM_SEARCH === '1')('searches bounded config candidates without changing production', () => {
  const start = performance.now();
  const ranked: { overrides: ConfigOverridesV2; score: number; checks: ReturnType<typeof checkTargetsV2> }[] = [];
  let count = 0;
  if (process.env.V2_SIM_EXPLORE === '1') {
    const rng = new Rng(62026);
    const pick = (values: number[]) => values[rng.int(0, values.length - 1)]!;
    for (let trial = 0; trial < 96; trial++) {
      const overrides: ConfigOverridesV2 = {
        cat: { baseAtk: pick([8, 14, 22, 30]), baseHp: pick([100, 200, 300]), baseDef: pick([5, 10, 15]), levelGrowth: pick([0.02, 0.04, 0.06, 0.08]) },
        monster: { hpBase: pick([30, 60, 90]), hpGrowth: pick([1.06, 1.10, 1.13, 1.15]), atkBase: pick([1.32, 4, 8]), atkGrowth: pick([1.01, 1.06, 1.12]), xpBase: pick([6, 12, 18]) },
        idle: { dailyKeys: 3, walkTimeMs: pick([330, 500, 1000]), clearedChapterKeyChance: 0.02 },
        boss: { maxMs: 180000, attackIntervalMs: pick([1500, 3000, 4500]), bigEveryMs: pick([6000, 12000, 18000]), bigMultiplier: pick([0.83, 1.5, 2.5]) },
      };
      if (!guardrailsCheckV2(overrides).ok) throw new Error(guardrailsCheckV2(overrides).detail);
      const results = CLASS_IDS.map((classId) => simulateV2({ classId, seed: 1, overrides, maxActiveMinutes: 360 }));
      const checks = checkTargetsV2(results, overrides);
      const first = results.filter((r) => r.minutesToFirstBossWin !== null && r.minutesToFirstBossWin >= 10 && r.minutesToFirstBossWin <= 15).length;
      const clears = results.reduce((sum, r) => sum + Object.values(r.minutesToChapterBossWin).filter((v) => v !== null).length, 0);
      ranked.push({ overrides, score: checks.filter((c) => c.ok).length * 100 + first * 3 + clears, checks });
      if ((trial + 1) % 8 === 0) process.stdout.write(`Explored ${trial + 1}/96 in ${((performance.now() - start) / 1000).toFixed(1)}s\n`);
    }
  } else if (!process.env.V2_SIM_REFINE_INPUT) {
  for (const baseAtk of [8, 14, 22]) for (const hpBase of [45, 70, 90]) for (const hpGrowth of [1.07, 1.10, 1.13]) for (const levelGrowth of [0.02, 0.04, 0.06]) {
    const overrides: ConfigOverridesV2 = {
      cat: { baseAtk, baseHp: 300, levelGrowth }, monster: { hpBase, hpGrowth, atkGrowth: 1.06 },
      idle: { dailyKeys: 3, walkTimeMs: 330 }, boss: { maxMs: 180000 },
    };
    if (!guardrailsCheckV2(overrides).ok) throw new Error('search escaped guardrails');
    const results = CLASS_IDS.map((classId) => simulateV2({ classId, seed: 1, overrides, maxActiveMinutes: 360 }));
    const checks = checkTargetsV2(results, overrides);
    // Fractional progress inside failed aggregate targets guides the finite search.
    const first = results.filter((r) => r.minutesToFirstBossWin !== null && r.minutesToFirstBossWin >= 10 && r.minutesToFirstBossWin <= 15).length;
    const clears = results.reduce((sum, r) => sum + Object.values(r.minutesToChapterBossWin).filter((v) => v !== null).length, 0);
    const score = checks.filter((c) => c.ok).length * 100 + first * 3 + clears;
    ranked.push({ overrides, score, checks });
    count++;
    if (count % 9 === 0) process.stdout.write(`Searched ${count}/81 in ${((performance.now() - start) / 1000).toFixed(1)}s\n`);
  }
  } else {
    const previous = JSON.parse(readFileSync(process.env.V2_SIM_REFINE_INPUT, 'utf8')) as typeof ranked;
    // Re-evaluate the eight leading seed-1 candidates at the full horizon with three seeds.
    for (const candidate of previous.slice(0, 8)) {
      const overrides = candidate.overrides;
      const results = CLASS_IDS.flatMap((classId) => [1, 2, 3].map((seed) => simulateV2({ classId, seed, overrides, maxActiveMinutes: 1800 })));
      const checks = checkTargetsV2(results, overrides);
      const first = results.filter((r) => r.minutesToFirstBossWin !== null && r.minutesToFirstBossWin >= 10 && r.minutesToFirstBossWin <= 15).length;
      const clears = results.reduce((sum, r) => sum + Object.values(r.minutesToChapterBossWin).filter((v) => v !== null).length, 0);
      const score = checks.filter((c) => c.ok).length * 1000 + first * 3 + clears;
      ranked.push({ overrides, score, checks });
      process.stdout.write(`Refined ${ranked.length}/8 in ${((performance.now() - start) / 1000).toFixed(1)}s\n`);
    }
  }
  ranked.sort((a, b) => b.score - a.score);
  if (process.env.V2_SIM_SEARCH_OUTPUT) writeFileSync(process.env.V2_SIM_SEARCH_OUTPUT, JSON.stringify(ranked, null, 2));
  process.stdout.write(`Best bounded candidate: ${JSON.stringify(ranked[0])}\nSearch runtime ${((performance.now() - start) / 1000).toFixed(3)}s\n`);
}, 600000);
