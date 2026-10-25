// @ts-expect-error Node APIs run only in Vitest; no Node type dependency is added.
import { readFileSync, writeFileSync } from 'node:fs';
// @ts-expect-error See above.
import { fileURLToPath, URL } from 'node:url';
import { expect, it } from 'vitest';
import { CLASS_IDS } from '../content';
import { simulateV2, type SimOptionsV2, type SimResultV2 } from './simulate';
import { PROPOSED_V2_OVERRIDES, SCENARIO_V2_OVERRIDES, C5B_V2_OVERRIDES, CONFIG_FIRST_BOSS_WITNESS_V2 } from './proposal';
import { renderNumbersReportV2 } from './report';
declare const process: { env: Record<string, string | undefined>; stdout: { write(message: string): void } };
declare const performance: { now(): number };
it.runIf(process.env.V2_SIM_WRITE === '1')('writes docs/proposals/numbers-v2.md', () => {
  const start = performance.now();
  const cache = new Map<string, SimResultV2>();
  const run = (label: string, options: Omit<SimOptionsV2, 'classId' | 'seed'> = {}, seeds = 5) => CLASS_IDS.flatMap((classId) => {
    const runs = Array.from({ length: seeds }, (_, i) => {
      const opts = { overrides: {}, stepMinutes: 2, activeMinutesPerDay: 1440, maxActiveMinutes: 1800, ...options, classId, seed: i + 1 };
      const key = JSON.stringify(opts);
      if (!cache.has(key)) cache.set(key, simulateV2(opts));
      return cache.get(key)!;
    });
    process.stdout.write(`${label}: ${classId}, ${seeds} seeds; elapsed ${((performance.now() - start) / 1000).toFixed(3)}s\n`);
    return runs;
  });
  const current = run('current');
  const proposed = run('proposal', { overrides: PROPOSED_V2_OVERRIDES }, 20);
  const diagnostic = run('step 1', { overrides: PROPOSED_V2_OVERRIDES, stepMinutes: 1 });
  const scenarios = (['S-A', 'S-B'] as const).map((id) => ({ id, runs: run(id, { overrides: SCENARIO_V2_OVERRIDES[id].overrides, scenario: id }) }));
  const profiles = [1440, 480, 120].map((activeMinutesPerDay) => ({ activeMinutesPerDay,
    runs: run(`day ${activeMinutesPerDay}`, { overrides: PROPOSED_V2_OVERRIDES, activeMinutesPerDay }) }));
  const c5b = run('C5b', { overrides: C5B_V2_OVERRIDES });
  const c5bWithoutKeyWall = run('C5b + S-A', { overrides: C5B_V2_OVERRIDES, scenario: 'S-A' });
  const firstBossWitness = run('first-boss witness', { overrides: CONFIG_FIRST_BOSS_WITNESS_V2, maxActiveMinutes: 60 });
  const data = { firstBossWitness, current, proposed, diagnostic, scenarios, profiles, c5b, c5bWithoutKeyWall };
  if (process.env.V2_SIM_COMPARE_DATA) {
    expect(data).toEqual(JSON.parse(readFileSync(process.env.V2_SIM_COMPARE_DATA, 'utf8')));
    process.stdout.write('All 455 saved runs match exactly after craft-preview optimization.\n');
  }
  if (process.env.V2_SIM_DATA) writeFileSync(process.env.V2_SIM_DATA, JSON.stringify(data));
  writeFileSync(fileURLToPath(new URL('../../../../../docs/proposals/numbers-v2.md', (import.meta as unknown as { url: string }).url)), renderNumbersReportV2(current, proposed, diagnostic, data));
  const runtime = (performance.now() - start) / 1000;
  process.stdout.write(`Writer runtime: ${runtime.toFixed(3)}s; ${cache.size} unique runs (shared tables cached)\n`);
  expect(runtime).toBeLessThan(600);
}, 600000);
