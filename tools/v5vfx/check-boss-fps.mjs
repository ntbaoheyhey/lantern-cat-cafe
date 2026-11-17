/** Single indicative boss workload check, no standalone microbenchmark. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),out=resolve('work/v5/CXV/films/V5-boss');await mkdir(out,{recursive:true});
const report={started:new Date().toISOString(),sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),load:execFileSync('uptime',{encoding:'utf8'}).trim()};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{url:'http://127.0.0.1:6310',fixedClock:false});report.url=page.url();
 await page.evaluate(async root=>{
  const {pilotFixture}=await import('/@fs'+root+'/apps/web/src/game/cardrpg/vfx-layered/fixture.ts');
  const {configureSequence}=await import('/src/game/cardrpg/battle-v3/sequence.ts');
  const f=pilotFixture('enemy:yarn-giant'),m=window.__depthReview,s=window.__depthScene;
  m.galleryBattle=f.battle;m.plan=configureSequence(f.plan);m.galleryId='enemy:yarn-giant';m.animationAt=0;m.paused=true;m.notify(false);cancelAnimationFrame(s.raf);s.ensureActors(s.view());
 },root);
 await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length);
 report.fps=await page.evaluate(async()=>{
  const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);
  return new Promise(resolve=>{let start=0,last=0,frames=0;const deltas=[];
   function frame(now){if(!start){start=now;last=now;}else{deltas.push(now-last);frames++;last=now;}
    const elapsed=now-start;m.animationAt=elapsed%m.plan.duration;s.render({...s.view(),fixedTime:30+elapsed/1000,paused:true},1/60);
    if(elapsed<6000)requestAnimationFrame(frame);else{deltas.sort((a,b)=>a-b);resolve({label:'shared machine',frames,elapsedMs:elapsed,fps:frames*1000/elapsed,p95Ms:deltas[Math.floor(deltas.length*.95)],stats:s.stats});}
   }requestAnimationFrame(frame);
  });
 });
 report.errors=errors;report.blockedRequests=blockedRequests;report.finished=new Date().toISOString();report.pass=report.fps.fps>=55&&!errors.length;
 await page.screenshot({path:resolve(out,'boss.png')});await writeFile(resolve(out,'fps.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(!report.pass)process.exitCode=1;
}finally{await browser.close();}
