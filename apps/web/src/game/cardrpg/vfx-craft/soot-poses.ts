/** Original Soot gestures. LEARN/Q3.B.md / Q3B-X03; opt-in pilot only.
 * Skin weights plant the feet; material-space fields preserve face and prop shape.
 * Each action owns its 75 ms contact hold inside the fixed presentation envelope.
 */
import * as T from 'three';
import {CutoutMesh, type CutoutData, type CutoutKey, type CutoutBone} from '../../rig/cutout';
import type {SpineActor} from '../spine/assets';
import {SPINE_CONFIG, type SpineAnimation, type SpineSocket} from '../spine/config';
import {animationCues} from '../spine/events';

type Part = CutoutData['parts'][number];
type Weight = Part['vertices'][number][number];
type ScalarKeys = readonly (readonly [number, number])[];
type PoseKeys = Record<'body'|'lean'|'tail'|'tip'|'left'|'right', ScalarKeys>;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>{v=clamp(v);return v*v*(3-2*v);};
const ease=[.36,0,.55,1];
const sample=(keys:ScalarKeys,ms:number)=>{
 if(ms<=keys[0]![0])return keys[0]![1];
 for(let i=1;i<keys.length;i++)if(ms<=keys[i]![0]){
  const a=keys[i-1]!,b=keys[i]!;return a[1]+(b[1]-a[1])*smooth((ms-a[0])/(b[0]-a[0]));
 }
 return keys.at(-1)![1];
};

/** Subdivide a rigid source quad once; never reinterpret an already weighted grid. */
function grid(data:CutoutData,name:string,nx:number,ny:number,weights?:(x:number,y:number,u:number,bone:number)=>Weight[]){
 const part=data.parts.find(p=>p.name===name);if(!part)throw Error(`Missing Soot part ${name}`);
 if(part.vertices.length!==4||part.vertices.some(v=>v.length!==1))throw Error(`Expected rigid source quad ${name}`);
 const corners=part.vertices.map((v,i)=>({...v[0]!,u:part.uv[i*2]!,v:part.uv[i*2+1]!}));
 const x0=Math.min(...corners.map(v=>v.x)),x1=Math.max(...corners.map(v=>v.x));
 const y0=Math.min(...corners.map(v=>v.y)),y1=Math.max(...corners.map(v=>v.y));
 const vertices:Weight[][]=[],uv:number[]=[],triangles:number[]=[];
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
  const u=i/nx,v=j/ny,x=x0+(x1-x0)*u,y=y0+(y1-y0)*v;let tu=0,tv=0;
  for(const c of corners){const w=(c.x===x0?1-u:u)*(c.y===y0?1-v:v);tu+=c.u*w;tv+=c.v*w;}
  vertices.push(weights?weights(x,y,u,corners[0]!.bone):[{bone:corners[0]!.bone,x,y,weight:1}]);uv.push(tu,tv);
  if(i<nx&&j<ny){const a=j*(nx+1)+i;triangles.push(a,a+1,a+nx+1,a+1,a+nx+2,a+nx+1);}
 }
 Object.assign(part,{vertices,uv,triangles});
}

