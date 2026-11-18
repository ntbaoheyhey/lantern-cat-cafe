/** Native paused battle loss/restoration diagnostic; no application overrides. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';

const candidate=process.env.CXV_BATTLE_CONTEXT_CANDIDATE==='1';
const repair=candidate||process.env.CXV_BATTLE_CONTEXT_REPAIR==='1';
const production=resolve(process.env.CXV_BATTLE_CONTEXT_PRODUCTION??resolve(root,'work/v5/CXV/films/V7-E-victory-context-native-production'));
const out=resolve(process.env.CXV_BATTLE_CONTEXT_OUT??resolve(root,'work/v5/CXV/films/V7-F-battle-context-loss'));
assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(!existsSync(out));
const manifest=await readFile(resolve(production,'build.json')),built=JSON.parse(manifest),artifact=built.artifacts.find(a=>a.mode==='native');
assert.equal(artifact.transformed,candidate?1:0);assert.equal(built.runtimePatchSha256,hash(''));
for(const file of artifact.files)assert.equal(hash(await readFile(resolve(artifact.dist,file.path))),file.sha256);
await mkdir(out,{recursive:true});
process.env.CXV_PRODUCTION_OUT=production;process.env.CXV_ARTIFACT_MODE='native';
const {chromium,config,openFixture,runtimeEvidence,judgeUrl}=await import('./production-candidate-fixture.mjs');
const {preview}=await import(require.resolve('vite'));
const server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6312,strictPort:true}});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),...runtimeEvidence(),url:judgeUrl,viewport:{width:1280,height:720},
 buildManifest:{path:resolve(production,'build.json'),sha256:hash(manifest)},verifiedArtifactFiles:artifact.files.length,candidate,repair,artifactTransforms:artifact.transformed,
 method:(candidate?'Isolated scene-source candidate. ':'Untransformed native artifact. ')+'Boss fixture paused through actual native loss/restoration. Native scene RAF resumed after fixture setup; no render/view/error overrides at runtime. CSS animations paused, existing scene time set20.3 before initial native draw. Measure native GPU events, draw deltas and error overlay. Failure injection, not incidence or a gameplay-policy proposal.',snapshots:[],runs:[],captures:[],pass:false,reviewedUtc:null};
for(const name of ['probe-battle-context-loss.mjs','production-candidate-fixture.mjs']){const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);report.snapshots.push({name,sha256:hash(bytes)});}
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const reduced of [false,true]){
  const mode=reduced?'reduced':'normal',dir=resolve(out,mode);await mkdir(dir,{recursive:true});
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'));
  await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
  await page.evaluate(reduced=>{
   const m=window.__depthReview,s=window.__depthScene;m.state.settings.reducedMotion=reduced;m.paused=true;m.notify(false);
   for(const animation of document.getAnimations())animation.pause();
   s.time=20.3;s.phaseNoticeAt=-100;s.dirty=true;s.raf=requestAnimationFrame(s.loop);
   const canvas=s.renderer.domElement,gl=canvas.getContext('webgl2'),extension=gl.getExtension('WEBGL_lose_context');
   if(!extension)throw Error('WEBGL_lose_context unavailable');
   const audit=globalThis.__cxvBattleLoss={canvas,gl,extension,lost:0,restored:0,draws:0};
   canvas.addEventListener('webglcontextlost',()=>audit.lost++);canvas.addEventListener('webglcontextrestored',()=>audit.restored++);
   for(const name of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced']){const original=gl[name].bind(gl);gl[name]=(...args)=>{audit.draws++;return original(...args);};}
  },reduced);
  const measure=()=>page.evaluate(()=>{
   const m=window.__depthReview,s=window.__depthScene,a=globalThis.__cxvBattleLoss;
   return{ready:s.ready,sceneReady:m.sceneReady,sceneError:m.sceneError,paused:m.paused,canAct:m.canAct,dirty:s.dirty,contextLost:a.gl.isContextLost(),lostEvents:a.lost,restoredEvents:a.restored,draws:a.draws,
    canvas:{width:a.canvas.width,height:a.canvas.height},units:s.sizeAudit().units.sort((a,b)=>a.id.localeCompare(b.id)),
    overlays:[...document.querySelectorAll('.dp-loading')].map(n=>({text:n.textContent,visibility:getComputedStyle(n).visibility,display:getComputedStyle(n).display,rect:n.getBoundingClientRect().toJSON()})),
    battle:m.battle,plan:m.plan,age:m.animationAt};
  });
  const capture=async name=>{
   const before=await measure(),path=resolve(dir,name+'.png');await page.screenshot({path,scale:'css'});
   const bytes=await readFile(path);assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);
   const rgb=execFileSync('ffmpeg',['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:4*1024*1024});
   const mean=rgb.reduce((sum,value)=>sum+value,0)/rgb.length;let squares=0;for(const value of rgb)squares+=(value-mean)**2;
   const row={mode,name,path,utc:new Date().toISOString(),sha256:hash(bytes),rgbSha256:hash(rgb),mean,stdDev:Math.sqrt(squares/rgb.length),before,after:await measure()};
   assert(row.stdDev>10);report.captures.push(row);return row.after;
  };
  await page.waitForTimeout(500);const loaded=await capture('loaded');assert.equal(loaded.sceneError,'');assert(loaded.ready&&loaded.draws>0);
  await page.evaluate(()=>globalThis.__cxvBattleLoss.extension.loseContext());await page.waitForFunction(()=>globalThis.__cxvBattleLoss.lost===1);await page.waitForTimeout(500);
  const lost=await capture('lost');assert(lost.contextLost&&lost.sceneError);assert.equal(lost.draws,loaded.draws);
  await page.evaluate(()=>globalThis.__cxvBattleLoss.extension.restoreContext());await page.waitForFunction(()=>globalThis.__cxvBattleLoss.restored===1);await page.waitForTimeout(1000);
  const restored=await capture('restored');assert(!restored.contextLost);assert.deepEqual(restored.battle,loaded.battle);assert.deepEqual(restored.plan,loaded.plan);assert.equal(restored.age,loaded.age);
  assert.deepEqual(restored.units,loaded.units);assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);
  if(repair){
   assert.equal(restored.sceneError,'');assert.equal(restored.overlays.length,0);assert(restored.draws>lost.draws);assert(restored.paused&&!restored.canAct);
   const frames=report.captures.filter(c=>c.mode===mode);assert.equal(frames.find(c=>c.name==='loaded').rgbSha256,frames.find(c=>c.name==='restored').rgbSha256,'Paused restored frame must be full RGB exact');
  }
  report.runs.push({mode,loaded,lost,restored,reproduced:restored.sceneError===lost.sceneError&&restored.draws===lost.draws,errors,blockedRequests});
  await page.close();
 }
 report.pass=true;report.reproduced=report.runs.every(r=>r.reproduced);report.ended=new Date().toISOString();
 const rawPath=resolve(out,'report.json'),raw=JSON.stringify(report,null,2)+'\n';await writeFile(rawPath,raw);
 const compact=state=>({...state,battle:undefined,plan:undefined,units:undefined,battleSha256:hash(JSON.stringify(state.battle)),planSha256:hash(JSON.stringify(state.plan)),unitsSha256:hash(JSON.stringify(state.units))});
 const summary={...report,raw:{path:rawPath,sha256:hash(raw)},runs:report.runs.map(r=>({...r,loaded:compact(r.loaded),lost:compact(r.lost),restored:compact(r.restored)})),captures:report.captures.map(({before,after,...c})=>c)};
 await writeFile(resolve(root,'reports/v5/CXV/V7-F-battle-context-'+(candidate?'prototype':repair?'native':'loss')+'.json'),JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify({out,pass:report.pass,reproduced:report.reproduced,runs:report.runs.map(r=>({mode:r.mode,restoredDraws:r.restored.draws-r.lost.draws,error:r.restored.sceneError}))}));
}finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));}
