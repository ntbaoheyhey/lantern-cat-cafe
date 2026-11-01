import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
let failed = false;
for (let run = 1; run <= 10; run++) {
 const result = spawnSync('npx', ['-y', 'pnpm@10.28.0', 'exec', 'vitest', 'run', 'src/layout/boss/BossMapScreen.test.tsx', 'src/layout/boss/mapDetails.test.ts', 'src/layout/bossPresentation.test.ts', '--maxWorkers=1'], { cwd: 'apps/web', encoding: 'utf8' });
 writeFileSync(`reports/scorecard/cxu5/logs/unit-repeat-${run}.log`, `${result.stdout}${result.stderr}\nEXIT ${result.status}\n`);
 console.log(run, result.status); failed ||= result.status !== 0;
}
if (failed) process.exitCode = 1;
