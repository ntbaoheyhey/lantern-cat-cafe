/** Upper-bound timing only: this callback-unsafe prototype is not a runtime candidate. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {hash} from './victory-demand-source.mjs';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'work/v5/CXV/films/V7-F-drawing-reset-production');
const series=JSON.parse(await readFile(resolve(out,'series.json'),'utf8'));
assert(series.pass&&series.runs.length===6);assert.deepEqual(series.order,['baseline','coalesced','coalesced','baseline','baseline','coalesced']);
const buildBytes=await readFile(series.buildManifest),build=JSON.parse(buildBytes),artifact=build.artifacts.find(a=>a.mode==='baseline');
assert.equal(hash(buildBytes),series.buildManifestSha256);
for(const row of series.snapshots)assert.equal(hash(await readFile(resolve(out,row.name))),row.sha256);
const trials=[];
for(const row of series.runs){
 const bytes=await readFile(row.raw);assert.equal(hash(bytes),row.sha256);const d=JSON.parse(bytes);
 assert(d.pass&&d.localProduction&&d.drawingResetMode===row.mode);assert.deepEqual(d.viewport,{width:1280,height:720});
 assert(!d.errors.length&&!d.pendingBatch&&!d.hudMode&&!d.facePrototype&&!d.outerPrototype&&!d.transparentWorkPrototype&&!d.numberMetricsMode&&!d.labelSearchMode);
 for(const r of d.runs){
  assert(!r.blockedRequests.length);assert.deepEqual(r.identity,r.identityAfter);assert.equal(r.identity.buildManifestSha256,hash(buildBytes));
  assert.equal(r.identity.indexSha256,artifact.indexSha256);assert.equal(r.identity.buildSource,build.source);assert(r.drawingReset.every(c=>c.inActor===0));
  const setupCalls=r.drawingReset.reduce((n,c)=>n+c.setupCalls,0),skipped=r.drawingReset.reduce((n,c)=>n+c.skipped,0);assert.equal(skipped,row.mode==='coalesced'?setupCalls:0);
  trials.push({index:row.index,mode:row.mode,raw:row.raw,utc:d.utc,ended:d.ended,url:d.url,source:d.source,rate:r.rate,identity:r.identity,elapsedMs:r.elapsedMs,frameMs:r.frameMs,submitCpuMs:r.submitCpuMs,startup:r.startup,wholeRun:r.wholeRun,over50:r.over50,setupCalls,skipped,actions:r.plans.filter(p=>p.kind==='action').length,ultimates:r.plans.filter(p=>p.ultimate).length,logEvents:r.final.log-r.initial.log,errors:d.errors,blockedRequests:r.blockedRequests});
 }
}
const median=v=>v.toSorted((a,b)=>a-b)[Math.floor(v.length/2)],summary=[];
for(const rate of [1,4])for(const mode of ['baseline','coalesced']){
 const rows=trials.filter(r=>r.rate===rate&&r.mode===mode);assert.equal(rows.length,3);const get=f=>median(rows.map(f));
 summary.push({rate,mode,steadyRenderMedianMs:get(r=>r.submitCpuMs.median),steadyFrameP95Ms:get(r=>r.frameMs.p95),wholeFrameP95Ms:get(r=>r.wholeRun.frameMs.p95),wholeLongFrames:get(r=>r.wholeRun.over50),startupRenderMaxMs:get(r=>r.startup.submitCpuMs.max),setupCalls:get(r=>r.setupCalls),skipped:get(r=>r.skipped),actions:get(r=>r.actions),ultimates:get(r=>r.ultimates)});
}
const report={utc:new Date().toISOString(),source:series.source,order:series.order,buildSource:build.source,buildManifest:series.buildManifest,buildManifestSha256:hash(buildBytes),indexSha256:artifact.indexSha256,snapshots:series.snapshots,pass:true,method:'Six sequential alternating natural32s/rate seeded boss trials using the identical preserved production artifact plus instance-only drawing-reset wrappers. Steady headline excludes first2s; startup and whole-run retained. CPU4x is a stress proxy.',limits:'Coalescing suppresses intermediate drawing state visible to arbitrary cue callbacks; rejected as a general runtime change. Timings bound the benefit available to a safer canonical vertex cache. No app edit or independent6301 judge acceptance.',summary,trials};
await writeFile(resolve(root,'reports/v5/CXV/V7-F-drawing-reset-production.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,summary}));
