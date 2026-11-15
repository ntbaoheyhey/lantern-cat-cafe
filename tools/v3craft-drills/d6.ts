// Original pose/contact exercise. LEARN/Q3.md: T11/T29-T31 and X17.
// The source is our existing painted six-part Soot rig; no reference pixels enter this file.
import {CutoutMesh} from '../../apps/web/src/game/rig/cutout';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>{v=clamp(v);return v*v*(3-2*v);};
const ease=[.36,0,.55,1];
export const d6Recipe={id:'D6',durationMs:2000,actionMs:800,anticipationEndMs:250,
 impactMs:350,holdEndMs:425,flashEndMs:400,smearMs:[283.333333,350],
 roles:['weapon-smear','travelling-tip','local-contact'],method:'planted-weighted-body-and-layered-pose'};

function weightBody(data:any){
 const hipIndex=data.nodes.findIndex((n:any)=>n.name==='hip'),hip=data.nodes[hipIndex];
 const feet=data.nodes.find((n:any)=>n.name==='feet');feet.parent=0;feet.x+=hip.x;feet.y+=hip.y;
 const part=data.parts.find((p:any)=>p.name==='body');
 const corners=part.vertices.map((v:any,i:number)=>({...v[0],u:part.uv[i*2],v:part.uv[i*2+1]}));
 const x0=Math.min(...corners.map((v:any)=>v.x)),x1=Math.max(...corners.map((v:any)=>v.x));
 const y0=Math.min(...corners.map((v:any)=>v.y)),y1=Math.max(...corners.map((v:any)=>v.y));
 const vertices:any[]=[],uv:number[]=[],triangles:number[]=[],nx=20,ny=24;
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
  const u=i/nx,v=j/ny,x=x0+(x1-x0)*u,y=y0+(y1-y0)*v;let tu=0,tv=0;
  for(const c of corners){const k=(c.x===x0?1-u:u)*(c.y===y0?1-v:v);tu+=c.u*k;tv+=c.v*k;}
  const w=smooth((y+hip.y-48)/127);
  vertices.push([{bone:hipIndex,x,y,weight:w},{bone:0,x:x+hip.x,y:y+hip.y,weight:1-w}]);uv.push(tu,tv);
  if(i<nx&&j<ny){const a=j*(nx+1)+i;triangles.push(a,a+1,a+nx+1,a+1,a+nx+2,a+nx+1);}
 }
 Object.assign(part,{vertices,uv,triangles});
}
function makePose(data:any,revision:number){
 const tracks:any[]=[];
 const rotate=(name:string,values:number[][])=>tracks.push({node:data.nodes.findIndex((n:any)=>n.name===name),property:'rotate',keys:values.map(([time,value])=>({time:time/1000,value,curve:ease}))});
 const translate=(name:string,values:number[][])=>tracks.push({node:data.nodes.findIndex((n:any)=>n.name===name),property:'translate',keys:values.map(([time,x,y])=>({time:time/1000,x,y,curve:ease}))});
 // The body leads; the head watches the target, then the lantern follows the release.
 rotate('hip',[[0,0],[90,2],[205,8],[250,8],[350,-5],[425,-5],[500,-7],[650,1.5],[800,0]]);
 translate('hip',[[0,0,0],[90,-3,-3],[205,-10,-12],[250,-10,-12],[350,15,-3],[425,15,-3],[500,18,-6],[650,-2,-1],[800,0,0]]);
 rotate('head',[[0,0],[90,-1],[220,-7],[250,-7],[350,6],[425,6],[520,7.5],[670,-1.5],[800,0]]);
 rotate('arm-r',[[0,0],[100,5],[230,24],[250,24],[350,-26],[425,-26],[485,-31],[660,5],[800,0]]);
 rotate('arm-l',[[0,0],[100,-5],[220,-16],[250,-16],[350,12],[425,12],[530,16],[680,-3],[800,0]]);
 rotate('tail',[[0,0],[130,2],[250,12],[350,-5],[425,-5],[560,-13],[710,3],[800,0]]);
 if(revision>=1){
  const replace=(name:string,property:string,values:number[][])=>{
   const node=data.nodes.findIndex((n:any)=>n.name===name),track=tracks.find(t=>t.node===node&&t.property===property);
   track.keys=values.map(([time,a,b])=>({time:time/1000,...(property==='rotate'?{value:a}:{x:a,y:b}),curve:ease}));
  };
  replace('hip','rotate',[[0,0],[90,3],[205,12],[250,12],[350,-7],[425,-7],[500,-8.5],[650,1.5],[800,0]]);
  replace('hip','translate',[[0,0,0],[90,-4,-5],[205,-15,-19],[250,-15,-19],[350,19,-5],[425,19,-5],[500,23,-8],[650,-2,-1],[800,0,0]]);
  replace('head','rotate',[[0,0],[90,-2],[220,-10],[250,-10],[350,8],[425,8],[520,9.5],[670,-1.5],[800,0]]);
  replace('arm-r','rotate',[[0,0],[100,6],[230,38],[250,38],[350,-32],[425,-32],[485,-36],[660,6],[800,0]]);
  if(revision>=2){
   // Store energy in the trunk and raised hand; the contact sends the lantern forward.
   // Feet remain rooted through the lower-body weights rather than compensating the root.
   replace('hip','rotate',[[0,0],[85,4],[205,16],[250,16],[350,-10],[425,-10],[500,-12],[650,2],[800,0]]);
   replace('hip','translate',[[0,0,0],[85,-7,-7],[205,-28,-25],[250,-28,-25],[350,30,0],[425,30,0],[500,34,-4],[650,-3,-1],[800,0,0]]);
   replace('head','rotate',[[0,0],[100,-1],[220,-8],[250,-8],[350,7],[425,7],[520,10],[680,-2],[800,0]]);
   replace('arm-r','rotate',[[0,0],[95,10],[230,62],[250,62],[350,-8],[425,-8],[495,-18],[680,5],[800,0]]);
   replace('arm-l','rotate',[[0,0],[110,-6],[225,-28],[250,-28],[350,24],[425,24],[535,29],[700,-4],[800,0]]);
   replace('tail','rotate',[[0,0],[130,3],[250,16],[350,-6],[425,-6],[565,-19],[715,3],[800,0]]);
  }
 }
 data.clips.d6={duration:.8,tracks,visibility:[],events:[]};void revision;
}
function weightLanternArm(data:any){
 const part=data.parts.find((p:any)=>p.name==='arm-r'),armIndex=data.nodes.findIndex((n:any)=>n.name==='arm-r'),arm=data.nodes[armIndex];
 const corners=part.vertices.map((v:any,i:number)=>({...v[0],u:part.uv[i*2],v:part.uv[i*2+1]}));
 const x0=Math.min(...corners.map((v:any)=>v.x)),x1=Math.max(...corners.map((v:any)=>v.x));
 const y0=Math.min(...corners.map((v:any)=>v.y)),y1=Math.max(...corners.map((v:any)=>v.y));
 const vertices:any[]=[],uv:number[]=[],triangles:number[]=[],nx=18,ny=22;
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
  const u=i/nx,v=j/ny,x=x0+(x1-x0)*u,y=y0+(y1-y0)*v;let tu=0,tv=0;
  for(const c of corners){const k=(c.x===x0?1-u:u)*(c.y===y0?1-v:v);tu+=c.u*k;tv+=c.v*k;}
  const w=smooth((u-.08)/.62);
  vertices.push([{bone:armIndex,x,y,weight:w},{bone:arm.parent,x:x+arm.x,y:y+arm.y,weight:1-w}]);uv.push(tu,tv);
  if(i<nx&&j<ny){const a=j*(nx+1)+i;triangles.push(a,a+1,a+nx+1,a+1,a+nx+2,a+nx+1);}
 }
 Object.assign(part,{vertices,uv,triangles});
}
function targetPose(data:any){
 const tracks:any[]=[];
 const track=(name:string,property:string,contact:number[],overshoot:number[])=>{
  const node=data.nodes.findIndex((n:any)=>n.name===name);if(node<0)return;
  const key=(ms:number,v:number[],curve:any=ease)=>({time:ms/1000,...(property==='rotate'?{value:v[0]}:{x:v[0],y:v[1]}),curve});
  const rest=property==='scale'?[1,1]:property==='rotate'?[0]:[0,0];
  tracks.push({node,property,keys:[key(0,rest,'stepped'),key(350,contact,'stepped'),key(425,contact),key(500,overshoot),key(660,rest),key(800,rest)]});
 };
 track('torso','rotate',[-9],[-11]);track('torso','translate',[22,-12],[27,-15]);track('torso','scale',[1.04,.94],[1.025,.96]);
 track('head','rotate',[5],[8]);track('shoulder_l','rotate',[10],[15]);track('shoulder_r','rotate',[-8],[-12]);
 data.clips.d6hit={duration:.8,tracks,visibility:[],events:[]};
}
function strip(T:any,points:number[][],width:number){
 const curve=new T.CubicBezierCurve(...points.map(p=>new T.Vector2(...p))),positions:number[]=[],uv:number[]=[],indices:number[]=[];
 for(let i=0;i<=64;i++){
  const u=i/64,p=curve.getPointAt(u),t=curve.getTangentAt(u),half=width*.5*Math.pow(Math.sin(Math.PI*u),.8);
  for(const side of [-1,1]){positions.push(p.x-t.y*half*side,p.y+t.x*half*side,0);uv.push(u,(side+1)/2);}
  if(i<64){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);return g;
}
export async function createD6(T:any,revision:number,context:any){
 const {actor,recipient,scene,renderer,camera}=context;
 if(!actor.mesh||!recipient?.mesh)throw Error('D6 requires actual painted mesh actors');
 const original=actor.mesh,data=structuredClone(original.data);weightBody(data);if(revision>=1)weightLanternArm(data);makePose(data,revision);
 const mesh=new CutoutMesh(data,original.children.map((m:any)=>m.material.map));mesh.name='D6 original Soot pose';
 original.visible=false;actor.root.add(mesh);actor.setOrder(10);
 const targetOriginal=recipient.mesh,targetData=structuredClone(targetOriginal.data);
 if(revision>=1)targetPose(targetData);
 const targetMesh=new CutoutMesh(targetData,targetOriginal.children.map((m:any)=>m.material.map));
 targetOriginal.visible=false;recipient.root.add(targetMesh);recipient.setOrder(10);
 const targetBase=recipient.root.position.clone(),targetScale=recipient.root.scale.clone();
 const root=new T.Group();root.renderOrder=11;const layers:any[]=[];
 const socket=(m:any,a:any,name:string)=>{const b=m.skeleton.findBone(name);return new T.Vector3(b.worldX,b.worldY,0).applyMatrix4(a.root.matrixWorld);};
 mesh.pose(0,'d6');targetMesh.pose(0,'');actor.root.updateMatrixWorld(true);recipient.root.updateMatrixWorld(true);
 const hand=socket(mesh,actor,'main-hand'),chest=socket(targetMesh,recipient,'hip');chest.y+=55;
 const handPath:number[][]=[];
 if(revision>=1){
  for(const ms of[250,280,315,350]){mesh.pose(ms/1000,'d6');actor.root.updateMatrixWorld(true);const point=socket(mesh,actor,'main-hand');handPath.push([point.x+5,point.y-7]);}
  hand.set(handPath[0][0],handPath[0][1],0);mesh.pose(0,'d6');
 }
 // A short curved smear belongs to the hand; the separate narrow tip carries direction to the target.
 const smearGeometry=strip(T,revision>=1?handPath:[[hand.x-28,hand.y+40],[hand.x+4,hand.y+70],[hand.x+45,hand.y+7],[hand.x+82,hand.y-14]],revision>=1?15:22);
 const vertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
 const material=(colour:string)=>new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide,toneMapped:false,
  uniforms:{uAlpha:{value:0},uColour:{value:new T.Color(colour)}},vertexShader:vertex,
  fragmentShader:`uniform float uAlpha;uniform vec3 uColour;varying vec2 vUv;void main(){float edge=1.-smoothstep(.45,1.,abs(vUv.y-.5)*2.);float end=smoothstep(0.,.07,vUv.x)*(1.-smoothstep(.9,1.,vUv.x));float core=exp(-pow((vUv.y-.62)/.11,2.));gl_FragColor=vec4(mix(uColour,vec3(1.,.88,.65),core*.55),uAlpha*edge*end);#include <colorspace_fragment>}`.replace(';#include',';\n#include')});
 const smear=new T.Mesh(smearGeometry,material('#af6ce8'));root.add(smear);layers.push({role:'weapon-smear',mesh:smear});
 const tip=new T.Mesh(strip(T,revision>=1?[[-76,0],[-48,5],[-18,2],[0,0]]:[[-45,0],[-20,5],[12,2],[36,0]],13),material('#d5a1fa'));root.add(tip);layers.push({role:'travelling-tip',mesh:tip});
 const fan=new T.Group();root.add(fan);fan.position.copy(chest);fan.renderOrder=11;
 // Three asymmetric tapered shards, not an orb/ring or full-screen flash.
 for(const [angle,length,width]of [[-.6,56,19],[.12,70,24],[.85,42,15]]){
  const shard=new T.Mesh(strip(T,[[0,0],[length*.24,3],[length*.7,-2],[length,0]],width),material('#ffe3a0'));
  shard.rotation.z=angle;fan.add(shard);layers.push({role:'local-contact',mesh:shard});
 }
 const targetMaterials=targetMesh.children.map((m:any)=>m.material);
 for(const m of targetMaterials){
  const compile=m.onBeforeCompile.bind(m),cacheKey=m.customProgramCacheKey();
  m.userData.flash={value:0};m.onBeforeCompile=(s:any)=>{
   compile(s,renderer);
   s.uniforms.uD6Flash=m.userData.flash;s.uniforms.uD6Contact={value:new T.Vector2(chest.x,chest.y)};
   s.fragmentShader='uniform float uD6Flash; uniform vec2 uD6Contact;\n'+s.fragmentShader;
   s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>','float d6Local = 1.-smoothstep(.25,1.,length((gl_FragCoord.xy-uD6Contact)/vec2(46.,34.))); outgoingLight = mix(outgoingLight, vec3(1., .82, .5), uD6Flash * d6Local);\n#include <opaque_fragment>');
  };m.customProgramCacheKey=()=> cacheKey+'-d6-local-torso-flash';m.needsUpdate=true;
 }
 let state:any={};
 function draw(ms:number){
  const at=Math.min(.8,Math.max(0,ms/1000));mesh.pose(at,'d6');
  const holding=ms>=350&&ms<425;
  const response=ms<350?0:ms<425?1:1-smooth((ms-425)/300);
  recipient.root.position.copy(targetBase);
  if(revision>=1){targetMesh.pose(at,'d6hit');targetMesh.scale.set(1,1,1);targetMesh.rotation.z=0;}
  else{recipient.root.position.x+=response*8;targetMesh.pose(0,'');targetMesh.scale.set(1-response*.045,1+response*.018,1);targetMesh.rotation.z=-response*.035;}
  actor.root.updateMatrixWorld(true);recipient.root.updateMatrixWorld(true);
  const currentHand=socket(mesh,actor,'main-hand');
  const release=clamp((ms-250)/100);tip.position.set(hand.x+(chest.x-hand.x)*release,hand.y+(chest.y-hand.y)*release+14*Math.sin(Math.PI*release),0);
  tip.rotation.z=Math.atan2(chest.y-hand.y,chest.x-hand.x);tip.visible=ms>=250&&ms<350;
  tip.material.uniforms.uAlpha.value=smooth((ms-250)/18);
  smear.visible=ms>=d6Recipe.smearMs[0]&&ms<d6Recipe.smearMs[1];smear.material.uniforms.uAlpha.value=.72;
  fan.visible=ms>=350&&ms<400;
  for(const m of fan.children)m.material.uniforms.uAlpha.value=1-smooth((ms-350)/50)*.55;
  for(const m of targetMaterials)m.userData.flash.value=ms>=350&&ms<400?.30:0;
  state={recipe:'D6',revision,actionMs:800,phase:ms<250?'anticipation':ms<350?'release':ms<425?'contact-hold':ms<800?'settle':'rest',
   holding,response,hand:currentHand.toArray().slice(0,2),feet:socket(mesh,actor,'feet').toArray().slice(0,2),
   contact:chest.toArray().slice(0,2),smearVisible:smear.visible,tipVisible:tip.visible,flashVisible:fan.visible,
   camera:camera.projectionMatrix.toArray(),source:actor.source};
 }
 async function prepare(){draw(350);await renderer.compileAsync(scene,camera);draw(0);}
 return{root,draw,prepare,state:()=>state,layers,poseMesh:mesh,targetMesh,source:hand,target:chest,targetScale};
}
