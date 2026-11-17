/** Rule-selected boss battle at real 1x, using the normal scene/model loop. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-boss-play');
await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),hardware:execFileSync('sysctl',['-n','machdep.cpu.brand_string'],{encoding:'utf8'}).trim(),viewport:{width:1280,height:720},method:'Seeded level6 boss fixture, then normal automatic rule-selected play at speed1 with actual scene/model requestAnimationFrame loop;32s wall time per CPU rate. No plan replay, fixed clock, synthesized events, or accelerated model steps. Fixture setup is not ordinary account progression. 4x CPU is a stress proxy, not another physical laptop. CPU render submission excludes GPU completion. Screenshots taken only after measurement.',runs:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const rate of process.env.CXV_PROFILE?[4]:[1,4]){
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});
  report.url=page.url();const cdp=await page.context().newCDPSession(page);
  await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
  await cdp.send('Emulation.setCPUThrottlingRate',{rate});
  if(process.env.CXV_PROFILE){await cdp.send('Profiler.enable');await cdp.send('Profiler.start');}
  const run=await page.evaluate(async rate=>{
   const s=window.__depthScene,m=window.__depthReview,originalRender=s.render,originalBefore=s.beforeFrame;
   const intervals=[],cpu=[],calls=[],textures=[],plans=[],slowFrames=[],seen=new Set();
   const initial={round:m.battle.round,actors:m.battle.actors.map(a=>({id:a.id,hp:a.hp,charge:a.charge})),log:m.battle.log.length};
   let last=0,rafNow=0;const start=performance.now();
   s.beforeFrame=function(now){rafNow=now;return originalBefore?.call(this,now);};
   s.render=function(...args){
    const at=performance.now();const result=originalRender.apply(this,args),cost=performance.now()-at;
    if(cost>20)slowFrames.push({wallMs:at-start,cpuMs:cost,skill:m.plan?.skillId,age:m.animationAt,drawCalls:s.stats.calls,textures:s.stats.textures});
    if(at-start>=2000&&last){intervals.push(rafNow-last);cpu.push(cost);calls.push(s.stats.calls);textures.push(s.stats.textures);}
    last=rafNow;
    if(m.plan&&!seen.has(m.plan)){seen.add(m.plan);plans.push({wallMs:at-start,actorId:m.plan.actorId,skillId:m.plan.skillId,ultimate:m.plan.ultimate,duration:m.plan.duration,leadIn:m.plan.voiceLeadInMs??0});}
    return result;
   };
   cancelAnimationFrame(s.raf);m.paused=false;m.notify(false);s.raf=requestAnimationFrame(s.loop);
   await new Promise(resolve=>setTimeout(resolve,32000));
   const elapsedMs=performance.now()-start;m.paused=true;m.notify(false);cancelAnimationFrame(s.raf);s.render=originalRender;s.beforeFrame=originalBefore;
   const stats=v=>{const a=[...v].sort((x,y)=>x-y);return{median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],p99:a[Math.floor(a.length*.99)],max:a.at(-1)};};
   return{rate,elapsedMs,samples:intervals.length,frameMs:stats(intervals),submitCpuMs:stats(cpu),over33:intervals.filter(v=>v>33.5).length,over50:intervals.filter(v=>v>50.5).length,calls:stats(calls),textures:stats(textures),slowFrames,initial,final:{round:m.battle.round,actors:m.battle.actors.map(a=>({id:a.id,hp:a.hp,charge:a.charge})),log:m.battle.log.length,result:m.battle.result,screen:m.screen},plans};
  },rate);
  if(process.env.CXV_PROFILE){const {profile}=await cdp.send('Profiler.stop');await writeFile(resolve(out,'cpu.cpuprofile'),JSON.stringify(profile));}
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  await page.screenshot({path:resolve(out,`boss-${rate}x.png`)});
  report.runs.push(run);report.errors.push(...errors);await page.close();
 }
 report.ended=new Date().toISOString();report.pass=!report.errors.length&&report.runs.every(r=>r.samples>200&&r.plans.length>=8&&r.final.log>r.initial.log);
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({out,pass:report.pass,errors:report.errors,runs:report.runs.map(({plans,slowFrames,initial,final,...r})=>({...r,actions:plans.length,ultimates:plans.filter(p=>p.ultimate).length,logEvents:final.log-initial.log}))}));
 if(!report.pass)process.exitCode=1;
}finally{await browser.close();}
