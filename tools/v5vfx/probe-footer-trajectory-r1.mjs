/** Frozen fulltrajectory development check for the unchanged R2 presentation. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl,waitForDecodedMediaFrame} from './mochi-label-production-fixture.mjs';
import {sample} from './mochi-label-observation.mjs';
import {installFooterIdentity,observeFooterIdentity} from './footer-identity-stable-prototype.mjs';
import {settleHudMeters} from './hud-meter-observation.mjs';
import {loadRules} from '/Users/bao/taskbar-hero-chain/tools/cardrpg-big/a4-load.mjs';

const root=resolve(import.meta.dirname,'../..'),out=resolve(process.env.CXV_CAPTURE_OUT??''),sha=b=>createHash('sha256').update(b).digest('hex');
const preregPath=resolve(root,'reports/v5/CXV/M-footer-trajectory-R1-preregistration.json'),prereg=JSON.parse(await readFile(preregPath));
assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(!existsSync(resolve(out,'report.json')));
assert.equal(sha(await readFile(resolve(root,'tools/v5vfx/footer-identity-stable-prototype.mjs'))),prereg.prototypeSha256);
assert.equal(judgeUrl,prereg.url);assert.equal(runtimeEvidence().indexSha256,prereg.indexSha256);
const stop=()=>{assert(Date.now()<Date.parse(process.env.CXV_CAPTURE_LEASE_UNTIL),'Lease expired');for(const n of ['STOP-ALL','STOP-CXV'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+n),n);};
const report={utc:new Date().toISOString(),url:judgeUrl,viewport:prereg.viewport,sourceCommit:prereg.sourceCommit,indexSha256:prereg.indexSha256,preregistration:{path:preregPath,sha256:sha(await readFile(preregPath))},harnessSha256:sha(await readFile(import.meta.filename)),prototypeSha256:prereg.prototypeSha256,fixture:runtimeEvidence(),runs:[],errors:[],pass:false,imagesViewed:0,productionAcceptance:false};
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const modules=await loadRules(),R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');let browser;
function makeFixture({mode,cat,skill,statusCase}){
 const cats=['mochi','clover','panko','mallow'],state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),true)),template=state.account.cards[0];
 state.account.cards=cats.map(id=>({...template,id,cardId:id,level:6}));state.team=cats;state.tutorial=4;state.rows=Object.fromEntries(cats.map((id,i)=>[id,i<2?'front':'rear']));state.skills=Object.fromEntries(cats.map(id=>[id,R.CAT_BY_ID[id].skills.map(s=>s.id)]));Object.assign(state.settings,{speed:1,quality:'high',reducedMotion:mode==='reduced'});
 const battle=R.createBattle({seed:71,chapter:3,cats:R.battleCats(state),enemies:['yarn-giant','binding-thread','binding-thread'],gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true});
 for(const actor of battle.actors)actor.hp=Math.round(actor.maxHp*.65);
 const target=battle.actors.find(a=>a.catalogId==='mochi');target.shield=statusCase==='capacity'?80:0;target.statuses=statusCase==='capacity'?['scald','bitter','scent','brittle'].map(id=>({id,stacks:R.statusRuleV5(id,R.STATUS_BY_ID[id]).cap,remaining:2,source:target.id,appliedRound:battle.round})):[];
 const caster=battle.actors.find(a=>a.catalogId===cat);caster.charge=100;caster.turns=3;battle.queue=[caster.id,...battle.queue.filter(x=>x!==caster.id)];battle.v4.committed=true;
 const choice=R.legalChoices(battle).find(x=>x.skillId===cat+'-'+skill);assert(choice);const expected=structuredClone(battle);assert(R.act(expected,choice));return{state,battle,choice,expected};
}
async function render(page,time,reduced){
 const paint=t=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:t,paused:true},0);};
 await page.evaluate(paint,time);await waitForDecodedMediaFrame(page,{displayedFrame:true,reduced});await page.evaluate(paint,time);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
}
function information(){
 const active=document.activeElement,original=window.__cxvFocusOriginal;
 const nodes=[...document.querySelectorAll('.b3-world,.b3-cxv-identity')].map(n=>({actor:n.dataset.actor,class:n.className,visible:getComputedStyle(n).visibility,hidden:n.hidden,rect:n.getBoundingClientRect().toJSON(),meters:[...n.querySelectorAll('[role=progressbar]')].map(x=>({name:x.getAttribute('aria-label'),value:x.getAttribute('aria-valuenow'),max:x.getAttribute('aria-valuemax'),fills:[...x.children].map(c=>({class:c.className,width:c.style.width}))})),badges:[...n.querySelectorAll('.b3-statuses>span')].map(x=>({label:x.getAttribute('aria-label'),title:x.title,text:x.textContent,tabIndex:x.tabIndex,focus:x===active})),noEffects:n.querySelector('.b3-cxv-no-effects')?.textContent??null}));
 return{nodes,footer:document.querySelector('.b3-bottom').getBoundingClientRect().toJSON(),cinemaOccluded:document.body.classList.contains('b3-cinema-occludes'),focus:{tag:active?.tagName,class:active?.className,title:active?.getAttribute('title'),label:active?.getAttribute('aria-label'),originalConnected:original?.isConnected??null,sameNode:active===original},controls:[...document.querySelectorAll('.b3-speed,.b3-party,.b3-portrait,.b3-bottom-actions')].map(n=>({class:n.className,actor:n.dataset.actor,rect:n.getBoundingClientRect().toJSON()}))};
}
const snapshot=async page=>({scene:await page.evaluate(sample),information:await page.evaluate(information),panels:await page.evaluate(observeFooterIdentity)});
async function capture(page,run,phase){
 await page.evaluate(settleHudMeters,{timeoutMs:2500,stableFrames:3,inlinePercentTolerance:1e-6,widthToleranceCSSpx:.015625});
 const captures=[];for(const variant of ['screen0','canvas0','screen1','canvas1']){
  stop();const before=await snapshot(page),path=resolve(out,run.key,phase+'-'+variant+'.png'),utc=new Date().toISOString();let bytes;
  if(variant.startsWith('screen'))bytes=await page.screenshot({path,scale:'css'});else{const uri=await page.evaluate(()=>window.__depthScene.renderer.domElement.toDataURL('image/png'));bytes=Buffer.from(uri.split(',')[1],'base64');await writeFile(path,bytes);}
  captures.push({variant,path,sha256:sha(bytes),utc,dimensions:[bytes.readUInt32BE(16),bytes.readUInt32BE(20)],before,after:await snapshot(page)});
 }run.captures.push({phase,captures});await save();
}
try{
 stop();browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
 for(const condition of prereg.cases)for(const arm of prereg.arms){
  stop();const f=makeFixture(condition),run={...condition,arm,key:[condition.mode,condition.cat,condition.skill,condition.statusCase,arm].join('-'),rows:[],captures:[]};report.runs.push(run);await mkdir(resolve(out,run.key));
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(x=>x.id==='boss'));
  await page.evaluate(({state,battle})=>{const m=window.__depthReview,s=window.__depthScene;cancelAnimationFrame(s.raf);m.state=state;Object.assign(m,{tutorialBattle:battle,galleryBattle:null,replay:null,plan:null,roundPlan:null,watching:true,paused:true,sceneStarted:true,screen:'map',beforeImpact:null,afterImpact:null,animationAt:0});m.notify(false);},f);
  await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.view().actors.every(a=>a.hp===window.__depthReview.visualBattle.actors.find(b=>b.id===a.id)?.hp));await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});await render(page,31.25,condition.mode==='reduced');
  run.hudPause=await page.evaluate(async()=>{const as=document.getAnimations().filter(a=>a.effect?.target?.closest('.b3-bottom')&&a.effect.target.matches('.b3-portrait,.b3-portrait-shine')&&!Number.isFinite(a.effect.getComputedTiming().endTime));for(const a of as)a.pause();await Promise.all(as.map(a=>a.ready));return as.map(a=>({target:a.effect.target.className,time:a.currentTime,state:a.playState}));});
  if(arm==='prototype')await page.evaluate(installFooterIdentity);
  await page.evaluate(({scene,information,panels})=>{window.__cxvLifecycleReaders={scene:(0,eval)('('+scene+')'),information:(0,eval)('('+information+')'),panels:(0,eval)('('+panels+')')};},{scene:sample.toString(),information:information.toString(),panels:observeFooterIdentity.toString()});
  // Focus cases belong to the separate CXI heldout protocol; no keyboard intervention here.
  run.initial=await snapshot(page);await capture(page,run,'initial');
  const actual=await page.evaluate(choice=>{const m=window.__depthReview;m.paused=false;assertCanAct();m.act(choice);m.paused=true;m.notify(false);return{battle:m.battle,duration:m.plan.duration};function assertCanAct(){if(!m.canAct)throw Error('Cannot act');}},f.choice);assert.deepEqual(actual.battle,f.expected);run.action={choice:f.choice,initial:f.battle,expected:f.expected,actual:actual.battle,duration:actual.duration,rulesExact:true};
  const dense=Array.from({length:Math.floor(actual.duration*prereg.geometryHz/1000)+1},(_,i)=>Number((i*1000/prereg.geometryHz).toFixed(6)));
  const times=[...new Set([...dense,...prereg.boundaryMs,actual.duration-.0001,actual.duration].filter(x=>x>=0&&x<=actual.duration))].sort((a,b)=>a-b);run.plannedTimes=times;
  let previous=0;for(const ms of times){stop();
   await page.evaluate(({previous,ms})=>{const m=window.__depthReview;let at=previous,now=100000+previous;m.tick(0,now);m.paused=false;while(at<ms-1e-8){const d=Math.min(16,ms-at);at+=d;now+=d;m.tick(d,now);}m.paused=true;m.notify(false);},{previous,ms});previous=ms;await render(page,70+ms/1000,condition.mode==='reduced');
   const observed=await page.evaluate(arm=>{const readers=window.__cxvLifecycleReaders,read=()=>structuredClone({scene:readers.scene(),information:readers.information(),panels:readers.panels()});const before=read();if(arm==='prototype')window.__cxvFooterIdentity.sync();const after=read();return{before,after};},arm);run.rows.push({ms,...observed});
  }
  await capture(page,run,'final');run.errors=errors;run.blockedRequests=blockedRequests;assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);await page.close();await save();
 }
 assert.equal(report.runs.length,prereg.freshPages);report.pass=true;
}catch(e){report.failure=e.stack;process.exitCode=1;}finally{if(browser)await browser.close();await modules.vite.close();report.finishedUTC=new Date().toISOString();await save();console.log(JSON.stringify({out,pass:report.pass,runs:report.runs.length,failure:report.failure}));}
