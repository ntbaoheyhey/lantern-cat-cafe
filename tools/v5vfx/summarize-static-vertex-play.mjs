import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'work/v5/CXV/films/V7-F-static-vertex-play');
const series=JSON.parse(await readFile(resolve(out,'series.json'))),provenance=JSON.parse(await readFile(resolve(out,'tool-provenance.json')));
assert(series.pass&&series.runs.length===6);assert.deepEqual(series.order,['baseline','static','static','baseline','baseline','static']);
for(const row of provenance.files)assert.equal(createHash('sha256').update(await readFile(row.path)).digest('hex'),row.sha256,'Measured tool changed: '+row.path);
const trials=[];
for(const row of series.runs){
 const d=JSON.parse(await readFile(row.raw));assert(d.pass&&d.transparentWorkPrototype&&!d.production&&!d.localProduction&&!d.outerPrototype&&!d.facePrototype&&!d.pendingBatch&&!d.hudMode&&!d.labelSearchMode);
 assert.deepEqual(d.viewport,{width:1280,height:720});assert.equal(d.runtimePatchSha256,series.runtimePatchSha256);assert.deepEqual(d.runtimeUntrackedSha256,series.runtimeUntrackedSha256);
 assert(d.transparentWorkDetails.every(v=>v.staticOnly&&v.baselineClone===(row.mode==='baseline')));
 for(const r of d.runs){
  assert.deepEqual(r.identity,r.identityAfter);assert.equal(d.errors.length,0);
  // Vite requests a remote font; the fixture intentionally isolates external traffic.
  // Require the same single blocked stylesheet in every trial instead of hiding it.
  assert.deepEqual(r.blockedRequests,[{url:'https://fonts.googleapis.com/css2',type:'stylesheet'}]);
  trials.push({index:row.index,mode:row.mode,utc:d.utc,ended:d.ended,url:d.url,source:d.source,rate:r.rate,elapsedMs:r.elapsedMs,steadyWindowStartMs:r.steadyWindowStartMs,frameMs:r.frameMs,submitCpuMs:r.submitCpuMs,wholeRun:r.wholeRun,startup:r.startup,over33:r.over33,over50:r.over50,samples:r.samples,actions:r.plans.filter(p=>p.kind==='action').length,ultimates:r.plans.filter(p=>p.ultimate).length,identity:r.identity,errors:d.errors,blockedRequests:r.blockedRequests,raw:row.raw});
 }
}
assert.equal(trials.length,12);
const median=v=>{const sorted=v.toSorted((a,b)=>a-b);return sorted[Math.floor(sorted.length/2)];},summary=[];
for(const rate of [1,4])for(const mode of ['baseline','static']){
 const rows=trials.filter(r=>r.rate===rate&&r.mode===mode);assert.equal(rows.length,3);const get=f=>median(rows.map(f));
 summary.push({rate,mode,trials:3,steadyRenderMedianMs:get(r=>r.submitCpuMs.median),steadyFrameP95Ms:get(r=>r.frameMs.p95),wholeFrameP95Ms:get(r=>r.wholeRun.frameMs.p95),wholeLongFrames:get(r=>r.wholeRun.over50),startupFrameP95Ms:get(r=>r.startup.frameMs.p95),startupRenderMaxMs:get(r=>r.startup.submitCpuMs.max),actions:get(r=>r.actions),ultimates:get(r=>r.ultimates)});
}
const report={utc:new Date().toISOString(),source:series.source,runtimePatchSha256:series.runtimePatchSha256,runtimeUntrackedSha256:series.runtimeUntrackedSha256,prototypeSha256:series.prototypeSha256,provenance,order:series.order,method:series.method,limits:'Vite browser prototype only, matched clone controls. The same external Google font stylesheet was intentionally blocked in all12runs; zero browser errors. Steady metrics exclude first2000ms; startup and whole-run retained. CPU4x is a stress proxy. Independent6301 judge acceptance and native integration absent.',pass:true,summary,trials};
await writeFile(resolve(root,'reports/v5/CXV/V7-F-static-vertex-play-comparison.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:true,summary}));
