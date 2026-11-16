/** Original staff/lantern bolt; Q3B-X04, accepted D2/D3/D5 techniques.
 * A finite46ms sweep connects sparse travel frames without a persistent beam.
 * Pure elapsed-time evaluation preserves arbitrary seeking and speed scaling.
 */
import * as T from 'three';
import {flowingNoise,faceUniforms,faceDeclarations,vertex,type CraftPoint,type RequiemFrame} from './lantern-requiem';

type Mesh=T.Mesh<T.BufferGeometry,T.ShaderMaterial>;
type Role='hand-glint'|'travelling-lance'|'trailing-thread'|'contact-flash'|'contact-fan'|'ground-splinters'|'released-sparks';
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(x:number)=>{x=clamp(x);return x*x*(3-2*x);};
const envelope=(ms:number,start:number,rise:number,end:number,fall:number)=>smooth((ms-start)/rise)*(1-smooth((ms-end+fall)/fall));
const point=(x:number,y:number):CraftPoint=>({x,y});
const SEGMENTS=64;

function geometry(){
 const positions=new Float32Array((SEGMENTS+1)*6),uv=new Float32Array((SEGMENTS+1)*4),indices:number[]=[];
 for(let i=0;i<=SEGMENTS;i++){
  uv.set([i/SEGMENTS,0,i/SEGMENTS,1],i*4);
  if(i<SEGMENTS){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));g.setAttribute('uv',new T.BufferAttribute(uv,2));g.setIndex(indices);return g;
}

function material(noise:T.Texture,ground=false){
 return new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide,toneMapped:false,
  uniforms:{uNoise:{value:noise},uTime:{value:0},uAlpha:{value:0},uErode:{value:-.1},uHot:{value:0},uGround:{value:ground?1:0},uEmber:{value:0},uChip:{value:0},...faceUniforms()},vertexShader:vertex,
  fragmentShader:`varying vec2 vUv;uniform sampler2D uNoise;uniform float uTime,uAlpha,uErode,uHot,uGround,uEmber,uChip;${faceDeclarations}
void main(){
 float n=texture2D(uNoise,vec2(vUv.x*1.3-uTime*.9,vUv.y*2.4+uTime*.11)).r;
 float centre=.49+.045*sin(vUv.x*18.-uTime*7.);
 float across=abs(vUv.y-centre)*2.;
 float edge=1.-smoothstep(.66+.10*n,1.,across);
 float erosion=smoothstep(uErode-.12,uErode+.12,n+.18*vUv.x);
 float core=exp(-pow((vUv.y-.52)/mix(.14,.24,uHot),2.))*smoothstep(.12,.9,vUv.x);
 float lip=exp(-pow((vUv.y-.72)/.045,2.))*.38;
 vec3 colour=mix(vec3(.10,.014,.23),vec3(.43,.09,.72),.5+.5*n);
 colour=mix(colour,vec3(1.,.64,.12),clamp(core*.88+lip,0.,.96));
 colour=mix(colour,vec3(1.,.94,.62),(.18+.82*core)*uHot);
 // The floor has a dark body and one narrow hot seam, independent of the lance.
 float seam=exp(-pow((vUv.y-.66)/.07,2.))*smoothstep(.25,.95,vUv.x);
 vec3 groundColour=mix(vec3(.045,.009,.07),vec3(1.,.53,.09),seam*.9)*( .88+.12*n);
 colour=mix(colour,groundColour,uGround);
 vec3 ember=mix(vec3(.23,.035,.006),vec3(1.,.68,.16),smoothstep(.25,.72,vUv.y)+seam*.15);
 colour=mix(colour,ember,uEmber*(1.-uHot*.6));
 float chipEdge=1.-smoothstep(.83,1.,abs(vUv.y-.5)*2.);
 float alpha=mix(edge,chipEdge,uChip)*erosion*uAlpha*faceProtection();if(alpha<.001)discard;
 gl_FragColor=vec4(colour,alpha);
 #include <colorspace_fragment>
}`});
}

