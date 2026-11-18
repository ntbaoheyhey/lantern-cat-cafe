/** Fixed native geometry and CSS capture coverage at desktop pixel ratios1/2/1.5. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
import {desktopDensity} from './desktop-density.mjs';
const production=resolve(root,'work/v5/CXV/films/V7-F-focus-read-native-production');
const out=resolve(root,'work/v5/CXV/films/V7-F-desktop-density-probe');assert(!existsSync(out));
const manifest=await readFile(resolve(production,'build.json')),built=JSON.parse(manifest),artifact=built.artifacts.find(a=>a.mode==='native');assert.equal(artifact.transformed,0);
for(const file of artifact.files)assert.equal(hash(await readFile(resolve(artifact.dist,file.path))),file.sha256);
await mkdir(out,{recursive:true});const snapshots=[];
for(const name of ['probe-desktop-density.mjs','desktop-density.mjs','production-candidate-fixture.mjs']){const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);snapshots.push({name,sha256:hash(bytes)});}
process.env.CXV_PRODUCTION_OUT=production;process.env.CXV_ARTIFACT_MODE='native';
const {chromium,openFixture,config,judgeUrl,runtimeEvidence}=await import('./production-candidate-fixture.mjs');
const {preview}=await import(require.resolve('vite')),server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6312,strictPort:true}});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const report={utc:new Date().toISOString(),source:built.source,runtimePatchSha256:built.runtimePatchSha256,indexSha256:artifact.indexSha256,url:judgeUrl,viewport:{width:1280,height:720},buildManifest:{path:resolve(production,'build.json'),sha256:hash(manifest)},verifiedArtifactFiles:artifact.files.length,snapshots,
 method:'Paused actual native boss fixture,normal/reduced fixed20.3s pose,three native desktop deviceScaleFactors. No renderer overrides;CSS1280x720 screenshot scale css. Compare all seven world/core/face bounds,camera and HUD placement across ratios. Different raster densities are not expected to have identical RGB. Geometry-only coverage;ordinary-play timing follows separately.',runs:[],captures:[],reviews:[],pass:false};
try{
 for(const ratio of [1,2,1.5]){
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{deviceScaleFactor:ratio,setupPage:p=>p.addInitScript(()=>{Math.random=()=>.5;})});
  await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
  for(const reduced of [false,true]){
   const geometry=await page.evaluate(reduced=>{
    for(const animation of document.getAnimations())animation.pause();
    const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);s.phaseNoticeAt=-100;
    s.render({...s.view(),reducedMotion:reduced,fixedTime:20.3,paused:true,galleryPreview:true},0);
    const rect=node=>{const r=node.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};
    return{battle:m.battle,plan:m.plan,age:m.animationAt,units:s.sizeAudit().units,camera:{projection:s.camera.projectionMatrix.elements,world:s.camera.matrixWorld.elements},
     labels:[...document.querySelectorAll('.b3-world')].map(n=>({actor:n.dataset.actor,hidden:n.hidden,text:n.textContent,rect:rect(n),transform:n.style.transform})),
     cards:[...document.querySelectorAll('.b3-card')].map(n=>({text:n.textContent,rect:rect(n)}))};
   },reduced);
   assert.equal(geometry.units.length,7);
   const density=await desktopDensity(page,ratio),name=ratio+'x-'+(reduced?'reduced':'normal'),path=resolve(out,name+'.png');
   await page.screenshot({path,scale:'css'});const bytes=await readFile(path);assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);
   const rgb=execFileSync('ffmpeg',['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:4*1024*1024});
   const mean=rgb.reduce((a,b)=>a+b,0)/rgb.length;let squares=0;for(const v of rgb)squares+=(v-mean)**2;const stdDev=Math.sqrt(squares/rgb.length);assert(stdDev>10);
   report.captures.push({name,path,ratio,reduced,width:1280,height:720,sha256:hash(bytes),rgbSha256:hash(rgb),mean,stdDev});
   const baseline=report.runs.find(r=>r.ratio===1&&r.reduced===reduced),geometryExact=!baseline||JSON.stringify(geometry)===JSON.stringify(baseline.geometry);
   report.runs.push({ratio,reduced,density,geometry,geometryExact,identity:runtimeEvidence()});
   if(ratio!==1.5){const view=resolve(out,name+'-review.jpg');execFileSync('ffmpeg',['-v','error','-i',path,'-vf','scale=1024:576','-frames:v','1','-q:v','3',view]);report.reviews.push({path:view,width:1024,height:576,sha256:hash(await readFile(view))});}
  }
  assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);await page.close();
 }
 report.pass=report.runs.length===6&&report.runs.every(r=>r.geometryExact);
}catch(error){report.failure=String(error);throw error;}
finally{await browser.close();await new Promise(done=>server.httpServer.close(done));report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({out,pass:report.pass,runs:report.runs.map(({ratio,reduced,density,geometryExact})=>({ratio,reduced,density,geometryExact}))}));
assert(report.pass,'Density geometry differs;preserve raw evidence');
