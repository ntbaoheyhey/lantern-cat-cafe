/** Panko's crust cut and three opening bread doors. Original art; LEARN/A6.md. */
import * as T from 'three';
import {faceDeclarations,faceUniforms,flowingNoise,vertex,type RequiemFrame,type CraftPoint} from './lantern-requiem';
export interface OvenFrame extends RequiemFrame {ultimate:boolean;home:CraftPoint;casterFeet:CraftPoint}
type Ink=T.Mesh<T.PlaneGeometry,T.ShaderMaterial>;
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
const envelope=(t:number,start:number,rise:number,end:number,fall:number)=>smooth((t-start)/rise)*(1-smooth((t-end+fall)/fall));
function material(noise:T.Texture,foreground:boolean){return new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide,toneMapped:false,
 uniforms:{uTexture:{value:null},uNoise:{value:noise},uAlpha:{value:0},uTime:{value:0},uErode:{value:-.2},uSlice:{value:new T.Vector2(0,1)},uHeat:{value:0},...faceUniforms()},
 vertexShader:vertex,fragmentShader:`uniform sampler2D uTexture,uNoise;uniform float uAlpha,uTime,uErode,uHeat;uniform vec2 uSlice;varying vec2 vUv;${faceDeclarations}
 void main(){vec2 uv=vec2(mix(uSlice.x,uSlice.y,vUv.x),vUv.y);vec4 paint=texture2D(uTexture,uv);
 float grain=texture2D(uNoise,uv*vec2(2.1,1.3)+vec2(-uTime*.021,uTime*.014)).r;
 float a=paint.a*uAlpha*smoothstep(uErode,uErode+.12,grain+vUv.y*.12)${foreground?'*faceProtection()':''};
 gl_FragColor=vec4(mix(paint.rgb,vec3(1.,.92,.72),uHeat*.2),a);
 #include <colorspace_fragment>
 }`});}
