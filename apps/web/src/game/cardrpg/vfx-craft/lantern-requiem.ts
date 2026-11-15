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

function moveRibbon(geometry:T.BufferGeometry,points:readonly CraftPoint[],width:number){
 const curve=new T.CubicBezierCurve(...points.map(p=>new T.Vector2(p.x,p.y)) as [T.Vector2,T.Vector2,T.Vector2,T.Vector2]);curve.arcLengthDivisions=512;
 const attribute=geometry.attributes.position!,a=attribute.array as Float32Array,segments=attribute.count/2-1;
 for(let i=0;i<=segments;i++){
  const u=i/segments,p=curve.getPointAt(u),t=curve.getTangentAt(u),half=width*.5*Math.pow(Math.sin(Math.PI*u),.68)*(.7+.3*u);
  for(let side=0;side<2;side++){const sign=side?1:-1,j=(i*2+side)*3;a[j]=p.x-t.y*half*sign;a[j+1]=p.y+t.x*half*sign;}
 }
 attribute.needsUpdate=true;
}

function ribbonMaterial(noise:T.Texture,kind:'strand'|'body'|'ground'|'impact'){
 const palette=kind==='ground'?['#39213f','#8856b4','#e5b66c']:kind==='impact'?['#7b356e','#e7a5d0','#fff0b2']:['#291442','#8540c5','#f2c87e'];
 return new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide,toneMapped:false,
  uniforms:{uNoise:{value:noise},uTime:{value:0},uHead:{value:0},uTail:{value:-.12},uAlpha:{value:0},uErode:{value:0},
   uDark:{value:new T.Color(palette[0])},uBody:{value:new T.Color(palette[1])},uCore:{value:new T.Color(palette[2])},...faceUniforms()},
  vertexShader:vertex,fragmentShader:`uniform sampler2D uNoise;uniform float uTime,uHead,uTail,uAlpha,uErode;
uniform vec3 uDark,uBody,uCore;varying vec2 vUv;${faceDeclarations}
void main(){
 float grain=texture2D(uNoise,vec2(vUv.x*.65-uTime*.32,vUv.y*3.6+uTime*.09)).r;
 float head=1.-smoothstep(uHead-.035,uHead+.008,vUv.x);
 float tail=smoothstep(uTail-.045+(grain-.5)*.08,uTail+.08+(grain-.5)*.08,vUv.x);
 float tip=1.-smoothstep(uHead-.14,uHead+.01,vUv.x);
 float across=abs(vUv.y-mix(.66,.52,tip))/max(.02,.49*tip);
 float edge=1.-smoothstep(.82,1.,across);
 float alpha=edge*head*tail*smoothstep(uErode-.1,uErode+.1,grain)*uAlpha;
 alpha*=faceProtection();if(alpha<.001)discard;
 float lip=exp(-pow((vUv.y-.79)/.038,2.));
 float vein=smoothstep(.58,.76,grain)*exp(-pow((vUv.y-.48)/.23,2.));
 vec3 colour=mix(uDark,uBody,.58+.42*grain);colour=mix(colour,uCore,clamp(lip*.84+vein*.14,0.,.88));
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
 private painted:ShaderMesh[]=[];private ribbons:ShaderMesh[]=[];private groundVeins:ShaderMesh[]=[];private fans:ShaderMesh[]=[];
 private curtains:{mesh:ShaderMesh;lamp:number;foot:CraftPoint;width:number}[]=[];
 private fragments:Fragment[]=[];private fragmentMesh?:ShaderMesh;private disposed=false;
 private sourcePaths:{mesh:ShaderMesh;points:CraftPoint[];width:number}[]=[];
 readonly audit={elapsed:0,activeRoles:[] as Role[],source:{x:0,y:0},target:{x:0,y:0},mainShape:'open lantern arch with descending light pennants',revision:1};
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
  const w=f.width,h=f.height,k=w/1280,s=f.layoutSource,targets=f.targets.length?f.targets:[{x:w*.75,y:h*.52}];
  const t={x:targets.reduce((n,p)=>n+p.x,0)/targets.length,y:targets.reduce((n,p)=>n+p.y,0)/targets.length};
  const key=[w,h,s.x,s.y,...targets.flatMap(p=>[p.x,p.y]),...f.feet.flatMap(p=>[p.x,p.y])].map(n=>Math.round(n)).join('/');
  if(key===this.shapeKey)return;this.shapeKey=key;
  for(const layer of [...this.layers])if(!this.painted.includes(layer.mesh)){layer.mesh.removeFromParent();layer.mesh.geometry.dispose();layer.mesh.material.dispose();this.layers.splice(this.layers.indexOf(layer),1);}
  this.ribbons=[];this.groundVeins=[];this.fans=[];this.sourcePaths=[];this.curtains=[];
  const p=(x:number,y:number)=>({x,y});
  // An open arch and two hanging pennants. The rejected lower return path
  // closed the composition into a loop and weakened the lantern silhouette.
  this.ribbons.push(this.addRibbon([s,p(s.x+w*.13,s.y-h*.23),p(w*.59,h*.05),p(w*.80,h*.22)],126*k,'body','canopy-ribbon'));
  this.ribbons.push(this.addRibbon([p(w*.48,h*.18),p(w*.53,h*.38),p(w*.59,h*.47),p(t.x-w*.065,t.y+h*.22)],137*k,'body','canopy-ribbon'));
  this.ribbons.push(this.addRibbon([p(w*.68,h*.17),p(w*.87,h*.07),p(w*.94,h*.37),p(t.x+w*.13,t.y+h*.18)],118*k,'body','canopy-ribbon'));
  this.ribbons.push(this.addRibbon([s,p(s.x+w*.15,s.y-h*.12),p(t.x-w*.17,t.y-h*.19),t],19*k,'strand','cast-strand'));
  // The first strand must be visible outside the raised hand. Keeping this
  // narrow layer behind the caster made the first part of the cast disappear.
  this.front.add(this.ribbons[3]!);this.layers.find(l=>l.mesh===this.ribbons[3])!.foreground=true;
  for(const [index,points,width]of [
   [0,[s,p(s.x+w*.13,s.y-h*.23),p(w*.59,h*.05),p(w*.80,h*.22)],126*k],
   [3,[s,p(s.x+w*.15,s.y-h*.12),p(t.x-w*.17,t.y-h*.19),t],19*k],
  ] as [number,CraftPoint[],number][])this.sourcePaths.push({mesh:this.ribbons[index]!,points:points.map(p=>({...p})),width});
  const floor=Math.min(h*.84,Math.max(...f.feet.map(p=>p.y),h*.71));
  for(const [lamp,x,width,offset]of [[1,.56,160,0],[2,.73,188,13],[3,.89,148,-23]]){
   const foot=p(w*x!,floor+offset!*k),start=p(w*(x!-.08),h*.39);
   const mesh=this.addRibbon([start,p(start.x-w*.10,start.y+h*.12),p(foot.x-w*.06,foot.y-h*.16),foot],width!*k,'body','released-light');
   this.curtains.push({mesh,lamp:lamp!,foot,width:width!*k});
  }
  for(const [i,foot] of f.feet.entries())for(let vein=0;vein<3;vein++){
   const length=(vein===1?130:85)*k,dy=[-18,8,29][vein]!*k;
   this.groundVeins.push(this.addRibbon([p(foot.x-28*k,foot.y),p(foot.x,foot.y+dy*.5),p(foot.x+length*.5,foot.y+dy),p(foot.x+length,foot.y+dy*.5)],(vein===1?17:11)*k,'ground','ground-veins'));
   void i;
  }
  for(const [i,target]of targets.entries())for(const [angle,length,width]of [[.72,83,12],[1.18,119,25],[1.76,69,9]]){
   const adjusted=angle!+(i%3-1)*.12,dx=Math.cos(adjusted)*length!*k,dy=Math.sin(adjusted)*length!*k;
   this.fans.push(this.addRibbon([p(target.x-9*k,target.y-18*k),p(target.x+dx*.25,target.y+dy*.25),p(target.x+dx*.7,target.y+dy*.65),p(target.x+dx,target.y+dy)],width!*k,'impact','impact-fan'));
  }
  this.fragments=[];
  for(const [i,target]of targets.entries())for(let n=0;n<12;n++){
   const angle=-1.2+n/11*2.3,speed=(100+(n*61+i*19)%190)*k;
   this.fragments.push({birth:1175+n*9,life:480+n%4*83,ox:target.x+(n%3-1)*9*k,oy:target.y+(n/11-.5)*45*k,
    vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-40*k,drag:2.7,gravity:270*k,width:(n%3+3)*k,length:(n%4+7)*k,spin:(n%2?1:-1)*.5});
  }
  const positions=new Float32Array(this.fragments.length*12),uv=new Float32Array(this.fragments.length*8),ages=new Float32Array(this.fragments.length*4),indices:number[]=[];
  for(let i=0;i<this.fragments.length;i++){uv.set([0,0,1,0,0,1,1,1],i*8);const a=i*4;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));g.setAttribute('uv',new T.BufferAttribute(uv,2));g.setAttribute('aAge',new T.BufferAttribute(ages,1).setUsage(T.DynamicDrawUsage));g.setIndex(indices);
  const m=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide,toneMapped:false,uniforms:{...faceUniforms()},
   vertexShader:vertex.replace('void main()', 'attribute float aAge;varying float vAge;void main()').replace('vUv=uv;','vAge=aAge;vUv=uv;'),
   fragmentShader:`varying vec2 vUv;varying float vAge;${faceDeclarations}
void main(){float shape=1.-smoothstep(.65,1.,abs(vUv.y-.5)*2.+abs(vUv.x-.5)*.3);float a=shape*smoothstep(0.,.13,vAge)*(1.-smoothstep(.35,1.,vAge))*faceProtection();if(a<.001)discard;
vec3 colour=mix(vec3(1.,.76,.30),vec3(.31,.075,.44),smoothstep(.05,.9,vAge));gl_FragColor=vec4(colour,a);
#include <colorspace_fragment>
}`});
  this.fragmentMesh=new T.Mesh(g,m);this.fragmentMesh.frustumCulled=false;this.front.add(this.fragmentMesh);this.layers.push({role:'cooling-fragments',mesh:this.fragmentMesh,foreground:true});
  this.audit.source={...s};this.audit.target=t;
 }
 render(f:RequiemFrame){
  this.shape(f);const ms=f.elapsed,w=f.width,h=f.height,k=w/1280,px=f.worldWidth/w;
  const dx=f.source.x-f.layoutSource.x,dy=f.source.y-f.layoutSource.y;
  for(const path of this.sourcePaths){
   moveRibbon(path.mesh.geometry,path.points.map((p,i)=>i<2?{x:p.x+dx,y:p.y+dy}:p),path.width);
  }
  for(const root of [this.rear,this.front,this.ground]){root.visible=ms>=0&&ms<2200;root.position.set(-f.worldWidth/2,f.worldHeight,0);root.scale.set(px,-px,1);}
  this.rear.renderOrder=f.rearOrder;this.ground.renderOrder=f.rearOrder-1;this.front.renderOrder=f.frontOrder;
  const cast=clamp((ms-600)/500),held=ms>=1100&&ms<1175,artTime=held?1100:ms,settle=clamp((ms-1175)/850);
  const stretch=.72+.28*smooth(cast),extentX=w*.76/512,extentY=h*1.04/512;
  for(const [i,mesh]of this.painted.entries()){
   const u=mesh.material.uniforms,delay=i?20+i*16:0,unfurl=clamp((ms-600-delay)/(500-delay));
   u.uAlpha!.value=envelope(ms,600+delay,85,1900,150);
   u.uReveal!.value=.40+.66*Math.pow(unfurl,.72);u.uErode!.value=-.1+1.2*smooth((artTime-1220-i*55)/(560-i*20));
   u.uExtent!.value.set(extentX*stretch,extentY*(.80+.20*smooth(cast)));
   const contact=ms<1100?0:held?1:1-smooth((ms-1175)/230);
   const drop=i?smooth((artTime-(950+(i%2)*25))/(150-(i%2)*25))*(i===2?55:35):0;
   u.uShift!.value.set(w*.66-w*.76*stretch*.5,h*(i?.20:.34)-h*1.04*(.80+.20*smooth(cast))*.5+(i?(-42*(1-smooth(unfurl))+drop+contact*(i===2?8:4))*k:contact*10*k));
   u.uAngle!.value=f.reducedMotion?0:(i?Math.sin(unfurl*Math.PI)*(i===1?-.28:i===3?.22:-.13)+Math.sin(settle*Math.PI*2)*.065*(1-settle):-Math.sin(cast*Math.PI)*.05);
   u.uBend!.value=f.reducedMotion?0:i===0?-35*Math.sin(cast*Math.PI)-16*Math.sin(settle*Math.PI):0;
   u.uHeat!.value=ms<1100?0:held?1:(1-smooth((ms-1175)/330));
   mesh.visible=u.uAlpha!.value>.001;mesh.renderOrder=10+i;
  }
  for(const [i,mesh]of this.ribbons.entries()){
   const u=mesh.material.uniforms,opening=i===3;
   u.uTime!.value=(held?1100:ms)/1000;
   u.uHead!.value=opening?Math.min(1.04,.19+.85*(1-Math.pow(1-cast,2))):(.09+.95*Math.pow(clamp((ms-600-i*20)/(500-i*20)),.78));
   u.uTail!.value=-.12+1.3*smooth((ms-1280-i*70)/(650-i*30));
   u.uAlpha!.value=opening?envelope(ms,0,100,1420,300)*.96:envelope(ms,600+i*20,75,2150,110)*.9;
   u.uErode!.value=-.1+1.2*smooth((ms-1480-i*30)/650);
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
   // Narrow relative to travel, with monotone descent. The first author
   // preview folded broad, short strips into curls around the target feet.
   const width=Math.min(curtain.width,Math.max(30,span*.58));
   moveRibbon(curtain.mesh.geometry,[start,{x:start.x+(foot.x-start.x)*.15,y:start.y+span*.30},
    {x:foot.x-(foot.x-start.x)*.13,y:start.y+span*.76},foot],width*(.6+.4*smooth((artTime-840)/260)));
   const u=curtain.mesh.material.uniforms;
   u.uTime!.value=artTime/1000;u.uHead!.value=.05+1.03*smooth((artTime-810-i*35)/(290-i*35));
   u.uTail!.value=-.12+1.3*smooth((artTime-1260-i*90)/(650-i*35));
   u.uAlpha!.value=envelope(ms,790+i*35,100,2160,180)*.94;
   u.uErode!.value=-.1+1.2*smooth((artTime-1480-i*50)/650);
   curtain.mesh.visible=u.uAlpha!.value>.001;curtain.mesh.renderOrder=20+i;
  }
  for(const [i,mesh]of this.groundVeins.entries()){
   const u=mesh.material.uniforms,delay=i%3*33.333;u.uTime!.value=ms/1000;u.uHead!.value=1.05*smooth((ms-1100-delay)/200);
   u.uTail!.value=-.1;u.uAlpha!.value=envelope(ms,1100+delay,66.667,2133,350)*.75;u.uErode!.value=smooth((ms-1500-delay)/600);mesh.visible=u.uAlpha!.value>.001;
  }
  for(const mesh of this.fans){const u=mesh.material.uniforms;u.uTime!.value=1.1;u.uHead!.value=1.05;u.uTail!.value=-.1;u.uErode!.value=-.1;u.uAlpha!.value=ms>=1100&&ms<1166.667?1-.45*smooth((ms-1100)/66.667):0;mesh.visible=u.uAlpha!.value>0;}
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
