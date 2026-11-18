/** Bounded, per-actor designer video delivery. Only explicitly registered M/C assets use it. */
import * as T from 'three';

export const DESIGNER_SOCKET_CHANNELS=['head','prop','hip','shieldWrist','lantern'] as const;
export type DesignerSocketChannel=typeof DESIGNER_SOCKET_CHANNELS[number];
export type DesignerIdleFormat='h264-rgb-mask'|'h264-ycrcb-alpha-four-plane';
export interface DesignerIdleManifest {
 version:1;id:'mochi'|'clover';format:DesignerIdleFormat;video:string;poster:string;
 width:number;height:number;opaqueHeight:number;foot:[number,number];duration:10;fps:30;frames:300;
 sourceSha256:string;videoSha256:string;posterSha256:string;videoBytes:number;
 sockets:Record<string,[number,number]>;
 opaqueBounds?:[number,number,number,number];faceROI?:[number,number,number,number];
 socketTracks?:Partial<Record<DesignerSocketChannel,[number,number][]>>;
 socketChannels?:Record<string,DesignerSocketChannel>;
}
export interface DesignerIdleClock {
 worldTime:number;paused:boolean;fixedTime:boolean;frozen:boolean;playbackRate?:number;
}
export function validateDesignerIdle(value:unknown,id:string):DesignerIdleManifest {
 const m=value as DesignerIdleManifest;
 if(!m||!['mochi','clover'].includes(id)||m.id!==id||m.version!==1||!['h264-rgb-mask','h264-ycrcb-alpha-four-plane'].includes(m.format))throw Error('Invalid designer idle identity');
 if(m.duration!==10||m.fps!==30||m.frames!==300)throw Error('Designer idle must preserve 300 frames at 30fps');
 for(const size of [m.width,m.height,m.opaqueHeight])if(!Number.isInteger(size)||size<1||size>1024)throw Error('Invalid designer dimensions');
 if(m.width%2||m.height%2||m.opaqueHeight>m.height)throw Error('Invalid packed video dimensions');
 if(!Array.isArray(m.foot)||m.foot.length!==2||!m.foot.every(Number.isFinite)||m.foot[0]<0||m.foot[0]>m.width||m.foot[1]<0||m.foot[1]>m.height)throw Error('Invalid designer foot anchor');
 if(!Number.isInteger(m.videoBytes)||m.videoBytes<1||m.videoBytes>1_000_000)throw Error('Designer clip exceeds per-clip intake budget');
 for(const hash of [m.sourceSha256,m.videoSha256,m.posterSha256])if(!/^[a-f0-9]{64}$/.test(hash))throw Error('Missing designer content hash');
 for(const [path,ext] of [[m.video,'mp4'],[m.poster,'webp']])if(typeof path!=='string'||!new RegExp(`^/units/${id}/designer-idle-[a-f0-9]+\\.${ext}$`).test(path))throw Error('Designer asset escapes its owned folder');
 for(const key of ['root','hip','head','hp-anchor','vfx-origin','main-hand','off-hand']){
  const xy=m.sockets?.[key];if(!Array.isArray(xy)||xy.length!==2||!xy.every(Number.isFinite))throw Error(`Missing designer socket ${key}`);
 }
 for(const [name,rect]of [['opaqueBounds',m.opaqueBounds],['faceROI',m.faceROI]] as const){
  if(rect&&(!Array.isArray(rect)||rect.length!==4||!rect.every(Number.isFinite)||rect[0]<0||rect[1]<0||rect[2]<=0||rect[3]<=0))throw Error(`Invalid designer ${name}`);
 }
 if(m.opaqueBounds&&(m.opaqueBounds[2]<=m.opaqueBounds[0]||m.opaqueBounds[3]<=m.opaqueBounds[1]||m.opaqueBounds[2]>m.width||m.opaqueBounds[3]>m.height))throw Error('Invalid designer opaque bounds');
 if(m.faceROI&&(m.faceROI[0]+m.faceROI[2]>m.width||m.faceROI[1]+m.faceROI[3]>m.height))throw Error('Invalid designer face ROI');
 for(const [channel,frames]of Object.entries(m.socketTracks??{})){
  if(!DESIGNER_SOCKET_CHANNELS.includes(channel as DesignerSocketChannel)||!Array.isArray(frames)||frames.length!==300||frames.some(xy=>!Array.isArray(xy)||xy.length!==2||!xy.every(Number.isFinite)))throw Error('Invalid designer socket track');
 }
 for(const [socket,channel]of Object.entries(m.socketChannels??{}))if(!DESIGNER_SOCKET_CHANNELS.includes(channel)||!m.sockets[socket]||!m.socketTracks?.[channel])throw Error('Invalid designer socket channel');
 return m;
}
export const designerPhase=(time:number,duration=10)=>((time%duration)+duration)%duration;
export const designerDrift=(actual:number,target:number,duration=10)=>Math.abs(((actual-target+duration*1.5)%duration)-duration*.5);

