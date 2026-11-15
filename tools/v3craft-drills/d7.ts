// Original painted Soot deformation. LEARN/Q3.md: T11/T12/T29/T32/T33 and X18.
// Setup UVs are retained; no reference pixels or incremental physics state.
import {CutoutMesh} from '../../apps/web/src/game/rig/cutout';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>{v=clamp(v);return v*v*(3-2*v);};
type Key=readonly[number,number];
function value(keys:readonly Key[],ms:number){
 if(ms<=keys[0][0])return keys[0][1];
 for(let i=1;i<keys.length;i++)if(ms<=keys[i][0]){
  const a=keys[i-1],b=keys[i];return a[1]+(b[1]-a[1])*smooth((ms-a[0])/(b[0]-a[0]));
 }
 return keys[keys.length-1][1];
}
export const d7Recipe={id:'D7',durationMs:2000,actionMs:800,impactMs:350,holdEndMs:425,
 method:'material-aware-body-with-root-pinned-height-shear',
 roles:['flexible-trunk','rigid-face-and-prop','delayed-tail','delayed-ear-tips']};

function grid(data:any){
 for(const part of data.parts){
  if(!['body','head','tail'].includes(part.name))continue;
  const corners=part.vertices.map((v:any,i:number)=>({...v[0],u:part.uv[i*2],v:part.uv[i*2+1]}));
  const x0=Math.min(...corners.map((v:any)=>v.x)),x1=Math.max(...corners.map((v:any)=>v.x));
  const y0=Math.min(...corners.map((v:any)=>v.y)),y1=Math.max(...corners.map((v:any)=>v.y));
  const nx=part.name==='head'?26:18,ny=part.name==='head'?28:24,vertices:any[]=[],uv:number[]=[],triangles:number[]=[];
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
   const u=i/nx,v=j/ny,x=x0+(x1-x0)*u,y=y0+(y1-y0)*v;let tu=0,tv=0;
   for(const c of corners){const w=(c.x===x0?1-u:u)*(c.y===y0?1-v:v);tu+=c.u*w;tv+=c.v*w;}
   vertices.push([{bone:corners[0].bone,x,y,weight:1}]);uv.push(tu,tv);
   if(i<nx&&j<ny){const a=j*(nx+1)+i;triangles.push(a,a+1,a+nx+1,a+1,a+nx+2,a+nx+1);}
  }
  Object.assign(part,{vertices,uv,triangles});
 }
}
const bodyField=(x:number,y:number,amount:number,lean=0)=>{
 // The base remains planted. Reciprocal transverse scale counters the
 // longitudinal derivative only in the flexible trunk, not the face or prop.
 const u=clamp((y-75)/225),derivative=1+amount*6*u*(1-u);
 return[x/derivative+lean*smooth(u),y+amount*225*smooth(u)];
};
export async function createD7(T:any,revision:number,context:any){
 const {actor,renderer,scene,camera}=context;
 if(!actor.mesh)throw Error('D7 requires the original painted Soot mesh');
 const original=actor.mesh,data=structuredClone(original.data);grid(data);
 const mesh=new CutoutMesh(data,original.children.map((m:any)=>m.material.map));
 mesh.name='D7 planted material-aware Soot';original.visible=false;actor.root.add(mesh);actor.setOrder(10);mesh.pose(0,'');
 // Deform from setup on every seek, never from last frame's vertices.
 const batches=mesh.children.map((m:any,page:number)=>({geometry:m.geometry,setup:Float32Array.from(m.geometry.attributes.position.array),
  partAt:data.parts.filter((p:any)=>p.page===page).flatMap((p:any)=>Array(p.vertices.length).fill(p))}));
 const tailRoot=mesh.skeleton.findBone('tail')!,head=mesh.skeleton.findBone('head')!;
 // The trunk finishes at680ms; the smaller attachments complete the settle
 // later, still inside800ms. Every control is held during350–425ms.
 const controls={
  body:[[0,0],[90,-.035],[225,-.18],[250,-.18],[350,.12],[425,.12],[530,-.045],[680,0],[800,0]] as Key[],
  tail:[[0,0],[100,0],[280,1],[350,.55],[425,.55],[510,-.65],[660,.20],[800,0]] as Key[],
  leftEar:[[0,0],[120,0],[270,.9],[350,.25],[425,.25],[470,-.6],[620,.2],[780,0]] as Key[],
  rightEar:[[0,0],[135,0],[285,.8],[350,.4],[425,.4],[490,-.5],[650,.15],[800,0]] as Key[],
  tailTip:[[0,0],[150,0],[315,1],[350,.8],[425,.8],[550,-.65],[690,.12],[800,0]] as Key[],
  lean:[[0,0],[100,-3],[225,-24],[250,-24],[350,24],[425,24],[505,14],[620,-3],[720,0],[800,0]] as Key[],
 };
 if(revision>=1){
  // Long bend leads the curl, and the near/far ear settle on different
  // frames. The small final rebound is slower than the first reversal.
  controls.tail=[[0,0],[100,0],[275,1],[350,.60],[425,.60],[505,-.65],[645,.12],[780,0],[800,0]];
  controls.tailTip=[[0,0],[165,0],[320,1],[350,.85],[425,.85],[555,-.60],[690,.10],[800,0]];
  controls.leftEar=[[0,0],[110,0],[265,1],[350,.20],[425,.20],[475,-.60],[620,.12],[755,0],[800,0]];
  controls.rightEar=[[0,0],[155,0],[310,.9],[350,.60],[425,.60],[520,-.55],[685,.08],[800,0]];
 }
 let state:any={};
 function draw(ms:number){
  const amount=value(controls.body,ms),tail=value(controls.tail,ms),left=value(controls.leftEar,ms),right=value(controls.rightEar,ms),tip=revision>=1?value(controls.tailTip,ms):0,lean=revision>=2?value(controls.lean,ms):0;
  for(const batch of batches){
   const a=batch.geometry.attributes.position.array,source=batch.setup;
   for(let i=0;i<a.length;i+=3){
    const x=source[i],y=source[i+1],part=batch.partAt[i/3];let q=[x,y];
    if(part.name==='body')q=bodyField(x,y,amount,lean);
    else if(part.name==='tail'){
     const bentX=x-32*tail*smooth((y-tailRoot.worldY)/170);
     // A second shear curls the outer tip after the long tail bend; both
     // maps vanish at the root, and their analytic area determinants are1.
     q=[bentX,y+12*tip*smooth((-bentX-120)/85)];
    }
    else if(part.name==='head'){
     const leftWeight=1-smooth((x+20)/80),rightWeight=1-leftWeight;
     q=[x+lean-14*left*smooth((y-435)/55)*leftWeight+12*right*smooth((y-450)/62)*rightWeight,y+225*amount];
    }else if(part.name!=='feet'){
     const bone=mesh.bones[part.vertices[0][0].bone],anchor=bodyField(bone.worldX,bone.worldY,amount,lean);
     q=[x+anchor[0]-bone.worldX,y+anchor[1]-bone.worldY];
    }
    a[i]=q[0];a[i+1]=q[1];a[i+2]=source[i+2];
   }
   batch.geometry.attributes.position.needsUpdate=true;
  }
  actor.root.updateMatrixWorld(true);
  state={recipe:'D7',revision,phase:ms<250?'compression':ms<350?'extension':ms<425?'hold':ms<800?'overlap-settle':'rest',
   amount,lean,tail,tailTip:tip,leftEar:left,rightEar:right,headShift:225*amount,
   fixedRoot:actor.root.position.toArray(),tailRoot:[tailRoot.worldX,tailRoot.worldY],headAnchor:[head.worldX,head.worldY],
   holding:ms>=350&&ms<425,source:actor.source};
 }
 const root=new T.Group();root.name='D7 no effect shapes';
 async function prepare(){draw(225);await renderer.compileAsync(scene,camera);draw(0);}
 return{root,draw,prepare,state:()=>state,poseMesh:mesh,batches,controls,layers:[]};
}
