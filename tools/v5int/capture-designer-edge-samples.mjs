/** Four preregistered, previously unseen idle poses from the unchanged served R7. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chromium, config, openFixture, runtimeEvidence, judgeUrl } from './production-fixture.mjs';
import { loadRules } from '../cardrpg-big/a4-load.mjs';
const root=resolve(import.meta.dirname,'../..'), sha=b=>createHash('sha256').update(b).digest('hex');
const preregPath=resolve(root,'reports/v5/CXI/evidence/v8-r7-edge-samples-r1-preregistration.json');
const preregBytes=await readFile(preregPath), prereg=JSON.parse(preregBytes);
const buildBytes=await readFile(prereg.build.path), build=JSON.parse(buildBytes);
assert.equal(sha(buildBytes),prereg.build.sha256);
execFileSync('git',['diff','--quiet',build.sourceCommit,'--','apps/web/src','apps/web/public','packages/game-rules'],{cwd:root});
assert.equal(runtimeEvidence().indexSha256,build.indexSha256);
const out=resolve(process.env.CXI_CAPTURE_OUT??'');
assert(out.startsWith(resolve(root,'work/v5/CXI')+'/')&&!existsSync(out));
await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),url:judgeUrl,viewport:[1280,720],sourceCommit:build.sourceCommit,indexSha256:build.indexSha256,
 preregistration:{path:preregPath,sha256:sha(preregBytes)},harnessSha256:sha(await readFile(import.meta.filename)),rows:[],captures:[],pass:false};
const modules=await loadRules(), R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');
let browser;
try{
 const roster=prereg.roster,state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),true)),template=state.account.cards[0];
 state.account.cards=roster.map(cardId=>({...template,id:cardId,cardId,level:6}));state.team=roster;state.tutorial=4;
 state.rows=Object.fromEntries(roster.map((x,i)=>[x,i<2?'front':'rear']));state.skills=Object.fromEntries(roster.map(x=>[x,R.CAT_BY_ID[x].skills.map(z=>z.id)]));
 Object.assign(state.settings,{speed:1,quality:'high',reducedMotion:false});
 const battle=R.createBattle({seed:71,chapter:1,cats:R.battleCats(state),enemies:['yarn-giant','binding-thread','binding-thread'],gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true});
 for(const actor of battle.actors)actor.hp=Math.round(actor.maxHp*.65);battle.v4.committed=true;
 browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(x=>x.id==='boss'));
 await page.evaluate(({state,battle})=>{const m=window.__depthReview,s=window.__depthScene;cancelAnimationFrame(s.raf);m.state=state;Object.assign(m,{tutorialBattle:battle,galleryBattle:null,replay:null,plan:null,roundPlan:null,watching:true,paused:true,sceneStarted:true,screen:'map',beforeImpact:null,afterImpact:null,animationAt:0});m.notify(false);},{state,battle});
 await page.waitForFunction(()=>{const s=window.__depthScene;return s.ready&&['mochi','clover'].every(cat=>{const a=[...s.actors.values()].find(e=>e.asset===cat)?.actor;return a?.source==='media'&&a.designerMedia.media.state.ready;});},null,{timeout:90000});
 await page.waitForFunction(()=>!document.querySelector('.b3-wave-intro'),null,{timeout:10000});
 const phase=await page.evaluate(()=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:30,paused:true,frame:null},0);window.__cxiEdgeDecoded={};for(const cat of ['mochi','clover']){const media=[...s.actors.values()].find(e=>e.asset===cat).actor.designerMedia.media;const cb=(at,m)=>{window.__cxiEdgeDecoded[cat]={at,mediaTime:m.mediaTime,presentedFrames:m.presentedFrames};media.video.requestVideoFrameCallback(cb);};media.video.requestVideoFrameCallback(cb);}return [...s.actors.values()].find(e=>e.asset==='clover').actor.designerMedia.media.state.desired;});
 for(const frame of prereg.cloverDecodedFrames){
  for(const name of ['STOP-ALL','STOP-CXI'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),'STOP '+name);
  const fixedTime=70+(frame+.25)/30-phase;
  await page.evaluate(t=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:t,paused:true,frame:null},0);},fixedTime);
  await page.waitForFunction(frame=>['mochi','clover'].every(cat=>{const a=[...window.__depthScene.actors.values()].find(e=>e.asset===cat).actor,media=a.designerMedia.media.state,d=window.__cxiEdgeDecoded[cat];return media.ready&&!media.seeking&&d&&(cat!=='clover'||Math.abs(d.mediaTime-frame/30)<1e-5);}),frame,{timeout:10000});
  await page.evaluate(async fixedTime=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime,paused:true,frame:null},0);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));},fixedTime);
  const row=await page.evaluate(({frame,fixedTime})=>{const s=window.__depthScene;const cats=['mochi','clover'].map(cat=>{const [id,e]=[...s.actors].find(([,e])=>e.asset===cat);return{cat,source:e.actor.source,decoded:window.__cxiEdgeDecoded[cat],media:{...e.actor.designerMedia.media.state},anchor:s.anchors.find(a=>a.id===id)};});const canvas=s.renderer.domElement.getBoundingClientRect();return{frame,fixedTime,cats,canvas:{x:canvas.x,y:canvas.y,width:canvas.width,height:canvas.height},url:location.href,introPresent:!!document.querySelector('.b3-wave-intro')};},{frame,fixedTime});
  assert.equal(row.url,judgeUrl);assert.equal(row.canvas.width,1280);assert.equal(row.canvas.height,720);assert(!row.introPresent);
  for(const cat of row.cats){assert.equal(cat.source,'media');assert(cat.media.ready&&!cat.media.seeking);assert(cat.anchor.body.height>220&&cat.anchor.body.height<240);}
  assert(Math.abs(row.cats.find(c=>c.cat==='clover').decoded.mediaTime-frame/30)<1e-5);
  const path=resolve(out,`clover-${frame}.png`);await page.screenshot({path});const bytes=await readFile(path);assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);
  report.rows.push(row);report.captures.push({frame,path,sha256:sha(bytes),utc:new Date().toISOString(),viewed:false});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);assert.equal(runtimeEvidence().indexSha256,build.indexSha256);report.errors=errors;report.blockedRequests=blockedRequests;report.pass=true;
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{if(browser)await browser.close();await modules.vite.close();report.finishedUTC=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({out,pass:report.pass,captures:report.captures.length,failure:report.failure}));}
