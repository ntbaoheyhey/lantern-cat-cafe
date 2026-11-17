/** Summarize completed trials without changing their evidence or running browsers. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {hash} from './victory-demand-source.mjs';
const root=resolve(import.meta.dirname,'../..');
const out=resolve(root,'work/v5/CXV/films/V7-F-offline-number-production');
const seriesBytes=await readFile(resolve(out,'series.json')),series=JSON.parse(seriesBytes);
assert(series.pass&&series.ended&&series.runs.length===6,'Wait for all six trials');
assert.deepEqual(series.order,['baseline','baked','baked','baseline','baseline','baked']);
const buildBytes=await readFile(series.buildManifest),build=JSON.parse(buildBytes);
const artifact=build.artifacts.find(a=>a.mode==='baseline');
assert.equal(hash(buildBytes),series.buildManifestSha256);
for(const row of series.snapshots)assert.equal(hash(await readFile(resolve(out,row.name))),row.sha256);
const trials=[];
for(const row of series.runs){
 const bytes=await readFile(row.raw);assert.equal(hash(bytes),row.sha256);const d=JSON.parse(bytes);
 assert(d.pass&&d.localProduction&&d.offlineNumberMode===row.mode);
 assert.deepEqual(d.viewport,{width:1280,height:720});assert.deepEqual(d.runs.map(r=>r.rate),[1,4]);
 assert(!d.errors.length&&!d.pendingBatch&&!d.hudMode&&!d.facePrototype&&!d.outerPrototype&&!d.transparentWorkPrototype&&!d.numberMetricsMode&&!d.labelSearchMode&&!d.drawingResetMode);
 for(const r of d.runs){
  assert(!r.blockedRequests.length);assert.deepEqual(r.identity,r.identityAfter);
  assert.equal(r.identity.buildManifestSha256,hash(buildBytes));
  assert.equal(r.identity.indexSha256,artifact.indexSha256);assert.equal(r.identity.buildSource,build.source);
  const p=r.offlineNumberPreparation,baked=row.mode==='baked';assert.equal(p.active,baked);assert.equal(p.bytes,baked?54987:0);
  assert.equal(r.offlineNumber.seeded,baked?1:0);assert.equal(r.offlineNumber.served,baked?1:0);
  assert.equal(hash(await readFile(p.manifest)),p.manifestSha256);assert.equal(hash(await readFile(p.asset)),p.assetSha256);
  const plans=r.plans.map(({wallMs,...plan})=>plan);
  trials.push({index:row.index,mode:row.mode,raw:row.raw,sha256:row.sha256,utc:d.utc,ended:d.ended,url:d.url,source:d.source,rate:r.rate,identity:r.identity,elapsedMs:r.elapsedMs,frameMs:r.frameMs,submitCpuMs:r.submitCpuMs,startup:r.startup,wholeRun:r.wholeRun,firstRenderLatencyMs:r.firstRenderLatencyMs,preparation:p,offlineNumber:r.offlineNumber,actions:plans.filter(p=>p.kind==='action').length,ultimates:plans.filter(p=>p.ultimate).length,logEvents:r.final.log-r.initial.log,initial:r.initial,final:r.final,plans,slowFrames:r.slowFrames,errors:d.errors,blockedRequests:r.blockedRequests});
 }
}
const distribution=values=>{const a=values.toSorted((a,b)=>a-b);return{median:a[Math.floor(a.length/2)],min:a[0],max:a.at(-1),values};};
const summary=[];
for(const rate of [1,4])for(const mode of ['baseline','baked']){
 const rows=trials.filter(r=>r.rate===rate&&r.mode===mode);assert.equal(rows.length,3);const get=f=>distribution(rows.map(f));
 summary.push({rate,mode,steadyRenderMedianMs:get(r=>r.submitCpuMs.median),steadyRenderP95Ms:get(r=>r.submitCpuMs.p95),steadyFrameP95Ms:get(r=>r.frameMs.p95),wholeRenderP95Ms:get(r=>r.wholeRun.submitCpuMs.p95),wholeFrameP95Ms:get(r=>r.wholeRun.frameMs.p95),wholeLongFrames:get(r=>r.wholeRun.over50),startupRenderMedianMs:get(r=>r.startup.submitCpuMs.median),startupRenderP95Ms:get(r=>r.startup.submitCpuMs.p95),startupRenderMaxMs:get(r=>r.startup.submitCpuMs.max),startupFrameP95Ms:get(r=>r.startup.frameMs.p95),firstRenderLatencyMs:get(r=>r.firstRenderLatencyMs),decodeElapsedMs:get(r=>r.preparation.decodeElapsedMs),restoreElapsedMs:get(r=>r.preparation.restoreElapsedMs),preparationTaskElapsedMs:get(r=>r.preparation.taskElapsedMs),preparationScriptElapsedMs:get(r=>r.preparation.scriptElapsedMs),bytes:get(r=>r.preparation.bytes),actions:get(r=>r.actions),ultimates:get(r=>r.ultimates),logEvents:get(r=>r.logEvents)});
}
const planChecks=trials.map(r=>({index:r.index,mode:r.mode,rate:r.rate,samePlansAsFirst:JSON.stringify(r.plans)===JSON.stringify(trials[0].plans),sameFinalAsFirst:JSON.stringify(r.final)===JSON.stringify(trials[0].final)}));
const report={utc:new Date().toISOString(),source:series.source,order:series.order,seriesSha256:hash(seriesBytes),buildSource:build.source,buildManifest:series.buildManifest,buildManifestSha256:hash(buildBytes),indexSha256:artifact.indexSha256,snapshots:series.snapshots,pass:true,method:'Six sequential alternating 32s natural-speed seeded boss trials, each at 1x and 4x CPU. Identical preserved production artifact with an instance-only number-atlas prototype. Startup is first 2s; steady excludes startup; whole-run is also retained. Screenshots follow timing. 4x is a stress proxy.',limits:'Local intercepted PNG request/decode/canvas restoration is measured before gameplay at matching CPU throttle. It is not full cold-network/loading measurement. Task/script durations are elapsed CDP renderer metrics, not exclusive CPU. This is not native application integration or independent6301 judge acceptance. Fixed wall-time trials can finish at different animation states; plan/final comparisons are reported, not silently assumed.',summary,planChecks,trials};
report.trials=report.trials.map(({plans,initial,final,slowFrames,...r})=>({...r,plansSha256:hash(JSON.stringify(plans)),initialSha256:hash(JSON.stringify(initial)),finalSha256:hash(JSON.stringify(final)),slowFrameCount:slowFrames.length,startupSlowFrames:slowFrames.filter(f=>f.wallMs<2000).toSorted((a,b)=>b.cpuMs-a.cpuMs).slice(0,3)}));
await writeFile(resolve(root,'reports/v5/CXV/V7-F-offline-number-production.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,summary:summary.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,v?.median??v]))),planChecks}));
