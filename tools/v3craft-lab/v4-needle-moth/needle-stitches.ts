/** A7 lab: straight needle release, followed by three staggered stitched fans. */
import * as T from 'three';
import {faceDeclarations,faceUniforms,flowingNoise,vertex,type RequiemFrame,type CraftPoint} from '../../../apps/web/src/game/cardrpg/vfx-craft/lantern-requiem';
type Ink=T.Mesh<T.PlaneGeometry,T.ShaderMaterial>;
export interface NeedleFrame extends RequiemFrame {ultimate:boolean}
export interface NeedleTuning {travel?:number;spread?:number;length?:number;count?:number;thickness?:number;textureUrl:string;aspect:number;tip:[number,number]}
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
export function needleFlight(ms:number,impact:number,travel:number){
 const start=impact-travel;
 return {active:ms>=start&&ms<impact,progress:clamp((ms-start)/travel),alpha:ms>=start&&ms<impact?smooth((ms-start)/15):0};
}
function material(noise:T.Texture){
 return new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide,toneMapped:false,
  uniforms:{uTexture:{value:null},uNoise:{value:noise},uAlpha:{value:0},uErode:{value:-.2},...faceUniforms()},vertexShader:vertex,
  fragmentShader:`uniform sampler2D uTexture,uNoise;uniform float uAlpha,uErode;varying vec2 vUv;${faceDeclarations}
  void main(){vec4 paint=texture2D(uTexture,vUv);float grain=texture2D(uNoise,vUv*vec2(3.,1.)).r;
   float a=paint.a*uAlpha*smoothstep(uErode,uErode+.10,grain+vUv.x*.10)*faceProtection();
   gl_FragColor=vec4(paint.rgb,a);
   #include <colorspace_fragment>
  }`});
}
export class NeedleStitches {
 readonly rear=new T.Group();readonly front=new T.Group();readonly ground=new T.Group();readonly ready:Promise<void>;
 readonly audit={elapsed:0,source:{x:0,y:0},launch:{x:0,y:0},head:{x:0,y:0},target:{x:0,y:0},flight:false,active:0,mainShape:'original gold sewing needle and rose zigzag stitches; three descending oblique fans'};
 private noise=flowingNoise();private texture?:T.Texture;private all:Ink[]=[];private needle:Ink;private contacts:Ink[]=[];private fan:Ink[]=[];private disposed=false;
 constructor(private tuning:NeedleTuning){
  const add=(root:T.Group)=>{const m=new T.Mesh(new T.PlaneGeometry(1,1),material(this.noise));m.frustumCulled=false;m.visible=false;root.add(m);this.all.push(m);return m;};
  this.needle=add(this.front);for(let i=0;i<3;i++)this.contacts.push(add(this.front));
  for(let i=0;i<(tuning.count??18);i++)this.fan.push(add(this.rear));
  this.ready=(async()=>{const im=new Image();im.src=tuning.textureUrl;await im.decode();if(this.disposed)return;
   const texture=this.texture=new T.Texture(im);texture.colorSpace=T.SRGBColorSpace;texture.needsUpdate=true;
   for(const m of this.all)m.material.uniforms.uTexture!.value=texture;
  })();this.hide();
 }
 private place(m:Ink,p:CraftPoint,w:number,angle:number,alpha:number,erode=-.2){
  m.visible=alpha>.002;m.position.set(p.x,p.y,0);m.scale.set(w,-w*this.tuning.aspect,1);m.rotation.z=angle;
  m.material.uniforms.uAlpha!.value=alpha;m.material.uniforms.uErode!.value=erode;
 }
 render(f:NeedleFrame){
  const ms=f.elapsed,k=f.height/720,impact=f.ultimate?1100:350,end=f.ultimate?2200:800,age=ms-impact,px=f.worldWidth/f.width;
  const target=f.targets[0]??f.source,launch=(f.ultimate?f.releaseSource:f.windupSource)??f.source;
  const flight=needleFlight(ms,impact,this.tuning.travel??150);
  const head={x:launch.x+(target.x-launch.x)*flight.progress,y:launch.y+(target.y-launch.y)*flight.progress};
  const angle=Math.atan2(target.y-launch.y,target.x-launch.x)-Math.PI;
  for(const root of [this.rear,this.front,this.ground]){root.visible=ms>=0&&ms<end;root.position.set(-f.worldWidth/2,f.worldHeight,0);root.scale.set(px,-px,1);}
  this.rear.renderOrder=f.rearOrder;this.front.renderOrder=f.frontOrder;this.ground.renderOrder=f.rearOrder-1;
  for(const m of this.all)m.visible=false;
  const width=205*k,dx=(.5-this.tuning.tip[0])*width,dy=(.5-this.tuning.tip[1])*width*this.tuning.aspect;
  this.place(this.needle,{x:head.x+Math.cos(angle)*dx-Math.sin(angle)*dy,y:head.y+Math.sin(angle)*dx+Math.cos(angle)*dy},width,angle,flight.alpha);
  const hold=f.ultimate?640:240,alpha=age<0?0:1-smooth((age-hold+100)/100),decay=smooth((age-hold+150)/150);
  for(const [i,p]of f.targets.slice(0,3).entries())this.place(this.contacts[i]!,p,(f.ultimate?230:170)*k,-.55+i*.18,alpha,-.2+decay);
  if(f.ultimate&&alpha>0){
   const spread=(this.tuning.spread??850)*k,length=(this.tuning.length??520)*k;
   const cx=Math.max(spread/2+60*k,Math.min(f.width-spread/2-60*k,target.x));
   const cy=Math.max(length/2+85*k,Math.min(f.height-length/2-75*k,target.y-45*k));
   for(const [i,m]of this.fan.entries()){
    const rank=i%3,column=Math.floor(i/3),columns=Math.ceil(this.fan.length/3),u=(column+.5)/columns;
    const open=smooth((age-rank*45-column*8)/70),tilt=(u-.5)*.7+(rank-1)*.16;
    const p={x:cx+(u-.5)*spread+(rank-1)*20*k,y:cy+(rank-1)*65*k-(1-open)*55*k};
    this.place(m,p,length,-Math.PI/2+tilt,alpha*open*.9,-.2+decay);
    m.scale.y*=this.tuning.thickness??1;
   }
  }
  for(const m of this.all){const u=m.material.uniforms;u.uFaceCount!.value=Math.min(16,f.faces.length);
   for(const [i,face]of f.faces.slice(0,16).entries())u.uFaces!.value[i].set((face.x+face.width/2)*px-f.worldWidth/2,f.worldHeight-(face.y+face.height/2)*px,(face.width/2+6)*px,(face.height/2+6)*px);
  }
  Object.assign(this.audit,{elapsed:ms,source:{...f.source},launch:{...launch},head,target:{...target},flight:flight.active&&flight.alpha>.05,active:this.all.filter(m=>m.visible).length});
 }
 hide(){this.rear.visible=this.front.visible=this.ground.visible=false;}
 dispose(){this.disposed=true;for(const m of this.all){m.geometry.dispose();m.material.dispose();}this.texture?.dispose();this.noise.dispose();for(const root of [this.rear,this.front,this.ground])root.removeFromParent();}
}
