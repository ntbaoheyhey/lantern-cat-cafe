/** Independent production density/lifecycle review at the exact desktop judge URL. */
import assert from 'node:assert/strict';
import {mkdirSync,existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './production-fixture.mjs';
import {loadRules} from '../cardrpg-big/a4-load.mjs';

const label=process.argv[2],mode=process.argv[3];
assert(/^[a-z0-9-]+$/.test(label??''));assert(['baseline','candidate'].includes(mode));
const out=resolve('work/v5/CXI/density',label);assert(!existsSync(out));mkdirSync(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const report={utc:new Date().toISOString(),mode,url:judgeUrl,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),probeSha256:hash(readFileSync(import.meta.filename)),viewport:{width:1280,height:720},
 method:'Native production responses. Paused authored boss fixture and rule-resolved victory, not ordinary gameplay timing. Original native RAF/render methods retained. CDP density1→2→1.5→1 at unchanged1280×720CSS; exact keyed actor/camera geometry; canvas/GL/composer sizes. Synthetic resolution events test reduced callbacks separately from trusted browser events. Same-session CSS screenshots verify unchanged DPR. No physical-display-event, FPS, or public transaction claim.',runs:[],captures:[],complete:false};
const save=()=>writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');save();
const settle=page=>page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
const setDpr=(cdp,ratio)=>cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:ratio,mobile:false});
const capture=async(page,cdp,name)=>{
 if(mode==='baseline')return;
 const dpr=await page.evaluate(()=>devicePixelRatio),png=resolve(out,name+'.png'),jpg=resolve(out,name+'-1024.jpg');
 const bytes=Buffer.from((await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,clip:{x:0,y:0,width:1280,height:720,scale:1/dpr}})).data,'base64');
 assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);assert.equal(await page.evaluate(()=>devicePixelRatio),dpr);
 writeFileSync(png,bytes);execFileSync('ffmpeg',['-v','error','-i',png,'-vf','scale=1024:576','-frames:v','1','-q:v','3',jpg]);
 const rgb=execFileSync('ffmpeg',['-v','error','-i',jpg,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:2*1024*1024});
 const mean=rgb.reduce((a,b)=>a+b,0)/rgb.length,std=Math.sqrt(rgb.reduce((a,b)=>a+(b-mean)**2,0)/rgb.length);assert(std>10);
 report.captures.push({name,path:jpg,rawPath:png,sha256:hash(readFileSync(jpg)),dimensions:[1024,576],utc:new Date().toISOString(),url:page.url(),dpr,mean,std,reviewed:false});save();
};
const battleState=page=>page.evaluate(()=>{
 const s=window.__depthScene,r=s.renderer,c=r.domElement,g=r.getContext(),rect=c.getBoundingClientRect().toJSON();
 return{dpr:devicePixelRatio,ratio:r.getPixelRatio(),size:{width:s.width,height:s.height},canvas:{width:c.width,height:c.height},gl:{width:g.drawingBufferWidth,height:g.drawingBufferHeight},contextLost:g.isContextLost(),
  composer:{input:{width:s.postFx.composer.inputBuffer.width,height:s.postFx.composer.inputBuffer.height},output:{width:s.postFx.composer.outputBuffer.width,height:s.postFx.composer.outputBuffer.height}},
  geometry:{rect,units:s.sizeAudit().units.sort((a,b)=>a.id.localeCompare(b.id)),projection:s.camera.projectionMatrix.elements,world:s.camera.matrixWorld.elements},ready:s.ready};
});
const outcomeState=page=>page.evaluate(()=>{
 const e=document.querySelector('.b3-victory-crew'),c=e.querySelector('canvas'),g=c.getContext('webgl2');
 return{dpr:devicePixelRatio,size:{width:e.clientWidth,height:e.clientHeight},canvas:{width:c.width,height:c.height},gl:{width:g.drawingBufferWidth,height:g.drawingBufferHeight},rect:e.getBoundingClientRect().toJSON(),ready:e.dataset.ready,contextLost:g.isContextLost(),draws:globalThis.__cxiOutcomeDraws,
  queries:globalThis.__cxiDensityQueries.map(q=>({media:q.media,matches:q.matches})),events:[...globalThis.__cxiDensityEvents]};
});
const stale=(state,cap)=>['width','height'].some(k=>state.canvas[k]!==Math.floor(state.size[k]*Math.min(state.dpr,cap)));
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const reduced of [false,true]){
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{setupPage:async p=>{
   await p.addInitScript(()=>{Math.random=()=>.5;const original=window.matchMedia;globalThis.__cxiDensityQueries=[];globalThis.__cxiDensityEvents=[];
    window.matchMedia=function(query){const media=original.call(this,query);if(query.startsWith('(resolution:')){globalThis.__cxiDensityQueries.push(media);media.addEventListener('change',event=>globalThis.__cxiDensityEvents.push({media:query,trusted:event.isTrusted,matches:media.matches}));}return media;};});
  }});
  const row={reduced,battle:[],victory:[],errors,blockedRequests};report.runs.push(row);save();
  const cdp=await page.context().newCDPSession(page);await setDpr(cdp,1);
  await page.evaluate(reduced=>{const s=window.__depthScene,view=s.view;for(const a of document.getAnimations())a.pause();s.phaseNoticeAt=-100;
   s.view=()=>({...view(),reducedMotion:reduced,fixedTime:20.3,paused:true,galleryPreview:true});s.render(s.view(),0);s.dirty=false;s.raf=requestAnimationFrame(s.loop);
  },reduced);await settle(page);
  const initial=await battleState(page);assert(initial.ready&&!initial.contextLost);row.battle.push({ratio:1,after:initial,stale:stale(initial,2)});
  for(const ratio of [2,1.5,1]){
   await setDpr(cdp,ratio);await page.waitForTimeout(150);await settle(page);const after=await battleState(page);
   assert.equal(after.dpr,ratio);assert.deepEqual(after.geometry,initial.geometry);assert.deepEqual(after.canvas,after.gl);
   if(mode==='candidate'){assert(!stale(after,2));assert.deepEqual(after.composer.input,after.canvas);assert.deepEqual(after.composer.output,after.canvas);}
   row.battle.push({ratio,after,stale:stale(after,2)});if(ratio!==1.5)await capture(page,cdp,'battle-'+(reduced?'reduced':'normal')+'-dpr'+ratio);
  }
  const modules=await loadRules();let battle;
  try{const R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');battle=await page.evaluate(()=>window.__depthReview.battle);R.playBattle(battle,'auto');assert(battle.result);}finally{await modules.vite.close();}
  await page.evaluate(({battle,reduced})=>{const m=window.__depthReview;m.state.settings.reducedMotion=reduced;m.tutorialBattle=battle;m.showResult();},{battle,reduced});
  await page.waitForSelector('.b3-victory-crew[data-ready=true]');await page.waitForTimeout(400);
  await page.evaluate(()=>{globalThis.__cxiOutcomeDraws=0;const c=document.querySelector('.b3-victory-crew>canvas'),g=c.getContext('webgl2');globalThis.__cxiOldOutcome=c;
   for(const name of ['drawElements','drawArrays']){const original=g[name];g[name]=function(...args){globalThis.__cxiOutcomeDraws++;return original.apply(this,args);};}
  });
  const initialOutcome=await outcomeState(page);row.victory.push({ratio:1,after:initialOutcome,stale:stale(initialOutcome,1.5)});
  for(const ratio of [2,1.5,1]){
   await setDpr(cdp,ratio);await page.waitForTimeout(150);const beforeEvent=await outcomeState(page);
   await page.evaluate(()=>{for(let i=0;i<3;i++)globalThis.__cxiDensityQueries.at(-1)?.dispatchEvent(new Event('change'));});await page.waitForTimeout(150);
   const after=await outcomeState(page);assert.equal(after.dpr,ratio);assert.deepEqual(after.rect,initialOutcome.rect);assert.deepEqual(after.canvas,after.gl);
   if(mode==='candidate')assert(!stale(after,1.5));
   row.victory.push({ratio,beforeEvent,after,stale:stale(after,1.5)});if(ratio!==1.5)await capture(page,cdp,'victory-'+(reduced?'reduced':'normal')+'-dpr'+ratio);
  }
  const idleStart=await outcomeState(page);await page.waitForTimeout(500);const idleEnd=await outcomeState(page);row.idleDraws=idleEnd.draws-idleStart.draws;
  if(mode==='candidate'&&reduced)assert.equal(row.idleDraws,0);
  await page.evaluate(()=>{const m=window.__depthReview;m.screen='map';m.notify(false);});await page.waitForFunction(()=>!globalThis.__cxiOldOutcome.isConnected);
  const beforeDispose=await page.evaluate(()=>globalThis.__cxiOutcomeDraws);await setDpr(cdp,2);
  await page.evaluate(()=>globalThis.__cxiDensityQueries.forEach(q=>q.dispatchEvent(new Event('change'))));await page.waitForTimeout(150);
  row.disposed=await page.evaluate(()=>({connected:globalThis.__cxiOldOutcome.isConnected,draws:globalThis.__cxiOutcomeDraws}));assert(!row.disposed.connected);assert.equal(row.disposed.draws,beforeDispose);
  assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);await page.close();save();
  console.log(JSON.stringify({reduced,battleStale:row.battle.filter(x=>x.stale).length,victoryStale:row.victory.filter(x=>x.stale).length,idleDraws:row.idleDraws,errors}));
 }
 report.complete=true;
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{await browser.close();report.ended=new Date().toISOString();save();console.log(JSON.stringify({out,complete:report.complete,failure:report.failure?.slice(0,500)}));}
