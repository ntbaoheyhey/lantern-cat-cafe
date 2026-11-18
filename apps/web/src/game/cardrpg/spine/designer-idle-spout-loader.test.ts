import {expect,it} from 'vitest';
import * as T from 'three';
import type {SpineActor} from './assets';
import {SPINE_CONFIG} from './config';
import {DesignerIdleActorMedia} from './designer-idle-actor-loader';
import {validateDesignerIdle,type DesignerIdleManifest,type DesignerIdleMedia} from './designer-idle-loader';

const make=()=>{
 const manifest:DesignerIdleManifest={version:1,id:'clover',format:'h264-rgb-mask',video:'/units/clover/designer-idle-ab.mp4',poster:'/units/clover/designer-idle-cd.webp',width:318,height:390,opaqueHeight:384,foot:[155.3,387],duration:10,fps:30,frames:300,sourceSha256:'a'.repeat(64),videoSha256:'b'.repeat(64),posterSha256:'c'.repeat(64),videoBytes:1000,faceROI:[135,60,90,90],
  sockets:{root:[155.3,387],hip:[160,230],head:[180,100],'hp-anchor':[180,-35],'main-hand':[250,170],'off-hand':[150,180],'vfx-origin':[311.583711,137.716]},
  socketTracks:{spout:Array.from({length:300},()=>[0,0]),prop:Array.from({length:300},()=>[11,-13]),lantern:Array.from({length:300},()=>[-17,19])},socketChannels:{'vfx-origin':'spout','main-hand':'prop'}};
 manifest.socketTracks!.spout![299]=[-6,9];manifest.socketTracks!.spout![75]=[3,-4];manifest.socketTracks!.spout![76]=[7,-8];
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([0,0,0,0,0,0],3));
 const media={manifest,geometry,basePositions:new Float32Array(6),video:{currentTime:75.25/30},sample(){},failure:undefined} as unknown as DesignerIdleMedia;
 const actor={unit:{id:'clover'},sockets:new Map(Object.keys(SPINE_CONFIG.sockets).map(k=>[k,new T.Object3D()]))} as unknown as SpineActor;
 return {manifest,media,actor,geometry,adapter:new DesignerIdleActorMedia(media)};
};
const clock={worldTime:90,paused:false,fixedTime:false,frozen:false};
const expected=(xy:readonly number[])=>[(xy[0]!-155.3)*512/384,(387-xy[1]!)*512/384,1];
const expectPoint=(actual:T.Vector3,want:readonly number[])=>want.forEach((n,i)=>expect(actual.getComponent(i)).toBeCloseTo(n,8));

it('keeps the Clover emission lip separate from held prop and lantern at fractional frames',()=>{
 const {manifest,media,actor,adapter,geometry}=make();try{
  expect(validateDesignerIdle(manifest,'clover')).toBe(manifest);
  adapter.sample(actor,'idle',0,10,false,clock);
  expectPoint(actor.sockets.get('vfxOrigin')!.position,expected([315.583711,132.716]));
  expectPoint(actor.sockets.get('mainHand')!.position,expected([261,157]));
  media.manifest.socketTracks!.prop![75]=[-99,99];media.manifest.socketTracks!.lantern![75]=[99,-99];
  adapter.sample(actor,'idle',0,10,false,clock);
  expectPoint(actor.sockets.get('vfxOrigin')!.position,expected([315.583711,132.716]));
 }finally{geometry.dispose();}
});
it('interpolates the spout over the last-to-first frame and returns to frame zero for reduced or failed media',()=>{
 const {media,actor,adapter,geometry}=make();try{
  media.video.currentTime=299.5/30;adapter.sample(actor,'idle',0,10,false,clock);
  expectPoint(actor.sockets.get('vfxOrigin')!.position,expected([308.583711,142.216]));
  media.video.currentTime=10;adapter.sample(actor,'idle',0,10,false,clock);
  expectPoint(actor.sockets.get('vfxOrigin')!.position,expected([311.583711,137.716]));
  media.video.currentTime=75.25/30;adapter.sample(actor,'skill',.31,1,true,clock);
  expectPoint(actor.sockets.get('vfxOrigin')!.position,expected([311.583711,137.716]));
  media.failure='decode';adapter.sample(actor,'idle',0,10,false,clock);
  expectPoint(actor.sockets.get('vfxOrigin')!.position,expected([311.583711,137.716]));
 }finally{geometry.dispose();}
});
it('deforms the moving spout with its corresponding mesh point during casts and restores it without clock resets',()=>{
 const {media,actor,adapter,geometry}=make();try{
  const point=expected([315.583711,132.716]);media.basePositions.set([0,0,0,point[0]!,point[1]!,0]);
  for(const animation of ['skill','ult'])for(const time of [.14,.25,.31,.55,.84,1]){
   adapter.sample(actor,animation,time,1,false,clock);
   const mesh=geometry.attributes.position!,socket=actor.sockets.get('vfxOrigin')!.position;
   expect(socket.x).toBeCloseTo(mesh.getX(1),4);expect(socket.y).toBeCloseTo(mesh.getY(1),4);
   expect(actor.sockets.get('feet')!.position.toArray()).toEqual([0,0,1]);
   expect(media.video.currentTime).toBe(75.25/30);
   if(time===1)expectPoint(socket,point);else if(time===.31)expect(socket.x).not.toBeCloseTo(point[0]!,3);
  }
 }finally{geometry.dispose();}
});
it('rejects missing, nonfinite and incomplete spout tracks before media allocation',()=>{
 const {manifest,geometry}=make();try{
  delete manifest.socketTracks!.spout;expect(()=>validateDesignerIdle(manifest,'clover')).toThrow('socket channel');
  manifest.socketTracks!.spout=Array.from({length:300},()=>[0,Infinity]);expect(()=>validateDesignerIdle(manifest,'clover')).toThrow('socket track');
  manifest.socketTracks!.spout=Array.from({length:299},()=>[0,0]);expect(()=>validateDesignerIdle(manifest,'clover')).toThrow('socket track');
 }finally{geometry.dispose();}
});
