import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, cpSync, symlinkSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const out = "/private/tmp/tbh-t001-ledger/reports/cards/CXU4-FRESH/mutants-a-r2"; mkdirSync(out, { recursive: true });
const cases = [["power-parts", "apps/web/src/layout/character/CharacterPanel.tsx", "bonus: power - withoutBonus", "bonus: power - withoutBonus + 1", "src/layout/character/HeroScreen.test.tsx"], ["include-unworn", "apps/web/src/layout/character/CharacterPanel.tsx", ".filter((i) => i.equipped)", ".filter(() => true)", "src/layout/character/HeroScreen.test.tsx"], ["search-prefix-only", "apps/web/src/layout/HelpTab.tsx", ".includes(normalized(query))", ".startsWith(normalized(query))", "src/layout/HelpTab.search.test.tsx"], ["modal-close-order", "apps/web/src/ui/Modal.tsx", "stack.splice(stack.indexOf(node), 1);", "stack.pop();", "src/ui/ui.test.tsx"], ["disabled-tabstop", "apps/web/src/ui/Modal.tsx", " || el.matches(':disabled')", "", "src/ui/ui.test.tsx"], ["dismiss-errors", "apps/web/src/ui/Toast.tsx", "toast.tone === 'error' || hovered || focused", "hovered || focused", "src/ui/ui.test.tsx"], ["all-tabs-focusable", "apps/web/src/ui/Tabs.tsx", "tabIndex={active === tab.id ? 0 : -1}", "tabIndex={0}", "src/ui/ui.test.tsx"], ["false-class-success", "apps/web/src/layout/character/HeroScreen.tsx", "success = await onChooseClass(selected);", "await onChooseClass(selected); success = true;", "src/layout/character/HeroScreen.test.tsx"], ["banner-action", "apps/web/src/ui/Banner.tsx", "onClick={action.onAction}", "onClick={() => {}}", "src/ui/ui.test.tsx"], ["confirm-start-focus", "apps/web/src/ui/ConfirmModal.tsx", "initialFocusRef={cancel}", "initialFocusRef={undefined}", "src/ui/ui.test.tsx"], ["inline-text-spacing", "apps/web/src/layout/HelpTab.tsx", ".join('')", ".join(' ')", "src/layout/HelpTab.search.test.tsx"]];
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
