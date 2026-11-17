/** Controlled eye closure at a fixed projected head pose, independent of the seeded blink clock. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {runtimeEvidence} from './runtime-evidence.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-A3-blink-ladder');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});const report={utc:new Date().toISOString(),...runtimeEvidence(),rows:[]};
try{
 const{page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();
 for(const owner of (process.env.CXV_HEROES??'mochi,soot,clover,panko').split(',')){
  const files=[],counts=[];
  for(const [index,closure]of [0,.5,.9,1].entries()){
   const clip=await page.evaluate(({owner,closure})=>{const s=window.__depthScene,m=window.__depthReview;m.plan=null;m.animationAt=0;const e=[...s.actors.values()].find(e=>e.asset===owner),d=e.craftPose.drawing;d.expression.original??=d.expression.sample;d.expression.sample=(face,canvas)=>d.expression.original(face,canvas,closure,closure);s.phaseNoticeAt=-100;s.render({...s.view(),frame:null,fixedTime:1.003106305,paused:true,galleryPreview:true},0);const[fx,fy,fw,fh]=d.frame.face;const corners=[[fx-15,fy-15],[fx+fw+15,fy+fh+15]].map(p=>{const q=d.point(p);return s.screen(d.localToWorld(s.scratch.clone().set(q.x,q.y,0)));});const x=Math.floor(Math.min(...corners.map(p=>p.x))),y=Math.floor(Math.min(...corners.map(p=>p.y)));return{x,y,width:Math.ceil(Math.abs(corners[1].x-corners[0].x)),height:Math.ceil(Math.abs(corners[1].y-corners[0].y))};},{owner,closure});
   const file=resolve(out,`${owner}-${index}.png`);await page.screenshot({path:file,clip});files.push(file);const px=await sharp(file).removeAlpha().raw().toBuffer();let turquoise=0;for(let i=0;i<px.length;i+=3)if(px[i+1]>px[i]*1.15&&px[i+2]>px[i]*1.05&&px[i+1]>65)turquoise++;counts.push({closure,turquoise,clip});
  }
  const sheet=resolve(out,owner+'.jpg');execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...files.flatMap(f=>['-i',f]),'-filter_complex','[0:v]scale=256:200:force_original_aspect_ratio=decrease,pad=256:200:(ow-iw)/2:(oh-ih)/2[a];[1:v]scale=256:200:force_original_aspect_ratio=decrease,pad=256:200:(ow-iw)/2:(oh-ih)/2[b];[2:v]scale=256:200:force_original_aspect_ratio=decrease,pad=256:200:(ow-iw)/2:(oh-ih)/2[c];[3:v]scale=256:200:force_original_aspect_ratio=decrease,pad=256:200:(ow-iw)/2:(oh-ih)/2[d];[a][b][c][d]hstack=inputs=4[v]','-map','[v]','-frames:v','1',sheet]);report.rows.push({owner,sheet,counts});
 }
 report.errors=errors;await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
