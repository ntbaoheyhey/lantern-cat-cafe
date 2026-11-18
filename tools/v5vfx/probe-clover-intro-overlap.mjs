/** Observe the real wave-intro lifecycle without editing production rendering. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './media-production-fixture.mjs';
import {loadRules} from '/Users/bao/taskbar-hero-chain/tools/cardrpg-big/a4-load.mjs';

const root=resolve(import.meta.dirname,'../..'),sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(process.env.CXV_MEDIA_CAT,'clover');
const buildPath=process.env.CXV_MEDIA_BUILD,build=JSON.parse(await readFile(buildPath));
const out=resolve(process.env.CXV_CAPTURE_OUT??'');assert(out.startsWith(resolve(root,'work/v5/CXV')+'/')&&!existsSync(out));
await mkdir(out,{recursive:true});
const sourceRoot='/Users/bao/taskbar-hero-chain';
const files=['apps/web/src/game/cardrpg/battle-v3/BattleHud.tsx','apps/web/src/game/cardrpg/battle-v3/hud-details.css',
 'apps/web/src/game/cardrpg/battle-v3/boss-phase.ts','apps/web/src/game/cardrpg/spine/scene.ts'];
const sourceFiles=[];for(const name of files){const path=resolve(sourceRoot,name);sourceFiles.push({path,sha256:sha(await readFile(path))});}
const note='/Users/bao/taskbar-hero-mailbox/LEARN/CXV-wave-intro-observation-v8-20261118.md';
const report={utc:new Date().toISOString(),url:judgeUrl,viewport:[1280,720],sourceCommit:build.sourceCommit,indexSha256:build.indexSha256,
 build:{path:buildPath,sha256:sha(await readFile(buildPath))},runtimePatch:build.registryOverride,runtimeSourceSubstitutions:[],sourceFiles,
 harnessSha256:sha(await readFile(import.meta.filename)),notebook:{path:note,sha256:sha(await readFile(note))},rows:[],captures:[],cases:[],errors:[],blockedRequests:[],pass:false};
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const modules=await loadRules(),R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');
let browser;
function fixture(reduced){
 const roster=['clover','panko','mallow','sorrel'],state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),true)),template=state.account.cards[0];
 state.account.cards=roster.map(cardId=>({...template,id:cardId,cardId,level:6}));state.team=roster;state.tutorial=4;
 state.rows=Object.fromEntries(roster.map((x,i)=>[x,i<2?'front':'rear']));state.skills=Object.fromEntries(roster.map(x=>[x,R.CAT_BY_ID[x].skills.map(z=>z.id)]));
 Object.assign(state.settings,{speed:1,quality:'high',reducedMotion:reduced});
 const battle=R.createBattle({seed:71,chapter:1,cats:R.battleCats(state),enemies:['yarn-giant','binding-thread','binding-thread'],gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true});
 for(const actor of battle.actors)actor.hp=Math.round(actor.maxHp*.65);
 battle.v4.committed=true;return{state,battle};
}
try{
 assert.equal(runtimeEvidence().indexSha256,build.indexSha256);
 assert.equal(sha(Buffer.from(await(await fetch(judgeUrl)).arrayBuffer())),build.indexSha256);
 browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
 for(const mode of [{name:'normal',reduced:false,os:'no-preference',live:false},{name:'game-reduced',reduced:true,os:'no-preference',live:false},
  {name:'os-game-reduced',reduced:true,os:'reduce',live:false},{name:'live-normal',reduced:false,os:'no-preference',live:true},{name:'live-reduced',reduced:true,os:'no-preference',live:true}]){
  for(const name of ['STOP-ALL','STOP-CXV'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name));
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(x=>x.id==='boss'),{setupPage:p=>p.emulateMedia({reducedMotion:mode.os})});
  await page.waitForFunction(()=>!document.querySelector('.b3-wave-intro'),null,{timeout:10000});
  const f=fixture(mode.reduced);
  const before=await page.evaluate(({state,battle,live})=>{
   const m=window.__depthReview,s=window.__depthScene;cancelAnimationFrame(s.raf);m.state=state;
   Object.assign(m,{tutorialBattle:battle,galleryBattle:null,replay:null,plan:null,roundPlan:null,watching:true,paused:!live,sceneStarted:true,screen:'map',beforeImpact:null,afterImpact:null,animationAt:0});
   window.__cxvIntroStart=performance.now();m.notify(false);return JSON.stringify(m.battle);
  },{...f,live:mode.live});
  await page.waitForFunction(()=>window.__depthScene.view().actors.every(a=>a.hp===window.__depthReview.visualBattle.actors.find(b=>b.id===a.id)?.hp));
  await page.evaluate(live=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);if(live)s.raf=requestAnimationFrame(s.loop);else s.render({...s.view(),fixedTime:30,paused:true},0);},mode.live);
  for(const target of [0,60,180,250,500,850,1050,1200]){
   await page.waitForFunction(ms=>performance.now()-window.__cxvIntroStart>=ms,target);
   const row=await page.evaluate(({mode,target})=>{
    const s=window.__depthScene,entry=[...s.actors].find(([,e])=>e.asset==='clover'),anchor=s.anchors.find(x=>x.id===entry[0]);
    const host=s.renderer.domElement.getBoundingClientRect(),intro=document.querySelector('.b3-wave-intro'),style=intro?getComputedStyle(intro):null;
    const r=intro?.getBoundingClientRect(),rect=r?{x:r.x-host.x,y:r.y-host.y,width:r.width,height:r.height}:null;
    const overlap=(a,b)=>a&&b?Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)):0;
    const spout=s.socket(entry[0],'vfxOrigin'),inside=rect&&spout.x>=rect.x&&spout.x<=rect.x+rect.width&&spout.y>=rect.y&&spout.y<=rect.y+rect.height;
    return{mode:mode.name,reduced:mode.reduced,os:mode.os,live:mode.live,target,wallMs:performance.now()-window.__cxvIntroStart,sceneTime:s.time,renderTime:s.renderTime,
     intro:rect?{rect,text:intro.textContent,opacity:style.opacity,animationName:style.animationName,transform:style.transform,translate:style.translate,scale:style.scale,
      timings:intro.getAnimations().map(a=>({currentTime:a.currentTime,playState:a.playState,timing:a.effect?.getComputedTiming()}))}:null,
     body:anchor.body,face:anchor.face,spout,bodyOverlapArea:overlap(rect,anchor.body),faceOverlapArea:overlap(rect,anchor.face),spoutInside:!!inside,
     bossPhase:{...s.bossPhase.audit},cinematic:{...s.cinematic},media:{...entry[1].actor.designerMedia.media.state},paused:window.__depthReview.paused,plan:window.__depthReview.plan};
   },{mode,target});
   report.rows.push(row);await save();
   assert(row.media.ready&&!row.media.failure&&!row.media.disposed);assert.equal(row.paused,!mode.live);if(!mode.live)assert(!row.plan);
   if(!mode.live&&(target===250||target===1200)){
    const path=resolve(out,mode.name+'-'+target+'.png');await page.screenshot({path});const bytes=await readFile(path);
    assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);
    report.captures.push({path,sha256:sha(bytes),mode:mode.name,target,row:report.rows.length-1,utc:new Date().toISOString()});await save();
   }
  }
  const after=await page.evaluate(()=>JSON.stringify(window.__depthReview.battle));
  const actual=JSON.parse(after),control=structuredClone(f.battle);let legalActions=0;
  while(control.log.length<actual.log.length&&legalActions<20){
   const actor=R.currentActor(control);assert(actor);
   assert(actor.side==='enemy'?R.enemyAct(control):R.act(control,R.chooseAction(control,'auto')));legalActions++;
  }
  assert.deepEqual(control.log,actual.log);assert.deepEqual(control.actors,actual.actors);assert.deepEqual(control.queue,actual.queue);assert.equal(control.round,actual.round);
  if(!mode.live){assert.equal(after,before);assert.equal(legalActions,0);}else assert(legalActions>0,'Ordinary opening must retain automatic legal action flow');
  const caseRows=report.rows.filter(r=>r.mode===mode.name),sceneAdvance=caseRows.at(-1).sceneTime-caseRows[0].sceneTime;
  if(mode.live)assert(sceneAdvance>0,'Ordinary unpaused scene clock must advance');
  report.cases.push({...mode,beforeHash:sha(before),afterHash:sha(after),unchanged:before===after,rulesReplayPass:true,legalActions,sceneAdvance});
  report.errors.push(...errors);report.blockedRequests.push(...blockedRequests);assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);await page.close();
 }
 assert.equal(report.rows.length,40);assert.equal(report.captures.length,6);
 for(const f of sourceFiles)assert.equal(sha(await readFile(f.path)),f.sha256);
 assert.equal(runtimeEvidence().indexSha256,build.indexSha256);report.pass=true;
 report.limits='Observational timing/DOM attribution on current candidate. Three paused fixtures plus two ordinary unpaused1x openings with actual automatic legal actions independently replayed;not a complete battle or laptop performance. Geometric overlap is conservative;alpha/text coverage is judged separately. No source substitutions,UI hiding or animation retiming. Original R1 failed a mistaken no-action assumption and is preserved separately.';
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{if(browser)await browser.close();await modules.vite.close();report.finishedUTC=new Date().toISOString();await save();console.log(JSON.stringify({out,pass:report.pass,rows:report.rows.length,captures:report.captures.length,failure:report.failure}));}
