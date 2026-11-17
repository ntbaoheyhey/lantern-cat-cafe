/** Verify preserved production artifacts and retain every alternating trial. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {hash,victoryModule} from './victory-demand-source.mjs';
const root=resolve(import.meta.dirname,'../..');
const input=resolve(root,'work/v5/CXV/films/V7-F-victory-demand-production');
const output=resolve(root,'reports/v5/CXV/V7-F-victory-demand-production.json');
const read=path=>JSON.parse(readFileSync(path));
const series=read(resolve(input,'series.json')),built=read(resolve(input,'build.json'));
assert(series.pass&&series.runs.length===6);
assert.deepEqual(series.order,['baseline','native','native','baseline','baseline','native']);
assert(built.staticAssetsExact&&built.candidateIsApplicationSource===false);
const tools=read(resolve(input,'tool-provenance.json'));
for(const tool of tools){
 assert.equal(hash(readFileSync(resolve(input,tool.name))),tool.sha256);
 assert.equal(hash(readFileSync(resolve(root,'tools/v5vfx',tool.name))),tool.sha256);
}
assert.equal(hash(readFileSync(resolve(input,'baseline-VictoryCrew.tsx'))),built.baselineModuleSha256);
assert.equal(hash(readFileSync(resolve(input,'candidate-VictoryCrew.tsx'))),built.candidateModuleSha256);
assert.equal(hash(readFileSync(resolve(root,victoryModule))),built.baselineModuleSha256,'Summarize before application edits');
const artifacts=built.artifacts.map(artifact=>{
 for(const file of artifact.files){
  const bytes=readFileSync(resolve(artifact.dist,file.path));
  assert.equal(bytes.length,file.bytes);assert.equal(hash(bytes),file.sha256,file.path);
 }
 assert.equal(hash(readFileSync(resolve(artifact.dist,'index.html'))),artifact.indexSha256);
 return {mode:artifact.mode,dist:artifact.dist,files:artifact.files.length,indexSha256:artifact.indexSha256};
});
const buildManifestSha256=hash(readFileSync(resolve(input,'build.json'))),runs=[];
const seconds=['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration'];
for(const entry of series.runs){
 assert.equal(entry.mode,series.order[entry.index]);
 const raw=read(entry.raw),artifact=artifacts.find(a=>a.mode===entry.mode);
 assert(raw.pass&&!raw.errors.length);assert.equal(raw.runs.length,4);
 assert.equal(raw.buildSource,built.source);assert.equal(raw.buildRuntimePatchSha256,built.runtimePatchSha256);
 assert.equal(raw.buildManifestSha256,buildManifestSha256);assert.equal(raw.indexSha256,artifact.indexSha256);
 for(const r of raw.runs){
  assert(!r.errors.length&&!r.blockedRequests.length);assert(r.elapsedMs>=32000&&r.elapsedMs<35000);
  assert.equal(r.crew.drawn,'4');assert.equal(r.crew.ready,'true');assert(!r.crew.loadError);
  assert.equal(hash(readFileSync(r.crewPath)),r.crewSha256);
  if(r.reduced&&entry.mode==='native')assert.equal(r.counters.draws,0);else assert(r.counters.draws>7000);
  const metrics=Object.fromEntries(Object.entries(r.metrics).map(([k,v])=>[seconds.includes(k)?k+'Ms':k,seconds.includes(k)?v*1000:v]));
  runs.push({trial:entry.index,mode:entry.mode,url:raw.url,utc:r.utc,rate:r.rate,reduced:r.reduced,elapsedMs:r.elapsedMs,counters:r.counters,metrics,heapBefore:r.heapBefore,heapAfter:r.heapAfter,crew:r.crew,path:r.path,crewPath:r.crewPath,crewSha256:r.crewSha256,raw:entry.raw,rawSha256:hash(readFileSync(entry.raw))});
 }
}
const reducedCrewHashes=[...new Set(runs.filter(r=>r.reduced).map(r=>r.crewSha256))];
assert.equal(reducedCrewHashes.length,1,'All reduced crew PNGs must be byte-identical');
const median=a=>{const b=[...a].sort((x,y)=>x-y);return b[Math.floor(b.length/2)];};
const comparisons=[];
for(const rate of [1,4])for(const reduced of [true,false]){
 const groups=Object.fromEntries(['baseline','native'].map(mode=>{
  const rows=runs.filter(r=>r.rate===rate&&r.reduced===reduced&&r.mode===mode);assert.equal(rows.length,3);
  return [mode,{trials:rows.map(r=>r.trial),taskMs:rows.map(r=>r.metrics.TaskDurationMs),scriptMs:rows.map(r=>r.metrics.ScriptDurationMs),medianTaskMs:median(rows.map(r=>r.metrics.TaskDurationMs)),medianScriptMs:median(rows.map(r=>r.metrics.ScriptDurationMs)),draws:rows.map(r=>r.counters.draws),uploads:rows.map(r=>r.counters.uploads)}];
 }));
 comparisons.push({rate,reduced,...groups,taskChangePercent:(groups.native.medianTaskMs/groups.baseline.medianTaskMs-1)*100,scriptChangePercent:(groups.native.medianScriptMs/groups.baseline.medianScriptMs-1)*100});
}
const report={utc:new Date().toISOString(),started:series.utc,ended:series.ended,source:built.source,runtimePatchSha256:built.runtimePatchSha256,baselineModuleSha256:built.baselineModuleSha256,candidateModuleSha256:built.candidateModuleSha256,candidateIsApplicationSource:false,viewport:{width:1280,height:720},durationMs:32000,order:series.order,buildManifest:{path:resolve(input,'build.json'),sha256:buildManifestSha256},artifacts,artifactFilesReverified:true,tools,staticAssetsExact:true,reducedCrewHashes,comparisons,runs,correctnessPass:true,acceptanceDecision:'Pending visual review, full semantic TypeScript check and interpretation of normal-motion timing variance.',limits:'Local production artifacts with rule-resolved wave1 result fixtures, not the independent judge. Native names the build-time candidate only. CDP values measure the whole page; draw counters count WebGL calls, not frames. Three samples per cell do not establish statistical significance. No screenshot is taken during measured windows. No gameplay FPS claim.',reviewedUtc:null,visualReview:null};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,correctnessPass:report.correctnessPass,comparisons}));
