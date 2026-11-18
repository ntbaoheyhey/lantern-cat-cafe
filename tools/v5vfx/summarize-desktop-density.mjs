/** Native display-density coverage: compare all behavior and retain every timing trial. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {root} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const out=resolve(root,'work/v5/CXV/films/V7-F-desktop-density-production'),seriesBytes=await readFile(resolve(out,'series.json')),series=JSON.parse(seriesBytes);
assert(series.pass&&series.runs.length===6);assert.deepEqual(series.order,[1,2,2,1,1,2]);
const manifest=await readFile(series.buildManifest.path),built=JSON.parse(manifest),artifact=built.artifacts.find(a=>a.mode==='native');assert.equal(hash(manifest),series.buildManifest.sha256);
assert.equal(artifact.transformed,0);assert.equal(built.source,series.source);assert.equal(built.runtimePatchSha256,hash(''));assert.equal(artifact.indexSha256,series.indexSha256);
for(const f of artifact.files){const bytes=await readFile(resolve(artifact.dist,f.path));assert.equal(bytes.length,f.bytes);assert.equal(hash(bytes),f.sha256);}
for(const snap of series.snapshots){assert.equal(hash(await readFile(resolve(out,snap.name))),snap.sha256);assert.equal(hash(await readFile(resolve(root,'tools/v5vfx',snap.name))),snap.sha256);}
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)],trials=[],captures=[],reviews=[];
let expectedBehavior;
for(const row of series.runs){
 assert.equal(row.index,trials.length/2);assert.equal(row.mode,series.order[row.index]);const bytes=await readFile(row.raw);assert.equal(hash(bytes),row.sha256);const d=JSON.parse(bytes);
 assert(d.pass&&d.localProduction&&d.layoutProfile&&d.focusProfile);assert.equal(d.deviceScaleFactor,row.mode);assert.deepEqual(d.errors,[]);assert.deepEqual(d.viewport,{width:1280,height:720});assert.deepEqual(d.runs.map(r=>r.rate),[1,4]);
 for(const key of ['hudMode','pendingBatch','facePrototype','outerPrototype','numberMetricsMode','labelSearchMode','cloverLeafMode','drawingResetMode','offlineNumberMode','transparentWorkPrototype','shaderPreparationMode'])assert(!d[key],key);
 assert.equal(d.url,'http://127.0.0.1:6312/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3');
 for(const r of d.runs){
  assert.deepEqual(r.identity,r.identityAfter);assert.equal(r.identity.indexSha256,series.indexSha256);assert.equal(r.identity.buildSource,series.source);assert.equal(r.identity.buildRuntimePatchSha256,hash(''));assert.equal(r.identity.buildManifestSha256,series.buildManifest.sha256);assert.equal(r.identity.harnessSha256,series.snapshots.find(s=>s.name==='production-candidate-fixture.mjs').sha256);assert.deepEqual(r.blockedRequests,[]);
  for(const den of Object.values(r.desktopDensity)){assert.equal(den.devicePixelRatio,row.mode);assert.equal(den.rendererRatio,row.mode);assert(den.ready&&den.checksEnabled&&!den.contextLost&&!den.sceneError);assert.equal(den.actors,7);for(const key of ['width','height']){assert.equal(den.drawingBuffer[key],Math.floor(den.sceneSize[key]*row.mode));assert.equal(den.canvas[key],den.drawingBuffer[key]);}}
  const behavior={initial:r.initial,final:r.final,plans:r.plans.map(({wallMs,...rest})=>rest)};expectedBehavior??=behavior;assert.deepEqual(behavior,expectedBehavior,'Rule-selected behavior differs');
  const trial={index:row.index,dpr:row.mode,rate:r.rate,utc:d.utc,ended:d.ended,url:d.url,raw:row.raw,rawSha256:row.sha256,identity:r.identity,desktopDensity:r.desktopDensity,elapsedMs:r.elapsedMs,firstRenderLatencyMs:r.firstRenderLatencyMs,startup:r.startup,wholeRun:r.wholeRun,steady:{startMs:r.steadyWindowStartMs,samples:r.samples,frameMs:r.frameMs,submitCpuMs:r.submitCpuMs,over33:r.over33,over50:r.over50},layout:r.layout,focusEntryCpuMs:r.focusEntryCpuMs,focusEntryRenderCpuMs:r.focusEntryRenderCpuMs,actions:r.plans.filter(p=>p.kind==='action').length,ultimates:r.plans.filter(p=>p.ultimate).length,exactBehavior:true,errors:[],blockedRequests:[]};trials.push(trial);
  const path=resolve(out,row.index+'-'+row.mode,'boss-'+r.rate+'x.png'),png=await readFile(path);assert.equal(png.readUInt32BE(16),1280);assert.equal(png.readUInt32BE(20),720);
  const rgb=execFileSync('ffmpeg',['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:4*1024*1024});const mean=rgb.reduce((a,b)=>a+b,0)/rgb.length;let squares=0;for(const v of rgb)squares+=(v-mean)**2;const stdDev=Math.sqrt(squares/rgb.length);assert(stdDev>10);
  captures.push({index:row.index,dpr:row.mode,rate:r.rate,path,width:1280,height:720,sha256:hash(png),rgbSha256:hash(rgb),mean,stdDev});
  if(row.index<2){const view=resolve(out,row.index+'-dpr'+row.mode+'-'+r.rate+'x-review.jpg');assert(!existsSync(view));execFileSync('ffmpeg',['-v','error','-i',path,'-vf','scale=1024:576','-frames:v','1','-q:v','3',view]);reviews.push({path:view,width:1024,height:576,sha256:hash(await readFile(view))});}
 }
}
const summary=[];
for(const rate of [1,4])for(const dpr of [1,2]){
 const rows=trials.filter(r=>r.rate===rate&&r.dpr===dpr),get=f=>median(rows.map(f));assert.equal(rows.length,3);
 summary.push({rate,dpr,trials:rows.length,taskMs:get(r=>r.layout.TaskDuration*1000),wholeFrameP95Ms:get(r=>r.wholeRun.frameMs.p95),wholeOver50:get(r=>r.wholeRun.over50),startupFrameP95Ms:get(r=>r.startup.frameMs.p95),startupSubmitMaxMs:get(r=>r.startup.submitCpuMs.max),startupOver50:get(r=>r.startup.over50),steadyFrameP95Ms:get(r=>r.steady.frameMs.p95),steadyOver50:get(r=>r.steady.over50),submitMedianMs:get(r=>r.steady.submitCpuMs.median),focusMedianMs:get(r=>r.focusEntryCpuMs.median),focusRenderMedianMs:get(r=>r.focusEntryRenderCpuMs.median),bufferPixels:get(r=>r.desktopDensity.before.drawingBuffer.width*r.desktopDensity.before.drawingBuffer.height)});
}
const report={utc:new Date().toISOString(),source:series.source,runtimePatchSha256:series.runtimePatchSha256,indexSha256:series.indexSha256,series:{path:resolve(out,'series.json'),sha256:hash(seriesBytes),utc:series.utc,ended:series.ended,order:series.order},buildManifest:series.buildManifest,artifactFilesVerified:artifact.files.length,verifiedToolSnapshots:series.snapshots,
 method:'Six sequential native deviceScaleFactor1/2 trials,one unchanged production artifact,32s/rate ordinary seeded boss play at speed1. 1x/4xCPU,three-trial medians. Pixel ratio is the only changed browser configuration;no shader preparation or renderer/quality overrides. Desktop viewport1280x720;CSS-scaled captures after timed play.',
 limits:'DPR emulation is not a second physical laptop. CPU throttling is a stress proxy. Render submission and CDP task durations are elapsed times,not GPU completion or exclusive CPU. Fixture loading is excluded. Headline steady windows exclude first2000ms;whole-run/startup retained. This is configuration coverage,not an optimization or independent6301acceptance.',
 behavior:expectedBehavior,trials,summary,captures,reviews,reviewedUtc:null,interpretation:null,pass:true};
const path=resolve(root,'reports/v5/CXV/V7-F-desktop-density-production.json');assert(!existsSync(path));await writeFile(path,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({path,pass:report.pass,summary}));
