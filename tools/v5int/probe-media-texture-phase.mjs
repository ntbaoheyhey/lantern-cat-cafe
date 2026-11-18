/** Read actual uploaded video pixels after a production draw. Diagnostic only. */
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, copyFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
const root=resolve(import.meta.dirname,'../..'),sha=b=>createHash('sha256').update(b).digest('hex');
const buildPath=process.env.CXI_BUILD_DESCRIPTOR,out=resolve(process.env.CXI_CAPTURE_OUT??'');
assert(buildPath&&out.startsWith(root+'/work/v5/CXI/')&&!existsSync(out));
assert(Date.now()>=Date.parse('2026-11-18T13:36:14.927586Z'),'Study gate');
const build=JSON.parse(await readFile(buildPath));
const expectedSource=process.env.CXI_EXPECT_SOURCE??'8aef40187d03fbc6651d5239e7a93907e973284a';
assert(/^[a-f0-9]{40}$/.test(expectedSource));assert.equal(build.sourceCommit,expectedSource);
const phaseCandidate=process.env.CXI_PHASE_CANDIDATE==='1';
await mkdir(out,{recursive:true});await copyFile(import.meta.filename,resolve(out,'probe-media-texture-phase.mjs'));
const fixtureSource='/Users/bao/taskbar-hero-cardrpg-a6/tools/v5vfx/media-production-fixture.mjs';
const frozenFixture=resolve(out,'media-production-fixture.mjs');await copyFile(fixtureSource,frozenFixture);
process.env.CXV_MEDIA_BUILD=buildPath;process.env.CXV_MEDIA_CAT='both';
const {chromium,config,openFixture,runtimeEvidence,judgeUrl}=await import(pathToFileURL(frozenFixture).href);
const report={utc:new Date().toISOString(),url:judgeUrl,viewport:[1280,720],sourceCommit:build.sourceCommit,
 indexSha256:build.indexSha256,build:{path:buildPath,sha256:sha(await readFile(buildPath))},
 harnessSha256:sha(await readFile(import.meta.filename)),fixture:{path:frozenFixture,sha256:sha(await readFile(frozenFixture))},
 controls:[],running:[],references:[],matches:[],errors:[],blockedRequests:[],pass:false,phaseCandidate,
 scope:'Paused/native texture identity and draw-time sockets; GPU readbacks stall. No performance, natural art or release acceptance.',imagesViewed:0};
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const stop=()=>{for(const name of ['STOP-ALL','STOP-CXI'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),'STOP '+name);};
let browser,page;

