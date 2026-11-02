import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, cpSync, symlinkSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const out = "/private/tmp/tbh-t001-ledger/reports/cards/CXC2-FRESH/range-mutants-b"; mkdirSync(out, { recursive: true });
const cases = [["wrong-snapshot-height", "apps/web/src/chain-proof/fujiProof.ts", "client.getCode({ address: nft, blockNumber: block })", "client.getCode({ address: nft, blockNumber: block + 1n })", "src/chain-proof/fujiProof.test.ts"], ["window-upper-leak", "apps/web/src/chain-proof/fujiProof.ts", "log.blockNumber <= block", "log.blockNumber <= block + 100n", "src/chain-proof/fujiProof.test.ts"], ["rpc-range-lower-leak", "apps/web/src/chain-proof/fujiProof.ts", "address: [nft, market], fromBlock, toBlock: block", "address: [nft, market], fromBlock: 0n, toBlock: block", "src/chain-proof/fujiProof.test.ts"], ["oldest-events-first", "apps/web/src/chain-proof/fujiProof.ts", "a.blockNumber! > b.blockNumber! ? -1 : a.blockNumber! < b.blockNumber! ? 1 : (b.logIndex ?? 0) - (a.logIndex ?? 0)", "a.blockNumber! > b.blockNumber! ? 1 : a.blockNumber! < b.blockNumber! ? -1 : (a.logIndex ?? 0) - (b.logIndex ?? 0)", "src/chain-proof/fujiProof.test.ts"], ["cache-expiry-too-soon", "apps/web/src/chain-proof/fujiProof.ts", "PROOF_CACHE_MS = 30_000", "PROOF_CACHE_MS = 10_000", "src/chain-proof/fujiProof.test.ts"], ["cache-expiry-never", "apps/web/src/chain-proof/fujiProof.ts", "now - previous.at < PROOF_CACHE_MS", "true", "src/chain-proof/fujiProof.test.ts"], ["false-zero-listings", "apps/web/src/chain-proof/fujiProof.ts", "functionName: 'activeListingCount', blockNumber: block", "functionName: 'nextListingId', blockNumber: block", "src/chain-proof/fujiProof.test.ts"], ["missing-linkage-warning", "apps/web/src/chain-proof/FujiProofPanel.tsx", "'Mismatch \u2014 market points to another NFT'", "'Matches the contract above'", "src/chain-proof/FujiProofPanel.test.tsx"], ["absent-code-deployed", "apps/web/src/chain-proof/FujiProofPanel.tsx", "fact.value > 0", "fact.value >= 0", "src/chain-proof/FujiProofPanel.test.tsx"], ["always-mounted-tabs", "apps/web/src/ui/Tabs.tsx", "(!tab.lazy || active === tab.id)", "true", "src/chain-proof/FujiProofPanel.test.tsx"]];
const scratch = mkdtempSync(`/tmp/tbh-cxc2-b-mutants-`);
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
const control = spawnSync('npx', ['-y', 'pnpm@10.28.0', 'exec', 'vitest', 'run', 'src/chain-proof', 'src/ui/ui.test.tsx', 'src/layout/HelpTab'], { cwd: `${scratch}/apps/web`, encoding: 'utf8' });
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
