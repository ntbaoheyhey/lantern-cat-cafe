/** Stateless data/texture cache; every displayed actor receives a separate cut-out pose state. */
import * as T from 'three';
import { CutoutMesh, type CutoutData, type CutoutBone } from '../../rig/cutout';
import {withRigContract} from '../../rig/contract';
import { importSkeleton } from '../../../../../../scripts/art/import-spine.mjs';
import { loadPuppetModel, animateIllustrated } from '../../squad/turn3d/look-puppet';
import { fallbackScale } from '../../squad/turn3d/look-scale';
import { SPINE_CONFIG, SPINE_UNIT_BY_ID, type SpineUnit, type SpineAnimation, type SpineSocket, type AcceptedSkeleton, type AcceptedSequence } from './config';
import { animationCues, SpineEventCursor, type SpineCue } from './events';
import {opaqueBounds} from '../stage/core';
import {opaqueWorldBounds,type OpaqueWorldBounds} from '../stage/opaque-pose-bounds';
import losslessAtlases from './lossless-atlases.json';
const files=import.meta.glob('../../../../../../assets/cardrpg-look/{spine,vfx-designer}/**/*.{json,skel,atlas,png}',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const urls=new Map(Object.entries(files).map(([path,url])=>[path.slice(path.indexOf('assets/')),url]));
const deliveryUrls=new Map(losslessAtlases.map(page=>[page.request,page.url]));
export const spineAssetUrl=(path:string)=>{const url=deliveryUrls.get(path)??urls.get(path);if(!url)throw Error(`Unpublished Spine asset ${path}`);return url;};
async function response(path:string){const r=await fetch(spineAssetUrl(path));if(!r.ok)throw Error(`${path}: HTTP ${r.status}`);return r;}
const image=async(path:string)=>{const img=new Image();img.src=spineAssetUrl(path);await img.decode();return img;};
export interface ClipData {duration:number;cues:SpineCue[]}
type SkeletonAsset={data:CutoutData;create:()=>CutoutMesh;clips:Map<string,ClipData>;bounds:{x:number;y:number;width:number;height:number}};
interface SequenceManifest {id:string;height:number;width:number;scale?:number;fps?:number;sockets:Record<string,[number,number]>;animations:Record<string,{fps?:number;frames:string[];events?:{name:string;time:number}[]}>}
type SequenceAsset={manifest:SequenceManifest;textures:Map<string,T.Texture>;clips:Map<string,ClipData>};
const skeletonCache=new Map<string,Promise<SkeletonAsset>>(),sequenceCache=new Map<string,Promise<SequenceAsset>>();
const templateStyles=import.meta.glob('../../../../../../art/units/*/style.json',{eager:true,import:'default'});
const templateIds=new Set(Object.keys(templateStyles).map(p=>p.split('/').at(-2)!));
const designerIds=new Set(['mochi','soot','clover']);
/** Native JSON and original atlas pixels; no third-party animation runtime. */
export function loadNativeRig(id:string):Promise<SkeletonAsset>{
 const key='native:'+id,cached=skeletonCache.get(key);if(cached)return cached;
 const pending=(async()=>{
  const r=await fetch(`/units/${id}/rig.json`);if(!r.ok)throw Error(`Native rig ${id}: HTTP ${r.status}`);
  const data=await r.json() as CutoutData;if(data.format!=='taskbar-cutout-v1'||!data.parts?.length)throw Error('Invalid native cut-out rig '+id);
  const textures:T.Texture[]=[];
  try{for(const page of data.pages){const img=new Image(),path=`/units/${id}/${page.name}`;img.src=deliveryUrls.get(path)??path;await img.decode();const texture=new T.Texture(img);texture.colorSpace=T.NoColorSpace;texture.needsUpdate=true;textures.push(texture);}
   const clips=new Map(Object.entries(data.clips).map(([name,clip])=>[name,{duration:clip.duration,cues:animationCues(name as SpineAnimation,clip.duration,clip.events)}]));
   return{data,bounds:data.bounds,clips,create:()=>new CutoutMesh(data,textures)};
  }catch(e){textures.forEach(t=>t.dispose());throw e;}
 })().catch(e=>{skeletonCache.delete(key);throw e;});skeletonCache.set(key,pending);return pending;
}
export const spineCacheStats=()=>({skeletons:skeletonCache.size,sequences:sequenceCache.size});
export function loadSkeleton(spec:AcceptedSkeleton):Promise<SkeletonAsset>{
 const key=`${spec.skeleton}:${spec.scale}`;let cached=skeletonCache.get(key);if(cached)return cached;
 cached=(async()=>{
  if(spec.skeleton.endsWith('.skel'))throw Error('Export JSON and convert with scripts/art/convert-spine.mjs; binary Spine runtime is not shipped');
  const atlasText=await (await response(spec.atlas)).text(),source=await (await response(spec.skeleton)).json();
  const data=withRigContract(importSkeleton(source,atlasText,spec.scale)),textures:T.Texture[]=[];
  try {
   const folder=spec.atlas.slice(0,spec.atlas.lastIndexOf('/')+1);
   for(const page of data.pages){if(page.width>SPINE_CONFIG.atlasMax||page.height>SPINE_CONFIG.atlasMax)throw Error('Oversized atlas');const texture=new T.Texture(await image(folder+page.name));texture.colorSpace=T.NoColorSpace;texture.needsUpdate=true;textures.push(texture);}
   const clips=new Map(Object.entries(data.clips).map(([name,clip])=>[name,{duration:clip.duration,cues:animationCues(name as SpineAnimation,clip.duration,clip.events)}]));
   return {data,bounds:data.bounds,clips,create:()=>new CutoutMesh(data,textures)};
  }catch(error){textures.forEach(texture=>texture.dispose());throw error;}
 })().catch(error=>{
  // Keep successful data shared, but let a later actor request recover from
  // a temporary fetch/decode failure instead of pinning its fallback forever.
  if(skeletonCache.get(key)===cached)skeletonCache.delete(key);throw error;
 });skeletonCache.set(key,cached);return cached;
}
function loadSequence(spec:AcceptedSequence):Promise<SequenceAsset>{
 const key=spec.manifest;let cached=sequenceCache.get(key);if(cached)return cached;
 cached=(async()=>{const manifest=await (await response(spec.manifest)).json() as SequenceManifest,folder=spec.manifest.slice(0,spec.manifest.lastIndexOf('/')+1),textures=new Map<string,T.Texture>(),clips=new Map<string,ClipData>();
  try{for(const [name,clip] of Object.entries(manifest.animations)){
   for(const frame of clip.frames)if(!textures.has(frame)){const texture=new T.Texture(await image(folder+frame));texture.needsUpdate=true;texture.colorSpace=T.NoColorSpace;textures.set(frame,texture);}
   const duration=clip.frames.length/(clip.fps??manifest.fps??24);clips.set(name,{duration,cues:animationCues(name as SpineAnimation,duration,clip.events??[])});
  }return {manifest,textures,clips};}catch(error){textures.forEach(t=>t.dispose());throw error;}
 })().catch(error=>{if(sequenceCache.get(key)===cached)sequenceCache.delete(key);throw error;});sequenceCache.set(key,cached);return cached;
}
export class SpineActor {
 readonly root=new T.Group();readonly cursor=new SpineEventCursor();readonly sockets=new Map<SpineSocket,T.Object3D>();
 readonly boneRefs=new Map<SpineSocket,CutoutBone>();readonly clips=new Map<string,ClipData>();
 readonly bounds={x:0,y:0,width:0,height:0};source:'designer'|'template'|'placeholder'|'sequence'|'puppet'='puppet';
 opaqueWorld:OpaqueWorldBounds|undefined;
 private poseBounds={x:0,y:0,width:0,height:0};private boundsOffset=new T.Vector2();private boundsSize=new T.Vector2();private boundsVertices:number[]=[];
 mesh?:CutoutMesh;puppet?:T.Group;sequence?:SequenceAsset;plane?:T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>;
 private animation='';private key:unknown;private at=0;private order=0;
 onCue:(cue:SpineCue)=>void=()=>{};
 constructor(readonly unit:SpineUnit){for(const name of Object.keys(SPINE_CONFIG.sockets) as SpineSocket[]){const socket=new T.Object3D();socket.name=name;this.sockets.set(name,socket);this.root.add(socket);}}
 duration(name:string){return this.clips.get(name)?.duration??1;}
 cues(name=this.animation){return this.clips.get(name)?.cues??[];}
 setOrder(order:number){this.order=order;this.root.traverse(child=>{child.renderOrder=order;child.frustumCulled=false;});}
 /** A stable action key resets a clip only once, including consecutive casts of the same skill. */
 sample(name:string,key:unknown,time:number,delta:number,camera:T.Camera,reduced:boolean){
  if(!this.clips.has(name))name='idle';
  const changed=this.animation!==name||this.key!==key||time<this.at;
  if(changed){this.animation=name;this.key=key;this.at=0;this.cursor.reset();if(this.mesh){this.mesh.skeleton.setToSetupPose();this.mesh.state.setAnimation(0,name,false);}}
  const duration=this.duration(name),at=Math.max(0,Math.min(duration,time));
  if(this.mesh){this.mesh.update(Math.max(0,at-this.at));this.setOrder(this.order);for(const [socket,bone] of this.boneRefs)this.sockets.get(socket)!.position.set(bone.worldX,bone.worldY,1);}
  if(this.puppet){const clip=({attack:'attack',skill:'cast',ult:'ultimate',hurt:'hit',ko:'KO',appear:'idle','idle-phase2':'idle',enrage:'cast'} as Record<string,string>)[name]??name;animateIllustrated(this.puppet,camera,time,clip,at/duration,reduced,!['idle','idle-phase2','victory'].includes(name),name==='ult');}
  if(this.sequence&&this.plane){const clip=this.sequence.manifest.animations[name]!;this.plane.material.map=this.sequence.textures.get(clip.frames[Math.min(clip.frames.length-1,Math.floor(at*(clip.fps??this.sequence.manifest.fps??24)))]!)!;}
  if(!['idle','idle-phase2','victory'].includes(name))this.cursor.advance(this.cues(name),at,this.onCue);
  this.at=at;this.root.updateMatrixWorld(true);void delta;
 }
 socket(name:SpineSocket,target:T.Vector3){return this.sockets.get(name)!.getWorldPosition(target);}
 /** Reuse scratch storage; animated hands/wings may extend past setup bounds. */
 framingBounds(){
  if(!this.mesh)return this.bounds;
  this.mesh.skeleton.getBounds(this.boundsOffset,this.boundsSize,this.boundsVertices);
  const b=this.poseBounds;b.x=this.boundsOffset.x;b.y=this.boundsOffset.y;b.width=this.boundsSize.x;b.height=this.boundsSize.y;
  return Number.isFinite(b.x+b.y+b.width+b.height)?b:this.bounds;
 }
 dispose(){this.mesh?.dispose();if(this.puppet)this.puppet.traverse(node=>{if(node instanceof T.Mesh){node.geometry.dispose();const ms=Array.isArray(node.material)?node.material:[node.material];ms.forEach(m=>{(m as T.MeshBasicMaterial).map?.dispose();m.dispose();});}});this.plane?.geometry.dispose();this.plane?.material.dispose();this.root.removeFromParent();}
}
function measuredActor(actor:SpineActor){Object.assign(actor.bounds,opaqueBounds(actor.unit.id,actor.source,actor.bounds));actor.opaqueWorld=opaqueWorldBounds(actor.root);return actor;}
export async function loadSpineActor(id:string,preference?:'placeholder'|'designer'|'sequence'|'puppet'):Promise<SpineActor>{
 const unit=SPINE_UNIT_BY_ID.get(id);if(!unit)throw Error(`Unknown unit ${id}`);const actor=new SpineActor(unit),errors:string[]=[];
 const designer=unit.designer,sequence=unit.sequence;
 if(!preference&&!designer&&!sequence&&!designerIds.has(id)&&templateIds.has(id))try{
  const data=await loadNativeRig(id);actor.mesh=data.create();actor.root.add(actor.mesh);actor.source='template';Object.assign(actor.bounds,data.bounds);
  for(const [name,clip] of data.clips)actor.clips.set(name,clip);
  for(const [name,bone] of Object.entries(SPINE_CONFIG.sockets)){const ref=actor.mesh.skeleton.findBone(bone);if(!ref)throw Error(`Missing native socket ${bone}`);actor.boneRefs.set(name as SpineSocket,ref);}
  return measuredActor(actor);
 }catch(error){actor.mesh?.dispose();actor.mesh=undefined;actor.clips.clear();actor.boneRefs.clear();errors.push(String(error));}
 const noRuntime=typeof location!=='undefined'&&new URLSearchParams(location.search).get('spineRuntime')==='0';
 const candidates:{source:'designer'|'placeholder';spec:AcceptedSkeleton}[]=[];
 if(!noRuntime&&preference!=='puppet'&&preference!=='sequence'){
  if(designer&&preference!=='placeholder')candidates.push({source:'designer',spec:designer});
  if(preference!=='designer')candidates.push({source:'placeholder',spec:unit.placeholder});
 }
 // A newly installed PNG delivery can replace an older accepted skeleton.
 // Explicit previews and the runtime-free flag still take precedence.
 const sequenceFirst=!designer||noRuntime||preference==='sequence'||preference===undefined&&unit.activeSource==='sequence';
 if(sequence&&sequenceFirst&&preference!=='puppet'&&preference!=='placeholder'){
  try{const data=await loadSequence(sequence);actor.source='sequence';actor.sequence=data;for(const [k,v] of data.clips)actor.clips.set(k,v);const scale=data.manifest.scale??sequence.scale;
   Object.assign(actor.bounds,{x:-data.manifest.width*scale/2,y:0,width:data.manifest.width*scale,height:data.manifest.height*scale});
   actor.plane=new T.Mesh(new T.PlaneGeometry(actor.bounds.width,actor.bounds.height),new T.MeshBasicMaterial({transparent:true,depthWrite:false,depthTest:false,toneMapped:false}));actor.plane.position.y=actor.bounds.height/2;actor.root.add(actor.plane);
   for(const [name,bone] of Object.entries(SPINE_CONFIG.sockets)) {const xy=data.manifest.sockets[bone];if(xy)actor.sockets.get(name as SpineSocket)!.position.set(xy[0]*scale,xy[1]*scale,1);}return measuredActor(actor);
  }catch(error){errors.push(String(error));}
 }
 for(const candidate of candidates)try{const data=await loadSkeleton(candidate.spec);actor.mesh=data.create();actor.mesh.zOffset=.001;actor.mesh.state.data.defaultMix=SPINE_CONFIG.mixSeconds;actor.root.add(actor.mesh);actor.source=candidate.source;Object.assign(actor.bounds,data.bounds);for(const [k,v] of data.clips)actor.clips.set(k,v);for(const [name,bone] of Object.entries(SPINE_CONFIG.sockets)){const ref=actor.mesh.skeleton.findBone(bone);if(!ref)throw Error(`Missing socket ${bone}`);actor.boneRefs.set(name as SpineSocket,ref);}return measuredActor(actor);}catch(error){actor.mesh?.dispose();actor.mesh?.removeFromParent();actor.mesh=undefined;errors.push(String(error));}
 // Last fallback uses accepted old pixels and motion, normalized to the same unit contract.
 const {scene}=await loadPuppetModel(id);actor.puppet=scene;actor.root.add(scene);const rig=scene.userData.paintedRig,measurement=fallbackScale(rig),bodyHeight=(measurement.max[1]!-measurement.min[1]!);
 const scale=unit.targetHeight/bodyHeight;scene.scale.set(scale*measurement.widthScale,scale,scale);
 scene.traverse(node=>{if(node instanceof T.Mesh){const old=node.material as T.MeshStandardMaterial;if(old.map)old.map.colorSpace=T.NoColorSpace;node.material=new T.MeshBasicMaterial({map:old.map,transparent:true,depthTest:false,depthWrite:false,toneMapped:false});old.dispose();}});
 Object.assign(actor.bounds,{x:-unit.targetHeight*rig.aspect/2,y:0,width:unit.targetHeight*rig.aspect,height:unit.targetHeight});
 for(const [name,y] of [['feet',0],['chest',.5],['head',.77],['hpAnchor',1.12],['vfxOrigin',.52],['mainHand',.5],['offHand',.48]] as const)actor.sockets.get(name)!.position.set(name==='mainHand'?unit.targetHeight*.24:name==='offHand'?-unit.targetHeight*.2:0,unit.targetHeight*y,1);
 for(const name of unit.animations){const spec=SPINE_CONFIG.animations[name as SpineAnimation],duration=(spec.seconds[0]!+spec.seconds[1]!)/2;actor.clips.set(name,{duration,cues:animationCues(name as SpineAnimation,duration,[])});}
 actor.root.userData.intakeWarnings=errors;return measuredActor(actor);
}
