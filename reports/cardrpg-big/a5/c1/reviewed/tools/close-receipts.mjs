// REFERENCE: PROMPT-A5 C1. Archive original receipts, validate hashes, do not rerun successful checks.
import {readFile,writeFile,mkdir,cp,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base='reports/cardrpg-big/a5/c1',prep='/tmp/cardrpg-a5-c1-revision';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const hash=x=>createHash('sha256').update(x).digest('hex');
const gates=await json('reports/cardrpg-big/a5/c1-reviewed/gates/checks.json');
assert.deepEqual(gates.map(r=>r.name),['typecheck','lint','web-unit','rules','e2e','build']);
for(const g of gates){assert.equal(g.code,0,g.name);assert.equal(g.head,'c4a883e5ea9f3d7e8424d799b2dafc73cc51d8df');assert.equal(hash(await readFile(g.log)),g.sha256);}
const adoption=await json(base+'/reviewed/adoption.json');
const expected={...adoption.original,...adoption.after};
for(const [path,sha] of Object.entries(expected))assert.equal(hash(await readFile(path)),sha,path);
const bytes=await readFile(prep+'/artifact/index.html'),artifact=hash(bytes);
assert.equal(artifact,'788ff719e42c7f595615fcf2f60ae4e0021ba32419f47ed2057dae785587be82');
const browser=[];
for(const width of [1280,1440,1024]){
 const r=await json(prep+`/browser/browser-${width}/checks.json`);
 assert.equal(r.sha256,artifact);assert.equal(r.captures.length,10);assert.equal(r.checks.length,5);
 assert.deepEqual(r.errors,[]);assert.deepEqual(r.remote,[]);
 for(const c of r.captures){assert.equal(c.overflow,0);assert(c.contrast.every(x=>x.ratio>=4.5));}
 browser.push({width,captures:r.captures.length,minScopedContrast:Math.min(...r.captures.flatMap(c=>c.contrast.map(x=>x.ratio)))});
}
const regression=await json(prep+'/equip-regression/checks.json');assert.equal(regression.sha256,artifact);assert.equal(regression.checks.length,3);assert.deepEqual(regression.errors,[]);
const copy=await json(prep+'/browser/comparison.json');assert.equal(copy.comparisons.length,6);assert(copy.comparisons.every(r=>r.delta<0));assert.deepEqual(copy.errors,[]);
const h0=await json('reports/cardrpg-big/a5/h0/closure.json');
const rules=Object.entries(h0.source).filter(([path])=>path.startsWith('packages/game-rules/'));
assert(rules.length>0);for(const [path,digest]of rules)assert.equal(hash(await readFile(path)),digest,path);
assert.equal(h0.off.sha256,'47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3');
const scope=JSON.parse(execFileSync(process.execPath,['tools/cardrpg-big/a5-scope.mjs'],{encoding:'utf8'}));
await cp(prep+'/browser',base+'/reviewed/browser',{recursive:true});
await cp(prep+'/equip-regression',base+'/reviewed/equip-regression',{recursive:true});
await mkdir(base+'/reviewed/tools',{recursive:true});
for(const file of ['browser.mjs','copy-audit.mjs','equip-regression.mjs','close-receipts.mjs'])await copyFile(prep+'/'+file,base+'/reviewed/tools/'+file);
for(const file of ['build-attempt-1.log','overlay-receipt.json','equip-regression-attempt-1.log','browser-coordinator-attempt-1.log'])await copyFile(prep+'/'+file,base+'/reviewed/'+file);
await copyFile(prep+'/artifact/build.json',base+'/reviewed/build.json');
const receipt={status:'PASS',runtimeHead:gates[0].head,source:expected,artifact:{sha256:artifact,bytes:bytes.length,path:prep+'/artifact/index.html',publicArtifact:'Unchanged H0; rebuild scheduled in Z'},gates,browser,equipRegression:regression.checks,copyComparison:copy.comparisons,off:{...h0.off,method:'Reuse completed H0 8250-route digest with current rule source byte parity; no simulation rerun.',ruleFiles:rules.length},scope,limitations:['Targeted C1 component contrast and desktop captures; full Z screenshot/contrast pack remains pending.','Copy counter correction excludes closed details; historical H0 timeline stays unchanged.','No balance, day7 progression, engagement-cadence or human-playtest acceptance claim.']};
await writeFile(base+'/reviewed/audit.json',JSON.stringify(receipt,null,2));
console.log(JSON.stringify({status:receipt.status,artifact:receipt.artifact,browser,off:receipt.off,copy:receipt.copyComparison}));
