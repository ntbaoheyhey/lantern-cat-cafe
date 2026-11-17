/** Bounded production-artifact comparison; never describe these ports as accepted judge builds. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),out=resolve(process.env.CXV_PRODUCTION_OUT??resolve(root,'work/v5/CXV/films/V7-F-hud-production'));
const series=JSON.parse(await readFile(resolve(out,'series.json'),'utf8')),buildBytes=await readFile(resolve(out,'build.json')),built=JSON.parse(buildBytes);
const hash=value=>createHash('sha256').update(value).digest('hex');
const median=v=>{const a=[...v].sort((x,y)=>x-y),i=Math.floor(a.length/2);return a.length%2?a[i]:(a[i-1]+a[i])/2;};
const trials=[];
for(const row of series.runs){
 const d=JSON.parse(await readFile(row.raw,'utf8'));assert(d.pass&&d.localProduction&&!d.hudMode&&!d.pendingBatch&&!d.facePrototype&&!d.outerPrototype&&!d.numberMetricsMode);
 for(const r of d.runs){
  assert.deepEqual(r.identity,r.identityAfter);assert.equal(r.identity.buildManifestSha256,hash(buildBytes));
  trials.push({index:row.index,mode:row.mode,url:d.url,utc:d.utc,ended:d.ended,rate:r.rate,identity:r.identity,samples:r.samples,frameMs:r.frameMs,submitCpuMs:r.submitCpuMs,over33:r.over33,over50:r.over50,layout:r.layout,focusEntryCpuMs:r.focusEntryCpuMs,focusEntryRenderCpuMs:r.focusEntryRenderCpuMs,actions:r.plans.filter(p=>p.kind==='action').length,ultimates:r.plans.filter(p=>p.ultimate).length,logEvents:r.final.log-r.initial.log,errors:d.errors,blockedRequests:r.blockedRequests,raw:row.raw});
 }
}
const summary=[];
for(const rate of [1,4])for(const mode of ['baseline','text']){
 const rows=trials.filter(r=>r.rate===rate&&r.mode===mode),get=f=>median(rows.map(f));assert.equal(rows.length,3);
 summary.push({rate,mode,trials:rows.length,samples:get(r=>r.samples),frameMedianMs:get(r=>r.frameMs.median),frameP95Ms:get(r=>r.frameMs.p95),over50:get(r=>r.over50),submitMedianMs:get(r=>r.submitCpuMs.median),styleTotalMs:get(r=>r.layout.RecalcStyleDuration*1000),layoutTotalMs:get(r=>r.layout.LayoutDuration*1000),focusMedianMs:get(r=>r.focusEntryCpuMs.median),actions:get(r=>r.actions),ultimates:get(r=>r.ultimates)});
}
const artifacts=built.artifacts.map(a=>({mode:a.mode,dist:a.dist,indexSha256:a.indexSha256,files:a.files.length,bytes:a.files.reduce((s,f)=>s+f.bytes,0),transformed:a.transformed}));
const report={utc:new Date().toISOString(),source:built.source,runtimePatchSha256:built.runtimePatchSha256,runtimeUntrackedSha256:built.runtimeUntrackedSha256,configSha256:built.configSha256,baselineHudSha256:built.baselineHudSha256,candidateHudSha256:built.candidateHudSha256,buildManifestSha256:hash(buildBytes),artifacts,staticAssetsExact:built.staticAssetsExact,order:series.order,pass:series.pass&&built.staticAssetsExact&&trials.length===12&&trials.every(r=>!r.errors.length),method:'Two local production artifacts from identical source/config/assets;only baseline reverses the HUD text guard, verified against its exact prechange source. Sequential alternating32s1x/4xCPU trials,normal game loop and seeded boss fixture. No behavioral browser overrides. Median across3trials per mode/rate. Fixture progression is not account progression;4x is a stress proxy.',limits:'Local6311/6312 production-bundle evidence only;CXI6301 independent acceptance pending. No hosting/deployment. Source assets and judge build untouched.',summary,trials};
const path=resolve(root,'reports/v5/CXV/V7-F-hud-production-comparison.json');await writeFile(path,JSON.stringify(report,null,2));console.log(JSON.stringify({path,pass:report.pass,summary}));
