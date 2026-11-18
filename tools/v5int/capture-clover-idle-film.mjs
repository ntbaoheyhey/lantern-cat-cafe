/** Fresh 300-frame production sampling for a 1x source comparison, not an FPS test. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './production-fixture.mjs';
import {loadRules} from '../cardrpg-big/a4-load.mjs';
const root=resolve(import.meta.dirname,'../..'),sha=b=>createHash('sha256').update(b).digest('hex');
const buildPath=process.env.CXI_MEDIA_BUILD,build=JSON.parse(await readFile(buildPath));
const out=resolve(process.env.CXI_CAPTURE_OUT??'');
assert(out.startsWith(resolve(root,'work/v5/CXI')+'/')&&!existsSync(out));
await mkdir(resolve(out,'frames'),{recursive:true});
const report={utc:new Date().toISOString(),url:judgeUrl,viewport:[1280,720],sourceCommit:build.sourceCommit,indexSha256:build.indexSha256,
 build:{path:buildPath,sha256:sha(await readFile(buildPath))},harnessSha256:sha(await readFile(import.meta.filename)),
 method:'Fresh production native decoded frames at 30Hz source time; same displayed height for reference. Deterministic sampling, not wall-clock FPS.',rows:[],captures:[],pass:false};
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const modules=await loadRules(),R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');
let browser;
try{
 assert.equal(runtimeEvidence().indexSha256,build.indexSha256);
 const roster=['clover','panko','mallow','sorrel'],state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),true)),template=state.account.cards[0];
 state.account.cards=roster.map(cardId=>({...template,id:cardId,cardId,level:6}));state.team=roster;state.tutorial=4;
 state.rows=Object.fromEntries(roster.map((x,i)=>[x,i<2?'front':'rear']));state.skills=Object.fromEntries(roster.map(x=>[x,R.CAT_BY_ID[x].skills.map(z=>z.id)]));
 Object.assign(state.settings,{speed:1,quality:'high',reducedMotion:false});
 const battle=R.createBattle({seed:71,chapter:1,cats:R.battleCats(state),enemies:['yarn-giant','binding-thread','binding-thread'],gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true});
 for(const actor of battle.actors)actor.hp=Math.round(actor.maxHp*.65);battle.v4.committed=true;
 browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(x=>x.id==='boss'));
 await page.evaluate(({state,battle})=>{const m=window.__depthReview,s=window.__depthScene;cancelAnimationFrame(s.raf);m.state=state;Object.assign(m,{tutorialBattle:battle,galleryBattle:null,replay:null,plan:null,roundPlan:null,watching:true,paused:true,sceneStarted:true,screen:'map',beforeImpact:null,afterImpact:null,animationAt:0});m.notify(false);},{state,battle});
 await page.waitForFunction(()=>{const s=window.__depthScene,a=[...s.actors.values()].find(e=>e.asset==='clover')?.actor;return s.ready&&a?.source==='media'&&a.designerMedia.media.state.ready;},null,{timeout:90000});
 await page.waitForFunction(()=>!document.querySelector('.b3-wave-intro'),null,{timeout:10000});
 const phase=await page.evaluate(()=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:30,paused:true,frame:null},0);const media=[...s.actors.values()].find(e=>e.asset==='clover').actor.designerMedia.media;window.__cxiFilmDecoded=[];const callback=(at,m)=>{window.__cxiFilmDecoded.push({at,mediaTime:m.mediaTime,presentedFrames:m.presentedFrames});media.video.requestVideoFrameCallback(callback);};media.video.requestVideoFrameCallback(callback);return media.state.desired;});
 for(let frame=0;frame<300;frame++){
  for(const name of ['STOP-ALL','STOP-CXI'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),'STOP '+name);
  const fixedTime=50+(frame+.25)/30-phase;
  await page.evaluate(t=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:t,paused:true,frame:null},0);},fixedTime);
  await page.waitForFunction(frame=>{const media=[...window.__depthScene.actors.values()].find(e=>e.asset==='clover').actor.designerMedia.media.state,d=window.__cxiFilmDecoded.at(-1);return media.ready&&!media.seeking&&d&&Math.abs(d.mediaTime-frame/30)<1e-5;},frame,{timeout:10000});
  const row=await page.evaluate(({frame,fixedTime})=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime,paused:true,frame:null},0);const [id,e]=[...s.actors].find(([,e])=>e.asset==='clover'),body=s.anchors.find(x=>x.id===id).body,canvas=s.renderer.domElement.getBoundingClientRect();return{frame,fixedTime,decoded:window.__cxiFilmDecoded.at(-1),media:{...e.actor.designerMedia.media.state},body,canvas:{x:canvas.x,y:canvas.y,width:canvas.width,height:canvas.height},introPresent:!!document.querySelector('.b3-wave-intro'),source:e.actor.source,url:location.href};},{frame,fixedTime});
  assert.equal(row.source,'media');assert.equal(row.url,judgeUrl);assert(!row.introPresent);assert(Math.abs(row.decoded.mediaTime-frame/30)<1e-5);assert.equal(row.canvas.width,1280);
  const path=resolve(out,'frames',String(frame).padStart(3,'0')+'.png');await page.screenshot({path});const bytes=await readFile(path);assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);
  report.rows.push(row);report.captures.push({frame,path,sha256:sha(bytes),utc:new Date().toISOString(),viewed:false});if(frame%30===0)await save();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);assert.equal(runtimeEvidence().indexSha256,build.indexSha256);report.errors=errors;report.blockedRequests=blockedRequests;report.pass=true;
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{if(browser)await browser.close();await modules.vite.close();report.finishedUTC=new Date().toISOString();await save();console.log(JSON.stringify({out,pass:report.pass,frames:report.captures.length,failure:report.failure}));}
