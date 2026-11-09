/** Atelier-only HDR finish. Every render target and SMAA program warms before Ready. */
import * as T from 'three';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { loadingFrame } from './loading';
import type { Quality } from './post';
import lutData from './look-luts.json';
import type { CardEffects } from './card-effects';
const vertex = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
const blur = `varying vec2 vUv;uniform sampler2D source;uniform vec2 stepUV;uniform float threshold;
vec3 sampleBright(vec2 uv){vec3 c=texture2D(source,uv).rgb;float b=max(c.r,max(c.g,c.b));float soft=clamp(b-threshold+.35,0.,.7);soft=soft*soft/1.4;return threshold>0.?c*max(b-threshold,soft)/max(.0001,b):c;}
void main(){vec3 c=sampleBright(vUv)*.227027;c+=(sampleBright(vUv+stepUV*1.384615)+sampleBright(vUv-stepUV*1.384615))*.316216;c+=(sampleBright(vUv+stepUV*3.230769)+sampleBright(vUv-stepUV*3.230769))*.070270;gl_FragColor=vec4(c,1.);}`;
const composite = `varying vec2 vUv;uniform sampler2D sceneTex,bloomTex,depthTex,lut;uniform vec2 pixel,impactCenter;uniform mat4 inverseProjection;
uniform float high,impact,pulse,calm,bloom,occlusion,focus,focusDistance,grade,grain;uniform vec3 tint;uniform vec4 protectedFaces[12];uniform int protectedCount;
vec3 viewPoint(vec2 uv){float depth=texture2D(depthTex,uv).r;vec4 p=inverseProjection*vec4(uv*2.-1.,depth*2.-1.,1.);return p.xyz/p.w;}
float clearance(){float c=1.;for(int i=0;i<12;i++){if(i>=protectedCount)break;vec4 f=protectedFaces[i];vec2 q=(vUv-f.xy)/max(f.zw,vec2(.00001));c*=smoothstep(1.,1.6,dot(q,q));}return c;}
float ao(vec2 uv,vec3 p){
 vec3 n=normalize(cross(dFdx(p),dFdy(p)));float radius=.24;float sum=0.;
 // A stationary, evenly distributed kernel avoids random contact speckle.
 vec2 projectionScale=vec2(1./inverseProjection[0][0],1./inverseProjection[1][1]);
 for(int i=0;i<12;i++){float a=float(i)*2.399963;float r=sqrt((float(i)+.5)/12.);vec2 offset=vec2(cos(a),sin(a))*projectionScale*radius*r/max(.1,-p.z)*.5;
  vec3 q=viewPoint(clamp(uv+offset,vec2(.001),vec2(.999)));vec3 d=q-p;float dist=dot(d,d);
  sum+=max(0.,dot(n,d)-.014)*max(0.,1.-dist/(radius*radius))/max(.018,dist);
 }return clamp(1.-sum*.075,.86,1.);
}
vec3 focusScene(vec2 uv,float safe){vec3 c=texture2D(sceneTex,uv).rgb;if(high<.5||focus<.5)return c;
 float distance=-viewPoint(uv).z-focusDistance;float amount=max(smoothstep(2.8,6.,distance),smoothstep(1.6,4.,-distance))*safe;vec2 r=pixel*amount*2.5;
 vec3 soft=c*.4;soft+=(texture2D(sceneTex,uv+vec2(r.x,0.)).rgb+texture2D(sceneTex,uv-vec2(r.x,0.)).rgb+texture2D(sceneTex,uv+vec2(0.,r.y)).rgb+texture2D(sceneTex,uv-vec2(0.,r.y)).rgb)*.15;return mix(c,soft,amount);}
vec3 lutColor(vec3 c){vec3 v=clamp(c,0.,1.)*15.;float b=floor(v.b);vec2 uv=vec2((v.r+.5+b*16.)/256.,(v.g+.5)/16.);return mix(texture2D(lut,uv).rgb,texture2D(lut,uv+vec2(min(1.,15.-b)/16.,0.)).rgb,fract(v.b));}
void main(){float safe=clearance();vec2 p=vUv-.5;vec2 fromImpact=vUv-impactCenter;float d=length(fromImpact);float wave=sin(d*52.-pulse*16.)*exp(-abs(d-pulse*.55)*16.)*impact*.004*(1.-calm)*safe;vec2 uv=vUv+normalize(fromImpact+vec2(.00001))*wave;
 vec3 c=focusScene(uv,safe);vec3 position=viewPoint(uv);
 if(high>.5&&occlusion>.5)c*=mix(1.,ao(uv,position),safe);
 c+=texture2D(bloomTex,uv).rgb*bloom*safe;
 float z=-position.z;float edge=0.;edge=max(edge,abs(viewPoint(uv+vec2(pixel.x,0.)).z+z));edge=max(edge,abs(viewPoint(uv+vec2(0.,pixel.y)).z+z));
 c*=1.-smoothstep(.06,.30,edge)*.10*safe;
 float vignette=smoothstep(.30,.8,length(p));c*=1.-vignette*.10;c+=tint*vignette*impact*.02*(1.-calm);
 c*=.86;c=clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.,1.);c=pow(c,vec3(1./2.2));c=mix(c,lutColor(c),grade);
 float noise=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5;c+=noise*.006*grain*safe;
 // SMAA consumes linear RGB; the final output shader encodes it after edge blending.
 c=pow(clamp(c,0.,1.),vec3(2.2));gl_FragColor=vec4(c,1.);}`;