function prepareData(source:CutoutData){
 const data=structuredClone(source),hipIndex=data.nodes.findIndex(n=>n.name==='hip'),hip=data.nodes[hipIndex]!;
 if(!hip)throw Error('Soot hip is required');
 const feet=data.nodes.find(n=>n.name==='feet')!;feet.parent=0;feet.x+=hip.x;feet.y+=hip.y;
 grid(data,'body',20,24,(x,y)=>{const w=smooth((y+hip.y-48)/127);return[
  {bone:hipIndex,x,y,weight:w},{bone:0,x:x+hip.x,y:y+hip.y,weight:1-w}];});
 const armIndex=data.nodes.findIndex(n=>n.name==='arm-r'),arm=data.nodes[armIndex]!;
 grid(data,'arm-r',18,22,(x,y,u)=>{const w=smooth((u-.08)/.62);return[
  {bone:armIndex,x,y,weight:w},{bone:arm.parent,x:x+arm.x,y:y+arm.y,weight:1-w}];});
 grid(data,'head',26,28);grid(data,'tail',26,28);

 const clip=(name:string,durationMs:number,events:{name:string;time:number}[]=[])=>{
  const tracks:CutoutData['clips'][string]['tracks']=[];
  data.clips[name]={duration:durationMs/1000,tracks,visibility:[],events};
  return (bone:string,property:'rotate'|'translate'|'scale',values:number[][])=>{
   const node=data.nodes.findIndex(n=>n.name===bone);if(node<0)throw Error(`Missing pose bone ${bone}`);
   const keys:CutoutKey[]=values.map(([ms,a,b])=>({time:ms!/1000,curve:ease,...(property==='rotate'?{value:a}:{x:a,y:b})}));
   tracks.push({node,property,keys});
  };
 };
 const basic=clip('attack',800,[{name:'cast',time:.25},{name:'hit',time:.35}]);
 basic('hip','rotate',[[0,0],[85,4],[205,16],[250,16],[350,-10],[425,-10],[500,-12],[650,2],[800,0]]);
 basic('hip','translate',[[0,0,0],[85,-7,-7],[205,-28,-25],[250,-28,-25],[350,30,0],[425,30,0],[500,34,-4],[650,-3,-1],[800,0,0]]);
 basic('head','rotate',[[0,0],[100,-1],[220,-8],[250,-8],[350,7],[425,7],[520,10],[680,-2],[800,0]]);
 basic('arm-r','rotate',[[0,0],[95,10],[230,62],[250,62],[350,-8],[425,-8],[495,-18],[680,5],[800,0]]);
 basic('arm-l','rotate',[[0,0],[110,-6],[225,-28],[250,-28],[350,24],[425,24],[535,29],[700,-4],[800,0]]);
 basic('tail','rotate',[[0,0],[130,3],[250,16],[350,-6],[425,-6],[565,-19],[715,3],[800,0]]);

 // A longer invocation has its own poses, not a slowed-down basic swing.
 // Gather low, raise the lantern, open the palm toward the canopy, then release.
 const ult=clip('ult',2200,[{name:'ult-start',time:0},{name:'cast',time:.6},{name:'hit',time:1.1},{name:'ult-end',time:2.2}]);
 ult('hip','rotate',[[0,0],[180,3],[440,13],[600,14],[800,8],[960,3],[1100,-12],[1175,-12],[1360,-15],[1720,4],[2020,-1],[2200,0]]);
 ult('hip','translate',[[0,0,0],[180,-7,-9],[440,-27,-31],[600,-29,-32],[800,-17,-18],[960,0,-8],[1100,34,3],[1175,34,3],[1360,38,-6],[1720,-9,-4],[2020,1,0],[2200,0,0]]);
 ult('head','rotate',[[0,0],[200,-2],[480,-9],[600,-10],[820,-4],[1100,8],[1175,8],[1400,12],[1780,-3],[2050,1],[2200,0]]);
 ult('arm-r','rotate',[[0,0],[180,8],[450,56],[600,68],[800,81],[960,57],[1100,-14],[1175,-14],[1300,-27],[1630,10],[1910,-3],[2200,0]]);
 ult('arm-l','rotate',[[0,0],[210,-8],[490,-29],[600,-33],[850,-43],[1100,31],[1175,31],[1400,40],[1760,-9],[2050,2],[2200,0]]);
 ult('tail','rotate',[[0,0],[250,3],[600,18],[790,24],[980,10],[1100,-8],[1175,-8],[1440,-25],[1810,6],[2070,-2],[2200,0]]);

 const idle=clip('idle',3600);
 idle('hip','translate',[[0,0,0],[900,-1.5,5.5],[1800,0,0],[2700,1.5,-5.5],[3600,0,0]]);
 idle('head','rotate',[[0,0],[1100,-1.4],[2000,0],[2900,1.4],[3600,0]]);
 idle('arm-r','rotate',[[0,0],[1150,2.4],[2050,0],[2950,-2.4],[3600,0]]);
 idle('tail','rotate',[[0,0],[1350,3.5],[2200,0],[3100,-3.5],[3600,0]]);
 const hurt=clip('hurt',480);
 hurt('hip','rotate',[[0,-9],[75,-9],[160,-12],[330,2],[480,0]]);
 hurt('hip','translate',[[0,-15,-18],[75,-15,-18],[160,-21,-22],[330,3,-2],[480,0,0]]);
 hurt('head','rotate',[[0,5],[75,5],[190,9],[350,-2],[480,0]]);
 hurt('arm-r','rotate',[[0,-12],[75,-12],[200,-20],[365,4],[480,0]]);
 hurt('arm-l','rotate',[[0,11],[75,11],[180,18],[350,-3],[480,0]]);
 hurt('tail','rotate',[[0,5],[75,5],[230,17],[390,-3],[480,0]]);
 return data;
}

