/** Onset-aligned production rig review; deterministic stills, never gameplay footage. */
import assert from 'node:assert/strict';
import {chromium,config,openFixture,runtimeEvidence} from './production-fixture.mjs';
import {fidgetStart} from '../../apps/web/src/game/rig/secondary-motion.ts';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),label=process.argv[2];
assert(/^[a-z0-9-]+$/.test(label??''));
const out=resolve(root,'work/v5/CXI/face',label),req=createRequire(resolve(root,'apps/web/package.json')),sharp=req('sharp');
try{await access(out);throw new Error('Use a fresh evidence label');}catch(e){if(e.code!=='ENOENT')throw e;}
await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},method:'Official boss fixture at exact production judge URL; first visible seeded gesture per hero, sampled at0/200/400/600ms. Phase banner suppressed only in this paused rig review. Head crops form four rows, Mochi/Soot/Clover/Panko. Not real-time gameplay footage.',rows:[],complete:false};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'));report.url=page.url();
 const actors=await page.evaluate(()=>{
  const s=window.__depthScene,m=window.__depthReview;m.plan=null;m.animationAt=0;
  for(const e of s.actors.values())e.hurtAt=-100;
  s.render({...s.view(),frame:null,fixedTime:20,paused:true,galleryPreview:true},0);s.phaseNoticeAt=-100;
  return ['mochi','soot','clover','panko'].map(owner=>{
   const [id,e]=[...s.actors].find(([,e])=>e.asset===owner),d=e.craftPose.drawing,[fx,fy,fw,fh]=d.frame.face;
   const project=(x,y)=>{const p=d.point([x,y]);return s.screen(d.localToWorld(s.scratch.clone().set(p.x,p.y,0)));};
   const corners=[[fx,fy],[fx+fw,fy],[fx,fy+fh],[fx+fw,fy+fh]].map(([x,y])=>project(x,y));
   const x=Math.max(0,Math.floor(Math.min(...corners.map(p=>p.x))-24)),y=Math.max(0,Math.floor(Math.min(...corners.map(p=>p.y))-24));
   const right=Math.min(1280,Math.ceil(Math.max(...corners.map(p=>p.x))+24)),bottom=Math.min(720,Math.ceil(Math.max(...corners.map(p=>p.y))+24));
   return{id,owner,seed:d.secondary.seed,offset:d.secondary.clock-20,clip:{x,y,width:right-x,height:bottom-y}};
  });
 });
 const tiles=[];
 for(const [row,actor] of actors.entries()){
  let index=0;while(fidgetStart(actor.seed,index)-actor.offset<0)index++;
  const onset=fidgetStart(actor.seed,index)-actor.offset,samples=[];
  for(const [col,age] of [0,.2,.4,.6].entries()){
   samples.push(await page.evaluate(({id,time})=>{
    const s=window.__depthScene;s.render({...s.view(),frame:null,fixedTime:time,paused:true,galleryPreview:true},0);
    const d=s.actors.get(id).craftPose.drawing,[fx,fy,fw,fh]=d.frame.face;
    const project=(x,y)=>{const p=d.point([x,y]);return s.screen(d.localToWorld(s.scratch.clone().set(p.x,p.y,0)));};
    return{worldTime:time,clock:d.secondary.clock,fidgetAge:d.secondary.fidgetAge,yaw:d.faceDepth.yaw,pitch:d.faceDepth.pitch,leftSoftness:d.secondary.leftSoftness,rightSoftness:d.secondary.rightSoftness,blink:d.secondary.leftBlink,feet:d.contactPoints(),face:{left:project(fx,fy+fh*.52),right:project(fx+fw,fy+fh*.52),nose:project(fx+fw*.6,fy+fh*.64)}};
   },{id:actor.id,time:onset+age+1e-6}));
   const frame=resolve(out,actor.owner+'-'+col+'.png');await page.screenshot({path:frame,clip:actor.clip});
   tiles.push({input:await sharp(frame).resize(256,200,{fit:'contain',background:'#171326'}).toBuffer(),left:col*256,top:row*200});
  }
  assert(samples.every(s=>Math.abs(s.yaw)<=10&&Math.abs(s.pitch)<=6));
  assert(samples.some(s=>s.leftSoftness>0));
  report.rows.push({...actor,index,onset,samples});
 }
 report.sheet=resolve(out,'gestures-1024.jpg');
 await sharp({create:{width:1024,height:800,channels:3,background:'#171326'}}).composite(tiles).jpeg({quality:84}).toFile(report.sheet);
 report.errors=errors;report.blockedRequests=blockedRequests;assert.equal(errors.length,0);assert.equal(blockedRequests.length,0);report.complete=true;
}finally{await browser.close();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({label,complete:report.complete,rows:report.rows.length,sheet:report.sheet}));
