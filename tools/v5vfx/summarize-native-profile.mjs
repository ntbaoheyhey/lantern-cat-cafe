/** Attribute a saved CPU sample; never compare profiled timings with unprofiled runs. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,basename} from 'node:path';
import {SourceMap} from 'node:module';
import {execFileSync} from 'node:child_process';
import {root} from './build-hud-production.mjs';
const input=resolve(root,'work/v5/CXV/films/V7-F-static-native/production');
const capture=resolve(input,'diagnostic-native');
const digest=b=>createHash('sha256').update(b).digest('hex');
const file=async p=>({path:p,sha256:digest(await readFile(p))});
const build=JSON.parse(await readFile(resolve(input,'build.json'),'utf8'));
const artifact=build.artifacts.find(a=>a.mode==='native');assert(artifact);
const report=JSON.parse(await readFile(resolve(capture,'report.json'),'utf8'));
const profile=JSON.parse(await readFile(resolve(capture,'cpu.cpuprofile'),'utf8'));
assert(report.pass&&report.localProduction&&report.runs.length===1);
assert.equal(report.buildSource,build.source);assert.equal(report.indexSha256,artifact.indexSha256);
assert.equal(profile.samples.length,profile.timeDeltas.length);
const maps=new Map(),nodes=new Map(profile.nodes.map(n=>[n.id,n])),parents=new Map();
for(const n of profile.nodes)for(const id of n.children??[])parents.set(id,n.id);
async function locate(frame){
 if(!frame.url||frame.lineNumber<0)return null;
 const bundle=basename(new URL(frame.url).pathname),path=resolve(artifact.dist,'assets',bundle+'.map');
 if(!maps.has(path)){
  try{maps.set(path,new SourceMap(JSON.parse(await readFile(path,'utf8'))));}catch(e){if(e.code!=='ENOENT')throw e;maps.set(path,null);}
 }
 const found=maps.get(path)?.findEntry(frame.lineNumber,frame.columnNumber);
 return found?{source:found.originalSource,line:found.originalLine+1,column:found.originalColumn,name:found.name}:null;
}
function aggregate(windowMs=Infinity){
 const totals=new Map();let elapsed=0;
 for(let i=0;i<profile.samples.length;i++){
  const delta=profile.timeDeltas[i],included=Math.max(0,Math.min(delta,windowMs*1000-elapsed));
  elapsed+=delta;if(included)totals.set(profile.samples[i],(totals.get(profile.samples[i])??0)+included);
  if(elapsed>=windowMs*1000)break;
 }
 return [...totals].sort((a,b)=>b[1]-a[1]);
}
async function rows(windowMs){
 return Promise.all(aggregate(windowMs).slice(0,20).map(async([id,micros])=>{
  const frame=nodes.get(id).callFrame,ancestors=[];let parent=parents.get(id);
  for(let depth=0;parent&&depth<3;depth++,parent=parents.get(parent)){
   const callFrame=nodes.get(parent).callFrame;ancestors.push({callFrame,source:await locate(callFrame)});
  }
  return {nodeId:id,selfMs:micros/1000,callFrame:frame,source:await locate(frame),ancestors};
 }));
}
const prior=[];
for(const [index,mode]of ['baseline','cache-diagnostic','text','hidden','stable'].entries()){
 const path=resolve(root,`work/v5/CXV/films/V7-F-hud-geometry-study/${index}-${mode}/report.json`);
 const d=JSON.parse(await readFile(path,'utf8')),r=d.runs[0];
 prior.push({mode,source:d.source,rate:r.rate,renderMedianMs:r.submitCpuMs.median,frameP95Ms:r.frameMs.p95,raw:await file(path)});
}
const run=report.runs[0];
const hudPath='apps/web/src/game/cardrpg/battle-v3/BattleHud.tsx';
const authoredHud=execFileSync('git',['show',build.source+':'+hudPath],{cwd:root,encoding:'utf8'});
const hudBundle=resolve(artifact.dist,'assets/BattleHudV3-BAsmezaD.js');
const generatedHud=await readFile(hudBundle,'utf8');
const rectMarker='document.querySelector(`.dp-canvas`)?.getBoundingClientRect()';
assert(authoredHud.includes("document.querySelector('.dp-canvas')?.getBoundingClientRect()"));
const rectNode=aggregate(Infinity).map(([id])=>nodes.get(id)).find(n=>n.callFrame.functionName==='getBoundingClientRect');
const rectCaller=nodes.get(parents.get(rectNode.id)).callFrame;
assert.equal(basename(new URL(rectCaller.url).pathname),basename(hudBundle));
const callerStart=generatedHud.split('\n').slice(0,rectCaller.lineNumber).reduce((sum,line)=>sum+line.length+1,0)+rectCaller.columnNumber;
const rectIndex=generatedHud.indexOf(rectMarker,callerStart);
assert(rectIndex>=callerStart&&rectIndex-callerStart<300,'Rect selector must occur within the sampled caller');
const summary={utc:new Date().toISOString(),captureUtc:report.utc,captureEnded:report.ended,url:report.url,viewport:report.viewport,
 source:build.source,runnerSource:report.source,runtimePatchSha256:build.runtimePatchSha256,indexSha256:artifact.indexSha256,
 inputs:await Promise.all(['build.json','diagnostic-native/diagnostic.json','diagnostic-native/report.json','diagnostic-native/cpu.cpuprofile'].map(p=>file(resolve(input,p)))),
 sampledMs:profile.timeDeltas.reduce((a,b)=>a+b,0)/1000,samples:profile.samples.length,wallSpanMs:(profile.endTime-profile.startTime)/1000,
 rate:run.rate,actions:run.plans.filter(p=>p.kind==='action').length,ultimates:run.plans.filter(p=>p.ultimate).length,errors:report.errors,
 wholeProfile:await rows(Infinity),firstTwoProfilerSeconds:await rows(2000),priorHudStudy:prior,
 hudAttribution:{method:'Authored-source and generated-function sequence match; no source maps are present in this preserved artifact. Attribution is an inference, not a source-map lookup.',authoredPath:hudPath,authoredSha256:digest(authoredHud),authoredLine:authoredHud.split('\n').findIndex(s=>s.includes("document.querySelector('.dp-canvas')"))+1,bundle:await file(hudBundle),generatedContext:generatedHud.slice(rectIndex-60,rectIndex+420)},
 findings:['DrawingLayer.point remains the largest named JavaScript self cost; stationary-row optimization only removes proven fixed vertices.',
 'The main getBoundingClientRect caller is attributed by matching selector and surrounding operation sequence to owned cardrpg/battle-v3/BattleHud.tsx, despite the generated BattleHudV3 chunk name.',
 'Earlier hidden-only and stable modes did not improve on their corresponding baseline/text modes. Do not repeat the same experiment or apply unsafe canvas caching.',
 'Label-layout search remains outside CXV ownership pending the existing scope request.'],
 limits:'CPU sampling and layout instrumentation add overhead; attribution only. First two seconds start at Profiler.start, not at benchmark measurement. Self times are samples, not exact function durations. Preserve six unprofiled production trials for comparisons. No independent judge acceptance.',
 next:'Trace first-contact costs with an exact measurement marker or continue current-build full-battle visual verification; preserve rejected approaches.'};
const output=resolve(root,'reports/v5/CXV/V7-F-static-native-diagnostic.json');
await writeFile(output,JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({output,samples:summary.samples,sampledMs:summary.sampledMs,actions:summary.actions,ultimates:summary.ultimates,errors:summary.errors}));
