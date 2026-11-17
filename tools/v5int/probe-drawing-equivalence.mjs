/** Exact loaded-drawing geometry and GPU output across a production change. */
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {chromium,config,openFixture,runtimeEvidence} from './production-fixture.mjs';

const label=process.argv[2],compare=process.argv[3];
assert(/^[a-z0-9-]+$/.test(label??''));
const out=resolve('work/v5/CXI/drawing-equivalence',label);
assert(!existsSync(out),'Use a fresh evidence label');await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},method:'Diagnostic frozen poses on the exact production judge URL. Original vertex buffers, sockets, face corners and feet across pose boundaries/reduced motion; isolated actor-root GPU RGBA at five drawings and two clocks. Not ordinary gameplay or FPS evidence.',motion:[],gpu:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const id of ['wave3','boss']){
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id===id));report.url=page.url();
  const rows=await page.evaluate(async id=>{
   const s=window.__depthScene,m=window.__depthReview,motion=[],gpu=[];
   const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
   cancelAnimationFrame(s.raf);m.plan=null;m.animationAt=0;s.render({...s.view(),frame:null,fixedTime:30,paused:true,galleryPreview:true},0);
   const cases={idle:[0,.3,.6,1.003106305,2.4,8.2],attack:[0,.05,.27,.3,.329,.33,.35,.439,.44,.56,.799],ult:[.29,.3,.6,1.1,1.189,1.19,1.759,1.76,1.8,2.199],hurt:[0,.089,.09,.179,.18,.399],ko:[.3],victory:[1]};
   for(const [actorId,e]of s.actors){
    const d=e.craftPose?.drawing;if(!d)continue;
    for(const reduced of [false,true])for(const [clip,times]of Object.entries(cases))for(const at of times){
     d.sample(clip,at,reduced,undefined,30+at,.7);
     const a=d.geometry.attributes.position.array;
     motion.push({fixture:id,actorId,asset:e.asset,clip,at,reduced,key:d.key,vertexSha256:await hash(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)),sockets:Object.fromEntries(Object.entries(d.frame.sockets).map(([name,p])=>[name,d.point(p)])),face:d.faceCorners(),feet:d.contactPoints()});
    }
   }
   const width=s.width,height=s.height,data=new Uint8Array(width*height*4),visible=s.scene.children.map(n=>[n,n.visible]),background=s.scene.background;
   const color=s.renderer.getClearColor([...s.actors.values()].find(e=>e.craftPose?.drawing).craftPose.drawing.material.color.clone()),alpha=s.renderer.getClearAlpha(),gl=s.renderer.getContext();
   try{
    s.scene.background=null;s.renderer.setClearColor(0,0);
    for(const [actorId,e]of s.actors){
     const d=e.craftPose?.drawing;if(!d)continue;
     for(const [n,v]of visible)n.visible=v&&n===e.actor.root;
     for(const clock of [30,30.6])for(const [key,clip,at]of [['K0','idle',0],['K1','attack',.1],['K2','attack',.4],['K5','ult',1.1],['K4','hurt',0]]){
      d.sample(clip,at,false,undefined,clock);e.actor.root.updateMatrixWorld(true);
      if(d.key!==key)throw Error('Unexpected drawing '+d.key+' for '+key);
      s.renderer.clear();s.renderer.render(s.scene,s.camera);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,data);
      let painted=0,minX=width,maxX=-1,minY=height,maxY=-1;
      for(let p=3;p<data.length;p+=4)if(data[p]>8){const n=(p-3)/4,x=n%width,y=height-1-Math.floor(n/width);painted++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
      gpu.push({fixture:id,actorId,asset:e.asset,key,clock,width,height,painted,bounds:{minX,maxX,minY,maxY},pixelSha256:await hash(data)});
     }
    }
   }finally{s.renderer.setClearColor(color,alpha);s.scene.background=background;for(const[n,v]of visible)n.visible=v;}
   return{motion,gpu};
  },id);
  report.motion.push(...rows.motion);report.gpu.push(...rows.gpu);report.errors.push(...errors,...blockedRequests);await page.close();
 }
 const sort=rows=>rows.sort((a,b)=>JSON.stringify([a.fixture,a.actorId,a.clip,a.at,a.reduced,a.key,a.clock]).localeCompare(JSON.stringify([b.fixture,b.actorId,b.clip,b.at,b.reduced,b.key,b.clock])));
 sort(report.motion);sort(report.gpu);
 if(compare){
  const before=JSON.parse(await readFile(resolve(compare),'utf8'));report.differences=[];
  for(const kind of ['motion','gpu']){
   sort(before[kind]);assert.equal(report[kind].length,before[kind].length,kind+' count');
   for(let i=0;i<report[kind].length;i++)if(JSON.stringify(report[kind][i])!==JSON.stringify(before[kind][i]))report.differences.push({kind,index:i,expected:before[kind][i],actual:report[kind][i]});
  }
  if(report.differences.length)report.errors.push(report.differences.length+' equivalence differences');else report.exactMatchTo=resolve(compare);
 }
 report.ended=new Date().toISOString();report.pass=report.motion.length>=500&&report.gpu.length>=40&&report.gpu.every(r=>r.painted>0)&&!report.errors.length;
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({out,pass:report.pass,motion:report.motion.length,gpu:report.gpu.length,exactMatchTo:report.exactMatchTo,errors:report.errors}));assert(report.pass);
}finally{await browser.close();}
