/** CXI native paused-battle loss/recovery acceptance; not ordinary-play timing. */
import assert from 'node:assert/strict';
import {mkdirSync,existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './production-fixture.mjs';

const [label,mode]=process.argv.slice(2);
assert(/^[a-z0-9-]+$/.test(label??''));assert(['baseline','candidate'].includes(mode));
const out=resolve('work/v5/CXI/context',label);assert(!existsSync(out));mkdirSync(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const report={utc:new Date().toISOString(),mode,url:judgeUrl,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),probeSha256:hash(readFileSync(import.meta.filename)),sceneSha256:hash(readFileSync('apps/web/src/game/cardrpg/spine/scene.ts')),viewport:{width:1280,height:720},
 method:'Own native production fixture, paused boss in both motion modes. Actual WEBGL_lose_context events, original RAF/render loop, no response transformation. CSS animations paused and initial scene time fixed for pixel equality. Synthetic density/width/resource-error/late-event controls cover lifecycle only. No gameplay-policy, hardware-incidence or FPS claim.',runs:[],captures:[],complete:false};
const save=()=>writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');save();
const measure=page=>page.evaluate(()=>{
 const m=window.__depthReview,a=globalThis.__cxiBattleContext,s=a.scene,handlers=globalThis.__cxiCanvasListeners.get(a.canvas);
 return{error:m.sceneError,ready:s.ready,paused:m.paused,canAct:m.canAct,dirty:s.dirty,contextLost:a.gl.isContextLost(),restoring:s.restoringContext??null,disposed:s.disposed,connected:a.canvas.isConnected,
  lost:a.lost,restored:a.restored,draws:a.draws,dpr:devicePixelRatio,rendererRatio:s.renderer.getPixelRatio(),width:s.width,height:s.height,
  canvas:{width:a.canvas.width,height:a.canvas.height,rect:a.canvas.getBoundingClientRect().toJSON()},buffer:{width:a.gl.drawingBufferWidth,height:a.gl.drawingBufferHeight},
  listeners:{lost:handlers?.webglcontextlost?.has(s.lost)??false,restored:handlers?.webglcontextrestored?.has(s.restored)??false},
  rules:JSON.stringify(m.battle),plan:JSON.stringify(m.plan),age:m.animationAt,units:s.sizeAudit().units.sort((a,b)=>a.id.localeCompare(b.id)),motion:m.state.settings.reducedMotion};
});
const compact=s=>{const {rules,plan,...rest}=s;return{...rest,rulesSha256:hash(rules),planSha256:hash(plan??'undefined')};};
const capture=async(page,name)=>{
 const rawPath=resolve(out,name+'.png'),path=resolve(out,name+'-1024.jpg');
 await page.screenshot({path:rawPath,scale:'css'});const b=readFileSync(rawPath);
 assert.equal(b.readUInt32BE(16),1280);assert.equal(b.readUInt32BE(20),720);
 const rgb=execFileSync('ffmpeg',['-v','error','-i',rawPath,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:4*1024*1024});
 const mean=rgb.reduce((a,b)=>a+b,0)/rgb.length,std=Math.sqrt(rgb.reduce((a,b)=>a+(b-mean)**2,0)/rgb.length);assert(std>10);
 execFileSync('ffmpeg',['-v','error','-i',rawPath,'-vf','scale=1024:576','-frames:v','1','-q:v','3',path]);
 const row={name,path,rawPath,sha256:hash(readFileSync(path)),rawSha256:hash(b),rgbSha256:hash(rgb),dimensions:[1024,576],sourceDimensions:[1280,720],mean,std,url:page.url(),utc:new Date().toISOString(),reviewed:false};
 report.captures.push(row);save();return row;
};
const sameRules=(a,b)=>{assert.equal(a.rules,b.rules);assert.equal(a.plan,b.plan);assert.equal(a.age,b.age);};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
let phase='setup';
try{
 for(const reduced of [false,true]){
  const name=reduced?'reduced':'normal';phase=name+' setup';
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{setupPage:async p=>{
   await p.addInitScript(()=>{
    Math.random=()=>.5;
    const proto=HTMLCanvasElement.prototype,add=proto.addEventListener,remove=proto.removeEventListener,registry=globalThis.__cxiCanvasListeners=new WeakMap();
    proto.addEventListener=function(type,fn,options){if(type==='webglcontextlost'||type==='webglcontextrestored'){let row=registry.get(this);if(!row){row={webglcontextlost:new Set(),webglcontextrestored:new Set()};registry.set(this,row);}row[type].add(fn);}return add.call(this,type,fn,options);};
    proto.removeEventListener=function(type,fn,options){registry.get(this)?.[type]?.delete(fn);return remove.call(this,type,fn,options);};
   });
  }});
  page.setDefaultTimeout(15000);const cdp=await page.context().newCDPSession(page);
  await page.locator('.b3-wave-intro').waitFor({state:'hidden'});
  await page.evaluate(reduced=>{
   const m=window.__depthReview,s=window.__depthScene;m.state.settings.reducedMotion=reduced;m.paused=true;m.notify(false);
   for(const animation of document.getAnimations())animation.pause();
   s.time=20.3;s.phaseNoticeAt=-100;s.dirty=true;
   const canvas=s.renderer.domElement,gl=s.renderer.getContext(),ext=gl.getExtension('WEBGL_lose_context');if(!ext)throw Error('WEBGL_lose_context unavailable');
   const a=globalThis.__cxiBattleContext={scene:s,canvas,gl,ext,lost:0,restored:0,draws:0,loseOnDraw:false};
   canvas.addEventListener('webglcontextlost',()=>a.lost++);canvas.addEventListener('webglcontextrestored',()=>a.restored++);
   for(const k of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced']){const original=gl[k];gl[k]=function(...args){a.draws++;if(a.loseOnDraw){a.loseOnDraw=false;ext.loseContext();return;}return original.apply(this,args);};}
   s.raf=requestAnimationFrame(s.loop);
  },reduced);
  await page.waitForTimeout(400);const loaded=await measure(page);assert(loaded.ready&&loaded.draws>0&&!loaded.error&&loaded.paused);
  const loadedImage=mode==='candidate'?await capture(page,name+'-loaded'):null;
  phase=name+' first loss';await page.evaluate(()=>globalThis.__cxiBattleContext.ext.loseContext());await page.waitForFunction(()=>globalThis.__cxiBattleContext.lost===1);
  await page.waitForTimeout(250);const lost=await measure(page);assert(lost.contextLost&&lost.error);assert.equal(lost.draws,loaded.draws);
  if(mode==='candidate')await capture(page,name+'-lost');
  await page.evaluate(()=>globalThis.__cxiBattleContext.ext.restoreContext());await page.waitForFunction(()=>globalThis.__cxiBattleContext.restored===1);
  await page.waitForTimeout(600);const restored=await measure(page);assert(!restored.contextLost);sameRules(restored,loaded);assert.deepEqual(restored.units,loaded.units);
  const row={motion:name,loaded:compact(loaded),lost:compact(lost),restored:compact(restored),reproduced:restored.error===lost.error&&restored.draws===lost.draws};
  if(mode==='baseline'){assert(row.reproduced);}
  else{
   assert.equal(restored.error,'');assert(restored.draws>lost.draws&&restored.paused&&!restored.canAct);
   const restoredImage=await capture(page,name+'-restored');assert.equal(restoredImage.rgbSha256,loadedImage.rgbSha256);row.exactRestoredRgb=true;
   phase=name+' resize and resource error';await page.evaluate(()=>globalThis.__cxiBattleContext.ext.loseContext());await page.waitForFunction(()=>globalThis.__cxiBattleContext.lost===2);
   await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:2,mobile:false});
   await page.evaluate(()=>{const a=globalThis.__cxiBattleContext,m=window.__depthReview;a.canvas.parentElement.style.width='1200px';m.state.settings.reducedMotion=!m.state.settings.reducedMotion;m.notify(false);a.scene.reportFailure('Synthetic resource failure retained through recovery');});
   await page.waitForTimeout(200);row.changedLost=compact(await measure(page));
   await page.evaluate(()=>globalThis.__cxiBattleContext.ext.restoreContext());await page.waitForFunction(()=>globalThis.__cxiBattleContext.restored===2&&!globalThis.__cxiBattleContext.scene.restoringContext);
   const changed=await measure(page);sameRules(changed,loaded);assert.equal(changed.error,'Synthetic resource failure retained through recovery');assert.equal(changed.motion,!reduced);assert.equal(changed.width,1200);assert.equal(changed.rendererRatio,2);assert.equal(changed.canvas.width,2400);assert.equal(changed.buffer.width,2400);row.changedRestored=compact(changed);
   phase=name+' repeated loss during first restored draw';await page.evaluate(()=>{const a=globalThis.__cxiBattleContext;a.scene.reportFailure('');a.ext.loseContext();});await page.waitForFunction(()=>globalThis.__cxiBattleContext.lost===3);
   await page.evaluate(()=>{const a=globalThis.__cxiBattleContext;a.loseOnDraw=true;a.ext.restoreContext();});await page.waitForFunction(()=>globalThis.__cxiBattleContext.lost===4);
   const repeated=await measure(page);assert(repeated.contextLost&&repeated.error);row.repeatedLoss=compact(repeated);
   await page.evaluate(()=>globalThis.__cxiBattleContext.ext.restoreContext());await page.waitForFunction(()=>globalThis.__cxiBattleContext.restored===4&&!window.__depthReview.sceneError);
   const recovered=await measure(page);sameRules(recovered,loaded);row.recovered=compact(recovered);
   phase=name+' unmount while lost';await page.evaluate(()=>globalThis.__cxiBattleContext.ext.loseContext());await page.waitForFunction(()=>globalThis.__cxiBattleContext.lost===5);
   await page.evaluate(()=>{window.__depthReview.watching=false;window.__depthReview.go('hub');});await page.waitForFunction(()=>globalThis.__cxiBattleContext.scene.disposed&&!globalThis.__cxiBattleContext.canvas.isConnected);
   const disposed=await measure(page);assert(!disposed.listeners.lost&&!disposed.listeners.restored);
   await page.evaluate(()=>{const a=globalThis.__cxiBattleContext;a.canvas.dispatchEvent(new Event('webglcontextrestored'));a.canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));a.scene.reportFailure('Late synthetic failure');a.scene.finishContextRecovery();});await page.waitForTimeout(200);
   const late=await measure(page);assert.equal(late.draws,disposed.draws);assert.equal(late.error,disposed.error);row.disposed=compact(disposed);row.late=compact(late);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);row.errors=errors;row.blockedRequests=blockedRequests;report.runs.push(row);save();await page.close();
 }
 report.complete=true;
}catch(error){report.failure={phase,message:error.stack};process.exitCode=1;}
finally{await browser.close();report.ended=new Date().toISOString();save();console.log(JSON.stringify({out,complete:report.complete,modes:report.runs.length,failure:report.failure}));}
