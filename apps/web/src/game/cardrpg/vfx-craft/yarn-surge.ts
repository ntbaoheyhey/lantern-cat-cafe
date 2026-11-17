/** Original braided-yarn impact and low three-braid fan. LEARN/A7.md. */
import * as T from 'three';
import {faceDeclarations,faceUniforms,flowingNoise,vertex,type RequiemFrame,type CraftPoint} from './lantern-requiem';

export interface YarnFrame extends RequiemFrame {ultimate:boolean;home:CraftPoint;casterFeet:CraftPoint}
export interface YarnTuning {width:number;height:number;textureUrl:string;tip:[number,number]}
type Ink=T.Mesh<T.PlaneGeometry,T.ShaderMaterial>;
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
const envelope=(ms:number,start:number,rise:number,end:number,fall:number)=>smooth((ms-start)/rise)*(1-smooth((ms-end+fall)/fall));

function material(noise:T.Texture){return new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide,toneMapped:false,
 uniforms:{uTexture:{value:null},uNoise:{value:noise},uAlpha:{value:0},uTime:{value:0},uErode:{value:-.2},uHeat:{value:0},uBurst:{value:0},...faceUniforms()},
 vertexShader:vertex,fragmentShader:`uniform sampler2D uTexture,uNoise;uniform float uAlpha,uTime,uErode,uHeat,uBurst;varying vec2 vUv;${faceDeclarations}
 void main(){vec4 paint=texture2D(uTexture,vUv);
 if(uBurst>.5){
  vec2 q=(vUv-.5)*2.;float r=length(q),noise=texture2D(uNoise,vUv*2.7).r;
  float head=.12+clamp(uTime/.22,0.,1.)*.75;
  float strands=pow(max(0.,cos(atan(q.y,q.x)*8.+noise*.8+r*1.7)),18.);
  float trail=smoothstep(head-.32,head-.12,r)*(1.-smoothstep(head-.03,head+.06,r));
  paint=vec4(mix(vec3(.65,.27,.58),vec3(1.,.91,.72),pow(strands,2.)),strands*trail*(.6+.4*noise));
 }
 float fibre=texture2D(uNoise,vUv*vec2(2.3,1.1)+vec2(-uTime*.018,uTime*.009)).r;
 float a=paint.a*uAlpha*smoothstep(uErode,uErode+.1,fibre+vUv.y*.10)*faceProtection();
 gl_FragColor=vec4(mix(paint.rgb,vec3(.94,.78,.58),uHeat*.10),a);
 #include <colorspace_fragment>
 }`});}

