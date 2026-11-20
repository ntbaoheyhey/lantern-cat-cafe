// Verify final receipts against immutable inputs and raw per-frame evidence.
// A receipt audit does not convert a missed budget into a pass.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const out='reports/cardrpg-look/validation/l7';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=async path=>JSON.parse(await readFile(path));
const freeze=await json(`${out}/freeze.json`),build=await json('docs/cardrpg-look/build.json');
assert.equal(freeze.sourceAccepted,true);assert.equal(build.runtimeDirty,false);
assert.equal(build.sha256,freeze.sha256);assert.equal(build.bytes,freeze.bytes);
const artifact=await readFile(freeze.artifact);assert.equal(hash(artifact),freeze.sha256);assert.equal(artifact.length,freeze.bytes);
for(const [path,want]of Object.entries(freeze.sourceHashes))assert.equal(hash(await readFile(path)),want,path);
for(const [path,want]of Object.entries(freeze.evidenceHashes))assert.equal(hash(await readFile(path)),want,path);
const ui=await json(`${out}/atelier/checks.json`);
assert.equal(ui.passed,true);assert.equal(ui.sha256,freeze.sha256);assert.deepEqual(ui.failures,[]);
assert.equal(ui.units.length,25);assert.equal(ui.stages.length,9);assert.equal(ui.configs.length,6);assert.equal(ui.windows.length,34);
for(const config of ui.configs)assert.deepEqual(config.skillGallery,{actions:86,owners:25,speed:.25,effectOnly:true,atelierDisposed:true});
for(const window of ui.windows){assert.deepEqual(window.errors,[]);assert.deepEqual(window.remote,[]);assert(window.restoredAccount&&window.restoredScreen&&window.disposed);assert.equal(window.overflow,false);}
for(const row of [...ui.units.flatMap(row=>row.angles),...ui.stages])assert.equal(hash(await readFile(`${out}/atelier/${row.file}`)),row.sha256);
const matrix=await json(`${out}/matrix/summary.json`);
assert.equal(matrix.sha256,freeze.sha256);assert(matrix.ended);assert.equal(matrix.rows.length,860);
assert.equal(matrix.actions.length,86);assert.equal(new Set(matrix.actions.map(row=>row.owner)).size,25);assert.equal(matrix.configurations.length,10);
for(const batch of matrix.batches)assert.equal(hash(await readFile(batch.summary)),batch.sha256);
const expected=new Set(matrix.configurations.flatMap(([w,h,dpr,cpu,q])=>matrix.actions.map(action=>`${w}x${h}-dpr${dpr}-cpu${cpu}-${q}-${action.id.replaceAll(':','-')}`)));
const observed=new Set(),casts=[];let rawFrames=0;
for(const row of matrix.rows){
 assert(expected.has(row.name));assert(!observed.has(row.name));observed.add(row.name);
 const bytes=await readFile(row.raw);assert.equal(hash(bytes),row.rawSha256);
 const raw=JSON.parse(bytes);assert.equal(raw.name,row.name);assert.deepEqual(raw.action,row.action);assert.deepEqual(raw.errors,[]);assert.equal(raw.casts.length,2);
 for(const [index,cast]of raw.casts.entries()){
  assert.equal(cast.use,index===0?'first':'repeat');assert.equal(cast.before.quality,row.quality);assert.equal(cast.after.quality,row.quality);
  const frames=raw.frames.filter(frame=>frame.at>=cast.before.at&&frame.at<=cast.after.at),times=frames.map(frame=>frame.ms).sort((a,b)=>a-b);
  assert(times.length>0);assert(times.every(value=>Number.isFinite(value)&&value>0));rawFrames+=times.length;
  const summary={frames:times.length,max:times.at(-1),p95:times[Math.floor(times.length*.95)],above25:times.filter(t=>t>25).length,above50:times.filter(t=>t>50).length,within20:times.filter(t=>t<=20).length/times.length,calls:Math.max(...frames.map(f=>f.calls??0)),qualities:[...new Set(frames.map(f=>f.quality))],triangles:Math.max(...frames.map(f=>f.triangles??0)),particles:Math.max(...frames.map(f=>f.particles??0))};
  assert.deepEqual(summary,cast.summary,`${row.name}/${cast.use}: raw frame summary`);assert.deepEqual(summary,row.casts[index].summary);assert.deepEqual(summary.qualities,[row.quality]);
  casts.push({name:row.name,use:cast.use,dpr:row.dpr,cpu:row.cpu,quality:row.quality,...summary});
 }
}
assert.deepEqual(observed,expected);assert.equal(casts.length,1720);
const matrixMisses={firstRepeat:casts.filter(r=>r.max>50),highDpr1:casts.filter(r=>r.quality==='high'&&r.dpr===1&&r.within20<.99),cpu4BalancedLow:casts.filter(r=>r.cpu===4&&r.quality!=='high'&&r.p95>33),draws:casts.filter(r=>r.calls>250),triangles:casts.filter(r=>r.triangles>150000)};
for(const [key,rows]of Object.entries(matrixMisses))assert.equal(rows.length,matrix.misses[key].length,key);
const lifecycle=await json(`${out}/lifecycle20/summary.json`);
assert.equal(lifecycle.sha256,freeze.sha256);assert.equal(lifecycle.rows.length,21);assert.equal(lifecycle.rawWindows.length,21);assert.deepEqual(lifecycle.errors,[]);
assert(lifecycle.rows.every((row,index)=>row.index===index&&row.retained));
const first=lifecycle.rows[0],last=lifecycle.rows.at(-1),growth={heap:last.heap.usedSize-first.heap.usedSize,geometries:last.gpu.geometries-first.gpu.geometries,textures:last.gpu.textures-first.gpu.textures,programs:last.programs-first.programs};
assert.deepEqual(growth,lifecycle.growth);
const lifecyclePass=growth.heap<=2*1024*1024&&growth.geometries===0&&growth.textures===0&&growth.programs===0;
const videos=[];
for(const target of ['mochi','soot','clover','yarn-giant','ultimate']){
 const r=await json(`reports/cardrpg-look/video/${target}/captures.json`);assert.equal(r.sha256,freeze.sha256);assert.deepEqual(r.errors,[]);assert.equal(r.rows.length,1);
 const row=r.rows[0];assert.equal(row.owner,target);assert.equal(hash(await readFile(row.file)),row.sha256);assert(row.elapsed>=24900&&row.elapsed<=27000);assert(row.ids.every(id=>row.clips.some(clip=>clip.id===id)));
 assert.equal(hash(await readFile(row.sampleSheet.file)),row.sampleSheet.sha256);
 videos.push({target,file:row.file,sha256:row.sha256,elapsedMs:row.elapsed,decodedFrames:Number(row.probe.streams[0].nb_read_frames)});
}
const performance=await json(`${out}/measurement-summary.json`);
assert.equal(performance.artifact,freeze.sha256);assert.equal(performance.coldRuns,7);assert.equal(performance.castWindows,24);assert.deepEqual(performance.errors,[]);
const flag=await json(`${out}/flag-off/checks.json`),baseline=await json('reports/cardrpg-look/validation/flag-off/checks.json');
for(const key of ['prohibitedModules','modelRequests','errors'])assert.deepEqual(flag[key],[]);
const modules=r=>[...new Set(r.chunks.flatMap(c=>c.modules))].sort();assert.deepEqual(modules(flag),modules(baseline));
const startup={bytes:flag.chunks.reduce((n,r)=>n+r.bytes,0),baselineBytes:baseline.chunks.reduce((n,r)=>n+r.bytes,0),threeAndModelModules:0};startup.byteDelta=startup.bytes-startup.baselineBytes;
const protectedChanges=execFileSync('git',['diff','--name-only','c5048bee','--','packages/game-rules','contracts','supabase','package.json','pnpm-lock.yaml'],{encoding:'utf8'}).trim();assert.equal(protectedChanges,'');
const misses=[];
if(build.bytes>24000000){const size=await json(`${out}/size-justification.json`);assert.equal(size.artifact,freeze.sha256);assert.equal(size.bytes,build.bytes);assert.equal(size.maximumAuthorizedBytes,32000000);misses.push('Original24MB target exceeded; explicit visual justification recorded for up to32MB.');}
if(build.bytes>32000000)misses.push(`32MB ceiling exceeded: ${build.bytes}bytes.`);
if(startup.byteDelta)misses.push(`Exact startup byte parity ${startup.byteDelta>=0?'+':''}${startup.byteDelta}bytes.`);
if(performance.coldMaxMs>117)misses.push(`Cold-open max${performance.coldMaxMs}ms exceeds historical117ms ceiling.`);
if(!lifecyclePass)misses.push(`20-replay retained resource target: ${JSON.stringify(growth)}.`);
for(const [key,rows]of Object.entries(matrixMisses))if(rows.length)misses.push(`${key}: ${rows.length}/1720 cast windows miss their applicable budget; details in matrix/summary.json.`);
const result={at:new Date().toISOString(),source:freeze.source,artifact:freeze.sha256,bytes:build.bytes,sourceInputs:Object.keys(freeze.sourceHashes).length,ui:{units:25,angles:100,stages:9,configurations:6},matrix:{owners:25,actions:86,configurations:10,cases:860,casts:1720,rawFrames,misses:Object.fromEntries(Object.entries(matrixMisses).map(([key,rows])=>[key,rows.length]))},lifecycle:{replays:20,growth,passed:lifecyclePass},videos,performance,startup,protectedChanges:[],misses,inheritedLimits:['L4 strict effect-pair numerical regressions remain open; threshold separation alone does not satisfy non-regression.'],reviewLimits:freeze.limits};
await writeFile(`${out}/audit.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
