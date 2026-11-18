/** Verify the isolated enrollment with native Clover before any label source proposal. */
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium, config, openFixture, runtimeEvidence, judgeUrl} from './production-fixture.mjs';
import {loadRules} from '../cardrpg-big/a4-load.mjs';

const root=resolve(import.meta.dirname,'../..'),sha=data=>createHash('sha256').update(data).digest('hex');
const [buildArg,outArg]=process.argv.slice(2);assert(buildArg&&outArg);
const buildPath=resolve(buildArg),out=resolve(outArg),buildBytes=await readFile(buildPath),build=JSON.parse(buildBytes);
assert(out.startsWith(resolve(root,'work/v5/CXI')+'/')&&!existsSync(out));
assert.deepEqual(Object.keys(build.registryOverride),['mochi']);
assert.equal(process.env.CXI_BUILD_DESCRIPTOR,buildPath);
const stop=()=>{for(const name of ['STOP-ALL','STOP-CXI'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),name);};
stop();assert.equal(runtimeEvidence().indexSha256,build.indexSha256);
assert.equal(execFileSync('git',['diff',build.sourceCommit,'--','apps/web/src','packages/game-rules/src'],{cwd:root,encoding:'utf8'}),'');
await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),url:judgeUrl,viewport:[1280,720],sourceCommit:build.sourceCommit,
 indexSha256:build.indexSha256,build:{path:buildPath,sha256:sha(buildBytes)},harnessSha256:sha(await readFile(import.meta.filename)),
 roster:['mochi','clover','panko','mallow'],fixedTimes:[30,100/3,110/3,40-1/30],runs:[],captures:[],
 method:'Fresh seeded level6 boss pages with actual compiled application. Only existing Mochi media enrolled; Clover uses its shipped nonmedia actor. Fixed idle clocks are diagnostic. No label, source, response, shader or media substitutions.',
 limits:['Enrollment and identity gate only. No source proposal adopted.','Fresh complete-label painted clearance, idle/status/action association, art and ordinary-laptop performance remain separate.'],
 productionAcceptance:false,imagesViewed:0,pass:false};
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const modules=await loadRules(),R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
 for(const reduced of [false,true]){
  stop();
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(item=>item.id==='boss'));
  const state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),true)),template=state.account.cards[0];
  state.account.cards=report.roster.map(id=>({...template,id,cardId:id,level:6}));state.team=[...report.roster];state.tutorial=4;
  state.rows=Object.fromEntries(report.roster.map((id,i)=>[id,i<2?'front':'rear']));
  state.skills=Object.fromEntries(report.roster.map(id=>[id,R.CAT_BY_ID[id].skills.map(skill=>skill.id)]));
  Object.assign(state.settings,{speed:1,quality:'high',reducedMotion:reduced});
  const battle=R.createBattle({seed:71,chapter:1,cats:R.battleCats(state),enemies:['yarn-giant','binding-thread','binding-thread'],gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true});
  battle.v4.committed=true;
  await page.evaluate(({state,battle})=>{const m=window.__depthReview,s=window.__depthScene;cancelAnimationFrame(s.raf);m.state=state;Object.assign(m,{tutorialBattle:battle,galleryBattle:null,replay:null,plan:null,roundPlan:null,watching:true,paused:true,sceneStarted:true,screen:'map',beforeImpact:null,afterImpact:null,animationAt:0});m.notify(false);},{state,battle});
  await page.waitForFunction(roster=>{const s=window.__depthScene,m=window.__depthReview;return s.ready&&roster.every(id=>s.actors.get(id)?.actor)&&s.actors.get('mochi').actor.designerMedia?.media.state.ready&&s.view().actors.every(a=>a.hp===m.visualBattle.actors.find(b=>b.id===a.id)?.hp);},report.roster,{timeout:90000});
  const run={mode:reduced?'reduced':'normal',initialBattle:battle,rows:[],errors,blockedRequests};report.runs.push(run);
  for(const fixedTime of report.fixedTimes){
   stop();
   await page.evaluate(({fixedTime,reduced})=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime,paused:true,frame:null,reducedMotion:reduced},0);},{fixedTime,reduced});
   await page.waitForFunction(()=>{const v=window.__depthScene.actors.get('mochi').actor.designerMedia.media.state;return v.ready&&!v.seeking&&Math.abs(((v.currentTime-v.desired+15)%10)-5)<=1/60;},null,{timeout:10000});
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const row=await page.evaluate(({fixedTime,reduced})=>{
    const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);
    const actors=[...s.actors].map(([id,entry])=>({id,asset:entry.asset,source:entry.actor.source,
     hasMedia:!!entry.actor.designerMedia,hasMesh:!!entry.actor.mesh,hasSequence:!!entry.actor.sequence,
     media:entry.actor.designerMedia?{...entry.actor.designerMedia.media.state}:null,
     root:entry.actor.root.matrixWorld.toArray()}));
    return {fixedTime,reduced,url:location.href,actors,anchors:JSON.parse(JSON.stringify(s.anchors)),
     labels:[...document.querySelectorAll('.b3-world')].map(n=>({id:n.dataset.actor,text:n.textContent,rect:n.getBoundingClientRect().toJSON()})),
     actualBattle:m.visualBattle,requests:performance.getEntriesByType('resource').map(r=>r.name)};
   },{fixedTime,reduced});
   assert.equal(row.url,judgeUrl);assert.deepEqual(row.actors.filter(a=>a.hasMedia).map(a=>a.asset),['mochi']);
   for(const id of report.roster){const actor=row.actors.find(a=>a.asset===id);assert(actor);assert.equal(actor.source==='media',id==='mochi');}
   assert(!row.requests.some(url=>url.includes('/units/clover/designer-idle-')));
   assert(row.actors.find(a=>a.asset==='clover').source!=='puppet','Unexpected native Clover fallback');
   run.rows.push(row);
   if(fixedTime===report.fixedTimes[1]){
    const path=resolve(out,`idle-${run.mode}.png`);await page.screenshot({path});
    report.captures.push({path,sha256:sha(await readFile(path)),utc:new Date().toISOString(),mode:run.mode,fixedTime});
   }
  }
  assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);await page.close();await save();
 }
 report.servedPayloads=[];
 for(const item of build.files){const data=Buffer.from(await(await fetch(new URL(item.url,judgeUrl))).arrayBuffer());assert.equal(sha(data),item.sha256);report.servedPayloads.push({url:item.url,bytes:data.length,sha256:sha(data)});}
 assert.equal(runtimeEvidence().indexSha256,build.indexSha256);
 assert.equal(sha(await readFile(resolve(root,'apps/web/src/game/cardrpg/spine/designer-idle-registry.json'))),build.productionRegistrySha256);
 report.pass=true;
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{if(browser)await browser.close();await modules.vite.close();report.finishedUTC=new Date().toISOString();await save();console.log(JSON.stringify({out,pass:report.pass,runs:report.runs.length,rows:report.runs.reduce((n,r)=>n+r.rows.length,0),captures:report.captures.length,failure:report.failure}));}
