import {expect,it} from 'vitest';
import * as T from 'three';
import type {SpineActor} from './assets';
import {SPINE_CONFIG} from './config';
import {DesignerIdleActorMedia} from './designer-idle-actor-loader';
import {validateDesignerIdle,type DesignerIdleManifest,type DesignerIdleMedia} from './designer-idle-loader';

const make=()=>{
 const manifest:DesignerIdleManifest={version:1,id:'clover',format:'h264-ycrcb-alpha-four-plane',video:'/units/clover/designer-idle-ab.mp4',poster:'/units/clover/designer-idle-cd.webp',width:212,height:260,opaqueHeight:256,foot:[100,258],duration:10,fps:30,frames:300,sourceSha256:'a'.repeat(64),videoSha256:'b'.repeat(64),posterSha256:'c'.repeat(64),videoBytes:2_000_000,faceROI:[90,40,60,60],
  sockets:{root:[100,258],hip:[110,150],head:[120,60],'hp-anchor':[100,-30],'main-hand':[160,110],'off-hand':[70,160],'vfx-origin':[200,90]},
  socketTracks:{freePaw:Array.from({length:300},()=>[0,0]),head:Array.from({length:300},()=>[2,-3]),prop:Array.from({length:300},()=>[11,-13]),hip:Array.from({length:300},()=>[-17,19]),spout:Array.from({length:300},()=>[23,-29])},
  socketChannels:{'off-hand':'freePaw',head:'head','main-hand':'prop',hip:'hip','vfx-origin':'spout'}};
 manifest.socketTracks!.freePaw![75]=[3,-4];manifest.socketTracks!.freePaw![76]=[7,-8];manifest.socketTracks!.freePaw![299]=[-6,9];
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([0,0,0,0,0,0],3));
 const media={manifest,geometry,basePositions:new Float32Array(6),video:{currentTime:75.25/30},sourceFrame:75.25,sample(){},failure:undefined} as unknown as DesignerIdleMedia;
 const actor={unit:{id:'clover'},sockets:new Map(Object.keys(SPINE_CONFIG.sockets).map(k=>[k,new T.Object3D()]))} as unknown as SpineActor;
 return {manifest,media,actor,geometry,adapter:new DesignerIdleActorMedia(media)};
};
const clock={worldTime:90,paused:false,fixedTime:false,frozen:false};
const expectPoint=(point:T.Vector3,want:readonly number[])=>want.forEach((n,i)=>expect(point.getComponent(i)).toBeCloseTo(n,8));

it('binds the free paw independently and preserves face, prop, hip and emission channels',()=>{
 const {manifest,media,actor,adapter,geometry}=make();try{
  expect(validateDesignerIdle(manifest,'clover')).toBe(manifest);
  adapter.sample(actor,'idle',0,10,false,clock);
  expectPoint(actor.sockets.get('offHand')!.position,[-52,206,1]);
  const other=new Map([...actor.sockets].filter(([key])=>key!=='offHand').map(([key,socket])=>[key,socket.position.toArray()])),face={...actor.faceRegion};
  manifest.socketTracks!.freePaw![75]=[15,-20];adapter.sample(actor,'idle',0,10,false,clock);
  expectPoint(actor.sockets.get('offHand')!.position,[-34,230,1]);
  for(const [key,want]of other)expectPoint(actor.sockets.get(key)!.position,want);
  expect(actor.faceRegion).toEqual(face);
  for(const channel of ['head','prop','hip','spout'] as const)for(const frame of [75,76])manifest.socketTracks![channel]![frame]=[99,-99];
  adapter.sample(actor,'idle',0,10,false,clock);expectPoint(actor.sockets.get('offHand')!.position,[-34,230,1]);
  expect(media.video.currentTime).toBe(75.25/30);
 }finally{geometry.dispose();}
});
it('keeps the seam interpolation and reduced/failure rest position independent',()=>{
 const {media,actor,adapter,geometry}=make();try{
  Object.assign(media,{sourceFrame:299.5});media.video.currentTime=299.5/30;adapter.sample(actor,'idle',0,10,false,clock);expectPoint(actor.sockets.get('offHand')!.position,[-66,187,1]);
  Object.assign(media,{sourceFrame:0});adapter.sample(actor,'idle',0,10,true,clock);expectPoint(actor.sockets.get('offHand')!.position,[-60,196,1]);
  media.failure='decode';adapter.sample(actor,'idle',0,10,false,clock);expectPoint(actor.sockets.get('offHand')!.position,[-60,196,1]);
 }finally{geometry.dispose();}
});
it('moves the free paw with its corresponding mesh point during cast and keeps feet fixed',()=>{
 const {media,actor,adapter,geometry}=make();try{
  media.basePositions.set([0,0,0,-52,206,0]);
  for(const animation of ['skill','ult'])for(const time of [.14,.25,.31,.55,.84,1]){
   adapter.sample(actor,animation,time,1,false,clock);const point=actor.sockets.get('offHand')!.position,mesh=geometry.attributes.position!;
   expect(point.x).toBeCloseTo(mesh.getX(1),4);expect(point.y).toBeCloseTo(mesh.getY(1),4);
   expect(actor.sockets.get('feet')!.position.toArray()).toEqual([0,0,1]);
   if(time===1)expectPoint(point,[-52,206,1]);
  }
 }finally{geometry.dispose();}
});
it('rejects incomplete tracks, other socket aliases and use by the other designer cat',()=>{
 const {manifest,geometry}=make();try{
  for(const socket of ['head','hip','main-hand','vfx-origin']){
   const invalid=structuredClone(manifest);invalid.socketChannels![socket]='freePaw';expect(()=>validateDesignerIdle(invalid,'clover')).toThrow('free paw');
  }
  const missing=structuredClone(manifest);delete missing.socketChannels!['off-hand'];expect(()=>validateDesignerIdle(missing,'clover')).toThrow('free paw');
  const short=structuredClone(manifest);short.socketTracks!.freePaw!.pop();expect(()=>validateDesignerIdle(short,'clover')).toThrow('socket track');
  const other=structuredClone(manifest);other.id='mochi';other.video=other.video.replace('clover','mochi');other.poster=other.poster.replace('clover','mochi');expect(()=>validateDesignerIdle(other,'mochi')).toThrow('free paw');
 }finally{geometry.dispose();}
});
