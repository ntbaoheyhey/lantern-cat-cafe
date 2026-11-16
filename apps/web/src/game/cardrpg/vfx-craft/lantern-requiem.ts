/** Original Soot pilot. LEARN/Q3.B.md; accepted D1/D2/D3/D5 techniques.
 * Opt-in while the full pilot is reviewed. No rules, action clock or camera owns this art.
 */
import * as T from 'three';
import paintUrl from './soot-core.png?url';

export interface CraftPoint {x:number;y:number}
export interface CraftFace {x:number;y:number;width:number;height:number}
export interface RequiemFrame {
 elapsed:number;width:number;height:number;worldWidth:number;worldHeight:number;
 source:CraftPoint;layoutSource:CraftPoint;targets:CraftPoint[];feet:CraftPoint[];faces:CraftFace[];
 rearOrder:number;frontOrder:number;reducedMotion:boolean;
}
type ShaderMesh=T.Mesh<T.BufferGeometry,T.ShaderMaterial>;
type Role='cast-strand'|'canopy-ribbon'|'painted-canopy'|'hanging-lamps'|'released-light'|'impact-fan'|'ground-veins'|'cooling-fragments';
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

function moveRibbon(geometry:T.BufferGeometry,points:readonly CraftPoint[],width:number,skew=0,blade=false,profileBlend=1){
 const curve=new T.CubicBezierCurve(...points.map(p=>new T.Vector2(p.x,p.y)) as [T.Vector2,T.Vector2,T.Vector2,T.Vector2]);curve.arcLengthDivisions=512;
 const attribute=geometry.attributes.position!,a=attribute.array as Float32Array,segments=attribute.count/2-1;
 for(let i=0;i<=segments;i++){
  const u=i/segments,p=curve.getPointAt(u),t=curve.getTangentAt(u);
  // The blade's shoulder sits close to its nose. A symmetric belly made
  // the light look like suspended cloth even with a directional texture.
  const round=Math.pow(Math.sin(Math.PI*u),.68)*(.7+.3*u),knife=u<.72?.08+.92*Math.pow(u/.72,1.9):Math.pow((1-u)/.28,.74);
  const profile=blade?round+(knife-round)*profileBlend:round;
  const half=width*.5*profile;
  for(let side=0;side<2;side++){const sign=(side?1:-1)+skew*Math.sin(Math.PI*u),j=(i*2+side)*3;a[j]=p.x-t.y*half*sign;a[j+1]=p.y+t.x*half*sign;}
 }
 attribute.needsUpdate=true;
}

function ribbonMaterial(noise:T.Texture,kind:'strand'|'body'|'ground'|'impact'){
 const palette=kind==='ground'?['#23151d','#582a43','#f9b45b']:kind==='impact'?['#7b356e','#e7a5d0','#fff0b2']:['#291442','#8540c5','#f2c87e'];
 return new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide,toneMapped:false,
  uniforms:{uNoise:{value:noise},uTime:{value:0},uHead:{value:0},uTail:{value:-.12},uAlpha:{value:0},uErode:{value:0},uHeat:{value:0},uBlade:{value:kind==='body'?1:0},uGround:{value:kind==='ground'?1:0},
   uDark:{value:new T.Color(palette[0])},uBody:{value:new T.Color(palette[1])},uCore:{value:new T.Color(palette[2])},...faceUniforms()},
  vertexShader:vertex,fragmentShader:`uniform sampler2D uNoise;uniform float uTime,uHead,uTail,uAlpha,uErode,uHeat,uBlade,uGround;
uniform vec3 uDark,uBody,uCore;varying vec2 vUv;${faceDeclarations}
void main(){
 float grain=texture2D(uNoise,vec2(vUv.x*.65-uTime*.32,vUv.y*3.6+uTime*.09)).r;
 float head=1.-smoothstep(uHead-.035,uHead+.008,vUv.x);
 float tail=smoothstep(uTail-.045+(grain-.5)*.08,uTail+.08+(grain-.5)*.08,vUv.x);
 float tip=1.-smoothstep(uHead-.14,uHead+.01,vUv.x);
 float across=abs(vUv.y-mix(.66,.52,tip))/max(.02,.49*tip);
 float edge=1.-smoothstep(.82+.04*grain,1.,across);
 // A thin tapered split in the last third makes the falling body fork;
 // it is a geometric negative space, not another glowing stripe.
 float split=exp(-pow((vUv.y-(.32+.10*vUv.x))/.028,2.))*smoothstep(.62,.86,vUv.x);
 edge*=1.-split*uBlade*.94;
 edge*=mix(1.,smoothstep(.20,.42,grain+.22*vUv.x),uGround);
 float alpha=edge*head*tail*smoothstep(uErode-.1,uErode+.1,grain)*uAlpha;
 alpha*=faceProtection();if(alpha<.001)discard;
 float lip=exp(-pow((vUv.y-.79)/.038,2.))*(1.-uBlade*.65);
 float vein=smoothstep(.58,.76,grain)*exp(-pow((vUv.y-.48)/.23,2.));
 float spine=exp(-pow((vUv.y-(.57+.045*sin(vUv.x*8.-uTime*3.)))/.12,2.));
 float flank=smoothstep(.20,.42,vUv.y)*(1.-smoothstep(.58,.76,vUv.y));
 vec3 colour=mix(uDark,uBody,.28+.36*grain+.36*flank);
 colour=mix(colour,uCore,clamp(lip*.84+vein*.23+spine*uBlade*(.18+.68*uHeat)+spine*uGround*.48,0.,.94));
 colour=mix(colour,vec3(1.,.94,.72),uHeat*spine*.75);
 gl_FragColor=vec4(colour,alpha);
 #include <colorspace_fragment>
}`});
}

