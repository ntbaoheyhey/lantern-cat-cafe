import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, cpSync, symlinkSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const out = "/private/tmp/tbh-t001-ledger/reports/cards/CXU3-FRESH/mutants-a-r3"; mkdirSync(out, { recursive: true });
const cases = [["lossy-prices", "apps/web/src/market/marketViewModel.ts", "compare(a.price, b.price)", "compare(BigInt(Number(a.price)), BigInt(Number(b.price)))", "src/market/marketViewModel.test.ts"], ["case-sensitive-owner", "apps/web/src/market/marketViewModel.ts", "listing.seller.toLowerCase() === address.toLowerCase()", "listing.seller === address", "src/market/marketViewModel.test.ts"], ["unstable-ties", "apps/web/src/market/marketViewModel.ts", "order === 0 ? compare(a.id, b.id)", "order === 0 ? -compare(a.id, b.id)", "src/market/marketViewModel.test.ts"], ["reverted-is-success", "apps/web/src/market/MarketTab.tsx", "if (receipt.status !== 'success')", "if (false)", "src/market/MarketTab.test.tsx"], ["skip-approval", "apps/web/src/market/MarketTab.tsx", "if (approval.data !== true)", "if (false)", "src/market/MarketTab.test.tsx"], ["missing-client-write", "apps/web/src/market/MarketTab.tsx", "if (!client) throw new Error('No Fuji connection');", "", "src/market/MarketTab.test.tsx"], ["buy-chain-not-pinned", "apps/web/src/market/MarketTab.tsx", "functionName: 'buy', args: [l.id], value: l.price, chainId: FUJI_CHAIN_ID", "functionName: 'buy', args: [l.id], value: l.price", "src/market/MarketTab.test.tsx"], ["stale-read-list", "apps/web/src/market/MarketView.tsx", "disabled={!props.form.canList || props.readFailed || props.loadingHoldings}", "disabled={!props.form.canList}", "src/market/MarketTab.test.tsx"], ["false-craft-odds", "apps/web/src/layout/forge/ForgePanel.tsx", "textAlign: 'right' }}>100</td>", "textAlign: 'right' }}>99</td>", "src/layout/forge/ForgePanel.test.tsx"], ["full-bag-allowed", "apps/web/src/layout/forge/ForgePanel.tsx", "items.length >= v2.V2_CONFIG.bag.limit", "items.length > v2.V2_CONFIG.bag.limit", "src/layout/forge/ForgePanel.test.tsx"], ["false-relic-price", "apps/web/src/layout/forge/ForgePanel.tsx", "{v2.RELIC_RECIPE.materials.yarn} Yarn +", "{v2.RELIC_RECIPE.materials.yarn! + 1} Yarn +", "src/layout/forge/ForgePanel.test.tsx"]];
const scratch = mkdtempSync(`/tmp/tbh-cxu3-a-mutants-`);
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
