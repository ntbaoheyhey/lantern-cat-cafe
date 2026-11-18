/** Reproduce outcome-buffer density changes on an untransformed production artifact. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
import {loadRules} from '../cardrpg-big/a4-load.mjs';
const native=process.env.CXV_VICTORY_DENSITY_NATIVE==='1';
const production=resolve(process.env.CXV_VICTORY_DENSITY_PRODUCTION??resolve(root,'work/v5/CXV/films/V7-F-density-native-production'));
const out=resolve(process.env.CXV_VICTORY_DENSITY_OUT??resolve(root,'work/v5/CXV/films/V7-E-victory-density-probe'));assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(!existsSync(out));
const manifest=await readFile(resolve(production,'build.json')),built=JSON.parse(manifest),artifact=built.artifacts.find(a=>a.mode==='native');
assert.equal(artifact.transformed,0);assert.equal(built.runtimePatchSha256,hash(''));
for(const f of artifact.files)assert.equal(hash(await readFile(resolve(artifact.dist,f.path))),f.sha256);
await mkdir(out,{recursive:true});
process.env.CXV_PRODUCTION_OUT=production;process.env.CXV_ARTIFACT_MODE='native';
const {chromium,config,openFixture,runtimeEvidence,judgeUrl}=await import('./production-candidate-fixture.mjs');
const {preview}=await import(require.resolve('vite'));
const server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6312,strictPort:true}});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),...runtimeEvidence(),url:judgeUrl,viewport:{width:1280,height:720},
 method:'Untransformed production; rule-resolved wave1 result fixture. Live CDP density1->2->1.5->1. Existing ResizeObserver is triggered by a temporary +1CSSpx width then restored, proving density after a real native redraw. No application-response patch. Same-session CSS screenshots. CDP event delivery is recorded separately from buffer correctness.',runs:[],captures:[],pass:false};
report.toolSnapshots=[];
report.native=native;
if(native)report.method='Untransformed production; rule-resolved wave1 result. CDP1->2->1.5->1 with unchanged1280x720CSS. Normal native RAF updates density. Reduced callbacks are exercised by synthetic events on original resolution MediaQueryLists collected without replacing application responses; CDP is not physical monitor delivery. Same-session CSS captures; native drawing buffers, coalescing, zero idle GL draws and late disposal checked.';
for(const name of ['probe-victory-density.mjs','production-candidate-fixture.mjs']){const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);report.toolSnapshots.push({name,sha256:hash(bytes)});}
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const reduced of [false,true]){
  const mode=reduced?'reduced':'normal',dir=resolve(out,mode);await mkdir(dir,{recursive:true});
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave1'),{deviceScaleFactor:1,setupPage:async p=>{
   if(native)await p.addInitScript(()=>{const original=window.matchMedia;globalThis.__cxvResolutionQueries=[];window.matchMedia=function(query){const media=original.call(this,query);if(query.startsWith('(resolution:'))globalThis.__cxvResolutionQueries.push(media);return media;};});
  }});
  const modules=await loadRules();let battle;
  try{const R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');battle=await page.evaluate(()=>window.__depthReview.battle);R.playBattle(battle,'auto');}finally{await modules.vite.close();}
  await page.evaluate(({battle,reduced})=>{const m=window.__depthReview;m.state.settings.reducedMotion=reduced;m.tutorialBattle=battle;m.showResult();},{battle,reduced});
  await page.waitForSelector('.b3-victory-crew[data-ready=true]');await page.waitForTimeout(500);
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});
  await page.evaluate(native=>{
   const canvas=document.querySelector('.b3-victory-crew>canvas'),gl=canvas.getContext('webgl2');
   const a=globalThis.__cxvDensityAudit={draws:0,resizeEvents:0,mediaEvents:[],queries:[]};
   for(const method of ['drawElements','drawArrays']){const old=gl[method];gl[method]=function(...args){a.draws++;return old.apply(this,args);};}
   window.addEventListener('resize',()=>a.resizeEvents++);
   if(!native)for(const ratio of [1,1.5,2]){const q=matchMedia(`(resolution: ${ratio}dppx)`);q.addEventListener('change',e=>a.mediaEvents.push({ratio,matches:e.matches}));a.queries.push(q);}
  },native);
  const state=()=>page.evaluate(()=>{const e=document.querySelector('.b3-victory-crew'),c=e.querySelector('canvas'),gl=c.getContext('webgl2'),a=globalThis.__cxvDensityAudit;return{dpr:devicePixelRatio,expectedRatio:Math.min(devicePixelRatio||1,1.5),width:e.clientWidth,height:e.clientHeight,canvas:{width:c.width,height:c.height},drawingBuffer:{width:gl.drawingBufferWidth,height:gl.drawingBufferHeight},rect:e.getBoundingClientRect().toJSON(),ready:e.dataset.ready,drawn:e.dataset.drawn,contextLost:gl.isContextLost(),draws:a.draws,resizeEvents:a.resizeEvents,mediaEvents:[...a.mediaEvents],matches:a.queries.map(q=>q.matches)};});
  const capture=async name=>{const before=await state(),path=resolve(dir,name+'.png'),bytes=Buffer.from((await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,clip:{x:0,y:0,width:1280,height:720,scale:1/before.dpr}})).data,'base64');assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);await writeFile(path,bytes);const after=await state();assert.equal(after.dpr,before.dpr);const row={mode,name,path,utc:new Date().toISOString(),sha256:hash(bytes),before,after};report.captures.push(row);return row;};
  const initial=await capture('initial-dpr1'),transitions=[];
  for(const ratio of [2,1.5,1]){
   await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:ratio,mobile:false});
   await page.waitForTimeout(200);const beforeRedraw=await state();
   if(native){
    await page.evaluate(()=>{const queries=globalThis.__cxvResolutionQueries;for(let i=0;i<3;i++)queries.at(-1).dispatchEvent(new Event('change'));});await page.waitForTimeout(150);
   }else{
    const oldWidth=await page.locator('.b3-victory-crew').evaluate(e=>{const previous=e.style.width;e.style.width=e.clientWidth+1+'px';return previous;});
    await page.waitForTimeout(80);await page.locator('.b3-victory-crew').evaluate((e,previous)=>{e.style.width=previous;},oldWidth);await page.waitForTimeout(100);
   }
   const after=await state();assert.deepEqual(after.rect,initial.after.rect);
   if(!native)assert(after.draws>beforeRedraw.draws);
   if(native&&reduced){const changed=beforeRedraw.canvas.width!==Math.floor(after.width*after.expectedRatio);assert.equal(after.draws-beforeRedraw.draws,changed?4:0,'One four-actor draw on effective density change, none at unchanged cap');}
   const expected={width:Math.floor(after.width*after.expectedRatio),height:Math.floor(after.height*after.expectedRatio)};
   const stale=after.canvas.width!==expected.width||after.canvas.height!==expected.height;
   assert.equal(stale,native?false:ratio!==1);assert.deepEqual(after.canvas,after.drawingBuffer);
   transitions.push({ratio,beforeRedraw,after,expected,stale});await capture('dpr'+ratio);
  }
  const beforeIdle=await state();await page.waitForTimeout(500);const afterIdle=await state();if(reduced)assert.equal(afterIdle.draws,beforeIdle.draws);
  assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);
  let cleanup=null;
  if(native){
   await page.evaluate(()=>{globalThis.__cxvOldCanvas=document.querySelector('.b3-victory-crew>canvas');const m=window.__depthReview;m.screen='map';m.notify(false);});
   await page.waitForFunction(()=>!globalThis.__cxvOldCanvas.isConnected);const count=await page.evaluate(()=>globalThis.__cxvDensityAudit.draws);
   await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:2,mobile:false});
   await page.evaluate(()=>globalThis.__cxvResolutionQueries.forEach(q=>q.dispatchEvent(new Event('change'))));await page.waitForTimeout(100);
   cleanup=await page.evaluate(()=>({connected:globalThis.__cxvOldCanvas.isConnected,draws:globalThis.__cxvDensityAudit.draws}));assert.equal(cleanup.draws,count);assert.equal(cleanup.connected,false);
  }
  report.runs.push({mode,transitions,idleDraws:afterIdle.draws-beforeIdle.draws,cleanup,errors,blockedRequests});
  await page.close();
 }
 report.pass=true;report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({out,pass:true,runs:report.runs.map(r=>({mode:r.mode,stale:r.transitions.filter(t=>t.stale).length,idleDraws:r.idleDraws,mediaEvents:r.transitions.at(-1).after.mediaEvents.length})),captures:report.captures.length}));
}finally{await browser.close();await new Promise(done=>server.httpServer.close(done));}
