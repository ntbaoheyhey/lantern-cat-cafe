import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const out=resolve(process.env.CXV_M_OUT??'work/v5/CXV/films/M-V3-panko-cast-R1'),hash=x=>createHash('sha256').update(x).digest('hex');await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},method:'Real scene with explicit rules archive Panko support fixture; simulation sampled30Hz, not FPS evidence.',runs:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();report.artifactSha256=hash(await(await page.request.get('http://127.0.0.1:6310/')).body());
 report.boundaries=await page.evaluate(()=>{
  const e=[...window.__depthScene.actors.values()].find(e=>e.asset==='panko'),d=e.craftPose.drawing,rows=[];
  for(const reduced of [false,true])for(const clock of [20.4,21.3,23.8])for(const seconds of [0,1]){
   d.sample('idle',clock%3.6,reduced,undefined,clock,.3);const a=Array.from(d.geometry.attributes.position.array),map=d.material.map;
   d.sample('skill',seconds,reduced,undefined,clock,.3);rows.push({reduced,clock,seconds,textureExact:map===d.material.map,maxVertexDelta:Math.max(...a.map((v,i)=>Math.abs(v-d.geometry.attributes.position.array[i])))});
  }return {skillDuration:e.actor.duration('skill'),ultDuration:e.actor.duration('ult'),skillCues:e.actor.cues('skill'),rows};
 });
 report.sootParity=[];
 for(const reduced of [false,true]){
  const current=await page.evaluate(reduced=>{
   const d=[...window.__depthScene.actors.values()].find(e=>e.asset==='soot').craftPose.drawing,points=[...d.frame.feet,d.frame.sockets.head,...(d.frame.overlap??[]).map(o=>o.center)],samples=[];
   for(let n=0;n<=300;n++){const t=n/30;d.sample('idle',t%3.6,reduced,undefined,t,0);samples.push({t,points:points.map(p=>({...d.point(p)})),blink:[d.secondary.leftBlink,d.secondary.rightBlink],signals:[d.secondary.body,d.secondary.turn,d.secondary.tilt],vertices:n%30===0?Array.from(d.geometry.attributes.position.array):undefined});}
   return {cat:'soot',height:d.set.manifest.opaqueHeight*d.pixelScale,points:['footLeft','footRight','head',...(d.frame.overlap??[]).map(o=>o.part)],samples};
  },reduced);
  const baseline=JSON.parse(await readFile(`work/v5/CXV/films/M-V1-panko-native-R3/${reduced?'reduced':'candidate'}/measure.json`,'utf8')).find(r=>r.cat==='soot');report.sootParity.push({reduced,exact:JSON.stringify(current)===JSON.stringify(baseline),sha256:hash(JSON.stringify(current))});
 }
 for(const reduced of [false,true])for(const id of ['panko-2','panko-4']){
  const name=`${id}-${reduced?'reduced':'normal'}`,dir=resolve(out,name);await mkdir(dir,{recursive:true});
  await page.evaluate(async({id,reduced})=>{
   const {pilotFixture}=await import('/src/game/cardrpg/vfx-layered/fixture.ts'),{configureSequence}=await import('/src/game/cardrpg/battle-v3/sequence.ts');
   const f=pilotFixture(id,false,/-[23]$/.test(id)),m=window.__depthReview;m.galleryBattle=f.battle;m.plan=configureSequence(f.plan);m.galleryId=id;m.animationAt=0;m.paused=true;m.sceneStarted=true;m.labOpen=false;m.state.settings.reducedMotion=reduced;m.notify(false);const s=window.__depthScene;cancelAnimationFrame(s.raf);s.ensureActors(s.view());
  },{id,reduced});
  await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length,null,{timeout:90000});
  const info=await page.evaluate(()=>({duration:window.__depthReview.plan.duration,impact:window.__depthReview.plan.beats[2].start}));
  const times=reduced?[0,info.impact*.5,info.impact,info.duration-1,info.duration,info.duration+300]:Array.from({length:Math.ceil((info.duration+500)/1000*30)+1},(_,n)=>n*1000/30);
  const samples=[];
  for(let i=0;i<times.length;i++){
   const ms=times[i],sample=await page.evaluate(ms=>{
    const m=window.__depthReview,s=window.__depthScene;m.animationAt=Math.min(ms,m.plan.duration);const view=s.view();
    s.render({...view,frame:ms>=m.plan.duration?null:view.frame,fixedTime:20+ms/1000,paused:true,galleryPreview:true},0);
    const e=s.actors.get(m.plan.actorId),d=e.craftPose.drawing,selected=s.sampled.get(m.plan.actorId);
    return {ms,pose:selected.name,at:selected.at,key:d.key,feet:d.contactPoints(),head:d.point(d.frame.sockets.head),hand:d.point(d.frame.sockets.offHand),clock:d.secondary.clock,body:s.anchors.find(a=>a.id===m.plan.actorId).body,events:s.eventAudit.filter(a=>a.actorId===m.plan.actorId).slice(-4),draws:s.effects.timeline.audit.draws};
   },ms);samples.push(sample);await page.screenshot({path:resolve(dir,`${String(i).padStart(3,'0')}.png`)});
  }
  const selected=[0,info.impact*.5,info.impact,info.duration+300].map(t=>samples.reduce((best,s,i)=>Math.abs(s.ms-t)<Math.abs(samples[best].ms-t)?i:best,0));
  const inputs=selected.flatMap(i=>['-i',resolve(dir,`${String(i).padStart(3,'0')}.png`)]);
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...inputs,'-filter_complex','[0:v]scale=512:288[a];[1:v]scale=512:288[b];[2:v]scale=512:288[c];[3:v]scale=512:288[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[v]','-map','[v]','-frames:v','1',resolve(out,`${name}.jpg`)]);
  if(!reduced)execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-framerate','30','-i',resolve(dir,'%03d.png'),'-c:v','libx264','-crf','19','-pix_fmt','yuv420p','-y',resolve(out,`${name}.mp4`)]);
  report.runs.push({name,...info,samples,sheet:resolve(out,`${name}.jpg`)});
 }
 report.errors=errors;report.pass=errors.length===0&&report.sootParity.every(r=>r.exact)&&report.boundaries.rows.every(r=>r.textureExact&&r.maxVertexDelta===0);
}catch(e){report.pass=false;report.error=String(e);process.exitCode=1;}finally{await browser.close();report.completedUTC=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({out,pass:report.pass,error:report.error,completedUTC:report.completedUTC}));}
