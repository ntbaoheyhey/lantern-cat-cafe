// Bind the hero checkpoint to saved source, model and actual browser evidence.
// This verifies receipts, not perceptual quality or all-time mesh clearance.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const dir='reports/cardrpg-look/validation/l1';
const hash=b=>createHash('sha256').update(b).digest('hex');
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const bytes=await readFile('docs/cardrpg-look/index.html'),sha256=hash(bytes);
const build=await json('docs/cardrpg-look/build.json');
assert.equal(build.sha256,sha256);assert.equal(build.runtimeDirty,false);
for(const [path,expected] of Object.entries(build.sourceHashes))assert.equal(hash(await readFile(path)),expected,path);
const receipts={};
for(const [kind,path,count] of [['captures','after/captures.json',6],['poses','poses/poses.json',72],['ab','ab/checks.json',6]]){
 const data=await json(`${dir}/${path}`);assert.equal(data.sha256,sha256,path);assert.equal(data.rows.length,count,path);
 for(const r of data.rows){assert.deepEqual(r.errors??[],[],path);if(r.overflow!==undefined)assert.equal(r.overflow,false);}
 receipts[kind]={path:`${dir}/${path}`,rows:count,sha256:hash(await readFile(`${dir}/${path}`))};
}
const gates=await json('reports/cardrpg-look/validation/l1-publish/source-gates.json');
assert.deepEqual(gates.map(r=>r.name),['typecheck','lint','unit','build','e2e']);
for(const row of gates){assert.equal(row.code,0,row.name);row.sha256=hash(await readFile(row.log));}
const performance=await json(`${dir}/measurement-summary.json`);
assert.equal(performance.artifact,sha256);assert.equal(performance.coldRuns,7);assert.equal(performance.castWindows,24);assert.deepEqual(performance.errors,[]);
const flag=await json(`${dir}/flag-off/checks.json`),old=await json('reports/cardrpg-look/validation/flag-off/checks.json');
for(const key of ['prohibitedModules','modelRequests','errors'])assert.deepEqual(flag[key],[]);
const modules=data=>[...new Set(data.chunks.flatMap(c=>c.modules))].sort();
assert.deepEqual(modules(flag),modules(old));
const startup={scripts:flag.chunks.length,bytes:flag.chunks.reduce((s,c)=>s+c.bytes,0),modules:modules(flag).length,threeAndModelModules:0};
assert.equal(startup.scripts,old.chunks.length);assert.equal(startup.bytes,old.chunks.reduce((s,c)=>s+c.bytes,0));
const heroes=[];
for(const id of ['mochi','soot','clover']){
 const model=`assets/cardrpg-look/models/${id}.glb`,modelHash=hash(await readFile(model));
 const author=await json(`assets/cardrpg-look/${id}-author.json`);
 const portrait=await json(`assets/cardrpg-look/portraits/${id}-render.json`),turntable=await json(`reports/cardrpg-look/turntables/${id}/${id}-render.json`);
 assert.equal(portrait.sha256,modelHash);assert.equal(turntable.sha256,modelHash);assert(author.triangles<=12000);
 heroes.push({id,triangles:author.triangles,drawMeshes:author.drawMeshes,modelSha256:modelHash,portrait,turntable});
}
const protectedChanges=execFileSync('git',['diff','--name-only','86005b84','HEAD','--','packages/game-rules','contracts','supabase','package.json','pnpm-lock.yaml'],{encoding:'utf8'}).trim();assert.equal(protectedChanges,'');
const receipt={at:new Date().toISOString(),source:build.head,artifactSha256:sha256,bytes:bytes.length,verifiedInputs:Object.keys(build.sourceHashes).length,receipts,gates,performance,startup,heroes,protectedChanges:[],limitations:['Sampled motion review is separate from exhaustive collision proof.','Stage, post, remaining units and VFX remain inherited at L1.','Final lifecycle/throttle/matrix gates remain unrun.']};
await writeFile(`${dir}/checkpoint-audit.json`,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({sha256,bytes:bytes.length,verifiedInputs:receipt.verifiedInputs,startup}));
