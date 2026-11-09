// Exact A5 ON fallback parity, independently of the legacy OFF route digest.
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const phase=process.argv[2];assert.match(phase??'',/^[a-z0-9-]+$/);
const out=`reports/cardrpg-big/skills-v5/${phase}`;
await mkdir(out,{recursive:true});
const probe=`${out}/probe-fallback.json`;
const log=execFileSync(process.execPath,['tools/cardrpg-big/skills-v5/probe.mjs'],{encoding:'utf8',env:{...process.env,V5_PROBE_OUTPUT:probe}});
await writeFile(`${out}/probe-fallback.log`,log);
const current=JSON.parse(await readFile(probe,'utf8')),baseline=JSON.parse(await readFile('reports/cardrpg-big/skills-v5/s0/probe-baseline.json','utf8'));
assert.deepEqual(current,baseline,'A5 fallback battle/sim bytes changed');
const routes=execFileSync(process.execPath,['tools/cardrpg-big/skills-v5/compat.mjs'],{encoding:'utf8'});
await writeFile(`${out}/on-routes.log`,routes);
const scope=execFileSync(process.execPath,['tools/cardrpg-big/skills-v5/scope.mjs'],{encoding:'utf8'});
await writeFile(`${out}/scope.json`,scope);
const checks={status:'PASS',battleSha256:current.summary.battleSha256,simSha256:current.simSha256,route:JSON.parse(routes),baselineAndHistorical:'PASS',scope:'PASS',probeFileSha256:createHash('sha256').update(await readFile(probe)).digest('hex')};
await writeFile(`${out}/fallback-checks.json`,JSON.stringify(checks,null,2)+'\n');console.log(JSON.stringify(checks));
