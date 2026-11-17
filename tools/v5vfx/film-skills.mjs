/** Current desktop ultimates at 1x, driven by the scene's real action clock. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const out=resolve(process.env.CXV_FILM_OUT??'work/v5/CXV/films/V-B-motion');
await mkdir(out,{recursive:true});
const report={started:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 ...runtimeEvidence(),viewport:{width:1280,height:720},method:'Four live A6 ultimates on the judge route. Actual requestAnimationFrame elapsed time at 1x; isolated fixtures, not a completed gameplay battle.',actions:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const captureBrowser={newPage:options=>browser.newPage({...options,recordVideo:{dir:out,size:report.viewport}})};
 const {page,errors}=await openFixture(captureBrowser,config.fixtures.find(f=>f.id==='boss'),{url:'http://127.0.0.1:6310',fixedClock:false});report.url=page.url();
 for(const owner of ['mochi','soot','clover','panko']){
  await page.evaluate(async owner=>{
   const {pilotFixture}=await import('/src/game/cardrpg/vfx-layered/fixture.ts'),{configureSequence}=await import('/src/game/cardrpg/battle-v3/sequence.ts');
   const f=pilotFixture(owner+'-4'),m=window.__depthReview,s=window.__depthScene;
   m.galleryBattle=f.battle;m.plan=configureSequence(f.plan);m.galleryId=owner+'-4';m.animationAt=0;m.paused=true;m.labOpen=false;m.sceneStarted=true;
   m.notify(false);cancelAnimationFrame(s.raf);s.ensureActors(s.view());
  },owner);
  await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length);
  const started=new Date().toISOString();
  await page.evaluate(owner=>new Promise(resolve=>{
   const s=window.__depthScene,m=window.__depthReview;let start,previous;
   let label=document.querySelector('[data-cxv-film]');if(!label){label=document.createElement('div');label.dataset.cxvFilm='true';document.body.append(label);}
   Object.assign(label.style,{position:'fixed',bottom:'8px',left:'8px',color:'#fff4d8',background:'#21182dee',padding:'6px 10px',font:'16px monospace',zIndex:'999999'});
   const frame=now=>{start??=now;previous??=now;const ms=now-start;m.animationAt=Math.min(ms,m.plan.duration-1);
    s.render({...s.view(),fixedTime:20+ms/1000,paused:true},Math.min(.05,(now-previous)/1000));previous=now;
    label.textContent=`${owner} ultimate · 1x · ${Math.round(m.animationAt)} ms`;
    if(ms<2600)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);
  }),owner);
  report.actions.push({owner,started,finished:new Date().toISOString()});
 }
 const video=page.video();await page.close();await video.saveAs(resolve(out,'ultimates-1280x720.webm'));report.film=resolve(out,'ultimates-1280x720.webm');report.errors=errors;
 if(errors.length)process.exitCode=1;
}finally{await browser.close();report.finished=new Date().toISOString();await writeFile(resolve(out,'capture.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify({out,errors:report.errors,actions:report.actions.length}));
