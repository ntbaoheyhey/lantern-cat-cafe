/** Native loss plus isolated notice geometry; production mode has no DOM/CSS layout patch. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
import {noticeCss} from './battle-notice-layout.mjs';
const native=process.env.CXV_NOTICE_NATIVE==='1';
const production=resolve(process.env.CXV_NOTICE_PRODUCTION??resolve(root,'work/v5/CXV/films/V7-F-battle-context-native-production'));
const out=resolve(process.env.CXV_NOTICE_OUT??resolve(root,'work/v5/CXV/films/V7-F-battle-notice-experiment'));
assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(!existsSync(out));
const manifest=await readFile(resolve(production,'build.json')),build=JSON.parse(manifest),artifact=build.artifacts.find(a=>a.mode==='native');
assert.equal(artifact.transformed,0);assert.equal(build.runtimePatchSha256,hash(''));
for(const file of artifact.files)assert.equal(hash(await readFile(resolve(artifact.dist,file.path))),file.sha256);
assert.equal(execFileSync('git',['diff','--name-only',build.source,'--','apps/web/src','apps/web/public'],{cwd:root,encoding:'utf8'}).trim(),'');
await mkdir(out,{recursive:true});
process.env.CXV_PRODUCTION_OUT=production;process.env.CXV_ARTIFACT_MODE='native';
const {chromium,config,openFixture,runtimeEvidence,judgeUrl}=await import('./production-candidate-fixture.mjs');
const {preview}=await import(require.resolve('vite'));
const server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6312,strictPort:true}});
const report={utc:new Date().toISOString(),source:build.source,indexSha256:artifact.indexSha256,...runtimeEvidence(),url:judgeUrl,viewport:{width:1280,height:720},deviceScaleFactor:2,native,
 buildManifest:{path:resolve(production,'build.json'),sha256:hash(manifest)},verifiedArtifactFiles:artifact.files.length,noticeCssSha256:hash(noticeCss),
 method:'Native WebGL loss in paused boss; same-session DPR2 metrics and 1280x720 capture. Experiment mode patches only notice class/span/CSS after baseline; native mode does not. Longer resource notification is synthetic. HUD buttons are hit-tested, guide and menu opened/closed through UI; rules/plan/age and restored RGB must remain exact.',snapshots:[],runs:[],captures:[],pass:false,reviewedUtc:null};
for(const name of ['probe-battle-notice-layout.mjs','battle-notice-layout.mjs','production-candidate-fixture.mjs']){const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);report.snapshots.push({name,sha256:hash(bytes)});}
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const reduced of [false,true]){
  const mode=reduced?'reduced':'normal',dir=resolve(out,mode);await mkdir(dir,{recursive:true});
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{deviceScaleFactor:2});
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:2,mobile:false});
  await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
  await page.evaluate(reduced=>{
   const m=window.__depthReview,s=window.__depthScene;m.state.settings.reducedMotion=reduced;m.paused=true;m.notify(false);
   for(const animation of document.getAnimations())animation.pause();s.time=20.3;s.phaseNoticeAt=-100;s.dirty=true;s.raf=requestAnimationFrame(s.loop);
   const canvas=s.renderer.domElement,gl=canvas.getContext('webgl2'),extension=gl.getExtension('WEBGL_lose_context');if(!extension)throw Error('WEBGL_lose_context unavailable');
   const audit=globalThis.__cxvNotice={canvas,gl,extension,lost:0,restored:0};canvas.addEventListener('webglcontextlost',()=>audit.lost++);canvas.addEventListener('webglcontextrestored',()=>audit.restored++);
  },reduced);
  const measure=()=>page.evaluate(()=>{
   const m=window.__depthReview,s=window.__depthScene,a=globalThis.__cxvNotice,rect=n=>n.getBoundingClientRect().toJSON();
   const visible=n=>{const c=getComputedStyle(n),r=n.getBoundingClientRect();return c.display!=='none'&&c.visibility!=='hidden'&&r.width>0&&r.height>0;};
   const notice=document.querySelector('.dp-loading'),text=notice?.querySelector('span')??notice;let glyphs=[];
   if(text){const walker=document.createTreeWalker(text,NodeFilter.SHOW_TEXT);while(walker.nextNode()){const range=document.createRange();range.selectNodeContents(walker.currentNode);glyphs.push(...[...range.getClientRects()].map(r=>r.toJSON()));}}
   const covers=[...document.querySelectorAll('.b3-top,.b3-bottom,.b3-world,.b3-boss,.b3-total,.b3-menu,.b3-skip-plate')].filter(visible).map(n=>({className:n.className,rect:rect(n)}));
   const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
   const intersections=glyphs.flatMap(g=>covers.map(c=>({...c,area:overlap(g,c.rect)}))).filter(c=>c.area>0);
   const buttons=[...document.querySelectorAll('.b3-hud button,.b3-hud select,.b3-statuses [tabindex]')].filter(n=>visible(n)&&!n.disabled).map(n=>{const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{label:n.getAttribute('aria-label')??n.textContent,rect:r.toJSON(),hit:n===hit||n.contains(hit)};});
   const st=notice?getComputedStyle(notice):null;
   return{sceneError:m.sceneError,paused:m.paused,canAct:m.canAct,ready:s.ready,contextLost:a.gl.isContextLost(),lost:a.lost,restored:a.restored,battle:m.battle,plan:m.plan,age:m.animationAt,
    canvas:{width:a.canvas.width,height:a.canvas.height},arena:rect(document.querySelector('.dp-arena')),buttons,covers,
    notice:notice?{text:notice.textContent,className:notice.className,rect:rect(notice),glyphs,intersections,style:{color:st.color,background:st.backgroundColor,font:st.font,zIndex:st.zIndex,pointerEvents:st.pointerEvents}}:null};
  });
  const capture=async name=>{
   await page.mouse.move(0,0);await page.evaluate(()=>document.activeElement?.blur());await page.waitForTimeout(180);
   await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
   const before=await measure(),path=resolve(dir,name+'.png'),dpr=await page.evaluate(()=>devicePixelRatio);
   const shot=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false,clip:{x:0,y:0,width:1280,height:720,scale:1/dpr}});
   const bytes=Buffer.from(shot.data,'base64');await writeFile(path,bytes);assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);
   const rgb=execFileSync('ffmpeg',['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:4*1024*1024});
   const mean=rgb.reduce((a,b)=>a+b,0)/rgb.length,stdDev=Math.sqrt(rgb.reduce((a,b)=>a+(b-mean)**2,0)/rgb.length);assert(stdDev>10);
   const row={mode,name,path,utc:new Date().toISOString(),sha256:hash(bytes),rgbSha256:hash(rgb),mean,stdDev,before,after:await measure()};report.captures.push(row);return row;
  };
  const stateEqual=(a,b)=>{assert.deepEqual(a.battle,b.battle);assert.deepEqual(a.plan,b.plan);assert.equal(a.age,b.age);assert(a.paused&&b.paused);};
  const clear=state=>{assert(state.notice);assert.equal(state.notice.intersections.length,0);assert(state.notice.glyphs.length);for(const r of state.notice.glyphs){assert(r.x>=24&&r.right<=1256&&r.y>=44&&r.bottom<=610);}assert(state.buttons.length>=8&&state.buttons.every(b=>b.hit));};
  await page.waitForTimeout(500);const loaded=await capture('loaded');assert.equal(loaded.after.sceneError,'');
  await page.evaluate(()=>globalThis.__cxvNotice.extension.loseContext());await page.waitForFunction(()=>globalThis.__cxvNotice.lost===1);await page.waitForTimeout(300);
  const lost=await capture(native?'lost':'baseline-lost');assert(lost.after.contextLost&&lost.after.sceneError);stateEqual(loaded.after,lost.after);
  let adjusted=lost;
  if(!native){
   await page.addStyleTag({content:noticeCss});await page.evaluate(()=>{const n=document.querySelector('.dp-loading'),span=document.createElement('span');span.textContent=n.textContent;n.replaceChildren(span);n.classList.add('dp-scene-error');});
   adjusted=await capture('candidate-lost');assert(lost.after.notice.intersections.length>0,'Baseline must reproduce the assigned overlap');
  }
  clear(adjusted.after);stateEqual(loaded.after,adjusted.after);
  await page.getByRole('button',{name:'Read battle guide',exact:true}).click();await page.locator('dialog[open]').waitFor();
  await page.locator('dialog[open] button').first().click();await page.locator('dialog[open]').waitFor({state:'hidden'});
  const menu=page.getByRole('button',{name:'More battle options',exact:true});await menu.click();await page.locator('.b3-menu').waitFor();await page.keyboard.press('Escape');await page.locator('.b3-menu').waitFor({state:'hidden'});
  const controls=await measure();stateEqual(loaded.after,controls);clear(controls);
  await page.evaluate(()=>{const m=window.__depthReview;globalThis.__cxvNotice.savedError=m.sceneError;m.sceneError='Battle preview unavailable. A required scene resource could not be restored. The battle controls remain available while the scene recovers. Resource: '+('original-scene-resource-'.repeat(8))+'.webp';m.notify(false);});
  // React owns the wrapper only in native mode; the experiment patches the longer message identically.
  if(!native)await page.evaluate(()=>{const n=document.querySelector('.dp-loading');if(!n.querySelector('span')){const span=document.createElement('span');span.textContent=n.textContent;n.replaceChildren(span);}n.classList.add('dp-scene-error');});
  const long=await capture('long-notice');clear(long.after);stateEqual(loaded.after,long.after);
  await page.evaluate(()=>{const m=window.__depthReview;m.sceneError=globalThis.__cxvNotice.savedError;m.notify(false);globalThis.__cxvNotice.extension.restoreContext();});
  await page.waitForFunction(()=>globalThis.__cxvNotice.restored===1&&!window.__depthReview.sceneError);await page.waitForTimeout(500);
  const restored=await capture('restored');assert.equal(restored.after.notice,null);stateEqual(loaded.after,restored.after);assert.equal(restored.rgbSha256,loaded.rgbSha256,'Restored full RGB must be exact');
  assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);report.runs.push({mode,baselineIntersections:lost.after.notice.intersections,candidateIntersections:adjusted.after.notice.intersections,controls:controls.buttons,longLines:long.after.notice.glyphs.length,restoredRgbExact:true,errors,blockedRequests});await page.close();
 }
 report.pass=true;report.ended=new Date().toISOString();
}finally{await browser.close();await new Promise(done=>server.httpServer.close(done));await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({out,pass:report.pass,native,runs:report.runs.map(r=>({mode:r.mode,baselineIntersections:r.baselineIntersections.length,candidateIntersections:r.candidateIntersections.length,longLines:r.longLines,restoredRgbExact:r.restoredRgbExact}))}));
