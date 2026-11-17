/** Observe actual idle deadlines in the normal scene loop; never upload textures. */
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-idle-budget');
await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),toolSha256:createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex'),viewport:{width:1280,height:720},method:'Observe real requestIdleCallback deadlines with no timeout and no texture uploads:5s paused scene loop then32s actual rule-selected speed1 boss play per1x/4x CPU. Diagnostic sampling adds overhead. A reported budget is an estimate, not a guarantee that nonpreemptible GPU submission fits. Fixture setup is not account progression.',runs:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const rate of [1,4]){
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();
  await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate});
  const run=await page.evaluate(async rate=>{
   if(typeof requestIdleCallback!=='function')return{rate,supported:false};
   const s=window.__depthScene,m=window.__depthReview,start=performance.now(),samples=[],plans=[],renders=[],seen=new Set();
   let phase='paused',active=true,idleId;const original=s.render;
   const initialLog=m.battle.log.length;
   const observe=deadline=>{
    const at=performance.now(),remaining=deadline.timeRemaining(),plan=m.plan;
    samples.push({wallMs:at-start,phase,remaining,didTimeout:deadline.didTimeout,skillId:plan?.skillId??null,age:m.animationAt??null,preContact:!!plan&&!s.firstHit,damage:!!plan?.events.some(e=>e.type==='damage')});
    if(active)idleId=requestIdleCallback(observe);
   };
   s.render=function(...args){const at=performance.now();const result=original.apply(this,args);renders.push({wallMs:at-start,phase,cpuMs:performance.now()-at});if(m.plan&&!seen.has(m.plan)){seen.add(m.plan);plans.push({wallMs:at-start,actorId:m.plan.actorId,skillId:m.plan.skillId,damage:m.plan.events.some(e=>e.type==='damage')});}return result;};
   cancelAnimationFrame(s.raf);m.paused=true;m.notify(false);s.raf=requestAnimationFrame(s.loop);idleId=requestIdleCallback(observe);
   try{
    await new Promise(resolve=>setTimeout(resolve,5000));phase='playing';m.paused=false;m.notify(false);
    await new Promise(resolve=>setTimeout(resolve,32000));
   }finally{active=false;cancelIdleCallback(idleId);cancelAnimationFrame(s.raf);m.paused=true;m.notify(false);s.render=original;}
   return{rate,supported:true,elapsedMs:performance.now()-start,initialLog,finalLog:m.battle.log.length,samples,plans,renders};
  },rate);
  report.runs.push(run);report.errors.push(...errors);await page.close();
  await writeFile(resolve(out,'report.partial.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({rate,samples:run.samples?.length,plans:run.plans?.length,errors}));
 }
 const stats=values=>{const v=[...values].sort((a,b)=>a-b);return{count:v.length,median:v[Math.floor(v.length*.5)]??null,p95:v[Math.floor(v.length*.95)]??null,max:v.at(-1)??null,atLeast8:v.filter(n=>n>=8).length,atLeast12:v.filter(n=>n>=12).length,atLeast20:v.filter(n=>n>=20).length,atLeast25:v.filter(n=>n>=25).length};};
 report.summary=report.runs.map(run=>({rate:run.rate,supported:run.supported,paused:stats((run.samples??[]).filter(v=>v.phase==='paused').map(v=>v.remaining)),playing:stats((run.samples??[]).filter(v=>v.phase==='playing').map(v=>v.remaining)),preDamageContact:stats((run.samples??[]).filter(v=>v.phase==='playing'&&v.preContact&&v.damage).map(v=>v.remaining)),plans:run.plans?.length,logEvents:run.finalLog-run.initialLog}));
 report.pass=report.errors.length===0&&report.runs.every(r=>r.supported&&r.plans.length>=8&&r.finalLog>r.initialLog);report.ended=new Date().toISOString();
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,pass:report.pass,summary:report.summary}));if(!report.pass)process.exitCode=1;
}catch(error){report.errors.push(String(error.stack??error));report.pass=false;await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));throw error;}finally{await browser.close();}
