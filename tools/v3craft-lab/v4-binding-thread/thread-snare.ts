/** A7 original knotted cord: late ranged throw and a local two-strand snare. */
import * as T from 'three';
import {faceDeclarations,faceUniforms,flowingNoise,vertex,type RequiemFrame,type CraftPoint} from '../../../apps/web/src/game/cardrpg/vfx-craft/lantern-requiem';
type Ink=T.Mesh<T.PlaneGeometry,T.ShaderMaterial>;
export interface ThreadFrame extends RequiemFrame {ultimate:boolean}
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
export function threadFlight(ms:number,impact=350,travel=150){
 const start=impact-travel;
 return {active:ms>=start&&ms<impact,progress:clamp((ms-start)/travel),alpha:ms>=start&&ms<impact?smooth((ms-start)/15):0};
}
const envelope=(t:number,start:number,rise:number,end:number,fall:number)=>smooth((t-start)/rise)*(1-smooth((t-end+fall)/fall));
function material(noise:T.Texture){
 return new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide,toneMapped:false,
  uniforms:{uTexture:{value:null},uNoise:{value:noise},uAlpha:{value:0},uErode:{value:-.2},uCordOnly:{value:0},...faceUniforms()},vertexShader:vertex,
  fragmentShader:`uniform sampler2D uTexture,uNoise;uniform float uAlpha,uErode,uCordOnly;varying vec2 vUv;${faceDeclarations}
  void main(){vec2 uv=vec2(mix(vUv.x,.16+vUv.x*.84,uCordOnly),vUv.y);vec4 paint=texture2D(uTexture,uv);float grain=texture2D(uNoise,vUv*vec2(3.,1.)).r;
   float a=paint.a*uAlpha*smoothstep(uErode,uErode+.10,grain+vUv.x*.12)*faceProtection();
   gl_FragColor=vec4(paint.rgb,a);
   #include <colorspace_fragment>
  }`});
}
export class ThreadSnare {
 readonly rear=new T.Group();readonly front=new T.Group();readonly ground=new T.Group();readonly ready:Promise<void>;
 readonly audit={elapsed:0,source:{x:0,y:0},launch:{x:0,y:0},head:{x:0,y:0},target:{x:0,y:0},flight:false,active:0,mainShape:'original braided knot and frayed cord; crossed painted strands at target'};
 private noise=flowingNoise();private texture?:T.Texture;private all:Ink[]=[];private knot:Ink;private hand:Ink;private wraps:Ink[]=[];private net:Ink[]=[];
 constructor(private travel=150,url='/vfx/binding-thread/knotted-thread.webp'){
  const add=()=>{const m=new T.Mesh(new T.PlaneGeometry(1,1),material(this.noise));m.frustumCulled=false;m.visible=false;this.front.add(m);this.all.push(m);return m;};
  this.knot=add();this.hand=add();for(let i=0;i<6;i++)this.wraps.push(add());
  for(let i=0;i<24;i++){const strand=add();strand.material.uniforms.uCordOnly!.value=1;this.front.remove(strand);this.rear.add(strand);this.net.push(strand);}
  this.ready=(async()=>{const im=new Image();im.src=url;await im.decode();const texture=this.texture=new T.Texture(im);texture.colorSpace=T.SRGBColorSpace;texture.needsUpdate=true;for(const m of this.all)m.material.uniforms.uTexture!.value=texture;})();this.hide();
 }
 private place(m:Ink,p:CraftPoint,w:number,angle:number,alpha:number,erode=-.2){
  m.visible=alpha>.002;m.position.set(p.x,p.y,0);m.scale.set(w,-w*139/768,1);m.rotation.z=angle;
  m.material.uniforms.uAlpha!.value=alpha;m.material.uniforms.uErode!.value=erode;
 }
 render(f:ThreadFrame){
  const ms=f.elapsed,k=f.height/720,impact=f.ultimate?1100:350,end=f.ultimate?2200:800,age=ms-impact,px=f.worldWidth/f.width;
  const target=f.targets[0]??f.source,launch=(f.ultimate?f.releaseSource:f.windupSource)??f.source,flight=threadFlight(ms,impact,this.travel);
  const head={x:launch.x+(target.x-launch.x)*flight.progress,y:launch.y+(target.y-launch.y)*flight.progress-Math.sin(Math.PI*flight.progress)*18*k};
  const angle=Math.atan2(target.y-launch.y,target.x-launch.x)-Math.PI;
  for(const root of [this.rear,this.front,this.ground]){root.visible=ms>=0&&ms<end;root.position.set(-f.worldWidth/2,f.worldHeight,0);root.scale.set(px,-px,1);}
  this.rear.renderOrder=f.rearOrder;this.front.renderOrder=f.frontOrder;this.ground.renderOrder=f.rearOrder-1;
  for(const m of this.all)m.visible=false;
  // The leading knot centre is (67,70) in the768x139 original texture.
  const w=185*k,offset=(.5-67/768)*w;
  this.place(this.knot,{x:head.x+Math.cos(angle)*offset,y:head.y+Math.sin(angle)*offset},w,angle,flight.alpha);
  this.place(this.hand,f.source,70*k,angle,envelope(ms,impact-this.travel-45,25,impact-this.travel+40,40)*.7);
  const hold=f.ultimate?700:260,alpha=ms<impact?0:1-smooth((age-hold+100)/100),decay=smooth((age-hold+130)/130);
  for(const [i,p] of f.targets.slice(0,3).entries())for(let j=0;j<2;j++){
   this.place(this.wraps[i*2+j]!,{x:p.x+(j?7:-7)*k,y:p.y+(j?8:-8)*k},(f.ultimate?205:165)*k,j?Math.PI-.25:.25,alpha*.9,-.2+decay*.9);
  }
  // A woven trap opens behind the victims. Each crossing is the original cord
  // painting, with open diamonds between strands; no opaque screen wash.
  if(f.ultimate&&alpha>0){
   const spread=.45+.55*smooth(age/100),width=800*k*spread,height=440*k*spread;
   const cx=Math.max(width/2+70*k,Math.min(f.width-width/2-70*k,target.x));
   const cy=Math.max(height/2+90*k,Math.min(f.height-height/2-90*k,target.y-65*k));
   for(let direction=0;direction<2;direction++)for(let i=0;i<12;i++){
    const slope=(direction?-1:1)*height/width,offset=((i+.5)/12- .5)*height*1.8;
    let x0=-width/2,x1=width/2;
    const a=(-height/2-offset)/slope,b=(height/2-offset)/slope;
    x0=Math.max(x0,Math.min(a,b));x1=Math.min(x1,Math.max(a,b));
    const y0=slope*x0+offset,y1=slope*x1+offset,length=Math.hypot(x1-x0,y1-y0);
    const strand=this.net[direction*12+i]!;
    this.place(strand,{x:cx+(x0+x1)/2,y:cy+(y0+y1)/2},length,Math.atan2(y1-y0,x1-x0)+(i%2?Math.PI:0),alpha*.92*smooth((age-i*6)/65),-.2+decay*.9);
    strand.scale.y*=1.2;
   }
  }
  for(const m of this.all){const u=m.material.uniforms;u.uFaceCount!.value=Math.min(16,f.faces.length);for(const [i,face]of f.faces.slice(0,16).entries())u.uFaces!.value[i].set((face.x+face.width/2)*px-f.worldWidth/2,f.worldHeight-(face.y+face.height/2)*px,(face.width/2+6)*px,(face.height/2+6)*px);}
  Object.assign(this.audit,{elapsed:ms,source:{...f.source},launch:{...launch},head,target:{...target},flight:flight.active&&flight.alpha>.05,active:this.all.filter(m=>m.visible).length});
 }
 hide(){this.rear.visible=this.front.visible=this.ground.visible=false;}
 dispose(){for(const m of this.all){m.geometry.dispose();m.material.dispose();}this.texture?.dispose();this.noise.dispose();for(const root of [this.rear,this.front,this.ground])root.removeFromParent();}
}
