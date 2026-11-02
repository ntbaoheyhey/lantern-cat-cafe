import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, cpSync, symlinkSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const out = "/private/tmp/tbh-t001-ledger/reports/cards/CXU4-FRESH/mutants-b-r3"; mkdirSync(out, { recursive: true });
const cases = [["gear-level-double-count", "apps/web/src/layout/character/CharacterPanel.tsx", "gear: withoutBonus - level", "gear: withoutBonus", "src/layout/character/HeroScreen.test.tsx"], ["wrong-total-power", "apps/web/src/layout/character/CharacterPanel.tsx", "const power = Math.round(v2.powerRating(stats));", "const power = Math.round(v2.powerRating(stats)) + 1;", "src/layout/character/HeroScreen.test.tsx"], ["query-case", "apps/web/src/layout/HelpTab.tsx", ".trim().toLocaleLowerCase()", ".trim()", "src/layout/HelpTab.search.test.tsx"], ["query-spaces", "apps/web/src/layout/HelpTab.tsx", ".replace(/\\s+/g, ' ')", "", "src/layout/HelpTab.search.test.tsx"], ["unlock-under-modal", "apps/web/src/ui/Modal.tsx", "const topBackdrop = stack.at(-1)?.parentElement;", "const topBackdrop = undefined;", "src/ui/ui.test.tsx"], ["lost-original-opener", "apps/web/src/ui/Modal.tsx", "opener?.isConnected ? opener : firstOpener", "opener", "src/ui/ui.test.tsx"], ["toast-focus-pause", "apps/web/src/ui/Toast.tsx", " || focused", "", "src/ui/ui.test.tsx"], ["tab-home", "apps/web/src/ui/Tabs.tsx", "event.key === 'Home' ? 0", "event.key === 'Home' ? tabs.length - 1", "src/ui/ui.test.tsx"], ["class-result-close", "apps/web/src/layout/character/HeroScreen.tsx", "if (success) setOpen(false);", "if (!success) setOpen(false);", "src/layout/character/HeroScreen.test.tsx"], ["empty-search-action", "apps/web/src/ui/EmptyState.tsx", "onClick={action.onAction}", "onClick={() => {}}", "src/layout/HelpTab.search.test.tsx"], ["busy-class-action", "apps/web/src/layout/character/CharacterPanel.tsx", "disabled={classBusy}", "disabled={false}", "src/layout/character/HeroScreen.test.tsx"], ["escape-close", "apps/web/src/ui/Modal.tsx", "event.key === 'Escape'", "event.key === 'Esc'", "src/ui/ui.test.tsx"]];
const scratch = mkdtempSync(`/tmp/tbh-cxu4-fresh-mutants-`);
mkdirSync(`${scratch}/apps/web`, { recursive: true });
cpSync('apps/web/src', `${scratch}/apps/web/src`, { recursive: true });
for (const file of ['package.json', 'vite.config.ts', 'tsconfig.json']) cpSync(`apps/web/${file}`, `${scratch}/apps/web/${file}`);
cpSync('tsconfig.base.json', `${scratch}/tsconfig.base.json`);
mkdirSync(`${scratch}/reports/redesign/CXU4`, {recursive:true});
cpSync('reports/redesign/CXU4/help-strings.json', `${scratch}/reports/redesign/CXU4/help-strings.json`);
symlinkSync(`${root}/packages`, `${scratch}/packages`);
symlinkSync(`${root}/node_modules`, `${scratch}/node_modules`);
symlinkSync(`${root}/apps/web/node_modules`, `${scratch}/apps/web/node_modules`);
const control = spawnSync('npx', ['-y', 'pnpm@10.28.0', 'exec', 'vitest', 'run', 'src/ui', 'src/layout/character', 'src/layout/HelpTab', 'src/onboarding'], { cwd: `${scratch}/apps/web`, encoding: 'utf8' });
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
