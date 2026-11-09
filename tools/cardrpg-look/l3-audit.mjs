// Phase receipt verification; does not substitute for the recorded visual review.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const out='reports/cardrpg-look/validation/l3';
const hash=b=>createHash('sha256').update(b).digest('hex');
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const bytes=await readFile('docs/cardrpg-look/index.html'),sha256=hash(bytes),build=await json('docs/cardrpg-look/build.json');
assert.equal(build.sha256,sha256);assert.equal(build.runtimeDirty,false);assert(bytes.length<=24000000);
for(const [path,expected] of Object.entries(build.sourceHashes))assert.equal(hash(await readFile(path)),expected,path);
const receipts={};
for(const [name,path,count] of [['functional',`${out}/functional/checks.json`,3],['post',`${out}/post/checks.json`,3],['cancellation',`${out}/cancellation/checks.json`,6]]){
 const data=await json(path);assert.equal(data.sha256,sha256);assert.equal(data.rows.length,count);
 for(const row of data.rows){
  assert.deepEqual(row.errors??[],[]);assert.equal(row.overflow??false,false);
  if(row.file&&row.sha256)assert.equal(hash(await readFile(path.replace(/[^/]+$/,'')+row.file)),row.sha256);
  if(name==='functional'){
   assert.equal(row.frames.length,3);assert.equal(row.toggles.length,2);assert(row.frames.every(f=>f.shell.visible&&!f.shell.overlap&&f.shell.stageFraction>=.7));assert.equal(row.disposal.actual,row.disposal.expected);assert.equal(row.disposal.oldDisposed,true);
   assert(row.frames[0].fov<row.frames[1].fov&&row.frames[1].fov<row.frames[2].fov);
   for(const frame of row.frames){assert(frame.stats.calls<=250);assert(frame.stats.triangles<=150000);assert.equal(frame.overflow,false)}
  }
  if(name==='post'){assert.deepEqual(row.initial,row.final);assert(row.stats.calls<=250);assert(row.stats.triangles<=150000);assert(row.masks.length>=3);}
  if(name==='cancellation'){assert.equal(row.atBoundary,true);assert.equal(row.resources,row.released);assert.deepEqual(row.unreleased,[]);assert.equal(row.rendererDisposed,1);assert.equal(row.contextLost,1);assert.equal(row.canvasRemoved,true);assert.deepEqual(row.failures,[]);}
 }
 receipts[name]={path,rows:count,sha256:hash(await readFile(path))};
}
const gates=await json(`${out}/source-gates.json`);assert.deepEqual(gates.map(r=>r.name),['typecheck','lint','unit','build','e2e']);
for(const row of gates){assert.equal(row.code,0,row.name);row.sha256=hash(await readFile(row.log))}
const performance=await json(`${out}/measurement-summary.json`);assert.equal(performance.artifact,sha256);assert.equal(performance.coldRuns,7);assert.equal(performance.castWindows,24);assert.deepEqual(performance.errors,[]);assert(performance.castMaxMs<=50);assert(performance.castWithin20Min>=.99);
const faces=await json(`${out}/post/metrics.json`);assert.equal(faces.artifact,sha256);assert.equal(faces.rows.length,36);assert.deepEqual(faces.offenders,[]);
const flag=await json(`${out}/flag-off/checks.json`),old=await json('reports/cardrpg-look/validation/flag-off/checks.json');
for(const k of ['prohibitedModules','modelRequests','errors'])assert.deepEqual(flag[k],[]);
const modules=d=>[...new Set(d.chunks.flatMap(c=>c.modules))].sort();assert.deepEqual(modules(flag),modules(old));
const normalize=p=>p.replace(/-[A-Za-z0-9_-]{8}(?=\.js)/g,'-HASH');
assert.deepEqual(flag.chunks.map(c=>normalize(c.path)).sort(),old.chunks.map(c=>normalize(c.path)).sort());
const startup={scripts:flag.chunks.length,modules:modules(flag).length,bytes:flag.chunks.reduce((n,c)=>n+c.bytes,0),baselineBytes:old.chunks.reduce((n,c)=>n+c.bytes,0),threeAndModelModules:0};
startup.byteDelta=startup.bytes-startup.baselineBytes;
const author=await json('assets/cardrpg-look/stage/author.json');assert.equal(author.sha256,hash(await readFile('assets/cardrpg-look/stage/cafe.glb')));assert.equal(author.sourceSha256,hash(await readFile('tools/cardrpg-look/blender/stage.py')));
const packing=await json('assets/cardrpg-look/stage/game/packing.json');
for(const row of packing.rows){assert.equal(hash(await readFile(row.source)),row.sourceSha256);assert.equal(hash(await readFile(row.output)),row.sha256)}
const protectedChanges=execFileSync('git',['diff','--name-only','eb568fda','--','packages/game-rules','contracts','supabase','package.json','pnpm-lock.yaml'],{encoding:'utf8'}).trim();assert.equal(protectedChanges,'');
const receipt={at:new Date().toISOString(),source:build.head,artifactSha256:sha256,bytes:bytes.length,verifiedInputs:Object.keys(build.sourceHashes).length,receipts,gates,performance,startup,author,packing,protectedChanges:[],limitations:['Depth AO is a compact analytic implementation, not GTAO; no TAA or full shadow maps.','Inner-face masks verify bloom/focus deltas; perceptual review remains separate.','Strict startup byte parity and cold peaks remain measured separately, not waived.','Final full matrix/lifecycle20/CPU4 Balanced+Low gates remain unrun.']};
await writeFile(`${out}/checkpoint-audit.json`,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({source:build.head,sha256,bytes:bytes.length,verifiedInputs:receipt.verifiedInputs,startup,performance}));