const basicFields:PoseKeys={
 body:[[0,0],[225,-.08],[250,-.08],[350,.055],[425,.055],[530,-.02],[680,0],[800,0]],
 lean:[[0,0],[225,-8],[250,-8],[350,8],[425,8],[505,5],[650,0],[800,0]],
 tail:[[0,0],[100,0],[275,1],[350,.6],[425,.6],[505,-.65],[645,.12],[800,0]],
 tip:[[0,0],[165,0],[320,1],[350,.85],[425,.85],[555,-.6],[690,.1],[800,0]],
 left:[[0,0],[110,0],[265,1],[350,.2],[425,.2],[475,-.6],[620,.12],[800,0]],
 right:[[0,0],[155,0],[310,.9],[350,.6],[425,.6],[520,-.55],[685,.08],[800,0]],
};
const ultimateFields:PoseKeys={
 body:[[0,0],[180,-.02],[480,-.09],[600,-.09],[850,-.045],[1100,.065],[1175,.065],[1390,-.025],[1800,.009],[2200,0]],
 lean:[[0,0],[500,-9],[600,-9],[870,-3],[1100,10],[1175,10],[1390,5],[1800,-2],[2200,0]],
 tail:[[0,0],[210,0],[650,1.15],[850,.9],[1100,.5],[1175,.5],[1470,-.8],[1830,.18],[2200,0]],
 tip:[[0,0],[300,0],[760,1.2],[970,.95],[1100,.8],[1175,.8],[1560,-.7],[1940,.12],[2200,0]],
 left:[[0,0],[200,0],[570,.9],[780,1.05],[1100,.1],[1175,.1],[1350,-.7],[1760,.15],[2200,0]],
 right:[[0,0],[270,0],[680,.7],[930,1],[1100,.5],[1175,.5],[1470,-.65],[1870,.1],[2200,0]],
};

