/** Own production Batch M acceptance. Deterministic 30 Hz samples are not an FPS claim. */
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './production-fixture.mjs';
import {mkdir,writeFile,readFile,access} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../..'),req=createRequire(resolve(root,'apps/web/package.json'));
const out=resolve(process.env.CXI_M_OUT??'work/v5/CXI/batch-m/panko-production-r1');
try{await access(out);throw Error('Use fresh output');}catch(e){if(e.code!=='ENOENT')throw e;}
await mkdir(out,{recursive:true});
const hash=x=>createHash('sha256').update(x).digest('hex');
const report={utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),buildSource:'912a457c6f0cc6f5e6836efe3130408d8b74e9b8',...runtimeEvidence(),url:judgeUrl,viewport:{width:1280,height:720},method:'Current production scene at exact judge URL; isolated real-rule archives for skill/ult. 30Hz simulation playback at 1x, not measured frame performance.',idle:[],casts:[]};
await writeFile(resolve(out,'fixture.ts'),`export {pilotFixture} from '${root}/apps/web/src/game/cardrpg/vfx-layered/fixture';\nexport {configureSequence} from '${root}/apps/web/src/game/cardrpg/battle-v3/sequence';\n`);
const {build}=await import(req.resolve('vite'));
await build({configFile:false,root,envDir:false,publicDir:false,logLevel:'silent',resolve:{alias:{'@taskbar-hero/game-rules':resolve(root,'packages/game-rules')}},build:{emptyOutDir:false,outDir:out,minify:false,lib:{entry:resolve(out,'fixture.ts'),formats:['es'],fileName:()=> 'fixture.mjs'}}});
const {pilotFixture,configureSequence}=await import(pathToFileURL(resolve(out,'fixture.mjs')).href);
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'));
 report.httpIndexSha256=hash(await(await page.request.get(judgeUrl)).body());assert.equal(report.httpIndexSha256,report.indexSha256);
 const install=async(id,reduced)=>{
  const fixture=pilotFixture(id,false,/-[23]$/.test(id));fixture.plan=configureSequence(fixture.plan);
  await page.evaluate(({fixture,id,reduced})=>{
   const m=window.__depthReview,s=window.__depthScene;m.galleryBattle=fixture.battle;m.tutorialBattle=null;m.plan=fixture.plan;m.galleryId=id;m.animationAt=0;m.paused=true;m.sceneStarted=true;m.labOpen=false;m.state.settings.reducedMotion=reduced;m.notify(false);cancelAnimationFrame(s.raf);s.ensureActors(s.view());
  },{fixture,id,reduced});
  await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length,null,{timeout:90000});
  return fixture;
 };
 const sample=async({time,ms=null})=>page.evaluate(({time,ms})=>{
  const m=window.__depthReview,s=window.__depthScene;if(ms!==null)m.animationAt=Math.min(ms,m.plan.duration);
  const view=s.view();s.render({...view,frame:ms===null||ms>=m.plan.duration?null:view.frame,fixedTime:time,paused:true,galleryPreview:true},0);
  const [id,e]=[...s.actors].find(([,a])=>a.asset==='panko'),d=e.craftPose.drawing;
  const project=p=>{const q=d.point(p);return s.screen(d.localToWorld(s.scratch.clone().set(q.x,q.y,0)));};
  return {time,ms,pose:s.sampled.get(id),key:d.key,feet:d.contactPoints(),screenFeet:d.frame.feet.map(project),head:project(d.frame.sockets.head),body:s.anchors.find(a=>a.id===id).body,height:d.set.manifest.opaqueHeight*d.pixelScale,secondary:{...d.secondary},faceDepth:{yaw:d.faceDepth?.yaw??0,pitch:d.faceDepth?.pitch??0},overlap:(d.frame.overlap??[]).map(o=>({part:o.part,point:project(o.center)}))};
 },{time,ms});
 for(const reduced of [false,true]){
  await install('panko-2',reduced);const dir=resolve(out,`idle-${reduced?'reduced':'normal'}`);await mkdir(dir);
  const samples=[];
  for(let n=0;n<=300;n++){
   samples.push(await sample({time:20+n/30}));
   if(!reduced&&n<300)await page.screenshot({path:resolve(dir,`${String(n).padStart(3,'0')}.png`)});
   if(reduced&&[0,100,200,300].includes(n))await page.screenshot({path:resolve(dir,`${String(n).padStart(3,'0')}.png`)});
  }
  report.idle.push({reduced,dir,samples});
  if(!reduced)execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','30','-i',resolve(dir,'%03d.png'),'-c:v','libx264','-crf','19','-pix_fmt','yuv420p',resolve(out,'panko-idle.mp4')]);
 }
 for(const reduced of [false,true])for(const id of ['panko-2','panko-4']){
  const f=await install(id,reduced),dir=resolve(out,`${id}-${reduced?'reduced':'normal'}`);await mkdir(dir);
  const duration=f.plan.duration,impact=f.plan.beats[2].start;
  const times=reduced?[0,impact/2,impact,duration-1,duration,duration+300]:Array.from({length:Math.ceil((duration+500)*.03)+1},(_,n)=>n*1000/30);
  // Explicit contact time, even when it lies between 30Hz film frames.
  const contact=await sample({time:20+impact/1000,ms:impact});
  const samples=[];
  for(let n=0;n<times.length;n++){
   const ms=times[n];samples.push(await sample({time:20+ms/1000,ms}));await page.screenshot({path:resolve(dir,`${String(n).padStart(3,'0')}.png`)});
  }
  const indices=[0,impact/2,impact,duration+300].map(t=>samples.reduce((b,s,i)=>Math.abs(s.ms-t)<Math.abs(samples[b].ms-t)?i:b,0));
  const sheet=resolve(out,`${id}-${reduced?'reduced':'normal'}.jpg`);
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...indices.flatMap(i=>['-i',resolve(dir,`${String(i).padStart(3,'0')}.png`)]),'-filter_complex','[0:v]scale=512:288[a];[1:v]scale=512:288[b];[2:v]scale=512:288[c];[3:v]scale=512:288[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[v]','-map','[v]','-frames:v','1',sheet]);
  if(!reduced)execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','30','-i',resolve(dir,'%03d.png'),'-c:v','libx264','-crf','19','-pix_fmt','yuv420p',resolve(out,`${id}.mp4`)]);
  report.casts.push({id,reduced,duration,impact,contact,samples,sheet});
 }
 report.errors=errors;report.blockedRequests=blockedRequests;assert.equal(errors.length,0);assert.equal(blockedRequests.length,0);
 report.pass=true;
}catch(e){report.pass=false;report.error=String(e.stack??e);process.exitCode=1;}
finally{await browser.close();report.completedUTC=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report)+'\n');console.log(JSON.stringify({out,pass:report.pass,error:report.error,completedUTC:report.completedUTC}));}
