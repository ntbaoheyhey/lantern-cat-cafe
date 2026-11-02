import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, cpSync, symlinkSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const out = "/private/tmp/tbh-t001-ledger/reports/cards/CXC2-FRESH/range-mutants-a"; mkdirSync(out, { recursive: true });
const cases = [["wrong-chain-accepted", "apps/web/src/chain-proof/fujiProof.ts", "!== FUJI_CHAIN_ID", "!== 1", "src/chain-proof/fujiProof.test.ts"], ["unbounded-history", "apps/web/src/chain-proof/fujiProof.ts", "PROOF_BLOCK_WINDOW = 100n", "PROOF_BLOCK_WINDOW = 500n", "src/chain-proof/fujiProof.test.ts"], ["too-many-events", "apps/web/src/chain-proof/fujiProof.ts", "PROOF_EVENT_LIMIT = 10", "PROOF_EVENT_LIMIT = 20", "src/chain-proof/fujiProof.test.ts"], ["foreign-address-leak", "apps/web/src/chain-proof/fujiProof.ts", ".includes(log.address.toLowerCase())", ".includes(nft.toLowerCase())", "src/chain-proof/fujiProof.test.ts"], ["removed-event-leak", "apps/web/src/chain-proof/fujiProof.ts", "!log.removed &&", "true &&", "src/chain-proof/fujiProof.test.ts"], ["empty-code-positive", "apps/web/src/chain-proof/fujiProof.ts", "Math.max(0, (code.length - 2) / 2)", "Math.max(1, (code.length - 2) / 2)", "src/chain-proof/fujiProof.test.ts"], ["unavailable-as-zero", "apps/web/src/chain-proof/fujiProof.ts", "catch { return unavailable; }", "catch { return { status: 'verified', value: 0 as T }; }", "src/chain-proof/fujiProof.test.ts"], ["cache-bypassed", "apps/web/src/chain-proof/fujiProof.ts", "if (previous && now - previous.at < PROOF_CACHE_MS)", "if (false && previous && now - previous.at < PROOF_CACHE_MS)", "src/chain-proof/fujiProof.test.ts"], ["failure-cache-bypassed", "apps/web/src/chain-proof/fujiProof.ts", "const result = readFujiProof(client, now);", "const result = readFujiProof(client, now).catch(error => { cache.delete(client); throw error; });", "src/chain-proof/fujiProof.test.ts"], ["hidden-proof-mounted", "apps/web/src/ui/Tabs.tsx", "{(!tab.lazy || active === tab.id) && tab.content}", "{tab.content}", "src/chain-proof/FujiProofPanel.test.tsx"], ["inactive-read-enabled", "apps/web/src/chain-proof/FujiProofPanel.tsx", "enabled: enabled && Boolean(client)", "enabled: Boolean(client)", "src/chain-proof/FujiProofPanel.test.tsx"], ["reversed-linkage", "apps/web/src/chain-proof/FujiProofPanel.tsx", "linked.value.toLowerCase() === PROOF_CONTRACTS.RelicNFT?.toLowerCase()", "linked.value.toLowerCase() !== PROOF_CONTRACTS.RelicNFT?.toLowerCase()", "src/chain-proof/FujiProofPanel.test.tsx"]];
const scratch = mkdtempSync(`/tmp/tbh-cxc2-a-mutants-`);
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
