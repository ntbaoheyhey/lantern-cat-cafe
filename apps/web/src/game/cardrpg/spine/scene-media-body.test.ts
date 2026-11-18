import {expect,it,vi} from 'vitest';
import * as T from 'three';
import type {SceneView} from '../../squad/turn3d/scene';
import type {SpineActor} from './assets';
import {SpineScene} from './scene';
import {hasDesignerIdleBody} from './designer-idle-body';

const {load,drawings}=vi.hoisted(()=>({load:vi.fn(),drawings:vi.fn()}));
vi.mock('./assets',()=>({loadSpineActor:load}));
vi.mock('../vfx-craft/drawn-poses',()=>({loadDrawnPoseSet:drawings}));

it.each([
 ['mochi',true,false],['clover',true,false],
 ['mochi',false,true],['clover',undefined,true],['panko',true,true],
] as const)('routes %s marker=%s while retaining its encounter effects',async(id,designerIdle,needsDrawings)=>{
 drawings.mockReset().mockResolvedValue(undefined);
 const actor={root:new T.Group(),dispose:vi.fn(),onCue:()=>{},designerIdle} as unknown as SpineActor;
 load.mockReset().mockResolvedValue(actor);
 const view={actors:[{id,side:'enemy',cardRpg:{cardId:id}}]} as unknown as SceneView;
 const geometry=new T.PlaneGeometry(),ringGeometry=new T.RingGeometry(),shadowTexture=new T.Texture();
 const craftPrepare=vi.fn().mockResolvedValue(undefined);
 const state={scene:new T.Scene(),actors:new Map(),pending:new Map(),failed:new Set(),lanes:new Map(),
  sampled:new Map(),homes:new Map(),ready:false,disposed:false,time:0,dirty:false,
  geometry,ringGeometry,shadowTexture,view:()=>view,refreshLoading:vi.fn(),
  effects:{prepare:vi.fn().mockResolvedValue(undefined)},craftEffects:{prepare:craftPrepare}};
 const scene:SpineScene=Object.assign(Object.create(SpineScene.prototype) as SpineScene,state);
 try{
  scene.prepare(view);await vi.waitFor(()=>expect(scene.actors.size).toBe(1));
  expect(load).toHaveBeenCalledWith(id,undefined,{deferNativePixels:true});
  if(needsDrawings)expect(drawings).toHaveBeenCalledExactlyOnceWith(id);
  else expect(drawings).not.toHaveBeenCalled();
  expect(craftPrepare).toHaveBeenCalledExactlyOnceWith([id]);
  expect(hasDesignerIdleBody(id,actor)).toBe(!needsDrawings);
  expect(actor.root.visible).toBe(true);expect(actor.root.parent).toBe(state.scene);
 }finally{
  state.scene.traverse(node=>{if(node instanceof T.Mesh){const ms=Array.isArray(node.material)?node.material:[node.material];ms.forEach(m=>m.dispose());}});
  geometry.dispose();ringGeometry.dispose();shadowTexture.dispose();actor.dispose();
 }
});
