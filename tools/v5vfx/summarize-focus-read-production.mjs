/** Bounded production-artifact comparison; never describe these ports as accepted judge builds. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),out=resolve(process.env.CXV_PRODUCTION_OUT??resolve(root,'work/v5/CXV/films/V7-F-focus-read-production'));
const series=JSON.parse(await readFile(resolve(out,'series.json'),'utf8')),buildBytes=await readFile(resolve(out,'build.json')),built=JSON.parse(buildBytes);
const candidateMode='read';assert(built.experiment==='same-paint HUD/title rectangles before pending clone cleanup');
const hash=value=>createHash('sha256').update(value).digest('hex');
const median=v=>{const a=[...v].sort((x,y)=>x-y),i=Math.floor(a.length/2);return a.length%2?a[i]:(a[i-1]+a[i])/2;};
assert(series.pass&&series.runs.length===6,'Collect a completed six-trial series before summarizing');
assert.deepEqual(series.order,['baseline',candidateMode,candidateMode,'baseline','baseline',candidateMode]);
assert.equal(series.buildManifest,resolve(out,'build.json'));
assert(built.staticAssetsExact&&built.artifacts.length===2);
let harnessSha256; // Historical trials bind their captured harness hash, not a later tooling revision.
const trials=[];
for(const row of series.runs){
 assert.equal(row.index,trials.length/2);assert.equal(row.mode,series.order[row.index]);
 const artifact=built.artifacts.find(a=>a.mode===row.mode);assert(artifact);
 const rawBytes=await readFile(row.raw);assert.equal(hash(rawBytes),row.sha256);const d=JSON.parse(rawBytes);assert(d.pass&&d.localProduction&&!d.hudMode&&!d.pendingBatch&&!d.facePrototype&&!d.outerPrototype&&!d.numberMetricsMode&&!d.labelSearchMode);
 assert.deepEqual(d.viewport,{width:1280,height:720});assert.deepEqual(d.runs.map(r=>r.rate),[1,4]);
 assert.equal(d.url,'http://127.0.0.1:'+(row.mode==='baseline'?6311:6312)+'/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3');
 for(const r of d.runs){
  assert.deepEqual(r.identity,r.identityAfter);assert.equal(r.identity.buildManifestSha256,hash(buildBytes));
  assert.equal(r.identity.indexSha256,artifact.indexSha256);assert.equal(r.identity.artifactMode,row.mode);
  assert.equal(r.identity.buildSource,built.source);assert.equal(r.identity.buildRuntimePatchSha256,built.runtimePatchSha256);harnessSha256??=r.identity.harnessSha256;assert.equal(r.identity.harnessSha256,harnessSha256);
  trials.push({hardware:d.hardware,elapsedMs:r.elapsedMs,steadyWindowStartMs:r.steadyWindowStartMs,startup:r.startup,wholeRun:r.wholeRun,index:row.index,mode:row.mode,url:d.url,utc:d.utc,ended:d.ended,rate:r.rate,identity:r.identity,samples:r.samples,frameMs:r.frameMs,submitCpuMs:r.submitCpuMs,over33:r.over33,over50:r.over50,layout:r.layout,focusEntryCpuMs:r.focusEntryCpuMs,focusEntryRenderCpuMs:r.focusEntryRenderCpuMs,actions:r.plans.filter(p=>p.kind==='action').length,ultimates:r.plans.filter(p=>p.ultimate).length,logEvents:r.final.log-r.initial.log,errors:d.errors,blockedRequests:r.blockedRequests,raw:row.raw});
 }
}
const summary=[];
for(const rate of [1,4])for(const mode of ['baseline',candidateMode]){
 const rows=trials.filter(r=>r.rate===rate&&r.mode===mode),get=f=>median(rows.map(f));assert.equal(rows.length,3);
 summary.push({rate,mode,trials:rows.length,wholeRunFrameP95Ms:get(r=>r.wholeRun.frameMs.p95),wholeRunOver50:get(r=>r.wholeRun.over50),startupFrameP95Ms:get(r=>r.startup.frameMs.p95),startupCpuMaxMs:get(r=>r.startup.submitCpuMs.max),samples:get(r=>r.samples),frameMedianMs:get(r=>r.frameMs.median),frameP95Ms:get(r=>r.frameMs.p95),over50:get(r=>r.over50),submitMedianMs:get(r=>r.submitCpuMs.median),taskElapsedMs:get(r=>r.layout.TaskDuration*1000),styleTotalMs:get(r=>r.layout.RecalcStyleDuration*1000),layoutTotalMs:get(r=>r.layout.LayoutDuration*1000),focusMedianMs:get(r=>r.focusEntryCpuMs.median),entryRenderMedianMs:get(r=>r.focusEntryRenderCpuMs.median),layoutCount:get(r=>r.layout.LayoutCount),styleCount:get(r=>r.layout.RecalcStyleCount),actions:get(r=>r.actions),ultimates:get(r=>r.ultimates)});
}
const artifacts=built.artifacts.map(a=>({mode:a.mode,dist:a.dist,indexSha256:a.indexSha256,files:a.files.length,bytes:a.files.reduce((s,f)=>s+f.bytes,0),transformed:a.transformed}));
const report={experiment:built.experiment??'hud-text',baselineModuleSha256:built.baselineModuleSha256,candidateModuleSha256:built.candidateModuleSha256,harnessSha256,utc:new Date().toISOString(),source:built.source,runtimePatchSha256:built.runtimePatchSha256,runtimeUntrackedSha256:built.runtimeUntrackedSha256,configSha256:built.configSha256,baselineFocusSha256:built.baselineFocusSha256,candidateFocusSha256:built.candidateFocusSha256,buildManifestSha256:hash(buildBytes),artifacts,staticAssetsExact:built.staticAssetsExact,order:series.order,pass:series.pass&&built.staticAssetsExact&&trials.length===12&&trials.every(r=>!r.errors.length),hardware:trials[0].hardware,timingWindows:'Frame/render headline metrics exclude first2000ms; startup and wholeRun metrics are also reported. Style/layout totals span the full32s measurement plus surrounding CDP calls. Elapsed times are retained per trial.',method:'Two local production artifacts from identical source/config/assets;a single asserted source-module transform creates the alternate build, with identical non-script assets. Sequential alternating32s1x/4xCPU trials,normal game loop and seeded boss fixture. No behavioral browser overrides. Median across3trials per mode/rate. Fixture progression is not account progression;4x is a stress proxy.',limits:'All performance.now and CDP timeTicks durations are elapsed time, not exclusive CPU. Whole-page CDP Layout/Style totals include surrounding protocol calls. Local6311/6312 production-bundle evidence only;CXI6301 independent acceptance pending. No hosting/deployment. Source assets and judge build untouched.',summary,trials};
let verifiedFiles=0;
for(const artifact of built.artifacts)for(const file of artifact.files){const bytes=await readFile(resolve(artifact.dist,file.path));assert.equal(bytes.length,file.bytes);assert.equal(hash(bytes),file.sha256);verifiedFiles++;}
for(const snapshot of series.snapshots)assert.equal(hash(await readFile(resolve(out,snapshot.name))),snapshot.sha256);
const captures=[],reviews=[];
for(const trial of trials){
 const path=resolve(out,'trials',trial.index+'-'+trial.mode,`boss-${trial.rate}x.png`),png=await readFile(path);assert.equal(png.readUInt32BE(16),1280);assert.equal(png.readUInt32BE(20),720);
 const rgb=execFileSync('ffmpeg',['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:4*1024*1024});
 const mean=rgb.reduce((a,b)=>a+b,0)/rgb.length,stdDev=Math.sqrt(rgb.reduce((a,b)=>a+(b-mean)**2,0)/rgb.length);assert(stdDev>10);
 captures.push({index:trial.index,mode:trial.mode,rate:trial.rate,path,width:1280,height:720,sha256:hash(png),rgbSha256:hash(rgb),mean,stdDev});
 if(trial.index<2){const review=resolve(out,trial.index+'-'+trial.mode+'-'+trial.rate+'x-review.jpg');execFileSync('ffmpeg',['-v','error','-i',path,'-vf','scale=1024:576','-frames:v','1','-q:v','3',review]);reviews.push({path:review,width:1024,height:576,sha256:hash(await readFile(review))});}
}
Object.assign(report,{verifiedArtifactFiles:verifiedFiles,verifiedToolSnapshots:series.snapshots,rawSeries:{path:resolve(out,'series.json'),sha256:hash(await readFile(resolve(out,'series.json')))},captures,reviews,reviewedUtc:null,interpretation:null});
const path=resolve(root,'reports/v5/CXV/V7-F-focus-read-production.json');if(process.env.CXV_SUMMARY_DRY_RUN!=='1')await writeFile(path,JSON.stringify(report,null,2));console.log(JSON.stringify({path,pass:report.pass,summary}));
