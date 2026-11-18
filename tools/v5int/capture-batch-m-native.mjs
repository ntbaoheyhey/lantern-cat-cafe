/** CXI current-production acceptance adapted from CXV native measurements; no dev module requests. */
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './production-fixture.mjs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const cat=process.env.CXI_M_CAT??'mallow',out=resolve(process.env.CXI_M_OUT??`work/v5/CXI/batch-m/${cat}-production-r1`),hash=x=>createHash('sha256').update(x).digest('hex');await mkdir(out,{recursive:false});
const report={utc:new Date().toISOString(),cat,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},method:'Actual native pilot and real rules fixture, deterministic simulation30Hz. No performance claim.',modes:[]};
const castOnly=false;
const root=resolve(import.meta.dirname,'../..'),req=createRequire(resolve(root,'apps/web/package.json'));
await writeFile(resolve(out,'fixture.ts'),`export {pilotFixture} from '${root}/apps/web/src/game/cardrpg/vfx-layered/fixture';\nexport {configureSequence} from '${root}/apps/web/src/game/cardrpg/battle-v3/sequence';\n`);
const {build}=await import(req.resolve('vite'));
await build({configFile:false,root,envDir:false,publicDir:false,logLevel:'silent',resolve:{alias:{'@taskbar-hero/game-rules':resolve(root,'packages/game-rules')}},build:{emptyOutDir:false,outDir:out,minify:false,lib:{entry:resolve(out,'fixture.ts'),formats:['es'],fileName:()=> 'fixture.mjs'}}});
const {pilotFixture,configureSequence}=await import(pathToFileURL(resolve(out,'fixture.mjs')).href);
const sharedPath=resolve(root,process.env.CXI_M_PARITY_REPORT??'reports/v5/CXI/evidence/v8-m-mallow-import.json'),sharedRaw=await readFile(sharedPath);report.sharedCodeParity={path:sharedPath,sha256:hash(sharedRaw),...JSON.parse(sharedRaw)};assert(report.sharedCodeParity.pass);
report.buildSource=process.env.CXI_M_BUILD_SOURCE;assert(report.buildSource,'CXI_M_BUILD_SOURCE must identify the production build');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();report.artifactSha256=hash(await(await page.request.get(judgeUrl)).body());
 for(const mode of castOnly?[]:['reduced','candidate']){
  const reduced=mode==='reduced',dir=resolve(out,mode);await mkdir(dir,{recursive:true});
  await page.evaluate(({cat,reduced,f})=>{const m=window.__depthReview;m.galleryBattle=f.battle;m.plan=null;m.galleryId=cat+'-1';m.paused=true;m.sceneStarted=true;m.state.settings.reducedMotion=reduced;m.notify(false);const s=window.__depthScene;cancelAnimationFrame(s.raf);s.ensureActors(s.view());},{cat,reduced,f:pilotFixture(cat+'-1')});
  await page.waitForFunction(cat=>window.__depthScene.ready&&[...window.__depthScene.actors.values()].some(e=>e.asset===cat&&e.actor.mesh?.livingCat===cat),cat,{timeout:90000});
  const geometry=await page.evaluate(({cat,reduced})=>{
   const e=[...window.__depthScene.actors.values()].find(e=>e.asset===cat),m=e.actor.mesh;m.livingReducedMotion=reduced;
   const buffers=()=>m.batches.map(b=>Array.from(b.positions)),rows=[],boundaries=[],names=['leg_l','leg_r','head','tail_3','weapon','torso'];
   for(let n=0;n<=300;n++){m.proceduralTime=n/30;m.pose(0,'idle');rows.push({t:n/30,points:names.map(name=>{const b=m.skeleton.findBone(name);return{x:b.worldX,y:b.worldY};}),vertices:n%30===0?buffers():undefined});}
   for(const clock of [.9,1.3,4.57])for(const at of [0,1]){m.proceduralTime=clock;m.pose(0,'idle');const a=buffers().flat();m.pose(at,'skill');const b=buffers().flat();boundaries.push({clock,at,maxDelta:Math.max(...a.map((v,i)=>Math.abs(v-b[i])))});}
   return{height:m.data.bounds.height,pointNames:names,samples:rows,boundaries,idleDuration:e.actor.duration('idle'),skillDuration:e.actor.duration('skill'),skillCues:e.actor.cues('skill')};
  },{cat,reduced});await writeFile(resolve(dir,'measure.json'),JSON.stringify(geometry));
  const render=t=>page.evaluate(({cat,t})=>{const s=window.__depthScene;for(const e of s.actors.values())e.hurtAt=-100;s.render({...s.view(),frame:null,fixedTime:t,paused:true,galleryPreview:true},0);const e=[...s.actors.values()].find(e=>e.asset===cat),m=e.actor.mesh,feet=[];for(const batch of m.batches)for(const{part,offset}of batch.parts)if(part.name.startsWith('foot-'))for(let i=0;i<part.vertices.length;i++){const p=batch.positions,j=(offset+i)*3,v=s.scratch.set(p[j],p[j+1],0);e.actor.root.localToWorld(v);feet.push(v.x,v.y);}return{clock:m.proceduralTime,feet,vertices:m.batches.map(b=>Array.from(b.positions)),root:e.actor.root.matrixWorld.toArray()};},{cat,t});
  const start=await render(20),end=await render(30),flat=a=>a.flat(),delta=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
  const box=await page.evaluate(cat=>{const s=window.__depthScene,id=[...s.actors].find(([,e])=>e.asset===cat)[0],body=s.anchors.find(a=>a.id===id).body;return{x:Math.max(0,Math.floor(body.x-32)),y:Math.max(0,Math.floor(body.y-32)),width:Math.ceil(body.width+64),height:Math.ceil(body.height+64),body};},cat);
  const{body,...clip}=box;let maxFootDelta=0;
  if(!reduced){const frames=resolve(dir,'frames');await mkdir(frames,{recursive:true});for(let i=0;i<300;i++){const row=await render(20+i/30);maxFootDelta=Math.max(maxFootDelta,delta(start.feet,row.feet));await page.screenshot({path:resolve(frames,`${String(i).padStart(3,'0')}.png`)});}execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-framerate','30','-i',resolve(frames,'%03d.png'),'-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-y',resolve(dir,`${cat}-1280x720.mp4`)]);
   const times=[.9,1,1.1,1.3,1.58,1.74,1.9,2.1];for(let i=0;i<times.length;i++){await render(20-start.clock%10+times[i]);await page.screenshot({path:resolve(dir,`blink-${i}.png`),clip});}execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',resolve(dir,'blink-%d.png'),'-vf','scale=128:224:force_original_aspect_ratio=decrease,pad=128:224:(ow-iw)/2:(oh-ih)/2,tile=8x1','-frames:v','1','-y',resolve(dir,'blink-sheet.jpg')]);
  }else for(let i=0;i<=300;i++){const row=await render(20+i/30);maxFootDelta=Math.max(maxFootDelta,delta(start.feet,row.feet));}
  report.modes.push({mode,box,measure:resolve(dir,'measure.json'),boundaries:geometry.boundaries,maxFootWorldDelta:maxFootDelta,seamMeshDelta:delta(flat(start.vertices),flat(end.vertices)),seamRootDelta:delta(start.root,end.root)});
 }
 const castFixture=pilotFixture(cat+'-2',false,true);castFixture.plan=configureSequence(castFixture.plan);
 await page.evaluate(({cat,f})=>{const m=window.__depthReview;m.galleryBattle=f.battle;m.plan=f.plan;m.galleryId=cat+'-2';m.animationAt=0;m.paused=true;m.state.settings.reducedMotion=false;m.notify(false);window.__depthScene.ensureActors(window.__depthScene.view());},{cat,f:castFixture});
 await page.waitForFunction(()=>window.__depthScene.ready);const dir=resolve(out,'cast');await mkdir(dir,{recursive:true});
 report.cast=await page.evaluate(()=>{const p=window.__depthReview.plan;return{duration:p.duration,hit:p.beats[2].start,skillId:p.skillId,samples:[]};});
 for(let ms=0,i=0;ms<=report.cast.duration+300;ms+=1000/30,i++){const row=await page.evaluate(ms=>{const m=window.__depthReview,s=window.__depthScene;m.animationAt=Math.min(ms,m.plan.duration);const v=s.view();for(const e of s.actors.values())e.hurtAt=-100;s.render({...v,frame:ms>=m.plan.duration?null:v.frame,fixedTime:20+ms/1000,paused:true,galleryPreview:true},0);const selected=s.sampled.get(m.plan.actorId);return{ms,pose:selected.name,at:selected.at};},ms);report.cast.samples.push(row);await page.screenshot({path:resolve(dir,`${String(i).padStart(3,'0')}.png`)});}
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-framerate','30','-i',resolve(dir,'%03d.png'),'-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-y',resolve(dir,`${cat}-cast-1280x720.mp4`)]);
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',resolve(dir,`${cat}-cast-1280x720.mp4`),'-vf',`fps=4/${report.cast.duration/1000},scale=512:288,tile=2x2`,'-frames:v','1','-y',resolve(dir,'cast-sheet.jpg')]);
 report.cast.exactHit=await page.evaluate(ms=>{const m=window.__depthReview,s=window.__depthScene;m.animationAt=ms;s.render({...s.view(),fixedTime:20+ms/1000,paused:true,galleryPreview:true},0);const row=s.sampled.get(m.plan.actorId);return{ms,pose:row.name,at:row.at};},report.cast.hit);
 report.cast.pass=report.cast.samples.filter(s=>s.ms<report.cast.duration).every(s=>s.pose==='skill')&&report.cast.exactHit.pose==='skill'&&Math.abs(report.cast.exactHit.at-.55)<1e-8;
 report.cast.handoffs=await page.evaluate(()=>{const m=window.__depthReview,s=window.__depthScene,rows=[];for(const reduced of [false,true]){m.state.settings.reducedMotion=reduced;for(const boundary of [0,m.plan.duration]){const snapshots=[];for(const ms of [boundary-.0001,boundary]){m.animationAt=Math.max(0,Math.min(ms,m.plan.duration));const v=s.view();s.render({...v,frame:ms<0||ms>=m.plan.duration?null:v.frame,fixedTime:20+ms/1000,paused:true,galleryPreview:true},0);const e=s.actors.get(m.plan.actorId),mesh=e.actor.mesh;snapshots.push({clock:mesh.proceduralTime,points:mesh.batches.flatMap(b=>Array.from(b.positions)),root:e.actor.root.matrixWorld.toArray()});}const [a,b]=snapshots;rows.push({reduced,boundary,clockDelta:b.clock-a.clock,maxMeshDelta:Math.max(...a.points.map((v,i)=>Math.abs(v-b.points[i]))),maxRootDelta:Math.max(...a.root.map((v,i)=>Math.abs(v-b.root[i])))});}}return rows;});
 report.cast.reducedHit=await page.evaluate(ms=>{const m=window.__depthReview,s=window.__depthScene;m.state.settings.reducedMotion=true;m.animationAt=ms;s.render({...s.view(),fixedTime:20+ms/1000,paused:true,galleryPreview:true},0);const row=s.sampled.get(m.plan.actorId);return{ms,pose:row.name,at:row.at};},report.cast.hit);
 report.cast.pass=report.cast.pass&&report.cast.reducedHit.pose==='skill'&&Math.abs(report.cast.reducedHit.at-.55)<1e-8&&report.cast.handoffs.every(r=>r.maxMeshDelta<.001&&r.maxRootDelta<.001);
 report.errors=errors;report.pass=(!castOnly||report.idleEvidence.pass)&&report.cast.pass&&!errors.length&&report.sharedCodeParity.pass&&report.modes.every(m=>m.maxFootWorldDelta<1e-5&&m.seamMeshDelta<1e-4&&m.seamRootDelta<1e-5&&m.boundaries.every(b=>b.maxDelta===0));
}catch(e){report.pass=false;report.error=String(e);process.exitCode=1;}finally{await browser.close();report.completedUTC=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({out,pass:report.pass,error:report.error,completedUTC:report.completedUTC}));}
