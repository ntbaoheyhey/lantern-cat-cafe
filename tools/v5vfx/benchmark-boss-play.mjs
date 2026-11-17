/** Rule-selected boss battle at real 1x, using the normal scene/model loop. */
import {runtimeEvidence as candidateEvidence} from './runtime-evidence.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-boss-play');
await mkdir(out,{recursive:true});
const production=process.env.CXV_PRODUCTION==='1',integration='/Users/bao/taskbar-hero-chain';
const localProduction=process.env.CXV_LOCAL_PRODUCTION==='1';
const fixture=await import(localProduction?'./production-candidate-fixture.mjs':production?integration+'/tools/v5int/production-fixture.mjs':'./browser-fixture.mjs');
const {chromium,config,openFixture}=fixture;
const runtimeEvidence=production||localProduction?fixture.runtimeEvidence:candidateEvidence;
const numberMetricsMode=process.env.CXV_NUMBER_METRICS??null;
const facePrototype=process.env.CXV_FACE_PROTOTYPE??null;
const outerPrototype=process.env.CXV_OUTER_PROTOTYPE==='1';
const transparentWorkPrototype=process.env.CXV_TRANSPARENT_WORK==='1';
const drawingResetMode=process.env.CXV_DRAWING_RESET??null;
const offlineNumberMode=process.env.CXV_OFFLINE_NUMBER??null;
const cloverLeafMode=process.env.CXV_CLOVER_LEAF??null;
if(cloverLeafMode&&(!['baseline','leaf'].includes(cloverLeafMode)||production||localProduction||offlineNumberMode||drawingResetMode||facePrototype||outerPrototype||transparentWorkPrototype))throw Error('Clover leaf study requires isolated candidate Vite');
if(offlineNumberMode&&(!['baseline','baked'].includes(offlineNumberMode)||drawingResetMode||production))throw Error('Invalid offline-number study mode');
if(drawingResetMode&&!['baseline','coalesced'].includes(drawingResetMode))throw Error('Invalid drawing-reset mode');
if(transparentWorkPrototype&&(production||localProduction||outerPrototype||facePrototype))throw Error('Transparent-vertex prototype requires isolated candidate Vite');
const pendingBatch=process.env.CXV_PENDING_BATCH??null;
const focusProfile=!!pendingBatch||process.env.CXV_FOCUS_PROFILE==='1';
const hudMode=process.env.CXV_HUD_MODE??null;
const labelSearchMode=process.env.CXV_LABEL_SEARCH??null,labelSearchPaired=process.env.CXV_LABEL_SEARCH_PAIRED==='1';
if(labelSearchMode&&(!['baseline','pruned'].includes(labelSearchMode)||production||localProduction))throw Error('Label-search prototype requires baseline/pruned mode on candidate Vite');
const layoutProfile=!!hudMode||process.env.CXV_LAYOUT_PROFILE==='1';
if(hudMode&&(production||localProduction))throw Error('HUD module experiment requires candidate Vite');
if(pendingBatch&&!['on','off'].includes(pendingBatch))throw Error('CXV_PENDING_BATCH must be on or off');
if(pendingBatch&&(production||localProduction))throw Error('Pending-label module experiment requires the candidate Vite server');
if(facePrototype&&facePrototype!=='compact')throw Error('CXV_FACE_PROTOTYPE must be compact');
if(numberMetricsMode&&!['on','off'].includes(numberMetricsMode))throw Error('CXV_NUMBER_METRICS must be on or off');
const report={numberMetricsMode,utc:new Date().toISOString(),source:execFileSync('git',production?['-C',integration,'rev-parse','HEAD']:['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),production,hardware:execFileSync('sysctl',['-n','machdep.cpu.brand_string'],{encoding:'utf8'}).trim(),viewport:{width:1280,height:720},method:'Seeded level6 boss fixture, then normal automatic rule-selected play at speed1 with actual scene/model requestAnimationFrame loop;32s wall time per CPU rate. No plan replay, fixed clock, synthesized events, or accelerated model steps. Fixture setup is not ordinary account progression. 4x CPU is a stress proxy, not another physical laptop. CPU render submission excludes GPU completion. Screenshots taken only after measurement.',runs:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
report.facePrototype=facePrototype;
report.outerPrototype=outerPrototype;
report.transparentWorkPrototype=transparentWorkPrototype;
report.drawingResetMode=drawingResetMode;
report.offlineNumberMode=offlineNumberMode;
report.pendingBatch=pendingBatch;
report.focusProfile=focusProfile;
report.hudMode=hudMode;
report.layoutProfile=layoutProfile;
report.localProduction=localProduction;
report.labelSearchMode=labelSearchMode;report.labelSearchPaired=labelSearchPaired;
report.cloverLeafMode=cloverLeafMode;
try{
 for(const rate of process.env.CXV_PROFILE||process.env.CXV_STRESS_ONLY==='1'?[4]:[1,4]){
  let pendingOverride,hudOverride,labelSearchOverride,offlineNumberPreparation,cloverLeafPreparation;
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false,setupPage:pendingBatch||hudMode||labelSearchMode?async page=>{
   if(pendingBatch){const {installPendingLabelOverride}=await import('./pending-label-override.mjs');pendingOverride=await installPendingLabelOverride(page,{batch:pendingBatch==='on'});}
   if(hudMode){const {installHudGeometryOverride}=await import('./hud-geometry-override.mjs');hudOverride=await installHudGeometryOverride(page,{mode:hudMode});}
   if(labelSearchMode){const {installLabelSearchOverride}=await import('./label-search-prototype.mjs');labelSearchOverride=await installLabelSearchOverride(page,{mode:labelSearchMode,paired:labelSearchPaired});}
  }:undefined});
  const runIdentity=runtimeEvidence();
  if(drawingResetMode){const {installDrawingResetPrototype}=await import('./drawing-reset-prototype.mjs');report.drawingResetDetails=await installDrawingResetPrototype(page,{active:drawingResetMode==='coalesced'});}
  if(facePrototype){const {installFaceProjectionPrototype}=await import('./face-projection-prototype.mjs');report.facePrototypeDetails=await installFaceProjectionPrototype(page);}
  if(outerPrototype){const {installOuterCellPrototype}=await import('./outer-cell-prototype.mjs');report.outerPrototypeDetails=await installOuterCellPrototype(page);}
  if(transparentWorkPrototype){const {installTransparentVertexPrototype}=await import('./transparent-vertex-prototype.mjs');report.transparentWorkDetails=await installTransparentVertexPrototype(page,{staticOnly:process.env.CXV_STATIC_VERTEX_WORK==='1',baselineClone:process.env.CXV_STATIC_VERTEX_BASELINE==='1'});}
  report.url=page.url();const cdp=await page.context().newCDPSession(page);
  await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
  await cdp.send('Emulation.setCPUThrottlingRate',{rate});
  if(cloverLeafMode){const {installCloverLeafPrototype}=await import('./clover-leaf-prototype.mjs');cloverLeafPreparation=await installCloverLeafPrototype(page,{active:cloverLeafMode==='leaf'});}
  if(offlineNumberMode){
   const {installOfflineNumberPrototype}=await import('./offline-number-prototype.mjs');
   await cdp.send('Performance.enable');const before=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(r=>[r.name,r.value]));
   offlineNumberPreparation=await installOfflineNumberPrototype(page,{active:offlineNumberMode==='baked'});
   const after=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(r=>[r.name,r.value]));
   offlineNumberPreparation.taskElapsedMs=(after.TaskDuration-before.TaskDuration)*1000;
   offlineNumberPreparation.scriptElapsedMs=(after.ScriptDuration-before.ScriptDuration)*1000;
   offlineNumberPreparation.note='Prepared after matching CPU throttle; local intercepted asset request plus decode/canvas restoration precedes timed play. Task/script durations are elapsed renderer metrics, not exclusive CPU. Extra bytes/readiness must be evaluated separately before runtime adoption.';
  }
  if(process.env.CXV_PROFILE){await cdp.send('Profiler.enable');await cdp.send('Profiler.start');}
  let layoutBefore;
  if(layoutProfile){await cdp.send('Performance.enable');layoutBefore=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(row=>[row.name,row.value]));}
  if(hudMode)await page.evaluate(()=>{globalThis.__cxvHudAudit=[];});
  if(labelSearchMode)await page.evaluate(()=>{const a=globalThis.__cxvLabelSearch;if(!a)throw Error('Label-search module override missing');Object.assign(a,{calls:0,totalCpuMs:0,pairedCalls:0,baselineCpuMs:0,prunedCpuMs:0,mismatches:[],cases:[]});});
  const run=await page.evaluate(async ({rate,methodProfile,numberMetricsMode,focusProfile})=>{
   const s=window.__depthScene,m=window.__depthReview,originalRender=s.render,originalBefore=s.beforeFrame;
   const intervals=[],cpu=[],calls=[],textures=[],plans=[],slowFrames=[],seen=new Set();
   const allIntervals=[],allCpu=[],startupIntervals=[],startupCpu=[];let firstRenderLatencyMs=null;
   const initial={round:m.battle.round,actors:m.battle.actors.map(a=>({id:a.id,hp:a.hp,charge:a.charge})),log:m.battle.log.length};
   let last=0,rafNow=0;const start=performance.now();
   const methodCosts={startup:{},steady:{}},restores=[];
   const focusEntries=[];let renderSerial=0;
   if(focusProfile){const focus=s.cinema.identified,paint=focus.paint;focus.paint=function(key,skill,owner){const entry=this.dirty||this.key!==key||this.viewport!==innerWidth+':'+innerHeight,begin=performance.now();try{return paint.call(this,key,skill,owner);}finally{if(entry)focusEntries.push({wallMs:begin-start,renderSerial,skillId:m.plan?.skillId,age:m.animationAt,cpuMs:performance.now()-begin});}};restores.push(()=>focus.paint=paint);}
   if(numberMetricsMode){const numbers=s.numbers,atlas=numbers.atlas;numbers.atlas=function(...args){if(numberMetricsMode==='off')this.glyphMetrics=undefined;return atlas.apply(this,args);};restores.push(()=>numbers.atlas=atlas);}
   if(methodProfile){
    const instrument=(object,key,label)=>{if(!object||typeof object[key]!=='function')return;const original=object[key];object[key]=function(...args){const begin=performance.now();try{return original.apply(this,args);}finally{const elapsed=performance.now()-begin,window=methodCosts[begin-start<2000?'startup':'steady'],row=window[label]??(window[label]={calls:0,totalMs:0,maxMs:0});row.calls++;row.totalMs+=elapsed;row.maxMs=Math.max(row.maxMs,elapsed);}};restores.push(()=>object[key]=original);};
    for(const [,e]of s.actors){instrument(e.actor,'sample','actor.sample');instrument(e.actor?.mesh,'pose','native.pose');instrument(e.craftPose,'deform','craft.deform');instrument(e.craftPose?.drawing,'sample','drawing.sample');}
   }
   s.beforeFrame=function(now){rafNow=now;return originalBefore?.call(this,now);};
   s.render=function(...args){
    renderSerial++;
    const at=performance.now();const result=originalRender.apply(this,args),cost=performance.now()-at;
    if(focusEntries.at(-1)?.renderSerial===renderSerial)focusEntries.at(-1).renderCpuMs=cost;
    firstRenderLatencyMs??=at-start;allCpu.push(cost);if(last)allIntervals.push(rafNow-last);
    if(at-start<2000){startupCpu.push(cost);if(last)startupIntervals.push(rafNow-last);}
    if(cost>20)slowFrames.push({wallMs:at-start,cpuMs:cost,skill:m.plan?.skillId,age:m.animationAt,drawCalls:s.stats.calls,textures:s.stats.textures});
    if(at-start>=2000&&last){intervals.push(rafNow-last);cpu.push(cost);calls.push(s.stats.calls);textures.push(s.stats.textures);}
    last=rafNow;
    if(m.plan&&!seen.has(m.plan)){seen.add(m.plan);plans.push({wallMs:at-start,kind:m.plan.events.some(e=>e.type==='action_start'||e.type==='charge')?'action':'non-action',actorId:m.plan.actorId,skillId:m.plan.skillId,ultimate:m.plan.ultimate,duration:m.plan.duration,leadIn:m.plan.speechLeadInMs??null,fixedTiming:m.plan.fixedTiming??false,voiceWindows:m.plan.voiceWindows?.length??null});}
    return result;
   };
   cancelAnimationFrame(s.raf);m.paused=false;m.notify(false);s.raf=requestAnimationFrame(s.loop);
   await new Promise(resolve=>setTimeout(resolve,32000));
   const elapsedMs=performance.now()-start;m.paused=true;m.notify(false);cancelAnimationFrame(s.raf);s.render=originalRender;s.beforeFrame=originalBefore;for(const restore of restores)restore();
   const stats=v=>{const a=[...v].sort((x,y)=>x-y);return{median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],p99:a[Math.floor(a.length*.99)],max:a.at(-1)};};
   const windowStats=(frames,submit)=>({samples:frames.length,frameMs:stats(frames),submitCpuMs:stats(submit),over33:frames.filter(v=>v>33.5).length,over50:frames.filter(v=>v>50.5).length});
   return{rate,numberMetricsMode,focusEntries,focusEntryCpuMs:stats(focusEntries.map(e=>e.cpuMs)),focusEntryRenderCpuMs:stats(focusEntries.map(e=>e.renderCpuMs)),methodCosts:methodProfile?methodCosts:undefined,methodCostsNote:methodProfile?'Inclusive wall CPU timings with wrapper overhead; nested methods overlap. Use for attribution only.':undefined,elapsedMs,samples:intervals.length,frameMs:stats(intervals),submitCpuMs:stats(cpu),over33:intervals.filter(v=>v>33.5).length,over50:intervals.filter(v=>v>50.5).length,firstRenderLatencyMs,wholeRun:windowStats(allIntervals,allCpu),startup:windowStats(startupIntervals,startupCpu),steadyWindowStartMs:2000,calls:stats(calls),textures:stats(textures),slowFrames,initial,final:{round:m.battle.round,actors:m.battle.actors.map(a=>({id:a.id,hp:a.hp,charge:a.charge})),log:m.battle.log.length,result:m.battle.result,screen:m.screen},plans};
  },{rate,methodProfile:process.env.CXV_METHOD_PROFILE==='1',numberMetricsMode,focusProfile});
  if(layoutProfile){
   const after=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(row=>[row.name,row.value]));
   run.layout=Object.fromEntries(['LayoutCount','LayoutDuration','RecalcStyleCount','RecalcStyleDuration','TaskDuration'].map(key=>[key,after[key]-layoutBefore[key]]));
  }
  if(hudMode){
   run.hud=await page.evaluate(()=>{const rows=globalThis.__cxvHudAudit;globalThis.__cxvHudAudit=null;const stats=v=>{const a=[...v].sort((x,y)=>x-y);return{calls:a.length,totalMs:a.reduce((x,y)=>x+y,0),median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1)};};return{canvas:stats(rows.map(v=>v[0])),labels:stats(rows.map(v=>v[1])),tail:stats(rows.map(v=>v[2]))};});
   run.hudOverride=hudOverride;
  }
  if(process.env.CXV_PROFILE){const {profile}=await cdp.send('Profiler.stop');await writeFile(resolve(out,'cpu.cpuprofile'),JSON.stringify(profile));}
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  if(drawingResetMode){run.drawingReset=await page.evaluate(()=>window.__cxvDrawingReset.variants.map(({id,unit,drawingCalls,setupCalls,skipped,inActor})=>({id,unit,drawingCalls,setupCalls,skipped,inActor})));if(run.drawingReset.some(r=>r.inActor!==0))errors.push('Drawing-reset guard leaked');}
  if(offlineNumberMode){run.offlineNumberPreparation=offlineNumberPreparation;run.offlineNumber=await page.evaluate(()=>{const p=window.__cxvOfflineNumber;return{seeded:p.seeded,served:p.served,calls:p.calls};});if(offlineNumberMode==='baked'&&(!run.offlineNumber.seeded||!run.offlineNumber.served))errors.push('Offline number study did not activate');}
  if(cloverLeafMode)run.cloverLeafPreparation=cloverLeafPreparation;
  run.drawingWeights=await page.evaluate(()=>[...window.__depthScene.actors].map(([id,e])=>({id,poses:e.craftPose?.drawing.vertexWeights?.size??0,bytes:[...(e.craftPose?.drawing.vertexWeights?.values()??[])].reduce((sum,w)=>sum+w.data.byteLength,0)})));
  if(facePrototype)run.prototypeWeights=await page.evaluate(()=>[...window.__depthScene.actors].map(([id,e])=>({id,poses:e.craftPose?.drawing.__cxvFaceWeights?.size??0,bytes:[...(e.craftPose?.drawing.__cxvFaceWeights?.values()??[])].reduce((sum,w)=>sum+w.data.byteLength,0)})));
  await page.screenshot({path:resolve(out,`boss-${rate}x.png`)});
  run.identity=runIdentity;run.identityAfter=runtimeEvidence();run.blockedRequests=blockedRequests;
  if(pendingOverride)run.pendingOverride=pendingOverride;
  if(labelSearchMode){run.labelSearch=await page.evaluate(()=>globalThis.__cxvLabelSearch);run.labelSearchOverride=labelSearchOverride;if(!run.labelSearch?.calls||run.labelSearch.mismatches.length)errors.push('Label-search oracle failed or had no calls');}
  if((production||localProduction)&&runIdentity.indexSha256!==run.identityAfter.indexSha256)errors.push('Production index changed during this run; do not use as stable paired evidence');
  report.runs.push(run);report.errors.push(...errors);await page.close();
 }
 if((production||localProduction)&&new Set(report.runs.map(r=>r.identity.indexSha256)).size>1)report.errors.push('Production changed between CPU rates; runs are individually identified but are not a paired build comparison');
 report.numberMetricsOverrideNote=numberMetricsMode?'Shared dispatch for on/off; off clears glyph metrics before atlas lookups to reproduce per-color measurement in the same runtime. Per-color atlas caching remains unchanged.':undefined;
 report.sourceMeaning=localProduction?'Local production artifact identified by buildSource, artifactMode, buildManifestSha256 and indexSha256 for each run':production?'Fixture source HEAD; served application identified by indexSha256 for each run':'Candidate application source HEAD plus runtime patch';
 report.ended=new Date().toISOString();report.pass=!report.errors.length&&report.runs.every(r=>r.samples>200&&r.plans.length>=8&&r.final.log>r.initial.log);
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({out,pass:report.pass,errors:report.errors,runs:report.runs.map(({plans,slowFrames,initial,final,...r})=>({...r,presentations:plans.length,actions:plans.filter(p=>p.kind==='action').length,ultimates:plans.filter(p=>p.ultimate).length,logEvents:final.log-initial.log}))}));
 if(!report.pass)process.exitCode=1;
}finally{await browser.close();}
