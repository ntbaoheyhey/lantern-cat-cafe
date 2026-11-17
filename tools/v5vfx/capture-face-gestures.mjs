/** First visible seeded gesture per hero, aligned to onset rather than a shared world time. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-A3-gestures');
await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},method:'Actual first seeded gesture whose onset is visible at world time >=0; each hero sampled at onset+0/200/400/600ms. Different hero clocks are explicit.',rows:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();
 const actors=await page.evaluate(async()=>{
  const {fidgetStart}=await import('/src/game/rig/secondary-motion.ts');
  const s=window.__depthScene,m=window.__depthReview;m.plan=null;m.animationAt=0;
  for(const e of s.actors.values())e.hurtAt=-100;
  s.render({...s.view(),frame:null,fixedTime:20,paused:true,galleryPreview:true},0);s.phaseNoticeAt=-100;
  return [...s.actors].filter(([,e])=>['mochi','soot','clover','panko'].includes(e.asset)).map(([id,e])=>{
   const d=e.craftPose.drawing,offset=d.secondary.clock-20,b=s.anchors.find(a=>a.id===id).body;
   let index=0;while(fidgetStart(d.secondary.seed,index)-offset<0)index++;
   const x=Math.max(0,Math.floor(b.x-36)),y=Math.max(0,Math.floor(b.y-30));
   return {id,owner:e.asset,offset,index,onset:fidgetStart(d.secondary.seed,index)-offset,clip:{x,y,width:Math.min(1280-x,Math.ceil(b.width+72)),height:Math.min(720-y,Math.ceil(b.height+60))}};
  });
 });
 for(const actor of actors.filter(a=>!process.env.CXV_HEROES||process.env.CXV_HEROES.split(',').includes(a.owner))){
  const dir=resolve(out,actor.owner);await mkdir(dir,{recursive:true});const samples=[];
  for(const [i,age]of [0,.2,.4,.6].entries()){
   samples.push(await page.evaluate(({id,time})=>{
    const s=window.__depthScene;s.phaseNoticeAt=-100;s.render({...s.view(),frame:null,fixedTime:time,paused:true,galleryPreview:true},0);
    const d=s.actors.get(id).craftPose.drawing,[fx,fy,fw,fh]=d.frame.face;
    const point=(x,y)=>{const p=d.point([x,y]);return s.screen(d.localToWorld(s.scratch.clone().set(p.x,p.y,0)));};
    return {worldTime:time,clock:d.secondary.clock,fidgetAge:d.secondary.fidgetAge,kind:d.secondary.fidgetKind,yawDegrees:d.faceDepth.yaw,pitchDegrees:d.faceDepth.pitch,leftSoftness:d.secondary.leftSoftness,rightSoftness:d.secondary.rightSoftness,blink:d.secondary.leftBlink,feet:d.contactPoints(),face:{left:point(fx,fy+fh*.52),right:point(fx+fw,fy+fh*.52),nose:point(fx+fw*.6,fy+fh*.64)}};
   },{id:actor.id,time:actor.onset+age+1e-6}));
   await page.screenshot({path:resolve(dir,`frame-${i}.png`),clip:actor.clip});
  }
  const sheet=resolve(out,actor.owner+'.jpg');
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-threads','1','-filter_threads','1','-i',resolve(dir,'frame-%d.png'),'-vf','scale=256:320:force_original_aspect_ratio=decrease,pad=256:320:(ow-iw)/2:(oh-ih)/2,tile=4x1','-frames:v','1','-q:v','3','-y',sheet]);
  report.rows.push({...actor,samples,sheet});
 }
 report.errors=errors;report.ended=new Date().toISOString();
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({out,rows:report.rows.length,errors}));if(errors.length)process.exitCode=1;
}finally{await browser.close();}
