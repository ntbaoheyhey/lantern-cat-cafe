/** Fixed initial/sham/conceal controls. Method diagnostic, never placement acceptance. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl,waitForDecodedMediaFrame} from './media-production-fixture.mjs';
import {sample,installLabelTargetShift,installLowerBodyLabel} from './action-label-observation.mjs';
import {settleHudMeters} from './hud-meter-observation.mjs';
import {loadRules} from '/Users/bao/taskbar-hero-chain/tools/cardrpg-big/a4-load.mjs';

const root=resolve(import.meta.dirname,'../..'),out=resolve(process.env.CXV_CAPTURE_OUT??''),sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(process.env.CXV_MEDIA_CAT,'both');assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(!existsSync(resolve(out,'report.json')));
const buildPath=process.env.CXV_MEDIA_BUILD,build=JSON.parse(await readFile(buildPath));
const preregPath=resolve(process.env.CXV_ACTION_LABEL_PREREG??resolve(root,'reports/v5/CXV/M-label-controls-native-R1-preregistration.json')),prereg=JSON.parse(await readFile(preregPath));
assert(prereg.hudPortraitPause?.enabled);
assert.equal(build.sourceCommit,prereg.sourceCommit);assert.equal(build.indexSha256,prereg.indexSha256);
const targetShift={dx:prereg.candidate.cloverDx,dy:prereg.candidate.cloverDy};
assert(Number.isFinite(targetShift.dx)&&Number.isFinite(targetShift.dy));
const hiddenStyle='.b3-world { visibility: hidden !important; }';
const cats=['mochi','clover','panko','mallow'];
const plannedActions=prereg.fullActions.actions.map(key=>{const [mode,cat,skill]=key.split('-');return{mode,cat,skill:Number(skill)};});
const plannedPixelCases=plannedActions.flatMap(x=>(prereg.pixelTimes?.[`${x.cat}-${x.skill}`]??[x.skill===1?350:1100]).map(ms=>({...x,ms,key:`${x.mode}-${x.cat}-${x.skill}-${ms}`})));
const report={utc:new Date().toISOString(),url:judgeUrl,viewport:[1280,720],sourceCommit:build.sourceCommit,indexSha256:build.indexSha256,
 build:{path:buildPath,sha256:sha(await readFile(buildPath))},preregistration:{path:preregPath,sha256:sha(await readFile(preregPath))},
 harnessSha256:sha(await readFile(import.meta.filename)),helperSha256:sha(await readFile(resolve(root,'tools/v5vfx/action-label-observation.mjs'))),fixture:runtimeEvidence(),
 runtimeSourceSubstitutions:[],runtimeDiagnostic:{labelTarget:{...targetShift,wrapperSha256:sha(installLabelTargetShift.toString())},hiddenLabelCss:hiddenStyle,hiddenLabelCssSha256:sha(hiddenStyle)},
 plannedActions,plannedPixelCases,actions:[],rows:[],cases:[],errors:[],blockedRequests:[],pass:false};
if(prereg.lowerBodyLabel)report.runtimeDiagnostic.lowerBodyLabel={wrapperSha256:sha(installLowerBodyLabel.toString()),scope:'Mochi complete label top=max(bodyBottom,feet)+6; original constrained layout unchanged. Native body margins are measurement gates, not injected solver obstacles.'};
if(prereg.hudMeterSettlement)report.runtimeDiagnostic.hudMeterSettlement={...prereg.hudMeterSettlement,observerSha256:sha(settleHudMeters.toString()),fileSha256:sha(await readFile(resolve(root,'tools/v5vfx/hud-meter-observation.mjs')))};
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const stop=()=>{for(const name of ['STOP-ALL','STOP-CXV'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),name);};
const modules=await loadRules(),R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');
let browser,activePage;

function fixture(mode,cat,skill){
 const state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),true)),template=state.account.cards[0];
 state.account.cards=cats.map(id=>({...template,id,cardId:id,level:6}));state.team=[...cats];state.tutorial=4;
 state.rows=Object.fromEntries(cats.map((id,i)=>[id,i<2?'front':'rear']));state.skills=Object.fromEntries(cats.map(id=>[id,R.CAT_BY_ID[id].skills.map(s=>s.id)]));
 Object.assign(state.settings,{speed:1,quality:'high',reducedMotion:mode==='reduced'});
 const battle=R.createBattle({seed:71,chapter:3,cats:R.battleCats(state),enemies:['yarn-giant','binding-thread','binding-thread'],gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true});
 for(const actor of battle.actors)actor.hp=Math.round(actor.maxHp*.65);
 const caster=battle.actors.find(a=>a.catalogId===cat);caster.charge=100;caster.turns=3;battle.queue=[caster.id,...battle.queue.filter(x=>x!==caster.id)];battle.v4.committed=true;
 const choice=R.legalChoices(battle).find(x=>x.skillId===cat+'-'+skill);assert(choice);
 const expected=structuredClone(battle);assert(R.act(expected,choice));return{state,battle,choice,expected};
}

async function renderDecoded(page,fixedTime,reduced){
 await page.evaluate(fixedTime=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime,paused:true},0);},fixedTime);
 await waitForDecodedMediaFrame(page,{reduced,displayedFrame:!!prereg.displayedFrameGate});
 await page.evaluate(fixedTime=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime,paused:true},0);},fixedTime);
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
}

async function captureCase(page,condition,fixedTime){
 const folder=resolve(out,condition.key);await mkdir(folder,{recursive:false});
 const totalSnapshot=()=>{const n=document.querySelector('.b3-total');return{wallTime:performance.now(),hidden:n?.hidden??true,text:n?.textContent??null,rect:n?.getBoundingClientRect().toJSON()??null};};
 const totalBefore=await page.evaluate(totalSnapshot);
 await page.waitForFunction(()=>document.querySelector('.b3-total')?.hidden!==false,{},{timeout:2500});
 const totalAfter=await page.evaluate(totalSnapshot);
 const hudPortraitPause=await page.evaluate(async()=>{
  const animations=document.getAnimations().filter(a=>a.effect?.target?.closest('.b3-bottom')&&a.effect.target.matches('.b3-portrait,.b3-portrait-shine')&&!Number.isFinite(a.effect.getComputedTiming().endTime));
  const records=animations.map(a=>({target:a.effect.target.className,rect:a.effect.target.getBoundingClientRect().toJSON(),observedTime:a.currentTime,duration:a.effect.getComputedTiming().duration}));
  for(const a of animations){if(!Number.isFinite(a.currentTime))throw Error('Unresolved HUD animation');a.pause();}
  await Promise.all(animations.map(a=>a.ready));
  return animations.map((a,i)=>{if(a.playState!=='paused')throw Error('HUD pause not settled');return{...records[i],pausedTime:a.currentTime,playState:a.playState};});
 });
 const hudMeterSettlement=prereg.hudMeterSettlement?await page.evaluate(settleHudMeters,prereg.hudMeterSettlement):null;
 const before=await page.evaluate(sample);
 const expectedFrames=Object.fromEntries(['mochi','clover'].map(cat=>[cat,Math.round(before.media[cat].decoded.mediaTime*30)]));
 const entry={...condition,fixedTime,expectedFrames,totalLifecycle:{before:totalBefore,after:totalAfter},hudPortraitPause,hudMeterSettlement,before,captures:[]};
 report.cases.push(entry);await save();
 const meters=()=>({fontStatus:document.fonts.status,wallTime:performance.now(),meters:[...document.querySelectorAll('.b3-hp')].filter(n=>n.getBoundingClientRect().width>0).map(n=>({actor:n.closest('[data-actor]')?.dataset.actor??null,name:n.getAttribute('aria-label'),rect:n.getBoundingClientRect().toJSON(),trail:n.querySelector('.b3-trail')?.style.width,fill:n.querySelector('.b3-fill')?.style.width,children:[...n.children].map(c=>({class:c.className,rect:c.getBoundingClientRect().toJSON(),width:getComputedStyle(c).width}))}))});
 assert(before.paused&&(before.plan?.skillId??null)===condition.expectedPlan);
 for(const variant of prereg.conditioningStudy.shots){
  const beforeShot=await page.evaluate(sample),beforeMeters=await page.evaluate(meters);
  const path=resolve(folder,variant+'.png'),utc=new Date().toISOString();
  const style=variant.startsWith('hidden-')?hiddenStyle:variant==='sham-style'?'html {}':undefined;
  await page.screenshot({path,scale:'css',...(style?{style}:{})});
  const afterShot=await page.evaluate(sample),afterMeters=await page.evaluate(meters),bytes=await readFile(path);
  assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);
  entry.captures.push({variant,path,sha256:sha(bytes),utc,before:beforeShot,after:afterShot,beforeMeters,afterMeters});await save();
  for(const state of [beforeShot,afterShot]){assert.equal(state.battle,before.battle);assert.deepEqual(state.plan,before.plan);assert.equal(state.renderTime,fixedTime);}
 }
}

try{
 stop();assert.equal(runtimeEvidence().indexSha256,build.indexSha256);
 browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
 for(const actionCase of plannedActions){
  stop();const {mode,cat,skill}=actionCase,reduced=mode==='reduced',f=fixture(mode,cat,skill);
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(x=>x.id==='boss'));activePage=page;
  await page.evaluate(installLabelTargetShift,targetShift);
  if(prereg.lowerBodyLabel)await page.evaluate(installLowerBodyLabel);
  await page.evaluate(({state,battle})=>{const m=window.__depthReview,s=window.__depthScene;cancelAnimationFrame(s.raf);m.state=state;Object.assign(m,{tutorialBattle:battle,galleryBattle:null,replay:null,plan:null,roundPlan:null,watching:true,paused:true,sceneStarted:true,screen:'map',beforeImpact:null,afterImpact:null,animationAt:0});m.notify(false);},f);
  await page.waitForFunction(()=>{const s=window.__depthScene,m=window.__depthReview;return s.ready&&['mochi','clover'].every(id=>s.actors.get(id)?.actor?.designerMedia?.media.state.ready)&&s.view().actors.every(a=>a.hp===m.visualBattle.actors.find(b=>b.id===a.id)?.hp);});
  await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
  await renderDecoded(page,31.25,reduced);
  const initial=await page.evaluate(()=>structuredClone(window.__depthReview.battle));assert.deepEqual(initial,f.battle);
  const action=await page.evaluate(choice=>{const m=window.__depthReview;m.paused=false;if(!m.canAct)throw Error('Model cannot act');m.act(choice);m.paused=true;m.notify(false);return{battle:m.battle,plan:{skill:m.plan.skillId,duration:m.plan.duration,contact:m.plan.beats[2].start,events:m.plan.events}};},f.choice);
  assert.deepEqual(action.battle,f.expected);assert.equal(action.plan.contact,skill===4?1100:350);
  report.actions.push({...actionCase,choice:f.choice,initialBattle:f.battle,expectedBattle:f.expected,observedBattle:action.battle,plan:action.plan,rulesEqual:true});await save();
  let previous=0;
  const dense=prereg.geometryHz?Array.from({length:Math.floor(action.plan.duration*prereg.geometryHz/1000)+1},(_,i)=>Number((i*1000/prereg.geometryHz).toFixed(6))):[];
  const pixels=plannedPixelCases.filter(c=>c.mode===mode&&c.cat===cat&&c.skill===skill).map(c=>c.ms);
  const times=[...new Set([...dense,...pixels,0,175,250,350,600,1100,action.plan.duration-.0001,action.plan.duration].filter(t=>t<=action.plan.duration))].sort((a,b)=>a-b);
  for(const ms of times){
   await page.evaluate(({previous,ms})=>{const m=window.__depthReview;let at=previous,now=100000+previous;m.tick(0,now);m.paused=false;while(at<ms-1e-8){const delta=Math.min(16,ms-at);now+=delta;at+=delta;m.tick(delta,now);}m.paused=true;m.notify(false);},{previous,ms});previous=ms;
   const fixedTime=70+ms/1000;await renderDecoded(page,fixedTime,reduced);
   const observed=await page.evaluate(sample);report.rows.push({...actionCase,ms,fixedTime,snapshot:observed});
   if(plannedPixelCases.some(c=>c.mode===mode&&c.cat===cat&&c.skill===skill&&c.ms===ms)){
    await page.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>a.effect?.target?.closest('.b3-world')&&Number.isFinite(a.effect.getComputedTiming().endTime)).map(a=>a.finished));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
    await captureCase(page,{...actionCase,ms,key:`${mode}-${cat}-${skill}-${ms}`,expectedPlan:ms>=action.plan.duration?null:cat+'-'+skill},fixedTime);
   }
  }
  report.errors.push(...errors);report.blockedRequests.push(...blockedRequests);assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);await page.close();await save();
 }
 assert.equal(report.actions.length,plannedActions.length);assert.equal(report.cases.length,plannedPixelCases.length);assert.equal(report.cases.length,prereg.fullActions.cases);report.pass=true;
}catch(error){report.failure=error.stack;if(activePage&&!activePage.isClosed())report.failureSample=await activePage.evaluate(sample).catch(e=>({error:String(e)}));process.exitCode=1;}
finally{if(browser)await browser.close();await modules.vite.close();report.finishedUTC=new Date().toISOString();await save();console.log(JSON.stringify({out,pass:report.pass,actions:report.actions.length,rows:report.rows.length,cases:report.cases.length,failure:report.failure}));}
