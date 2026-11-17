/** Paired real-rAF boss presentation stress; does not measure full patrol throughput. */
import {chromium,config,openFixture} from './production-fixture.mjs';
import {runtimeEvidence} from './production-fixture.mjs';
import assert from 'node:assert/strict';
import {loadPilotFixtures} from './pilot-fixture.mjs';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const label=process.argv[2];assert(/^[a-z0-9-]+$/.test(label??''));
const out=resolve('work/v5/CXI/performance',label);try{await access(out);throw Error('Use a fresh evidence directory');}catch(e){if(e.code!=='ENOENT')throw e;}await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),hardware:execFileSync('sysctl',['-n','machdep.cpu.brand_string'],{encoding:'utf8'}).trim(),method:'Warm Metal Chromium,1280x720,DPR1; repeated2200ms Yarn ultimate sampled from real requestAnimationFrame for12s after2s warmup. CPU throttle4 is a stress proxy, not another laptop; callback duration excludes GPU completion. No real patrol pacing claim.',runs:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();
 const modules=await loadPilotFixtures(),f=modules.pilotFixture('enemy:yarn-giant'),plan=modules.configureSequence(f.plan);await modules.close();
 await page.evaluate(({battle,plan})=>{const m=window.__depthReview;m.galleryBattle=battle;m.plan=plan;m.animationAt=0;m.paused=true;m.sceneStarted=true;m.notify(false);window.__depthScene.ensureActors(window.__depthScene.view());},{battle:f.battle,plan});
 await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length);
 const cdp=await page.context().newCDPSession(page);
 for(const rate of process.env.CXI_PROFILE?[4]:[1,4]){
  await cdp.send('Emulation.setCPUThrottlingRate',{rate});
  if(process.env.CXI_PROFILE){await cdp.send('Profiler.enable');await cdp.send('Profiler.start');}
  report.runs.push(await page.evaluate(async rate=>{
   const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);let start=0,last=0;const intervals=[],cpu=[],calls=[],textures=[],triangles=[];
   return new Promise(resolve=>{const frame=now=>{if(!start)start=now;const elapsed=now-start,phase=elapsed%2200;m.animationAt=phase;const at=performance.now();s.render({...s.view(),frame:m.frame,fixedTime:30+elapsed/1000,paused:false,galleryPreview:true},1/60);const cost=performance.now()-at;if(elapsed>=2000&&last){intervals.push(now-last);cpu.push(cost);calls.push(s.stats.calls);textures.push(s.stats.textures);triangles.push(s.stats.triangles);}last=now;if(elapsed<14000)requestAnimationFrame(frame);else{const stats=v=>{const a=[...v].sort((a,b)=>a-b);return{median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],p99:a[Math.floor(a.length*.99)],max:a.at(-1)};};resolve({rate,samples:intervals.length,frameMs:stats(intervals),submitCpuMs:stats(cpu),over33:intervals.filter(v=>v>33.5).length,over50:intervals.filter(v=>v>50.5).length,calls:stats(calls),textures:stats(textures),triangles:stats(triangles)});}};requestAnimationFrame(frame);});
  },rate));
  if(process.env.CXI_PROFILE){const {profile}=await cdp.send('Profiler.stop');await writeFile(resolve(out,'cpu.cpuprofile'),JSON.stringify(profile));}
 }
 report.errors=errors;report.blockedRequests=blockedRequests;await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,runs:report.runs,errors,blockedRequests}));assert.equal(errors.length,0);assert.equal(blockedRequests.length,0);
}finally{await browser.close();}