/** Logical dimensions never include the packed data planes. Mask coordinates use video top-left. */
export function designerVideoLayout(m:Pick<DesignerIdleManifest,'format'|'width'|'height'>){
 const four=m.format==='h264-ycrcb-alpha-four-plane';
 return {width:m.width*(four?2:1),height:m.height*2,maskX:four?m.width:0,maskY:m.height};
}

/** Poster pixels and decoded video both reach Three as straight sRGB before lighting/blending. */
export function designerMapChunk(format:DesignerIdleFormat='h264-rgb-mask'){
 const decode=format==='h264-ycrcb-alpha-four-plane'?`
   vec2 q=clamp(vMapUv*0.5,designerTexel*0.5,vec2(0.5)-designerTexel*0.5);
   float y=texture2D(map,q+vec2(0.0,0.5)).r;
   float cr=texture2D(map,q+vec2(0.5,0.5)).r-128.0/255.0;
   float cb=texture2D(map,q).r-128.0/255.0;
   float a=texture2D(map,q+vec2(0.5,0.0)).r;
   vec3 premul=clamp(vec3(y+1.403*cr,y-0.714*cr-0.344*cb,y+1.773*cb),0.0,1.0);
   sampledDiffuseColor=vec4(clamp(premul/max(a,0.001),0.0,1.0),a);
 `:`
   float x=clamp(vMapUv.x,designerTexel.x*0.5,1.0-designerTexel.x*0.5);
   vec2 colorUv=vec2(x,clamp(0.5+vMapUv.y*0.5,0.5+designerTexel.y*0.5,1.0-designerTexel.y*0.5));
   vec2 maskUv=vec2(x,clamp(vMapUv.y*0.5,designerTexel.y*0.5,0.5-designerTexel.y*0.5));
   float a=texture2D(map,maskUv).r;
   vec3 premul=texture2D(map,colorUv).rgb;
   sampledDiffuseColor=vec4(premul/max(a,0.001),a);
 `;
 return `
 #ifdef USE_MAP
  vec4 sampledDiffuseColor;
  if (designerPacked > 0.5) {
   ${decode}
  } else { sampledDiffuseColor=texture2D(map,vMapUv);sampledDiffuseColor.rgb/=max(sampledDiffuseColor.a,0.001); }
  sampledDiffuseColor.rgb=sRGBTransferEOTF(sampledDiffuseColor).rgb;
  diffuseColor*=sampledDiffuseColor;
 #endif
 `;}

