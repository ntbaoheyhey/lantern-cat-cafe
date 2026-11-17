/** Mochi's original painted cut and shield crest. LEARN/A4.md; no rules clock. */
import * as T from 'three';
import {loadCraftImage} from '../spine/craft-image-loader';
import {faceDeclarations,faceUniforms,flowingNoise,vertex,type RequiemFrame,type CraftPoint} from './lantern-requiem';
export interface ShieldFrame extends RequiemFrame {ultimate:boolean;home:CraftPoint;casterFeet:CraftPoint}
type Ink=T.Mesh<T.PlaneGeometry,T.ShaderMaterial>;
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
const envelope=(t:number,start:number,rise:number,end:number,fall:number)=>smooth((t-start)/rise)*(1-smooth((t-end+fall)/fall));
function material(noise:T.Texture,foreground:boolean){return new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide,toneMapped:false,
 uniforms:{uTexture:{value:null},uNoise:{value:noise},uAlpha:{value:0},uTime:{value:0},uErode:{value:-.2},uHeat:{value:0},uTint:{value:new T.Color('white')},...faceUniforms()},
 vertexShader:vertex,fragmentShader:`uniform sampler2D uTexture;uniform sampler2D uNoise;uniform float uAlpha,uTime,uErode,uHeat;uniform vec3 uTint;varying vec2 vUv;
 ${faceDeclarations}
 void main(){vec2 uv=vUv;uv.x+=.004*sin(uv.y*17.+uTime*3.)*sin(uv.x*3.14159);vec4 paint=texture2D(uTexture,uv);
 float grain=texture2D(uNoise,uv*vec2(1.7,1.2)+vec2(-uTime*.035,uTime*.045)).r;
 float a=paint.a*uAlpha*smoothstep(uErode,uErode+.14,grain+vUv.y*.12)${foreground?'*faceProtection()':''};
 vec3 rgb=mix(paint.rgb*uTint,vec3(1.,.94,.72),uHeat*.35);gl_FragColor=vec4(rgb,a);
 #include <colorspace_fragment>
 }`});}
