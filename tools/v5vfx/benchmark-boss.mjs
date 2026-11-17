/** Paired real-rAF boss presentation stress; does not measure full patrol throughput. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-performance');await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),hardware:execFileSync('sysctl',['-n','machdep.cpu.brand_string'],{encoding:'utf8'}).trim(),method:'Warm Metal Chromium,1280x720,DPR1; repeated2200ms Yarn ultimate sampled from real requestAnimationFrame for12s after2s warmup. CPU throttle4 is a stress proxy, not another laptop; callback duration excludes GPU completion. No real patrol pacing claim.',runs:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();
 await page.evaluate(async()=>{const {pilotFixture}=await import('/src/game/cardrpg/vfx-layered/fixture.ts');const {configureSequence}=await import('/src/game/cardrpg/battle-v3/sequence.ts');const f=pilotFixture('enemy:yarn-giant'),m=window.__depthReview;m.galleryBattle=f.battle;m.plan=configureSequence(f.plan);m.animationAt=0;m.paused=true;m.sceneStarted=true;m.notify(false);window.__depthScene.ensureActors(window.__depthScene.view());});
 await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length);
 const cdp=await page.context().newCDPSession(page);
 for(const rate of process.env.CXV_PROFILE?[4]:[1,4]){
  await cdp.send('Emulation.setCPUThrottlingRate',{rate});
  if(process.env.CXV_PROFILE){await cdp.send('Profiler.enable');await cdp.send('Profiler.start');}
  report.runs.push(await page.evaluate(async rate=>{
   const {sampleActionPlan}=await import('/src/game/squad/turn3d/effects.ts');const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);let start=0,last=0;const intervals=[],cpu=[],calls=[],textures=[],triangles=[];
   return new Promise(resolve=>{const frame=now=>{if(!start)start=now;const elapsed=now-start,phase=elapsed%2200;m.animationAt=phase;const at=performance.now();s.render({...s.view(),frame:sampleActionPlan(m.plan,phase,false),fixedTime:30+elapsed/1000,paused:false,galleryPreview:true},1/60);const cost=performance.now()-at;if(elapsed>=2000&&last){intervals.push(now-last);cpu.push(cost);calls.push(s.stats.calls);textures.push(s.stats.textures);triangles.push(s.stats.triangles);}last=now;if(elapsed<14000)requestAnimationFrame(frame);else{const stats=v=>{const a=[...v].sort((a,b)=>a-b);return{median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],p99:a[Math.floor(a.length*.99)],max:a.at(-1)};};resolve({rate,samples:intervals.length,frameMs:stats(intervals),submitCpuMs:stats(cpu),over33:intervals.filter(v=>v>33.5).length,over50:intervals.filter(v=>v>50.5).length,calls:stats(calls),textures:stats(textures),triangles:stats(triangles)});}};requestAnimationFrame(frame);});
  },rate));
  if(process.env.CXV_PROFILE){const {profile}=await cdp.send('Profiler.stop');await writeFile(resolve(out,'cpu.cpuprofile'),JSON.stringify(profile));}
 }
 report.errors=errors;await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
