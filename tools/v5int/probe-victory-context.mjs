/** Independent native loss/restore review; production fixture, never ordinary-play timing. */
import assert from 'node:assert/strict';
import {mkdirSync,existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './production-fixture.mjs';
import {loadRules} from '../cardrpg-big/a4-load.mjs';

const label=process.argv[2],mode=process.argv[3];
assert(/^[a-z0-9-]+$/.test(label??''));assert(['baseline','candidate'].includes(mode));
const out=resolve('work/v5/CXI/context',label);assert(!existsSync(out));mkdirSync(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const report={utc:new Date().toISOString(),mode,url:judgeUrl,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),probeSha256:hash(readFileSync(import.meta.filename)),viewport:{width:1280,height:720},
 method:'Native production responses, rule-resolved boss fixture. Real WEBGL_lose_context loss/restoration and injected repeated loss inside the first restored GL draw. Native RAF and renderer retained. Synthetic resolution and late detached-canvas notifications test callbacks only. No hardware failure-rate, performance or ordinary-journey claim.',runs:[],captures:[],complete:false};
const save=()=>writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');save();
const state=page=>page.evaluate(()=>{
 const e=document.querySelector('.b3-victory-crew'),c=e.querySelector('canvas'),g=c.getContext('webgl2'),f=e.querySelector('.b3-victory-fallback');
 return{ready:e.dataset.ready,drawn:e.dataset.drawn,contextLost:g.isContextLost(),canvasVisibility:getComputedStyle(c).visibility,fallbackVisibility:getComputedStyle(f).visibility,
  images:[...f.querySelectorAll('img')].map(i=>({src:i.currentSrc,complete:i.complete,naturalWidth:i.naturalWidth,visibility:getComputedStyle(i).visibility,rect:i.getBoundingClientRect().toJSON()})),
  rect:e.getBoundingClientRect().toJSON(),size:{width:e.clientWidth,height:e.clientHeight},canvas:{width:c.width,height:c.height},gl:{width:g.drawingBufferWidth,height:g.drawingBufferHeight},dpr:devicePixelRatio,
  counters:{...globalThis.__cxiContext.counters},rules:JSON.stringify(window.__depthReview.tutorialBattle)};
});
const capture=async(page,cdp,name)=>{
 if(mode==='baseline')return;
 const dpr=await page.evaluate(()=>devicePixelRatio),png=resolve(out,name+'.png'),jpg=resolve(out,name+'-1024.jpg');
 const bytes=Buffer.from((await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,clip:{x:0,y:0,width:1280,height:720,scale:1/dpr}})).data,'base64');
 assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);writeFileSync(png,bytes);
 execFileSync('ffmpeg',['-v','error','-i',png,'-vf','scale=1024:576','-frames:v','1','-q:v','3',jpg]);
 const rgb=execFileSync('ffmpeg',['-v','error','-i',jpg,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:2*1024*1024});
 const mean=rgb.reduce((a,b)=>a+b,0)/rgb.length,std=Math.sqrt(rgb.reduce((a,b)=>a+(b-mean)**2,0)/rgb.length);assert(std>10);
 report.captures.push({name,path:jpg,rawPath:png,sha256:hash(readFileSync(jpg)),dimensions:[1024,576],utc:new Date().toISOString(),url:page.url(),dpr,mean,std,reviewed:false});save();
};
const visibleFallback=s=>s.ready==='false'&&s.canvasVisibility==='hidden'&&s.fallbackVisibility==='visible'&&s.images.length===4&&s.images.every(i=>i.complete&&i.naturalWidth>0&&i.visibility==='visible');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const reduced of [false,true]){
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{setupPage:async p=>{
   await p.addInitScript(()=>{Math.random=()=>.5;const original=window.matchMedia;globalThis.__cxiQueries=[];
    window.matchMedia=function(query){const m=original.call(this,query);if(query.startsWith('(resolution:'))globalThis.__cxiQueries.push(m);return m;};});
  }});
  const row={reduced,errors,blockedRequests};report.runs.push(row);save();const cdp=await page.context().newCDPSession(page);
  const modules=await loadRules();let battle;
  try{const R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');battle=await page.evaluate(()=>window.__depthReview.battle);R.playBattle(battle,'auto');assert(battle.result);}finally{await modules.vite.close();}
  await page.evaluate(({battle,reduced})=>{const m=window.__depthReview;m.state.settings.reducedMotion=reduced;m.tutorialBattle=battle;m.showResult();},{battle,reduced});
  await page.waitForSelector('.b3-victory-crew[data-ready=true]');await page.waitForTimeout(250);
  await page.evaluate(()=>{
   for(const a of document.getAnimations())a.pause();
   const c=document.querySelector('.b3-victory-crew>canvas'),g=c.getContext('webgl2'),ext=g.getExtension('WEBGL_lose_context');if(!ext)throw Error('Native loss extension unavailable');
   const probe=globalThis.__cxiContext={canvas:c,gl:g,ext,counters:{draws:0,lost:0,restored:0},loseOnDraw:false};
   c.addEventListener('webglcontextlost',()=>probe.counters.lost++);c.addEventListener('webglcontextrestored',()=>probe.counters.restored++);
   for(const name of ['drawElements','drawArrays']){const original=g[name];g[name]=function(...args){probe.counters.draws++;if(probe.loseOnDraw){probe.loseOnDraw=false;ext.loseContext();return;}return original.apply(this,args);};}
  });
  row.loaded=await state(page);assert.equal(row.loaded.ready,'true');await capture(page,cdp,(reduced?'reduced':'normal')+'-loaded');
  await page.evaluate(()=>globalThis.__cxiContext.ext.loseContext());await page.waitForFunction(()=>globalThis.__cxiContext.counters.lost===1);await page.waitForTimeout(120);
  row.lost=await state(page);assert(row.lost.contextLost);row.fallbackVisible=visibleFallback(row.lost);
  if(mode==='candidate')assert(row.fallbackVisible);else assert(!row.fallbackVisible,'Baseline unexpectedly already fixed');
  await capture(page,cdp,(reduced?'reduced':'normal')+'-lost');
  if(mode==='candidate'){
   const before=row.lost.counters.draws;
   await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:2,mobile:false});
   await page.evaluate(()=>globalThis.__cxiQueries.at(-1)?.dispatchEvent(new Event('change')));await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(150);
   row.lostAfterSignals=await state(page);assert.equal(row.lostAfterSignals.counters.draws,before);assert(visibleFallback(row.lostAfterSignals));
   await page.emulateMedia({reducedMotion:'no-preference'});
  }
  await page.evaluate(()=>globalThis.__cxiContext.ext.restoreContext());await page.waitForFunction(()=>globalThis.__cxiContext.counters.restored===1);
  await page.waitForFunction(()=>document.querySelector('.b3-victory-crew').dataset.ready==='true');await page.waitForTimeout(150);row.restored=await state(page);
  assert(!row.restored.contextLost);assert.equal(row.restored.canvasVisibility,'visible');assert.equal(row.restored.rules,row.loaded.rules);assert.deepEqual(row.restored.rect,row.loaded.rect);assert.deepEqual(row.restored.canvas,row.restored.gl);
  if(mode==='candidate')for(const axis of ['width','height'])assert.equal(row.restored.canvas[axis],Math.floor(row.restored.size[axis]*1.5));
  await capture(page,cdp,(reduced?'reduced':'normal')+'-restored');
  if(mode==='candidate'){
   await page.evaluate(()=>globalThis.__cxiContext.ext.loseContext());await page.waitForFunction(()=>globalThis.__cxiContext.counters.lost===2);await page.waitForTimeout(120);
   await page.evaluate(()=>{const p=globalThis.__cxiContext;p.loseOnDraw=true;p.ext.restoreContext();});
   await page.waitForFunction(()=>globalThis.__cxiContext.counters.lost===3);await page.waitForTimeout(120);row.relossDuringDraw=await state(page);assert(visibleFallback(row.relossDuringDraw));
   await page.evaluate(()=>globalThis.__cxiContext.ext.restoreContext());await page.waitForFunction(()=>globalThis.__cxiContext.counters.restored===3&&document.querySelector('.b3-victory-crew').dataset.ready==='true');
   await page.waitForTimeout(150);row.recoveredAgain=await state(page);assert.equal(row.recoveredAgain.rules,row.loaded.rules);assert.deepEqual(row.recoveredAgain.rect,row.loaded.rect);
   const before=await state(page);await page.waitForTimeout(350);row.idleDraws=(await state(page)).counters.draws-before.counters.draws;if(reduced)assert.equal(row.idleDraws,0);else assert(row.idleDraws>0);
  }
  await page.evaluate(()=>{const m=window.__depthReview;m.screen='map';m.notify(false);});await page.waitForFunction(()=>!globalThis.__cxiContext.canvas.isConnected);await page.waitForTimeout(150);
  const before=await page.evaluate(()=>globalThis.__cxiContext.counters.draws);
  await page.evaluate(()=>{const p=globalThis.__cxiContext;p.canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));p.canvas.dispatchEvent(new Event('webglcontextrestored'));globalThis.__cxiQueries.forEach(q=>q.dispatchEvent(new Event('change')));});await page.waitForTimeout(150);
  row.cleanup=await page.evaluate(()=>({connected:globalThis.__cxiContext.canvas.isConnected,draws:globalThis.__cxiContext.counters.draws}));assert(!row.cleanup.connected);assert.equal(row.cleanup.draws,before);
  assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);await page.close();save();console.log(JSON.stringify({reduced,fallbackVisible:row.fallbackVisible,idleDraws:row.idleDraws,errors}));
 }
 report.complete=true;
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{await browser.close();report.ended=new Date().toISOString();save();console.log(JSON.stringify({out,complete:report.complete,failure:report.failure?.slice(0,800)}));}
