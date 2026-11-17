/** Normal-first control: retain elapsed task time and actual renderer-thread CPU. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {loadRules} from '../cardrpg-big/a4-load.mjs';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './production-candidate-fixture.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT),durationMs=32000;await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),url:judgeUrl,...runtimeEvidence(),viewport:{width:1280,height:720},durationMs,method:'Fresh normal-only result pages, no preceding reduced window. Explicit CDP timeTicks task/script durations plus independent ThreadTime and ProcessTime CPU counters. Separate RAF cadence probe; no function instrumentation, screenshot during measurement, or gameplay-FPS claim.',runs:[],errors:[],pass:false};
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});report.browserVersion=browser.version();
try{
 for(const rate of [1,4]){
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave1'));
  const modules=await loadRules();let battle;
  try{const R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');battle=await page.evaluate(()=>window.__depthReview.battle);R.playBattle(battle,'auto');}finally{await modules.vite.close();}
  await page.evaluate(battle=>{const m=window.__depthReview;m.state.settings.reducedMotion=false;m.tutorialBattle=battle;m.showResult();},battle);
  await page.waitForSelector('.b3-victory-crew[data-ready=true]');await page.waitForTimeout(2000);
  await page.evaluate(()=>{
   const canvas=document.querySelector('.b3-victory-crew>canvas'),gl=canvas.getContext('webgl2')??canvas.getContext('webgl');if(!gl)throw Error('Victory context missing');
   const a=globalThis.__cxvNormalControl={draws:0,frameTimes:[],raf:0,last:0};
   for(const method of ['drawElements','drawArrays']){const original=gl[method];gl[method]=function(...args){a.draws++;return original.apply(this,args);};}
   const sample=now=>{if(a.last)a.frameTimes.push(now-a.last);a.last=now;a.raf=requestAnimationFrame(sample);};a.raf=requestAnimationFrame(sample);
  });
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate});await cdp.send('Performance.enable',{timeDomain:'timeTicks'});
  const metrics=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(r=>[r.name,r.value]));
  const before=await metrics();assert(Number.isFinite(before.ThreadTime)&&Number.isFinite(before.ProcessTime),'CPU counters must be available');
  const countsBefore=await page.evaluate(()=>{const a=globalThis.__cxvNormalControl;a.frameTimes=[];a.last=0;return{draws:a.draws,now:performance.now()};});
  await page.waitForTimeout(durationMs);
  const countsAfter=await page.evaluate(()=>{const a=globalThis.__cxvNormalControl;cancelAnimationFrame(a.raf);return{draws:a.draws,frameTimes:a.frameTimes,now:performance.now()};}),after=await metrics();
  const deltas=Object.fromEntries(Object.entries(after).filter(([key])=>Number.isFinite(before[key])).map(([key,value])=>[key,value-before[key]]));
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  const crew=await page.locator('.b3-victory-crew').evaluate(e=>({ready:e.dataset.ready,drawn:e.dataset.drawn,loadError:e.dataset.loadError,confetti:e.querySelectorAll('.b3-confetti i').length}));
  assert.equal(crew.ready,'true');assert.equal(crew.drawn,'4');assert(!crew.loadError);assert.equal(crew.confetti,32);
  const values=[...countsAfter.frameTimes].sort((a,b)=>a-b),quantile=q=>values[Math.floor((values.length-1)*q)];
  assert(values.length>1500&&countsAfter.draws-countsBefore.draws>6500);
  const run={utc:new Date().toISOString(),rate,elapsedMs:countsAfter.now-countsBefore.now,metrics:deltas,metricsBefore:before,metricsAfter:after,draws:countsAfter.draws-countsBefore.draws,raf:{samples:values.length,p50:quantile(.5),p95:quantile(.95),p99:quantile(.99),max:values.at(-1),over33:values.filter(v=>v>33.4).length,over50:values.filter(v=>v>50).length},crew,errors,blockedRequests};
  report.runs.push(run);report.errors.push(...errors);await save();await page.close();
 }
 report.pass=!report.errors.length&&report.runs.every(r=>!r.blockedRequests.length);report.ended=new Date().toISOString();await save();assert(report.pass);
}catch(error){report.errors.push(String(error));await save();throw error;}finally{await browser.close();}
