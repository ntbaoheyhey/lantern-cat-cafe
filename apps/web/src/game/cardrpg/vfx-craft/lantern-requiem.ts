/** Original Soot pilot. LEARN/Q3.B.md; accepted D1/D2/D3/D5 techniques.
 * Opt-in while the full pilot is reviewed. No rules, action clock or camera owns this art.
 */
import * as T from 'three';
import {loadPoseTexture} from '../spine/pose-texture-loader';

export interface CraftPoint {x:number;y:number}
export interface CraftFace {x:number;y:number;width:number;height:number}
export interface RequiemFrame {
 elapsed:number;width:number;height:number;worldWidth:number;worldHeight:number;
 source:CraftPoint;layoutSource:CraftPoint;targets:CraftPoint[];feet:CraftPoint[];faces:CraftFace[];
 windupSource?:CraftPoint;releaseSource?:CraftPoint;
 rearOrder:number;frontOrder:number;reducedMotion:boolean;
}
type ShaderMesh=T.Mesh<T.BufferGeometry,T.ShaderMaterial>;
type Role='lantern-gather'|'cast-tongue'|'travelling-body'|'golden-edge'|'impact-fan'|'ground-veins'|'cooling-fragments';
interface Layer {role:Role;mesh:ShaderMesh;foreground:boolean}
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>{v=clamp(v);return v*v*(3-2*v);};
const envelope=(ms:number,start:number,rise:number,end:number,fall:number)=>smooth((ms-start)/rise)*(1-smooth((ms-(end-fall))/fall));
export const vertex=`varying vec2 vUv;varying vec2 vField;
void main(){vUv=uv;vField=(modelMatrix*vec4(position,1.)).xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
export const faceUniforms=()=>({uFaces:{value:Array.from({length:16},()=>new T.Vector4())},uFaceCount:{value:0}});
export const faceDeclarations=`uniform vec4 uFaces[16];uniform int uFaceCount;varying vec2 vField;
float faceProtection(){float a=1.;for(int i=0;i<16;i++){if(i>=uFaceCount)break;vec4 f=uFaces[i];float d=length((vField-f.xy)/f.zw);a*=smoothstep(1.,1.22,d);}return a;}`;

export function flowingNoise(){
 const data=new Uint8Array(256*128*4);let seed=15112026;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const waves=[[3,2,.20],[7,-3,.13],[13,5,.08],[23,8,.04]].map(([x,y,a])=>({x:x!,y:y!,a:a!,p:random()*Math.PI*2}));
 for(let y=0;y<128;y++)for(let x=0;x<256;x++){
  const n=waves.reduce((v,w)=>v+w.a*Math.sin(Math.PI*2*((x+.5)/256*w.x+(y+.5)/128*w.y)+w.p),.5),i=(y*256+x)*4;
  data[i]=data[i+1]=data[i+2]=Math.round(clamp(n)*255);data[i+3]=255;
 }
 const texture=new T.DataTexture(data,256,128,T.RGBAFormat);texture.wrapS=texture.wrapT=T.RepeatWrapping;
 texture.minFilter=texture.magFilter=T.LinearFilter;texture.needsUpdate=true;return texture;
}

/** Arc-length UVs keep the streak speed independent of the bend. No radial primitives. */
function ribbon(points:readonly CraftPoint[],width:number,segments=96){
 const curve=new T.CubicBezierCurve(...points.map(p=>new T.Vector2(p.x,p.y)) as [T.Vector2,T.Vector2,T.Vector2,T.Vector2]);curve.arcLengthDivisions=512;
 const positions:number[]=[],uv:number[]=[],indices:number[]=[];
 for(let i=0;i<=segments;i++){
  const u=i/segments,p=curve.getPointAt(u),t=curve.getTangentAt(u),half=width*.5*Math.pow(Math.sin(Math.PI*u),.68)*(.7+.3*u);
  for(const side of [-1,1]){positions.push(p.x-t.y*half*side,p.y+t.x*half*side,0);uv.push(u,(side+1)/2);}
  if(i<segments){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);return g;
}

function moveRibbon(geometry:T.BufferGeometry,points:readonly CraftPoint[],width:number,skew=0,blade=false,profileBlend=1,tail=0,head=1,painted=false){
 const curve=new T.CubicBezierCurve(...points.map(p=>new T.Vector2(p.x,p.y)) as [T.Vector2,T.Vector2,T.Vector2,T.Vector2]);curve.arcLengthDivisions=512;
 const attribute=geometry.attributes.position!,a=attribute.array as Float32Array,segments=attribute.count/2-1;
 for(let i=0;i<=segments;i++){
  const u=i/segments,v=clamp(tail+(head-tail)*u),p=curve.getPointAt(v),t=curve.getTangentAt(v);
  // The blade's shoulder sits close to its nose. A symmetric belly made
  // the light look like suspended cloth even with a directional texture.
  const round=Math.pow(Math.sin(Math.PI*u),.68)*(.7+.3*u),knife=u<.72?.08+.92*Math.pow(u/.72,.65):Math.pow((1-u)/.28,1.2);
  const profile=painted?1:blade?round+(knife-round)*profileBlend:round;
  const half=width*.5*profile;
  for(let side=0;side<2;side++){const sign=(side?1:-1)+skew*Math.sin(Math.PI*u),j=(i*2+side)*3;a[j]=p.x-t.y*half*sign;a[j+1]=p.y+t.x*half*sign;}
 }
 attribute.needsUpdate=true;
}

function ribbonMaterial(noise:T.Texture,kind:'strand'|'body'|'ground'|'impact'){
 const palette=kind==='ground'?['#23151d','#582a43','#f9b45b']:kind==='impact'?['#4d1243','#d94b84','#ffdc7b']:['#291442','#8540c5','#f2c87e'];
 return new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide,toneMapped:false,
  uniforms:{uNoise:{value:noise},uPaint:{value:noise},uPainted:{value:0},uTime:{value:0},uHead:{value:0},uTail:{value:-.12},uAlpha:{value:0},uErode:{value:0},uHeat:{value:0},uBlade:{value:kind==='body'?1:0},uGround:{value:kind==='ground'?1:0},
   uDark:{value:new T.Color(palette[0])},uBody:{value:new T.Color(palette[1])},uCore:{value:new T.Color(palette[2])},...faceUniforms()},
  vertexShader:vertex,fragmentShader:`uniform sampler2D uNoise,uPaint;uniform float uPainted,uTime,uHead,uTail,uAlpha,uErode,uHeat,uBlade,uGround;