/** Local section UVs keep the pointed nose and fine trailing edge on the sweep. */
function shape(mesh:Mesh,points:CraftPoint[],tail:number,head:number,width:number,skew=0,cut=false){
 const curve=new T.CubicBezierCurve(...points.map(p=>new T.Vector2(p.x,p.y)) as [T.Vector2,T.Vector2,T.Vector2,T.Vector2]);curve.arcLengthDivisions=128;
 const positions=mesh.geometry.attributes.position!.array as Float32Array;
 for(let i=0;i<=SEGMENTS;i++){
  const u=i/SEGMENTS,t=clamp(tail+(head-tail)*u),p=curve.getPointAt(t),v=curve.getTangentAt(t);
  // Narrow tail, broad shoulder, sharp nose. Unlike a sin-width full-path
  // strip, this profile travels with the section rather than staying behind.
  const profile=cut?(u<.68?Math.pow(u/.68,.6):Math.pow((1-u)/.32,1.45)):Math.pow(Math.sin(Math.PI*u),.7)*(.35+.65*u),half=width*.5*profile;
  for(let side=0;side<2;side++){
   const sign=side?1:-1,d=half*(sign+skew),j=(i*2+side)*3;positions[j]=p.x-v.y*d;positions[j+1]=p.y+v.x*d;
  }
 }
 mesh.geometry.attributes.position!.needsUpdate=true;
}

/** A filled unequal shard, distinct from a velocity-stretched needle. */
function chip(mesh:Mesh,x:number,y:number,angle:number,length:number,width:number,skew:number){
 const a=mesh.geometry.attributes.position!.array as Float32Array,c=Math.cos(angle),s=Math.sin(angle);
 for(let i=0;i<=SEGMENTS;i++){
  const u=i/SEGMENTS,profile=u<.22?.25+u/.22*.75:u<.68?1.-(u-.22)*.27:.88*(1.-(u-.68)/.32);
  for(let side=0;side<2;side++){
   const px=(u-.5)*length,py=((side?1:-1)*profile+skew*(u-.5))*width*.5,j=(i*2+side)*3;
   a[j]=x+c*px-s*py;a[j+1]=y+s*px+c*py;
  }
 }
 mesh.geometry.attributes.position!.needsUpdate=true;
}

