/** Retain both elapsed-task durations and independent renderer CPU measurements. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {hash} from './victory-demand-source.mjs';
const root=resolve(import.meta.dirname,'../..'),input=resolve(root,'work/v5/CXV/films/V7-F-victory-normal-control');
const read=p=>JSON.parse(readFileSync(p)),series=read(resolve(input,'series.json')),build=read(series.buildManifest);
assert(series.pass&&series.runs.length===6);assert.deepEqual(series.order,['native','baseline','baseline','native','native','baseline']);
assert.equal(hash(readFileSync(series.buildManifest)),series.buildManifestSha256);
for(const s of series.snapshots){assert.equal(hash(readFileSync(resolve(input,s.name))),s.sha256);assert.equal(hash(readFileSync(resolve(root,'tools/v5vfx',s.name))),s.sha256);}
const rows=[];
for(const entry of series.runs){
 const r=read(entry.raw);assert(r.pass&&!r.errors.length);assert.equal(r.runs.length,2);assert.equal(r.artifactMode,entry.mode);assert.equal(r.buildManifestSha256,series.buildManifestSha256);
 assert.equal(r.indexSha256,build.artifacts.find(a=>a.mode===entry.mode).indexSha256);assert.equal(r.buildSource,build.source);assert.equal(r.buildRuntimePatchSha256,build.runtimePatchSha256);
 for(const x of r.runs){
  assert(!x.errors.length&&!x.blockedRequests.length);assert(x.metrics.ThreadTime>0&&x.metrics.ProcessTime>0);assert(x.elapsedMs>=32000&&x.elapsedMs<35000);
  rows.push({trial:entry.index,mode:entry.mode,url:r.url,rate:x.rate,utc:x.utc,elapsedMs:x.elapsedMs,taskElapsedMs:x.metrics.TaskDuration*1000,scriptElapsedMs:x.metrics.ScriptDuration*1000,threadCpuMs:x.metrics.ThreadTime*1000,processCpuMs:x.metrics.ProcessTime*1000,draws:x.draws,raf:x.raf,crew:x.crew,browserVersion:r.browserVersion,raw:entry.raw,rawSha256:hash(readFileSync(entry.raw))});
 }
}
const median=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)],comparisons=[];
for(const rate of [1,4]){
 const groups=Object.fromEntries(['baseline','native'].map(mode=>{
  const values=rows.filter(r=>r.rate===rate&&r.mode===mode);assert.equal(values.length,3);
  return [mode,{trials:values.map(r=>r.trial),taskElapsedMs:values.map(r=>r.taskElapsedMs),scriptElapsedMs:values.map(r=>r.scriptElapsedMs),threadCpuMs:values.map(r=>r.threadCpuMs),processCpuMs:values.map(r=>r.processCpuMs),medianTaskElapsedMs:median(values.map(r=>r.taskElapsedMs)),medianThreadCpuMs:median(values.map(r=>r.threadCpuMs)),medianProcessCpuMs:median(values.map(r=>r.processCpuMs)),rafP95:values.map(r=>r.raf.p95),rafMax:values.map(r=>r.raf.max),over33:values.map(r=>r.raf.over33),draws:values.map(r=>r.draws)}];
 }));
 comparisons.push({rate,...groups,taskChangePercent:(groups.native.medianTaskElapsedMs/groups.baseline.medianTaskElapsedMs-1)*100,threadCpuChangePercent:(groups.native.medianThreadCpuMs/groups.baseline.medianThreadCpuMs-1)*100,processCpuChangePercent:(groups.native.medianProcessCpuMs/groups.baseline.medianProcessCpuMs-1)*100});
}
const report={utc:new Date().toISOString(),started:series.utc,ended:series.ended,source:build.source,runtimePatchSha256:build.runtimePatchSha256,buildManifest:series.buildManifest,buildManifestSha256:series.buildManifestSha256,baselineModuleSha256:build.baselineModuleSha256,candidateModuleSha256:build.candidateModuleSha256,snapshots:series.snapshots,order:series.order,durationMs:32000,viewport:{width:1280,height:720},comparisons,rows,correctnessPass:true,limits:'Unmodified preserved local production artifacts; native is the build-time prototype. Normal-first ordering avoids preceding reduced work but does not establish the cause of any difference. ThreadTime and ProcessTime are CPU counters; task/script durations use elapsed timeTicks. RAF cadence measures callbacks, not screen presentation or gameplay FPS. Four-times stress is relative to this host. Three repeats per cell; no statistical-significance claim.',interpretation:null};
const output=resolve(root,'reports/v5/CXV/V7-F-victory-normal-control.json');writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,comparisons}));
