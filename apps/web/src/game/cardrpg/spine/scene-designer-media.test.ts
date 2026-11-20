import {expect,it,vi} from 'vitest';
import * as T from 'three';
import type {SceneView} from '../../squad/turn3d/scene';
import type {SpineActor} from './assets';
import {SpineScene} from './scene';
import {unitFace} from '../stage/core';
const {load}=vi.hoisted(()=>({load:vi.fn()}));
vi.mock('./assets',()=>({loadSpineActor:load}));
vi.mock('../vfx-craft/drawn-poses',()=>({loadDrawnPoseSet:vi.fn().mockResolvedValue(undefined)}));

it.each(['mochi','clover','panko'])('invalidates decoded media only for a commissioned idle: %s',async id=>{
 const actor={root:new T.Group(),dispose:vi.fn(),onCue:()=>{}} as unknown as SpineActor;
 load.mockResolvedValue(actor);
 const view={actors:[{id,side:'enemy',cardRpg:{cardId:id}}]} as unknown as SceneView;
 const geometry=new T.PlaneGeometry(),ringGeometry=new T.RingGeometry(),shadowTexture=new T.Texture();
 const state={scene:new T.Scene(),actors:new Map(),pending:new Map(),failed:new Set(),lanes:new Map(),
  sampled:new Map(),homes:new Map(),ready:false,disposed:false,time:0,dirty:false,
  geometry,ringGeometry,shadowTexture,view:()=>view,refreshLoading:vi.fn(),
  effects:{prepare:vi.fn().mockResolvedValue(undefined)},craftEffects:{prepare:vi.fn().mockResolvedValue(undefined)}};
 const scene:SpineScene=Object.assign(Object.create(SpineScene.prototype) as SpineScene,state);
 try{
  scene.prepare(view);await vi.waitFor(()=>expect(scene.actors.size).toBe(1));
  const mutable=scene as unknown as {dirty:boolean};mutable.dirty=false;
  if(id==='panko')expect(actor.onMediaFrame).toBeUndefined();
  else{expect(actor.onMediaFrame).toBeTypeOf('function');actor.onMediaFrame!();expect(mutable.dirty).toBe(true);}
 }finally{
  state.scene.traverse(node=>{if(node instanceof T.Mesh){const materials=Array.isArray(node.material)?node.material:[node.material];materials.forEach(m=>m.dispose());}});
  geometry.dispose();ringGeometry.dispose();shadowTexture.dispose();actor.dispose();
 }
});
it.each(['mochi','clover','panko'])('uses a supplied commissioned face region without changing other lookups: %s',asset=>{
 const bounds={x:-250,y:0,width:500,height:512},faceRegion={x:-80,y:300,width:170,height:130};
 const project=vi.fn((_entry:unknown,region:unknown)=>region);
 const scene=Object.assign(Object.create(SpineScene.prototype),{bounds:project}) as {faceBounds:(entry:unknown)=>unknown};
 const entry={asset,actor:{bounds,faceRegion}};
 expect(scene.faceBounds(entry)).toEqual(asset==='panko'?unitFace(asset,bounds):faceRegion);
 expect(scene.faceBounds({asset,actor:{bounds}})).toEqual(unitFace(asset,bounds));
});
