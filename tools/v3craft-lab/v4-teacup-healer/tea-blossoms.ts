/** A7 original tea blossoms: vertical allied growth and a rear flowering fan. */
import * as T from 'three';
import {faceDeclarations,faceUniforms,flowingNoise,vertex,type RequiemFrame,type CraftPoint} from '../../../apps/web/src/game/cardrpg/vfx-craft/lantern-requiem';
export interface TeaFrame extends RequiemFrame {ultimate:boolean;home:CraftPoint;casterFeet:CraftPoint}
type Ink=T.Mesh<T.PlaneGeometry,T.ShaderMaterial>;
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
function material(noise:T.Texture,foreground:boolean){return new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide,toneMapped:false,
 uniforms:{uTexture:{value:null},uNoise:{value:noise},uAlpha:{value:0},uTime:{value:0},uErode:{value:-.2},...faceUniforms()},
 vertexShader:vertex,fragmentShader:`uniform sampler2D uTexture,uNoise;uniform float uAlpha,uTime,uErode;varying vec2 vUv;${faceDeclarations}
 void main(){vec2 uv=vUv;uv.x+=.009*sin(uv.y*11.+uTime*2.2)*sin(uv.x*3.14159);uv.y+=.004*sin(uv.x*17.-uTime*2.8);
 vec4 paint=texture2D(uTexture,uv);float grain=texture2D(uNoise,uv*vec2(1.4,1.7)+vec2(uTime*.025,-uTime*.035)).r;
 float a=paint.a*uAlpha*smoothstep(uErode,uErode+.13,grain+vUv.y*.18)${foreground?'*faceProtection()':''};
 gl_FragColor=vec4(paint.rgb,a);#include <colorspace_fragment>
 }`.replace(';#include',';\n#include')});}
export class TeaBlossoms {
 readonly rear=new T.Group();readonly front=new T.Group();readonly ground=new T.Group();readonly ready:Promise<void>;
 readonly audit={elapsed:0,ultimate:false,source:{x:0,y:0},recipients:[] as CraftPoint[],active:0,mainShape:'cream tea blossoms, mint leaves, short steam curls; allied vertical rise and rear flowering fan'};
 private noise=flowingNoise();private textures:T.Texture[]=[];private all:Ink[]=[];private canopy:Ink;private glint:Ink;private sprigs:Ink[]=[];
 constructor(private readonly tuning:{rise?:number;canopyWidth?:number;canopyHeight?:number;textureRoot?:string}={}){
  const add=(root:T.Group,front:boolean)=>{const m=new T.Mesh(new T.PlaneGeometry(1,1),material(this.noise,front));m.frustumCulled=false;m.visible=false;root.add(m);this.all.push(m);return m;};
  this.canopy=add(this.rear,true);this.glint=add(this.front,true);for(let i=0;i<18;i++)this.sprigs.push(add(this.front,true));
  const load=async(name:string)=>{const im=new Image();im.src=`${this.tuning.textureRoot??'/vfx/teacup-healer'}/${name}.webp`;await im.decode();const tex=new T.Texture(im);tex.colorSpace=T.SRGBColorSpace;tex.needsUpdate=true;this.textures.push(tex);return tex;};
  this.ready=Promise.all([load('tea-blossom'),load('tea-canopy')]).then(([sprig,canopy])=>{for(const m of this.all)m.material.uniforms.uTexture!.value=m===this.canopy?canopy:sprig;});this.hide();
 }
 private place(m:Ink,x:number,y:number,w:number,h:number,angle:number,alpha:number,ms:number,erode=-.2){
  m.visible=alpha>.002;m.position.set(x,y,0);m.scale.set(w,-h,1);m.rotation.z=angle;const u=m.material.uniforms;u.uAlpha!.value=alpha;u.uTime!.value=ms/1000;u.uErode!.value=erode;
 }
 render(f:TeaFrame){
  const ms=f.elapsed,k=f.height/720,impact=f.ultimate?1100:350,age=ms-impact,end=f.ultimate?2200:800,px=f.worldWidth/f.width;
  for(const root of [this.rear,this.front,this.ground]){root.visible=ms>=0&&ms<end;root.position.set(-f.worldWidth/2,f.worldHeight,0);root.scale.set(px,-px,1);}
  this.rear.renderOrder=f.rearOrder;this.front.renderOrder=f.frontOrder;this.ground.renderOrder=f.rearOrder-1;for(const m of this.all)m.visible=false;
  const gather=smooth((ms-(f.ultimate?650:160))/100)*(1-smooth((ms-impact)/100));
  // The little painted leaf starts at the authored hand/spout socket. It never
  // travels towards a hostile target; the large shapes begin on heal recipients.
  this.place(this.glint,f.source.x+(0.5-0.42732919254658386)*24*k,f.source.y-25.8984375*k,24*k,52*k,0,gather*.95,ms);
  if(f.ultimate&&f.feet.length){
   const grow=smooth((ms-800)/300),decay=smooth((ms-1400)/700),w=(this.tuning.canopyWidth??920)*k*(.3+.7*grow),h=(this.tuning.canopyHeight??610)*k*(.2+.8*grow);
   const bottom=Math.min(f.height*.91,Math.max(f.casterFeet.y,...f.feet.map(p=>p.y))+65*k);
   const cx=Math.max(w/2+12*k,Math.min(f.width-w/2-12*k,f.feet.reduce((v,p)=>v+p.x,0)/f.feet.length));
   this.place(this.canopy,cx,bottom-h/2,w,h,0,ms>=800?1-decay:0,ms,-.2+decay*.95);
  }
  if(age>=0){
   const rise=smooth(age/350),fade=smooth((age-160)/(f.ultimate?650:420)),alpha=(.55+.45*smooth(age/70))*(1-fade);
   for(const [target,p]of f.feet.slice(0,6).entries())for(let i=0;i<3;i++){
    const drift=f.reducedMotion?0:Math.sin(age/290+i*1.2)*3*k,dx=[-52,0,54][i]!;
    this.place(this.sprigs[target*3+i]!,p.x+dx*k+drift,p.y-(82+(this.tuning.rise??60)*rise)*k,(66+5*i)*k,(148+12*i)*k,(i-1)*.09,alpha,ms,-.2+fade*.8);
   }
  }
  for(const m of this.all){const u=m.material.uniforms;u.uFaceCount!.value=Math.min(16,f.faces.length);for(const [i,face]of f.faces.slice(0,16).entries())u.uFaces!.value[i].set((face.x+face.width/2)*px-f.worldWidth/2,f.worldHeight-(face.y+face.height/2)*px,(face.width/2+6)*px,(face.height/2+6)*px);}
  Object.assign(this.audit,{elapsed:ms,ultimate:f.ultimate,source:{...f.source},recipients:f.feet.map(p=>({...p})),active:this.all.filter(m=>m.visible).length});
 }
 hide(){this.rear.visible=this.front.visible=this.ground.visible=false;}
 dispose(){for(const m of this.all){m.geometry.dispose();m.material.dispose();}for(const t of this.textures)t.dispose();this.noise.dispose();for(const r of [this.rear,this.front,this.ground])r.removeFromParent();}
}
