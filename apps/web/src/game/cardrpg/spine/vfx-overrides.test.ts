import {beforeEach, afterEach, expect, it, vi} from 'vitest';
import * as T from 'three';
import {DesignerVfx, type VfxOverride} from './vfx-overrides';

const {load, create, contexts, decode} = vi.hoisted(() => ({load:vi.fn(),create:vi.fn(),contexts:vi.fn(),decode:vi.fn()}));
vi.mock('./assets',()=>({loadSkeleton:load,spineAssetUrl:(path:string)=>path}));
vi.mock('three',async importOriginal=>{
 const original=await importOriginal<typeof import('three')>();
 return {...original,WebGLRenderer:class {
  domElement=document.createElement('canvas');info={render:{calls:1}};
  dispose=vi.fn();forceContextLoss=vi.fn();setSize=vi.fn();setClearColor=vi.fn();render=vi.fn();
  constructor(){contexts(this);}
 }};
});
const spec:VfxOverride={format:'spine',skeleton:'effect.skeleton.json',atlas:'effect.atlas',width:256,height:512,scale:1,socket:'feet',cue:'hit'};
function pending<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(yes=>{resolve=yes;});return{promise,resolve};}
function data(){return{clips:new Map([['effect',{duration:1}]]),create};}
beforeEach(()=>{
 load.mockReset().mockResolvedValue(data());contexts.mockReset();decode.mockReset().mockResolvedValue(undefined);
 create.mockReset().mockImplementation(()=>Object.assign(new T.Group(),{dispose:vi.fn(),skeleton:{setToSetupPose:vi.fn()},state:{clearTracks:vi.fn(),setAnimation:vi.fn()},update:vi.fn()}));
 vi.stubGlobal('Image',class {src='';decode(){return decode();}});
});
afterEach(()=>vi.unstubAllGlobals());

it('does not allocate a renderer or players after an in-flight skeleton load is disposed',async()=>{
 const held=pending<ReturnType<typeof data>>();load.mockReturnValueOnce(held.promise);
 const fx=new DesignerVfx(),ready=fx.prepare({first:spec,second:spec});fx.dispose();held.resolve(data());await ready;
 expect(contexts).not.toHaveBeenCalled();expect(create).not.toHaveBeenCalled();expect(load).toHaveBeenCalledTimes(1);
 expect(fx.effects.size).toBe(0);expect(fx.stats).toEqual({draws:0,active:0,ready:0});
 await fx.prepare({later:spec});expect(load).toHaveBeenCalledTimes(1);
});

it('stops a disposed PNG preparation at the pending frame instead of decoding the remaining sequence',async()=>{
 const held=pending<void>();decode.mockReturnValueOnce(held.promise);
 const fx=new DesignerVfx(),ready=fx.prepare({first:{...spec,format:'sequence',fps:24,frames:['one.png','two.png','three.png']}});
 fx.dispose();held.resolve();await ready;
 expect(decode).toHaveBeenCalledTimes(1);expect(fx.effects.size).toBe(0);
 await fx.prepare({later:{...spec,format:'sequence',fps:24,frames:['later.png']}});expect(decode).toHaveBeenCalledTimes(1);
});

it('reuses prepared players, releases a replaced pool and keeps accepted effects when preparation fails',async()=>{
 const fx=new DesignerVfx();await fx.prepare({effect:spec});const first=fx.effects.get('effect')!,meshes=first.players.map(p=>p.mesh!);
 expect(create).toHaveBeenCalledTimes(8);expect(fx.emit('effect','hit',['a','b'],0)).toBe(true);
 const draw=vi.fn();fx.render(.5,draw);expect(draw).toHaveBeenCalledTimes(2);
 fx.render(1,draw);expect(fx.stats.active).toBe(0);expect(fx.emit('effect','hit','c',1)).toBe(true);expect(create).toHaveBeenCalledTimes(8);
 load.mockRejectedValueOnce(new Error('controlled missing atlas'));await fx.prepare({effect:spec});expect(fx.effects.get('effect')).toBe(first);expect(meshes[0]!.dispose).not.toHaveBeenCalled();
 await fx.prepare({effect:spec});expect(create).toHaveBeenCalledTimes(16);expect(contexts).toHaveBeenCalledOnce();
 for(const mesh of meshes)expect(mesh.dispose).toHaveBeenCalledOnce();
 const current=fx.effects.get('effect')!.players.map(p=>p.mesh!);fx.emit('effect','hit','d',2);fx.render(2.5,draw);fx.dispose();fx.dispose();
 for(const mesh of current)expect(mesh.dispose).toHaveBeenCalledOnce();
 const renderer=contexts.mock.calls[0]![0];expect(renderer.dispose).toHaveBeenCalledOnce();expect(renderer.forceContextLoss).toHaveBeenCalledOnce();
 expect(fx.effects.size).toBe(0);expect(fx.stats).toEqual({draws:0,active:0,ready:0});
});
