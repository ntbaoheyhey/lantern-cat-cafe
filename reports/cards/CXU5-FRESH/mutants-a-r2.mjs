import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, cpSync, symlinkSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const out = "/private/tmp/tbh-t001-ledger/reports/cards/CXU5-FRESH/mutants-a-r2"; mkdirSync(out, { recursive: true });
const cases = [["chance-unit", "apps/web/src/layout/boss/mapDetails.ts", "line.chance * 100", "line.chance * 10", "src/layout/boss/mapDetails.test.ts"], ["invert-history-win", "apps/web/src/layout/bossPresentation.ts", "won: fight.result.won", "won: !fight.result.won", "src/layout/bossPresentation.test.ts"], ["off-by-one-history-bound", "apps/web/src/layout/bossPresentation.ts", ".slice(0, 30)", ".slice(0, 29)", "src/layout/bossPresentation.test.ts"], ["truncate-visible-runs", "apps/web/src/layout/boss/BossMapScreen.tsx", ".slice(0, 3)", ".slice(0, 2)", "src/layout/boss/BossMapScreen.test.tsx"], ["first-timeline-duration", "apps/web/src/layout/bossPresentation.ts", "fight.result.timeline.at(-1)?.t", "fight.result.timeline.at(0)?.t", "src/layout/bossPresentation.test.ts"], ["compact-fallback", "apps/web/src/layout/boss/BossMapScreen.tsx", "if (compact) return", "if (false) return", "src/layout/boss/BossMapScreen.test.tsx"]];
const scratch = mkdtempSync(`/tmp/tbh-cxu5-fresh-mutants-`);
mkdirSync(`${scratch}/apps/web`, { recursive: true });
cpSync('apps/web/src', `${scratch}/apps/web/src`, { recursive: true });
for (const file of ['package.json', 'vite.config.ts', 'tsconfig.json']) cpSync(`apps/web/${file}`, `${scratch}/apps/web/${file}`);
cpSync('tsconfig.base.json', `${scratch}/tsconfig.base.json`);
symlinkSync(`${root}/packages`, `${scratch}/packages`);
symlinkSync(`${root}/node_modules`, `${scratch}/node_modules`);
symlinkSync(`${root}/apps/web/node_modules`, `${scratch}/apps/web/node_modules`);
const control = spawnSync('npx', ['-y', 'pnpm@10.28.0', 'exec', 'vitest', 'run', 'src/layout/boss', 'src/layout/bossPresentation.test.ts'], { cwd: `${scratch}/apps/web`, encoding: 'utf8' });
writeFileSync(`${out}/control.log`, `${control.stdout}${control.stderr}\nEXIT ${control.status}\n`);
if (control.status !== 0) { rmSync(scratch, { recursive: true }); throw Error('Scratch control failed'); }
const results = [];
for (const [name, path, from, to, test] of cases) {
 const original = readFileSync(`${scratch}/${path}`, 'utf8');
 if (!original.includes(from)) throw Error(`Missing target ${name}`);
 try {
  writeFileSync(`${scratch}/${path}`, original.replace(from, to));
  const result = spawnSync('npx', ['-y', 'pnpm@10.28.0', 'exec', 'vitest', 'run', test], { cwd: `${scratch}/apps/web`, encoding: 'utf8' });
  writeFileSync(`${out}/${name}.log`, `${result.stdout}${result.stderr}\nEXIT ${result.status}\n`);
  const killed = result.status !== 0 && /AssertionError|expected|toBe|TestingLibraryElementError/.test(result.stdout + result.stderr);
  results.push({ name, path, from, to, exit: result.status, killed });
  console.log(name, killed ? 'detected' : 'SURVIVED');
 } finally { writeFileSync(`${scratch}/${path}`, original); }
}
rmSync(scratch, { recursive: true });
writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2));
if (results.some(result => !result.killed)) process.exitCode = 1;
