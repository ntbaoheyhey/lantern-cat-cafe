// D7 own-content method trial. Learn: LEARN/Q3.md T11/T12/T29/T32/T33.
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='tools/v3craft-lab/q3/raw/D7-study';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5990/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-drills/index.html?drill=D1&revision=2');
 await page.waitForFunction(()=>window.__drill?.ready);
 const result=await page.evaluate(async()=>{
  const p=window.__drill,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  const {CutoutMesh}=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/src/game/rig/cutout.ts');
  p.drill.root.visible=false;const original=p.actor.mesh,data=structuredClone(original.data),grids=[];
  // Retain original UVs and bind every grid point to its original setup bone.
  for(const part of data.parts){
   const corners=part.vertices.map((v,i)=>({...v[0],u:part.uv[i*2],v:part.uv[i*2+1]}));
   const x0=Math.min(...corners.map(v=>v.x)),x1=Math.max(...corners.map(v=>v.x)),y0=Math.min(...corners.map(v=>v.y)),y1=Math.max(...corners.map(v=>v.y));
   const nx=part.name==='head'?26:18,ny=part.name==='head'?28:24,vertices=[],uv=[],triangles=[];
   for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
    const u=i/nx,v=j/ny,x=x0+(x1-x0)*u,y=y0+(y1-y0)*v;let tu=0,tv=0;
    for(const c of corners){const k=(c.x===x0?1-u:u)*(c.y===y0?1-v:v);tu+=c.u*k;tv+=c.v*k;}
    vertices.push([{bone:corners[0].bone,x,y,weight:1}]);uv.push(tu,tv);
    if(i<nx&&j<ny){const a=j*(nx+1)+i;triangles.push(a,a+1,a+nx+1,a+1,a+nx+2,a+nx+1);}
   }
   Object.assign(part,{vertices,uv,triangles});grids.push({name:part.name,nx,ny,vertices:vertices.length});
  }
  const mesh=new CutoutMesh(data,original.children.map(m=>m.material.map));original.visible=false;p.actor.root.add(mesh);p.actor.setOrder(10);mesh.pose(0,'');
  const setup=mesh.children.map(m=>Float32Array.from(m.geometry.attributes.position.array));
  const W=1280,H=720,rt=new T.WebGLRenderTarget(W,H),bytes=new Uint8Array(W*H*4);
  const mask=()=>{const vis=p.scene.children.map(o=>[o,o.visible]);vis.forEach(([o])=>o.visible=o===p.actor.root);p.renderer.setClearColor(0,0);p.renderer.setRenderTarget(rt);p.renderer.render(p.scene,p.camera);p.renderer.readRenderTargetPixels(rt,0,0,W,H,bytes);vis.forEach(([o,v])=>o.visible=v);p.renderer.setRenderTarget(null);p.renderer.setClearColor('#242336',1);return Uint8Array.from({length:W*H},(_,i)=>bytes[i*4+3]>=128?1:0);};
  const stat=a=>{let count=0,x0=W,y0=H,x1=0,y1=0;for(let i=0;i<a.length;i++)if(a[i]){const x=i%W,y=Math.floor(i/W);count++;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}return{count,bounds:[x0,y0,x1+1,y1+1]};};
  const shot=()=>{p.renderer.render(p.scene,p.camera);return p.canvas.toDataURL();};
  const base=mask(),baseStat=stat(base),images={rest:shot()},samples=[];
  const clamp=v=>Math.max(0,Math.min(1,v));
  const field=(x,y,amount,lean=0)=>{const u=clamp((y-75)/225),e=u*u*(3-2*u),dy=1+amount*6*u*(1-u);return[x/dy+lean*e,y+amount*225*e];};
  for(const method of ['whole-affine','localized-area','material-aware','material-aware-directional'])for(const amount of [-.18,.12]){
   let flipped=0,minAreaRatio=Infinity,maxAreaRatio=0;
   const lean=method==='material-aware-directional'?(amount<0?-24:24):0;
   for(let page=0;page<mesh.children.length;page++){
    const g=mesh.children[page].geometry,a=g.attributes.position.array,source=setup[page];
    const partAt=data.parts.filter(part=>part.page===page).flatMap(part=>Array(part.vertices.length).fill(part));
    for(let i=0;i<a.length;i+=3){
     const x=source[i],y=source[i+1],part=partAt[i/3];let q=method==='whole-affine'?[x/(1+amount),y*(1+amount)]:field(x,y,amount,lean);
     if(method.startsWith('material-aware')&&part.name!=='body'){
      const bone=mesh.bones[part.vertices[0][0].bone],anchor=field(bone.worldX,bone.worldY,amount,lean);
      q=part.name==='feet'||part.name==='tail'?[x,y]:part.name==='head'?[x+lean,y+amount*225]:[x+anchor[0]-bone.worldX,y+anchor[1]-bone.worldY];
     }
     a[i]=q[0];a[i+1]=q[1];
    }
    const idx=g.index.array,cross=(v,a,b,c)=>(v[b*3]-v[a*3])*(v[c*3+1]-v[a*3+1])-(v[b*3+1]-v[a*3+1])*(v[c*3]-v[a*3]);
    for(let i=0;i<idx.length;i+=3){const before=cross(source,idx[i],idx[i+1],idx[i+2]),after=cross(a,idx[i],idx[i+1],idx[i+2]),ratio=after/before;if(ratio<=0)flipped++;minAreaRatio=Math.min(minAreaRatio,ratio);maxAreaRatio=Math.max(maxAreaRatio,ratio);}
    g.attributes.position.needsUpdate=true;
   }
   const pixels=mask(),s=stat(pixels);let footChanged=0,footBefore=0;
   for(let y=baseStat.bounds[1];y<baseStat.bounds[1]+20;y++)for(let x=baseStat.bounds[0]-20;x<baseStat.bounds[2]+20;x++){const i=y*W+x;if(base[i])footBefore++;if(base[i]!==pixels[i])footChanged++;}
   const label=method+(amount<0?'-compress':'-extend');images[label]=shot();
   samples.push({method,amount,...s,opaqueAreaRatio:s.count/baseStat.count,footChanged,footBefore,faceWidthToHeightRatio:method==='whole-affine'?1/(1+amount)**2:1,triangleFlips:flipped,triangleAreaRatio:[minAreaRatio,maxAreaRatio]});
  }
  const secondary=[];
  for(const method of ['rigid-tail','distributed-tail-ears','broad-ear-weights','height-shear','height-shear-return']){
   let flipped=0,minArea=Infinity,maxArea=0,faceMaxMove=0;
   const byPart={};
   const tail=mesh.skeleton.findBone('tail');
   const rotate=(x,y,cx,cy,angle)=>[cx+Math.cos(angle)*(x-cx)-Math.sin(angle)*(y-cy),cy+Math.sin(angle)*(x-cx)+Math.cos(angle)*(y-cy)];
   const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
   for(let page=0;page<mesh.children.length;page++){
    const g=mesh.children[page].geometry,a=g.attributes.position.array,source=setup[page];
    const partAt=data.parts.filter(part=>part.page===page).flatMap(part=>Array(part.vertices.length).fill(part));
    for(let i=0;i<a.length;i+=3){
     const x=source[i],y=source[i+1],part=partAt[i/3];let q=[x,y];
     if(part.name==='tail')q=rotate(x,y,tail.worldX,tail.worldY,.24*(method==='rigid-tail'?1:smooth((y-tail.worldY)/170)));
     if(part.name==='head'&&method!=='rigid-tail'){
      const broad=method==='broad-ear-weights';
      const wl=broad?smooth((y-435)/55)*(1-smooth((x+20)/80)):smooth((y-435)/44)*(1-smooth((Math.abs(x+70)-18)/40));
      const wr=broad?smooth((y-450)/62)*smooth(x/60):smooth((y-450)/62)*(1-smooth((Math.abs(x-75)-17)/40));
      const l=rotate(x,y,-62,435,-.25*wl),r=rotate(x,y,75,450,.22*wr);q=[x+(l[0]-x)+(r[0]-x),y+(l[1]-y)+(r[1]-y)];
      if(y<=425)faceMaxMove=Math.max(faceMaxMove,Math.hypot(q[0]-x,q[1]-y));
     }
     if(method.startsWith('height-shear')){
      const sign=method.endsWith('return')?-.65:1;
      if(part.name==='tail')q=[x-sign*32*smooth((y-tail.worldY)/170),y];
      if(part.name==='head'){
       const left=1-smooth((x+20)/80),right=1-left;
       q=[x+sign*(-14*smooth((y-435)/55)*left+12*smooth((y-450)/62)*right),y];
      }
     }
     a[i]=q[0];a[i+1]=q[1];
    }
    const idx=g.index.array,cross=(v,a,b,c)=>(v[b*3]-v[a*3])*(v[c*3+1]-v[a*3+1])-(v[b*3+1]-v[a*3+1])*(v[c*3]-v[a*3]);
    for(let i=0;i<idx.length;i+=3){const ratio=cross(a,idx[i],idx[i+1],idx[i+2])/cross(source,idx[i],idx[i+1],idx[i+2]);if(ratio<=0)flipped++;minArea=Math.min(minArea,ratio);maxArea=Math.max(maxArea,ratio);
     const name=partAt[idx[i]].name,entry=byPart[name]??={min:Infinity,max:0,minimumTriangle:null};
     if(ratio<entry.min){entry.min=ratio;entry.minimumTriangle=[idx[i],idx[i+1],idx[i+2]].map(i=>[source[i*3],source[i*3+1]]);}
     entry.max=Math.max(entry.max,ratio);
    }
    g.attributes.position.needsUpdate=true;
   }
   const pixels=mask(),s=stat(pixels);images[method]=shot();secondary.push({method,...s,opaqueAreaRatio:s.count/baseStat.count,triangleFlips:flipped,triangleAreaRatio:[minArea,maxArea],faceMaxMove,byPart});
  }
  // Original vertex coordinates identify where the painted ear/tail controls must be placed.
  const parts=[];for(let page=0;page<data.pages.length;page++){let offset=0;for(const part of data.parts.filter(p=>p.page===page)){
   const a=setup[page],points=part.vertices.map((_,i)=>[a[(offset+i)*3],a[(offset+i)*3+1]]);offset+=part.vertices.length;
   parts.push({name:part.name,page,bounds:[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))]});
  }}
  rt.dispose();return{base:baseStat,samples,secondary,grids,parts,images};
 });
 for(const [name,data]of Object.entries(result.images))writeFileSync(out+'/'+name+'.png',Buffer.from(data.split(',')[1],'base64'));
 delete result.images;const receipt={at:new Date().toISOString(),errors,method:'Actual original Soot at194px; equal compression/extension, no pose rotation; alpha>=128 and bottom20px foot region; source-face aspect from the exact mapping; triangle Jacobian proxy.',...result};
 writeFileSync('tools/v3craft-lab/q3/deform-study.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({errors,base:result.base,samples:result.samples,secondary:result.secondary,parts:result.parts}));
}finally{await browser.close();}
