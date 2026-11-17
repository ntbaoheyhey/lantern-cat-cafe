/** V6 living-character comparison, exact judge route; no FPS benchmark. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const out=resolve(process.env.CXV_LIVING_OUT??'work/v5/CXV/films/V-A-baseline');
const mode=process.env.CXV_LIVING_MODE??'idle',reduced=process.env.CXV_LIVING_REDUCED==='1';
const times=JSON.parse(process.env.CXV_LIVING_TIMES??(mode==='hit'?'[30.02,30.1,30.25,30.5]':'[20,20.75,21.5,22.25]'));
const film=process.env.CXV_LIVING_FILM==='1';
await mkdir(out,{recursive:true});
const report={started:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 ...runtimeEvidence(),viewport:{width:1280,height:720},mode,reduced,method:'Current judge route; deterministic paused boss fixture, four samples. Hit mode uses actual scene hurtAt input at30s; optional real-time idle film. No gameplay or performance claim.',samples:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const captureBrowser={newPage:options=>browser.newPage({...options,...film?{recordVideo:{dir:out,size:report.viewport}}:{}})};
 const {page,errors,blockedRequests}=await openFixture(captureBrowser,config.fixtures.find(f=>f.id==='boss'),{url:process.env.CXV_URL??'http://127.0.0.1:6310',fixedClock:false});
 report.url=page.url();
 const boxes=await page.evaluate(()=>{
  const s=window.__depthScene,m=window.__depthReview;m.plan=null;m.animationAt=0;
  for(const entry of s.actors.values())entry.hurtAt=-100;
  s.render({...s.view(),frame:null,fixedTime:20,paused:true,galleryPreview:true},0);
  return [...s.actors].filter(([,e])=>['mochi','soot','clover','panko'].includes(e.asset)).map(([id,e])=>{
   const b=s.anchors.find(a=>a.id===id).body;
   const x=Math.max(0,Math.floor(b.x-36)),y=Math.max(0,Math.floor(b.y-30));
   return {id,owner:e.asset,body:b,clip:{x,y,width:Math.min(1280-x,Math.ceil(b.width+72)),height:Math.min(720-y,Math.ceil(b.height+60))}};
  });
 });
 report.boxes=boxes;
 for(let i=0;i<times.length;i++){
  const sample=await page.evaluate(({time,mode,reduced})=>{
   const s=window.__depthScene;
   if(mode==='hit')for(const e of s.actors.values())e.hurtAt=30;
   s.render({...s.view(),frame:null,fixedTime:time,paused:true,galleryPreview:true,reducedMotion:reduced},0);
   return {time,actors:[...s.actors].filter(([,e])=>['mochi','soot','clover','panko'].includes(e.asset)).map(([id,e])=>{
    const d=e.craftPose.drawing,[fx,fy,fw,fh]=d.frame.face;
    const project=(x,y)=>{const p=d.point([x,y]);return s.screen(d.localToWorld(s.scratch.clone().set(p.x,p.y,0)));};
    const facePoints={outlineLeft:project(fx,fy+fh*.52),outlineRight:project(fx+fw,fy+fh*.52),
     nose:project(fx+fw*.60,fy+fh*.64),leftEye:project(fx+fw*.40,fy+fh*.44),rightEye:project(fx+fw*.74,fy+fh*.40),
     leftEyeEdges:[project(fx+fw*.28,fy+fh*.44),project(fx+fw*.52,fy+fh*.44)],rightEyeEdges:[project(fx+fw*.635,fy+fh*.40),project(fx+fw*.845,fy+fh*.40)]};
    return {id,owner:e.asset,key:d.key,pose:s.sampled.get(id)?.name,clock:d.secondary.clock,head:s.socket(id,'head'),feet:d.contactPoints(),
     facePoints,
     secondary:{...d.secondary},overlap:(d.frame.overlap??[]).map(o=>({part:o.part,point:d.point(o.center)}))};
   })};
  },{time:times[i],mode,reduced});
  report.samples.push(sample);
  await page.screenshot({path:resolve(out,`field-${i}.png`)});
  for(const box of boxes){await mkdir(resolve(out,box.owner),{recursive:true});await page.screenshot({path:resolve(out,box.owner,`frame-${i}.png`),clip:box.clip});}
 }
 for(const box of boxes)execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-threads','1','-filter_threads','1','-i',resolve(out,box.owner,'frame-%d.png'),
  '-vf','scale=256:320:force_original_aspect_ratio=decrease,pad=256:320:(ow-iw)/2:(oh-ih)/2,tile=4x1','-frames:v','1','-q:v','3','-y',resolve(out,box.owner+'.jpg')]);
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-threads','1','-filter_threads','1','-i',resolve(out,'field-%d.png'),
  '-vf','scale=512:288,tile=2x2','-frames:v','1','-q:v','3','-y',resolve(out,'field.jpg')]);
 report.measurement=await page.evaluate(reduced=>{
  const s=window.__depthScene,rows=[];
  for(const [id,e]of s.actors){
   if(!['mochi','soot','clover','panko'].includes(e.asset))continue;
   const d=e.craftPose.drawing,m=d.set.manifest,points=[...d.frame.feet,d.frame.sockets.head,...(d.frame.overlap??[]).map(o=>o.center)];
   const ranges=points.map(()=>({minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity}));let blinks=0,prior=0;
   for(let n=0;n<=720;n++){
    const t=20+n/60;d.sample('idle',t%3.6,reduced,undefined,t,.7);
    if(d.secondary.leftBlink>0&&prior===0)blinks++;prior=d.secondary.leftBlink;
    points.forEach((p,i)=>{const q=d.point(p),r=ranges[i];r.minX=Math.min(r.minX,q.x);r.maxX=Math.max(r.maxX,q.x);r.minY=Math.min(r.minY,q.y);r.maxY=Math.max(r.maxY,q.y);});
   }
   rows.push({owner:e.asset,blinks,unitHeight:m.opaqueHeight*d.pixelScale,ranges:ranges.map(r=>({x:r.maxX-r.minX,y:r.maxY-r.minY}))});
  }return rows;
 },reduced);
 if(film){
  report.filmStarted=new Date().toISOString();
  await page.evaluate(reduced=>new Promise(resolve=>{
   const s=window.__depthScene;let start;
   const frame=now=>{start??=now;const age=(now-start)/1000;s.render({...s.view(),frame:null,fixedTime:20+age,paused:true,galleryPreview:true,reducedMotion:reduced},1/60);if(age<12)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);
  }),reduced);
  const video=page.video();await page.close();await video.saveAs(resolve(out,'idle-1280x720.webm'));report.film=resolve(out,'idle-1280x720.webm');
 }
 report.errors=errors;report.blockedRequests=blockedRequests;report.ended=new Date().toISOString();
 await writeFile(resolve(out,'capture.json'),JSON.stringify(report,null,2));
 process.stdout.write(JSON.stringify({out,sourceCommit:report.sourceCommit,url:report.url,errors,measurement:report.measurement})+'\n');
 if(errors.length)process.exitCode=1;
}finally{await browser.close();}
