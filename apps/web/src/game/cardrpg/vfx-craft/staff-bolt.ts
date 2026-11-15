/** Original staff/lantern bolt; Q3B-X04, accepted D2/D3/D5 techniques.
 * A finite46ms sweep connects sparse travel frames without a persistent beam.
 * Pure elapsed-time evaluation preserves arbitrary seeking and speed scaling.
 */
import * as T from 'three';
import {flowingNoise,faceUniforms,faceDeclarations,vertex,type CraftPoint,type RequiemFrame} from './lantern-requiem';

type Mesh=T.Mesh<T.BufferGeometry,T.ShaderMaterial>;
type Role='hand-glint'|'travelling-lance'|'trailing-thread'|'contact-fan'|'ground-splinters'|'released-sparks';
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
  uniforms:{uNoise:{value:noise},uTime:{value:0},uAlpha:{value:0},uErode:{value:-.1},uHot:{value:0},uGround:{value:ground?1:0},uEmber:{value:0},...faceUniforms()},vertexShader:vertex,
  fragmentShader:`varying vec2 vUv;uniform sampler2D uNoise;uniform float uTime,uAlpha,uErode,uHot,uGround,uEmber;${faceDeclarations}
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
 colour=mix(colour,mix(vec3(.13,.035,.14),vec3(.88,.40,.10),core*.7+lip)*(.75+.25*n),uGround);
 colour=mix(colour,mix(vec3(.24,.035,.008),vec3(1.,.54,.09),.4+.6*n),uEmber*(1.-uHot));
 float alpha=edge*erosion*uAlpha*faceProtection();if(alpha<.001)discard;
 gl_FragColor=vec4(colour,alpha);
 #include <colorspace_fragment>
}`});
}

/** Local section UVs keep the pointed nose and fine trailing edge on the sweep. */
function shape(mesh:Mesh,points:CraftPoint[],tail:number,head:number,width:number,skew=0){
 const curve=new T.CubicBezierCurve(...points.map(p=>new T.Vector2(p.x,p.y)) as [T.Vector2,T.Vector2,T.Vector2,T.Vector2]);curve.arcLengthDivisions=128;
 const positions=mesh.geometry.attributes.position!.array as Float32Array;
 for(let i=0;i<=SEGMENTS;i++){
  const u=i/SEGMENTS,t=clamp(tail+(head-tail)*u),p=curve.getPointAt(t),v=curve.getTangentAt(t);
  // Narrow tail, broad shoulder, sharp nose. Unlike a sin-width full-path
  // strip, this profile travels with the section rather than staying behind.
  const profile=Math.pow(Math.sin(Math.PI*u),.7)*(.35+.65*u),half=width*.5*profile;
  for(let side=0;side<2;side++){
   const sign=side?1:-1,d=half*(sign+skew),j=(i*2+side)*3;positions[j]=p.x-v.y*d;positions[j+1]=p.y+v.x*d;
  }
 }
 mesh.geometry.attributes.position!.needsUpdate=true;
}

