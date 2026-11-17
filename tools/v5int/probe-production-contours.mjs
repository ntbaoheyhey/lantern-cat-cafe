/** Bounds produced by the actual production scene, plus isolated actor pixels. */
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium,config,openFixture,runtimeEvidence} from './production-fixture.mjs';
const [label,compare]=process.argv.slice(2);assert(/^[a-z0-9-]+$/.test(label??''));
const out=resolve('work/v5/CXI/contour-equivalence',label);assert(!existsSync(out),'Use fresh evidence label');await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),harnessSha256:createHash('sha256').update(await readFile(import.meta.filename)).digest('hex'),viewport:{width:1280,height:720},method:'Actual production scene render computes opaqueWorld and fitted root transforms. Override only one drawing sample at a time to five authored keys and two frozen clocks, then isolate that actor root for native GPU RGBA. Diagnostic pose sampling, not gameplay/FPS evidence; no unbuilt source imports.',rows:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const fixtureId of ['wave3','boss']){
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id===fixtureId));report.url=page.url();
  const rows=await page.evaluate(async fixtureId=>{
   const s=window.__depthScene,m=window.__depthReview,rows=[];cancelAnimationFrame(s.raf);m.plan=null;m.animationAt=0;
   const view=clock=>({...s.view(),frame:null,fixedTime:clock,paused:true,galleryPreview:true});s.render(view(30),0);
   const visible=s.scene.children.map(n=>[n,n.visible]),background=s.scene.background;
   const sampleColor=[...s.actors.values()].find(e=>e.craftPose?.drawing).craftPose.drawing.material.color.clone();
   const color=s.renderer.getClearColor(sampleColor),alpha=s.renderer.getClearAlpha(),gl=s.renderer.getContext(),data=new Uint8Array(s.width*s.height*4);
   try{
    for(const [actorId,e]of s.actors){
     const d=e.craftPose?.drawing;if(!d)continue;
     for(const clock of [30,30.6])for(const [key,clip,at]of [['K0','idle',0],['K1','attack',.1],['K2','attack',.4],['K5','ult',1.1],['K4','hurt',0]]){
      for(const[n,v]of visible)n.visible=v;s.scene.background=background;s.renderer.setClearColor(color,alpha);
      const original=d.sample;d.sample=function(){return original.call(this,clip,at,false,undefined,clock);};
      try{s.render(view(clock),0);}finally{d.sample=original;}
      if(d.key!==key)throw Error('Unexpected key '+d.key+' for '+key);
      const bounds=structuredClone(e.actor.opaqueWorld),rootMatrix=Array.from(e.actor.root.matrixWorld.elements);
      if(!bounds||bounds.width<=0||bounds.height<=0)throw Error('Missing production opacity bounds');
      for(const[n,v]of visible)n.visible=v&&n===e.actor.root;s.scene.background=null;s.renderer.setClearColor(0,0);
      s.renderer.clear();s.renderer.render(s.scene,s.camera);gl.readPixels(0,0,s.width,s.height,gl.RGBA,gl.UNSIGNED_BYTE,data);
      const pixelSha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),b=>b.toString(16).padStart(2,'0')).join('');
      rows.push({fixture:fixtureId,actorId,asset:e.asset,key,clock,bounds,rootMatrix,pixelSha256});
     }
    }
   }finally{s.scene.background=background;s.renderer.setClearColor(color,alpha);for(const[n,v]of visible)n.visible=v;}
   return rows;
  },fixtureId);
  report.rows.push(...rows);report.errors.push(...errors,...blockedRequests);await page.close();
 }
 const sort=rows=>rows.sort((a,b)=>JSON.stringify([a.fixture,a.actorId,a.key,a.clock]).localeCompare(JSON.stringify([b.fixture,b.actorId,b.key,b.clock])));sort(report.rows);
 if(compare){const before=JSON.parse(await readFile(resolve(compare),'utf8'));sort(before.rows);assert.equal(before.rows.length,report.rows.length);report.differences=report.rows.flatMap((row,i)=>JSON.stringify(row)===JSON.stringify(before.rows[i])?[]:[{i,expected:before.rows[i],actual:row}]);if(report.differences.length)report.errors.push(report.differences.length+' contour differences');else report.exactMatchTo=resolve(compare);}
 report.identityAfter=runtimeEvidence();report.pass=report.rows.length===130&&report.indexSha256===report.identityAfter.indexSha256&&!report.errors.length;report.ended=new Date().toISOString();
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({out,pass:report.pass,rows:report.rows.length,exactMatchTo:report.exactMatchTo,errors:report.errors}));assert(report.pass);
}finally{await browser.close();}
