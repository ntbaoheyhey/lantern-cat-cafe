import {expect,it,vi} from 'vitest';
import * as T from 'three';
import type {SpineActor} from './assets';
import {SPINE_CONFIG} from './config';
import {DesignerIdleActorMedia,loadDesignerIdleActor} from './designer-idle-actor-loader';
import {validateDesignerIdle,type DesignerIdleManifest,type DesignerIdleMedia} from './designer-idle-loader';
const manifest=():DesignerIdleManifest=>({version:1,id:'mochi',format:'h264-rgb-mask',video:'/units/mochi/designer-idle-ab.mp4',poster:'/units/mochi/designer-idle-cd.webp',width:64,height:64,opaqueHeight:60,foot:[32,62],duration:10,fps:30,frames:300,sourceSha256:'a'.repeat(64),videoSha256:'b'.repeat(64),posterSha256:'c'.repeat(64),videoBytes:1000,faceROI:[16,10,32,20],opaqueBounds:[2,2,62,62],sockets:Object.fromEntries(['root','hip','head','hp-anchor','vfx-origin','main-hand','off-hand'].map(k=>[k,[32,k==='root'?62:20]])),socketTracks:{head:Array.from({length:300},(_,i)=>[i/100,0])},socketChannels:{head:'head'}});
const make=()=>{
 const m=manifest(),geometry=new T.PlaneGeometry(64*512/60,64*512/60,24,24);geometry.translate(0,30*512/60,0);
 const sample=vi.fn(),media={manifest:m,geometry,basePositions:new Float32Array(geometry.attributes.position!.array),video:{currentTime:2.5},sourceFrame:75,sample,failure:undefined} as unknown as DesignerIdleMedia;
 const actor={unit:{id:'mochi'},sockets:new Map(Object.keys(SPINE_CONFIG.sockets).map(k=>[k,new T.Object3D()]))} as unknown as SpineActor;
 return {adapter:new DesignerIdleActorMedia(media),media,actor,sample,geometry};
};
it('uses decoded media time across cast resets and preserves the planted foot',()=>{
 const {adapter,media,actor,geometry,sample}=make();try{
  const clock={worldTime:73,paused:false,fixedTime:false,frozen:false};
  adapter.sample(actor,'idle',0,10,false,clock);
  expect(actor.sockets.get('head')!.position.x).toBeCloseTo(.75*512/60,10);
  const before=Array.from(geometry.attributes.position!.array);
  adapter.sample(actor,'skill',.31,1,false,clock);
  expect(actor.sockets.get('feet')!.position.toArray()).toEqual([0,0,1]);
  expect(Array.from(geometry.attributes.position!.array)).not.toEqual(before);
  expect(media.video.currentTime).toBe(2.5);expect(sample).toHaveBeenLastCalledWith(clock,false);
  adapter.sample(actor,'skill',1,1,false,clock);
  expect(Array.from(geometry.attributes.position!.array)).toEqual(before);
  expect(actor.sockets.get('head')!.position.x).toBeCloseTo(.75*512/60,10);
 }finally{geometry.dispose();}
});
it('preserves fallback interpolation through wrap and accepts the decoded reduced frame',()=>{
 const {adapter,media,actor,geometry}=make();try{
  Object.assign(media,{sourceFrame:299.5});media.video.currentTime=299.5/30;const clock={worldTime:9,paused:true,fixedTime:true,frozen:false};
  adapter.sample(actor,'idle',0,10,false,clock);
  expect(actor.sockets.get('head')!.position.x).toBeCloseTo(1.495*512/60,8);
  Object.assign(media,{sourceFrame:0});adapter.sample(actor,'skill',.31,1,true,clock);
  expect(actor.sockets.get('head')!.position.x).toBe(0);
  expect(Array.from(geometry.attributes.position!.array)).toEqual(Array.from(media.basePositions));
 }finally{geometry.dispose();}
});
it('rejects incomplete tracks and an out-of-canvas face before allocating media',()=>{
 const m=manifest();m.socketTracks!.head!.pop();expect(()=>validateDesignerIdle(m,'mochi')).toThrow('socket track');
 const n=manifest();n.faceROI=[40,10,32,20];expect(()=>validateDesignerIdle(n,'mochi')).toThrow('face ROI');
});
it('keeps hip, shield wrist and lantern independent through fractional frames and wrap',()=>{
 const {adapter,media,actor,geometry}=make();try{
  const m=media.manifest;
  m.socketTracks={...m.socketTracks,hip:Array.from({length:300},()=>[2,-3]),shieldWrist:Array.from({length:300},()=>[-5,7]),lantern:Array.from({length:300},()=>[11,-13])};
  m.socketTracks.hip![299]=[6,-7];m.socketTracks.shieldWrist![299]=[-9,15];m.socketTracks.lantern![299]=[21,-23];
  m.socketChannels={...m.socketChannels,hip:'hip','main-hand':'shieldWrist','vfx-origin':'lantern'};
  expect(validateDesignerIdle(m,'mochi')).toBe(m);
  Object.assign(media,{sourceFrame:299.5});media.video.currentTime=299.5/30;const clock={worldTime:1,paused:false,fixedTime:false,frozen:false};
  adapter.sample(actor,'idle',0,10,false,clock);
  const s=512/60;
  for(const [key,x,y]of [['chest',4,47],['mainHand',-7,31],['vfxOrigin',16,60]] as const){
   expect(actor.sockets.get(key)!.position.x).toBeCloseTo(x*s,8);
   expect(actor.sockets.get(key)!.position.y).toBeCloseTo(y*s,8);
  }
  expect(actor.sockets.get('feet')!.position.toArray()).toEqual([0,0,1]);
  Object.assign(media,{sourceFrame:0});adapter.sample(actor,'idle',0,10,true,clock);
  expect(actor.sockets.get('chest')!.position.x).toBeCloseTo(2*s,8);
  expect(actor.sockets.get('mainHand')!.position.x).toBeCloseTo(-5*s,8);
  expect(actor.sockets.get('vfxOrigin')!.position.x).toBeCloseTo(11*s,8);
  media.failure='decode';adapter.sample(actor,'idle',0,10,false,clock);
  expect(actor.sockets.get('vfxOrigin')!.position.x).toBeCloseTo(11*s,8);
 }finally{geometry.dispose();}
});
it('rejects unknown, missing and malformed independent socket channels',()=>{
 const unknown=manifest();Object.assign(unknown.socketChannels!,{head:'constructor'});expect(()=>validateDesignerIdle(unknown,'mochi')).toThrow('socket channel');
 const missing=manifest();missing.socketChannels!['main-hand']='shieldWrist';expect(()=>validateDesignerIdle(missing,'mochi')).toThrow('socket channel');
 const malformed=manifest();malformed.socketTracks!.lantern=Array.from({length:300},()=>[0,NaN]);expect(()=>validateDesignerIdle(malformed,'mochi')).toThrow('socket track');
 const track=manifest();Object.assign(track.socketTracks!,{arbitrary:Array.from({length:300},()=>[0,0])});expect(()=>validateDesignerIdle(track,'mochi')).toThrow('socket track');
});
it('never fetches or enrolls Soot',async()=>{
 const fetch=vi.spyOn(globalThis,'fetch');try{expect(await loadDesignerIdleActor({unit:{id:'soot'}} as SpineActor)).toBe(false);expect(fetch).not.toHaveBeenCalled();}finally{fetch.mockRestore();}
});

it('holds sockets on the decoded frame while the seek target and reduced mode change',()=>{
 const {adapter,media,actor,geometry}=make();try{
  const clock={worldTime:8,paused:true,fixedTime:true,frozen:false};
  media.video.currentTime=8;adapter.sample(actor,'idle',0,10,false,clock);
  expect(actor.sockets.get('head')!.position.x).toBeCloseTo(.75*512/60,10);
  media.video.currentTime=0;adapter.sample(actor,'idle',0,10,true,clock);
  expect(actor.sockets.get('head')!.position.x).toBeCloseTo(.75*512/60,10);
  Object.assign(media,{sourceFrame:0});adapter.sample(actor,'idle',0,10,true,clock);
  expect(actor.sockets.get('head')!.position.x).toBe(0);
 }finally{geometry.dispose();}
});
