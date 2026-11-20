/** Small explicit HDR bloom stack: bright-pass → separable blur → grade/distortion. */
import * as T from 'three';
import { loadingFrame } from './loading';
export type Quality='high'|'medium'|'low';
const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const blur=`varying vec2 vUv;uniform sampler2D source;uniform vec2 stepUV;uniform float threshold;void main(){vec3 c=texture2D(source,vUv).rgb*.227027; c+=texture2D(source,vUv+stepUV*1.384615).rgb*.316216;c+=texture2D(source,vUv-stepUV*1.384615).rgb*.316216;c+=texture2D(source,vUv+stepUV*3.230769).rgb*.070270;c+=texture2D(source,vUv-stepUV*3.230769).rgb*.070270;float bright=max(c.r,max(c.g,c.b));c*=max(0.,bright-threshold)/max(.0001,bright);gl_FragColor=vec4(c,1.);}`;
const composite=`varying vec2 vUv;uniform sampler2D sceneTex;uniform sampler2D bloomTex;uniform float impact;uniform float pulse;uniform vec3 tint;uniform vec2 center;uniform float calm;uniform float bloom;uniform vec2 pixel;
 uniform sampler2D depthTex;uniform vec2 clipPlanes;uniform float backgroundFocus;
 uniform vec4 protectedFaces[12];uniform int protectedCount;
 float faceClearance(){
  float clearance=1.;
  for(int index=0;index<12;index++){
   if(index>=protectedCount)break;
   vec4 face=protectedFaces[index];
   vec2 local=(vUv-face.xy)/max(face.zw,vec2(.00001));
   clearance*=smoothstep(1.,1.6,dot(local,local));
  }
  return clearance;
 }
 vec3 focusedScene(vec2 uv){
  vec3 sharp=texture2D(sceneTex,uv).rgb;
  if(backgroundFocus<.5)return sharp;
  float z=texture2D(depthTex,uv).r*2.-1.;
  float distance=(2.*clipPlanes.x*clipPlanes.y)/(clipPlanes.y+clipPlanes.x-z*(clipPlanes.y-clipPlanes.x));
  float amount=smoothstep(16.2,22.5,distance);
  vec2 radius=pixel*amount*4.;
  vec3 soft=sharp*.4;
  soft+=texture2D(sceneTex,uv+vec2(radius.x,0.)).rgb*.15;
  soft+=texture2D(sceneTex,uv-vec2(radius.x,0.)).rgb*.15;
  soft+=texture2D(sceneTex,uv+vec2(0.,radius.y)).rgb*.15;
  soft+=texture2D(sceneTex,uv-vec2(0.,radius.y)).rgb*.15;
  return mix(sharp,soft,amount);
 }

 void main(){vec2 p=vUv-center;float d=length(p),wave=sin(d*52.-pulse*16.)*exp(-abs(d-pulse*.55)*16.)*impact*.004*(1.-calm);vec2 uv=vUv+normalize(p+vec2(.00001))*wave;
 vec2 ca=vec2(.0012,0.)*impact*(1.-calm);vec3 c=focusedScene(uv);if(impact>.001){c.r=focusedScene(uv+ca).r;c.b=focusedScene(uv-ca).b;}c+=texture2D(bloomTex,uv).rgb*bloom*faceClearance();
 vec3 luma=vec3(.2126,.7152,.0722);float gx=dot(texture2D(sceneTex,uv+vec2(pixel.x,0.)).rgb-texture2D(sceneTex,uv-vec2(pixel.x,0.)).rgb,luma);float gy=dot(texture2D(sceneTex,uv+vec2(0.,pixel.y)).rgb-texture2D(sceneTex,uv-vec2(0.,pixel.y)).rgb,luma);c*=1.-smoothstep(.12,.65,length(vec2(gx,gy)))*.18;
 float edge=smoothstep(.28,.78,length(vUv-.5));c*=1.-edge*.18;c=mix(c,c*tint,.06);c+=tint*edge*impact*.035*(1.-calm);
 c*=.86;c=clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.,1.);c=pow(c,vec3(1./2.2));gl_FragColor=vec4(c,1.);}`;
