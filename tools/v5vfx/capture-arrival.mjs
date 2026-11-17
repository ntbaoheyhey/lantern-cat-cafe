/** Actual scene arrival, including the first action at80ms; original events unchanged. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V-C-arrival');await mkdir(out,{recursive:true});
const report={started:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),method:'Actual scene transforms and original fixture actions; explicit presentation clock, first action80ms; no post-render transforms. Desktop1280x720. Film uses25 exact clock samples per second, not live performance proof.',cases:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const mode of ['arrival','incoming','acting','reduced']){
  const dir=resolve(out,mode);await mkdir(dir,{recursive:true});
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{url:'http://127.0.0.1:6310',fixedClock:false});report.url=page.url();
  await page.evaluate(async mode=>{
   const {pilotFixture}=await import('/src/game/cardrpg/vfx-layered/fixture.ts');
   const {configureSequence}=await import('/src/game/cardrpg/battle-v3/sequence.ts');
   const f=pilotFixture(mode==='acting'?'enemy:yarn-giant:basic':'mochi-1'),m=window.__depthReview,s=window.__depthScene;
   m.galleryBattle=f.battle;m.plan=['incoming','acting'].includes(mode)?configureSequence(f.plan):null;m.galleryId='';m.animationAt=0;m.paused=true;m.sceneStarted=true;m.labOpen=false;m.state.settings.reducedMotion=mode==='reduced';m.notify(false);cancelAnimationFrame(s.raf);s.ensureActors(s.view());
  },mode);
  await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length,null,{timeout:90000});
  await page.evaluate(()=>{
   const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),frame:null,fixedTime:20,paused:true,galleryPreview:true},0);
   s.phaseNoticeAt=-100;
   for(const e of s.actors.values()){e.entered=e.asset==='yarn-giant'?20:-100;e.entranceDone=e.asset!=='yarn-giant';e.hurtAt=-100;}
  });
  const samples=[],times=mode==='arrival'?Array.from({length:41},(_,i)=>i*40):[0,79,80,81,120,160,230,240,280,330,429,430,470,620,900];
  for(const [index,ms]of times.entries()){
   const sample=await page.evaluate(({ms,mode})=>{
    const m=window.__depthReview,s=window.__depthScene;cancelAnimationFrame(s.raf);m.animationAt=Math.max(0,ms-80);
    const v=s.view();s.render({...v,frame:ms<80?null:v.frame,fixedTime:20+ms/1000,paused:true,galleryPreview:false},0);
    const [id,e]=[...s.actors].find(([,e])=>e.asset==='yarn-giant'),box=s.bounds(e),home=s.homes.get(id).point;
    return {ms,feet:s.socket(id,'feet'),home,box,root:s.motionAudit.find(x=>x.id===id),pose:s.sampled.get(id),label:s.anchors.find(x=>x.id===id),cinematic:{...s.cinematic},damage:v.frame?.plan.events.filter(x=>x.type==='damage'),contact:v.frame?.plan.beats[2].start,actorId:m.plan?.actorId};
   },{ms,mode});samples.push(sample);
   await page.screenshot({path:resolve(dir,`frame-${String(index).padStart(2,'0')}.png`)});
  }
  const wanted=mode==='arrival'?[80,240,440,900]:[80,240,430,620];
  const selected=wanted.map(ms=>times.reduce((best,t,i)=>Math.abs(t-ms)<Math.abs(times[best]-ms)?i:best,0));
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...selected.flatMap(i=>['-i',resolve(dir,`frame-${String(i).padStart(2,'0')}.png`)]),'-filter_complex','[0:v]scale=512:-1[a];[1:v]scale=512:-1[b];[2:v]scale=512:-1[c];[3:v]scale=512:-1[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[v]','-map','[v]','-frames:v','1','-q:v','4',resolve(out,mode+'.jpg')]);
  if(mode==='arrival')execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','25','-i',resolve(dir,'frame-%02d.png'),'-an','-c:v','libvpx-vp9','-crf','32','-b:v','0',resolve(out,'arrival-1280x720.webm')]);
  report.cases.push({mode,samples});report.errors.push(...errors);await page.close();
 }
}catch(error){report.error=String(error);process.exitCode=1;}
finally{await browser.close();report.finished=new Date().toISOString();await writeFile(resolve(out,'capture.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify({out,cases:report.cases.length,errors:report.errors,error:report.error}));