export class StaffBolt {
 readonly rear=new T.Group();readonly front=new T.Group();readonly ground=new T.Group();
 readonly layers:{role:Role;mesh:Mesh;foreground:boolean}[]=[];
 readonly audit={elapsed:0,revision:2,activeRoles:[] as Role[],source:{x:0,y:0},target:{x:0,y:0},mainShape:'finite lantern lance, split contact and detached painted-gold shards'};
 private noise=flowingNoise();
 private glints:Mesh[]=[];private lance:Mesh;private thread:Mesh;private flashes:Mesh[]=[];private contacts:Mesh[]=[];private groundShards:Mesh[]=[];private sparks:Mesh[]=[];
 constructor(){
  this.front.name='Soot finite staff lance';this.ground.name='Soot staff ground shards';
  for(let i=0;i<3;i++)this.glints.push(this.add('hand-glint'));
  this.lance=this.add('travelling-lance');this.thread=this.add('trailing-thread');
  for(let i=0;i<2;i++)this.flashes.push(this.add('contact-flash'));
  for(let i=0;i<4;i++)this.contacts.push(this.add('contact-fan'));
  for(let i=0;i<3;i++)this.groundShards.push(this.add('ground-splinters',true));
  for(let i=0;i<9;i++){const spark=this.add('released-sparks');spark.material.uniforms.uEmber!.value=1;spark.material.uniforms.uChip!.value=i%3===0?0:1;this.sparks.push(spark);}
  this.hide();
 }
 private add(role:Role,ground=false){
  const mesh=new T.Mesh(geometry(),material(this.noise,ground));mesh.frustumCulled=false;(ground?this.ground:this.front).add(mesh);
  this.layers.push({role,mesh,foreground:!ground});return mesh;
 }
 private ink(mesh:Mesh,ms:number,alpha:number,hot=0,erode=-.1){
  const u=mesh.material.uniforms;u.uAlpha!.value=alpha;u.uHot!.value=hot;u.uErode!.value=erode;u.uTime!.value=ms/1000;mesh.visible=alpha>.001;
 }
 render(f:RequiemFrame){
  const ms=f.elapsed,k=f.height/720,s=f.source,t=f.targets[0]??point(f.width*.75,f.height*.5),foot=f.feet[0]??point(t.x,f.height*.75),px=f.worldWidth/f.width;
  for(const root of [this.rear,this.front,this.ground]){root.visible=ms>=0&&ms<800;root.position.set(-f.worldWidth/2,f.worldHeight,0);root.scale.set(px,-px,1);}
  this.front.renderOrder=f.frontOrder;this.ground.renderOrder=f.rearOrder-1;this.rear.renderOrder=f.rearOrder;
  const wind=smooth((ms-50)/200),launch=clamp((ms-250)/100),head=launch,tail=clamp((ms-296)/100);
  for(const [i,mesh]of this.glints.entries()){
   const angle=[-1.18,-.05,.79][i]!,length=(42+i*13)*k,near=point(s.x+Math.cos(angle)*5*k,s.y+Math.sin(angle)*5*k);
   const far=point(s.x+Math.cos(angle)*(length+10*k),s.y+Math.sin(angle)*(length+10*k));
   shape(mesh,[far,point(far.x-6*k,far.y),point(near.x+5*k,near.y),near],0,.25+.75*wind,(8+i*2)*k);
   this.ink(mesh,ms,envelope(ms,35+i*20,95,330,70)*(.76+.24*wind),wind*.9);
  }
  const dx=t.x-s.x,path=[s,point(s.x+dx*.32,s.y-24*k),point(t.x-dx*.26,t.y-18*k),t];
  shape(this.lance,path,tail,head,46*k,.24);
  this.ink(this.lance,ms,envelope(ms,250,33.333,425,75),ms<350?.4:1-smooth((ms-350)/75),-.1+1.2*smooth((ms-375)/75));
  const echo=path.map((p,i)=>point(p.x,p.y+(i===1?21:i===2?16:0)*k));
  shape(this.thread,echo,clamp((ms-309)/100),clamp((ms-263)/100),9*k,-.2);
  this.ink(this.thread,ms,envelope(ms,263,66.667,450,100)*.76,.15,smooth((ms-390)/60));
  // Contact changes shape after two hot frames: unequal petals peel away
  // from the strike axis instead of freezing into a four-point star.
  const contactAge=ms-350,axis=Math.atan2(t.y-s.y,t.x-s.x);
  for(const [i,mesh]of this.flashes.entries()){
   const a=axis+(i===0?-.18:.82),length=[115,53][i]!*k,dx=Math.cos(a),dy=Math.sin(a);
   const from=point(t.x-dx*18*k,t.y-dy*18*k),end=point(t.x+dx*length,t.y+dy*length);
   shape(mesh,[from,point(t.x+dx*length*.1-dy*8*k,t.y+dy*length*.1+dx*8*k),
    point(t.x+dx*length*.7,t.y+dy*length*.7),end],0,1,[48,20][i]!*k,.38,true);
   this.ink(mesh,ms,contactAge>=0?1-smooth((contactAge-16.667)/50):0,1,-.15);
  }
  for(const [i,mesh]of this.contacts.entries()){
   const delay=[0,0,17,34][i]!,age=Math.max(0,contactAge-delay),q=clamp(age/[190,170,200,185][i]!);
   const spread=[-1.18,-.08,.61,1.18][i]!,angle=axis+spread*(.38+.62*smooth(age/90));
   const len=[98,163,111,72][i]!*k,release=smooth((age-28)/90),dx=Math.cos(angle),dy=Math.sin(angle);
   const origin=point(t.x+dx*len*.42*release,t.y+dy*len*.42*release);
   const end=point(t.x+dx*len*(.28+.72*smooth(age/70)),t.y+dy*len*(.28+.72*smooth(age/70)));
   const side=i%2?1:-1,bend=side*(12+i*4)*k*smooth(age/80);
   shape(mesh,[origin,point(origin.x+dx*len*.23-dy*bend,origin.y+dy*len*.23+dx*bend),
    point(end.x-dx*len*.2-dy*bend,end.y-dy*len*.2+dx*bend),end],0,1,[34,73,39,20][i]!*k*(1-.69*q),.32,true);
   const born=ms>=350+delay,hot=1-smooth((age-16.667)/33.333);
   this.ink(mesh,ms,born?(1-smooth((age-65)/125))*(i===1?1:.9):0,hot*.7,-.12+1.25*smooth((age-70)/130));
  }
  for(const [i,mesh]of this.groundShards.entries()){
   const len=[102,138,82][i]!*k,dy=[-13,4,19][i]!*k,origin=point(foot.x-21*k,foot.y),end=point(foot.x+len,foot.y+dy);
   shape(mesh,[origin,point(foot.x+10*k,foot.y+dy*.4),point(end.x-18*k,end.y+5*k),end],0,smooth((ms-350-i*12)/90),[18,25,12][i]!*k,.2);
   this.ink(mesh,ms,envelope(ms,350+i*12,45,760,180),.35,-.1+1.2*smooth((ms-490)/270));
  }
  for(const [i,mesh]of this.sparks.entries()){
   const birth=367+i%3*17,life=280+i%4*32,age=Math.max(0,ms-birth)/1000,q=clamp((ms-birth)/life),drag=4.5,travel=-Math.expm1(-drag*age)/drag;
   const angle=axis-1.45+i/8*2.65,speed=(370+i*67%205)*k,vx=Math.cos(angle)*speed,vy=Math.sin(angle)*speed-35*k,g=400*k;
   const x=t.x+(7+i%3*5)*k+vx*travel,y=t.y+(-9+i%4*6)*k+vy*travel+g*(age-travel)/drag,velx=vx*Math.exp(-drag*age),vely=vy*Math.exp(-drag*age)+g*travel;
   const a=Math.atan2(vely,velx),length=(7+i%3*4)*k+Math.hypot(velx,vely)*.018,origin=point(x-Math.cos(a)*length,y-Math.sin(a)*length),end=point(x,y);
   if(i%3===0)shape(mesh,[origin,point(origin.x+(x-origin.x)*.33,origin.y+(y-origin.y)*.33),point(origin.x+(x-origin.x)*.67,origin.y+(y-origin.y)*.67),end],0,1,(8+i%3*2)*k*(1-.65*q));
   else chip(mesh,x,y,a+(i%2?1:-1)*age*5,(22+i%3*6)*k*(1-.42*q),(14+i%4*3)*k*(1-.38*q),i%2?.35:-.3);
   this.ink(mesh,ms,envelope(ms,birth,33.333,birth+life,life*.45),1-smooth(age*1000/66.667),q*.7);
  }
  for(const layer of this.layers){
   const u=layer.mesh.material.uniforms;u.uFaceCount!.value=layer.foreground?Math.min(16,f.faces.length):0;
   for(const [i,face]of f.faces.slice(0,16).entries())u.uFaces!.value[i].set((face.x+face.width/2)*px-f.worldWidth/2,f.worldHeight-(face.y+face.height/2)*px,(face.width/2+8)*px,(face.height/2+8)*px);
  }
  this.audit.elapsed=ms;this.audit.source={...s};this.audit.target={...t};this.audit.activeRoles=[...new Set(this.layers.filter(l=>l.mesh.visible).map(l=>l.role))];
 }
 hide(){this.rear.visible=this.front.visible=this.ground.visible=false;}
 dispose(){for(const l of this.layers){l.mesh.geometry.dispose();l.mesh.material.dispose();}for(const root of [this.rear,this.front,this.ground])root.removeFromParent();this.noise.dispose();}
}