export class StaffBolt {
 readonly rear=new T.Group();readonly front=new T.Group();readonly ground=new T.Group();
 readonly layers:{role:Role;mesh:Mesh;foreground:boolean}[]=[];
 readonly audit={elapsed:0,revision:1,activeRoles:[] as Role[],source:{x:0,y:0},target:{x:0,y:0},mainShape:'tapered lantern lance with split contact fan'};
 private noise=flowingNoise();
 private glints:Mesh[]=[];private lance:Mesh;private thread:Mesh;private contacts:Mesh[]=[];private groundShards:Mesh[]=[];private sparks:Mesh[]=[];
 constructor(){
  this.front.name='Soot finite staff lance';this.ground.name='Soot staff ground shards';
  for(let i=0;i<3;i++)this.glints.push(this.add('hand-glint'));
  this.lance=this.add('travelling-lance');this.thread=this.add('trailing-thread');
  for(let i=0;i<4;i++)this.contacts.push(this.add('contact-fan'));
  for(let i=0;i<3;i++)this.groundShards.push(this.add('ground-splinters',true));
  for(let i=0;i<9;i++){const spark=this.add('released-sparks');spark.material.uniforms.uEmber!.value=1;this.sparks.push(spark);}
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
  const ms=f.elapsed,k=f.width/1280,s=f.source,t=f.targets[0]??point(f.width*.75,f.height*.5),foot=f.feet[0]??point(t.x,f.height*.75),px=f.worldWidth/f.width;
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
  for(const [i,mesh]of this.contacts.entries()){
   const delay=[0,0,17,34][i]!,age=Math.max(0,contactAge-delay),q=clamp(age/[160,133,180,155][i]!);
   const spread=[-1.1,-.12,.53,1.08][i]!,angle=axis+spread*(.45+.55*smooth(age/90));
   const len=[81,145,101,62][i]!*k,release=smooth((age-34)/95),dx=Math.cos(angle),dy=Math.sin(angle);
   const origin=point(t.x+dx*len*.32*release,t.y+dy*len*.32*release);
   const end=point(t.x+dx*len*(.28+.72*smooth(age/70)),t.y+dy*len*(.28+.72*smooth(age/70)));
   const side=i%2?1:-1,bend=side*(12+i*4)*k*smooth(age/80);
   shape(mesh,[origin,point(origin.x+dx*len*.23-dy*bend,origin.y+dy*len*.23+dx*bend),
    point(end.x-dx*len*.2-dy*bend,end.y-dy*len*.2+dx*bend),end],0,1,[24,48,27,15][i]!*k*(1-.66*q),.2);
   const born=ms>=350+delay,hot=1-smooth((age-16.667)/33.333);
   this.ink(mesh,ms,born?(1-smooth((age-50)/105))*(i===1?1:.88):0,hot,-.12+1.25*smooth((age-55)/110));
  }
  for(const [i,mesh]of this.groundShards.entries()){
   const len=[87,121,72][i]!*k,dy=[-13,4,19][i]!*k,origin=point(foot.x-16*k,foot.y),end=point(foot.x+len,foot.y+dy);
   shape(mesh,[origin,point(foot.x+10*k,foot.y+dy*.4),point(end.x-18*k,end.y+5*k),end],0,smooth((ms-350-i*12)/115),[10,15,8][i]!*k);
   this.ink(mesh,ms,envelope(ms,350+i*12,50,760,180)*.94,.25,-.1+1.2*smooth((ms-470)/290));
  }
  for(const [i,mesh]of this.sparks.entries()){
   const birth=367+i%3*17,life=240+i%4*38,age=Math.max(0,ms-birth)/1000,q=clamp((ms-birth)/life),drag=4.5,travel=-Math.expm1(-drag*age)/drag;
   const angle=-1.35+i/8*2.35,speed=(370+i*67%205)*k,vx=Math.cos(angle)*speed,vy=Math.sin(angle)*speed-35*k,g=310*k;
   const x=t.x+(7+i%3*5)*k+vx*travel,y=t.y+(-9+i%4*6)*k+vy*travel+g*(age-travel)/drag,velx=vx*Math.exp(-drag*age),vely=vy*Math.exp(-drag*age)+g*travel;
   const a=Math.atan2(vely,velx),length=(7+i%3*4)*k+Math.hypot(velx,vely)*.018,origin=point(x-Math.cos(a)*length,y-Math.sin(a)*length),end=point(x,y);
   shape(mesh,[origin,point(origin.x+(x-origin.x)*.33,origin.y+(y-origin.y)*.33),point(origin.x+(x-origin.x)*.67,origin.y+(y-origin.y)*.67),end],0,1,(6+i%3*2)*k*(1-.65*q));
   this.ink(mesh,ms,envelope(ms,birth,33.333,birth+life,life*.55),1-smooth(age*1000/50),q*.85);
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
