/** Current BOARD pixels with each hero's first visible 600ms idle gesture. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from '/Users/bao/taskbar-hero-chain/tools/v5int/production-fixture.mjs';
const integration='/Users/bao/taskbar-hero-chain',out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-A3-current-production-gestures');await mkdir(out,{recursive:true});
const reduced=process.env.CXV_REDUCED==='1',sha=x=>createHash('sha256').update(x).digest('hex');
const board=await readFile('/Users/bao/taskbar-hero-mailbox/BOARD.md','utf8');assert.equal(board.match(/Judge URL:\s*(\S+)/)?.[1],judgeUrl);
const compiled=resolve(out,'helper');await mkdir(compiled,{recursive:true});const entry=resolve(compiled,'entry.ts');
await writeFile(entry,`export {fidgetStart} from '${integration}/apps/web/src/game/rig/secondary-motion.ts';`);
const req=createRequire(resolve(integration,'apps/web/package.json')),{build}=await import(req.resolve('vite'));
await build({root:integration,configFile:false,envDir:false,publicDir:false,logLevel:'silent',build:{emptyOutDir:false,outDir:compiled,minify:false,lib:{entry,formats:['es'],fileName:()=> 'helper.mjs'}}});
const {fidgetStart}=await import(pathToFileURL(resolve(compiled,'helper.mjs')).href);
const report={utc:new Date().toISOString(),url:judgeUrl,source:execFileSync('git',['-C',integration,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),toolSha256:sha(await readFile(new URL(import.meta.url))),gestureSourceSha256:sha(await readFile(resolve(integration,'apps/web/src/game/rig/secondary-motion.ts'))),viewport:{width:1280,height:720},reduced,method:'Actual served production scene at exact seeded onset+0/200/400/600ms per hero. Current source fidgetStart is bundled only to calculate fixture timestamps. Full1280x720 frames precede cropped1024x320 sheets. This is an idle fixture,not ordinary progression or a measured reference-video yaw angle.',rows:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'));report.blockedRequests=blockedRequests;
 await page.evaluate(reduced=>{const s=window.__depthScene,m=window.__depthReview;m.plan=null;m.animationAt=0;m.state.settings.reducedMotion=reduced;m.notify(false);cancelAnimationFrame(s.raf);for(const e of s.actors.values())e.hurtAt=-100;},reduced);
 await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
 const actors=await page.evaluate(()=>{
  const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),frame:null,fixedTime:20,paused:true,galleryPreview:true},0);s.phaseNoticeAt=-100;
  return [...s.actors].filter(([,e])=>['mochi','soot','clover','panko'].includes(e.asset)).map(([id,e])=>{const d=e.craftPose.drawing,b=s.anchors.find(a=>a.id===id).body,x=Math.max(0,Math.floor(b.x-36)),y=Math.max(0,Math.floor(b.y-30));return{id,owner:e.asset,seed:d.secondary.seed,offset:d.secondary.clock-20,clip:{x,y,width:Math.min(1280-x,Math.ceil(b.width+72)),height:Math.min(720-y,Math.ceil(b.height+60))}};});
 });
 for(const actor of actors){
  let index=0;while(fidgetStart(actor.seed,index)-actor.offset<0)index++;actor.index=index;actor.onset=fidgetStart(actor.seed,index)-actor.offset;
  const dir=resolve(out,actor.owner);await mkdir(dir,{recursive:true});const samples=[];
  for(const [i,age]of [0,.2,.4,.6].entries()){
   samples.push(await page.evaluate(({id,time})=>{const s=window.__depthScene;s.phaseNoticeAt=-100;s.render({...s.view(),frame:null,fixedTime:time,paused:true,galleryPreview:true},0);const d=s.actors.get(id).craftPose.drawing;return{worldTime:time,clock:d.secondary.clock,fidgetAge:d.secondary.fidgetAge,kind:d.secondary.fidgetKind,yawDegrees:d.faceDepth.yaw,pitchDegrees:d.faceDepth.pitch,leftSoftness:d.secondary.leftSoftness,rightSoftness:d.secondary.rightSoftness,blink:d.secondary.leftBlink,feet:d.contactPoints()};},{id:actor.id,time:actor.onset+age+1e-6}));
   await page.screenshot({path:resolve(dir,`full-${i}.png`)});await page.screenshot({path:resolve(dir,`frame-${i}.png`),clip:actor.clip});
  }
  const sheet=resolve(out,actor.owner+'.jpg');execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-threads','1','-filter_threads','1','-i',resolve(dir,'frame-%d.png'),'-vf','scale=256:320:force_original_aspect_ratio=decrease,pad=256:320:(ow-iw)/2:(oh-ih)/2,tile=4x1','-frames:v','1','-q:v','3','-y',sheet]);
  report.rows.push({...actor,samples,sheet,feetStable:samples.every(s=>JSON.stringify(s.feet)===JSON.stringify(samples[0].feet)),reducedDepthZero:reduced?samples.every(s=>s.yawDegrees===0&&s.pitchDegrees===0&&s.leftSoftness===0&&s.rightSoftness===0):undefined});
 }
 report.errors=errors;report.identityAfter=runtimeEvidence();report.servedIndexAfter=sha(await(await fetch(judgeUrl)).text());
 report.pass=!errors.length&&!blockedRequests.length&&report.rows.length===4&&report.rows.every(r=>r.feetStable&&(!reduced||r.reducedDepthZero))&&report.indexSha256===report.identityAfter.indexSha256&&report.indexSha256===report.servedIndexAfter;
}catch(error){report.pass=false;report.error=String(error);}
finally{await browser.close();report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,pass:report.pass,error:report.error,errors:report.errors}));if(!report.pass)process.exitCode=1;}
