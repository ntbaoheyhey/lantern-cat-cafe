/** Generic K0–K6 adapter for the established presentation clock and effect sockets. */
import * as T from 'three';
import {type DrawingSet,type DrawingManifest,type DrawingKey,type DrawingSample,DrawingLayer} from '../../rig/drawing-layer';
import type {SpineActor} from '../spine/assets';
import {type SpineSocket,type SpineAnimation} from '../spine/config';
import {animationCues} from '../spine/events';
import {unitCore} from '../stage/core';

const cache=new Map<string,Promise<DrawingSet>>();
export function loadDrawnPoseSet(unit:string):Promise<DrawingSet>{
 const cached=cache.get(unit);if(cached)return cached;
 const pending=(async()=>{
  const response=await fetch(`/units/${unit}/poses/manifest.json`);if(!response.ok)throw Error(`Drawn poses ${unit}: HTTP ${response.status}`);
  const manifest=await response.json() as DrawingManifest;
  if(manifest.version!==1||manifest.unit!==unit||manifest.opaqueHeight<=0)throw Error('Invalid drawn-pose manifest');
  for(const key of ['K0','K1','K2','K4','K5'] as const)if(!manifest.poses[key])throw Error(`Missing drawing ${key}`);
  const textures:DrawingSet['textures']={};
  try{for(const [key,frame]of Object.entries(manifest.poses)){
   const image=new Image();image.src=`/units/${unit}/poses/${frame.image}`;await image.decode();
   if(image.width!==manifest.canvas[0]||image.height!==manifest.canvas[1])throw Error(`Drawing canvas mismatch ${unit}/${key}`);
   const texture=new T.Texture(image);texture.colorSpace=T.NoColorSpace;texture.needsUpdate=true;textures[key as DrawingKey]=texture;
  }return{manifest,textures};}catch(error){for(const texture of Object.values(textures))texture.dispose();throw error;}
 })().catch(error=>{cache.delete(unit);throw error;});cache.set(unit,pending);return pending;
}
export class DrawnPoses {
 readonly drawing:DrawingLayer;
 readonly layoutExtents:{leftExtent:number;rightExtent:number};
 constructor(readonly actor:SpineActor,set:DrawingSet){
  if(!actor.mesh)throw Error('Drawing swaps require an accepted cut-out rig');
  const core=unitCore(actor.unit.id,actor.bounds).world;
  this.drawing=actor.mesh.installDrawings(set,[actor.bounds.x+actor.bounds.width/2,core.y],core.height/set.manifest.opaqueHeight);
  // One home for every drawing: wide strike keys must not move the planted foot.
  // Include the guarded smear and secondary motion before selecting that home.
  const m=set.manifest,frames=Object.values(m.poses);
  const left=Math.min(...frames.map(f=>f.opaqueBounds?.[0]??0));
  const right=Math.max(...frames.map(f=>f.opaqueBounds?.[2]??m.canvas[0]));
  this.layoutExtents={leftExtent:(m.baseline[0]-left)/m.opaqueHeight*1.12+.025,rightExtent:(right-m.baseline[0])/m.opaqueHeight*1.12+.025};
  for(const [name,duration]of [['attack',.8],['ult',2.2],['skill',2.2],['hurt',.4],['ko',.6],['idle',3.6]] as const){
   const events=name==='attack'?[{name:'hit',time:.35}]:name==='ult'||name==='skill'?[{name:'ult_release',time:1.1}]:[];
   actor.clips.set(name,{duration,cues:animationCues(name as SpineAnimation,duration,events)});
  }
  this.deform('idle',0,false);
 }
 owns(name:string){return name==='attack'||name==='ult'||name==='skill';}
 deform(name:string,time:number,reduced:boolean,damageAge?:number,clock=time,target=0,critAge=-1){
  this.drawing.sample(name,time,reduced,damageAge,clock,target,critAge);
  for(const [name,pixel]of Object.entries(this.drawing.frame.sockets)){
   const target=this.actor.sockets.get(name as SpineSocket);if(!target)continue;
   const p=this.drawing.point(pixel);target.position.set(p.x,p.y,1);
  }
 }
 faceCorners(_region:{x:number;y:number;width:number;height:number}){return this.drawing.faceCorners();}
 socketFor(key:DrawingKey,name:string,at?:DrawingSample){const p=this.drawing.set.manifest.poses[key]?.sockets[name];return p?this.drawing.point(p,key,at):undefined;}
}
