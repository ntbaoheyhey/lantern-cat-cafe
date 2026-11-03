import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, cpSync, symlinkSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const out = "/private/tmp/tbh-t001-ledger/reports/cards/ORIG2-ART-FRESH/ui-mutants-a"; mkdirSync(out, { recursive: true });
const cases = [["default-preview-on", "apps/web/src/original-preview/OriginalCatalog.tsx", "useState<boolean>(CONFIG.features.originalEconomy)", "useState<boolean>(true)", "src/original-preview/OriginalCatalog.test.tsx"], ["fraction-rounded-away", "apps/web/src/original-preview/OriginalCatalog.tsx", "number(value * 100)", "number(Math.round(value) * 100)", "src/original-preview/OriginalCatalog.test.tsx"], ["quality-selection-ignored", "apps/web/src/original-preview/OriginalCatalog.tsx", "preview?.item(selectedItem, quality, level)", "preview?.item(selectedItem, 'common', level)", "src/original-preview/OriginalCatalog.test.tsx"], ["rank-selection-ignored", "apps/web/src/original-preview/OriginalCatalog.tsx", "preview?.skill(skillId, rank)", "preview?.skill(skillId, 1)", "src/original-preview/OriginalCatalog.test.tsx"], ["free-max-upgrade", "apps/web/src/original-preview/OriginalCatalog.tsx", "upgrade === null ? 'Maximum preview level'", "upgrade === null ? 'Next draft upgrade: 0 Fish'", "src/original-preview/OriginalCatalog.test.tsx"], ["armor-includes-weapons", "apps/web/src/original-preview/OriginalCatalog.tsx", "['helmet', 'armor', 'gloves', 'boots']", "['weapon', 'helmet', 'armor', 'gloves', 'boots']", "src/original-preview/OriginalCatalog.test.tsx"], ["atlas-wrong-y", "apps/web/src/original-preview/OriginalArt.tsx", "-entry.frame.y * scale", "-entry.frame.x * scale", "src/original-preview/OriginalCatalog.test.tsx"], ["fractional-icon-width", "apps/web/src/original-preview/OriginalArt.tsx", "width: entry.sourceSize.w * scale", "width: entry.sourceSize.w * scale + 0.5", "src/original-preview/OriginalCatalog.test.tsx"], ["persist-local-opt-in", "apps/web/src/original-preview/OriginalCatalog.tsx", "onClick={() => setEnabled(value => !value)}", "onClick={() => { localStorage.setItem('original-mutant', '1'); setEnabled(value => !value); }}", "src/original-preview/OriginalCatalog.test.tsx"], ["mutate-shared-flag", "apps/web/src/original-preview/OriginalCatalog.tsx", "onClick={() => setEnabled(value => !value)}", "onClick={() => { Object.assign(CONFIG.features, { originalEconomy: true }); setEnabled(value => !value); }}", "src/original-preview/OriginalCatalog.test.tsx"]];
const scratch = mkdtempSync(`/tmp/tbh-orig2-ui-mutants-`);
mkdirSync(`${scratch}/apps/web`, { recursive: true });
cpSync('apps/web/src', `${scratch}/apps/web/src`, { recursive: true });
symlinkSync(`${root}/apps/web/public`, `${scratch}/apps/web/public`);
for (const file of ['package.json', 'vite.config.ts', 'tsconfig.json']) cpSync(`apps/web/${file}`, `${scratch}/apps/web/${file}`);
cpSync('tsconfig.base.json', `${scratch}/tsconfig.base.json`);
mkdirSync(`${scratch}/reports/redesign/CXU4`, {recursive:true});
cpSync('reports/redesign/CXU4/help-strings.json', `${scratch}/reports/redesign/CXU4/help-strings.json`);
symlinkSync(`${root}/packages`, `${scratch}/packages`);
symlinkSync(`${root}/node_modules`, `${scratch}/node_modules`);
symlinkSync(`${root}/apps/web/node_modules`, `${scratch}/apps/web/node_modules`);
const control = spawnSync('npx', ['-y', 'pnpm@10.28.0', 'exec', 'vitest', 'run', 'src/original-preview'], { cwd: `${scratch}/apps/web`, encoding: 'utf8' });
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