export class OvenBastion {
 readonly rear=new T.Group();readonly front=new T.Group();readonly ground=new T.Group();readonly ready:Promise<void>;
 readonly audit={elapsed:0,ultimate:false,source:{x:0,y:0},recipients:[] as CraftPoint[],active:0,mainShape:'painted crust cut; three hinged bread doors behind the caster'};
 private noise=flowingNoise();private textures:T.Texture[]=[];private all:Ink[]=[];private cut:Ink;private doors:Ink[]=[];private crumbs:Ink[]=[];private dust:Ink[]=[];
 constructor(){
  const add=(root:T.Group,foreground:boolean)=>{const m=new T.Mesh(new T.PlaneGeometry(1,1),material(this.noise,foreground));m.frustumCulled=false;m.visible=false;root.add(m);this.all.push(m);return m;};
  this.cut=add(this.front,true);for(let i=0;i<3;i++)this.doors.push(add(this.rear,false));for(let i=0;i<6;i++)this.crumbs.push(add(this.front,true));for(let i=0;i<4;i++)this.dust.push(add(this.ground,false));
  const slices=[[0,.30],[.30,.70],[.70,1]];this.doors.forEach((m,i)=>m.material.uniforms.uSlice!.value.set(...slices[i]!));
  const load=async(name:string)=>{const image=new Image();image.src=`/vfx/panko/${name}.webp`;await image.decode();const tex=new T.Texture(image);tex.colorSpace=T.SRGBColorSpace;tex.needsUpdate=true;this.textures.push(tex);return tex;};
  this.ready=Promise.all([load('crust-cut'),load('oven-bastion')]).then(([cut,doors])=>{for(const m of this.all)m.material.uniforms.uTexture!.value=this.doors.includes(m)?doors:cut;});this.hide();
 }
 private place(m:Ink,x:number,y:number,w:number,h:number,angle:number,alpha:number,ms:number,erode=-.2,heat=0){
  m.visible=alpha>.002;m.position.set(x,y,0);m.scale.set(w,-h,1);m.rotation.z=angle;const u=m.material.uniforms;u.uAlpha!.value=alpha;u.uTime!.value=ms/1000;u.uErode!.value=erode;u.uHeat!.value=heat;
 }
 render(f:OvenFrame){
  const ms=f.elapsed,k=f.height/720,impact=f.ultimate?1100:350,age=ms-impact,end=f.ultimate?2200:800,px=f.worldWidth/f.width;
  const held=age>=0&&age<90?impact:ms,fade=smooth((held-impact-90)/280),s=f.source;
  for(const root of [this.rear,this.front,this.ground]){root.visible=ms>=0&&ms<end;root.position.set(-f.worldWidth/2,f.worldHeight,0);root.scale.set(px,-px,1);}
  this.rear.renderOrder=f.rearOrder;this.front.renderOrder=f.frontOrder;this.ground.renderOrder=f.rearOrder-1;for(const m of this.all)m.visible=false;
  if(!f.ultimate){
   const w=170*k*(.7+.3*smooth((held-250)/100)),h=w*424/768;
   // The painted tip is (7,376) in the768x424texture, measured at alpha>=128.
   this.place(this.cut,s.x+w*(.5-7/768),s.y+h*(.5-376/424),w,h,0,envelope(ms,250,45,690,250),held,-.2+fade*1.03,age>=0&&age<67?1:0);
   for(const [i,m]of this.crumbs.entries()){
    const travel=smooth((held-405)/330),a=-.9+i*.29,d=(26+80*travel+i*7)*k;
    this.place(m,s.x+Math.cos(a)*d,s.y+Math.sin(a)*d,(20+i*3)*k,(12+i*2)*k,a+.12*travel,envelope(ms,370+i*8,30,760+i*5,250)*.78,held,-.1+travel*.8);
   }
  }else{
   const grow=smooth((held-600)/500),opened=smooth((held-720)/380),decay=smooth((held-1490)/610),w=760*k,h=460*k*(.35+.65*grow);
   const cx=Math.max(w/2+16*k,Math.min(f.width-w/2-16*k,f.casterFeet.x)),bottom=Math.min(f.height*.93,f.casterFeet.y+40*k);
   const slices=[[0,.30],[.30,.70],[.70,1]];
   for(const [i,m]of this.doors.entries()){
    const [a,b]=slices[i]!,q=(a!+b!)/2-.5,span=(b!-a!)*w*(i===1?1:.12+.88*opened);
    this.place(m,cx+q*w*(.3+.7*opened),bottom-h/2,span,h,0,ms>=600?1-decay:0,held,-.2+decay*.95,age>=0&&age<67?.2:0);
   }
  }
  if(!f.ultimate&&!f.reducedMotion)for(const [i,m]of this.dust.entries()){
   const start=i<2?100:750,q=smooth((ms-start)/160);
   this.place(m,f.home.x+(i%2?1:-1)*(20+30*q)*k,f.home.y+5*k,65*k,14*k,i%2?.1:-.1,envelope(ms,start,25,start+220,150)*.42,ms,-.1+q*.8);
  }
  for(const m of this.all){const u=m.material.uniforms;u.uFaceCount!.value=Math.min(16,f.faces.length);for(const [i,face]of f.faces.slice(0,16).entries())u.uFaces!.value[i].set((face.x+face.width/2)*px-f.worldWidth/2,f.worldHeight-(face.y+face.height/2)*px,(face.width/2+6)*px,(face.height/2+6)*px);}
  Object.assign(this.audit,{elapsed:ms,ultimate:f.ultimate,source:{...s},recipients:f.feet.map(p=>({...p})),active:this.all.filter(m=>m.visible).length});
 }
 hide(){this.rear.visible=this.front.visible=this.ground.visible=false;}
 dispose(){for(const m of this.all){m.geometry.dispose();m.material.dispose();}for(const t of this.textures)t.dispose();this.noise.dispose();for(const r of [this.rear,this.front,this.ground])r.removeFromParent();}
}
