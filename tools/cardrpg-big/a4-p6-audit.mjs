// REFERENCE: GAMEPLAY-V4 section9 and p6/REGISTERED-METHOD.md.
// Verify retained acceptance evidence without resampling or changing any rule.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base='reports/cardrpg-big/a4/p6';
const sha=data=>createHash('sha256').update(data).digest('hex');
const expectedKinds={tiers:30,bands:165,fixed:15,sets:64,teams:660,pieces:2304,'pieces-equipped':384,crew:3};
const samples=[];
for(const sample of ['train','heldout']){
 const path=`${base}/${sample}/results.json`,bytes=await readFile(path),data=JSON.parse(bytes);
 assert.equal(data.sample,sample);assert.equal(data.count,500);assert.equal(data.scope,'all');
 assert.equal(data.offset,sample==='train'?0:10000);assert.equal(data.rows.length,3625);assert.equal(data.summaries.length,3625);
 const summaries=new Map(data.summaries.map(r=>[r.key,r]));assert.equal(summaries.size,3625);
 const kinds={},keys=new Set();let outcomes=0;
 for(const row of data.rows){
  assert(!keys.has(row.key),'Duplicate case');keys.add(row.key);
  const meta=JSON.parse(row.key);for(const [key,value]of Object.entries(meta))assert.deepEqual(row[key],value);
  assert.equal(row.complete,true);assert.equal(row.outcomes.length,500);
  const paired=['pieces','pieces-equipped','crew'].includes(row.kind);
  assert((paired?/^[0-3]+$/:/^[01]+$/).test(row.outcomes));
  assert.equal(row.digest,sha(JSON.stringify(row.outcomes)));
  const summary=summaries.get(row.key);assert(summary);assert.equal(summary.digest,row.digest);assert.equal(summary.n,500);
  let wins=0,before=0;for(const value of row.outcomes){wins+=Number(value)%2;before+=Number(value)>=2?1:0;}
  assert.equal(summary.wins,wins);assert.equal(summary.rate,wins/500);
  assert.equal(summary.beforeWins,paired?before:null);
  assert.equal(summary.gainPp,paired?100*(wins-before)/500:null);
  assert(summary.wilson95.length===2&&summary.wilson95.every(Number.isFinite));
  assert(summary.wilson95[0]<=summary.rate+1e-12&&summary.wilson95[1]>=summary.rate-1e-12);
  kinds[row.kind]=(kinds[row.kind]??0)+1;outcomes+=row.outcomes.length;
 }
 assert.deepEqual(kinds,expectedKinds);assert.equal(outcomes,1812500);
 for(const [path,digest]of Object.entries(data.source))assert.equal(sha(await readFile(path)),digest,`Changed source: ${path}`);
 samples.push({sample,path,sha256:sha(bytes),cells:keys.size,outcomes,kinds,source:data.source,keys:[...keys],chosenCrew:data.chosenCrew});
}
assert.deepEqual(samples[0].source,samples[1].source);
assert.deepEqual(samples[0].keys,samples[1].keys,'Heldout must use the registered training case order');
assert.deepEqual(samples[0].chosenCrew,samples[1].chosenCrew,'Crew must remain selected on train');
const build=JSON.parse(await readFile('docs/cardrpg3/build.json','utf8'));
assert.equal(sha(await readFile('docs/cardrpg3/index.html')),build.sha256);
const reportToolChanges=[];
for(const [path,digest]of Object.entries(build.sourceHashes))if(sha(await readFile(path))!==digest){
 assert.equal(path,'tools/cardrpg-big/a4-p6-summary.py','Only the documented report extension may differ from the P6 build inventory');reportToolChanges.push(path);
}
for(const [path,digest]of Object.entries(build.sourceAssetHashes))assert.equal(sha(await readFile(path)),digest,path);
const gates=JSON.parse(await readFile('reports/cardrpg-big/validation/a4-p6-accepted.json','utf8'));assert.equal(gates.length,5);
for(const gate of gates){
 assert.equal(gate.exit,0);assert.equal(sha(await readFile(gate.log)),gate.sha256);
 if(gate.afterTestRelocation){const r=gate.afterTestRelocation;assert.equal(r.exit,0);assert.equal(sha(await readFile(r.log)),r.sha256);}
}
const buildEvidence={artifactSha256:build.sha256,originalBuildHead:build.head,originalRuntimeDirty:build.runtimeDirty,reportToolChanges,note:'The original broad build inventory includes report tools. Its dirty flag is retained. Current runtime/source-asset hashes are exact; the separate-sample report extension and this new receipt-audit tool do not enter the game payload. P7 rebuilds from a committed source snapshot.'};
const report={status:'PASS',method:'Read-only audit of all per-seed codes, complete case keys, sample offsets, digests, summary counts/wins, training-selected crew and current source hashes. No simulation rerun; this certifies receipt integrity, not numeric balance.',samples:samples.map(({keys,source,...s})=>({...s,sourceFiles:Object.keys(source).length})),source:samples[0].source,buildEvidence};
await writeFile(`${base}/sample-audit.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify({status:report.status,samples:report.samples}));
