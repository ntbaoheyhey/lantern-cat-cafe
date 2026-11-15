// D6 throwaway method comparison. Learn: reports/v3-feel/LEARN/Q3.md T11/T29-T31.
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='tools/v3craft-lab/q3/raw/D6-study';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5990/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-drills/index.html?drill=D1&revision=2');
 await page.waitForFunction(()=>window.__drill?.ready);
 const result=await page.evaluate(async()=>{
  const p=window.__drill,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  const {CutoutMesh}=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/src/game/rig/cutout.ts');
  p.drill.root.visible=false;const actor=p.actor,original=actor.mesh,source=structuredClone(original.data);
  const textures=original.children.map(m=>m.material.map),W=1280,H=720;
  const target=new T.WebGLRenderTarget(W,H);target.texture.colorSpace=T.SRGBColorSpace;
  const bytes=new Uint8Array(W*H*4),images={},samples=[];
  const shot=()=>{p.renderer.setRenderTarget(null);p.renderer.render(p.scene,p.camera);return p.canvas.toDataURL();};
  const mask=()=>{const visible=p.scene.children.map(o=>[o,o.visible]);visible.forEach(([o])=>o.visible=o===actor.root);p.renderer.setClearColor(0,0);p.renderer.setRenderTarget(target);p.renderer.render(p.scene,p.camera);p.renderer.readRenderTargetPixels(target,0,0,W,H,bytes);visible.forEach(([o,v])=>o.visible=v);p.renderer.setClearColor('#242336',1);p.renderer.setRenderTarget(null);return Uint8Array.from({length:W*H},(_,i)=>bytes[i*4+3]>=128?1:0);};
  const stat=a=>{let count=0,sx=0,sy=0,x0=W,y0=H,x1=-1,y1=-1;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(a[y*W+x]){count++;sx+=x;sy+=y;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}return{count,centre:[sx/count,sy/count],bounds:[x0,y0,x1+1,y1+1]};};
  const iou=(a,b,dx=0,dy=0)=>{let union=0,intersection=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const ax=x+dx,ay=y+dy,bb=ax>=0&&ax<W&&ay>=0&&ay<H?b[ay*W+ax]:0,aa=a[y*W+x];if(aa||bb)union++;if(aa&&bb)intersection++;}return intersection/union;};
  original.pose(0,'');actor.root.updateMatrixWorld(true);const base=mask(),baseStat=stat(base);
  const points=mesh=>Object.fromEntries(['hip','head','arm-r','feet'].map(name=>{const b=mesh.skeleton.findBone(name);return[name,new T.Vector3(b.worldX,b.worldY,0).applyMatrix4(actor.root.matrixWorld).toArray().slice(0,2)];}));
  const basePoints=points(original);images.rest=shot();
  for(const method of ['whole-tilt','layered-parts','weighted-body']){
   const data=structuredClone(source);
   if(method!=='whole-tilt'){
    const feet=data.nodes.find(n=>n.name==='feet'),hip=data.nodes.find(n=>n.name==='hip');
    feet.parent=0;feet.x+=hip.x;feet.y+=hip.y;
   }
   if(method==='weighted-body'){
    const part=data.parts.find(p=>p.name==='body'),hipIndex=data.nodes.findIndex(n=>n.name==='hip'),hip=data.nodes[hipIndex];
    const corners=part.vertices.map((v,i)=>({...v[0],u:part.uv[i*2],v:part.uv[i*2+1]}));
    const x0=Math.min(...corners.map(v=>v.x)),x1=Math.max(...corners.map(v=>v.x));
    const y0=Math.min(...corners.map(v=>v.y)),y1=Math.max(...corners.map(v=>v.y));
    const vertices=[],uv=[],triangles=[],nx=20,ny=24;
    for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
     const u=i/nx,v=j/ny,x=x0+(x1-x0)*u,y=y0+(y1-y0)*v;
     let tu=0,tv=0;for(const c of corners){const k=(c.x===x0?1-u:u)*(c.y===y0?1-v:v);tu+=c.u*k;tv+=c.v*k;}
     let w=Math.max(0,Math.min(1,(y+hip.y-48)/127));w=w*w*(3-2*w);
     vertices.push([{bone:hipIndex,x,y,weight:w},{bone:0,x:x+hip.x,y:y+hip.y,weight:1-w}]);uv.push(tu,tv);
     if(i<nx&&j<ny){const a=j*(nx+1)+i;triangles.push(a,a+1,a+nx+1,a+1,a+nx+2,a+nx+1);}
    }
    Object.assign(part,{vertices,uv,triangles});
   }
   const mesh=new CutoutMesh(data,textures);original.visible=false;actor.root.add(mesh);mesh.renderOrder=10;mesh.children.forEach(o=>o.renderOrder=10);
   for(const pose of ['windup','contact']){
    const wind=pose==='windup';actor.root.rotation.z=method==='whole-tilt'?(wind?6:-6)*Math.PI/180:0;
    const tracks=[];
    const key=(name,property,values)=>tracks.push({node:data.nodes.findIndex(n=>n.name===name),property,keys:[{time:0,...values}]});
    if(method!=='whole-tilt'){
     key('hip','rotate',{value:wind?8:-5});key('hip','translate',{x:wind?-10:15,y:wind?-12:-3});
     key('head','rotate',{value:wind?-7:6});key('arm-r','rotate',{value:wind?24:-26});
     key('arm-l','rotate',{value:wind?-16:12});key('tail','rotate',{value:wind?12:-10});
    }
    data.clips.study={duration:1,tracks,visibility:[],events:[]};mesh.pose(0,'study');actor.root.updateMatrixWorld(true);
    const pixels=mask(),s=stat(pixels),joints=points(mesh),delta=Object.fromEntries(Object.entries(joints).map(([name,v])=>[name,Math.hypot(v[0]-basePoints[name][0],v[1]-basePoints[name][1])]));
    const dx=Math.round(s.centre[0]-baseStat.centre[0]),dy=Math.round(s.centre[1]-baseStat.centre[1]);
    samples.push({method,pose,rawIou:iou(base,pixels),translationAlignedIou:iou(base,pixels,dx,dy),...s,joints,delta});images[method+'-'+pose]=shot();
   }
   mesh.removeFromParent();mesh.children.forEach(m=>{m.geometry.dispose();m.material.dispose();});
  }
  original.visible=true;actor.root.rotation.z=0;target.dispose();return{source:actor.source,base:baseStat,basePoints,samples,images};
 });
 for(const [name,data]of Object.entries(result.images))writeFileSync(`${out}/${name}.png`,Buffer.from(data.split(',')[1],'base64'));
 delete result.images;const receipt={at:new Date().toISOString(),errors,method:'Actual original six-part Soot rig at194px height; opaque alpha>=128, raw and centroid-translation-aligned IoU; original setup pose and world joints.',...result};
 writeFileSync('tools/v3craft-lab/q3/pose-study.json',JSON.stringify(receipt,null,2)+'\n');
 console.log(JSON.stringify({at:receipt.at,errors,samples:receipt.samples},null,2));
}finally{await browser.close();}
