/** CXI fresh heldout visual captures of the frozen peer footer prototype. No source adoption. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl,waitForDecodedMediaFrame} from '/Users/bao/taskbar-hero-cardrpg-a6/tools/v5vfx/mochi-label-production-fixture.mjs';
import {sample} from '/Users/bao/taskbar-hero-cardrpg-a6/tools/v5vfx/mochi-label-observation.mjs';
import {installFooterIdentity,observeFooterIdentity} from '/Users/bao/taskbar-hero-cardrpg-a6/tools/v5vfx/footer-identity-prototype.mjs';
import {settleHudMeters} from '/Users/bao/taskbar-hero-cardrpg-a6/tools/v5vfx/hud-meter-observation.mjs';
import {loadRules} from '/Users/bao/taskbar-hero-chain/tools/cardrpg-big/a4-load.mjs';

const visualRoot='/Users/bao/taskbar-hero-cardrpg-a6',root=resolve(import.meta.dirname,'../..'),out=resolve(process.env.CXV_CAPTURE_OUT??''),sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(process.env.CXV_MEDIA_CAT,'mochi');assert(out.startsWith(resolve(root,'work/v5/CXI')+'/'));assert(!existsSync(resolve(out,'report.json')));
const buildPath=process.env.CXV_MEDIA_BUILD,build=JSON.parse(await readFile(buildPath));
const preregPath=resolve(process.env.CXV_ACTION_LABEL_PREREG??resolve(root,'reports/v5/CXV/M-footer-identity-pilot-R1-preregistration.json')),prereg=JSON.parse(await readFile(preregPath));
assert(prereg.hudPortraitPause?.enabled);
assert.equal(build.sourceCommit,prereg.sourceCommit);assert.equal(build.indexSha256,prereg.indexSha256);
const cats=['mochi','clover','panko','mallow'];
const plannedActions=prereg.cases.map(c=>({...c,probeMs:c.ms,arm:c.statusCase}));
const plannedPixelCases=plannedActions.map(x=>({...x,key:`${x.mode}-${x.cat}-${x.skill}-${x.ms}`}));
assert(Date.now()>=Date.parse(prereg.implementationNotBeforeUTC));
assert(process.env.CXV_CAPTURE_LEASE_UNTIL&&Date.now()<Date.parse(process.env.CXV_CAPTURE_LEASE_UNTIL));
const report={utc:new Date().toISOString(),url:judgeUrl,viewport:[1280,720],sourceCommit:build.sourceCommit,indexSha256:build.indexSha256,
 build:{path:buildPath,sha256:sha(await readFile(buildPath))},preregistration:{path:preregPath,sha256:sha(await readFile(preregPath))},
 harnessSha256:sha(await readFile(import.meta.filename)),helperSha256:sha(await readFile(resolve(visualRoot,'tools/v5vfx/mochi-label-observation.mjs'))),fixture:runtimeEvidence(),
 runtimeSourceSubstitutions:[],runtimeDiagnostic:{kind:'footer-identity-prototype',freshPagePerCase:true,prototypeSha256:sha(await readFile(resolve(visualRoot,'tools/v5vfx/footer-identity-prototype.mjs'))),redrawDuringReadback:false},
 plannedActions,plannedPixelCases,actions:[],rows:[],cases:[],errors:[],blockedRequests:[],pass:false};
if(prereg.hudMeterSettlement)report.runtimeDiagnostic.hudMeterSettlement={...prereg.hudMeterSettlement,observerSha256:sha(settleHudMeters.toString()),fileSha256:sha(await readFile(resolve(visualRoot,'tools/v5vfx/hud-meter-observation.mjs')))};
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const stop=()=>{assert(Date.now()<Date.parse(process.env.CXV_CAPTURE_LEASE_UNTIL),'Capture lease expired');for(const name of ['STOP-ALL','STOP-CXI'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),name);};
const modules=await loadRules(),R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');
let browser,activePage;

function fixture(mode,cat,skill,statusCase){
 const state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),true)),template=state.account.cards[0];
 state.account.cards=cats.map(id=>({...template,id,cardId:id,level:6}));state.team=[...cats];state.tutorial=4;
 state.rows=Object.fromEntries(cats.map((id,i)=>[id,i<2?'front':'rear']));state.skills=Object.fromEntries(cats.map(id=>[id,R.CAT_BY_ID[id].skills.map(s=>s.id)]));
 Object.assign(state.settings,{speed:1,quality:'high',reducedMotion:mode==='reduced'});
 const battle=R.createBattle({seed:71,chapter:3,cats:R.battleCats(state),enemies:['yarn-giant','binding-thread','binding-thread'],gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true});
 for(const actor of battle.actors)actor.hp=Math.round(actor.maxHp*.65);
 if(statusCase==='capacity'){const target=battle.actors.find(a=>a.catalogId==='mochi');target.shield=80;target.statuses=['scald','bitter','scent','brittle'].map(id=>({id,stacks:R.statusRuleV5(id,R.STATUS_BY_ID[id]).cap,remaining:2,source:target.id,appliedRound:battle.round}));}
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

function presentation(){
 const s=window.__depthScene,canvas=s.renderer.domElement;
 const properties=['display','visibility','opacity','transform','filter','backdropFilter','mixBlendMode','isolation','position','zIndex','overflow','background','border','boxShadow','textShadow','color','font','clipPath','maskImage'];
 const styled=(node,pseudo=null)=>{const css=getComputedStyle(node,pseudo);return{tag:node.tagName,id:node.id,class:node.getAttribute('class'),actor:node.getAttribute('data-actor'),pseudo,rect:node.getBoundingClientRect().toJSON(),style:Object.fromEntries(properties.map(k=>[k,css[k]]))};};
 const ancestors=[];for(let n=canvas;n;n=n.parentElement)ancestors.push(n);
 const siblings=[...new Set(ancestors.flatMap(n=>n.parentElement?[...n.parentElement.children].filter(x=>x!==n):[]))];
 return{fontStatus:document.fonts.status,renderer:{attributes:s.renderer.getContext().getContextAttributes(),outputColorSpace:s.renderer.outputColorSpace,toneMapping:s.renderer.toneMapping,pixelRatio:s.renderer.getPixelRatio(),bitmap:[canvas.width,canvas.height]},canvas:styled(canvas),ancestors:ancestors.flatMap(n=>[styled(n),styled(n,'::before'),styled(n,'::after')]),siblings:siblings.filter(n=>{const r=n.getBoundingClientRect(),c=getComputedStyle(n);return r.width&&r.height&&c.display!=='none'&&c.visibility!=='hidden';}).map(n=>styled(n)),footer:[...document.querySelectorAll('.b3-bottom,.b3-speed,.b3-party,.b3-portrait,.b3-bottom-actions')].map(n=>styled(n)),meters:[...document.querySelectorAll('.b3-hp,.b3-rage')].filter(n=>n.getBoundingClientRect().width>0).map(n=>({name:n.getAttribute('aria-label'),rect:n.getBoundingClientRect().toJSON(),children:[...n.children].map(c=>({class:c.className,rect:c.getBoundingClientRect().toJSON(),width:getComputedStyle(c).width,inlineWidth:c.style.width}))}))};
}

async function captureCase(page,condition,fixedTime){
 const folder=resolve(out,condition.key);await mkdir(folder,{recursive:false});
 await page.waitForFunction(()=>document.querySelector('.b3-total')?.hidden!==false,{},{timeout:2500});
 const hudPortraitPause=await page.evaluate(async()=>{
  const animations=document.getAnimations().filter(a=>a.effect?.target?.closest('.b3-bottom')&&a.effect.target.matches('.b3-portrait,.b3-portrait-shine')&&!Number.isFinite(a.effect.getComputedTiming().endTime));
  const records=animations.map(a=>({target:a.effect.target.className,observedTime:a.currentTime,duration:a.effect.getComputedTiming().duration}));
  for(const a of animations){if(!Number.isFinite(a.currentTime))throw Error('Unresolved HUD animation');a.pause();}
  await Promise.all(animations.map(a=>a.ready));
  return animations.map((a,i)=>{if(a.playState!=='paused')throw Error('HUD pause not settled');return{...records[i],pausedTime:a.currentTime,playState:a.playState};});
 });
 const hudMeterSettlement=await page.evaluate(settleHudMeters,prereg.hudMeterSettlement);
 const information=()=>[...document.querySelectorAll('.b3-world,.b3-cxv-identity')].map(n=>({class:n.className,actor:n.dataset.actor,visibility:getComputedStyle(n).visibility,hidden:n.hidden,meters:[...n.querySelectorAll('[role=progressbar]')].map(c=>({name:c.getAttribute('aria-label'),value:c.getAttribute('aria-valuenow'),max:c.getAttribute('aria-valuemax'),children:[...c.children].map(i=>({class:i.className,width:i.style.width}))})),badges:[...n.querySelectorAll('.b3-statuses>span')].map(c=>({label:c.getAttribute('aria-label'),title:c.getAttribute('title'),text:c.textContent,tabIndex:c.tabIndex})),noEffects:n.querySelector('.b3-cxv-no-effects')?.textContent??null}));
 const snapshot=async()=>({scene:await page.evaluate(sample),presentation:await page.evaluate(presentation),panels:await page.evaluate(observeFooterIdentity),information:await page.evaluate(information)});
 const before=await snapshot();assert(before.scene.paused&&(before.scene.plan?.skillId??null)===condition.expectedPlan);
 const entry={...condition,fixedTime,hudPortraitPause,hudMeterSettlement,before,phases:[]};report.cases.push(entry);await save();
 for(const phase of prereg.phases){
  stop();
  if(phase==='candidate'){await page.evaluate(installFooterIdentity);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.evaluate(settleHudMeters,prereg.hudMeterSettlement);}
  if(phase.startsWith('focus-')){
   const count=await page.locator('.b3-cxv-identity .b3-statuses [tabindex]').count();
   if(!count){entry.phases.push({phase,skipped:'No actual status controls in this case'});await save();continue;}
   const index=phase==='focus-first'?0:count-1;
   let focused=false;for(let i=0;i<64;i++){await page.keyboard.press('Tab');focused=await page.evaluate(index=>[...document.querySelectorAll('.b3-cxv-identity .b3-statuses [tabindex]')][index]===document.activeElement,index);if(focused)break;}
   assert(focused,'Keyboard cannot reach '+phase);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  }
  if(phase==='restored'){await page.evaluate(()=>window.__cxvFooterIdentity.dispose());await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
  const initial=await snapshot(),part={phase,before:initial,captures:[]};entry.phases.push(part);await save();
  for(const variant of prereg.sequence){
   stop();const beforeShot=await snapshot(),utc=new Date().toISOString(),path=resolve(folder,phase+'-'+variant+'.png');let bytes;
   if(variant.startsWith('screen')){bytes=await page.screenshot({path,scale:'css'});assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);}
   else{const uri=await page.evaluate(()=>window.__depthScene.renderer.domElement.toDataURL('image/png'));assert(uri.startsWith('data:image/png;base64,'));bytes=Buffer.from(uri.slice('data:image/png;base64,'.length),'base64');await writeFile(path,bytes);assert.deepEqual([bytes.readUInt32BE(16),bytes.readUInt32BE(20)],initial.presentation.renderer.bitmap);}
   const afterShot=await snapshot();part.captures.push({variant,path,sha256:sha(bytes),utc,dimensions:[bytes.readUInt32BE(16),bytes.readUInt32BE(20)],before:beforeShot,after:afterShot});await save();
  }
 }

}

try{
 stop();assert.equal(runtimeEvidence().indexSha256,build.indexSha256);
 browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
 for(const actionCase of plannedActions){
  stop();const {mode,cat,skill}=actionCase,reduced=mode==='reduced',f=fixture(mode,cat,skill,actionCase.statusCase);
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(x=>x.id==='boss'));activePage=page;
  await page.evaluate(({state,battle})=>{const m=window.__depthReview,s=window.__depthScene;cancelAnimationFrame(s.raf);m.state=state;Object.assign(m,{tutorialBattle:battle,galleryBattle:null,replay:null,plan:null,roundPlan:null,watching:true,paused:true,sceneStarted:true,screen:'map',beforeImpact:null,afterImpact:null,animationAt:0});m.notify(false);},f);
  await page.waitForFunction(()=>{const s=window.__depthScene,m=window.__depthReview;return s.ready&&['mochi'].every(id=>s.actors.get(id)?.actor?.designerMedia?.media.state.ready)&&s.view().actors.every(a=>a.hp===m.visualBattle.actors.find(b=>b.id===a.id)?.hp);});
  await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
  await renderDecoded(page,31.25,reduced);
  const initial=await page.evaluate(()=>structuredClone(window.__depthReview.battle));assert.deepEqual(initial,f.battle);
  const action=await page.evaluate(choice=>{const m=window.__depthReview;m.paused=false;if(!m.canAct)throw Error('Model cannot act');m.act(choice);m.paused=true;m.notify(false);return{battle:m.battle,plan:{skill:m.plan.skillId,duration:m.plan.duration,contact:m.plan.beats[2].start,events:m.plan.events}};},f.choice);
  assert.deepEqual(action.battle,f.expected);assert.equal(action.plan.contact,skill===4?1100:350);
  report.actions.push({...actionCase,choice:f.choice,initialBattle:f.battle,expectedBattle:f.expected,observedBattle:action.battle,plan:action.plan,rulesEqual:true});await save();
  let previous=0;
  const dense=prereg.geometryHz?Array.from({length:Math.floor(action.plan.duration*prereg.geometryHz/1000)+1},(_,i)=>Number((i*1000/prereg.geometryHz).toFixed(6))):[];
  const pixels=[actionCase.probeMs];
  const times=[...new Set([...dense,...pixels,0,175,250,350,600,1100,action.plan.duration-.0001,action.plan.duration].filter(t=>t<=action.plan.duration))].sort((a,b)=>a-b);
  for(const ms of times){
   await page.evaluate(({previous,ms})=>{const m=window.__depthReview;let at=previous,now=100000+previous;m.tick(0,now);m.paused=false;while(at<ms-1e-8){const delta=Math.min(16,ms-at);now+=delta;at+=delta;m.tick(delta,now);}m.paused=true;m.notify(false);},{previous,ms});previous=ms;
   const fixedTime=70+ms/1000;await renderDecoded(page,fixedTime,reduced);
   const observed=await page.evaluate(sample);report.rows.push({...actionCase,ms,fixedTime,snapshot:observed});
   if(ms===actionCase.probeMs){
    await page.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>a.effect?.target?.closest('.b3-world')&&Number.isFinite(a.effect.getComputedTiming().endTime)).map(a=>a.finished));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
    await captureCase(page,{...actionCase,ms,key:`${actionCase.arm}-${mode}-${cat}-${skill}-${ms}`,expectedPlan:ms>=action.plan.duration?null:cat+'-'+skill},fixedTime);
   }
  }
  report.errors.push(...errors);report.blockedRequests.push(...blockedRequests);assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);await page.close();await save();
 }
 assert.equal(report.actions.length,plannedActions.length);assert.equal(report.cases.length,plannedPixelCases.length);assert.equal(report.cases.length,2);report.pass=true;
}catch(error){report.failure=error.stack;if(activePage&&!activePage.isClosed())report.failureSample=await activePage.evaluate(sample).catch(e=>({error:String(e)}));process.exitCode=1;}
finally{if(browser)await browser.close();await modules.vite.close();report.finishedUTC=new Date().toISOString();await save();console.log(JSON.stringify({out,pass:report.pass,actions:report.actions.length,rows:report.rows.length,cases:report.cases.length,failure:report.failure}));}
