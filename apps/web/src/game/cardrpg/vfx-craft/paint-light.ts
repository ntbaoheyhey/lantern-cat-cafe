/** Soot pilot grounding, from accepted D8 and Q3B-X06/X07.
 * Current original alpha drives a floor projection and sparse inner rim.
 * The original actor stays visible; no full-body replacement or CPU readback.
 */
import * as T from 'three';
import type {SpineActor} from '../spine/assets';
import type {Rect} from '../../squad/turn3d/label-layout';

const vertex=`varying vec2 vUv;varying vec2 vWorld;
void main(){vUv=uv;vec4 q=modelMatrix*vec4(position,1.);vWorld=q.xy;gl_Position=projectionMatrix*viewMatrix*q;}`;
const localFeet=[[-66.3164609894933,1.5526620370370665],[53.354122671648156,1.5526620370370665]] as const;
export interface PaintLightFrame {
 width:number;height:number;worldWidth:number;worldHeight:number;box:Rect;face:Rect;
 lightSource:{x:number;y:number};lightColour:string;light:number;brightness:number;opacity:number;groundOrder:number;
}

export class PaintLight {
 readonly ground=new T.Group();readonly rim=new T.Group();
 readonly audit={crop:{x:0,y:0,width:0,height:0},target:[0,0],feet:[] as {x:number;y:number}[],light:0};
 private camera=new T.OrthographicCamera();
 private target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthBuffer:false,stencilBuffer:false,minFilter:T.LinearFilter,magFilter:T.LinearFilter});
 private geometry=new T.PlaneGeometry(1,1);
 private crop={value:new T.Vector4()};
 private shadow:T.Mesh<T.PlaneGeometry,T.ShaderMaterial>;
 private edge:T.Mesh<T.PlaneGeometry,T.ShaderMaterial>;
 private scratch=new T.Vector3();private clear=new T.Color();
 constructor(readonly actor:SpineActor){
  this.target.texture.colorSpace=T.LinearSRGBColorSpace;
  this.ground.name='Soot painted-foot contacts';this.rim.name='Soot sparse local light';
  const common={uPaint:{value:this.target.texture},uCrop:this.crop};
  this.edge=new T.Mesh(this.geometry,new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false,
   uniforms:{...common,uTexel:{value:new T.Vector2()},uFace:{value:new T.Vector4()},uSource:{value:new T.Vector2()},
    uLight:{value:0},uBrightness:{value:1},uColour:{value:new T.Color('#bc72ed')},uWarm:{value:new T.Color('#f5cda0')}},vertexShader:vertex,
   fragmentShader:`uniform sampler2D uPaint;uniform vec2 uTexel,uSource;uniform vec4 uFace;
uniform float uLight,uBrightness;uniform vec3 uColour,uWarm;varying vec2 vUv;varying vec2 vWorld;
float alphaAt(vec2 p){if(p.x<0.||p.y<0.||p.x>1.||p.y>1.)return 0.;return texture2D(uPaint,p).a;}
void main(){
 float a=alphaAt(vUv);if(a<.01)discard;
 float l=alphaAt(vUv-vec2(uTexel.x,0.)),r=alphaAt(vUv+vec2(uTexel.x,0.));
 float b=alphaAt(vUv-vec2(0.,uTexel.y)),t=alphaAt(vUv+vec2(0.,uTexel.y));
 vec2 normal=vec2(l-r,b-t);normal/=max(.001,length(normal));
 float inner=clamp((a-(l+r+b+t)*.25)*2.8,0.,1.);
 vec2 fq=(vWorld-uFace.xy)/max(uFace.zw,vec2(.001));
 float protect=1.-smoothstep(.65,1.2,length(fq));
 vec2 source=uSource-vWorld;float action=inner*max(0.,dot(normal,source/max(.001,length(source))))*uLight;
 float ambient=inner*max(0.,dot(normal,vec2(.87,.5)))*.06;
 float amount=(action+ambient)*(1.-protect*.9)*.45;
 if(amount<.001)discard;
 vec3 colour=mix(uWarm,uColour,action/max(.001,action+ambient))*uBrightness;
 gl_FragColor=vec4(colour,a*amount);
 #include <colorspace_fragment>
}` }));
  this.shadow=new T.Mesh(this.geometry,new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false,
   uniforms:{...common,uFeet:{value:new T.Vector4()},uProjection:{value:new T.Vector2(.19,-.14)},uRadius:{value:new T.Vector2()},
    uSoftness:{value:0},uOpacity:{value:1},uDark:{value:new T.Color('#1c1424')}},vertexShader:vertex,
   fragmentShader:`uniform sampler2D uPaint;uniform vec4 uCrop,uFeet;uniform vec2 uProjection,uRadius;
uniform float uSoftness,uOpacity;uniform vec3 uDark;varying vec2 vWorld;
float projected(vec2 q){
 float base=(uFeet.y+uFeet.w)*.5,height=(q.y-base)/uProjection.y;
 vec2 uv=(vec2(q.x+height*uProjection.x,base+height)-uCrop.xy)/uCrop.zw;
 if(height<0.||uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.)return 0.;return texture2D(uPaint,uv).a;
}
void main(){
 vec2 q=vWorld;float s=uSoftness,p=projected(q)*.28;
 p+=(projected(q+vec2(s,0.))+projected(q-vec2(s,0.))+projected(q+vec2(0.,s))+projected(q-vec2(0.,s)))*.12;
 p+=(projected(q+vec2(s,s))+projected(q+vec2(-s,s))+projected(q+vec2(s,-s))+projected(q-vec2(s,s)))*.06;
 vec2 a=(q-uFeet.xy)/uRadius,b=(q-uFeet.zw)/uRadius;
 float contact=max(exp(-dot(a,a)),exp(-dot(b,b)))*.58*uOpacity;
 float opacity=1.-(1.-contact)*(1.-p*.34*uOpacity);if(opacity<.001)discard;
 gl_FragColor=vec4(uDark,opacity);
 #include <colorspace_fragment>
}` }));
  this.edge.frustumCulled=this.shadow.frustumCulled=false;this.rim.add(this.edge);this.ground.add(this.shadow);
 }
 render(renderer:T.WebGLRenderer,camera:T.OrthographicCamera,f:PaintLightFrame){
  const visible=this.actor.root.visible&&f.opacity>.001;this.rim.visible=this.ground.visible=visible;if(!visible)return;
  const px=f.worldWidth/f.width,dpr=renderer.getPixelRatio(),pad=6;
  const left=Math.floor((f.box.x-pad)*dpr)/dpr,top=Math.floor((f.box.y-pad)*dpr)/dpr;
  const neededWidth=Math.ceil((f.box.x+f.box.width+pad-left)*dpr),neededHeight=Math.ceil((f.box.y+f.box.height+pad-top)*dpr);
  // Grow in small blocks and retain capacity. Animated bounds must not allocate
  // a new framebuffer on every frame; extra transparent texels keep exact scale.
  const width=Math.max(this.target.width,Math.ceil(neededWidth/32)*32),height=Math.max(this.target.height,Math.ceil(neededHeight/32)*32);
  const right=left+width/dpr,bottom=top+height/dpr;
  if(this.target.width!==width||this.target.height!==height)this.target.setSize(width,height);
  this.camera.copy(camera);this.camera.left=left*px-f.worldWidth/2;this.camera.right=right*px-f.worldWidth/2;
  this.camera.top=f.worldHeight-top*px;this.camera.bottom=f.worldHeight-bottom*px;this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();
  const x=this.camera.left+camera.position.x,y=this.camera.bottom+camera.position.y,w=(right-left)*px,h=(bottom-top)*px;
  this.crop.value.set(x,y,w,h);
  const previous=renderer.getRenderTarget(),alpha=renderer.getClearAlpha();renderer.getClearColor(this.clear);
  try{renderer.setRenderTarget(this.target);renderer.setClearColor(0,0);renderer.clear();renderer.render(this.actor.root,this.camera);}
  finally{renderer.setRenderTarget(previous);renderer.setClearColor(this.clear,alpha);}
  this.edge.position.set(x+w*.5,y+h*.5,0);this.edge.scale.set(w,h,1);this.rim.renderOrder=this.actor.root.renderOrder+.25;
  const u=this.edge.material.uniforms,k=f.box.height/195;
  u.uTexel!.value.set(2.5*k*dpr/width,2.5*k*dpr/height);
  u.uFace!.value.set((f.face.x+f.face.width*.5)*px-f.worldWidth/2+camera.position.x,
   f.worldHeight-(f.face.y+f.face.height*.5)*px+camera.position.y,f.face.width*.65*px,f.face.height*.65*px);
  u.uSource!.value.set(f.lightSource.x*px-f.worldWidth/2+camera.position.x,f.worldHeight-f.lightSource.y*px+camera.position.y);
  u.uColour!.value.set(f.lightColour);u.uLight!.value=f.light;u.uBrightness!.value=f.brightness;
  const contacts=this.actor.mesh?.drawing?.contactPoints()??localFeet.map(([x,y])=>({x,y}));
  const feet=contacts.map(({x,y})=>this.actor.root.localToWorld(new T.Vector3(x,y,0)));
  const sh=this.shadow.material.uniforms;sh.uFeet!.value.set(feet[0]!.x,feet[0]!.y,feet[1]!.x,feet[1]!.y);
  sh.uRadius!.value.set(13*k*px,4.2*k*px);sh.uSoftness!.value=3*k*px;sh.uOpacity!.value=f.opacity;
  const floor=(feet[0]!.y+feet[1]!.y)*.5,margin=20*k*px,shadowLeft=x-h*.19-margin,shadowRight=x+w+margin;
  const shadowTop=floor+margin,shadowBottom=floor-h*.18-margin;
  this.shadow.position.set((shadowLeft+shadowRight)*.5,(shadowBottom+shadowTop)*.5,0);
  this.shadow.scale.set(shadowRight-shadowLeft,shadowTop-shadowBottom,1);this.ground.renderOrder=f.groundOrder;
  Object.assign(this.audit.crop,{x:left,y:top,width:right-left,height:bottom-top});this.audit.target=[width,height];this.audit.light=f.light;
  this.audit.feet=feet.map(p=>{this.scratch.copy(p).project(camera);return{x:(this.scratch.x*.5+.5)*f.width,y:(.5-this.scratch.y*.5)*f.height};});
 }
 get source(){return{texture:this.target.texture,crop:this.crop.value};}
 dispose(){this.target.dispose();this.geometry.dispose();this.edge.material.dispose();this.shadow.material.dispose();this.rim.removeFromParent();this.ground.removeFromParent();}
}
