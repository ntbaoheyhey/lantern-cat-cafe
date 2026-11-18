/** Offline renderer-thread phase attribution. Nested trace durations are unioned. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {hash} from './victory-demand-source.mjs';
const root=resolve(import.meta.dirname,'../..');
const input=resolve(process.env.CXV_PHASE_INPUT??resolve(root,'work/v5/CXV/films/V7-F-current-ultimate-attribution'));
const output=resolve(process.env.CXV_PHASE_REPORT??resolve(root,'reports/v5/CXV/V7-F-archived-render-phases.json'));
assert(input.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(output.startsWith(resolve(root,'reports/v5/CXV')+'/'));assert(!existsSync(output));
const rawPath=resolve(input,'report.json'),rawBytes=readFileSync(rawPath),raw=JSON.parse(rawBytes);assert(raw.pass);
const merge=intervals=>{
 const result=[];
 for(const [start,end]of intervals.filter(([a,b])=>b>a).sort((a,b)=>a[0]-b[0])){
  const previous=result.at(-1);if(previous&&start<=previous[1])previous[1]=Math.max(previous[1],end);else result.push([start,end]);
 }
 return result;
};
const duration=intervals=>intervals.reduce((sum,[start,end])=>sum+end-start,0);
const overlap=(left,right)=>{
 let i=0,j=0,total=0;
 while(i<left.length&&j<right.length){const start=Math.max(left[i][0],right[j][0]),end=Math.min(left[i][1],right[j][1]);total+=Math.max(0,end-start);if(left[i][1]<=right[j][1])i++;else j++;}
 return total;
};
const groups={style:n=>n==='UpdateLayoutTree',layout:n=>n==='Layout',prePaint:n=>n==='PrePaint',paint:n=>n==='Paint',layerize:n=>n==='Layerize',gcLabelled:n=>n==='MinorGC'||n==='MajorGC'||n.startsWith('V8.GC'),imageDecode:n=>['Decode Image','DecodeImage','ImageDecodeTask','ImageDecode'].includes(n)};
const runs=[];
for(const run of raw.runs){
 assert.deepEqual(run.errors,[]);assert.deepEqual(run.blockedRequests,[]);
 const bytes=readFileSync(run.trace.path);assert.equal(hash(bytes),run.trace.sha256);const trace=JSON.parse(bytes);
 const marks=new Map(trace.traceEvents.filter(e=>e.ph==='I'&&e.name?.startsWith('cxv-')).map(e=>[e.name,e]));
 const begin=marks.get('cxv-startup-start'),end=marks.get('cxv-startup-end');assert(begin&&end&&end.ts>begin.ts&&begin.pid===end.pid&&begin.tid===end.tid);
 const events=trace.traceEvents.filter(e=>e.pid===begin.pid&&e.tid===begin.tid&&e.ph==='X'&&Number.isFinite(e.ts)&&Number.isFinite(e.dur)&&e.dur>=0&&e.ts<end.ts&&e.ts+e.dur>begin.ts);
 const frames=run.frames.map(frame=>{
  const a=marks.get('cxv-render-start-'+frame.serial),b=marks.get('cxv-render-end-'+frame.serial);
  assert(a&&b&&b.ts>=a.ts&&a.pid===begin.pid&&a.tid===begin.tid&&b.pid===begin.pid&&b.tid===begin.tid);
  assert(Math.abs((a.ts-begin.ts)/1000-frame.at)<5);
  return{...frame,interval:[a.ts,b.ts],traceSpanMs:(b.ts-a.ts)/1000};
 });
 const frameUnion=merge(frames.map(f=>f.interval));
 assert.equal(duration(frameUnion),frames.reduce((sum,f)=>sum+f.interval[1]-f.interval[0],0),'Recorded render intervals must not overlap');
 const phases={},intervals={};
 for(const [name,select]of Object.entries(groups)){
  const selected=events.filter(e=>select(e.name)),clipped=selected.map(e=>[Math.max(begin.ts,e.ts),Math.min(end.ts,e.ts+e.dur)]);
  const union=merge(clipped),inside=overlap(union,frameUnion),total=duration(union),names={};
  for(const event of selected)names[event.name]=(names[event.name]??0)+1;
  assert(inside<=total&&total<=end.ts-begin.ts);assert(total<=duration(clipped));
  phases[name]={events:selected.length,names,windowUnionMs:total/1000,insideRenderUnionMs:inside/1000,outsideRenderUnionMs:(total-inside)/1000,naiveNestedDurationMs:duration(clipped)/1000};intervals[name]=union;
 }
 const selected=new Map();
 for(const frame of [...frames].sort((a,b)=>b.elapsedMs-a.elapsedMs).slice(0,8))selected.set(frame.serial,frame);
 for(const frame of frames.filter(f=>f.at>=5000).sort((a,b)=>b.elapsedMs-a.elapsedMs).slice(0,8))selected.set(frame.serial,frame);
 const slowFrames=[...selected.values()].sort((a,b)=>b.elapsedMs-a.elapsedMs).map(frame=>{
  const phaseMs=Object.fromEntries(Object.entries(intervals).map(([name,union])=>[name,overlap(union,[frame.interval])/1000]));
  for(const value of Object.values(phaseMs))assert(value<=frame.traceSpanMs+1e-6);
  const recordedUnionMs=overlap(merge(Object.values(intervals).flat()),[frame.interval])/1000;assert(recordedUnionMs<=frame.traceSpanMs+1e-6);
  return{serial:frame.serial,wallMs:frame.at,skill:frame.skill,age:frame.age,renderElapsedMs:frame.elapsedMs,traceSpanMs:frame.traceSpanMs,phaseMs,recordedPhaseUnionMs:recordedUnionMs,wrapperCosts:frame.costs};
 });
 runs.push({rate:run.rate,trace:run.trace,rendererThread:{pid:begin.pid,tid:begin.tid},windowMs:(end.ts-begin.ts)/1000,renderFrames:frames.length,renderUnionMs:duration(frameUnion)/1000,observedCompleteEvents:events.length,phases,slowFrames});
}
const report={utc:new Date().toISOString(),source:raw.buildSource??raw.servedSource,indexSha256:raw.indexSha256,deviceScaleFactor:raw.deviceScaleFactor??1,url:raw.url,raw:{path:rawPath,sha256:hash(rawBytes)},tool:{path:import.meta.filename,sha256:hash(readFileSync(import.meta.filename))},runs,pass:true,
 method:'Read-only intersection of complete X trace events on the renderer thread identified by user-timing marks. Microseconds convert to milliseconds. Clip to the recording and union nested intervals per family; separate inside-render work from work outside the wrapper.',
 limits:'Saved trace attribution, not new gameplay capture or a performance comparison. Event families can overlap each other; do not sum family totals. GC-labelled instrumentation includes nested helpers. Absence of a recorded phase does not prove absence of native/GPU work. Older source findings do not establish the current native bottleneck.'};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,pass:true,source:report.source,runs:runs.map(r=>({rate:r.rate,frames:r.renderFrames,slow:r.slowFrames.slice(0,3).map(f=>({skill:f.skill,elapsedMs:f.renderElapsedMs,phaseMs:f.phaseMs}))}))}));
