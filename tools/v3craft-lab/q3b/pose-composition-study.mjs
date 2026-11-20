// Q3.B learning only. Actual D6r2 keys + D7 fields; original cache is read-only.
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='tools/v3craft-lab/q3b/raw/pose-composition';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5990/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-drills/index.html?drill=D6&revision=2');await page.waitForFunction(()=>window.__drill?.ready);
 const result=await page.evaluate(async()=>{
  const p=window.__drill,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  const {CutoutMesh}=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/src/game/rig/cutout.ts');
  const cached=JSON.stringify(p.actor.mesh.data),original=p.drill.poseMesh,data=structuredClone(original.data);p.drill.root.visible=false;original.visible=false;
  for(const part of data.parts){
   if(!['head','tail'].includes(part.name))continue;
   const c=part.vertices.map((v,i)=>({...v[0],u:part.uv[i*2],v:part.uv[i*2+1]}));
   if(c.length!==4)throw Error('Only rigid quads may be subdivided');
   const x0=Math.min(...c.map(v=>v.x)),x1=Math.max(...c.map(v=>v.x)),y0=Math.min(...c.map(v=>v.y)),y1=Math.max(...c.map(v=>v.y));
   const nx=26,ny=28,vertices=[],uv=[],triangles=[];
   for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){
    const u=x/nx,v=y/ny;let tu=0,tv=0;for(const a of c){const w=(a.x===x0?1-u:u)*(a.y===y0?1-v:v);tu+=a.u*w;tv+=a.v*w;}
    vertices.push([{bone:c[0].bone,x:x0+(x1-x0)*u,y:y0+(y1-y0)*v,weight:1}]);uv.push(tu,tv);
    if(x<nx&&y<ny){const a=y*(nx+1)+x;triangles.push(a,a+1,a+nx+1,a+1,a+nx+2,a+nx+1);}
   }Object.assign(part,{vertices,uv,triangles});
  }
  const mesh=new CutoutMesh(data,original.children.map(m=>m.material.map));p.actor.root.add(mesh);p.actor.setOrder(10);mesh.proceduralTime=0;mesh.pose(0,'d6');
  const batches=mesh.children.map((m,page)=>({g:m.geometry,setup:Float32Array.from(m.geometry.attributes.position.array),parts:data.parts.filter(a=>a.page===page).flatMap(a=>Array(a.vertices.length).fill(a))}));
  const headRest={...mesh.skeleton.findBone('head')},tailRest={...mesh.skeleton.findBone('tail')};
  const W=1280,H=720,rt=new T.WebGLRenderTarget(W,H),pixels=new Uint8Array(W*H*4),rows=[],images={};
  const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  const field=(x,y,a,lean)=>{const u=clamp((y-75)/225),d=1+a*6*u*(1-u);return[x/d+lean*smooth(u),y+225*a*smooth(u)];};
  const value=(keys,ms)=>{if(ms<=keys[0][0])return keys[0][1];for(let i=1;i<keys.length;i++)if(ms<=keys[i][0]){const a=keys[i-1],b=keys[i];return a[1]+(b[1]-a[1])*smooth((ms-a[0])/(b[0]-a[0]));}return keys.at(-1)[1];};
  const controls={body:[[0,0],[225,-.08],[250,-.08],[350,.055],[425,.055],[530,-.02],[680,0],[800,0]],lean:[[0,0],[225,-8],[250,-8],[350,8],[425,8],[505,5],[650,0],[800,0]],tail:[[0,0],[100,0],[275,1],[350,.6],[425,.6],[505,-.65],[645,.12],[800,0]],tip:[[0,0],[165,0],[320,1],[350,.85],[425,.85],[555,-.6],[690,.1],[800,0]],left:[[0,0],[110,0],[265,1],[350,.2],[425,.2],[475,-.6],[620,.12],[800,0]],right:[[0,0],[155,0],[310,.9],[350,.6],[425,.6],[520,-.55],[685,.08],[800,0]]};
  function draw(method,ms){
   mesh.pose(Math.min(.8,Math.max(0,ms/1000)),'d6');const a=value(controls.body,ms),lean=value(controls.lean,ms),tail=value(controls.tail,ms),tip=value(controls.tip,ms),left=value(controls.left,ms),right=value(controls.right,ms);
   let faceResidual=0,feetMove=0,flips=0,minArea=Infinity,maxArea=0;
   for(const b of batches){const pos=b.g.attributes.position.array,before=Float32Array.from(pos),idx=b.g.index.array;let faceShift;
    for(let i=0;i<pos.length;i+=3){const x=before[i],y=before[i+1],part=b.parts[i/3],sx=b.setup[i],sy=b.setup[i+1];let q=[x,y];
     if(method==='whole-affine')q=[x/(1+a)+lean*y/512,y*(1+a)];
     else if(part.name==='body')q=field(x,y,a,lean);
     else if(part.name==='head'){
      const bone=mesh.skeleton.findBone('head'),anchor=field(bone.worldX,bone.worldY,a,lean),lw=1-smooth((sx+20)/80);
      const ear=-8*left*smooth((sy-435)/55)*lw+7*right*smooth((sy-450)/62)*(1-lw),len=Math.hypot(bone.a,bone.c);
      q=[x+anchor[0]-bone.worldX+ear*bone.a/len,y+anchor[1]-bone.worldY+ear*bone.c/len];
     }else if(part.name==='tail'){
      const bone=mesh.skeleton.findBone('tail'),dx=-16*tail*smooth((sy-tailRest.worldY)/170),dy=6*tip*smooth((-sx-120)/85),len=Math.hypot(bone.a,bone.c);
      q=[x+dx*bone.a/len+dy*bone.b/len,y+dx*bone.c/len+dy*bone.d/len];
     }else if(part.name!=='feet'){
      const bone=mesh.bones[part.vertices[0][0].bone],anchor=field(bone.worldX,bone.worldY,a,lean);q=[x+anchor[0]-bone.worldX,y+anchor[1]-bone.worldY];
     }
     pos[i]=q[0];pos[i+1]=q[1];
     if(part.name==='feet')feetMove=Math.max(feetMove,Math.hypot(q[0]-x,q[1]-y));
     if(part.name==='head'&&sy<=425){const shift=[q[0]-x,q[1]-y];faceShift??=shift;faceResidual=Math.max(faceResidual,Math.hypot(shift[0]-faceShift[0],shift[1]-faceShift[1]));}
    }
    const cross=(v,i,j,k)=>(v[j*3]-v[i*3])*(v[k*3+1]-v[i*3+1])-(v[j*3+1]-v[i*3+1])*(v[k*3]-v[i*3]);
    for(let i=0;i<idx.length;i+=3){const base=cross(before,idx[i],idx[i+1],idx[i+2]);if(Math.abs(base)<1e-7)continue;const r=cross(pos,idx[i],idx[i+1],idx[i+2])/base;if(r<=0)flips++;minArea=Math.min(minArea,r);maxArea=Math.max(maxArea,r);}
    b.g.attributes.position.needsUpdate=true;
   }
   p.actor.root.updateMatrixWorld(true);p.renderer.setRenderTarget(null);p.renderer.setClearColor('#242336',1);p.renderer.clear();p.renderer.render(p.scene,p.camera);
   return{ms,method,amount:a,lean,faceResidual,feetMove,flips,triangleArea:[minArea,maxArea]};
  }
  function mask(){const visible=p.scene.children.map(o=>[o,o.visible]);visible.forEach(([o])=>o.visible=o===p.actor.root);p.renderer.setRenderTarget(rt);p.renderer.setClearColor(0,0);p.renderer.clear();p.renderer.render(p.scene,p.camera);p.renderer.readRenderTargetPixels(rt,0,0,W,H,pixels);visible.forEach(([o,v])=>o.visible=v);p.renderer.setRenderTarget(null);p.renderer.setClearColor('#242336',1);return Uint8Array.from({length:W*H},(_,i)=>pixels[i*4+3]>=128?1:0);}
  const iou=(a,b)=>{let sum=0,both=0;for(let i=0;i<a.length;i++){if(a[i]||b[i])sum++;if(a[i]&&b[i])both++;}return both/sum;};
  const positions=()=>mesh.children.flatMap(m=>Array.from(m.geometry.attributes.position.array));
  draw('material-local',0);const base=mask();
  for(const method of ['whole-affine','material-local']){
   for(const ms of [0,90,150,225,250,300,350,400,425,500,550,650,720,800]){const row=draw(method,ms);images[method+'-'+ms]=p.canvas.toDataURL();const a=mask();row.opaquePixels=a.reduce((a,b)=>a+b,0);row.restIou=iou(base,a);rows.push(row);}
   draw(method,350);const hold=positions();const holds=[360,375,400,424.9].map(ms=>{draw(method,ms);return Math.max(...positions().map((n,i)=>Math.abs(n-hold[i])));});
   draw(method,225);const expected=positions();const seeks=[800,100,0,500].map(ms=>{draw(method,ms);draw(method,225);return Math.max(...positions().map((n,i)=>Math.abs(n-expected[i])));});
   rows.push({method,holds,seeks});
  }
  const {fixedActionClipTime}=await import('/src/game/cardrpg/spine/events.ts');
  const clockComparison=[];
  for(const [tier,total,impact,focus]of [['basic',800,350,0],['ultimate',2200,1100,600]])for(const method of ['existing-remap-plus-authored-hold','direct-elapsed-authored-hold']){
   let samples=0;for(let t=impact;t<total;t+=.1){const mapped=method.startsWith('existing')?fixedActionClipTime(t,total/1000,impact/1000,impact,total,focus)*1000:t;if(mapped>=impact-1e-6&&mapped<impact+75-1e-6)samples++;}
   clockComparison.push({tier,method,observedHoldMs:samples/10});
  }
  const cacheUnchanged=cached===JSON.stringify(p.actor.mesh.data);rt.dispose();return{rows,images,cacheUnchanged,headRest,clockComparison,scope:'Combined D6r2 keys plus D7-derived fields at194px; production pose and ultimate retiming still require filmed acceptance.'};
 });
 for(const [name,data]of Object.entries(result.images))writeFileSync(out+'/'+name+'.png',Buffer.from(data.split(',')[1],'base64'));delete result.images;
 writeFileSync('tools/v3craft-lab/q3b/pose-composition-study.json',JSON.stringify({at:new Date().toISOString(),errors,...result},null,2)+'\n');
 for(const method of ['whole-affine','material-local']){const r=result.rows.filter(r=>r.method===method&&r.ms!==undefined);console.log(JSON.stringify({method,faceResidual:Math.max(...r.map(r=>r.faceResidual)),feetMove:Math.max(...r.map(r=>r.feetMove)),flips:Math.max(...r.map(r=>r.flips)),windup:r.find(r=>r.ms===225),cacheUnchanged:result.cacheUnchanged,errors}));}
}finally{await browser.close();}
