/** Real media and native squad; observational decoder telemetry, unchanged application source. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {loadRules} from '/Users/bao/taskbar-hero-chain/tools/cardrpg-big/a4-load.mjs';
import {waitForBattleReady} from '/Users/bao/taskbar-hero-chain/tools/v4ship-lab/rehearsal/battle-ready.mjs';
const root='/Users/bao/taskbar-hero-chain',req=createRequire(resolve(root,'apps/web/package.json'));
export const {chromium}=req('@playwright/test');
export const config=JSON.parse(readFileSync(resolve(root,'scripts/v3a2/fixtures.json')));
export const judgeUrl='http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3';
const buildPath=process.env.CXV_MEDIA_BUILD;assert(buildPath);const build=JSON.parse(readFileSync(buildPath));const source=build.sourceCommit,index=build.indexSha256;
const hash=data=>createHash('sha256').update(data).digest('hex');
const cat=process.env.CXV_MEDIA_CAT??'mochi';assert(['mochi','clover','both'].includes(cat));const mediaCats=cat==='both'?['mochi','clover']:[cat];const squads=[cat==='both'?['mochi','clover','panko','mallow']:[cat,'panko','mallow','sorrel']];
const group=0;assert(Number.isInteger(group)&&squads[group]);
assert.equal(execFileSync('git',['diff',source,'--','packages/game-rules/src'],{cwd:root,encoding:'utf8'}),'','Production rules must match source');
export function runtimeEvidence(){return{indexSha256:hash(readFileSync(resolve(root,'apps/web/dist/index.html'))),harnessSha256:hash(readFileSync(import.meta.filename)),servedSource:source,roster:squads[group],mediaCats,group,buildPath,buildSha256:hash(readFileSync(buildPath)),registryOverride:build.registryOverride};}
/** A completed seek can precede frame presentation. Require native callback evidence too. */
export async function waitForDecodedMediaFrame(page,{sourceFrame,reduced=false}={}){
 await page.waitForFunction(({mediaCats,sourceFrame,reduced})=>mediaCats.every(id=>{
  const media=[...window.__depthScene.actors.values()].find(e=>e.asset===id)?.actor?.designerMedia?.media.state,decoded=(window.__cxvMediaAudits?.[id]??window.__cxvMediaAudit)?.decoded.at(-1);
  if(!media?.ready||media.failure||media.disposed||media.seeking||!decoded)return false;
  const expected=reduced?0:sourceFrame!==undefined?sourceFrame/30:media.desired;
  return Math.abs(media.currentTime-media.desired)<=1/60&&Math.abs(decoded.mediaTime-expected)<=(reduced||sourceFrame!==undefined?1e-5:1/30+1e-6);
 }),{mediaCats,sourceFrame,reduced},{timeout:10000});
}
export async function openFixture(browser,fixture,{setupPage}={}){
 for(const name of ['STOP-ALL','STOP-CXV'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),'STOP: '+name);
 assert.equal(runtimeEvidence().indexSha256,index);
 assert.equal(hash(Buffer.from(await(await fetch(judgeUrl)).arrayBuffer())),index);
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 if(setupPage)await setupPage(page);
 const errors=[],blockedRequests=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400)errors.push(`HTTP ${r.status()} ${new URL(r.url()).pathname}`);});
 await page.route('**/*',route=>{
  const request=route.request(),target=new URL(request.url());
  if(target.pathname.startsWith('/src/')||target.pathname.startsWith('/@fs')){blockedRequests.push(target.pathname);return route.abort();}
  if(request.method()!=='POST')return route.continue();
  let body;try{body=request.postDataJSON();}catch{blockedRequests.push(target.pathname);return route.abort();}
  const calls=Array.isArray(body)?body:[body];
  if(target.href==='https://api.avax-test.network/ext/bc/C/rpc'&&calls.every(call=>/^eth_(chainId|blockNumber|getBalance|call|getCode|getTransactionCount|getBlockByNumber|getBlockByHash|getLogs|getTransactionReceipt)$|^net_version$/.test(call?.method)))return route.continue();
  blockedRequests.push(target.origin+target.pathname);return route.abort();
 });
 await page.addInitScript(()=>localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true})));
 await page.goto(judgeUrl+'&dev=1');await page.getByRole('button',{name:'Play free',exact:true}).click();await page.waitForFunction(()=>window.__depthReview);
 const modules=await loadRules(),R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');
 const state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(config.seed),true));state.tutorial=4;
 const template=state.account.cards[0];state.account.cards=squads[group].map(id=>({...template,id,cardId:id,level:6}));
 state.team=[...squads[group]];state.rows=Object.fromEntries(state.team.map((id,i)=>[id,i<2?'front':'rear']));state.skills=Object.fromEntries(state.team.map(id=>[id,R.CAT_BY_ID[id].skills.map(s=>s.id)]));
 Object.assign(state.settings,{speed:1,quality:'high',reducedMotion:false});
 const battle=R.createBattle({seed:config.seed,chapter:fixture.chapter,cats:R.battleCats(state),enemies:fixture.enemies,gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true});battle.v4.committed=true;
 assert.deepEqual(battle.actors.filter(a=>a.side==='party').map(a=>a.catalogId),squads[group]);
 await page.evaluate(({state,battle,url})=>{history.replaceState(null,'',url);const m=window.__depthReview;m.state=state;Object.assign(m,{tutorialBattle:battle,galleryBattle:null,replay:null,plan:null,roundPlan:null,watching:true,paused:true,sceneStarted:true,screen:'map'});m.notify(false);},{state,battle,url:judgeUrl});
 await modules.vite.close();await waitForBattleReady(page,90000);await page.evaluate(()=>document.fonts.ready);
 await page.waitForFunction(cats=>cats.every(id=>[...window.__depthScene.actors.values()].find(e=>e.asset===id)?.actor?.designerMedia?.media.state.ready),mediaCats,{timeout:90000});
 await page.evaluate(()=>cancelAnimationFrame(window.__depthScene.raf));assert.equal(page.url(),judgeUrl);
 const enrolled=await page.evaluate(roster=>[...window.__depthScene.actors.values()].filter(e=>roster.includes(e.asset)).map(e=>({asset:e.asset,source:e.actor?.source,native:e.actor?.mesh?.livingCat,drawn:!!e.craftPose?.drawing})),squads[group]);
 for(const id of squads[group])assert(enrolled.some(e=>e.asset===id&&(mediaCats.includes(id)?e.source==='media':id==='panko'?e.drawn:e.native===id)),'Profile missing '+id);
 await page.evaluate(mediaCats=>{
  const actors=mediaCats.map(id=>[...window.__depthScene.actors.values()].find(e=>e.asset===id).actor);
  if(new Set(actors.map(a=>a.designerMedia.media.video)).size!==mediaCats.length)throw Error('Commissioned cats must have distinct video elements');
  globalThis.__cxvMediaAudits={};
  for(const cat of mediaCats){
  const get=()=>[...window.__depthScene.actors.values()].find(e=>e.asset===cat)?.actor;
  const media=get().designerMedia.media,video=media.video;
  const data=globalThis.__cxvMediaAudits[cat]={cat,videoSrc:video.currentSrc||video.src,started:performance.now(),samples:[],decoded:[],events:[],initialQuality:video.getVideoPlaybackQuality?.()??null};
  if(cat===mediaCats[0])globalThis.__cxvMediaAudit=data;
  for(const name of ['seeking','seeked','stalled','waiting','playing','pause','error'])video.addEventListener(name,()=>data.events.push({event:name,at:performance.now(),currentTime:video.currentTime,fullAt:globalThis.__cxvFull?performance.now()-globalThis.__cxvFull.start:null}));
  let previous=-Infinity;
  const observe=now=>{
   if(now-previous>=100){previous=now;const a=get(),m=a?.designerMedia?.media,scene=window.__depthScene,model=window.__depthReview,fullAt=globalThis.__cxvFull?now-globalThis.__cxvFull.start:null;
    if(!m){data.samples.push({at:now,fullAt,missing:true,screen:model.screen});}
    else{
     const q=video.getVideoPlaybackQuality?.(),frame=scene.view().frame,id=[...scene.actors].find(([,e])=>e.asset===cat)?.[0],anchor=scene.anchors.find(x=>x.id===id),canvas=scene.renderer.domElement.getBoundingClientRect();
     const measure=node=>{if(!node||node.hidden)return null;const boxes=[node,...node.querySelectorAll('*')].map(n=>n.getBoundingClientRect()).filter(r=>r.width&&r.height);if(!boxes.length)return null;const x=Math.min(...boxes.map(r=>r.left)),y=Math.min(...boxes.map(r=>r.top));return{x:x-canvas.x,y:y-canvas.y,width:Math.max(...boxes.map(r=>r.right))-x,height:Math.max(...boxes.map(r=>r.bottom))-y};};
     const plate=document.querySelector(`.b3-world[data-actor="${id}"]`),label=measure(plate),overlap=(a,b)=>a&&b?Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)):0;
     const live=scene.view().actors.find(x=>x.id===id),point=scene.socket(id,cat==='clover'?'vfxOrigin':'mainHand');
     data.samples.push({at:now,fullAt,source:a.source,state:{...m.state},sameMedia:m===media,sameVideo:m.video===video,videoTextureActive:m.material.map===m.videoTexture,quality:q?{totalVideoFrames:q.totalVideoFrames,droppedVideoFrames:q.droppedVideoFrames,corruptedVideoFrames:q.corruptedVideoFrames}:null,screen:model.screen,age:model.animationAt,plan:model.plan?.skillId??null,cinematic:{...scene.cinematic},bossPhase:{...scene.bossPhase.audit},phaseFrame:frame?{actorId:frame.plan.actorId,skillId:frame.plan.skillId,elapsed:frame.elapsed}:null,
      hp:label?{label,actorId:id,value:live?.hp,alive:live?.hp>0,visible:anchor?.visible,body:anchor?.body,face:anchor?.face,bodyOverlapArea:overlap(label,anchor?.body),faceOverlapArea:overlap(label,anchor?.face),allBodyOverlapArea:scene.anchors.filter(x=>x.visible).reduce((n,x)=>n+overlap(label,x.body),0),otherLabelOverlapArea:[...document.querySelectorAll('.b3-world')].filter(n=>n!==plate).reduce((sum,n)=>sum+overlap(label,measure(n)),0),propInside:!!point&&point.x>=label.x&&point.x<=label.x+label.width&&point.y>=label.y&&point.y<=label.y+label.height}:null});
    }
   }
   requestAnimationFrame(observe);
  };requestAnimationFrame(observe);
  if(video.requestVideoFrameCallback){const decoded=(now,info)=>{data.decoded.push({at:now,fullAt:globalThis.__cxvFull?now-globalThis.__cxvFull.start:null,mediaTime:info.mediaTime,presentedFrames:info.presentedFrames,processingDuration:info.processingDuration,expectedDisplayTime:info.expectedDisplayTime});video.requestVideoFrameCallback(decoded);};video.requestVideoFrameCallback(decoded);}
  }
 },mediaCats);
 return{page,errors,blockedRequests};
}
