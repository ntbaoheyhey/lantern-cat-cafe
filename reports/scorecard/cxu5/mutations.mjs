import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, cpSync, symlinkSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const out = 'reports/scorecard/cxu5/logs/mutations'; mkdirSync(out, { recursive: true });
const cases = [
 ['locked-node-click', 'apps/web/src/map/ChapterMap.tsx', 'if (isLocked) return;', 'if (false) return;', 'src/layout/boss/BossMapScreen.test.tsx'],
 ['wrong-reward-table', 'apps/web/src/layout/boss/mapDetails.ts', 'firstClear ? definition.chests.firstClear : definition.chests.repeat', 'firstClear ? definition.chests.repeat : definition.chests.firstClear', 'src/layout/boss/mapDetails.test.ts'],
 ['wrong-boss-advice', 'apps/web/src/layout/boss/mapDetails.ts', '...v2.bossOfChapter(chapter)', '...v2.bossOfChapter(1)', 'src/layout/boss/mapDetails.test.ts'],
 ['premature-history', 'apps/web/src/layout/bossPresentation.ts', 'history: complete ? recordRun(state.history, fight) : state.history', 'history: recordRun(state.history, fight)', 'src/layout/bossPresentation.test.ts'],
 ['history-account-leak', 'apps/web/src/layout/bossPresentation.ts', "case 'reset': return INITIAL_BOSS_PRESENTATION", "case 'reset': return state", 'src/layout/bossPresentation.test.ts'],
 ['history-unbounded', 'apps/web/src/layout/bossPresentation.ts', '.slice(0, 30)', '.slice(0, 300)', 'src/layout/bossPresentation.test.ts'],
 ['history-chapter-leak', 'apps/web/src/layout/boss/BossMapScreen.tsx', 'history.filter((run) => run.chapter === chapter)', 'history.filter(() => true)', 'src/layout/boss/BossMapScreen.test.tsx'],
];
const scratch = mkdtempSync(`${root}/reports/scorecard/cxu5/.mutants-`);
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
