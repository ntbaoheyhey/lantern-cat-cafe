/** Attribute origin-pixel changes using only existing native renderer APIs. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const production=resolve(root,'work/v5/CXV/films/V7-F-focus-read-native-production'),out=resolve(process.env.CXV_DENSITY_PIXEL_OUT??resolve(root,'work/v5/CXV/films/V7-F-density-roundtrip-pixels'));assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(!existsSync(out));
const manifest=await readFile(resolve(production,'build.json')),built=JSON.parse(manifest),artifact=built.artifacts.find(a=>a.mode==='native');assert.equal(artifact.transformed,0);
for(const f of artifact.files)assert.equal(hash(await readFile(resolve(artifact.dist,f.path))),f.sha256);
await mkdir(out,{recursive:true});const script=await readFile(import.meta.filename);await writeFile(resolve(out,'probe.mjs'),script);
process.env.CXV_PRODUCTION_OUT=production;process.env.CXV_ARTIFACT_MODE='native';
const {chromium,openFixture,config,judgeUrl}=await import('./production-candidate-fixture.mjs');
const {preview}=await import(require.resolve('vite')),server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6312,strictPort:true}}),browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const report={utc:new Date().toISOString(),source:built.source,indexSha256:artifact.indexSha256,runtimePatchSha256:built.runtimePatchSha256,url:judgeUrl,artifactFilesVerified:artifact.files.length,toolSha256:hash(script),method:'Frozen native scene;no prototype wrapper. Compare repeat renders,no-op native setPixelRatio,and native2/1.5/origin buffer roundtrips. Same-session CDP CSS screenshots plus canvas pixels read synchronously immediately after existing native render. All geometry comparisons exact;pixel differences retained without tolerance.',runs:[],pass:false};
const rgb=path=>execFileSync('ffmpeg',['-v','error','-i',path,'-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:16*1024*1024});
const difference=(a,b)=>{assert.equal(a.length,b.length);let pixels=0,max=0,sum=0;for(let i=0;i<a.length;i+=3){let changed=false;for(let j=0;j<3;j++){const d=Math.abs(a[i+j]-b[i+j]);changed||=d!==0;max=Math.max(max,d);sum+=d;}if(changed)pixels++;}return{exact:pixels===0,pixels,max,sum};};
try{
 for(const initial of [1,2])for(const reduced of [false,true]){
  const name=initial+'-'+(reduced?'reduced':'normal'),{page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{deviceScaleFactor:initial,setupPage:p=>p.addInitScript(()=>{Math.random=()=>.5;})});await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});const cdp=await page.context().newCDPSession(page);
  await page.evaluate(reduced=>{for(const a of document.getAnimations())a.pause();const s=window.__depthScene,view=s.view;cancelAnimationFrame(s.raf);s.phaseNoticeAt=-100;s.view=()=>({...view(),reducedMotion:reduced,fixedTime:20.3,paused:true,galleryPreview:true});},reduced);
  const rows=[];let originScreenshot,originCanvas,originGeometry;
  const actions=process.env.CXV_DENSITY_PIXEL_SEQUENCE==='matched'?['initial','other','middle','return']:['initial','repeat','noop','other','return','repeat-return','noop-return'];
  for(const [step,action]of actions.entries()){
   const ratio=action==='other'?(initial===1?2:1):action==='middle'?1.5:initial;await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:ratio,mobile:false});
   const data=await page.evaluate(({ratio,action})=>{const s=window.__depthScene;if(['noop','other','middle','return','noop-return'].includes(action)){s.renderer.setPixelRatio(ratio);s.postFx.resize(s.width,s.height);}s.render(s.view(),0);return{canvas:s.renderer.domElement.toDataURL('image/png'),geometry:s.sizeAudit().units.sort((a,b)=>a.id.localeCompare(b.id)),ratio:s.renderer.getPixelRatio()};},{ratio,action});
   if(!originGeometry)originGeometry=data.geometry;assert.deepEqual(data.geometry,originGeometry);
   await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
   const css=Buffer.from((await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,clip:{x:0,y:0,width:1280,height:720,scale:1/ratio}})).data,'base64'),canvas=Buffer.from(data.canvas.split(',')[1],'base64'),path=resolve(out,`${name}-${step}-${action}.png`),canvasPath=resolve(out,`${name}-${step}-${action}-canvas.png`);await writeFile(path,css);await writeFile(canvasPath,canvas);assert.equal(css.readUInt32BE(16),1280);assert.equal(css.readUInt32BE(20),720);
   const cssRgb=rgb(path),canvasRgb=rgb(canvasPath);if(step===0){originScreenshot=cssRgb;originCanvas=canvasRgb;}
   rows.push({step,action,ratio,path,canvasPath,screenshotSha256:hash(css),canvasSha256:hash(canvas),screenshotRgbSha256:hash(cssRgb),canvasRgbSha256:hash(canvasRgb),geometryExact:true,screenshotDifference:ratio===initial?difference(originScreenshot,cssRgb):null,canvasDifference:ratio===initial?difference(originCanvas,canvasRgb):null});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);report.runs.push({initial,reduced,rows,errors,blockedRequests});await page.close();
 }
 report.pass=true;
}catch(error){report.failure=String(error);throw error;}finally{await browser.close();await new Promise(done=>server.httpServer.close(done));report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({out,pass:report.pass,runs:report.runs.map(r=>({initial:r.initial,reduced:r.reduced,rows:r.rows.map(({action,screenshotDifference,canvasDifference})=>({action,screenshotDifference,canvasDifference}))}))}));
