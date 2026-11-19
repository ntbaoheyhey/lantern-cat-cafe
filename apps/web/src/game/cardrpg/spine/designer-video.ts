/**
 * V9 designer idle bodies: one looping transparent video per MVP cat, drawn as a
 * flat video texture. The files live at /units/<id>/designer/ and are written by
 * tools/v9/alpha/convert-idle.sh (placeholder from old MP4s first, the
 * designer's transparent PNG sequences later, at the same paths).
 */
import * as T from 'three';
import type {SpineActor,DesignerMediaSampleContext} from './assets';
import {SPINE_CONFIG,type SpineAnimation,type SpineSocket} from './config';
import {animationCues} from './events';
import {unitFace} from '../stage/core';
import {usePaintedAtlasColor} from '../../rig/atlas-color';
import type {OpaqueWorldBounds} from './../stage/opaque-pose-bounds';

export const DESIGNER_VIDEO_IDS=new Set(['mochi','clover','soot']);
/** Body height in actor units; the C2 layout rescales every actor to its seat. */
export const DESIGNER_BODY_UNITS=512;
/** Seats are equal height; Mochi's broad fur and big head read ~8% larger than
 * slender Clover at the same height, so its drawn body is trimmed to match. */
export const DESIGNER_DISPLAY_SCALE:Record<string,number>={mochi:.92,clover:1,soot:1};

export interface DesignerVideoMeta {
 fps:number;frames:number;width:number;height:number;feetY:number;heightPx:number;
 anchor:[number,number];heightRatioToMochi?:number;alpha?:'straight'|'premultiplied';
 marginPx?:number;cutinFrame?:number;placeholder?:boolean;
}

export function validateDesignerVideoMeta(raw:unknown):DesignerVideoMeta{
 const m=raw as Partial<DesignerVideoMeta>;
 const positive=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>0;
 if(!m||!positive(m.width)||!positive(m.height)||!positive(m.heightPx)||!positive(m.fps)||!positive(m.frames))throw Error('Invalid designer video meta');
 if(typeof m.feetY!=='number'||m.feetY<=0||m.feetY>m.height!)throw Error('Invalid designer video feet line');
 if(!Array.isArray(m.anchor)||m.anchor.length!==2)throw Error('Invalid designer video anchor');
 return m as DesignerVideoMeta;
}

/** Safari plays VP9 WebM without its alpha plane; it gets the HEVC-alpha MOV. */
export function designerVideoSource(folder:string,video:{canPlayType(type:string):string},userAgent=typeof navigator==='undefined'?'':navigator.userAgent){
 const safari=/Safari\//.test(userAgent)&&!/Chrome\/|Chromium\/|Edg\/|Firefox\//.test(userAgent);
 const hevc=video.canPlayType('video/mp4; codecs="hvc1"')!=='';
 return safari&&hevc?`${folder}idle.mov`:`${folder}idle.webm`;
}

/** Actor-space rectangle of the opaque body, feet at y=0, centred on the anchor. */
export function designerBodyRect(meta:DesignerVideoMeta){
 const scale=DESIGNER_BODY_UNITS/meta.heightPx,margin=meta.marginPx??Math.max(0,(meta.feetY-meta.heightPx));
 const footX=meta.anchor[0]*meta.width;
 const left=(margin-footX)*scale,right=(meta.width-margin-footX)*scale;
 return {x:left,y:0,width:right-left,height:DESIGNER_BODY_UNITS,scale};
}

type VideoFrameVideo=HTMLVideoElement&{requestVideoFrameCallback?:(cb:()=>void)=>number;cancelVideoFrameCallback?:(id:number)=>void};