const merge = 'varying vec2 vUv;uniform sampler2D sceneTex,effectTex;void main(){vec4 e=texture2D(effectTex,vUv);gl_FragColor=vec4(e.rgb+texture2D(sceneTex,vUv).rgb*(1.-e.a),1.);}';
const output = 'varying vec2 vUv;uniform sampler2D source;void main(){gl_FragColor=vec4(pow(max(vec3(0.),texture2D(source,vUv).rgb),vec3(1./2.2)),1.);}';
// Pinned Three SMAA internals expose its textures/targets for explicit sliced prewarm.
interface SmaaResources { _areaTexture:T.Texture;_searchTexture:T.Texture;_edgesRT:T.WebGLRenderTarget;_weightsRT:T.WebGLRenderTarget;_materialEdges:T.ShaderMaterial;_materialWeights:T.ShaderMaterial;_materialBlend:T.ShaderMaterial }
export class LookPost {
 readonly qualityWarmup={samples:0,p95:0,selected:'high' as Quality};
 private calibrated=false;
 private sceneTarget:T.WebGLRenderTarget;private a:T.WebGLRenderTarget;private b:T.WebGLRenderTarget;private graded:T.WebGLRenderTarget;private antialiased:T.WebGLRenderTarget;
 private smaa=new SMAAPass();private scene=new T.Scene();private camera=new T.Camera();private plane:T.Mesh<T.PlaneGeometry,T.ShaderMaterial>;
 private filter:T.ShaderMaterial;private final:T.ShaderMaterial;private output:T.ShaderMaterial;private luts:T.DataTexture[];
 private effectTarget:T.WebGLRenderTarget;private joined:T.WebGLRenderTarget;private merge:T.ShaderMaterial;
 private effectScene=new T.Scene();private effects?:CardEffects;private savedClear=new T.Color();
 private width=1;private height=1;private mode:Quality='high';private requested:Quality='high';private samples=new Float32Array(180);private sampleCount=0;private slowWindows=0;private fastWindows=0;
 constructor(private renderer:T.WebGLRenderer){
  const target=()=>new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthBuffer:false});
  this.sceneTarget=target();this.sceneTarget.depthBuffer=true;this.sceneTarget.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);
  this.a=target();this.b=target();this.graded=target();this.antialiased=target();this.effectTarget=target();this.joined=target();
  this.merge=new T.ShaderMaterial({vertexShader:vertex,fragmentShader:merge,uniforms:{sceneTex:{value:this.sceneTarget.texture},effectTex:{value:this.effectTarget.texture}},depthTest:false,depthWrite:false});
  this.luts=lutData.chapters.map(data=>{const texture=new T.DataTexture(new Uint8Array(data),256,16,T.RGBAFormat);texture.minFilter=texture.magFilter=T.LinearFilter;texture.needsUpdate=true;return texture;});
  this.filter=new T.ShaderMaterial({vertexShader:vertex,fragmentShader:blur,uniforms:{source:{value:null},stepUV:{value:new T.Vector2()},threshold:{value:0}},depthTest:false,depthWrite:false});
  this.final=new T.ShaderMaterial({vertexShader:vertex,fragmentShader:composite,uniforms:{sceneTex:{value:this.joined.texture},bloomTex:{value:this.a.texture},depthTex:{value:this.sceneTarget.depthTexture},lut:{value:this.luts[0]},pixel:{value:new T.Vector2(1,1)},impactCenter:{value:new T.Vector2(.5,.5)},inverseProjection:{value:new T.Matrix4()},high:{value:1},impact:{value:0},pulse:{value:0},calm:{value:0},bloom:{value:.18},occlusion:{value:1},focus:{value:1},focusDistance:{value:18},grade:{value:1},grain:{value:1},tint:{value:new T.Color()},protectedFaces:{value:Array.from({length:12},()=>new T.Vector4())},protectedCount:{value:0}},depthTest:false,depthWrite:false});
  this.output=new T.ShaderMaterial({vertexShader:vertex,fragmentShader:output,uniforms:{source:{value:this.antialiased.texture}},depthTest:false,depthWrite:false});
  this.plane=new T.Mesh(new T.PlaneGeometry(2,2),this.filter);this.plane.frustumCulled=false;this.scene.add(this.plane);
 }
 setEffects(effects:CardEffects){this.effects=effects;this.effectScene.add(effects.root);}
 setFocusDistance(distance:number){this.final.uniforms.focusDistance!.value=distance;}
 get effectiveQuality(){return this.mode}
 setChapter(chapter:number){this.final.uniforms.lut!.value=this.luts[Math.max(0,Math.min(2,chapter-1))];}
 protectFaces(faces:T.Vector4[],count:number){this.final.uniforms.protectedFaces!.value=faces;this.final.uniforms.protectedCount!.value=Math.min(12,count);}
 setQuality(quality:Quality){if(this.requested===quality)return;this.requested=quality;this.mode=quality;this.sampleCount=this.slowWindows=this.fastWindows=0;this.resize(this.width,this.height);}
 observeWarmup(ms:number,auto=true){
  if(this.calibrated)return this.observe(ms,auto);
  if(!auto||ms<5||ms>200)return;
  this.samples[this.sampleCount++]=ms;if(this.sampleCount<45)return;
  const warm=this.samples.subarray(0,45);warm.sort();const p95=warm[42]!;
  this.mode=p95>35?'low':p95>22&&this.requested==='high'?'medium':this.requested;
  this.qualityWarmup.samples=45;this.qualityWarmup.p95=p95;this.qualityWarmup.selected=this.mode;
  this.calibrated=true;this.sampleCount=0;this.resize(this.width,this.height);
 }
 observe(ms:number,auto=true){
  if(!auto||ms<5||ms>200)return;this.samples[this.sampleCount++]=ms;
  if(this.sampleCount<this.samples.length)return;
  this.samples.sort();const p95=this.samples[171]!;this.sampleCount=0;this.slowWindows=p95>25?this.slowWindows+1:0;this.fastWindows=p95<18?this.fastWindows+1:0;
  if(this.slowWindows>=2&&this.mode!=='low'){this.mode=this.mode==='high'?'medium':'low';this.slowWindows=this.fastWindows=0;this.resize(this.width,this.height);}
  else if(this.fastWindows>=6&&this.mode!==this.requested){this.mode=this.mode==='low'&&this.requested==='high'?'medium':this.requested;this.slowWindows=this.fastWindows=0;this.resize(this.width,this.height);}
 }
 resize(width:number,height:number){this.width=width;this.height=height;const ratio=this.renderer.getPixelRatio(),w=Math.max(1,Math.floor(width*ratio)),h=Math.max(1,Math.floor(height*ratio));
  // Fixed allocations across quality switches: changing tiers cannot allocate at a hit.
  this.sceneTarget.samples=Math.min(2,this.renderer.capabilities.maxSamples);for(const t of [this.sceneTarget,this.graded,this.antialiased,this.effectTarget,this.joined])t.setSize(w,h);
  this.a.setSize(Math.ceil(w/4),Math.ceil(h/4));this.b.setSize(Math.ceil(w/4),Math.ceil(h/4));this.smaa.setSize(w,h);this.final.uniforms.pixel!.value.set(1/w,1/h);
 }
 private draw(material:T.ShaderMaterial,target:T.WebGLRenderTarget|null){this.plane.material=material;this.renderer.setRenderTarget(target);this.renderer.render(this.scene,this.camera);}
 async warm(cancelled:()=>boolean){
  const previous=this.renderer.getRenderTarget(),viewport=this.renderer.getViewport(new T.Vector4()),smaa=this.smaa as unknown as SmaaResources;
  try{
   for(const texture of [smaa._areaTexture,smaa._searchTexture]){await (texture.image as HTMLImageElement).decode();if(cancelled())return;texture.needsUpdate=true;this.renderer.initTexture(texture);await loadingFrame();}
   for(const texture of this.luts){if(cancelled())return;this.renderer.initTexture(texture);await loadingFrame();}
   for(const target of [this.sceneTarget,this.a,this.b,this.graded,this.antialiased,this.effectTarget,this.joined,smaa._edgesRT,smaa._weightsRT]){if(cancelled())return;this.renderer.initRenderTarget(target);await loadingFrame();}
   this.filter.uniforms.source!.value=this.sceneTarget.texture;
   for(const [material,target] of [[this.merge,this.joined],[this.filter,this.a],[this.final,this.graded],[this.output,null]] as const){if(cancelled())return;this.plane.material=material;await this.renderer.compileAsync(this.scene,this.camera);if(cancelled())return;this.renderer.setRenderTarget(target);this.renderer.setViewport(0,0,2,2);this.renderer.render(this.scene,this.camera);await loadingFrame();}
   for(const material of [smaa._materialEdges,smaa._materialWeights,smaa._materialBlend]){if(cancelled())return;this.plane.material=material;this.renderer.setRenderTarget(this.antialiased);await this.renderer.compileAsync(this.scene,this.camera);await loadingFrame();}
   if(cancelled())return;this.smaa.render(this.renderer,this.antialiased,this.graded,0,false);await loadingFrame();
  }finally{this.renderer.setRenderTarget(previous);this.renderer.setViewport(viewport);}
 }
 render(scene:T.Scene,camera:T.Camera,impact:number,pulse:number,color:string,calm:boolean){
  const effects=this.effects;
  if(this.mode==='low'){
   effects?.setDepth(null,camera as T.PerspectiveCamera);this.renderer.setRenderTarget(null);this.renderer.render(scene,camera);
   const autoClear=this.renderer.autoClear;
   try{this.renderer.autoClear=false;if(effects?.root.visible)this.renderer.render(this.effectScene,camera);}
   finally{this.renderer.autoClear=autoClear;}
   return;
  }
  // Never sample scene depth while drawing into its own framebuffer. The stage
  // renders once. Effect ownership is fixed during loading: reparenting every
  // frame would allocate removal-event objects in Three's hot path.
  this.renderer.setRenderTarget(this.sceneTarget);this.renderer.render(scene,camera);
  effects?.setDepth(this.sceneTarget.depthTexture,camera as T.PerspectiveCamera);
  this.renderer.getClearColor(this.savedClear);const alpha=this.renderer.getClearAlpha();
  try{
   this.renderer.setClearColor(0,0);this.renderer.setRenderTarget(this.effectTarget);this.renderer.clear();
   if(effects?.root.visible)this.renderer.render(this.effectScene,camera);
  }finally{this.renderer.setClearColor(this.savedClear,alpha);}
  this.draw(this.merge,this.joined);
  if(effects?.impactCenter)this.final.uniforms.impactCenter!.value.copy(effects.impactCenter);
  this.filter.uniforms.source!.value=this.joined.texture;this.filter.uniforms.threshold!.value=1.25;this.filter.uniforms.stepUV!.value.set(2/this.a.width,0);this.draw(this.filter,this.a);
  this.filter.uniforms.source!.value=this.a.texture;this.filter.uniforms.threshold!.value=0;this.filter.uniforms.stepUV!.value.set(0,2/this.b.height);this.draw(this.filter,this.b);
  this.final.uniforms.bloomTex!.value=this.b.texture;this.final.uniforms.inverseProjection!.value.copy((camera as T.PerspectiveCamera).projectionMatrixInverse);this.final.uniforms.high!.value=this.mode==='high'?1:0;
  this.final.uniforms.impact!.value=impact;this.final.uniforms.pulse!.value=pulse;this.final.uniforms.calm!.value=calm?1:0;this.final.uniforms.tint!.value.set(color);this.draw(this.final,this.graded);
  if(this.mode==='high'){this.smaa.render(this.renderer,this.antialiased,this.graded,0,false);this.output.uniforms.source!.value=this.antialiased.texture;}else this.output.uniforms.source!.value=this.graded.texture;
  this.draw(this.output,null);
 }
 dispose(){for(const target of [this.sceneTarget,this.a,this.b,this.graded,this.antialiased,this.effectTarget,this.joined])target.dispose();for(const material of [this.filter,this.final,this.output,this.merge])material.dispose();for(const texture of this.luts)texture.dispose();this.smaa.dispose();this.plane.geometry.dispose();}
}