export class YarnSurge {
 readonly ground=new T.Group();readonly rear=new T.Group();readonly front=new T.Group();readonly ready:Promise<void>;
 readonly audit={elapsed:0,ultimate:false,source:{x:0,y:0},paintedTip:{x:0,y:0},socketError:0,active:0,mainShape:'three heavy woven braids; low outward fan'};
 private disposed=false;private noise=flowingNoise();private texture:T.Texture|undefined;private all:Ink[]=[];private cut:Ink;private wave:Ink;private echo:Ink;private contact:Ink;
 constructor(private tuning:YarnTuning={width:1180,height:472,textureUrl:'/vfx/yarn-giant/braid-wave.webp',tip:[.99609375,.6085365853658536]}){
  const add=(root:T.Group)=>{const m=new T.Mesh(new T.PlaneGeometry(1,1),material(this.noise));m.frustumCulled=false;m.visible=false;root.add(m);this.all.push(m);return m;};
  this.cut=add(this.front);this.wave=add(this.rear);this.echo=add(this.ground);this.contact=add(this.front);this.contact.material.uniforms.uBurst!.value=1;
  this.ready=(async()=>{const image=new Image();image.src=this.tuning.textureUrl;await image.decode();if(this.disposed)return;const tex=this.texture=new T.Texture(image);tex.colorSpace=T.SRGBColorSpace;tex.needsUpdate=true;for(const m of this.all)m.material.uniforms.uTexture!.value=tex;})();
  this.hide();
 }
 private place(m:Ink,x:number,y:number,w:number,h:number,alpha:number,ms:number,erode=-.2,heat=0){
  m.visible=alpha>.002;m.position.set(x,y,0);m.scale.set(w,-h,1);const u=m.material.uniforms;u.uAlpha!.value=alpha;u.uTime!.value=ms/1000;u.uErode!.value=erode;u.uHeat!.value=heat;
 }
 render(f:YarnFrame){
  const ms=f.elapsed,k=f.height/720,impact=f.ultimate?1100:350,age=ms-impact,end=f.ultimate?2200:800,px=f.worldWidth/f.width;
  const held=age>=0&&age<90?impact:ms,source=f.source;
  for(const root of [this.ground,this.rear,this.front]){root.visible=ms>=0&&ms<end;root.position.set(-f.worldWidth/2,f.worldHeight,0);root.scale.set(px,-px,1);}
  this.ground.renderOrder=f.rearOrder-1;this.rear.renderOrder=f.rearOrder;this.front.renderOrder=f.frontOrder;for(const m of this.all)m.visible=false;
  let tip={...source};
  if(!f.ultimate){
   const w=190*k,h=76*k,fade=smooth((held-440)/280),[tx,ty]=this.tuning.tip;
   const x=source.x+w*(.5-tx),y=source.y+h*(.5-ty);
   this.place(this.cut,x,y,w,h,envelope(ms,280,70,720,280),held,-.2+fade*1.0,age>=0&&age<67?1:0);
   tip={x:x+w*(tx-.5),y:y+h*(ty-.5)};
   if(!f.reducedMotion)this.place(this.echo,f.home.x,f.home.y+5*k,90*k,18*k,envelope(ms,100,25,360,160)*.28,held);
  }else if(ms>=600){
   const grow=smooth((held-600)/500),decay=smooth((held-1560)/620),w=Math.min(this.tuning.width*k,f.width-32*k)*(.24+.76*grow),h=this.tuning.height*k*(.24+.76*grow);
   const destination=f.width*.50,cx=Math.max(w/2+16*k,Math.min(f.width-w/2-16*k,source.x*(1-grow)+destination*grow));
   const bottom=Math.min(f.height*.94,Math.max(f.casterFeet.y+28*k,f.height*.88));
   this.place(this.wave,cx,bottom-h/2,w,h,1-decay,held,-.2+decay*1.04,age>=0&&age<67?1:0);
   this.place(this.echo,cx,bottom+4*k,w*.96,62*k,(1-decay)*.23,held,-.2+decay*.9);
   // A short original-texture contact flash stays on the visible fist socket.
   const [tx,ty]=this.tuning.tip,fw=70*k,fh=28*k;
   this.place(this.cut,source.x+fw*(.5-tx),source.y+fh*(.5-ty),fw,fh,envelope(ms,1060,40,1300,170),held,-.2,age>=0&&age<67?1:0);
  }
  if(age>=0&&age<220){
   const alpha=(f.reducedMotion?.3:.85)*(1-age/220);
   this.place(this.contact,source.x,source.y,96*k,76*k,alpha,f.reducedMotion?40:age);
  }
  for(const m of this.all){const u=m.material.uniforms;u.uFaceCount!.value=Math.min(16,f.faces.length);for(const [i,face]of f.faces.slice(0,16).entries())u.uFaces!.value[i].set((face.x+face.width/2)*px-f.worldWidth/2,f.worldHeight-(face.y+face.height/2)*px,(face.width/2+6)*px,(face.height/2+6)*px);}
  Object.assign(this.audit,{elapsed:ms,ultimate:f.ultimate,source:{...source},paintedTip:tip,socketError:Math.hypot(tip.x-source.x,tip.y-source.y),active:this.all.filter(m=>m.visible).length});
 }
 hide(){for(const root of [this.ground,this.rear,this.front])root.visible=false;for(const m of this.all)m.visible=false;this.audit.active=0;}
 dispose(){if(this.disposed)return;this.disposed=true;this.texture?.dispose();this.noise.dispose();for(const m of this.all){m.geometry.dispose();m.material.dispose();}for(const root of [this.ground,this.rear,this.front])root.removeFromParent();}
}