function paintGeometry(){
 const positions:number[]=[],uv:number[]=[],indices:number[]=[];const n=32;
 for(let y=0;y<=n;y++)for(let x=0;x<=n;x++){
  positions.push(x/n*512,y/n*512,0);uv.push(x/n,1-y/n);
  if(x<n&&y<n){const a=y*(n+1)+x;indices.push(a,a+1,a+n+1,a+1,a+n+2,a+n+1);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);return g;
}

function paintMaterial(paint:T.Texture,noise:T.Texture,part:number){
 const pivots=[[256,211],[151,254],[262,264],[361,242]];
 return new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide,toneMapped:false,
  uniforms:{uPaint:{value:paint},uNoise:{value:noise},uPart:{value:part},uAlpha:{value:0},uReveal:{value:-.1},uErode:{value:-.1},
   uPivot:{value:new T.Vector2(...pivots[part] as [number,number])},uExtent:{value:new T.Vector2(1,1)},uAngle:{value:0},uBend:{value:0},uShift:{value:new T.Vector2()},uHeat:{value:0},
   uInk:{value:new T.Color('#31104e')},uViolet:{value:new T.Color('#9c3fce')},uGold:{value:new T.Color('#ffe6a0')}},
  vertexShader:`varying vec2 vUv;uniform vec2 uPivot,uExtent,uShift;uniform float uAngle,uBend;
void main(){vUv=uv;vec2 p=position.xy-uPivot;float c=cos(uAngle),s=sin(uAngle);p=mat2(c,-s,s,c)*p+uPivot;
p.y+=uBend*sin(uv.x*3.14159265);p=p*uExtent+uShift;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,0.,1.);}`,
  fragmentShader:`uniform sampler2D uPaint,uNoise;uniform float uPart,uAlpha,uReveal,uErode,uHeat;uniform vec3 uInk,uViolet,uGold;varying vec2 vUv;
void main(){vec2 p=vec2(vUv.x,1.-vUv.y);
float left=smoothstep(.475,.505,p.y)*(1.-smoothstep(.385,.415,p.x));
float right=smoothstep(.445,.475,p.y)*smoothstep(.615,.65,p.x);
float middle=smoothstep(.505,.535,p.y)*smoothstep(.365,.395,p.x)*(1.-smoothstep(.635,.665,p.x));
float total=max(1.,left+right+middle);
float part=uPart<.5?1.-min(1.,left+right+middle):uPart<1.5?left/total:uPart<2.5?middle/total:right/total;
if(part<.001)discard;vec4 paint=texture2D(uPaint,vUv);float grain=texture2D(uNoise,vUv*1.7).r;
float rank=.62*p.x+.24*p.y+.14*grain;
float reveal=1.-smoothstep(uReveal-.04,uReveal+.04,rank);
float erode=smoothstep(uErode-.075,uErode+.075,grain);
float alpha=paint.a*part*reveal*erode*uAlpha;if(alpha<.001)discard;
float luma=dot(paint.rgb,vec3(.2126,.7152,.0722));float light=smoothstep(.18,.65,luma);
vec3 colour=mix(uInk,uViolet,smoothstep(.025,.27,luma));
colour=mix(colour,uGold,light);colour=mix(colour,paint.rgb,.14);
colour=mix(colour,uGold,uHeat*light*.35);gl_FragColor=vec4(colour,alpha);
 #include <colorspace_fragment>
}`});
}

