import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, cpSync, symlinkSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const out = "/private/tmp/tbh-t001-ledger/reports/cards/ORIG2-ART-FRESH/ui-mutants-b"; mkdirSync(out, { recursive: true });
const cases = [["level-selection-ignored", "apps/web/src/original-preview/OriginalCatalog.tsx", "preview?.item(selectedItem, quality, level)", "preview?.item(selectedItem, quality, 1)", "src/original-preview/OriginalCatalog.test.tsx"], ["output-rate-as-trigger", "apps/web/src/original-preview/OriginalCatalog.tsx", "number(effect!.amountPerActivation)", "number(effect!.amountPerSecond)", "src/original-preview/OriginalCatalog.test.tsx"], ["zero-upgrade-price", "apps/web/src/original-preview/OriginalCatalog.tsx", "number(upgrade!)", "number(0)", "src/original-preview/OriginalCatalog.test.tsx"], ["cooldown-unit-wrong", "apps/web/src/original-preview/OriginalCatalog.tsx", "number(skill.every / 1000)", "number(skill.every)", "src/original-preview/OriginalCatalog.test.tsx"], ["weapons-filter-all", "apps/web/src/original-preview/OriginalCatalog.tsx", "table.gear.items[id].slot === 'weapon'", "true", "src/original-preview/OriginalCatalog.test.tsx"], ["cap-shows-base", "apps/web/src/original-preview/OriginalCatalog.tsx", "formatDraftStat(id, table.stats[id].cap!)", "formatDraftStat(id, table.stats[id].base)", "src/original-preview/OriginalCatalog.test.tsx"], ["rank-gate-wrong", "apps/web/src/original-preview/OriginalCatalog.tsx", "table.skills.unlockLevels[rank - 1]!", "table.skills.unlockLevels[0]!", "src/original-preview/OriginalCatalog.test.tsx"], ["regen-unit-missing", "apps/web/src/original-preview/OriginalCatalog.tsx", "unit === 'fraction/second' ? '/s' : ''", "unit === 'fraction/second' ? '' : ''", "src/original-preview/OriginalCatalog.test.tsx"], ["atlas-scale-ignored", "apps/web/src/original-preview/OriginalArt.tsx", "atlas.meta.size.w * scale", "atlas.meta.size.w", "src/original-preview/OriginalCatalog.test.tsx"], ["lazy-unmount-missing", "apps/web/src/ui/Tabs.tsx", "{(!tab.lazy || active === tab.id) && tab.content}", "{tab.content}", "src/original-preview/OriginalCatalog.test.tsx"]];
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
