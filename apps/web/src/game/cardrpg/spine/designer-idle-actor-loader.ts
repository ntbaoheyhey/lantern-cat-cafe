/** Commissioned media adapter; only the explicit M/C registry can enroll an actor. */
import type {SpineActor,DesignerMediaSampleContext} from './assets';
import {SPINE_CONFIG,type SpineAnimation,type SpineSocket} from './config';
import {animationCues} from './events';
import {DesignerIdleMedia,validateDesignerIdle,designerPhase,type DesignerIdleManifest} from './designer-idle-loader';
import {sampleLivingCatCast,livingCatCastOffset,applyLivingCatCast,LIVING_CAT_SKILL_EVENTS,LIVING_CAT_SKILL_SECONDS} from './living-cat-cast';
import registry from './designer-idle-registry.json';

export class DesignerIdleActorMedia {
 private readonly pose={lean:0,lift:0,tilt:0,follow:0};private readonly offset={x:0,y:0};
 private frame=0;
 constructor(readonly media:DesignerIdleMedia){}
 point(x:number,y:number,channel?:'head'|'prop'){
  const m=this.media.manifest,track=channel?m.socketTracks?.[channel]:undefined;
  if(track){const i=Math.floor(this.frame),t=this.frame-i,a=track[i]!,b=track[(i+1)%300]!;x+=a[0]+(b[0]-a[0])*t;y+=a[1]+(b[1]-a[1])*t;}
  const scale=512/m.opaqueHeight,px=(x-m.foot[0])*scale,py=(m.foot[1]-y)*scale;
  livingCatCastOffset(px,py,512,this.pose,this.offset);return {x:px+this.offset.x,y:py+this.offset.y};
 }
 sample(actor:SpineActor,name:string,time:number,duration:number,reduced:boolean,clock:DesignerMediaSampleContext){
  this.media.sample(clock,reduced);
  this.frame=reduced||this.media.failure?0:designerPhase(this.media.video.currentTime)*30;
  sampleLivingCatCast(actor.unit.id,name,time/duration,reduced,this.pose);
  applyLivingCatCast(this.media.basePositions,this.media.geometry.attributes.position!.array as Float32Array,512,this.pose);
  this.media.geometry.attributes.position!.needsUpdate=true;
  const m=this.media.manifest;
  for(const [socket,bone]of Object.entries(SPINE_CONFIG.sockets)){
   const xy=m.sockets[bone]!,p=this.point(xy[0],xy[1],m.socketChannels?.[bone]);actor.sockets.get(socket as SpineSocket)!.position.set(p.x,p.y,1);
  }
  const [x,y,w,h]=m.faceROI!,points=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([px,py])=>this.point(px!,py!,'head'));
  const left=Math.min(...points.map(p=>p.x)),bottom=Math.min(...points.map(p=>p.y));
  actor.faceRegion={x:left,y:bottom,width:Math.max(...points.map(p=>p.x))-left,height:Math.max(...points.map(p=>p.y))-bottom};
 }
 dispose(){this.media.dispose();}
}

function loadPoster(path:string):Promise<HTMLImageElement>{return new Promise((resolve,reject)=>{
 const image=new Image();image.decoding='async';const timer=setTimeout(()=>{image.onload=image.onerror=null;image.src='';reject(Error('Designer poster timeout'));},5000);
 image.onload=()=>{clearTimeout(timer);image.onload=image.onerror=null;resolve(image);};image.onerror=()=>{clearTimeout(timer);image.onload=image.onerror=null;reject(Error('Designer poster failed'));};image.src=path;
});}

export async function loadDesignerIdleActor(actor:SpineActor):Promise<boolean>{
 const id=actor.unit.id,path=(registry as Record<string,string>)[id];
 if((id!=='mochi'&&id!=='clover')||!path)return false;
 const response=await fetch(path);if(!response.ok)throw Error(`Designer manifest HTTP ${response.status}`);
 const manifest:DesignerIdleManifest=validateDesignerIdle(await response.json(),id);
 if(!manifest.opaqueBounds||!manifest.faceROI)throw Error('Designer placement is not measured');
 const poster=await loadPoster(manifest.poster),media=new DesignerIdleMedia(manifest,poster);
 if(!await media.ready){const failure=media.failure;media.dispose();throw Error(failure??'Designer media unavailable');}
 const adapter=new DesignerIdleActorMedia(media),scale=512/manifest.opaqueHeight,[left,top,right,bottom]=manifest.opaqueBounds;
 actor.designerMedia=adapter;actor.designerIdle=true;actor.source='media';actor.root.add(media.plane);media.onFrame=()=>actor.onMediaFrame?.();
 Object.assign(actor.bounds,{x:(left-manifest.foot[0])*scale,y:(manifest.foot[1]-bottom)*scale,width:(right-left)*scale,height:(bottom-top)*scale});actor.opaqueWorld={...actor.bounds};
 for(const name of actor.unit.animations){
  const spec=SPINE_CONFIG.animations[name as SpineAnimation],duration=name==='idle'||name==='idle-phase2'?10:name==='skill'?LIVING_CAT_SKILL_SECONDS:name==='ult'?2.2:name==='attack'?.8:(spec.seconds[0]!+spec.seconds[1]!)/2;
  const events=name==='skill'?LIVING_CAT_SKILL_EVENTS:name==='ult'?[{name:'ult_release',time:1.1}]:name==='attack'?[{name:'hit',time:.35}]:[];
  actor.clips.set(name,{duration,cues:animationCues(name as SpineAnimation,duration,events)});
 }
 adapter.sample(actor,'idle',0,10,true,{worldTime:0,paused:true,fixedTime:true,frozen:false});return true;
}
