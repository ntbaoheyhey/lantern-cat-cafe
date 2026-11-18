/** Diagnose native density transitions without altering application source or the renderer. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const production=resolve(root,'work/v5/CXV/films/V7-F-focus-read-native-production'),out=resolve(root,'work/v5/CXV/films/V7-F-desktop-density-transition');assert(!existsSync(out));
const manifest=await readFile(resolve(production,'build.json')),built=JSON.parse(manifest),artifact=built.artifacts.find(a=>a.mode==='native');assert.equal(artifact.transformed,0);
for(const f of artifact.files)assert.equal(hash(await readFile(resolve(artifact.dist,f.path))),f.sha256);
await mkdir(out,{recursive:true});const snapshots=[];
for(const name of ['probe-desktop-density-transition.mjs','production-candidate-fixture.mjs']){const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);snapshots.push({name,sha256:hash(bytes)});}
process.env.CXV_PRODUCTION_OUT=production;process.env.CXV_ARTIFACT_MODE='native';
const {chromium,openFixture,config,judgeUrl,runtimeEvidence}=await import('./production-candidate-fixture.mjs');
const {preview}=await import(require.resolve('vite')),server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6312,strictPort:true}});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const report={utc:new Date().toISOString(),source:built.source,runtimePatchSha256:built.runtimePatchSha256,indexSha256:artifact.indexSha256,url:judgeUrl,viewport:{width:1280,height:720},buildManifest:{path:resolve(production,'build.json'),sha256:hash(manifest)},artifactFilesVerified:artifact.files.length,snapshots,
 method:'Native paused actual boss fixture. CDP setDeviceMetricsOverride changes only physical pixel density at fixed1280x720CSS and mobilefalse. Test1->2->1.5->1 and2->1->1.5->2 in separate pages;record browser media events,native buffer,all unit/face/core bounds and HUD after event settling and after an explicit normal render. No renderer override or application-response transform. This diagnoses emulated display transitions,not their real-world frequency or GPU performance.',runs:[],captures:[],reviews:[],pass:false};
try{
 for(const initialRatio of [1,2]){
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{deviceScaleFactor:initialRatio,setupPage:p=>p.addInitScript(()=>{Math.random=()=>.5;})});
  await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
  const cdp=await page.context().newCDPSession(page);
  await page.evaluate(()=>{
   for(const a of document.getAnimations())a.pause();const s=window.__depthScene;cancelAnimationFrame(s.raf);s.phaseNoticeAt=-100;s.render({...s.view(),fixedTime:20.3,paused:true,galleryPreview:true},0);
   globalThis.__cxvDensityEvents=[];for(const ratio of [1,1.5,2])matchMedia('(resolution: '+ratio+'dppx)').addEventListener('change',e=>globalThis.__cxvDensityEvents.push({ratio,matches:e.matches,current:devicePixelRatio}));
  });
  let baselineGeometry;
  for(const [step,ratio]of(initialRatio===1?[1,2,1.5,1]:[2,1,1.5,2]).entries()){
   await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:ratio,mobile:false});
   await page.waitForFunction(r=>devicePixelRatio===r,ratio);await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
   const row=await page.evaluate(()=>{
    const s=window.__depthScene,m=window.__depthReview,r=s.renderer,c=r.domElement,snapshot=()=>({devicePixelRatio,rendererRatio:r.getPixelRatio(),canvas:{width:c.width,height:c.height,clientWidth:c.clientWidth,clientHeight:c.clientHeight},viewport:{width:innerWidth,height:innerHeight},checksEnabled:r.debug.checkShaderErrors,contextLost:r.getContext().isContextLost()});
    const afterEvents=snapshot();s.render({...s.view(),fixedTime:20.3,paused:true,galleryPreview:true},0);const afterRender=snapshot();
    const rect=n=>{const b=n.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height};};
    return{afterEvents,afterRender,geometry:{battle:m.battle,plan:m.plan,age:m.animationAt,units:s.sizeAudit().units.sort((a,b)=>a.id.localeCompare(b.id)),camera:{projection:s.camera.projectionMatrix.elements,world:s.camera.matrixWorld.elements},labels:[...document.querySelectorAll('.b3-world')].map(n=>({actor:n.dataset.actor,text:n.textContent,hidden:n.hidden,rect:rect(n),transform:n.style.transform}))},events:globalThis.__cxvDensityEvents};
   });
   baselineGeometry??=row.geometry;assert.deepEqual(row.geometry,baselineGeometry);assert.deepEqual(row.afterRender.viewport,{width:1280,height:720});assert(row.afterRender.checksEnabled&&!row.afterRender.contextLost);
   const staleDensity=row.afterRender.rendererRatio!==Math.min(ratio,2);report.runs.push({initialRatio,step,ratio,...row,staleDensity,geometryExact:true,identity:runtimeEvidence()});
   const name=initialRatio+'-'+step+'-to'+ratio,path=resolve(out,name+'.png');await page.screenshot({path,scale:'css'});const bytes=await readFile(path);assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);
   const rgb=execFileSync('ffmpeg',['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:4*1024*1024});const mean=rgb.reduce((a,b)=>a+b,0)/rgb.length;let squares=0;for(const v of rgb)squares+=(v-mean)**2;const stdDev=Math.sqrt(squares/rgb.length);assert(stdDev>10);
   report.captures.push({path,initialRatio,step,ratio,width:1280,height:720,sha256:hash(bytes),rgbSha256:hash(rgb),mean,stdDev});
   if(step<=1){const view=resolve(out,name+'-review.jpg');execFileSync('ffmpeg',['-v','error','-i',path,'-vf','scale=1024:576','-frames:v','1','-q:v','3',view]);report.reviews.push({path:view,width:1024,height:576,sha256:hash(await readFile(view))});}
  }
  assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);await page.close();
 }
 report.pass=report.runs.length===8&&report.runs.every(r=>r.geometryExact);
}catch(error){report.failure=String(error);throw error;}
finally{await browser.close();await new Promise(done=>server.httpServer.close(done));report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({out,pass:report.pass,runs:report.runs.map(({initialRatio,step,ratio,staleDensity,afterRender})=>({initialRatio,step,ratio,staleDensity,afterRender}))}));
