// @ts-expect-error Node APIs run only in Vitest; this package intentionally has no Node type dependency.
import { writeFileSync } from 'node:fs';
// @ts-expect-error See above; no dependency changes for this opt-in writer.
import { fileURLToPath, URL } from 'node:url';
import { it } from 'vitest';
import { CLASS_IDS } from '../content';
import { simulateV2 } from './simulate';
import { PROPOSED_V2_OVERRIDES } from './proposal';
import { renderNumbersReportV2 } from './report';
declare const process: { env: Record<string, string | undefined>; stdout: { write(message: string): void } };
declare const performance: { now(): number };
it.runIf(process.env.V2_SIM_WRITE === '1')('writes docs/proposals/numbers-v2.md', () => {
  const start = performance.now();
  const run = (overrides = {}, stepMinutes = 2, seeds = 20) => CLASS_IDS.flatMap((classId) => {
    const runs = Array.from({ length: seeds }, (_, index) => simulateV2({ classId, seed: index + 1, overrides, stepMinutes, maxActiveMinutes: 1800 }));
    process.stdout.write(`Completed ${classId}, step ${stepMinutes}, ${seeds} seeds; elapsed ${((performance.now() - start) / 1000).toFixed(3)}s\n`);
    return runs;
  });
  const current = run();
  process.stdout.write(`Current 7 x 20 runtime: ${((performance.now() - start) / 1000).toFixed(3)}s\n`);
  const proposed = run(PROPOSED_V2_OVERRIDES);
  const diagnostic = run(PROPOSED_V2_OVERRIDES, 1, 5);
  if (process.env.V2_SIM_DATA) writeFileSync(process.env.V2_SIM_DATA, JSON.stringify({ current, proposed, diagnostic }));
  writeFileSync(fileURLToPath(new URL('../../../../../docs/proposals/numbers-v2.md', (import.meta as unknown as { url: string }).url)), renderNumbersReportV2(current, proposed, diagnostic));
  process.stdout.write(`Full 7 x 20 current + proposed + diagnostic runtime: ${((performance.now() - start) / 1000).toFixed(3)}s\n`);
  if (performance.now() - start > 600000) process.stdout.write('Report exceeded ten minutes.\n');
}, 1_200_000);
