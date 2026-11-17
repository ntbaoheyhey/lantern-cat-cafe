/** Rule-selected boss battle at real 1x, using the normal scene/model loop. */
import {runtimeEvidence as candidateEvidence} from './runtime-evidence.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-boss-play');
await mkdir(out,{recursive:true});
const production=process.env.CXV_PRODUCTION==='1',integration='/Users/bao/taskbar-hero-chain';
const fixture=await import(production?integration+'/tools/v5int/production-fixture.mjs':'./browser-fixture.mjs');
const {chromium,config,openFixture}=fixture;
const runtimeEvidence=production?fixture.runtimeEvidence:candidateEvidence;
const report={utc:new Date().toISOString(),source:execFileSync('git',production?['-C',integration,'rev-parse','HEAD']:['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),production,hardware:execFileSync('sysctl',['-n','machdep.cpu.brand_string'],{encoding:'utf8'}).trim(),viewport:{width:1280,height:720},method:'Seeded level6 boss fixture, then normal automatic rule-selected play at speed1 with actual scene/model requestAnimationFrame loop;32s wall time per CPU rate. No plan replay, fixed clock, synthesized events, or accelerated model steps. Fixture setup is not ordinary account progression. 4x CPU is a stress proxy, not another physical laptop. CPU render submission excludes GPU completion. Screenshots taken only after measurement.',runs:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const rate of process.env.CXV_PROFILE?[4]:[1,4]){
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});
  const runIdentity=runtimeEvidence();
  report.url=page.url();const cdp=await page.context().newCDPSession(page);
  await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
  await cdp.send('Emulation.setCPUThrottlingRate',{rate});
  if(process.env.CXV_PROFILE){await cdp.send('Profiler.enable');await cdp.send('Profiler.start');}
  const run=await page.evaluate(async ({rate,methodProfile})=>{
   const s=window.__depthScene,m=window.__depthReview,originalRender=s.render,originalBefore=s.beforeFrame;
   const intervals=[],cpu=[],calls=[],textures=[],plans=[],slowFrames=[],seen=new Set();
   const allIntervals=[],allCpu=[],startupIntervals=[],startupCpu=[];let firstRenderLatencyMs=null;
   const initial={round:m.battle.round,actors:m.battle.actors.map(a=>({id:a.id,hp:a.hp,charge:a.charge})),log:m.battle.log.length};
   let last=0,rafNow=0;const start=performance.now();
   const methodCosts={startup:{},steady:{}},restores=[];
   if(methodProfile){
    const instrument=(object,key,label)=>{if(!object||typeof object[key]!=='function')return;const original=object[key];object[key]=function(...args){const begin=performance.now();try{return original.apply(this,args);}finally{const elapsed=performance.now()-begin,window=methodCosts[begin-start<2000?'startup':'steady'],row=window[label]??(window[label]={calls:0,totalMs:0,maxMs:0});row.calls++;row.totalMs+=elapsed;row.maxMs=Math.max(row.maxMs,elapsed);}};restores.push(()=>object[key]=original);};
    for(const [,e]of s.actors){instrument(e.actor,'sample','actor.sample');instrument(e.actor?.mesh,'pose','native.pose');instrument(e.craftPose,'deform','craft.deform');instrument(e.craftPose?.drawing,'sample','drawing.sample');}
   }
   s.beforeFrame=function(now){rafNow=now;return originalBefore?.call(this,now);};
   s.render=function(...args){
    const at=performance.now();const result=originalRender.apply(this,args),cost=performance.now()-at;
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
   return{rate,methodCosts:methodProfile?methodCosts:undefined,methodCostsNote:methodProfile?'Inclusive wall CPU timings with wrapper overhead; nested methods overlap. Use for attribution only.':undefined,elapsedMs,samples:intervals.length,frameMs:stats(intervals),submitCpuMs:stats(cpu),over33:intervals.filter(v=>v>33.5).length,over50:intervals.filter(v=>v>50.5).length,firstRenderLatencyMs,wholeRun:windowStats(allIntervals,allCpu),startup:windowStats(startupIntervals,startupCpu),steadyWindowStartMs:2000,calls:stats(calls),textures:stats(textures),slowFrames,initial,final:{round:m.battle.round,actors:m.battle.actors.map(a=>({id:a.id,hp:a.hp,charge:a.charge})),log:m.battle.log.length,result:m.battle.result,screen:m.screen},plans};
  },{rate,methodProfile:process.env.CXV_METHOD_PROFILE==='1'});
  if(process.env.CXV_PROFILE){const {profile}=await cdp.send('Profiler.stop');await writeFile(resolve(out,'cpu.cpuprofile'),JSON.stringify(profile));}
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  run.drawingWeights=await page.evaluate(()=>[...window.__depthScene.actors].map(([id,e])=>({id,poses:e.craftPose?.drawing.vertexWeights?.size??0,bytes:[...(e.craftPose?.drawing.vertexWeights?.values()??[])].reduce((sum,w)=>sum+w.data.byteLength,0)})));
  await page.screenshot({path:resolve(out,`boss-${rate}x.png`)});
  run.identity=runIdentity;run.identityAfter=runtimeEvidence();run.blockedRequests=blockedRequests;
  if(production&&runIdentity.indexSha256!==run.identityAfter.indexSha256)errors.push('Production index changed during this run; do not use as stable paired evidence');
  report.runs.push(run);report.errors.push(...errors);await page.close();
 }
 if(production&&new Set(report.runs.map(r=>r.identity.indexSha256)).size>1)report.errors.push('Production changed between CPU rates; runs are individually identified but are not a paired build comparison');
 report.sourceMeaning=production?'Fixture source HEAD; served application identified by indexSha256 for each run':'Candidate application source HEAD plus runtime patch';
 report.ended=new Date().toISOString();report.pass=!report.errors.length&&report.runs.every(r=>r.samples>200&&r.plans.length>=8&&r.final.log>r.initial.log);
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({out,pass:report.pass,errors:report.errors,runs:report.runs.map(({plans,slowFrames,initial,final,...r})=>({...r,presentations:plans.length,actions:plans.filter(p=>p.kind==='action').length,ultimates:plans.filter(p=>p.ultimate).length,logEvents:final.log-initial.log}))}));
 if(!report.pass)process.exitCode=1;
}finally{await browser.close();}
