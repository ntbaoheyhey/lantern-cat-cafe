/** Unmodified production artifacts except the isolated scheduling variant. */
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {loadRules} from '../cardrpg-big/a4-load.mjs';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './production-candidate-fixture.mjs';
import {hash} from './victory-demand-source.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT),durationMs=32000;await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),url:judgeUrl,...runtimeEvidence(),viewport:{width:1280,height:720},durationMs,
 method:'Rule-resolved wave1 result fixture. Real RAF for32s per normal/reduced preference at1x/4x CPU. CDP whole-page metrics and victory WebGL draw counters; counter wrappers add small overhead. No profiled function timings, screenshots during measurement or gameplay-FPS claim. Same assets; scheduling-only module variant.',runs:[],errors:[],pass:false};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const rate of [1,4])for(const reduced of [true,false]){
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave1'));
  const modules=await loadRules();let battle;
  try{const R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');battle=await page.evaluate(()=>window.__depthReview.battle);R.playBattle(battle,'auto');}finally{await modules.vite.close();}
  await page.evaluate(({battle,reduced})=>{const m=window.__depthReview;m.state.settings.reducedMotion=reduced;m.tutorialBattle=battle;m.showResult();},{battle,reduced});
  await page.waitForSelector('.b3-victory-crew[data-ready=true]');await page.waitForTimeout(2000);
  await page.evaluate(()=>{
   const canvas=document.querySelector('.b3-victory-crew>canvas'),gl=canvas.getContext('webgl2')??canvas.getContext('webgl');if(!gl)throw Error('Victory context missing');
   const a=globalThis.__cxvVictoryCounters={draws:0,uploads:0,restores:[]};
   for(const [method,metric]of [['drawElements','draws'],['drawArrays','draws'],['texImage2D','uploads'],['texSubImage2D','uploads']]){
    const original=gl[method];gl[method]=function(...args){a[metric]++;return original.apply(this,args);};a.restores.push(()=>gl[method]=original);
   }
  });
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate});await cdp.send('Performance.enable');
  const metrics=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(r=>[r.name,r.value]));
  const before=await metrics(),countsBefore=await page.evaluate(()=>{const a=globalThis.__cxvVictoryCounters;return{draws:a.draws,uploads:a.uploads,now:performance.now()};});
  await page.waitForTimeout(durationMs);
  const countsAfter=await page.evaluate(()=>{const a=globalThis.__cxvVictoryCounters;return{draws:a.draws,uploads:a.uploads,now:performance.now()};}),after=await metrics();
  const counters={draws:countsAfter.draws-countsBefore.draws,uploads:countsAfter.uploads-countsBefore.uploads};
  const deltas=Object.fromEntries(['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration','LayoutCount','RecalcStyleCount'].map(k=>[k,after[k]-before[k]]));
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  const name=`${rate}x-${reduced?'reduced':'normal'}`,path=resolve(out,name+'.png'),crewPath=resolve(out,name+'-crew.png');
  await page.screenshot({path});await page.locator('.b3-victory-crew').screenshot({path:crewPath});
  const crew=await page.locator('.b3-victory-crew').evaluate(e=>({ready:e.dataset.ready,drawn:e.dataset.drawn,loadError:e.dataset.loadError,confetti:e.querySelectorAll('.b3-confetti').length,width:e.clientWidth,height:e.clientHeight}));
  assert.equal(crew.ready,'true');assert.equal(crew.drawn,'4');assert(!crew.loadError);
  if(reduced&&report.artifactMode==='native')assert.equal(counters.draws,0,'Reduced candidate must remain idle after settling');else assert(counters.draws>200,'Expected continuously rendered victory');
  const run={rate,reduced,utc:new Date().toISOString(),elapsedMs:countsAfter.now-countsBefore.now,counters,metrics:deltas,heapBefore:before.JSHeapUsedSize,heapAfter:after.JSHeapUsedSize,crew,errors,blockedRequests,path,crewPath,crewSha256:hash(await readFile(crewPath))};
  report.runs.push(run);report.errors.push(...errors);await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  await page.evaluate(()=>globalThis.__cxvVictoryCounters.restores.forEach(restore=>restore()));await page.close();console.log(JSON.stringify({rate,reduced,counters,metrics:deltas,errors}));
 }
 report.identityAfter=runtimeEvidence();assert.equal(report.indexSha256,report.identityAfter.indexSha256);
 report.ended=new Date().toISOString();report.pass=report.runs.length===4&&!report.errors.length&&report.runs.every(r=>!r.blockedRequests.length);await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');if(!report.pass)process.exitCode=1;
}finally{await browser.close();}
