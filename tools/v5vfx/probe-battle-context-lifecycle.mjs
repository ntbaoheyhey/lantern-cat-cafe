/** Native GPU events plus paused resize, error retention and disconnected cleanup. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
import {desktopDensity} from './desktop-density.mjs';
const native=process.env.CXV_BATTLE_CONTEXT_NATIVE==='1';
const production=resolve(process.env.CXV_BATTLE_CONTEXT_PRODUCTION??resolve(root,'work/v5/CXV/films/V7-F-battle-context-prototype-build')),out=resolve(process.env.CXV_BATTLE_CONTEXT_LIFECYCLE_OUT??resolve(root,'work/v5/CXV/films/V7-F-battle-context-lifecycle'));assert(!existsSync(out));
assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));
const built=JSON.parse(await readFile(resolve(production,'build.json'))),artifact=built.artifacts[0];assert.equal(artifact.transformed,native?0:1);assert.equal(built.runtimePatchSha256,hash(''));
for(const file of artifact.files)assert.equal(hash(await readFile(resolve(artifact.dist,file.path))),file.sha256);
await mkdir(out,{recursive:true});process.env.CXV_PRODUCTION_OUT=production;process.env.CXV_ARTIFACT_MODE='native';
const {chromium,config,openFixture,runtimeEvidence,judgeUrl}=await import('./production-candidate-fixture.mjs');
const {preview}=await import(require.resolve('vite')),server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6312,strictPort:true}});
const report={utc:new Date().toISOString(),...runtimeEvidence(),url:judgeUrl,viewport:{width:1280,height:720},candidateSceneSha256:built.candidateSceneSha256,native,
 method:(native?'Untransformed application. ':'Isolated candidate. ')+'Actual WEBGL_lose_context cycles on paused boss in both motion modes. Change desktop density/CSS width/motion settings while lost, preserve a synthetic resource-error notification, then unmount during a third loss. Track actual listener identities. Error notifications and display changes are synthetic controls; GPU events are native. No gameplay-policy or performance claim.',snapshots:[],runs:[],pass:false};
for(const name of ['probe-battle-context-lifecycle.mjs','desktop-density.mjs','production-candidate-fixture.mjs']){const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);report.snapshots.push({name,sha256:hash(bytes)});}
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
let activePage,phase='opening';
try{
 for(const reduced of [false,true]){
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{setupPage:p=>p.addInitScript(()=>{
   const handlers=globalThis.__cxvCanvasHandlers=new WeakMap(),proto=HTMLCanvasElement.prototype,add=proto.addEventListener,remove=proto.removeEventListener;
   proto.addEventListener=function(type,handler,options){if(type==='webglcontextlost'||type==='webglcontextrestored'){let row=handlers.get(this);if(!row){row={webglcontextlost:new Set(),webglcontextrestored:new Set()};handlers.set(this,row);}row[type].add(handler);}return add.call(this,type,handler,options);};
   proto.removeEventListener=function(type,handler,options){handlers.get(this)?.[type]?.delete(handler);return remove.call(this,type,handler,options);};
  })});
  activePage=page;phase='loaded';
  const cdp=await page.context().newCDPSession(page);
  await page.evaluate(reduced=>{
   const m=window.__depthReview,s=window.__depthScene;m.state.settings.reducedMotion=reduced;m.paused=true;m.notify(false);s.dirty=true;s.raf=requestAnimationFrame(s.loop);
   const canvas=s.renderer.domElement,gl=s.renderer.getContext(),extension=gl.getExtension('WEBGL_lose_context');if(!extension)throw Error('WEBGL_lose_context unavailable');
   const a=globalThis.__cxvBattleContext={scene:s,canvas,gl,extension,lost:0,restored:0};canvas.addEventListener('webglcontextlost',()=>a.lost++);canvas.addEventListener('webglcontextrestored',()=>a.restored++);
  },reduced);
  const measure=()=>page.evaluate(()=>{
   const m=window.__depthReview,a=globalThis.__cxvBattleContext,s=a.scene,listeners=globalThis.__cxvCanvasHandlers.get(a.canvas);
   return{lost:a.lost,restored:a.restored,contextLost:a.gl.isContextLost(),sceneError:m.sceneError,disposed:s.disposed,connected:a.canvas.isConnected,paused:m.paused,motion:m.state.settings.reducedMotion,
    lossListener:listeners.webglcontextlost.has(s.lost),restoreListener:listeners.webglcontextrestored.has(s.restored),actorIds:[...s.actors.keys()].sort(),battle:m.battle,plan:m.plan,age:m.animationAt};
  });
  await page.waitForTimeout(200);const loaded=await measure();assert(loaded.lossListener&&loaded.restoreListener);
  await page.evaluate(()=>globalThis.__cxvBattleContext.extension.loseContext());await page.waitForFunction(()=>globalThis.__cxvBattleContext.lost===1);
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:2,mobile:false});
  await page.evaluate(()=>{const m=window.__depthReview,a=globalThis.__cxvBattleContext;a.canvas.parentElement.style.width='1200px';m.state.settings.reducedMotion=!m.state.settings.reducedMotion;m.notify(false);});await page.waitForTimeout(200);
  const changedLost=await measure();assert(changedLost.contextLost&&changedLost.sceneError);phase='resize-restore';
  await page.evaluate(()=>globalThis.__cxvBattleContext.extension.restoreContext());await page.waitForFunction(()=>globalThis.__cxvBattleContext.restored===1&&!window.__depthReview.sceneError);await page.waitForTimeout(200);
  const changedRestored=await measure(),density=await desktopDensity(page,2);assert.equal(density.canvas.clientWidth,1200);assert.equal(changedRestored.motion,!reduced);assert.deepEqual(changedRestored.battle,loaded.battle);assert.deepEqual(changedRestored.plan,loaded.plan);assert.equal(changedRestored.age,loaded.age);
  phase='retained-resource-error';await page.evaluate(()=>{const a=globalThis.__cxvBattleContext;a.canvas.parentElement.style.width='';a.extension.loseContext();});await page.waitForFunction(()=>globalThis.__cxvBattleContext.lost===2);
  await page.evaluate(()=>globalThis.__cxvBattleContext.scene.reportFailure('Synthetic resource failure for recovery retention'));
  await page.evaluate(()=>globalThis.__cxvBattleContext.extension.restoreContext());await page.waitForFunction(()=>globalThis.__cxvBattleContext.restored===2&&!globalThis.__cxvBattleContext.scene.restoringContext);
  const failedResource=await measure();assert.equal(failedResource.sceneError,'Synthetic resource failure for recovery retention');assert.deepEqual(failedResource.battle,loaded.battle);
  await page.evaluate(()=>{const a=globalThis.__cxvBattleContext;a.scene.reportFailure('');a.extension.loseContext();});await page.waitForFunction(()=>globalThis.__cxvBattleContext.lost===3);
  phase='navigate-and-dispose';await page.evaluate(()=>{window.__depthReview.watching=false;window.__depthReview.go('hub');});await page.waitForFunction(()=>globalThis.__cxvBattleContext.scene.disposed&&!globalThis.__cxvBattleContext.canvas.isConnected);
  const disposed=await measure();assert(!disposed.lossListener&&!disposed.restoreListener);
  await page.evaluate(()=>{const a=globalThis.__cxvBattleContext;a.canvas.dispatchEvent(new Event('webglcontextrestored'));a.scene.contextChanged(false);a.scene.reportFailure('Late failure after disposal');a.scene.finishContextRecovery();});
  const late=await measure();assert.equal(late.sceneError,disposed.sceneError);assert(late.disposed&&!late.connected);assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);phase='complete';
  const compact=({battle,plan,...state})=>({...state,battleSha256:hash(JSON.stringify(battle)),planSha256:hash(JSON.stringify(plan))});
  report.runs.push({mode:reduced?'reduced':'normal',loaded:compact(loaded),changedLost:compact(changedLost),changedRestored:compact(changedRestored),density,failedResource:compact(failedResource),disposed:compact(disposed),late:compact(late),errors,blockedRequests});await page.close();
 }
 report.pass=true;report.ended=new Date().toISOString();const text=JSON.stringify(report,null,2)+'\n';await writeFile(resolve(out,'report.json'),text);await writeFile(resolve(root,'reports/v5/CXV/V7-F-battle-context-'+(native?'native-':'')+'lifecycle.json'),text);console.log(JSON.stringify({out,pass:true,modes:report.runs.length}));
}catch(error){
 let state=null;try{state=await activePage?.evaluate(()=>{const a=globalThis.__cxvBattleContext,m=window.__depthReview;return{lost:a?.lost,restored:a?.restored,contextLost:a?.gl.isContextLost(),disposed:a?.scene.disposed,connected:a?.canvas.isConnected,sceneStarted:m?.sceneStarted,watching:m?.watching,sceneError:m?.sceneError};});}catch{}
 report.failure={utc:new Date().toISOString(),phase,message:String(error),state};await writeFile(resolve(out,'failure.json'),JSON.stringify(report,null,2)+'\n');throw error;
}finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));}
