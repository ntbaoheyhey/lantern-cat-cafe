// Independent binding of runtime, original art and phase-specific evidence.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const out='reports/cardrpg-look/validation/l4';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=async path=>JSON.parse(await readFile(path,'utf8'));
const bytes=await readFile('docs/cardrpg-look/index.html'),sha256=hash(bytes),build=await json('docs/cardrpg-look/build.json');
assert.equal(build.sha256,sha256);assert.equal(build.runtimeDirty,false);assert(bytes.length<=24000000);
for(const [path,expected] of Object.entries(build.sourceHashes))assert.equal(hash(await readFile(path)),expected,path);
const effect=await json(`${out}/captures/uniqueness.json`),comparison=await json(`${out}/captures/comparison.json`);
assert.equal(effect.sha256,sha256);assert.equal(comparison.afterArtifact,sha256);assert.equal(effect.rows.length,67);assert.equal(effect.pairs.length,2211);
for(const key of ['errors','offenders','faceOffenders','overdrawOffenders','emptyEffects'])assert.deepEqual(effect[key],[],key);
for(const row of effect.rows){assert(row.peakCalls<=250);assert(row.peakTriangles<=150000);assert(row.peakInstances<=96);assert.equal(row.truncated,0);}
assert.equal(effect.threshold,.16);assert.equal(effect.facePixelTolerance,.01);assert.equal(effect.overdrawLimit,24);
const receipts={};
for(const [name,path,count] of [['functional',`${out}/functional/checks.json`,3],['effects',`${out}/effects/checks.json`,6],['post',`${out}/post/checks.json`,3],['cancellation',`${out}/cancellation/checks.json`,6]]){
 const data=await json(path);assert.equal(data.sha256,sha256);assert.equal(data.rows.length,count);assert.deepEqual(data.errors??[],[]);
 for(const row of data.rows){
  assert.deepEqual(row.errors??[],[]);assert.equal(row.overflow??false,false);
  if(name==='functional'){
   assert.equal(row.frames.length,3);assert.equal(row.toggles.length,2);assert(row.frames.every(f=>f.shell.visible&&!f.shell.overlap&&f.shell.stageFraction>=.7));
   assert.equal(row.disposal.actual,row.disposal.expected);assert.equal(row.disposal.oldDisposed,true);
   for(const frame of row.frames){assert(frame.stats.calls<=250);assert(frame.stats.triangles<=150000);assert.equal(frame.overflow,false);}
  }
  if(name==='effects'){
   assert.deepEqual(row.initial,row.final);assert.equal(row.fixedOwner,true);assert.equal(row.removals,0);assert.equal(row.autoClear,true);
   assert.deepEqual(row.newPrograms,[]);
   assert(row.floorChanged>0);assert(row.faceAbove8/Math.max(1,row.facePixels)<=.01);assert(row.stats.calls<=250&&row.stats.triangles<=150000);
  }
  if(name==='post'){assert.deepEqual(row.initial,row.final);assert(row.stats.calls<=250&&row.stats.triangles<=150000);}
  if(name==='cancellation'){
   assert.equal(row.atBoundary,true);assert.equal(row.resources,row.released);assert.equal(row.duplicates,0);assert.deepEqual(row.unreleased,[]);assert.deepEqual(row.failures,[]);
   assert.equal(row.rendererDisposed,1);assert.equal(row.contextLost,1);assert.equal(row.canvasRemoved,true);assert.equal(row.effectRootDetached,true);assert.equal(row.effectLightsDetached,true);
  }
 }
 if(name==='effects'){assert.equal(data.disposal.resources,data.disposal.released);assert.equal(data.disposal.duplicates,0);assert.equal(data.disposal.lightsDetached,true);assert.equal(data.disposal.rootDetached,true);}
 receipts[name]={path,rows:count,sha256:hash(await readFile(path))};
}
const faces=await json(`${out}/post/metrics.json`);assert.equal(faces.artifact,sha256);assert.equal(faces.rows.length,36);assert.deepEqual(faces.offenders,[]);
const gates=await json(`${out}/source-gates.json`);assert.deepEqual(gates.map(r=>r.name),['typecheck','lint','unit','build','e2e']);
for(const row of gates){assert.equal(row.code,0,row.name);row.sha256=hash(await readFile(row.log));}
const performance=await json(`${out}/measurement-summary.json`);assert.equal(performance.artifact,sha256);assert.equal(performance.coldRuns,7);assert.equal(performance.castWindows,24);assert.deepEqual(performance.errors,[]);
assert(performance.castMaxMs<=50);assert(performance.castWithin20Min>=.99);
const flag=await json(`${out}/flag-off/checks.json`),old=await json('reports/cardrpg-look/validation/flag-off/checks.json');
for(const k of ['prohibitedModules','modelRequests','errors'])assert.deepEqual(flag[k],[]);
const modules=d=>[...new Set(d.chunks.flatMap(c=>c.modules))].sort();assert.deepEqual(modules(flag),modules(old));
const startup={scripts:flag.chunks.length,modules:modules(flag).length,bytes:flag.chunks.reduce((n,c)=>n+c.bytes,0),baselineBytes:old.chunks.reduce((n,c)=>n+c.bytes,0),threeAndModelModules:0};startup.byteDelta=startup.bytes-startup.baselineBytes;
const packing=await json('assets/cardrpg-look/flipbooks/packing.json');assert.equal(packing.rows.length,6);assert.equal(packing.sourceSha256,hash(await readFile('tools/cardrpg-look/pack-flipbooks.py')));
const authorHash=hash(await readFile('tools/cardrpg-look/blender/flipbooks.py'));
for(const family of packing.rows){
 assert.equal(hash(await readFile(family.file)),family.sha256);assert.equal(family.roundtripExact,true);assert.equal(family.frames.length,36);
 for(let first=0;first<36;first+=6){
  const r=await json(`assets/cardrpg-look/flipbooks/source/${family.family}/receipt-${String(first).padStart(3,'0')}.json`);
  assert.equal(r.sourceSha256,authorHash);assert.equal(r.original,true);assert.equal(r.rows.length,6);
  for(const frame of r.rows)assert.equal(hash(await readFile(frame.file)),frame.sha256);
 }
 for(const f of family.frames){assert.equal(f.borderAlphaMax,0,`${family.family}/${f.frame}: bleeding atlas border`);}
}
const protectedChanges=execFileSync('git',['diff','--name-only','9b1a04a4','--','packages/game-rules','contracts','supabase','package.json','pnpm-lock.yaml'],{encoding:'utf8'}).trim();assert.equal(protectedChanges,'');
const missedGates=[];
if(comparison.numericRegressions)missedGates.push({gate:'no numeric pair-distance regression',pairs:comparison.numericRegressions,worstDelta:comparison.worstDelta});
if(startup.byteDelta)missedGates.push({gate:'exact startup byte parity',delta:startup.byteDelta});
if(performance.coldMaxMs>117)missedGates.push({gate:'cold page max no worse than historical117ms ceiling',maxMs:performance.coldMaxMs});
const receipt={at:new Date().toISOString(),source:build.head,artifactSha256:sha256,bytes:bytes.length,verifiedInputs:Object.keys(build.sourceHashes).length,
 effects:{count:67,pairs:2211,minimumDistance:effect.minimumDistance,threshold:effect.threshold},receipts,gates,performance,startup,packing,protectedChanges:[],missedGates,
 limitations:['Phase art reviews remain self-assessment, separate from this audit.','Numeric uniqueness regression is stricter than the existing indistinguishability threshold; every reduced pair stays reported.','Final full matrix/lifecycle20/CPU4 Balanced+Low gates belong to L7 and remain unrun.']};
await writeFile(`${out}/checkpoint-audit.json`,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({source:build.head,sha256,bytes:bytes.length,verifiedInputs:receipt.verifiedInputs,missedGates}));
