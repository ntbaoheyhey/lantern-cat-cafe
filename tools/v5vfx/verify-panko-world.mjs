import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const out=resolve(process.env.CXV_M_OUT??'work/v5/CXV/films/M-V2-panko-world-R1'),film=process.env.CXV_M_FILM==='1',sha=x=>createHash('sha256').update(x).digest('hex');await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),cat:'panko',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},method:'Actual scene feet/root/mesh at30Hz; native Panko body. No performance claim.',modes:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const{page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();report.artifactSha256=sha(await(await page.request.get('http://127.0.0.1:6310/')).body());
 await page.evaluate(async()=>{const{pilotFixture}=await import('/src/game/cardrpg/vfx-layered/fixture.ts'),{configureSequence}=await import('/src/game/cardrpg/battle-v3/sequence.ts'),m=window.__depthReview,f=pilotFixture('panko-2',false,true);m.galleryBattle=f.battle;m.plan=configureSequence(f.plan);m.galleryId='panko-2';m.animationAt=0;m.paused=true;m.sceneStarted=true;m.notify(false);const s=window.__depthScene;cancelAnimationFrame(s.raf);s.ensureActors(s.view());});
 await page.waitForFunction(()=>window.__depthScene.ready&&[...window.__depthScene.actors.values()].some(e=>e.asset==='panko'&&e.craftPose?.drawing));
 const sample=({clock,reduced,action=null})=>page.evaluate(({clock,reduced,action})=>{const s=window.__depthScene,m=window.__depthReview;m.state.settings.reducedMotion=reduced;m.animationAt=Math.max(0,Math.min(action??0,m.plan.duration));for(const e of s.actors.values())e.hurtAt=-100;const v=s.view();s.render({...v,frame:action===null||action<0||action>=m.plan.duration?null:v.frame,fixedTime:clock,reducedMotion:reduced,paused:true,galleryPreview:true},0);const e=s.actors.get(m.plan.actorId),d=e.craftPose.drawing;const feet=d.contactPoints().flatMap(p=>{const v=s.scratch.set(p.x,p.y,0);d.localToWorld(v);return[v.x,v.y];});return{feet,root:e.actor.root.matrixWorld.toArray(),vertices:Array.from(d.geometry.attributes.position.array),pose:s.sampled.get(m.plan.actorId).name,at:s.sampled.get(m.plan.actorId).at,clock:d.secondary.clock};},{clock,reduced,action});
 const delta=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
 for(const reduced of [true,false]){
  const mode=reduced?'reduced':'candidate',dir=resolve(out,mode),rows=[];await mkdir(dir,{recursive:true});const start=await sample({clock:20,reduced}),end=await sample({clock:30,reduced});
  const box=await page.evaluate(()=>{const s=window.__depthScene,m=window.__depthReview,body=s.anchors.find(a=>a.id===m.plan.actorId).body;return{x:Math.max(0,Math.floor(body.x-32)),y:Math.max(0,Math.floor(body.y-32)),width:Math.ceil(body.width+64),height:Math.ceil(body.height+64),body};});
  let maxFootWorldDelta=0;
  if(film&&!reduced)await mkdir(resolve(dir,'frames'),{recursive:true});
  for(let i=0;i<=300;i++){const r=await sample({clock:20+i/30,reduced});maxFootWorldDelta=Math.max(maxFootWorldDelta,delta(start.feet,r.feet));rows.push({t:i/30,feet:r.feet,root:r.root,clock:r.clock});if(film&&!reduced&&i<300)await page.screenshot({path:resolve(dir,'frames',`${String(i).padStart(3,'0')}.png`)});}
  await writeFile(resolve(dir,'world.json'),JSON.stringify(rows));
  report.modes.push({mode,box,maxFootWorldDelta,seamRootDelta:delta(start.root,end.root),seamMeshDelta:delta(start.vertices,end.vertices),seamFootDelta:delta(start.feet,end.feet)});
  if(film&&!reduced)execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-framerate','30','-i',resolve(dir,'frames/%03d.png'),'-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-y',resolve(dir,'panko-1280x720.mp4')]);
 }
 report.contract=await page.evaluate(()=>{const m=window.__depthReview,e=window.__depthScene.actors.get(m.plan.actorId);return{duration:m.plan.duration,hit:m.plan.beats[2].start,skill:e.actor.duration('skill'),ult:e.actor.duration('ult'),ultHit:e.actor.cues('ult').find(c=>c.name==='hit')?.time};});
 report.handoffs=[];report.hits=[];
 for(const reduced of [false,true]){
  const hit=await sample({clock:20+report.contract.hit/1000,reduced,action:report.contract.hit});report.hits.push({reduced,pose:hit.pose,at:hit.at});
  for(const boundary of [0,report.contract.duration]){const a=await sample({clock:20+(boundary-.0001)/1000,reduced,action:boundary-.0001}),b=await sample({clock:20+boundary/1000,reduced,action:boundary});report.handoffs.push({reduced,boundary,meshDelta:delta(a.vertices,b.vertices),rootDelta:delta(a.root,b.root),footDelta:delta(a.feet,b.feet)});}
 }
 report.errors=errors;report.pass=!errors.length&&report.modes.every(r=>r.maxFootWorldDelta<1e-5&&r.seamRootDelta<1e-5&&r.seamMeshDelta<1e-4)&&report.handoffs.every(r=>r.meshDelta<.001&&r.rootDelta<.001)&&report.hits.every(r=>r.pose==='skill'&&Math.abs(r.at-.55)<1e-8)&&report.contract.ult===2.2&&report.contract.ultHit===1.1;
}catch(e){report.pass=false;report.error=String(e);process.exitCode=1;}finally{await browser.close();report.completedUTC=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({out,pass:report.pass,error:report.error,completedUTC:report.completedUTC}));}
