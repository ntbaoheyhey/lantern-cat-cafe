/** Correlate profiler samples with explicit trace render marks; never treat samples as exact CPU. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {hash} from './victory-demand-source.mjs';
const root=resolve(import.meta.dirname,'../..'),input=resolve(root,'work/v5/CXV/films/V7-F-startup-attribution'),rawPath=resolve(input,'report.json'),raw=JSON.parse(readFileSync(rawPath));assert(raw.pass);
const provenance=JSON.parse(readFileSync(resolve(input,'provenance.json')));assert.equal(hash(readFileSync(provenance.buildManifest)),raw.buildManifestSha256);
const runs=[];
for(const run of raw.runs){
 assert.equal(hash(readFileSync(run.trace.path)),run.trace.sha256);assert.equal(hash(readFileSync(run.profile.path)),run.profile.sha256);
 const trace=JSON.parse(readFileSync(run.trace.path)),profile=JSON.parse(readFileSync(run.profile.path)),nodes=new Map(profile.nodes.map(n=>[n.id,n])),parents=new Map();
 for(const node of profile.nodes)for(const child of node.children??[])parents.set(child,node.id);
 const marks=new Map(trace.traceEvents.filter(e=>e.name?.startsWith('cxv-')&&e.ph==='I').map(e=>[e.name,e]));const anchor=marks.get('cxv-startup-start');assert(anchor&&anchor.ts>=profile.startTime&&anchor.ts<=profile.endTime);
 let time=profile.startTime;const samples=profile.samples.map((id,i)=>{const from=time;time+=profile.timeDeltas[i];return{id,from,to:time};});
 const frameRows=run.frames.map(frame=>{
  const begin=marks.get('cxv-render-start-'+frame.serial),end=marks.get('cxv-render-end-'+frame.serial);assert(begin&&end&&end.ts>=begin.ts&&begin.pid===anchor.pid&&begin.tid===anchor.tid);assert(Math.abs((begin.ts-anchor.ts)/1000-frame.at)<5,'User timing alignment must be within5ms');
  const weights=new Map();for(const sample of samples){const overlap=Math.max(0,Math.min(sample.to,end.ts)-Math.max(sample.from,begin.ts))/1000;if(overlap)weights.set(sample.id,(weights.get(sample.id)??0)+overlap);}
  const top=[...weights.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id,ms])=>{const stack=[];let at=id;for(let depth=0;depth<5&&nodes.has(at);depth++){stack.push(nodes.get(at).callFrame);at=parents.get(at);}return{selfSampledWallMs:ms,stack};});
  return{...frame,traceBegin:begin.ts,traceEnd:end.ts,traceSpanMs:(end.ts-begin.ts)/1000,sampleCoverageMs:[...weights.values()].reduce((a,b)=>a+b,0),top};
 });
 const slow=[...frameRows].sort((a,b)=>b.elapsedMs-a.elapsedMs).slice(0,8),startup=frameRows.filter(f=>f.at<2000),costs={};for(const f of startup)for(const[k,c]of Object.entries(f.costs)){const row=costs[k]??(costs[k]={calls:0,elapsedMs:0,maxMs:0});row.calls+=c.calls;row.elapsedMs+=c.elapsedMs;row.maxMs=Math.max(row.maxMs,c.maxMs);}
 const png=readFileSync(run.capture.path);assert.equal(hash(png),run.capture.sha256);assert.equal(png.readUInt32BE(16),1280);assert.equal(png.readUInt32BE(20),720);
 const rgb=execFileSync('ffmpeg',['-v','error','-i',run.capture.path,'-vf','scale=160:90','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1']);const mean=rgb.reduce((a,b)=>a+b,0)/rgb.length,stdDev=Math.sqrt(rgb.reduce((a,b)=>a+(b-mean)**2,0)/rgb.length);assert(stdDev>10);
 const review=resolve(input,`${run.rate}x-review.jpg`);assert(!existsSync(review));execFileSync('ffmpeg',['-v','error','-i',run.capture.path,'-vf','scale=1024:576','-frames:v','1','-q:v','3',review]);
 runs.push({rate:run.rate,utc:run.utc,frameCount:run.frames.length,plans:run.plans,startup:{frames:startup.length,methodCosts:costs},slowFrames:slow,uploads:run.uploads.filter(u=>slow.some(f=>f.serial===u.serial)),profile:run.profile,trace:run.trace,initial:run.initial,final:run.final,capture:{...run.capture,width:1280,height:720,mean,stdDev},review:{path:review,width:1024,height:576,sha256:hash(readFileSync(review))},errors:run.errors,blockedRequests:run.blockedRequests});
}
const report={utc:new Date().toISOString(),source:raw.buildSource,runtimePatchSha256:raw.buildRuntimePatchSha256,indexSha256:raw.indexSha256,url:raw.url,viewport:raw.viewport,started:raw.utc,ended:raw.ended,method:raw.method,provenance,raw:{path:rawPath,sha256:hash(readFileSync(rawPath))},runs,pass:raw.pass,reviewedUtc:null,interpretation:null,limits:'Sampling intervals are intersected with matching renderer-thread user-timing marks; weighted samples approximate exclusive sampled wall time. Native (program) or GC attribution can be incomplete. Nested method durations overlap and must not be added together.6s diagnostic captures first actions after actors are ready, not cold page/network load. Trace and wrappers change timings; use unprofiled trials for any later benefit claim.'};
const output=resolve(root,'reports/v5/CXV/V7-F-startup-attribution.json');writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,runs:runs.map(r=>({rate:r.rate,slow:r.slowFrames.slice(0,3).map(f=>({serial:f.serial,skill:f.skill,age:f.age,elapsed:f.elapsedMs,top:f.top.slice(0,3)})),review:r.review.path}))}));
