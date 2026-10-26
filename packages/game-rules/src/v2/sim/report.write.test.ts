// @ts-expect-error Node APIs run in Vitest only.
import { writeFileSync } from 'node:fs';
// @ts-expect-error Node test URL API.
import { fileURLToPath, URL } from 'node:url';
import { expect, it } from 'vitest';
import { CLASS_IDS } from '../content';
import { simulateV2, type SimResultV2 } from './simulate';
import { PROPOSED_V2_OVERRIDES, RANKED_V2_OVERRIDES } from './proposal';
import { renderNumbersReportV2 } from './report';
import type { ConfigOverridesV2 } from './config';
declare const console: { log(message: string): void };
declare const process: { env: Record<string, string | undefined> };
declare const performance: { now(): number };
it.runIf(process.env.V2_SIM_WRITE === '1')('writes docs/proposals/numbers-v2.md', () => {
  const start = performance.now(), cache = new Map<string, SimResultV2[]>();
  const run = (overrides: ConfigOverridesV2, seeds: number, stepMinutes = 2) => {
    const key = JSON.stringify({ overrides, seeds, stepMinutes });
    if (!cache.has(key)) cache.set(key, CLASS_IDS.flatMap(classId => Array.from({ length: seeds }, (_, i) => simulateV2({ classId, seed: i + 1, overrides, stepMinutes }))));
    return cache.get(key)!;
  };
  const current = run({}, 3), proposed = run(PROPOSED_V2_OVERRIDES, 20), diagnostic = run(PROPOSED_V2_OVERRIDES, 3, 1);
  const ranked = RANKED_V2_OVERRIDES.map(overrides => ({ overrides, runs: run(overrides, 3) }));
  const data = { current, proposed, diagnostic, ranked };
  if (process.env.V2_SIM_DATA) writeFileSync(process.env.V2_SIM_DATA, JSON.stringify(data));
  writeFileSync(fileURLToPath(new URL('../../../../../docs/proposals/numbers-v2.md', (import.meta as unknown as { url: string }).url)), renderNumbersReportV2(current, proposed, diagnostic, { ranked }));
  const seconds = (performance.now() - start) / 1000;
  console.log(`Writer runtime: ${seconds.toFixed(3)}s`);
  expect(seconds).toBeLessThan(240);
}, 180000);