// This function runs in the browser. It neither uploads nor modifies a texture.
function install(){
 const scene=window.__depthScene,gl=scene.renderer.getContext();
 if(!(gl instanceof WebGL2RenderingContext))throw Error('WebGL2 required');
 const params=['READ_FRAMEBUFFER_BINDING','DRAW_FRAMEBUFFER_BINDING','READ_BUFFER','PIXEL_PACK_BUFFER_BINDING',
  'PACK_ALIGNMENT','PACK_ROW_LENGTH','PACK_SKIP_ROWS','PACK_SKIP_PIXELS','ACTIVE_TEXTURE','TEXTURE_BINDING_2D',
  'CURRENT_PROGRAM','VERTEX_ARRAY_BINDING','RENDERBUFFER_BINDING'];
 const state=()=>Object.fromEntries(params.map(k=>[k,gl.getParameter(gl[k])]));
 const same=(a,b)=>Object.fromEntries(params.map(k=>[k,a[k]===b[k]]));
 const read=(texture,width,height)=>{
  const before=state(),errorBefore=gl.getError();if(errorBefore)throw Error('Existing GL error '+errorBefore);
  const framebuffer=texture?gl.createFramebuffer():null,pixels=new Uint8Array(width*height*4);
  let status,error;
  try{
   gl.bindFramebuffer(gl.READ_FRAMEBUFFER,framebuffer);
   if(texture)gl.framebufferTexture2D(gl.READ_FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
   gl.readBuffer(texture?gl.COLOR_ATTACHMENT0:gl.BACK);
   gl.bindBuffer(gl.PIXEL_PACK_BUFFER,null);gl.pixelStorei(gl.PACK_ALIGNMENT,1);
   for(const k of ['PACK_ROW_LENGTH','PACK_SKIP_ROWS','PACK_SKIP_PIXELS'])gl.pixelStorei(gl[k],0);
   status=gl.checkFramebufferStatus(gl.READ_FRAMEBUFFER);
   if(status!==gl.FRAMEBUFFER_COMPLETE)throw Error('Incomplete read attachment '+status);
   gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);error=gl.getError();
  }finally{
   gl.bindFramebuffer(gl.READ_FRAMEBUFFER,before.READ_FRAMEBUFFER_BINDING);gl.readBuffer(before.READ_BUFFER);
   gl.bindBuffer(gl.PIXEL_PACK_BUFFER,before.PIXEL_PACK_BUFFER_BINDING);
   for(const k of ['PACK_ALIGNMENT','PACK_ROW_LENGTH','PACK_SKIP_ROWS','PACK_SKIP_PIXELS'])gl.pixelStorei(gl[k],before[k]);
   if(framebuffer)gl.deleteFramebuffer(framebuffer);
  }
  const restored=same(before,state()),restoreError=gl.getError();
  if(error||restoreError||!Object.values(restored).every(Boolean))throw Error('GPU state restoration failed '+JSON.stringify({error,restoreError,restored}));
  return{pixels,status,error,restoreError,restored};
 };
 const catActor=cat=>[...scene.actors.values()].find(e=>e.asset===cat).actor;
 const snapshot=(cat,label,canvasControl=false)=>{
  const a=catActor(cat),adapter=a.designerMedia,m=adapter.media,texture=m.videoTexture,p=scene.renderer.properties.get(texture);
  if(!p.__webglTexture||m.material.map!==texture)throw Error('Active uploaded video required '+cat);
  const at=performance.now(),meta={cat,label,at,utc:new Date().toISOString(),adapterFrame:adapter.frame,pose:{...adapter.pose},
   state:{...m.state},decoded:window.__cxvMediaAudits[cat].decoded.at(-1)??null,
   textureVersion:texture.version,uploadedVersion:p.__version,sourceVersion:texture.source.version,
   videoSize:[m.video.videoWidth,m.video.videoHeight],materialUsesVideo:m.material.map===texture,flipY:texture.flipY,
   sceneTime:scene.time,renderTime:scene.renderTime,viewFrame:scene.view().frame??null,
   rootLocal:a.root.matrix.toArray(),rootWorld:a.root.matrixWorld.toArray(),planeWorld:m.plane.matrixWorld.toArray(),
   cameraWorld:scene.camera.matrixWorld.toArray(),cameraView:scene.camera.matrixWorldInverse.toArray(),cameraProjection:scene.camera.projectionMatrix.toArray(),
   canvas:scene.renderer.domElement.getBoundingClientRect().toJSON(),
   allMediaClocks:Object.fromEntries(['mochi','clover'].map(id=>[id,{state:{...catActor(id).designerMedia.media.state},decoded:window.__cxvMediaAudits[id].decoded.at(-1)}])),
   sockets:Object.fromEntries([...a.sockets].map(([name,s])=>[name,{local:s.position.toArray(),matrix:s.matrix.toArray(),world:s.matrixWorld.toArray(),parentWorld:s.parent.matrixWorld.toArray()}]))};
  const before=canvasControl?read(null,gl.drawingBufferWidth,gl.drawingBufferHeight):null;
  const uploaded=read(p.__webglTexture,m.video.videoWidth,m.video.videoHeight);
  const after=canvasControl?read(null,gl.drawingBufferWidth,gl.drawingBufferHeight):null;
  if(before&&!before.pixels.every((v,i)=>v===after.pixels[i]))throw Error('Canvas changed during readback');
  if(before&&!before.pixels.some((v,i)=>i%4!==3&&v>0))throw Error('Empty canvas control');
  let canvasPixels=null;
  if(canvasControl){const c=document.createElement('canvas');c.width=m.video.videoWidth;c.height=m.video.videoHeight;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(m.video,0,0);canvasPixels=ctx.getImageData(0,0,c.width,c.height).data;}
  return{meta,pixels:uploaded.pixels,gl:{status:uploaded.status,error:uploaded.error,restoreError:uploaded.restoreError,restored:uploaded.restored},
   screenBefore:before?.pixels,screenAfter:after?.pixels,canvasPixels};
 };
 const digest=async b=>b?Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).map(v=>v.toString(16).padStart(2,'0')).join(''):null;
 const b64=b=>{let s='';for(let i=0;i<b.length;i+=8192)s+=String.fromCharCode(...b.subarray(i,i+8192));return btoa(s);};
 const wire=async(raw,includePixels=true)=>({meta:raw.meta,gl:raw.gl,sha256:await digest(raw.pixels),
  bytes:raw.pixels.length,rgba:includePixels?b64(raw.pixels):null,canvas:raw.canvasPixels?b64(raw.canvasPixels):null,
  screenBeforeSha256:await digest(raw.screenBefore),screenAfterSha256:await digest(raw.screenAfter),screen:raw.screenBefore?b64(raw.screenBefore):null});
 const original=scene.postFx.render,diag=globalThis.__cxiGpu={snapshot,wire,rows:[],original,active:false,count:0,last:0,done:false,failure:null};
 scene.postFx.render=function(...args){
  const result=original.apply(this,args);
  if(diag.active&&performance.now()-diag.last>=857){
   diag.last=performance.now();
   try{for(const cat of ['mochi','clover'])diag.rows.push(snapshot(cat,'running-'+diag.count));diag.count++;if(diag.count>=12){diag.active=false;diag.done=true;}}
   catch(e){diag.failure=String(e.stack??e);diag.active=false;diag.done=true;}
  }
  return result;
 };
 return{renderer:gl.getParameter(gl.RENDERER),vendor:gl.getParameter(gl.VENDOR),glVersion:gl.getParameter(gl.VERSION),installedParameters:params};
}

