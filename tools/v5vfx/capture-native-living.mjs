import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const cat=process.env.CXV_M_CAT??'mallow',out=resolve(process.env.CXV_M_OUT??`work/v5/CXV/films/M-V2-${cat}-native-R1`),hash=x=>createHash('sha256').update(x).digest('hex');await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),cat,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},method:'Actual native pilot and real rules fixture, deterministic simulation30Hz. No performance claim.',modes:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();report.artifactSha256=hash(await(await page.request.get('http://127.0.0.1:6310/')).body());
 report.sootParity=[];
 for(const reduced of [false,true]){
  const current=await page.evaluate(reduced=>{const d=[...window.__depthScene.actors.values()].find(e=>e.asset==='soot').craftPose.drawing,points=[...d.frame.feet,d.frame.sockets.head,...(d.frame.overlap??[]).map(o=>o.center)],samples=[];for(let n=0;n<=300;n++){const t=n/30;d.sample('idle',t%3.6,reduced,undefined,t,0);samples.push({t,points:points.map(p=>({...d.point(p)})),blink:[d.secondary.leftBlink,d.secondary.rightBlink],signals:[d.secondary.body,d.secondary.turn,d.secondary.tilt],vertices:n%30===0?Array.from(d.geometry.attributes.position.array):undefined});}return{cat:'soot',height:d.set.manifest.opaqueHeight*d.pixelScale,points:['footLeft','footRight','head',...(d.frame.overlap??[]).map(o=>o.part)],samples};},reduced);
  const base=JSON.parse(await readFile(`work/v5/CXV/films/M-V1-panko-native-R3/${reduced?'reduced':'candidate'}/measure.json`,'utf8')).find(r=>r.cat==='soot');report.sootParity.push({reduced,exact:JSON.stringify(current)===JSON.stringify(base),sha256:hash(JSON.stringify(current))});
 }
 for(const mode of ['reduced','candidate']){
  const reduced=mode==='reduced',dir=resolve(out,mode);await mkdir(dir,{recursive:true});
  await page.evaluate(async({cat,reduced})=>{const{pilotFixture}=await import('/src/game/cardrpg/vfx-layered/fixture.ts'),m=window.__depthReview;const f=pilotFixture(cat+'-1');m.galleryBattle=f.battle;m.plan=null;m.galleryId=cat+'-1';m.paused=true;m.sceneStarted=true;m.state.settings.reducedMotion=reduced;m.notify(false);const s=window.__depthScene;cancelAnimationFrame(s.raf);s.ensureActors(s.view());},{cat,reduced});
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
 await page.evaluate(async cat=>{const{pilotFixture}=await import('/src/game/cardrpg/vfx-layered/fixture.ts'),{configureSequence}=await import('/src/game/cardrpg/battle-v3/sequence.ts'),m=window.__depthReview,f=pilotFixture(cat+'-2',false,true);m.galleryBattle=f.battle;m.plan=configureSequence(f.plan);m.galleryId=cat+'-2';m.animationAt=0;m.paused=true;m.state.settings.reducedMotion=false;m.notify(false);window.__depthScene.ensureActors(window.__depthScene.view());},cat);
 await page.waitForFunction(()=>window.__depthScene.ready);const dir=resolve(out,'cast');await mkdir(dir,{recursive:true});
 report.cast=await page.evaluate(()=>{const p=window.__depthReview.plan;return{duration:p.duration,hit:p.beats[2].start,skillId:p.skillId,samples:[]};});
 for(let ms=0,i=0;ms<=report.cast.duration+300;ms+=1000/30,i++){const row=await page.evaluate(ms=>{const m=window.__depthReview,s=window.__depthScene;m.animationAt=Math.min(ms,m.plan.duration);const v=s.view();for(const e of s.actors.values())e.hurtAt=-100;s.render({...v,frame:ms>=m.plan.duration?null:v.frame,fixedTime:20+ms/1000,paused:true,galleryPreview:true},0);const selected=s.sampled.get(m.plan.actorId);return{ms,pose:selected.name,at:selected.at};},ms);report.cast.samples.push(row);await page.screenshot({path:resolve(dir,`${String(i).padStart(3,'0')}.png`)});}
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-framerate','30','-i',resolve(dir,'%03d.png'),'-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-y',resolve(dir,`${cat}-cast-1280x720.mp4`)]);
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',resolve(dir,`${cat}-cast-1280x720.mp4`),'-vf',`fps=4/${report.cast.duration/1000},scale=512:288,tile=2x2`,'-frames:v','1','-y',resolve(dir,'cast-sheet.jpg')]);
 report.errors=errors;report.pass=!errors.length&&report.sootParity.every(r=>r.exact)&&report.modes.every(m=>m.maxFootWorldDelta<1e-5&&m.seamMeshDelta<1e-4&&m.seamRootDelta<1e-5&&m.boundaries.every(b=>b.maxDelta===0));
}catch(e){report.pass=false;report.error=String(e);process.exitCode=1;}finally{await browser.close();report.completedUTC=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({out,pass:report.pass,error:report.error,completedUTC:report.completedUTC}));}