interface Fragment {birth:number;life:number;ox:number;oy:number;vx:number;vy:number;drag:number;gravity:number;width:number;length:number;spin:number}

export class LanternRequiem {
 readonly rear=new T.Group();readonly front=new T.Group();readonly ground=new T.Group();
 readonly layers:Layer[]=[];readonly ready:Promise<void>;
 private noise=flowingNoise();private paint?:T.Texture;private shapeKey='';
 private painted:ShaderMesh[]=[];private ribbons:ShaderMesh[]=[];private groundVeins:ShaderMesh[]=[];
 private fans:{mesh:ShaderMesh;target:CraftPoint;index:number}[]=[];
 private curtains:{mesh:ShaderMesh;lamp:number;foot:CraftPoint;width:number}[]=[];
 private fragments:Fragment[]=[];private fragmentMesh?:ShaderMesh;private disposed=false;
 private sourcePaths:{mesh:ShaderMesh;points:CraftPoint[];width:number}[]=[];
 readonly audit={elapsed:0,activeRoles:[] as Role[],source:{x:0,y:0},target:{x:0,y:0},mainShape:'three unequal falling lantern blades beneath an open crown',revision:2};
 constructor(){
  this.rear.name='Soot rear canopy';this.front.name='Soot local contact';this.ground.name='Soot finite ground veins';
  this.ready=new T.TextureLoader().loadAsync(paintUrl).then(paint=>{
   if(this.disposed){paint.dispose();return;}this.paint=paint;paint.colorSpace=T.SRGBColorSpace;
   for(let part=0;part<4;part++){
    const mesh=new T.Mesh(paintGeometry(),paintMaterial(paint,this.noise,part));mesh.frustumCulled=false;this.rear.add(mesh);this.painted.push(mesh);
    this.layers.push({role:part?'hanging-lamps':'painted-canopy',mesh,foreground:false});
   }
  });
 }
 private addRibbon(points:CraftPoint[],width:number,kind:'strand'|'body'|'ground'|'impact',role:Role){
  const mesh=new T.Mesh(ribbon(points,width),ribbonMaterial(this.noise,kind));mesh.frustumCulled=false;
  (kind==='ground'?this.ground:kind==='impact'?this.front:this.rear).add(mesh);this.layers.push({role,mesh,foreground:kind==='impact'});return mesh;
 }
 private shape(f:RequiemFrame){
  const w=f.width,h=f.height,k=h/720,s=f.layoutSource,targets=f.targets.length?f.targets:[{x:w*.75,y:h*.52}];
  const t={x:targets.reduce((n,p)=>n+p.x,0)/targets.length,y:targets.reduce((n,p)=>n+p.y,0)/targets.length};
  const key=[w,h,s.x,s.y,...targets.flatMap(p=>[p.x,p.y]),...f.feet.flatMap(p=>[p.x,p.y])].map(n=>Math.round(n)).join('/');
  if(key===this.shapeKey)return;this.shapeKey=key;
  for(const layer of [...this.layers])if(!this.painted.includes(layer.mesh)){layer.mesh.removeFromParent();layer.mesh.geometry.dispose();layer.mesh.material.dispose();this.layers.splice(this.layers.indexOf(layer),1);}
  this.ribbons=[];this.groundVeins=[];this.fans=[];this.sourcePaths=[];this.curtains=[];
  const p=(x:number,y:number)=>({x,y});
  // One long leading arch; two unequal slivers echo its direction. The
  // previous three equally weighted hanging forms read as static drapery.
  this.ribbons.push(this.addRibbon([s,p(s.x+w*.16,s.y-h*.14),p(w*.56,h*.12),p(w*.88,h*.29)],170*k,'body','canopy-ribbon'));
  this.ribbons.push(this.addRibbon([p(w*.38,h*.20),p(w*.47,h*.16),p(w*.55,h*.22),p(w*.63,h*.43)],54*k,'body','canopy-ribbon'));
  this.ribbons.push(this.addRibbon([p(w*.72,h*.18),p(w*.89,h*.08),p(w*.96,h*.31),p(w*.91,h*.49)],86*k,'body','canopy-ribbon'));
  this.ribbons.push(this.addRibbon([s,p(s.x+w*.15,s.y-h*.12),p(t.x-w*.17,t.y-h*.19),t],28*k,'strand','cast-strand'));
  // The first strand must be visible outside the raised hand. Keeping this
  // narrow layer behind the caster made the first part of the cast disappear.
  this.front.add(this.ribbons[3]!);this.layers.find(l=>l.mesh===this.ribbons[3])!.foreground=true;
  for(const [index,points,width]of [
   [0,[s,p(s.x+w*.16,s.y-h*.14),p(w*.56,h*.12),p(w*.88,h*.29)],170*k],
   [3,[s,p(s.x+w*.15,s.y-h*.12),p(t.x-w*.17,t.y-h*.19),t],28*k],
  ] as [number,CraftPoint[],number][])this.sourcePaths.push({mesh:this.ribbons[index]!,points:points.map(p=>({...p})),width});
  const floor=Math.min(h*.84,Math.max(...f.feet.map(p=>p.y),h*.71));
  for(const [lamp,x,width,offset]of [[1,.58,170,-38],[2,.79,350,12],[3,.96,130,-68]]){
   const foot=p(w*x!,floor+offset!*k),start=p(w*(x!-.08),h*.39);
   const mesh=this.addRibbon([start,p(start.x-w*.10,start.y+h*.12),p(foot.x-w*.06,foot.y-h*.16),foot],width!*k,'body','released-light');
   this.curtains.push({mesh,lamp:lamp!,foot,width:width!*k});
  }
  for(const [i,foot] of f.feet.entries())for(let vein=0;vein<3;vein++){
   const length=[95,155,65][vein]!*k,dy=[-22,8,28][vein]!*k;
   this.groundVeins.push(this.addRibbon([p(foot.x-24*k,foot.y),p(foot.x,foot.y+dy*.5),p(foot.x+length*.5,foot.y+dy),p(foot.x+length,foot.y+dy*.5)],[6,11,7][vein]!*k,'ground','ground-veins'));
   void i;
  }
  for(const target of targets)for(let index=0;index<3;index++){
   const mesh=this.addRibbon([target,target,target,p(target.x+1,target.y+1)],1,'impact','impact-fan');
   this.fans.push({mesh,target,index});
  }
  this.fragments=[];
  for(const [i,target]of targets.entries())for(let n=0;n<9;n++){
   const angle=-1.65+n/8*2.4,speed=(240+(n*61+i*19)%290)*k;
   this.fragments.push({birth:1133.333+n*11,life:480+n%4*83,ox:target.x+(n%3-1)*13*k,oy:target.y+(n/8-.5)*45*k,
    vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-65*k,drag:2.9,gravity:380*k,width:(6+n%3*3)*k,length:(14+n%4*6)*k,spin:(n%2?1:-1)*.65});
  }
  const positions=new Float32Array(this.fragments.length*12),uv=new Float32Array(this.fragments.length*8),ages=new Float32Array(this.fragments.length*4),indices:number[]=[];
  for(let i=0;i<this.fragments.length;i++){uv.set([0,0,1,0,0,1,1,1],i*8);const a=i*4;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));g.setAttribute('uv',new T.BufferAttribute(uv,2));g.setAttribute('aAge',new T.BufferAttribute(ages,1).setUsage(T.DynamicDrawUsage));g.setIndex(indices);
  const m=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide,toneMapped:false,uniforms:{...faceUniforms()},
   vertexShader:vertex.replace('void main()', 'attribute float aAge;varying float vAge;void main()').replace('vUv=uv;','vAge=aAge;vUv=uv;'),
   fragmentShader:`varying vec2 vUv;varying float vAge;${faceDeclarations}
void main(){float width=.12+.88*(1.-abs(vUv.x-.42)*1.72);float shape=1.-smoothstep(max(.03,width*.66),max(.06,width),abs(vUv.y-.5)*2.);float a=shape*smoothstep(0.,.13,vAge)*(1.-smoothstep(.35,1.,vAge))*faceProtection();if(a<.001)discard;
vec3 colour=mix(vec3(1.,.91,.55),vec3(.95,.28,.025),smoothstep(.05,.36,vAge));
colour=mix(colour,vec3(.24,.02,.035),smoothstep(.45,1.,vAge));gl_FragColor=vec4(colour,a);
#include <colorspace_fragment>
}`});
  this.fragmentMesh=new T.Mesh(g,m);this.fragmentMesh.frustumCulled=false;this.front.add(this.fragmentMesh);this.layers.push({role:'cooling-fragments',mesh:this.fragmentMesh,foreground:true});
  this.audit.source={...s};this.audit.target=t;
 }
 render(f:RequiemFrame){
  this.shape(f);const ms=f.elapsed,w=f.width,h=f.height,k=h/720,px=f.worldWidth/w;
  const held=ms>=1100&&ms<1175,artTime=held?1100:ms,descent=smooth((artTime-900)/200);
  const dx=f.source.x-f.layoutSource.x,dy=f.source.y-f.layoutSource.y;
  for(const path of this.sourcePaths){
   const leading=path.mesh===this.ribbons[0];
   const points=path.points.map((p,i)=>i<2?{x:p.x+dx,y:p.y+dy}:leading?
    {x:p.x+(i===2?w*.09:-w*.035)*descent,y:p.y+(i===2?h*.075:h*.43)*descent}:p);
   moveRibbon(path.mesh.geometry,points,path.width*(leading?1+.40*descent:1),leading?-.4*descent:0,leading,descent);
  }
  for(const root of [this.rear,this.front,this.ground]){root.visible=ms>=0&&ms<2200;root.position.set(-f.worldWidth/2,f.worldHeight,0);root.scale.set(px,-px,1);}
  this.rear.renderOrder=f.rearOrder;this.ground.renderOrder=f.rearOrder-1;this.front.renderOrder=f.frontOrder;
  const cast=clamp((ms-600)/500),settle=clamp((ms-1175)/850);
  const stretch=.70+.30*smooth(cast),extentX=w*.64/512,extentY=h*.82/512;
  const release=clamp((artTime-1175)/370),pull=1-(1-release)*(1-release);
  for(const [i,mesh]of this.painted.entries()){
   const u=mesh.material.uniforms,delay=i?20+i*16:0,unfurl=clamp((ms-600-delay)/(500-delay));
   u.uAlpha!.value=envelope(ms,600+delay,66.667,1680,150);
   u.uReveal!.value=.40+.66*Math.pow(unfurl,.72);u.uErode!.value=-.1+1.25*smooth((artTime-1175-i*12)/340);
   const partWidth=[.82,1,1.08,.78][i]!*(i===0?1-.24*descent:1),partHeight=[.82,.90,1.07,.78][i]!*(i===0?1-.22*descent:1);
   u.uExtent!.value.set(extentX*stretch*partWidth,extentY*(.80+.20*smooth(cast))*partHeight);
   const contact=ms<1100?0:held?1:1-smooth((ms-1175)/230);
   const drop=i?smooth((artTime-(950+(i%2)*25))/(150-(i%2)*25))*(i===2?37:22):0;
   u.uShift!.value.set(w*.64-w*.64*stretch*.5*partWidth+[0,-90,-50,5][i]!*k*smooth(cast)+(i===0?18:9)*k*pull,
    h*(i?.13:.29)-h*.82*(.80+.20*smooth(cast))*.5*partHeight+(i?(-42*(1-smooth(unfurl))+drop+contact*(i===2?8:4))*k:contact*10*k)-pull*(i?10:26)*k);
   u.uAngle!.value=f.reducedMotion?0:(i?Math.sin(unfurl*Math.PI)*(i===1?-.28:i===3?.22:-.13)+Math.sin(settle*Math.PI*2)*.065*(1-settle):-Math.sin(cast*Math.PI)*.05);
   u.uBend!.value=f.reducedMotion?0:i===0?-35*Math.sin(cast*Math.PI)-16*Math.sin(settle*Math.PI):0;
   u.uHeat!.value=ms<1100?0:held?1:(1-smooth((ms-1175)/330));
   mesh.visible=u.uAlpha!.value>.001;mesh.renderOrder=10+i;
  }
  for(const [i,mesh]of this.ribbons.entries()){
   const u=mesh.material.uniforms,opening=i===3;
   u.uTime!.value=(held?1100:ms)/1000;
   u.uHead!.value=opening?Math.min(1.04,.19+.85*(1-Math.pow(1-cast,2))):(.16+.88*Math.pow(clamp((ms-600-i*20)/(500-i*20)),.65));
   u.uTail!.value=-.12+1.35*pull;
   u.uAlpha!.value=opening?envelope(ms,0,100,1400,250)*.96:envelope(ms,600+i*20,66.667,1740,160)*.94;
   u.uErode!.value=-.1+1.2*smooth((artTime-1300-i*20)/400);
   u.uHeat!.value=ms<1100?(opening?.28+.30*smooth(cast):0):1-smooth((ms-1133.333)/83.333);
   mesh.visible=u.uAlpha!.value>.001;mesh.renderOrder=i;
  }
  const centres=[[0,0],[151,330],[262,355],[361,315]];
  for(const [i,curtain]of this.curtains.entries()){
   const paint=this.painted[curtain.lamp]!.material.uniforms,pivot=paint.uPivot!.value as T.Vector2;
   const extent=paint.uExtent!.value as T.Vector2,shift=paint.uShift!.value as T.Vector2,angle=paint.uAngle!.value as number;
   const centre=centres[curtain.lamp]!,dx=centre[0]!-pivot.x,dy=centre[1]!-pivot.y;
   const start={x:(Math.cos(angle)*dx+Math.sin(angle)*dy+pivot.x)*extent.x+shift.x,
    y:(-Math.sin(angle)*dx+Math.cos(angle)*dy+pivot.y)*extent.y+shift.y};
   const foot=curtain.foot,span=foot.y-start.y;
   // An unequal blade shoulder bends away from the stream, then peels
   // forward after contact. Vertical travel remains monotone at every key.
   const width=Math.min(curtain.width,Math.max(30,span*(i===1?1.20:.76))),bend=[-.021,.023,-.010][i]!*w;
   const end={x:foot.x+pull*(i===1?74:38)*k,y:foot.y-pull*(i===1?20:42)*k};
   moveRibbon(curtain.mesh.geometry,[start,{x:start.x+(end.x-start.x)*.15+bend*(1-.5*pull),y:start.y+span*.28},
    {x:end.x-(end.x-start.x)*.10+bend*.28,y:start.y+span*.79},end],
    width*(.40+.60*smooth((artTime-800)/300))*(1-.34*pull),i===1?.58:-.45,true);
   const u=curtain.mesh.material.uniforms;
   u.uTime!.value=artTime/1000;u.uHead!.value=.05+1.03*smooth((artTime-810-i*35)/(290-i*35));
   u.uTail!.value=-.12+1.35*pull;
   u.uAlpha!.value=envelope(ms,790+i*35,100,1740,180)*.97;
   u.uErode!.value=-.1+1.2*smooth((artTime-1320-i*15)/380);
   u.uHeat!.value=ms<1100?.25*smooth((ms-900)/200):1-smooth((ms-1133.333)/110);
   curtain.mesh.visible=u.uAlpha!.value>.001;curtain.mesh.renderOrder=20+i;
  }
  for(const [i,mesh]of this.groundVeins.entries()){
   const u=mesh.material.uniforms,delay=i%3*16.667;u.uTime!.value=ms/1000;u.uHead!.value=1.05*smooth((ms-1100-delay)/110);
   u.uTail!.value=-.1;u.uAlpha!.value=envelope(ms,1100+delay,66.667,2050,350)*.94;u.uErode!.value=smooth((ms-1450-delay)/550);u.uHeat!.value=.5*(1-smooth((ms-1175)/250));mesh.visible=u.uAlpha!.value>.001;
  }
  for(const {mesh,target,index}of this.fans){
   const age=Math.max(0,ms-1100),q=smooth(age/160),angle=[-.28,.64,1.48][index]!,length=[168,128,92][index]!*k;
   const dx=Math.cos(angle),dy=Math.sin(angle),offset=length*.36*q;
   const origin={x:target.x+dx*offset,y:target.y+dy*offset},end={x:target.x+dx*length*(.64+.36*q),y:target.y+dy*length*(.64+.36*q)};
   moveRibbon(mesh.geometry,[origin,{x:origin.x+dx*length*.24-dy*18*k*q,y:origin.y+dy*length*.24+dx*18*k*q},
    {x:end.x-dx*length*.15,y:end.y-dy*length*.15},end],[36,29,17][index]!*k*(1-.72*q),.35);
   const u=mesh.material.uniforms;u.uTime!.value=ms/1000;u.uHead!.value=1.05;u.uTail!.value=-.1;u.uErode!.value=-.1+1.2*smooth((age-50)/150);
   u.uAlpha!.value=ms>=1100&&ms<1320?(1-smooth((age-33.333)/166.667))*.94:0;
   u.uHeat!.value=1-smooth((age-16.667)/33.333);mesh.visible=u.uAlpha!.value>.001;
  }
  if(this.fragmentMesh){
   const g=this.fragmentMesh.geometry,p=g.attributes.position!.array as Float32Array,a=g.attributes.aAge!.array as Float32Array;
   let live=0;
   for(const [i,v]of this.fragments.entries()){
    const age=(ms-v.birth)/1000,q=clamp(age/(v.life/1000)),t=Math.max(0,age),travel=-Math.expm1(-v.drag*t)/v.drag;if(age>0&&q<1)live++;
    const x=v.ox+v.vx*travel,y=v.oy+v.vy*travel+v.gravity*(t-travel)/v.drag;
    const vx=v.vx*Math.exp(-v.drag*t),vy=v.vy*Math.exp(-v.drag*t)+v.gravity*travel,angle=Math.atan2(vy,vx)+v.spin*t;
    const length=v.length+Math.hypot(vx,vy)*.028,width=v.width*(1-.6*q),cx=Math.cos(angle),cy=Math.sin(angle);
    for(let j=0;j<4;j++){const dx=(j%2-.5)*length,dy=(Math.floor(j/2)-.5)*width;p[(i*4+j)*3]=x+dx*cx-dy*cy;p[(i*4+j)*3+1]=y+dx*cy+dy*cx;a[i*4+j]=age<0||q>=1?-1:q;}
   }
   g.attributes.position!.needsUpdate=true;g.attributes.aAge!.needsUpdate=true;this.fragmentMesh.visible=live>0;
  }
  for(const layer of this.layers){
   const u=layer.mesh.material.uniforms;if(!u.uFaces)continue;
   u.uFaceCount!.value=layer.foreground?Math.min(16,f.faces.length):0;
   for(const [i,face]of f.faces.slice(0,16).entries())u.uFaces.value[i].set((face.x+face.width/2)*px-f.worldWidth/2,f.worldHeight-(face.y+face.height/2)*px,(face.width/2+8)*px,(face.height/2+8)*px);
  }
  this.audit.elapsed=ms;this.audit.activeRoles=[...new Set(this.layers.filter(l=>l.mesh.visible&&(l.mesh.material.uniforms.uAlpha?.value??1)>.05).map(l=>l.role))];
 }
 hide(){this.rear.visible=this.front.visible=this.ground.visible=false;}
 dispose(){this.disposed=true;for(const layer of this.layers){layer.mesh.geometry.dispose();layer.mesh.material.dispose();}for(const root of [this.rear,this.front,this.ground])root.removeFromParent();this.noise.dispose();this.paint?.dispose();}
}