export class DesignerVideoMedia {
 readonly video:VideoFrameVideo;readonly texture:T.VideoTexture;readonly plane:T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>;
 readonly ready:Promise<boolean>;failure:string|undefined;onFrame?:()=>void;
 private suspended=false;private held=false;private frameRequest=0;private disposed=false;
 constructor(readonly meta:DesignerVideoMeta,folder:string,poster?:string){
  const video=document.createElement('video') as VideoFrameVideo;
  video.muted=true;video.loop=true;video.playsInline=true;video.preload='auto';video.crossOrigin='anonymous';
  video.setAttribute('muted','');video.setAttribute('playsinline','');if(poster)video.poster=poster;
  video.src=designerVideoSource(folder,video);this.video=video;
  const texture=new T.VideoTexture(video);texture.minFilter=T.LinearFilter;texture.magFilter=T.LinearFilter;texture.generateMipmaps=false;
  // Same contract as painted atlases: raw sRGB channels, associated before GPU
  // filtering (no dark fringes), unassociated and decoded in the shader.
  texture.colorSpace=T.NoColorSpace;texture.premultiplyAlpha=true;texture.userData.atlasAlphaEncoding='straight';this.texture=texture;
  const scale=DESIGNER_BODY_UNITS/meta.heightPx,w=meta.width*scale,h=meta.height*scale;
  const material=new T.MeshBasicMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,fog:false});
  usePaintedAtlasColor(material,meta.alpha==='premultiplied');
  this.plane=new T.Mesh(new T.PlaneGeometry(w,h),material);this.plane.name='designer-video';
  // Feet line at y=0, anchor x at x=0.
  this.plane.position.set((.5-meta.anchor[0])*w,(meta.feetY-meta.height/2)*scale,0);
  this.ready=new Promise<boolean>(resolve=>{
   const timer=setTimeout(()=>{this.failure='Designer video timeout';resolve(false);},8000);
   video.addEventListener('loadeddata',()=>{clearTimeout(timer);resolve(true);},{once:true});
   video.addEventListener('error',()=>{clearTimeout(timer);this.failure='Designer video failed '+(video.error?.code??'');resolve(false);},{once:true});
  });
  this.watchFrames();
  void video.play().catch(()=>{/* autoplay is retried on sample */});
 }
 private watchFrames(){
  if(this.disposed||!this.video.requestVideoFrameCallback)return;
  this.frameRequest=this.video.requestVideoFrameCallback(()=>{this.onFrame?.();this.watchFrames();});
 }
 /** Frame index of the loop that is on screen now. */
 get frame(){return Math.floor(this.video.currentTime*this.meta.fps)%this.meta.frames;}
 /** Freeze on the current frame (or seek to one) for a code-driven cast pose. */
 hold(frame?:number){
  this.held=true;this.video.pause();
  if(frame!==undefined&&Number.isFinite(frame))this.video.currentTime=Math.max(0,Math.min(this.meta.frames-1,frame))/this.meta.fps;
 }
 release(){if(!this.held)return;this.held=false;this.sync(false);}
 get isHeld(){return this.held;}
 setSuspended(suspended:boolean){this.suspended=suspended;this.sync(false);}
 private sync(stopped:boolean){
  const v=this.video;
  if(this.disposed)return;
  if(this.suspended||this.held||stopped){if(!v.paused)v.pause();return;}
  if(v.paused)void v.play().catch(()=>{});
 }
 sample(clock:DesignerMediaSampleContext,reduced:boolean){
  // Reduced motion keeps the authored first frame; hit-stop and pause stop the loop.
  if(reduced&&!this.held){if(!this.video.paused)this.video.pause();if(this.video.currentTime>.05)this.video.currentTime=0;return;}
  const rate=Math.max(.25,Math.min(4,clock.playbackRate??1));if(Math.abs(this.video.playbackRate-rate)>.01)this.video.playbackRate=rate;
  this.sync(clock.paused||clock.frozen);
 }
 dispose(){
  this.disposed=true;if(this.frameRequest&&this.video.cancelVideoFrameCallback)this.video.cancelVideoFrameCallback(this.frameRequest);
  this.video.pause();this.video.removeAttribute('src');this.video.load();
  this.texture.dispose();this.plane.geometry.dispose();this.plane.material.dispose();this.plane.removeFromParent();
 }
}

