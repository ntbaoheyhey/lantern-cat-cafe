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
  const run = (overrides = {}) => CLASS_IDS.flatMap((classId) => Array.from({ length: 20 }, (_, index) => simulateV2({ classId, seed: index + 1, overrides })));
  const current = run();
  process.stdout.write(`Current 7 x 20 runtime: ${((performance.now() - start) / 1000).toFixed(3)}s\n`);
  const proposed = run(PROPOSED_V2_OVERRIDES);
  writeFileSync(fileURLToPath(new URL('../../../../../docs/proposals/numbers-v2.md', (import.meta as unknown as { url: string }).url)), renderNumbersReportV2(current, proposed));
  process.stdout.write(`Full 7 x 20 current + proposed runtime: ${((performance.now() - start) / 1000).toFixed(3)}s\n`);
}, 600_000);
