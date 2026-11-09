// Read-only receipt verification. No combat, browser, or acceptance samples.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const phase=process.argv[2];assert.match(phase??'',/^[a-z0-9-]+$/);
const out=`reports/cardrpg-big/skills-v5/${phase}`,sha=b=>createHash('sha256').update(b).digest('hex');
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const checks=await json(`${out}/gates/checks.json`),gates=[];
for(const name of ['typecheck','lint','web-unit','rules','e2e','build']){
  const row=checks.filter(r=>r.name===name).at(-1);assert(row&&row.code===0,`${name} is not green`);
  assert.equal(sha(await readFile(row.log)),row.sha256);
  if(row.recovery){assert.equal(sha(await readFile(row.recovery.original)),row.recovery.originalSha256);assert(row.recovery.originalCounts.includes('  1 failed'));assert(row.counts.some(s=>s.includes('1 passed')));}
  gates.push(row);
}
assert.equal(new Set(gates.map(r=>r.sourceDigest)).size,1);
const sources=await json(`${out}/gates/source-${gates[0].sourceDigest}.json`);
for(const [path,hash]of Object.entries(sources))assert.equal(sha(await readFile(path)),hash,path);
for(const [path,hash]of Object.entries(await json(`${out}/off/source.json`)))assert.equal(sha(await readFile(path)),hash,path);
const off=await json(`${out}/off/checks.json`);assert.equal(off.sha256,'47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3');assert.equal(off.routes,8250);
const fallback=await json(`${out}/fallback-checks.json`),baseline=await json('reports/cardrpg-big/skills-v5/s0/baseline.json');
assert.equal(fallback.battleSha256,baseline.onBattleSha256);assert.equal(fallback.simSha256,baseline.onSimSha256);assert.equal(fallback.route.sha256,baseline.onRouteSha256);
const leftovers=await json('reports/cardrpg-big/skills-v5/s1/untouchable-hashes.json');
const leftoverChecks=[];
for(const [path,hash]of Object.entries(leftovers)){
 const actual=sha(await readFile(path));
 if(path!=='reports/cardrpg-big/.DS_Store')assert.equal(actual,hash,path);
 leftoverChecks.push({path,expected:hash,actual,status:actual===hash?'unchanged':'EXTERNAL DRIFT OBSERVED; left unmodified and uncommitted'});
}
const scope=JSON.parse(execFileSync(process.execPath,['tools/cardrpg-big/skills-v5/scope.mjs'],{encoding:'utf8'}));
const fixturePath='packages/game-rules/src/cardrpg/depth/skills-v5/fixtures/events-v2.json';
const fixtureBytes=await readFile(fixturePath).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
const generatedFixture=fixtureBytes?{path:fixturePath,sha256:sha(fixtureBytes),note:'Generated presentation evidence, excluded from runtime source digest; generator asserts exact replay and event validation for all five examples.'}:null;
const receipt={generatedFixture,status:'PASS',head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceDigest:gates[0].sourceDigest,gates,off,fallback,scope,untouchableFiles:leftoverChecks,compatibilitySeeds:'TRAIN only; no acceptance sampling in this verifier'};
await writeFile(`${out}/audit.json`,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({status:'PASS',head:receipt.head,sourceDigest:receipt.sourceDigest,gates:gates.length,offRoutes:off.routes}));
