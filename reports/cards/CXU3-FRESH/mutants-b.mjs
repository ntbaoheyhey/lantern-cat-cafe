import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, cpSync, symlinkSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const out = "/private/tmp/tbh-t001-ledger/reports/cards/CXU3-FRESH/mutants-b"; mkdirSync(out, { recursive: true });
const cases = [["mine-filter-leak", "apps/web/src/market/marketViewModel.ts", "? isOwnListing(listing, address)", "? true", "src/market/marketViewModel.test.ts"], ["reversed-quantities", "apps/web/src/market/marketViewModel.ts", "compare(a.amount, b.amount)", "compare(b.amount, a.amount)", "src/market/marketViewModel.test.ts"], ["wrong-buy-value", "apps/web/src/market/MarketTab.tsx", "functionName: 'buy', args: [l.id], value: l.price", "functionName: 'buy', args: [l.id], value: l.price + 1n", "src/market/MarketTab.test.tsx"], ["cancel-token-not-listing", "apps/web/src/market/MarketTab.tsx", "functionName: 'cancel', args: [l.id]", "functionName: 'cancel', args: [l.relicId]", "src/market/MarketTab.test.tsx"], ["swapped-list-amount-price", "apps/web/src/market/MarketTab.tsx", "args: [selected.relicId, amount, price]", "args: [selected.relicId, price, amount]", "src/market/MarketTab.test.tsx"], ["zero-price-valid", "apps/web/src/market/MarketTab.tsx", "return v > 0n ? v : undefined;", "return v >= 0n ? v : undefined;", "src/market/MarketTab.test.tsx"], ["stale-selected-detail", "apps/web/src/market/MarketView.tsx", "props.readFailed || props.loadingListings ? []", "false ? []", "src/market/MarketTab.test.tsx"], ["false-fish-cost", "apps/web/src/layout/forge/ForgePanel.tsx", "{stacks.fish ?? 0} / {recipe.fish}", "{stacks.fish ?? 0} / {recipe.fish + 1}", "src/layout/forge/ForgePanel.test.tsx"], ["false-rarity-label", "apps/web/src/layout/forge/ForgePanel.tsx", "{capitalize(recipe.rarity)} gear", "Common gear", "src/layout/forge/ForgePanel.test.tsx"], ["salvage-zero-yield", "apps/web/src/layout/forge/ForgePanel.tsx", "(salvageYieldTotals[matKey] ?? 0) + amt", "(salvageYieldTotals[matKey] ?? 0) + 0", "src/layout/forge/ForgePanel.test.tsx"], ["wrong-heading-contract", "apps/web/src/layout/forge/ForgePanel.tsx", "Recipe Cost &amp; Balance", "Recipe Cost", "src/layout/a11y/v2-components.a11y.test.tsx"]];
const scratch = mkdtempSync(`/tmp/tbh-cxu3-b-mutants-`);
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
const control = spawnSync('npx', ['-y', 'pnpm@10.28.0', 'exec', 'vitest', 'run', 'src/market', 'src/layout/forge', 'src/layout/a11y/v2-components.a11y.test.tsx'], { cwd: `${scratch}/apps/web`, encoding: 'utf8' });
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