uniform vec3 uDark,uBody,uCore;varying vec2 vUv;${faceDeclarations}
void main(){
 float grain=texture2D(uNoise,vec2(vUv.x*1.7-uTime*.72,vUv.y*2.3+uTime*.09)).r;
 if(uPainted>.5){
  vec2 paintUv=vec2(vUv.x,1.-vUv.y);
  paintUv.y+=sin(vUv.x*13.-uTime*8.)*.012*(1.-vUv.x);
  vec4 paint=texture2D(uPaint,paintUv);
  float erode=smoothstep(uErode-.075,uErode+.075,grain+.12*vUv.x);
  float alpha=paint.a*erode*uAlpha*faceProtection();if(alpha<.001)discard;
  vec3 colour=paint.rgb;
  float light=smoothstep(.36,.80,dot(colour,vec3(.2126,.7152,.0722)));
  colour=mix(colour,vec3(1.,.86,.49),uHeat*light*.30);
  gl_FragColor=vec4(colour,alpha);
  #include <colorspace_fragment>
  return;
 }
 float head=1.-smoothstep(uHead-.035,uHead+.008,vUv.x);
 float tail=smoothstep(uTail-.045+(grain-.5)*.08,uTail+.08+(grain-.5)*.08,vUv.x);
 float tip=1.-smoothstep(uHead-.14,uHead+.01,vUv.x);
 float across=abs(vUv.y-mix(.66,.52,tip))/max(.02,.49*tip);
 float flameEdge=mix(1.,.79+.21*grain,uBlade*(1.-smoothstep(.72,.96,vUv.x)));
 float edge=1.-smoothstep(flameEdge-.07,flameEdge,across);
 // Ragged, pointed negative spaces divide the trailing flame. They close
 // before its nose rather than making parallel glossy strips of cloth.
 float trailing=1.-smoothstep(.12,.66,vUv.x);
 float split=exp(-pow((vUv.y-(.34+.035*sin(vUv.x*11.-uTime*4.)))/(.014+.10*trailing),2.));
 float second=exp(-pow((vUv.y-(.66-.06*vUv.x))/(.012+.065*trailing),2.));
 edge*=1.-max(split,second)*uBlade*trailing;
 edge*=mix(1.,smoothstep(.20,.42,grain+.22*vUv.x),uGround);
 float alpha=edge*head*tail*smoothstep(uErode-.1,uErode+.1,grain)*uAlpha;
 alpha*=faceProtection();if(alpha<.001)discard;
 float lip=exp(-pow((vUv.y-.79)/.038,2.))*(1.-uBlade*.65);
 float vein=smoothstep(.58,.76,grain)*exp(-pow((vUv.y-.48)/.23,2.));
 float spine=exp(-pow((vUv.y-(.53+.045*sin(vUv.x*8.-uTime*3.)))/.065,2.));
 float flank=smoothstep(.20,.42,vUv.y)*(1.-smoothstep(.58,.76,vUv.y));
 vec3 colour=mix(uDark,uBody,.28+.36*grain+.36*flank);
 float fire=smoothstep(.36,.71,grain+.28*vUv.x)*smoothstep(.44,.93,vUv.x)*uBlade;
 colour=mix(colour,uCore,clamp(lip*.74+vein*.13+fire*.82+spine*uBlade*.24+spine*uGround*.48,0.,.94));
 colour=mix(colour,vec3(1.,.94,.72),uHeat*spine*.48);
 gl_FragColor=vec4(colour,alpha);
 #include <colorspace_fragment>
}`});
}

/** Soot casts a fork-tailed flame across the formation, then its tail catches
 * its nose. All time is presentation time; no particle integration/history.
 * LEARN/P2.md: finite swept section + rear body, replacing the failed canopy.
 */
export class LanternRequiem {
 readonly rear=new T.Group();readonly front=new T.Group();readonly ground=new T.Group();
 readonly layers:Layer[]=[];readonly ready:Promise<void>;painted=true;
 private paint?:T.Texture;private disposed=false;
 private noise=flowingNoise();private gather:ShaderMesh[]=[];private cast:ShaderMesh[]=[];
 private bodies:ShaderMesh[]=[];private edges:ShaderMesh[]=[];
 private impacts:ShaderMesh[]=[];private veins:ShaderMesh[]=[];private sparks:ShaderMesh[]=[];
 readonly audit={elapsed:0,activeRoles:[] as Role[],source:{x:0,y:0},target:{x:0,y:0},
  mainShape:'travelling fork-tailed lantern flame with a gold leading edge',revision:4,head:0,tail:0};
 constructor(){
  this.rear.name='Soot travelling lantern flame';this.front.name='Soot lantern contact';this.ground.name='Soot finite ground veins';
  for(let i=0;i<3;i++){this.gather.push(this.add('lantern-gather','strand',false));this.cast.push(this.add('cast-tongue','strand',true));}
  for(let i=0;i<3;i++){this.bodies.push(this.add('travelling-body','body',false));this.edges.push(this.add('golden-edge','strand',false));}
  this.ready=loadPoseTexture('/units/soot/poses/lantern-flame.webp',1536,510).then(paint=>{
   if(this.disposed){paint.dispose();return;}paint.colorSpace=T.SRGBColorSpace;this.paint=paint;
   for(const mesh of [...this.bodies,...this.cast])mesh.material.uniforms.uPaint!.value=paint;
  });
  this.hide();
 }
 private add(role:Role,kind:'strand'|'body'|'ground'|'impact',foreground:boolean){
  const mesh=new T.Mesh(ribbon([{x:0,y:0},{x:0,y:0},{x:1,y:1},{x:2,y:2}],1),ribbonMaterial(this.noise,kind));mesh.frustumCulled=false;
  (kind==='ground'?this.ground:foreground?this.front:this.rear).add(mesh);this.layers.push({role,mesh,foreground});return mesh;
 }
 private ink(mesh:ShaderMesh,ms:number,alpha:number,heat=0,erode=-.1){
  const u=mesh.material.uniforms;u.uTime!.value=ms/1000;u.uHead!.value=1.06;u.uTail!.value=-.12;
  u.uAlpha!.value=alpha;u.uHeat!.value=heat;u.uErode!.value=erode;mesh.visible=alpha>.001;
 }
 private targetLayers(count:number){
  while(this.impacts.length<count*3)this.impacts.push(this.add('impact-fan','impact',true));
  while(this.veins.length<count*3)this.veins.push(this.add('ground-veins','ground',false));
  while(this.sparks.length<count*7)this.sparks.push(this.add('cooling-fragments','impact',true));
  for(const mesh of [...this.impacts,...this.veins,...this.sparks])mesh.visible=false;
 }
 render(f:RequiemFrame){
  const ms=f.elapsed,w=f.width,h=f.height,k=h/720,px=f.worldWidth/w;
  const held=ms>=1100&&ms<1175,t=held?1100:ms;
  const s=ms<300?f.source:f.releaseSource??f.source;
  const targets=f.targets.length?f.targets:[{x:w*.78,y:h*.52}];
  const centre={x:targets.reduce((n,p)=>n+p.x,0)/targets.length,y:targets.reduce((n,p)=>n+p.y,0)/targets.length};
  const end={x:Math.min(w*.97,Math.max(...targets.map(p=>p.x))+w*.07),y:centre.y};
  const dx=end.x-s.x,cast=smooth((t-600)/500),tail=smooth((t-1175)/390);
  for(const root of [this.rear,this.front,this.ground]){root.visible=ms>=0&&ms<2200;root.position.set(-f.worldWidth/2,f.worldHeight,0);root.scale.set(px,-px,1);}
  this.rear.renderOrder=f.rearOrder;this.ground.renderOrder=f.rearOrder-1;this.front.renderOrder=f.frontOrder;
  // Three staggered rising tongues hug the lantern. They are open, directional
  // strokes; no ring, halo disc or field-sized fog is used for the gather.
  for(const [i,mesh]of this.gather.entries()){
   const q=smooth((t-i*45)/550),angle=(-1.8+i*.72),length=(42+i*19)*k;
   const ox=s.x-Math.cos(angle)*length,oy=s.y-Math.sin(angle)*length;
   moveRibbon(mesh.geometry,[{x:ox,y:oy},{x:ox-25*k,y:oy-18*k},{x:s.x-18*k,y:s.y-35*k},s],(9+i*4)*k,0,true,1,.08*q,Math.max(.01,q));
   this.ink(mesh,t,envelope(ms,i*45,95,1280,200)*.92,.48,-.1+tail);mesh.renderOrder=10+i;
  }
  for(const [i,mesh]of this.cast.entries()){
   const q=smooth((t-430-i*24)/400),len=(145+i*25)*k;
   const destination={x:s.x+len,y:s.y+[-30,12,43][i]!*k};
   const ignition=smooth((t-450)/180),fade=smooth((t-820)/270);
   mesh.material.uniforms.uPainted!.value=this.painted&&this.paint?1:0;
   moveRibbon(mesh.geometry,[s,{x:s.x+len*.25,y:s.y-(25-i*17)*k},{x:s.x+len*.72,y:destination.y},destination],
    [62,36,27][i]!*k*(.35+.65*ignition)*(1-.45*fade),0,true,1,Math.max(tail,.15*fade),Math.max(.015,q),this.painted);
   this.ink(mesh,t,envelope(ms,450+i*24,100,1150,260)*[.98,.82,.72][i]!, .28+.32*cast,-.1+.95*fade);
   mesh.renderOrder=15+i;
  }
  // The two smaller tails peel off the upper and lower shoulders. All three
  // heads advance from the same socket, so the broad silhouette travels.
  for(const [i,mesh]of this.bodies.entries()){
   const head=smooth((t-600-i*25)/(500-i*25));
   const spread=[0,-h*.27,h*.29][i]!,offset=i?dx*.11:0;
   const tip={x:end.x-offset,y:end.y+spread*.83};
   const points=[s,{x:s.x+dx*.30,y:s.y+spread*.20+h*.12},{x:tip.x-dx*.29,y:tip.y+spread*.23+h*.04},tip];
   const width=h*[.75,.35,.38][i]!*(.12+.88*Math.pow(head,1.25))*(1-.92*tail);
   const movingTail=Math.max(tail,.12*smooth((t-850)/250));
   mesh.material.uniforms.uPainted!.value=this.painted&&this.paint?1:0;
   moveRibbon(mesh.geometry,points,width,this.painted?0:[.12,-.23,.18][i]!,true,1,movingTail,Math.max(movingTail+.002,head),this.painted);
   const heat=ms<1100?.10+.14*cast:held?.85:.85*(1-smooth((t-1175)/170));
   this.ink(mesh,t,envelope(ms,600+i*25,80,1620,210)*.96,heat,-.1+1.25*smooth((t-1310-i*30)/340));
   mesh.renderOrder=20-i;
   // One gold seam follows the upper edge, with a dark violet body left intact.
   const edge=this.edges[i]!,edgePoints=points.map((p,j)=>({x:p.x,y:p.y+(j===0||j===3?0:-width*.31)}));
   moveRibbon(edge.geometry,edgePoints,(i?7:13)*k,0,true,1,movingTail,Math.max(movingTail+.002,head));
   this.ink(edge,t,envelope(ms,640+i*25,70,1530,230)*.86,.60,-.1+1.25*smooth((t-1280)/300));edge.renderOrder=25+i;
  }
  this.targetLayers(targets.length);
  for(const [targetIndex,target]of targets.entries()){
   const foot=f.feet[targetIndex]??{x:target.x,y:target.y+100*k};
   const age=Math.max(0,t-1100),release=smooth((t-1175)/260);
   for(let i=0;i<3;i++){
    const mesh=this.impacts[targetIndex*3+i]!,angle=[-.83,.17,1.08][i]!+((targetIndex*7)%5-2)*.055,length=[124,88,65][i]!*k*(.92+(targetIndex%3)*.055);
    const vx=Math.cos(angle),vy=Math.sin(angle),offset=length*.43*release;
    const start={x:target.x+vx*offset,y:target.y+vy*offset},tip={x:target.x+vx*length,y:target.y+vy*length};
    moveRibbon(mesh.geometry,[start,{x:start.x+vx*length*.3-vy*22*k,y:start.y+vy*length*.3+vx*22*k},{x:tip.x-vx*length*.18,y:tip.y-vy*length*.18},tip],[32,19,13][i]!*k*(1-.7*release),.25,true);
    this.ink(mesh,t,ms>=1100?envelope(ms,1090,10,1420,200)*.96:0,1-smooth((age-16.667)/33.333),-.1+1.2*smooth((t-1230)/190));
    const vein=this.veins[targetIndex*3+i]!,len=[96,167,72][i]!*k,dy=[-19,13,34][i]!*k;
    moveRibbon(vein.geometry,[{x:foot.x-18*k,y:foot.y},{x:foot.x+len*.2,y:foot.y+dy},{x:foot.x+len*.7,y:foot.y+dy*.7},{x:foot.x+len,y:foot.y+dy*.3}],[9,14,7][i]!*k,0,true,1,0,Math.max(.001,smooth((t-1100-i*16.667)/130)));
    this.ink(vein,t,envelope(ms,1100+i*16.667,45,2110,450)*.92,.4*(1-release),-.1+1.2*smooth((t-1490-i*20)/570));
   }
   for(let i=0;i<7;i++){
    const mesh=this.sparks[targetIndex*7+i]!,age=(t-1133.333-i*13)/1000,life=.45+(i%3)*.11,q=clamp(age/life);
    const a=-1.35+i*.35,speed=(270+(i*57+targetIndex*23)%260)*k,drag=2.5,travel=-Math.expm1(-drag*Math.max(0,age))/drag;
    const x=target.x+Math.cos(a)*speed*travel,y=target.y+Math.sin(a)*speed*travel+310*k*(Math.max(0,age)-travel)/drag;
    const vx=Math.cos(a)*speed*Math.exp(-drag*Math.max(0,age)),vy=Math.sin(a)*speed*Math.exp(-drag*Math.max(0,age))+310*k*travel;
    const angle=Math.atan2(vy,vx),len=(18+(i%3)*11)*k+Math.hypot(vx,vy)*.04;
    const start={x:x-Math.cos(angle)*len*.5,y:y-Math.sin(angle)*len*.5},tip={x:x+Math.cos(angle)*len*.5,y:y+Math.sin(angle)*len*.5};
    moveRibbon(mesh.geometry,[start,start,tip,tip],(7+i%3*4)*k*(1-.65*q),.3,true);
    this.ink(mesh,t,age>=0&&age<life?smooth(q/.1)*(1-smooth((q-.3)/.7))*.94:0,1-q,-.1+q*.9);
   }
  }
  for(const layer of this.layers){
   const u=layer.mesh.material.uniforms;u.uFaceCount!.value=layer.foreground?Math.min(16,f.faces.length):0;
   for(const [i,face]of f.faces.slice(0,16).entries())u.uFaces!.value[i].set((face.x+face.width/2)*px-f.worldWidth/2,f.worldHeight-(face.y+face.height/2)*px,(face.width/2+8)*px,(face.height/2+8)*px);
  }
  this.audit.elapsed=ms;this.audit.source={...s};this.audit.target={...end};this.audit.head=cast;this.audit.tail=tail;
  this.audit.activeRoles=[...new Set(this.layers.filter(l=>l.mesh.visible&&l.mesh.material.uniforms.uAlpha!.value>.05).map(l=>l.role))];
 }
 hide(){this.rear.visible=this.front.visible=this.ground.visible=false;}
 dispose(){this.disposed=true;for(const layer of this.layers){layer.mesh.geometry.dispose();layer.mesh.material.dispose();}for(const root of [this.rear,this.front,this.ground])root.removeFromParent();this.noise.dispose();this.paint?.dispose();}
}