async function persist(wire,label){
 const record={...wire.meta,gl:wire.gl,sha256:wire.sha256,bytes:wire.bytes,
  screenBeforeSha256:wire.screenBeforeSha256,screenAfterSha256:wire.screenAfterSha256};
 if(wire.screen){record.screenPath=resolve(out,label+'-screen.rgba');await writeFile(record.screenPath,Buffer.from(wire.screen,'base64'));}
 if(wire.rgba){const data=Buffer.from(wire.rgba,'base64');assert.equal(sha(data),wire.sha256);assert.equal(data.length,wire.bytes);
  record.path=resolve(out,label+(label.startsWith('reference-')?'.rgba.gz':'.rgba'));record.encoding=label.startsWith('reference-')?'gzip':'raw';await writeFile(record.path,record.encoding==='gzip'?gzipSync(data,{level:1}):data);
  if(wire.canvas){const canvas=Buffer.from(wire.canvas,'base64');record.canvasPath=resolve(out,label+'-canvas.rgba');record.canvasSha256=sha(canvas);await writeFile(record.canvasPath,canvas);
   const [w,h]=record.videoSize;let direct=0,flipped=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)for(let k=0;k<3;k++){const i=(y*w+x)*4+k,j=((h-y-1)*w+x)*4+k;direct+=Math.abs(data[i]-canvas[i]);flipped+=Math.abs(data[j]-canvas[i]);}
   record.orientationMAE={direct:direct/(w*h*3),flipped:flipped/(w*h*3)};
  }
 }
 assert(Object.values(record.gl.restored).every(Boolean));assert.equal(record.gl.error,0);assert.equal(record.gl.restoreError,0);
 assert.equal(record.textureVersion,record.uploadedVersion);
 return record;
}

async function settle(cat,frame){
 stop();
 const fixedTime=40+(frame+.25)/30-report.phaseOffsets[cat];
 await page.evaluate(t=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:t,paused:true},0);},fixedTime);
 await page.waitForFunction(()=>['mochi','clover'].every(cat=>{const m=[...window.__depthScene.actors.values()].find(e=>e.asset===cat).actor.designerMedia.media.state,d=window.__cxvMediaAudits[cat].decoded.at(-1),expected=Math.floor(m.desired*30+1e-6);return m.ready&&!m.failure&&!m.seeking&&m.paused&&d&&Math.abs(m.currentTime-m.desired)<=1/60&&Math.abs(d.mediaTime-expected/30)<1e-5;}),null,{timeout:10000});
 await page.evaluate(t=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:t,paused:true},0);},fixedTime);
 return fixedTime;
}

