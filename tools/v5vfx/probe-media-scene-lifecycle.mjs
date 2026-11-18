/** Native retained-scene lifecycle; explicit simulated visibility coverage is reported separately. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './media-production-fixture.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT);assert(out.startsWith('/Users/bao/taskbar-hero-cardrpg-a6/work/v5/CXV/'));
assert(!existsSync(out),'Preserve previous evidence');await mkdir(out,{recursive:true});
const hash=data=>createHash('sha256').update(data).digest('hex');
const cat=process.env.CXV_MEDIA_CAT??'mochi';assert(['mochi','clover'].includes(cat));
const report={utc:new Date().toISOString(),cat,url:judgeUrl,viewport:{width:1280,height:720},identity:runtimeEvidence(),harnessSha256:hash(await readFile(import.meta.filename)),runtimeSourceSubstitutions:[],nativeVisibilityVerified:false,
 method:'Production scene and decoder, fresh seeded page per preference. Toggle actual model.watching to hide/retain and return to battle; pause preference controls resume. The visibility subcase explicitly simulates document.hidden plus an untrusted visibilitychange event because native automation window changes did not report hidden. No natural-play/performance claim.',environmentOverrides:['Visibility subcase only: document.hidden getter and synthetic visibilitychange; descriptor restored afterward.'],runs:[],pass:false};
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const reduced of [false,true]){
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'));
  const run={mode:reduced?'reduced':'normal',errors,blockedRequests,stages:[]};report.runs.push(run);await save();
  await page.evaluate(({reduced,cat})=>{
   const m=window.__depthReview,s=window.__depthScene;
   const actor=[...s.actors.values()].find(e=>e.asset===cat)?.actor;globalThis.__cxvLifecycleCat=cat;
   globalThis.__cxvRetainedMedia=actor.designerMedia.media;globalThis.__cxvRetainedScene=s;
   m.state.settings.reducedMotion=reduced;m.paused=false;m.notify(false);s.raf=requestAnimationFrame(s.loop);
  },{reduced,cat});
  const snapshot=()=>page.evaluate(()=>{
   const s=window.__depthScene,m=window.__depthReview,actor=[...s.actors.values()].find(e=>e.asset===globalThis.__cxvLifecycleCat)?.actor,media=actor?.designerMedia?.media,v=media?.video,q=v?.getVideoPlaybackQuality?.();
   return{at:performance.now(),documentHidden:document.hidden,showBattle:m.showBattle,gamePaused:m.paused,sceneSuspended:s.view().suspended,sameScene:s===globalThis.__cxvRetainedScene,sameMedia:media===globalThis.__cxvRetainedMedia,source:actor?.source,state:{...media?.state},video:{paused:v?.paused,currentTime:v?.currentTime,seeking:v?.seeking,error:v?.error?.message??null},quality:q?{totalVideoFrames:q.totalVideoFrames,droppedVideoFrames:q.droppedVideoFrames,corruptedVideoFrames:q.corruptedVideoFrames}:null};
  });
  const stage=async(name,count=7)=>{const row={name,samples:[]};run.stages.push(row);await page.waitForTimeout(250);for(let i=0;i<count;i++){row.samples.push(await snapshot());await page.waitForTimeout(100);}await save();return row;};
  const stopped=row=>{assert(row.samples.every(s=>s.sameScene&&s.sameMedia&&s.source==='media'&&s.video.paused&&!s.video.error&&!s.state.disposed));assert.equal(new Set(row.samples.map(s=>s.video.currentTime)).size,1);assert.equal(new Set(row.samples.map(s=>JSON.stringify(s.quality))).size,1);};
  const active=row=>{assert(row.samples.every(s=>s.sameScene&&s.sameMedia&&s.state.ready&&!s.state.suspended&&!s.video.error));if(reduced)stopped(row);else{assert(row.samples.some(s=>!s.video.paused));assert(row.samples.at(-1).quality.totalVideoFrames>row.samples[0].quality.totalVideoFrames);}};
  active(await stage('active'));
  await page.evaluate(()=>{const m=window.__depthReview;m.watching=false;m.notify(false);});
  const hidden=await stage('retained-hidden');stopped(hidden);assert(hidden.samples.every(s=>s.sceneSuspended&&s.state.suspended&&!s.showBattle));
  await page.evaluate(()=>{const m=window.__depthReview;m.watching=true;m.paused=true;m.notify(false);});
  const paused=await stage('return-while-paused');stopped(paused);assert(paused.samples.every(s=>s.showBattle&&!s.sceneSuspended&&!s.state.suspended&&s.gamePaused));
  await page.evaluate(()=>{const m=window.__depthReview;m.paused=false;m.notify(false);});active(await stage('resumed-active'));
  await page.evaluate(()=>{
   globalThis.__cxvHiddenDescriptor=Object.getOwnPropertyDescriptor(document,'hidden');
   Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));
  });
  const visibility=await stage('simulated-document-hidden');stopped(visibility);assert(visibility.samples.every(s=>s.documentHidden&&s.state.suspended&&!s.sceneSuspended));
  await page.evaluate(()=>{
   if(globalThis.__cxvHiddenDescriptor)Object.defineProperty(document,'hidden',globalThis.__cxvHiddenDescriptor);else delete document.hidden;
   document.dispatchEvent(new Event('visibilitychange'));
  });active(await stage('visibility-return'));
  assert.equal(errors.length,0);assert.equal(blockedRequests.length,0);run.pass=true;await save();
  console.log(JSON.stringify({mode:run.mode,stages:run.stages.length,samples:run.stages.reduce((n,s)=>n+s.samples.length,0),pass:true}));await page.close();
 }
 report.pass=report.runs.every(r=>r.pass);report.endedUTC=new Date().toISOString();await save();
}catch(error){report.error=String(error.stack??error);await save();throw error;}finally{await browser.close();}
