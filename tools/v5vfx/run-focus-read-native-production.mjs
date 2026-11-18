/** Verify the adopted focus implementation with an untransformed production build. */
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile,open} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,appRoot,require,buildProductionComparison} from './build-hud-production.mjs';
import {focusPath} from './focus-read-source.mjs';
import {hash} from './victory-demand-source.mjs';
const out=resolve(root,'work/v5/CXV/films/V7-F-focus-read-native-production');assert(!existsSync(out));
const previous=JSON.parse(await readFile(resolve(root,'work/v5/CXV/films/V7-F-focus-read-production/build.json'),'utf8'));
const current=await readFile(resolve(root,focusPath),'utf8');assert.equal(hash(current),previous.candidateFocusSha256);
await mkdir(out,{recursive:true});const snapshots=[];
for(const name of ['run-focus-read-native-production.mjs','build-hud-production.mjs','benchmark-boss-play.mjs','production-candidate-fixture.mjs']){const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);snapshots.push({name,sha256:hash(bytes)});}
const built=await buildProductionComparison(out,{modulePath:focusPath,currentSource:current,variants:{native:current},metadata:{nativeFocusSha256:hash(current)}}),artifact=built.artifacts[0];assert.equal(artifact.transformed,0);
const candidateFiles=previous.artifacts.find(a=>a.mode==='read').files,artifactExact=JSON.stringify(artifact.files)===JSON.stringify(candidateFiles);
const {preview}=await import(require.resolve('vite')),server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6312,strictPort:true}}),log=await open(resolve(out,'trial.log'),'w');
try{
 const env={...process.env,CXV_LOCAL_PRODUCTION:'1',CXV_PRODUCTION_OUT:out,CXV_ARTIFACT_MODE:'native',CXV_CAPTURE_OUT:resolve(out,'trial'),CXV_LAYOUT_PROFILE:'1',CXV_FOCUS_PROFILE:'1'};
 for(const key of ['CXV_LABEL_SEARCH','CXV_LABEL_SEARCH_PAIRED','CXV_PRODUCTION','CXV_HUD_MODE','CXV_PROFILE','CXV_STRESS_ONLY','CXV_PENDING_BATCH','CXV_FACE_PROTOTYPE','CXV_OUTER_PROTOTYPE','CXV_NUMBER_METRICS','CXV_OFFLINE_NUMBER','CXV_CLOVER_LEAF','CXV_DRAWING_RESET','CXV_TRANSPARENT_WORK'])delete env[key];
 const code=await new Promise((done,reject)=>{const child=spawn(process.execPath,[resolve(root,'tools/v5vfx/benchmark-boss-play.mjs')],{cwd:root,env,stdio:['ignore',log.fd,log.fd]});child.once('error',reject);child.once('exit',done);});assert.equal(code,0);
 const rawPath=resolve(out,'trial/report.json'),rawBytes=await readFile(rawPath),raw=JSON.parse(rawBytes);assert(raw.pass&&raw.runs.length===2&&raw.runs.every(r=>!r.blockedRequests.length));
 const captures=[];
 for(const run of raw.runs){const path=resolve(out,'trial',`boss-${run.rate}x.png`),png=await readFile(path);assert.equal(png.readUInt32BE(16),1280);assert.equal(png.readUInt32BE(20),720);const rgb=execFileSync('ffmpeg',['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:4*1024*1024});const review=resolve(out,run.rate+'x-review.jpg');execFileSync('ffmpeg',['-v','error','-i',path,'-vf','scale=1024:576','-frames:v','1','-q:v','3',review]);captures.push({rate:run.rate,path,width:1280,height:720,sha256:hash(png),rgbSha256:hash(rgb),review:{path:review,width:1024,height:576,sha256:hash(await readFile(review))}});}
 const report={utc:new Date().toISOString(),source:built.source,runtimePatchSha256:built.runtimePatchSha256,indexSha256:artifact.indexSha256,nativeFocusSha256:hash(current),artifactTransforms:0,envDir:false,artifactFilesExactToPrototype:artifactExact,artifactFiles:artifact.files.length,snapshots,raw:{path:rawPath,sha256:hash(rawBytes)},buildManifest:{path:resolve(out,'build.json'),sha256:hash(await readFile(resolve(out,'build.json')))},url:raw.url,viewport:raw.viewport,started:raw.utc,ended:raw.ended,pass:raw.pass,runs:raw.runs.map(r=>({rate:r.rate,elapsedMs:r.elapsedMs,actions:r.plans.filter(p=>p.kind==='action').length,ultimates:r.plans.filter(p=>p.ultimate).length,focus:r.focusEntryCpuMs,entryRender:r.focusEntryRenderCpuMs,frame:r.frameMs,layout:r.layout,blockedRequests:r.blockedRequests})),errors:raw.errors,captures,reviewedUtc:null,interpretation:null,limits:'Untransformed native local production validation, not another causal comparison or independent judge acceptance. All timing is elapsed, not exclusive CPU. Host-relative4x is not physical laptop equivalence.'};
 await writeFile(resolve(root,'reports/v5/CXV/V7-F-focus-read-native-production.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({utc:report.utc,pass:report.pass,artifactExact,runs:report.runs.map(r=>({rate:r.rate,actions:r.actions,ultimates:r.ultimates}))}));
}finally{await log.close();await new Promise(done=>server.httpServer.close(done));}
