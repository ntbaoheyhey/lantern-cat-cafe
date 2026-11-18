/** Paused-loop density correction, unchanged native pixels, roundtrips and disposal. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
import {installDesktopDensityPrototype} from './desktop-density-prototype.mjs';
import {desktopDensity} from './desktop-density.mjs';
const production=resolve(root,'work/v5/CXV/films/V7-F-focus-read-native-production'),out=resolve(process.env.CXV_DENSITY_PROBE_OUT??resolve(root,'work/v5/CXV/films/V7-F-desktop-density-prototype'));assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(!existsSync(out));
const manifest=await readFile(resolve(production,'build.json')),built=JSON.parse(manifest),artifact=built.artifacts.find(a=>a.mode==='native');assert.equal(artifact.transformed,0);
const controlPath=resolve(root,'work/v5/CXV/films/V7-F-density-roundtrip-matched/report.json'),controlBytes=await readFile(controlPath),control=JSON.parse(controlBytes);assert(control.pass);assert.equal(control.source,built.source);assert.equal(control.indexSha256,artifact.indexSha256);
for(const f of artifact.files)assert.equal(hash(await readFile(resolve(artifact.dist,f.path))),f.sha256);
await mkdir(out,{recursive:true});const snapshots=[];
for(const name of ['probe-desktop-density-prototype.mjs','desktop-density-prototype.mjs','desktop-density.mjs','production-candidate-fixture.mjs']){const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);snapshots.push({name,sha256:hash(bytes)});}
process.env.CXV_PRODUCTION_OUT=production;process.env.CXV_ARTIFACT_MODE='native';
const {chromium,openFixture,config,judgeUrl,runtimeEvidence}=await import('./production-candidate-fixture.mjs');
const {preview}=await import(require.resolve('vite')),server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6312,strictPort:true}});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const report={utc:new Date().toISOString(),source:built.source,runtimePatchSha256:built.runtimePatchSha256,indexSha256:artifact.indexSha256,url:judgeUrl,viewport:{width:1280,height:720},buildManifest:{path:resolve(production,'build.json'),sha256:hash(manifest)},artifactFilesVerified:artifact.files.length,snapshots,
 nativeControl:{path:controlPath,sha256:hash(controlBytes)},method:'Paused actual native boss fixture at fixed20.3s,normal/reduced,initialDPR1/2. A tool-only render/loop wrapper synchronizes native pixel ratio only when changed and dirties a paused scene. CDP density sequence at fixed1280x720CSS. No manual render after each change:existing RAF drives refresh. Same-CDP-session CSS capture preserves emulation. All16 full-frame RGB comparisons use unwrapped native API controls with identical buffer sizes and sequence;original origin equality failures remain recorded because unchanged native buffer recreation reproduces them exactly. Exact keyed geometry,stable-frame allocation and disposal checks. No performance claim or native adoption.',runs:[],captures:[],reviews:[],pass:false};
const capture=async(page,cdp,name)=>{
 const before=await page.evaluate(name=>{globalThis.__cxvDensityPhase='capture:'+name;return{devicePixelRatio,resizes:globalThis.__cxvDensityPrototype?.resizes??[]};},name);
 const path=resolve(out,name+'.png');
 // CSS scale, on the same CDP session that owns the current density override.
 const bytes=Buffer.from((await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,clip:{x:0,y:0,width:1280,height:720,scale:1/before.devicePixelRatio}})).data,'base64');await writeFile(path,bytes);assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);
 const rgb=execFileSync('ffmpeg',['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:4*1024*1024});const mean=rgb.reduce((a,b)=>a+b,0)/rgb.length;let squares=0;for(const v of rgb)squares+=(v-mean)**2;const stdDev=Math.sqrt(squares/rgb.length);assert(stdDev>10);
 const after=await page.evaluate(()=>({devicePixelRatio,resizes:globalThis.__cxvDensityPrototype?.resizes??[]}));
 assert.equal(after.devicePixelRatio,before.devicePixelRatio,'Screenshot changed the density under test');assert.deepEqual(after.resizes,before.resizes,'Screenshot caused renderer ratio changes');
 const c={name,path,width:1280,height:720,sha256:hash(bytes),rgbSha256:hash(rgb),mean,stdDev,before,after};report.captures.push(c);return c;
};
const geometry=page=>page.evaluate(()=>{const s=window.__depthScene,m=window.__depthReview,rect=n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};return{battle:m.battle,plan:m.plan,age:m.animationAt,units:s.sizeAudit().units.sort((a,b)=>a.id.localeCompare(b.id)),camera:{projection:s.camera.projectionMatrix.elements,world:s.camera.matrixWorld.elements},labels:[...document.querySelectorAll('.b3-world')].map(n=>({actor:n.dataset.actor,text:n.textContent,hidden:n.hidden,rect:rect(n),transform:n.style.transform}))};});
try{
 for(const initialRatio of [1,2])for(const reduced of [false,true]){
  const name=initialRatio+'-'+(reduced?'reduced':'normal'),{page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{deviceScaleFactor:initialRatio,setupPage:p=>p.addInitScript(()=>{Math.random=()=>.5;})});await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});const cdp=await page.context().newCDPSession(page);
  await page.evaluate(reduced=>{for(const a of document.getAnimations())a.pause();const s=window.__depthScene,view=s.view;cancelAnimationFrame(s.raf);s.phaseNoticeAt=-100;s.view=()=>({...view(),reducedMotion:reduced,fixedTime:20.3,paused:true,galleryPreview:true});s.render(s.view(),0);s.dirty=false;},reduced);
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:initialRatio,mobile:false});
  // BattleHud has its own RAF; let it consume the initial frozen scene anchors.
  await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
  const initialGeometry=await geometry(page),native=await capture(page,cdp,name+'-native');await installDesktopDensityPrototype(page);
  const expected=control.runs.find(r=>r.initial===initialRatio&&r.reduced===reduced);assert(expected?.rows.length===4);assert.equal(native.rgbSha256,expected.rows[0].screenshotRgbSha256);
  await page.evaluate(()=>{const s=window.__depthScene;s.raf=requestAnimationFrame(s.loop);});
  const rows=[];
  for(const [step,ratio]of(initialRatio===1?[1,2,1.5,1]:[2,1,1.5,2]).entries()){
   await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:ratio,mobile:false});
   await page.waitForFunction(r=>devicePixelRatio===r&&window.__depthScene.renderer.getPixelRatio()===Math.min(r,2),ratio);
   await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
   const density=await desktopDensity(page,ratio);assert.deepEqual(await geometry(page),initialGeometry);
   const shot=await capture(page,cdp,name+'-'+step+'-to'+ratio);assert.equal(shot.rgbSha256,expected.rows[step].screenshotRgbSha256,'Prototype differs from native rendering at identical density/history');
   const resizes=await page.evaluate(()=>globalThis.__cxvDensityPrototype.resizes);assert.equal(resizes.length,step);
   rows.push({step,ratio,density,geometryExact:true,resizes,capture:shot.path,matchedNativeRgbExact:true,originRgbExact:step===0||step===3?shot.rgbSha256===native.rgbSha256:null});
  }
  const lifecycle=await page.evaluate(async()=>{
   const s=window.__depthScene,p=globalThis.__cxvDensityPrototype,sets=p.resizes.length,frames=s.stats.frames;
   await new Promise(done=>{let n=12;function tick(){if(--n)requestAnimationFrame(tick);else done();}requestAnimationFrame(tick);});
   const stable={frames:s.stats.frames-frames,extraRatioSets:p.resizes.length-sets};s.dispose();s.dispose();s.loop(performance.now());await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));
   return{stable,disposed:s.disposed,actors:s.actors.size,extraRatioSetsAfterDispose:p.resizes.length-sets,canvasConnected:s.renderer.domElement.isConnected};
  });
  assert.equal(lifecycle.stable.frames,0);assert.equal(lifecycle.stable.extraRatioSets,0);assert.equal(lifecycle.extraRatioSetsAfterDispose,0);assert(lifecycle.disposed&&!lifecycle.canvasConnected&&lifecycle.actors===0);
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:initialRatio===1?2:1,mobile:false});
  lifecycle.lateDensity=await page.evaluate(()=>{const s=window.__depthScene,p=globalThis.__cxvDensityPrototype,n=p.resizes.length;s.loop(performance.now());return{extraRatioSets:p.resizes.length-n,disposed:s.disposed};});assert.equal(lifecycle.lateDensity.extraRatioSets,0);assert(lifecycle.lateDensity.disposed);
  assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);report.runs.push({initialRatio,reduced,rows,lifecycle,identity:runtimeEvidence(),errors,blockedRequests});
  const last=report.captures.at(-1),view=resolve(out,name+'-review.jpg');execFileSync('ffmpeg',['-v','error','-i',last.path,'-vf','scale=1024:576','-frames:v','1','-q:v','3',view]);report.reviews.push({path:view,width:1024,height:576,sha256:hash(await readFile(view))});await page.close();
 }
 report.pass=report.runs.length===4;
}catch(error){report.failure=String(error);throw error;}
finally{await browser.close();await new Promise(done=>server.httpServer.close(done));report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({out,pass:report.pass,captures:report.captures.length,runs:report.runs.map(({initialRatio,reduced,lifecycle})=>({initialRatio,reduced,lifecycle}))}));