/** Socket heights as fractions of the opaque body, measured on the three idles. */
const SOCKETS:Record<string,[number,number]>={feet:[0,0],chest:[0,.5],head:[0,.77],hpAnchor:[0,1.1],vfxOrigin:[0,.52],mainHand:[.24,.5],offHand:[-.2,.48]};

export class DesignerVideoActorMedia {
 readonly designerVideo=true;
 constructor(readonly media:DesignerVideoMedia,readonly body:{x:number;y:number;width:number;height:number}){}
 sample(actor:SpineActor,_name:string,_time:number,_duration:number,reduced:boolean,clock:DesignerMediaSampleContext){
  this.media.sample(clock,reduced);
  void actor;
 }
 /** Opaque body box in world space from the root transform (no pixel reads). */
 opaqueWorld(root:T.Object3D):OpaqueWorldBounds{
  root.updateMatrixWorld(true);
  const b=this.body,corners=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]];
  const v=new T.Vector3();let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const [x,y] of corners){v.set(x!,y!,0).applyMatrix4(root.matrixWorld);minX=Math.min(minX,v.x);maxX=Math.max(maxX,v.x);minY=Math.min(minY,v.y);maxY=Math.max(maxY,v.y);}
  return {x:minX,y:minY,width:maxX-minX,height:maxY-minY} as OpaqueWorldBounds;
 }
 setSuspended(suspended:boolean){this.media.setSuspended(suspended);}
 dispose(){this.media.dispose();}
}

export async function loadDesignerVideoActor(actor:SpineActor,root=''):Promise<boolean>{
 const id=actor.unit.id;if(!DESIGNER_VIDEO_IDS.has(id))return false;
 const folder=`${root}/units/${id}/designer/`;
 const response=await fetch(folder+'meta.json');if(!response.ok)throw Error(`Designer video meta HTTP ${response.status}`);
 const meta=validateDesignerVideoMeta(await response.json());
 const media=new DesignerVideoMedia(meta,folder,folder+'poster.webp');
 if(!await media.ready){const failure=media.failure;media.dispose();throw Error(failure??'Designer video unavailable');}
 const full=designerBodyRect(meta),display=DESIGNER_DISPLAY_SCALE[id]??1;
 // Layout seats the full body box; the drawing and its opaque box shrink about the feet.
 media.plane.scale.setScalar(display);media.plane.position.multiplyScalar(display);
 // The seat normaliser clamps the opaque box to +-1.5% of the seat, so the box it
 // measures stays the full one; sockets and the hp bar follow the drawn body.
 const body={x:full.x*display,y:0,width:full.width*display,height:full.height*display},adapter=new DesignerVideoActorMedia(media,full);
 actor.designerMedia=adapter;actor.designerIdle=true;actor.source='media';actor.root.add(media.plane);media.onFrame=()=>actor.onMediaFrame?.();
 Object.assign(actor.bounds,{x:full.x,y:full.y,width:full.width,height:full.height});
 actor.faceRegion=unitFace(id,actor.bounds);
 for(const [socket,[fx,fy]] of Object.entries(SOCKETS))actor.sockets.get(socket as SpineSocket)?.position.set(fx*body.height,fy*body.height,1);
 for(const name of actor.unit.animations){
  const spec=SPINE_CONFIG.animations[name as SpineAnimation],duration=name==='idle'||name==='idle-phase2'?meta.frames/meta.fps:name==='ult'?2.2:name==='attack'?.8:name==='skill'?1:(spec.seconds[0]!+spec.seconds[1]!)/2;
  const events=name==='ult'?[{name:'ult_release',time:1.1}]:name==='attack'?[{name:'hit',time:.35}]:name==='skill'?[{name:'cast',time:.45}]:[];
  actor.clips.set(name,{duration,cues:animationCues(name as SpineAnimation,duration,events)});
 }
 actor.opaqueWorld=adapter.opaqueWorld(actor.root);
 return true;
}