export class SootPoses {
 readonly mesh:CutoutMesh;
 private batches:{geometry:T.BufferGeometry;setup:Float32Array;parts:Part[]}[];
 private tailY:number;
 private headRest:CutoutBone;
 private headShift={x:0,y:0};
 constructor(readonly actor:SpineActor){
  const original=actor.mesh;if(!original)throw Error('Soot pilot requires its painted rig');
  const data=prepareData(original.data);
  const textures=original.children.map(child=>(child as T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>).material.map!);
  const mesh=this.mesh=new CutoutMesh(data,textures);mesh.name='Soot craft poses';mesh.zOffset=original.zOffset;
  actor.root.add(mesh);actor.mesh=mesh;
  actor.boneRefs.clear();
  for(const [socket,name]of Object.entries(SPINE_CONFIG.sockets)){
   const bone=mesh.skeleton.findBone(name);if(!bone)throw Error(`Missing Soot socket ${name}`);
   actor.boneRefs.set(socket as SpineSocket,bone);
  }
  for(const name of ['attack','ult','idle','hurt'] as const){
   const c=data.clips[name]!;actor.clips.set(name,{duration:c.duration,cues:animationCues(name as SpineAnimation,c.duration,c.events)});
  }
  mesh.pose(0,'');this.tailY=mesh.skeleton.findBone('tail')!.worldY;
  this.headRest={...mesh.skeleton.findBone('head')!};
  this.batches=mesh.children.map((child,page)=>{
   const geometry=(child as T.Mesh<T.BufferGeometry>).geometry;
   return{geometry,setup:Float32Array.from(geometry.attributes.position!.array),parts:data.parts.filter(p=>p.page===page).flatMap(p=>Array<Part>(p.vertices.length).fill(p))};
  });
  original.dispose();
 }
 owns(name:string){return name==='attack'||name==='ult';}
 /** X05: preserve the calibrated face in head space, including the local field. */
 faceCorners(region:{x:number;y:number;width:number;height:number}){
  const r=this.headRest,h=this.mesh.skeleton.findBone('head')!,det=r.a*r.d-r.b*r.c;
  const points:{x:number;y:number}[]=[];
  for(const x of [region.x,region.x+region.width])for(const y of [region.y,region.y+region.height]){
   const dx=x-r.worldX,dy=y-r.worldY,u=(r.d*dx-r.b*dy)/det,v=(-r.c*dx+r.a*dy)/det;
   points.push({x:h.worldX+h.a*u+h.b*v+this.headShift.x,y:h.worldY+h.c*u+h.d*v+this.headShift.y});
  }
  return points;
 }
 /** Runs after skinning and before the existing opaque-bounds normalization. */
 deform(name:string,time:number,reduced:boolean){
  const ms=time*1000,fields=name==='attack'?basicFields:name==='ult'?ultimateFields:undefined;
  let body=0,lean=0,tail=0,tip=0,left=0,right=0;
  if(fields){body=sample(fields.body,ms);lean=sample(fields.lean,ms);tail=sample(fields.tail,ms);tip=sample(fields.tip,ms);left=sample(fields.left,ms);right=sample(fields.right,ms);}
  else if(name==='idle'){
   const p=time/3.6*Math.PI*2;body=.011*Math.sin(p);tail=.18*Math.sin(p-.45);tip=.12*Math.sin(p-.8);left=.11*Math.sin(p-.25);right=.08*Math.sin(p-.6);
  }else if(name==='hurt'){
   body=sample([[0,-.07],[75,-.07],[150,-.09],[330,.015],[480,0]],ms);
   tail=sample([[0,.25],[75,.25],[220,.8],[380,-.1],[480,0]],ms);tip=tail*.65;left=-tail*.4;right=-tail*.6;
  }
  if(reduced){tail*=.3;tip*=.3;left*=.3;right*=.3;}
  const field=(x:number,y:number):[number,number]=>{
   const u=clamp((y-75)/225),d=1+body*6*u*(1-u);return[x/d+lean*smooth(u),y+225*body*smooth(u)];
  };
  const head=this.mesh.skeleton.findBone('head')!,headAnchor=field(head.worldX,head.worldY);
  this.headShift.x=headAnchor[0]-head.worldX;this.headShift.y=headAnchor[1]-head.worldY;
  for(const batch of this.batches){
   const positions=batch.geometry.attributes.position!.array;
   for(let i=0;i<positions.length;i+=3){
    const x=positions[i]!,y=positions[i+1]!,part=batch.parts[i/3]!,sx=batch.setup[i]!,sy=batch.setup[i+1]!;
    if(x===0&&y===0)continue;let q:[number,number]=[x,y];
    if(part.name==='body')q=field(x,y);
    else if(part.name==='head'){
     const bone=this.mesh.skeleton.findBone('head')!,anchor=field(bone.worldX,bone.worldY),lw=1-smooth((sx+20)/80);
     const ear=-8*left*smooth((sy-435)/55)*lw+7*right*smooth((sy-450)/62)*(1-lw),len=Math.hypot(bone.a,bone.c);
     q=[x+anchor[0]-bone.worldX+ear*bone.a/len,y+anchor[1]-bone.worldY+ear*bone.c/len];
    }else if(part.name==='tail'){
     const bone=this.mesh.skeleton.findBone('tail')!,dx=-16*tail*smooth((sy-this.tailY)/170),dy=6*tip*smooth((-sx-120)/85),len=Math.hypot(bone.a,bone.c);
     q=[x+dx*bone.a/len+dy*bone.b/len,y+dx*bone.c/len+dy*bone.d/len];
    }else if(part.name!=='feet'){
     const bone=this.mesh.bones[part.vertices[0]![0]!.bone]!,anchor=field(bone.worldX,bone.worldY);
     q=[x+anchor[0]-bone.worldX,y+anchor[1]-bone.worldY];
    }
    positions[i]=q[0];positions[i+1]=q[1];
   }
   batch.geometry.attributes.position!.needsUpdate=true;
  }
  // A transported hand prop needs the same displacement at its child socket.
  for(const [socket,bone]of this.actor.boneRefs){
   const owner=socket==='mainHand'?'arm-r':socket==='offHand'?'arm-l':socket==='head'||socket==='hpAnchor'?'head':undefined;
   const anchor=owner?this.mesh.skeleton.findBone(owner)!:bone;
   const q=socket==='feet'?[anchor.worldX,anchor.worldY]:field(anchor.worldX,anchor.worldY);
   this.actor.sockets.get(socket)!.position.set(bone.worldX+q[0]!-anchor.worldX,bone.worldY+q[1]!-anchor.worldY,1);
  }
 }
}