export class CafePost{
 private sceneTarget:T.WebGLRenderTarget;private a:T.WebGLRenderTarget;private b:T.WebGLRenderTarget;
 private plane=new T.Mesh(new T.PlaneGeometry(2,2));private scene=new T.Scene();private camera=new T.Camera();
 private filter:T.ShaderMaterial;private final:T.ShaderMaterial;private width=1;private height=1;private mode:Quality='high';
 private samples:number[]=[];private requested:Quality='high';private rounds=0;
 constructor(private renderer:T.WebGLRenderer, private crisp=false){
  const target=()=>new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthBuffer:false,minFilter:T.LinearFilter,magFilter:T.LinearFilter});
  this.sceneTarget=target();this.sceneTarget.depthBuffer=true;
  if(crisp)this.sceneTarget.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);
  this.a=target();this.b=target();
  this.filter=new T.ShaderMaterial({vertexShader:vertex,fragmentShader:blur,uniforms:{source:{value:null},stepUV:{value:new T.Vector2()},threshold:{value:0}},depthTest:false,depthWrite:false});
  this.final=new T.ShaderMaterial({vertexShader:vertex,fragmentShader:composite,uniforms:{depthTex:{value:this.sceneTarget.depthTexture},clipPlanes:{value:new T.Vector2(.1,80)},backgroundFocus:{value:crisp?1:0},sceneTex:{value:this.sceneTarget.texture},bloomTex:{value:this.b.texture},impact:{value:0},pulse:{value:0},tint:{value:new T.Color('#ffe8d1')},center:{value:new T.Vector2(.5,.5)},calm:{value:0},bloom:{value:.35},pixel:{value:new T.Vector2(1,1)}},depthTest:false,depthWrite:false});
  this.scene.add(this.plane);this.plane.frustumCulled=false;
  this.final.uniforms.protectedFaces={value:Array.from({length:12},()=>new T.Vector4())};
  this.final.uniforms.protectedCount={value:0};
 }
 get effectiveQuality(){return this.mode}
 protectFaces(faces:T.Vector4[],count:number){
  this.final.uniforms.protectedFaces!.value=faces;
  this.final.uniforms.protectedCount!.value=Math.min(12,count);
 }
 setQuality(quality:Quality){if(this.requested===quality)return;this.requested=quality;this.mode=quality;this.samples=[];this.rounds=0;this.resize(this.width,this.height)}
 observe(ms:number,auto=true){if(!auto||ms<5||ms>200||this.mode==='low')return;this.samples.push(ms);if(this.samples.length<180)return;const p95=[...this.samples].sort((a,b)=>a-b)[171]!;this.samples=[];this.rounds++;if(this.rounds>1&&p95>25){this.mode=this.mode==='high'?'medium':'low';this.resize(this.width,this.height)}}
 resize(width:number,height:number){
  this.width=width;this.height=height;
  const ratio=this.renderer.getPixelRatio();
  const w=Math.max(1,Math.floor(width*ratio)),h=Math.max(1,Math.floor(height*ratio));
  const div=this.mode==='high'?4:6;
  const requestedSamples=this.crisp&&this.mode!=='low'?4:this.mode==='high'?2:0;
  const samples=Math.min(requestedSamples,this.renderer.capabilities.maxSamples);
  if(this.sceneTarget.samples!==samples){this.sceneTarget.dispose();this.sceneTarget.samples=samples;}
  this.sceneTarget.setSize(w,h);this.final.uniforms.pixel!.value.set(1/w,1/h);
  this.a.setSize(Math.ceil(w/div),Math.ceil(h/div));this.b.setSize(Math.ceil(w/div),Math.ceil(h/div));
 }
 async warm(cancelled:()=>boolean){
  const previous=this.renderer.getRenderTarget();
  const viewport=this.renderer.getViewport(new T.Vector4());
  try{
   for(const target of [this.sceneTarget,this.a,this.b]){
    if(cancelled())return;
    this.renderer.initRenderTarget(target);
    await loadingFrame();
   }
   for(const [material,target] of [[this.filter,this.a],[this.final,null]] as const){
    if(cancelled())return;
    this.plane.material=material;
    this.renderer.setRenderTarget(target);this.renderer.setViewport(0,0,2,2);
    await this.renderer.compileAsync(this.scene,this.camera);
    if(cancelled())return;
    // Initialize sampler uniforms too. Render targets are already allocated.
    this.filter.uniforms.source!.value=this.sceneTarget.texture;
    this.renderer.render(this.scene,this.camera);
    await loadingFrame();
   }
  }finally{this.renderer.setRenderTarget(previous);this.renderer.setViewport(viewport);}
 }
 render(scene:T.Scene,camera:T.Camera,impact:number,pulse:number,color:string,calm:boolean){
  if(this.mode==='low'){this.renderer.setRenderTarget(null);this.renderer.render(scene,camera);return}
  if(this.crisp){const perspective=camera as T.PerspectiveCamera;this.final.uniforms.clipPlanes!.value.set(perspective.near,perspective.far);}
  this.renderer.setRenderTarget(this.sceneTarget);this.renderer.render(scene,camera);
  this.plane.material=this.filter;this.filter.uniforms.source!.value=this.sceneTarget.texture;this.filter.uniforms.threshold!.value=1.12;this.filter.uniforms.stepUV!.value.set(1/this.a.width,0);this.renderer.setRenderTarget(this.a);this.renderer.render(this.scene,this.camera);
  this.filter.uniforms.source!.value=this.a.texture;this.filter.uniforms.threshold!.value=0;this.filter.uniforms.stepUV!.value.set(0,1/this.a.height);this.renderer.setRenderTarget(this.b);this.renderer.render(this.scene,this.camera);
  this.filter.uniforms.source!.value=this.b.texture;this.filter.uniforms.stepUV!.value.set(1/this.a.width,0);this.renderer.setRenderTarget(this.a);this.renderer.render(this.scene,this.camera);
  this.plane.material=this.final;this.final.uniforms.bloomTex!.value=this.a.texture;this.final.uniforms.impact!.value=impact;this.final.uniforms.pulse!.value=pulse;this.final.uniforms.tint!.value.set(color);this.final.uniforms.calm!.value=calm?1:0;this.final.uniforms.bloom!.value=this.mode==='high'?.32:.18;
  this.renderer.setRenderTarget(null);this.renderer.render(this.scene,this.camera);
 }
 dispose(){this.sceneTarget.dispose();this.a.dispose();this.b.dispose();this.filter.dispose();this.final.dispose();this.plane.geometry.dispose()}
}
