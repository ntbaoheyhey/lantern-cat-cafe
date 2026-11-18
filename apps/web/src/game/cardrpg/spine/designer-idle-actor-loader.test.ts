import {expect,it,vi} from 'vitest';
import * as T from 'three';
import type {SpineActor} from './assets';
import {SPINE_CONFIG} from './config';
import {DesignerIdleActorMedia,loadDesignerIdleActor} from './designer-idle-actor-loader';
import {validateDesignerIdle,type DesignerIdleManifest,type DesignerIdleMedia} from './designer-idle-loader';
const manifest=():DesignerIdleManifest=>({version:1,id:'mochi',format:'h264-rgb-mask',video:'/units/mochi/designer-idle-ab.mp4',poster:'/units/mochi/designer-idle-cd.webp',width:64,height:64,opaqueHeight:60,foot:[32,62],duration:10,fps:30,frames:300,sourceSha256:'a'.repeat(64),videoSha256:'b'.repeat(64),posterSha256:'c'.repeat(64),videoBytes:1000,faceROI:[16,10,32,20],opaqueBounds:[2,2,62,62],sockets:Object.fromEntries(['root','hip','head','hp-anchor','vfx-origin','main-hand','off-hand'].map(k=>[k,[32,k==='root'?62:20]])),socketTracks:{head:Array.from({length:300},(_,i)=>[i/100,0])},socketChannels:{head:'head'}});
const make=()=>{
 const m=manifest(),geometry=new T.PlaneGeometry(64*512/60,64*512/60,24,24);geometry.translate(0,30*512/60,0);
 const sample=vi.fn(),media={manifest:m,geometry,basePositions:new Float32Array(geometry.attributes.position!.array),video:{currentTime:2.5},sample,failure:undefined} as unknown as DesignerIdleMedia;
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
it('interpolates the last decoded frame through the ten-second wrap and freezes reduced motion',()=>{
 const {adapter,media,actor,geometry}=make();try{
  media.video.currentTime=299.5/30;const clock={worldTime:9,paused:true,fixedTime:true,frozen:false};
  adapter.sample(actor,'idle',0,10,false,clock);
  expect(actor.sockets.get('head')!.position.x).toBeCloseTo(1.495*512/60,8);
  adapter.sample(actor,'skill',.31,1,true,clock);
  expect(actor.sockets.get('head')!.position.x).toBe(0);
  expect(Array.from(geometry.attributes.position!.array)).toEqual(Array.from(media.basePositions));
 }finally{geometry.dispose();}
});
it('rejects incomplete tracks and an out-of-canvas face before allocating media',()=>{
 const m=manifest();m.socketTracks!.head!.pop();expect(()=>validateDesignerIdle(m,'mochi')).toThrow('socket track');
 const n=manifest();n.faceROI=[40,10,32,20];expect(()=>validateDesignerIdle(n,'mochi')).toThrow('face ROI');
});
it('never fetches or enrolls Soot',async()=>{
 const fetch=vi.spyOn(globalThis,'fetch');try{expect(await loadDesignerIdleActor({unit:{id:'soot'}} as SpineActor)).toBe(false);expect(fetch).not.toHaveBeenCalled();}finally{fetch.mockRestore();}
});