try{
 stop();assert.equal(runtimeEvidence().indexSha256,build.indexSha256);
 assert.equal(sha(Buffer.from(await(await fetch(judgeUrl)).arrayBuffer())),build.indexSha256);
 report.manifests=[];
 for(const [cat,url]of Object.entries(build.registryOverride)){
  const path=resolve(build.dist,'.'+url),data=await readFile(path),manifest=JSON.parse(data);
  assert.equal(sha(await readFile(resolve(build.dist,'.'+manifest.video))),manifest.videoSha256);
  report.manifests.push({cat,path,sha256:sha(data),videoSha256:manifest.videoSha256});
 }
 browser=await chromium.launch({headless:true,args:['--use-angle=metal']});report.browser=browser.version();
 const opened=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'));page=opened.page;
 report.errors=opened.errors;report.blockedRequests=opened.blockedRequests;
 report.gpu=await page.evaluate(install);report.runtimeDiagnosticSha256=sha(install.toString());
 report.rulesBefore=await page.evaluate(()=>JSON.stringify(window.__depthReview.battle));
 await page.evaluate(()=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:30,paused:true},0);});
 report.phaseOffsets=await page.evaluate(()=>Object.fromEntries(['mochi','clover'].map(cat=>[cat,[...window.__depthScene.actors.values()].find(e=>e.asset===cat).actor.designerMedia.media.state.desired])));
 // A distinct primer guarantees callbacks even when the initial clock already matches a target.
 await page.evaluate(()=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:31.25,paused:true},0);});
 for(const cat of ['mochi','clover'])for(const frame of [0,90,180,270]){
  const fixedTime=await settle(cat,frame);
  const first=await persist(await page.evaluate(async({cat,label,fixedTime})=>{const s=window.__depthScene;s.render({...s.view(),fixedTime,paused:true},0);return __cxiGpu.wire(__cxiGpu.snapshot(cat,label,true));},{cat,label:'control-'+frame,fixedTime}),`control-${cat}-${frame}`);
  const repeatWire=await page.evaluate(async({cat,fixedTime})=>{const s=window.__depthScene;s.render({...s.view(),fixedTime,paused:true},0);return __cxiGpu.wire(__cxiGpu.snapshot(cat,'repeat',true),false);},{cat,fixedTime});
  const repeat=await persist(repeatWire,`control-${cat}-${frame}-repeat`);first.referenceFrame=frame;first.repeat=repeat;report.controls.push(first);await save();
  assert.equal(first.sha256,repeat.sha256);assert.equal(first.screenBeforeSha256,repeat.screenBeforeSha256);assert.equal(first.screenBeforeSha256,first.screenAfterSha256);assert.equal(repeat.screenBeforeSha256,repeat.screenAfterSha256);
  const best=Math.min(...Object.values(first.orientationMAE)),worst=Math.max(...Object.values(first.orientationMAE));
  assert(best<5&&worst-best>10,'Orientation control ambiguous');
  first.repeatSha256=repeat.sha256;first.pass=true;await save();
 }
 report.controlsPass=true;console.log(JSON.stringify({stage:'controls',count:report.controls.length,pass:true}));
 report.runningFixture='Model remains paused to disable Battle.tsx automatic actions;temporary scene.view wrapper overrides only paused=false for native scene.loop/video playback. Controlled idle,not natural gameplay.';
 await page.evaluate(()=>{const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);if(!m.paused)throw Error('Model must remain paused');__cxiGpu.originalView=s.view;s.view=function(){return{...__cxiGpu.originalView(),paused:false};};});
 await page.waitForFunction(()=>!window.__depthScene.view().paused&&window.__depthReview.paused);
 await page.evaluate(()=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.last=performance.now();__cxiGpu.active=true;__cxiGpu.last=performance.now()-857;s.raf=requestAnimationFrame(s.loop);});
 await page.waitForFunction(()=>__cxiGpu.done,null,{timeout:25000});
 await page.evaluate(()=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.view=__cxiGpu.originalView;});
 await page.waitForFunction(()=>window.__depthScene.view().paused);
 assert.equal(await page.evaluate(()=>__cxiGpu.failure),null);
 assert.equal(await page.evaluate(()=>__cxiGpu.rows.length),24);
 for(let i=0;i<24;i++){const wire=await page.evaluate(async()=>__cxiGpu.wire(__cxiGpu.rows.shift()));report.running.push(await persist(wire,'running-'+i));}
 await save();console.log(JSON.stringify({stage:'running',samples:report.running.length}));
 const wanted={mochi:new Set([0,90,180,270]),clover:new Set([0,90,180,270])};
 for(const row of report.running){for(const frame of [Math.floor(row.adapterFrame),Math.round(row.decoded.mediaTime*30),Math.floor(row.state.currentTime*30)])for(let d=-2;d<=2;d++)wanted[row.cat].add((frame+d+600)%300);}
 report.referenceScope='All300 native frames per cat;all RGBA retained compressed;no off-window uniqueness inference.';
 for(const cat of ['mochi','clover'])for(const frame of Array.from({length:300},(_,i)=>i)){
  const prior=report.controls.find(x=>x.cat===cat&&x.referenceFrame===frame);
  if(prior){report.references.push({...prior,referenceKind:'known-control'});continue;}
  await settle(cat,frame);
  const row=await persist(await page.evaluate(async({cat,frame})=>__cxiGpu.wire(__cxiGpu.snapshot(cat,'reference-'+frame)),{cat,frame}),`reference-${cat}-${frame}`);
  row.referenceFrame=frame;row.referenceKind='same-browser-paused-native';report.references.push(row);
  if(report.references.length%10===0)await save();
 }
 for(const row of report.running){const hits=report.references.filter(x=>x.cat===row.cat&&x.sha256===row.sha256);report.matches.push({cat:row.cat,label:row.label,path:row.path,sha256:row.sha256,
  adapterFrame:row.adapterFrame,currentTime:row.state.currentTime,callbackPTS:row.decoded.mediaTime,matchingNativeFrames:hits.map(x=>x.referenceFrame),
  uniqueWithinNativeReferenceWindow:hits.length===1,uniqueAcrossAll300Frames:hits.length===1,gpuFrame:hits.length===1?hits[0].referenceFrame:null,
  referenceCount:report.references.filter(x=>x.cat===row.cat).length});}
 report.rulesAfter=await page.evaluate(()=>JSON.stringify(window.__depthReview.battle));assert.equal(sha(report.rulesBefore),sha(report.rulesAfter),'Rules changed in controlled idle');
 report.rulesSha256=sha(report.rulesBefore);delete report.rulesBefore;delete report.rulesAfter;
 assert.equal(report.references.length,600);
 report.allMatched=report.matches.every(x=>x.uniqueAcrossAll300Frames);
 report.phaseGate=report.allMatched&&report.matches.every(x=>x.adapterFrame===x.gpuFrame)&&report.controls.every(x=>x.adapterFrame===x.referenceFrame);
 report.pass=report.controlsPass&&report.allMatched&&(!phaseCandidate||report.phaseGate)&&!report.errors.length&&!report.blockedRequests.length;
 if(phaseCandidate)assert(report.phaseGate,'Candidate sockets do not match actual GPU frames');
 report.limits=['All300 native frames per cat are retained;identity accepted only for one exact fullRGBA hash match.',
  'GPU readbacks stall: not a performance run. Idle diagnostic only; no legal action or art acceptance.',
  phaseCandidate?'Explicit committed loader candidate; registry/assets/originals/Soot unchanged by probe.':'No application/registry/assets/originals/Soot changes.'];
}catch(error){report.failure=String(error.stack??error);process.exitCode=1;}
finally{
 if(page&&!page.isClosed())try{await page.evaluate(()=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);if(globalThis.__cxiGpu){s.postFx.render=__cxiGpu.original;if(__cxiGpu.originalView)s.view=__cxiGpu.originalView;__cxiGpu.active=false;}});}catch{}
 if(browser)await browser.close();report.finishedUTC=new Date().toISOString();await save();
 console.log(JSON.stringify({out,pass:report.pass,controls:report.controls.length,running:report.running.length,references:report.references.length,matched:report.matches.filter(x=>x.uniqueWithinNativeReferenceWindow).length,failure:report.failure}));
}
