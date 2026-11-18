/** Rule-resolved result fixture; native production media, no application substitutions. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {loadRules} from '/Users/bao/taskbar-hero-chain/tools/cardrpg-big/a4-load.mjs';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './media-production-fixture.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT),failure=process.env.CXV_MEDIA_VICTORY_EXPECT_FAILURE==='1';
assert(out.startsWith('/Users/bao/taskbar-hero-cardrpg-a6/work/v5/CXV/'));assert(!existsSync(resolve(out,'report.json')));await mkdir(out,{recursive:true});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const report={utc:new Date().toISOString(),url:judgeUrl,viewport:{width:1280,height:720},identity:runtimeEvidence(),runtimePatchSha256:null,harnessSha256:hash(await readFile(import.meta.filename)),expectedFailure:failure,method:'Fresh page per preference, rule-resolved result fixture. Captures caught native exceptions with CDP and observes created video elements. No natural-play or performance claim.',runs:[],pass:false};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
try{
 for(const reduced of failure?[false]:[false,true]){
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{setupPage:async p=>p.addInitScript(()=>{
   const create=document.createElement;globalThis.__cxvVictoryVideos=[];
   document.createElement=function(...args){const e=create.apply(this,args);if(args[0].toLowerCase()==='video')globalThis.__cxvVictoryVideos.push(e);return e;};
  })});
  const run={mode:reduced?'reduced':'normal',errors,blockedRequests,exceptions:[],samples:[]};report.runs.push(run);await save();
  const cdp=await page.context().newCDPSession(page);await cdp.send('Debugger.enable');
  cdp.on('Debugger.paused',async event=>{
   run.exceptions.push({reason:event.reason,data:event.data,stack:event.callFrames.slice(0,6).map(f=>({name:f.functionName,url:f.url,location:f.location}))});
   await cdp.send('Debugger.resume');
  });await cdp.send('Debugger.setPauseOnExceptions',{state:'all'});
  const modules=await loadRules();let battle;
  try{const R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');battle=await page.evaluate(()=>window.__depthReview.battle);R.playBattle(battle,'auto');}finally{await modules.vite.close();}
  assert.equal(battle.result,'party');
  await page.evaluate(({battle,reduced})=>{globalThis.__cxvVictoryVideoStart=globalThis.__cxvVictoryVideos.length;const m=window.__depthReview;m.state.settings.reducedMotion=reduced;m.tutorialBattle=battle;m.showResult();},{battle,reduced});
  await page.waitForFunction(()=>{const e=document.querySelector('.b3-victory-crew');return e?.dataset.ready==='true'||e?.dataset.loadError==='true';},null,{timeout:15000});
  const snapshot=()=>page.evaluate(()=>{
   const e=document.querySelector('.b3-victory-crew');return{at:performance.now(),ready:e?.dataset.ready??null,drawn:e?.dataset.drawn??null,loadError:e?.dataset.loadError??null,videos:globalThis.__cxvVictoryVideos.slice(globalThis.__cxvVictoryVideoStart).map(v=>{const q=v.getVideoPlaybackQuality?.();return{currentTime:v.currentTime,duration:v.duration,paused:v.paused,seeking:v.seeking,readyState:v.readyState,error:v.error?.message??null,source:v.currentSrc,quality:q?{totalVideoFrames:q.totalVideoFrames,droppedVideoFrames:q.droppedVideoFrames,corruptedVideoFrames:q.corruptedVideoFrames}:null};})};
  });
  run.initial=await snapshot();
  if(failure){assert.equal(run.initial.loadError,'true');assert.notEqual(run.initial.ready,'true');assert(run.exceptions.some(e=>e.data?.description?.includes('Drawing swaps require an accepted cut-out rig')));}
  else{
   assert.equal(run.initial.ready,'true');assert.equal(run.initial.drawn,'3');assert.equal(run.initial.loadError,null);
   await page.waitForFunction(()=>{const v=globalThis.__cxvVictoryVideos.slice(globalThis.__cxvVictoryVideoStart);return v.length===1&&v[0].readyState>=2&&!v[0].seeking;},null,{timeout:15000});
   for(let i=0;i<(reduced?20:120);i++){await page.waitForTimeout(100);run.samples.push(await snapshot());}
   assert(run.samples.every(s=>s.videos.length===1&&s.videos[0].readyState>=2&&!s.videos[0].error));
   const times=run.samples.map(s=>s.videos[0].currentTime),deltas=times.slice(1).map((v,i)=>v-times[i]);
   run.clock={min:Math.min(...times),max:Math.max(...times),wraps:deltas.filter(d=>d<-5).length,maxForward:Math.max(...deltas)};
   if(reduced){assert(run.samples.every(s=>s.videos[0].paused));assert(Math.max(...times)-Math.min(...times)<1/30);}
   else{assert(run.clock.max-run.clock.min>9);assert(run.clock.wraps>=1);assert(deltas.every(d=>d>=0||d<-5),'Short gesture must not rewind the media clock');}
   assert.equal(errors.length,0);assert.equal(blockedRequests.length,0);
   assert(!run.exceptions.some(e=>e.data?.description?.includes('Drawing swaps require an accepted cut-out rig')));
  }
  run.final=await snapshot();run.capture=resolve(out,run.mode+'.png');await page.screenshot({path:run.capture,scale:'css'});run.captureSha256=hash(await readFile(run.capture));
  await save();await page.close();
 }
 report.identityAfter=runtimeEvidence();assert.equal(report.identityAfter.indexSha256,report.identity.indexSha256);report.pass=true;
}catch(error){report.error=String(error);throw error;}finally{report.ended=new Date().toISOString();await save();await browser.close();}
console.log(JSON.stringify({out,pass:report.pass,runs:report.runs.map(r=>({mode:r.mode,ready:r.final.ready,loadError:r.final.loadError,exceptions:r.exceptions.length,clock:r.clock}))}));