export class DesignerIdleMedia {
 readonly video:HTMLVideoElement;
 readonly videoTexture:T.VideoTexture;
 readonly posterTexture:T.Texture;
 readonly material:T.MeshBasicMaterial;
 readonly geometry:T.PlaneGeometry;
 readonly plane:T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>;
 readonly basePositions:Float32Array;
 readonly packed={value:0};
 readonly ready:Promise<boolean>;
 onFrame:()=>void=()=>{};
 failure:string|undefined;
 private disposed=false;private playing=false;private started=false;private firstFrame=false;private suspended=false;
 private playbackGeneration=0;
 private desired=0;private frozenAt:number|undefined;private lastSeek=-Infinity;private callback:number|undefined;
 private animationFrame:number|undefined;private fallbackFrameTime=-1;private queuedSeek:number|undefined;
 private timer:ReturnType<typeof setTimeout>|undefined;
 private finish:((ok:boolean)=>void)|undefined;
 private readonly canvases=new Set<HTMLCanvasElement>();
 private readonly contextLost=()=>{
  if(this.disposed)return;
  // Release old-context listeners while GL is lost, before Three creates new caches.
  // CPU media/vertices remain available for the first restored draw.
  this.videoTexture.dispose();this.posterTexture.dispose();this.geometry.dispose();this.material.dispose();
 };
 private readonly contextRestored=()=>{if(!this.disposed){this.videoTexture.needsUpdate=true;this.posterTexture.needsUpdate=true;this.onFrame();}};
 private readonly visibility=()=>{if(document.hidden){this.playbackGeneration++;this.playing=false;this.video.pause();}};
 constructor(readonly manifest:DesignerIdleManifest,poster:HTMLImageElement){
  validateDesignerIdle(manifest,manifest.id);
  this.posterTexture=new T.Texture(poster);this.posterTexture.colorSpace=T.NoColorSpace;this.posterTexture.premultiplyAlpha=true;this.posterTexture.generateMipmaps=false;this.posterTexture.minFilter=T.LinearFilter;this.posterTexture.needsUpdate=true;
  this.video=document.createElement('video');this.video.muted=true;this.video.playsInline=true;this.video.loop=true;this.video.preload='auto';this.video.crossOrigin='anonymous';
  this.videoTexture=new T.VideoTexture(this.video);this.videoTexture.colorSpace=T.NoColorSpace;
  this.material=new T.MeshBasicMaterial({map:this.posterTexture,transparent:true,depthWrite:false,depthTest:false,toneMapped:false});
  const layout=designerVideoLayout(manifest);
  this.material.onBeforeCompile=shader=>{shader.uniforms.designerPacked=this.packed;shader.uniforms.designerTexel={value:new T.Vector2(1/layout.width,1/layout.height)};shader.fragmentShader='uniform float designerPacked;\nuniform vec2 designerTexel;\n'+shader.fragmentShader.replace('#include <map_fragment>',designerMapChunk(manifest.format));};
  this.material.customProgramCacheKey=()=> `designer-${manifest.format}-v2`;
  const scale=512/manifest.opaqueHeight;
  this.geometry=new T.PlaneGeometry(manifest.width*scale,manifest.height*scale,24,24);
  this.geometry.translate((manifest.width/2-manifest.foot[0])*scale,(manifest.foot[1]-manifest.height/2)*scale,0);
  this.basePositions=new Float32Array(this.geometry.attributes.position!.array as Float32Array);
  this.plane=new T.Mesh(this.geometry,this.material);this.plane.frustumCulled=false;
  this.plane.onBeforeRender=renderer=>{
   const canvas=renderer.domElement;if(this.canvases.has(canvas))return;
   canvas.addEventListener('webglcontextlost',this.contextLost);canvas.addEventListener('webglcontextrestored',this.contextRestored);this.canvases.add(canvas);
  };
  this.ready=new Promise(resolve=>{this.finish=resolve;});
  this.video.addEventListener('error',this.error);
  this.video.addEventListener('loadeddata',this.loaded);
  this.video.addEventListener('seeked',this.seeked);
  document.addEventListener('visibilitychange',this.visibility);
  this.timer=setTimeout(()=>this.fail('Designer video first-frame timeout'),5000);
  this.video.src=manifest.video;this.video.load();
 }
 private readonly error=()=>this.fail(`Designer video decode error ${this.video.error?.code??'unknown'}`);
 private readonly loaded=()=>{
  if(this.disposed||this.failure||this.started)return;this.started=true;
  const layout=designerVideoLayout(this.manifest);
  if(this.video.videoWidth!==layout.width||this.video.videoHeight!==layout.height||Math.abs(this.video.duration-10)>1/30){this.fail('Designer video metadata mismatch');return;}
  this.startDecoding();
 };
 private startDecoding(){
  if(this.disposed||this.failure||this.suspended)return;
  this.watchFrames();
  if(!this.firstFrame)this.playVideo(true);
 }
 private playVideo(bootstrap=false){
  const generation=this.playbackGeneration;
  void this.video.play().then(()=>{
   if(this.disposed||this.failure||this.suspended||document.hidden||(!bootstrap&&!this.playing))this.video.pause();
  }).catch(error=>{
   // pause() rejects an outstanding play promise with AbortError. A later resume
   // must not inherit that obsolete rejection or switch a good decoder to poster.
   if(generation!==this.playbackGeneration||this.disposed||this.failure||this.suspended||document.hidden)return;
   this.fail(`Designer video play rejected: ${String(error)}`);
  });
 }
 private stopFrames(){
  if(this.callback!==undefined)this.video.cancelVideoFrameCallback?.(this.callback);this.callback=undefined;
  if(this.animationFrame!==undefined)cancelAnimationFrame(this.animationFrame);this.animationFrame=undefined;
 }
 /** Keep prepared media allocated while its owning scene skips all sampling. */
 setSuspended(suspended:boolean){
  if(this.disposed||this.failure||this.suspended===suspended)return;
  this.suspended=suspended;
  if(suspended){
   this.playbackGeneration++;this.playing=false;this.video.pause();this.queuedSeek=undefined;this.stopFrames();
   if(this.timer)clearTimeout(this.timer);this.timer=undefined;
  }else{
   if(!this.firstFrame)this.timer=setTimeout(()=>this.fail('Designer video first-frame timeout'),5000);
   if(this.started)this.startDecoding();
  }
 }
 private watchFrames(){
  if(this.disposed||this.failure||this.suspended||this.callback!==undefined||this.animationFrame!==undefined)return;
  const decoded=()=>{
   if(this.disposed||this.failure||this.suspended)return;
   if(!this.firstFrame)this.acceptFrame();
   else{this.videoTexture.needsUpdate=true;this.onFrame();}
   this.watchFrames();
  };
  if(this.video.requestVideoFrameCallback)this.callback=this.video.requestVideoFrameCallback(()=>{this.callback=undefined;decoded();});
  else this.animationFrame=requestAnimationFrame(()=>{
   this.animationFrame=undefined;
   if(this.video.readyState>=2&&this.video.currentTime!==this.fallbackFrameTime){this.fallbackFrameTime=this.video.currentTime;decoded();}
   else this.watchFrames();
  });
 }
 private acceptFrame(){
  if(this.disposed||this.failure)return;
  // loadeddata alone produced an empty frame in a measured WebKit probe.
  // Validate a decoded mask once before replacing the source-derived poster.
  try{
   const c=document.createElement('canvas');c.width=16;c.height=16;const ctx=c.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('No designer decode canvas');
   const layout=designerVideoLayout(this.manifest);
   ctx.drawImage(this.video,layout.maskX,layout.maskY,this.manifest.width,this.manifest.height,0,0,16,16);
   const pixels=ctx.getImageData(0,0,16,16).data;let low=255,high=0;
   for(let i=0;i<pixels.length;i+=4){low=Math.min(low,pixels[i]!);high=Math.max(high,pixels[i]!);}
   if(low>16||high<200)throw Error('Designer decoded mask is empty or opaque');
   this.firstFrame=true;this.material.map=this.videoTexture;this.packed.value=1;this.videoTexture.needsUpdate=true;
   if(!this.playing){this.playbackGeneration++;this.video.pause();}
   if(this.timer)clearTimeout(this.timer);this.timer=undefined;this.finish?.(true);this.finish=undefined;this.onFrame();
  }catch(error){this.fail(String(error));}
 }
 private readonly seeked=()=>{
  if(this.disposed||this.failure||this.suspended)return;
  const queued=this.queuedSeek;this.queuedSeek=undefined;
  if(queued!==undefined&&designerDrift(this.video.currentTime,queued)>(this.playing?.2:1/60)){this.video.currentTime=queued;return;}
  this.videoTexture.needsUpdate=true;this.onFrame();
 };
 private fail(reason:string){
  if(this.disposed||this.failure)return;this.failure=reason;this.video.pause();this.playing=false;this.material.map=this.posterTexture;this.packed.value=0;
  if(this.timer)clearTimeout(this.timer);this.timer=undefined;
  this.stopFrames();
  this.queuedSeek=undefined;this.videoTexture.dispose();
  this.video.removeAttribute('src');this.video.load();
  this.finish?.(false);this.finish=undefined;this.onFrame();
 }
 sample(clock:DesignerIdleClock,reduced:boolean){
  if(this.disposed||this.failure||this.suspended)return;
  if(clock.frozen&&this.frozenAt===undefined)this.frozenAt=this.video.currentTime;
  if(!clock.frozen)this.frozenAt=undefined;
  const target=reduced?0:clock.frozen?this.frozenAt!:designerPhase(Number.isFinite(clock.worldTime)?clock.worldTime:0);
  const running=!clock.paused&&!clock.fixedTime&&!clock.frozen&&!reduced&&!document.hidden;
  this.desired=target;
  if(!this.firstFrame){this.playing=running;return;}
  const now=performance.now(),drift=designerDrift(this.video.currentTime,target);
  if(this.video.seeking)this.queuedSeek=target;
  if(!this.video.seeking&&drift>(running?.2:1/60)&&(!running||now-this.lastSeek>500)){
   this.lastSeek=now;this.video.currentTime=target;
  }
  const rate=clock.playbackRate??1;this.video.playbackRate=Number.isFinite(rate)?Math.max(.25,Math.min(4,rate)):1;
  if(!running){this.playbackGeneration++;this.video.pause();this.playing=false;}
  else if(!this.playing||this.video.paused){this.playing=true;this.playVideo();}
 }
 get state(){return {ready:this.firstFrame&&!this.failure&&!this.disposed,failure:this.failure,desired:this.desired,currentTime:this.video.currentTime,seeking:this.video.seeking,paused:this.video.paused,suspended:this.suspended,disposed:this.disposed};}
 dispose(){
  if(this.disposed)return;this.disposed=true;
  if(this.timer)clearTimeout(this.timer);
  this.stopFrames();
  this.finish?.(false);this.finish=undefined;
  document.removeEventListener('visibilitychange',this.visibility);
  for(const canvas of this.canvases){canvas.removeEventListener('webglcontextlost',this.contextLost);canvas.removeEventListener('webglcontextrestored',this.contextRestored);}this.canvases.clear();
  this.video.removeEventListener('error',this.error);this.video.removeEventListener('loadeddata',this.loaded);this.video.removeEventListener('seeked',this.seeked);
  this.video.pause();this.video.removeAttribute('src');this.video.load();this.video.remove();
  this.videoTexture.dispose();this.posterTexture.dispose();this.geometry.dispose();this.material.dispose();this.plane.removeFromParent();
 }
}
