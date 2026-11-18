/** Native paint attribution only: ordinary baseline plus explicit reversible isolation controls. */
import assert from 'node:assert/strict';
import {sample,installLowerBodyLabel,installLabelTargetShift} from './action-label-observation.mjs';
import {settleHudMeters} from './hud-meter-observation.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl,waitForDecodedMediaFrame} from './media-production-fixture.mjs';
const root=resolve(import.meta.dirname,'../..'),out=resolve(process.env.CXV_CAPTURE_OUT??''),sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(process.env.CXV_MEDIA_CAT,'both');assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(!existsSync(resolve(out,'report.json')));await mkdir(out,{recursive:true});
const buildPath=process.env.CXV_MEDIA_BUILD,build=JSON.parse(await readFile(buildPath)),verified=JSON.parse(await readFile(resolve(out,'artifact-verification.json')));
assert.equal(verified.indexSha256,build.indexSha256);assert.equal(verified.sourceCommit,build.sourceCommit);
const preregPath=resolve(process.env.CXV_ACTION_LABEL_PREREG??''),prereg=JSON.parse(await readFile(preregPath));
assert.equal(build.sourceCommit,prereg.sourceCommit);assert.equal(build.indexSha256,prereg.indexSha256);
const statusFixture=process.env.CXV_LABEL_STATUS_FIXTURE??'none';assert(['none','expanded'].includes(statusFixture));
const frames=prereg.idleFrames[statusFixture],targetDx=prereg.candidate.cloverDx,targetDy=prereg.candidate.cloverDy;
assert.deepEqual([targetDx,targetDy],[-28,14]);assert(prereg.lowerBodyLabel&&prereg.hudMeterSettlement);
const plannedCases=[...frames.map(frame=>({mode:'normal',frame})),{mode:'reduced',frame:0}].map(c=>({...c,key:`${statusFixture}-${c.mode}-${c.frame}`,cat:'idle',skill:0,ms:c.frame*1000/30}));
const hiddenStyle='.b3-world { visibility: hidden !important; }';
const installExpandedStatusFixture=()=>{
 const m=window.__depthReview;
 for(const actor of m.battle.actors.filter(a=>['mochi','clover'].includes(a.catalogId))){
  actor.shield=80;
  actor.statuses=['scald','bitter','drowsy','tangle'].map((id,i)=>({id,stacks:i===0?12345:i+1,remaining:2,source:actor.id,appliedRound:m.battle.round}));
 }
 m.notify(false);
};
const installIsolation=()=>{
 const s=window.__depthScene,original=s.postFx.render;
 globalThis.__cxvLabelIsolation={hidden:null,original};
 s.postFx.render=function(...args){
  const cat=globalThis.__cxvLabelIsolation.hidden,actor=cat?s.actors.get(cat)?.actor:null,plane=actor?(actor.designerMedia?.media.plane??actor.root):null;
  if(cat&&!plane)throw Error('Missing diagnostic media plane '+cat);
  const visible=plane?.visible;if(plane)plane.visible=false;
  try{return original.apply(this,args);}finally{if(plane)plane.visible=visible;}
 };
};
const report={utc:new Date().toISOString(),url:judgeUrl,viewport:[1280,720],sourceCommit:build.sourceCommit,indexSha256:build.indexSha256,build:{path:buildPath,sha256:sha(await readFile(buildPath))},harnessSha256:sha(await readFile(import.meta.filename)),fixture:runtimeEvidence(),runtimeSourceSubstitutions:[],runtimeDiagnostic:{wrapperSha256:sha(installIsolation.toString()),hiddenLabelCss:hiddenStyle,hiddenLabelCssSha256:sha(hiddenStyle),scope:'Hide one M/C media plane or Panko/Mallow root only during postFx and restore;native shadow and separate VFX excluded. Hide label paint only for marked screenshots. No application edit.'},plannedCases,cases:[],errors:[],blockedRequests:[],pass:false};
report.runtimeDiagnostic.labelTarget={dx:targetDx,dy:targetDy,wrapperSha256:targetDx||targetDy?sha(installLabelTargetShift.toString()):null,scope:'Temporary Clover labelTarget.x/y offset after projectAnchors; no application source edit or production acceptance.'};
if(prereg.lowerBodyLabel)report.runtimeDiagnostic.lowerBodyLabel={wrapperSha256:sha(installLowerBodyLabel.toString()),scope:'Mochi complete label below max(bodyBottom,feet)+6; original constrained layout; no application edit.'};
report.runtimeDiagnostic.statusFixture={name:statusFixture,wrapperSha256:statusFixture==='expanded'?sha(installExpandedStatusFixture.toString()):null,scope:'Expanded badge stress fixture only: commissioned cats shield80, four statuses and a five-digit counter. This synthetic state is not a legal-action or natural gameplay claim.'};
report.captureKind='idle-status';report.actions=[];report.rows=[];report.plannedPixelCases=plannedCases;report.preregistration={path:preregPath,sha256:sha(await readFile(preregPath))};
report.runtimeDiagnostic.hudMeterSettlement={...prereg.hudMeterSettlement,fileSha256:sha(await readFile(resolve(root,'tools/v5vfx/hud-meter-observation.mjs')))};
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const stop=()=>{for(const name of ['STOP-ALL','STOP-CXV'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),'STOP '+name);};
let browser,activePage;
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
 for(const condition of plannedCases){
  stop();const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'));report.errors.push(...errors);report.blockedRequests.push(...blockedRequests);
  activePage=page;const reduced=condition.mode==='reduced';
  if(targetDx||targetDy)await page.evaluate(installLabelTargetShift,{dx:targetDx,dy:targetDy});
  if(prereg.lowerBodyLabel)await page.evaluate(installLowerBodyLabel);
  await page.evaluate(reduced=>{const m=window.__depthReview,s=window.__depthScene;cancelAnimationFrame(s.raf);m.state.settings.reducedMotion=false;m.paused=true;m.notify(false);},reduced);
  if(statusFixture==='expanded'){
   await page.evaluate(installExpandedStatusFixture);
   await page.waitForFunction(()=>['mochi','clover'].every(cat=>document.querySelector(`.b3-world[data-actor="${cat}"]`)?.textContent.includes('12345')));
  }
  await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
  await page.evaluate(()=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:30,paused:true},0);});
  const phaseOffsets=await page.evaluate(()=>Object.fromEntries(['mochi','clover'].map(cat=>[cat,[...window.__depthScene.actors.values()].find(e=>e.asset===cat).actor.designerMedia.media.state.desired])));
  await page.evaluate(()=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:31.25,paused:true},0);});
  await waitForDecodedMediaFrame(page);
  const primer=await page.evaluate(sample);
  const fixedTime=40+(condition.frame+.25)/30-phaseOffsets.clover;
  await page.evaluate(reduced=>{const m=window.__depthReview;m.state.settings.reducedMotion=reduced;m.notify(false);},reduced);
  await page.waitForFunction(reduced=>window.__depthScene.view().reducedMotion===reduced,reduced);
  await page.evaluate(fixedTime=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime,paused:true},0);},fixedTime);
  const expectedFrames=await page.evaluate(reduced=>Object.fromEntries(['mochi','clover'].map(cat=>{const media=[...window.__depthScene.actors.values()].find(e=>e.asset===cat).actor.designerMedia.media.state;return[cat,reduced?0:Math.floor(media.desired*30+1e-6)];})),reduced);
  assert.equal(expectedFrames.clover,condition.frame);
  await page.waitForFunction(expected=>Object.entries(expected).every(([cat,frame])=>{const m=[...window.__depthScene.actors.values()].find(e=>e.asset===cat).actor.designerMedia.media.state,d=window.__cxvMediaAudits[cat].decoded.at(-1);return m.ready&&!m.seeking&&!m.failure&&d&&Math.abs(m.currentTime-m.desired)<=1/60&&Math.abs(d.mediaTime-frame/30)<1e-5;}),expectedFrames,{timeout:10000});
  await page.evaluate(fixedTime=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime,paused:true},0);},fixedTime);
  await waitForDecodedMediaFrame(page,{reduced,displayedFrame:true});
  const settle=await page.evaluate(async()=>{const a=document.getAnimations().filter(a=>a.effect?.target?.closest('.b3-world')&&Number.isFinite(a.effect.getComputedTiming().endTime));const before=a.map(a=>({playState:a.playState,currentTime:a.currentTime,timing:a.effect.getComputedTiming()}));await Promise.all(a.map(a=>a.finished));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));return before;});
  await page.waitForFunction(()=>document.querySelector('.b3-total')?.hidden!==false,{},{timeout:2500});
  const hudPortraitPause=await page.evaluate(async()=>{
   const a=document.getAnimations().filter(a=>a.effect?.target?.closest('.b3-bottom')&&a.effect.target.matches('.b3-portrait,.b3-portrait-shine')&&!Number.isFinite(a.effect.getComputedTiming().endTime));
   const records=a.map(a=>({target:a.effect.target.className,observedTime:a.currentTime}));
   for(const x of a){if(!Number.isFinite(x.currentTime))throw Error('Unresolved HUD animation');x.pause();}
   await Promise.all(a.map(x=>x.ready));return a.map((a,i)=>({...records[i],pausedTime:a.currentTime,playState:a.playState}));
  });
  const hudMeterSettlement=await page.evaluate(settleHudMeters,prereg.hudMeterSettlement);
  const precondition=[];
  for(const variant of ['initial','hidden','restored']){const path=resolve(out,condition.mode+'-'+condition.frame+'-precondition-'+variant+'.png');await page.screenshot({path,scale:'css',...(variant==='hidden'?{style:hiddenStyle}:{})});precondition.push({variant,path,sha256:sha(await readFile(path)),utc:new Date().toISOString()});}
  const before=await page.evaluate(sample),entry={...condition,fixedTime,phaseOffsets,primer,expectedFrames,settle,hudPortraitPause,hudMeterSettlement,precondition,before,errors,blockedRequests,captures:[]};report.cases.push(entry);await save();
  assert(before.paused&&!before.plan);assert.equal(before.url,judgeUrl);
  for(const [cat,m] of Object.entries(before.media)){assert(m.state.ready&&!m.state.failure&&!m.state.disposed);assert(m.planeVisible&&m.rootVisible);assert(Math.abs(m.decoded.mediaTime-expectedFrames[cat]/30)<1e-5);}
  await page.evaluate(installIsolation);
  const folder=resolve(out,condition.mode+'-'+condition.frame);await mkdir(folder,{recursive:true});
  for(const variant of ['baseline','baseline-repeat','labels-hidden','labels-hidden-repeat','without-mochi','without-clover','without-panko','without-mallow','restored']){
   const hidden=variant.startsWith('without-')?variant.slice(8):null,hideLabels=variant.startsWith('labels-hidden')||hidden!==null;
   await page.evaluate(({fixedTime,hidden})=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);window.__cxvLabelIsolation.hidden=hidden;s.render({...s.view(),fixedTime,paused:true},0);},{fixedTime,hidden});
   const path=resolve(folder,variant+'.png'),utc=new Date().toISOString(),beforeShot=await page.evaluate(sample);
   await page.screenshot({path,scale:'css',...(hideLabels?{style:hiddenStyle}:{})});
   const afterShot=await page.evaluate(sample),bytes=await readFile(path);entry.captures.push({variant,path,sha256:sha(bytes),utc,before:beforeShot,after:afterShot});await save();
   assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);
   for(const state of [beforeShot,afterShot]){
    assert.equal(state.battle,before.battle);assert.deepEqual(state.labels,before.labels);assert.equal(state.renderTime,fixedTime);
    for(const cat of ['mochi','clover']){assert.equal(state.media[cat].state.currentTime,before.media[cat].state.currentTime);assert.equal(state.media[cat].decoded.mediaTime,before.media[cat].decoded.mediaTime);assert(state.media[cat].planeVisible);}
   }
  }
  await page.evaluate(()=>{const s=window.__depthScene;s.postFx.render=window.__cxvLabelIsolation.original;delete window.__cxvLabelIsolation;if(window.__cxvLabelTargetShift){s.projectAnchors=window.__cxvLabelTargetShift.original;delete window.__cxvLabelTargetShift;}});
  assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);await page.close();await save();
 }
 assert.equal(runtimeEvidence().indexSha256,build.indexSha256);report.pass=true;
}catch(error){report.failure=error.stack;if(activePage&&!activePage.isClosed())report.failureSample=await activePage.evaluate(sample).catch(e=>({error:String(e)}));process.exitCode=1;}
finally{if(browser)await browser.close();report.finishedUTC=new Date().toISOString();await save();console.log(JSON.stringify({out,pass:report.pass,cases:report.cases.length,captures:report.cases.reduce((n,c)=>n+c.captures.length,0),failure:report.failure}));}
