/** Tool-only compileAsync cost/identity probe; shader diagnostics stay enabled. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const buildDir=resolve(root,'work/v5/CXV/films/V7-F-focus-read-native-production'),out=resolve(root,'work/v5/CXV/films/V7-F-shader-preparation-probe');assert(!existsSync(out));
const manifest=await readFile(resolve(buildDir,'build.json')),built=JSON.parse(manifest),artifact=built.artifacts.find(a=>a.mode==='native');assert(artifact?.transformed===0);
for(const file of artifact.files)assert.equal(hash(await readFile(resolve(artifact.dist,file.path))),file.sha256);
await mkdir(out,{recursive:true});const source=await readFile(import.meta.filename);await writeFile(resolve(out,'probe-shader-preparation.mjs'),source);
process.env.CXV_PRODUCTION_OUT=buildDir;process.env.CXV_ARTIFACT_MODE='native';
const {chromium,config,openFixture,judgeUrl}=await import('./production-candidate-fixture.mjs');
const {preview}=await import(require.resolve('vite')),server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6312,strictPort:true}});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const report={utc:new Date().toISOString(),source:built.source,runtimePatchSha256:built.runtimePatchSha256,indexSha256:artifact.indexSha256,buildManifest:{path:resolve(buildDir,'build.json'),sha256:hash(manifest)},toolSha256:hash(source),url:judgeUrl,viewport:{width:1280,height:720},method:'Paused actual native boss fixture; compare full-page RGB and logical/mesh state around compileAsync with shader checks enabled. Measure synchronous call and full preparation elapsed time at1x/4x; wrappers add overhead. No native edit, gameplay throughput, cold-loading or FPS claim.',runs:[],pass:false};
try{
 for(const rate of [1,4]){
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{setupPage:p=>p.addInitScript(()=>{Math.random=()=>.5;})});await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
  await page.evaluate(()=>{for(const a of document.getAnimations())a.pause();const s=window.__depthScene;s.phaseNoticeAt=-100;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:20.3,paused:true,galleryPreview:true},0);});
  const beforePath=resolve(out,rate+'x-before.png');await page.screenshot({path:beforePath});
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate});
  const result=await page.evaluate(async()=>{
   const s=window.__depthScene,m=window.__depthReview,gl=s.renderer.getContext(),restores=[],calls=[];
   const state=()=>{const meshes=[];s.scene.traverse(o=>{if(o.geometry)meshes.push({id:o.uuid,visible:o.visible,matrix:o.matrixWorld.elements,positions:Array.from(o.geometry.attributes.position?.array??[])});});return JSON.stringify({battle:m.battle,plan:m.plan,age:m.animationAt,paused:m.paused,ready:s.ready,meshes});};
   const before=state(),programsBefore=s.renderer.info.programs.length,checksBefore=s.renderer.debug.checkShaderErrors,parallelSupported=gl.getSupportedExtensions().includes('KHR_parallel_shader_compile');
   for(const name of ['compileShader','linkProgram','getProgramInfoLog','getShaderInfoLog','getProgramParameter','getShaderParameter']){const original=gl[name];gl[name]=function(...args){const start=performance.now();let value;try{value=original.apply(this,args);return value;}finally{calls.push({name,elapsedMs:performance.now()-start,parameter:typeof args[1]==='number'?args[1]:null,result:typeof value==='boolean'?value:typeof value==='string'?{length:value.length}:null});}};restores.push(()=>gl[name]=original);}
   let callMs,elapsedMs;try{const start=performance.now(),pending=s.renderer.compileAsync(s.scene,s.camera);callMs=performance.now()-start;await pending;elapsedMs=performance.now()-start;}finally{for(const restore of restores)restore();}
   const stateExact=state()===before,programsAfter=s.renderer.info.programs.length,checksAfter=s.renderer.debug.checkShaderErrors;
   s.render({...s.view(),fixedTime:20.3,paused:true,galleryPreview:true},0);
   return{callMs,elapsedMs,stateExact,programsBefore,programsAfter,checksBefore,checksAfter,parallelSupported,calls};
  });
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});const afterPath=resolve(out,rate+'x-after.png');await page.screenshot({path:afterPath});
  const captures=[];for(const path of [beforePath,afterPath]){const bytes=await readFile(path);assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);const rgb=execFileSync('ffmpeg',['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:4*1024*1024});captures.push({path,width:1280,height:720,sha256:hash(bytes),rgbSha256:hash(rgb)});}
  const review=resolve(out,rate+'x-comparison.jpg');execFileSync('ffmpeg',['-v','error','-i',beforePath,'-i',afterPath,'-filter_complex','[0:v]scale=512:288[a];[1:v]scale=512:288[b];[a][b]hstack=inputs=2[v]','-map','[v]','-frames:v','1','-q:v','3',review]);
  const pixelExact=captures[0].rgbSha256===captures[1].rgbSha256,diagnosticsPass=result.checksBefore&&result.checksAfter&&!result.calls.some(c=>[0x8B81,0x8B82].includes(c.parameter)&&c.result===false||c.name.endsWith('InfoLog')&&c.result?.length>0);
  report.runs.push({rate,...result,pixelExact,diagnosticsPass,captures,review:{path:review,width:1024,height:288,sha256:hash(await readFile(review))},errors,blockedRequests});console.log(JSON.stringify({rate,callMs:result.callMs,elapsedMs:result.elapsedMs,programs:[result.programsBefore,result.programsAfter],stateExact:result.stateExact,pixelExact,errors}));await page.close();
 }
 report.pass=report.runs.length===2&&report.runs.every(r=>r.pixelExact&&r.stateExact&&r.diagnosticsPass&&!r.errors.length&&!r.blockedRequests.length);
}catch(error){report.error=String(error);}
finally{await browser.close();await new Promise(done=>server.httpServer.close(done));report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({out,pass:report.pass,error:report.error}));if(!report.pass)process.exitCode=1;}