export class ShieldStrike {
 readonly rear=new T.Group();readonly front=new T.Group();readonly ground=new T.Group();readonly ready:Promise<void>;
 readonly audit={elapsed:0,ultimate:false,source:{x:0,y:0},mainShape:'painted crescent cut and angular gold/teal shield crest',active:0};
 private disposed=false;private noise=flowingNoise();private textures:T.Texture[]=[];private all:Ink[]=[];
 private cut:Ink;private crest:Ink;private shards:Ink[]=[];private dust:Ink[]=[];
 constructor(){
  const add=(root:T.Group,foreground:boolean)=>{const mesh=new T.Mesh(new T.PlaneGeometry(1,1),material(this.noise,foreground));mesh.frustumCulled=false;mesh.visible=false;root.add(mesh);this.all.push(mesh);return mesh;};
  this.cut=add(this.front,true);this.crest=add(this.rear,false);
  for(let i=0;i<7;i++)this.shards.push(add(this.front,true));
  for(let i=0;i<4;i++)this.dust.push(add(this.ground,false));
  const load=async(name:string)=>{const image=await loadCraftImage(`/vfx/mochi/${name}.webp`);if(this.disposed)return;const texture=new T.Texture(image);texture.colorSpace=T.SRGBColorSpace;texture.needsUpdate=true;this.textures.push(texture);return texture;};
  this.ready=Promise.all([load('shield-cut'),load('shield-crest')]).then(([cut,crest])=>{if(this.disposed)return;for(const mesh of this.all)mesh.material.uniforms.uTexture!.value=mesh===this.crest?crest:cut;});this.hide();
 }
 private place(mesh:Ink,x:number,y:number,w:number,h:number,angle:number,alpha:number,ms:number,erode=-.2,heat=0){
  mesh.visible=alpha>.002;mesh.position.set(x,y,0);mesh.scale.set(w,-h,1);mesh.rotation.z=angle;
  const u=mesh.material.uniforms;u.uAlpha!.value=alpha;u.uTime!.value=ms/1000;u.uErode!.value=erode;u.uHeat!.value=heat;
 }
 render(f:ShieldFrame){
  const ms=f.elapsed,k=f.height/720,impact=f.ultimate?1100:350,age=ms-impact,end=f.ultimate?2200:800,px=f.worldWidth/f.width;
  const held=age>=0&&age<90?impact:ms,fade=smooth((held-impact-90)/(f.ultimate?650:250));
  for(const root of [this.rear,this.front,this.ground]){root.visible=ms>=0&&ms<end;root.position.set(-f.worldWidth/2,f.worldHeight,0);root.scale.set(px,-px,1);}
  this.rear.renderOrder=f.rearOrder;this.front.renderOrder=f.frontOrder;this.ground.renderOrder=f.rearOrder-1;
  for(const mesh of this.all)mesh.visible=false;
  const s=f.source,cutAlpha=envelope(ms,impact-100,45,impact+300,180);
  if(!f.ultimate)this.place(this.cut,s.x,s.y,145*k*(.78+.22*smooth((held-impact+100)/100)),185*k,-.12,cutAlpha,held,-.2+fade*1.2,age>=0&&age<67?1:0);
  if(f.ultimate){
   const grow=smooth((held-800)/300),decay=smooth((held-1190)/800),width=980*k*(.3+.7*grow),height=520*k*(.2+.8*grow);
   const bottom=Math.min(f.height*.91,Math.max(f.casterFeet.y,...f.feet.map(p=>p.y))+95*k),cx=Math.max(width/2+12*k,Math.min(f.width-width/2-12*k,f.feet.reduce((n,p)=>n+p.x,0)/Math.max(1,f.feet.length)));
   this.place(this.crest,cx,bottom-height/2,width,height,0,envelope(ms,800,300,2100,700),held,-.2+decay*1.12,age>=0&&age<67?.25:0);
  }
  if(!f.ultimate)for(const [i,mesh]of this.shards.entries()){
   const a=-1.2+i*.39,q=smooth((held-impact-55)/320),distance=(28+56*q+i*8)*k;
   this.place(mesh,s.x+Math.cos(a)*distance,s.y+Math.sin(a)*distance,(18+i*3)*k,(43+i*4)*k,a+.4,envelope(ms,impact+22+i*5,24,impact+430+i*13,250)*.78,held,-.1+q*.9);
  }
  if(!f.ultimate&&!f.reducedMotion)for(const [i,mesh]of this.dust.entries()){
   const returning=i>=2,start=returning?(f.ultimate?2150:750):(f.ultimate?600:100),q=smooth((ms-start)/160),foot=f.home;
   this.place(mesh,foot.x-(i%2?1:-1)*(18+35*q)*k,foot.y+5*k,70*k,18*k,i%2?.15:-.15,envelope(ms,start,25,start+220,150)*.48,ms,-.1+q*.75);
  }
  for(const mesh of this.all){const u=mesh.material.uniforms;u.uFaceCount!.value=Math.min(16,f.faces.length);for(const [i,face]of f.faces.slice(0,16).entries())u.uFaces!.value[i].set((face.x+face.width/2)*px-f.worldWidth/2,f.worldHeight-(face.y+face.height/2)*px,(face.width/2+6)*px,(face.height/2+6)*px);}
  Object.assign(this.audit,{elapsed:ms,ultimate:f.ultimate,source:{...s},active:this.all.filter(m=>m.visible).length});
 }
 hide(){this.rear.visible=this.front.visible=this.ground.visible=false;}
 dispose(){if(this.disposed)return;this.disposed=true;for(const mesh of this.all){mesh.geometry.dispose();mesh.material.dispose();}for(const texture of this.textures)texture.dispose();this.noise.dispose();for(const root of [this.rear,this.front,this.ground])root.removeFromParent();}
}
