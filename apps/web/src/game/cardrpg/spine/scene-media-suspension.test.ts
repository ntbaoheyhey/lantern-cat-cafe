import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import * as T from 'three';
import type {SceneView} from '../../squad/turn3d/scene';
import type {SpineActor} from './assets';
import {SpineScene} from './scene';

const {load}=vi.hoisted(()=>({load:vi.fn()}));
vi.mock('./assets',()=>({loadSpineActor:load}));
vi.mock('../vfx-craft/drawn-poses',()=>({loadDrawnPoseSet:vi.fn().mockResolvedValue(undefined)}));
vi.mock('three',async original=>({...await original<typeof import('three')>(),WebGLRenderer:class{
 domElement=document.createElement('canvas');ratio=1;
 setPixelRatio(n:number){this.ratio=n;}getPixelRatio(){return this.ratio;}
 setClearColor(){}dispose(){}forceContextLoss(){}
}}));
vi.mock('./stage',()=>({PaintedStage:class{root=new T.Group();dispose(){}}}));
vi.mock('../battle-v3/motion-trails',()=>({MotionTrails:class{root=new T.Group();dispose(){}}}));
vi.mock('../battle-v3/focus',()=>({CasterFocus:class{root=new T.Group();dispose(){}},FocusBannerAnchor:class{}}));
vi.mock('../vfx-craft/encounter',()=>({isCraftOwner:()=>false,CraftEncounter:class{effects={};prepare(){return Promise.resolve();}dispose(){}}}));
vi.mock('./vfx',()=>({PaintedVfx:class{prepare(){return Promise.resolve();}dispose(){}clear(){}}}));
vi.mock('../battle-v3/battle-audio',()=>({BattleAudio:class{}}));
vi.mock('../battle-v3/numbers',()=>({BattleNumbers:class{dispose(){}}}));
vi.mock('../battle-v3/body-fx',()=>({BodyFx:class{dispose(){}}}));
vi.mock('../battle-v3/boss-phase',()=>({BossPhase:class{dispose(){}}}));
vi.mock('../battle-v3/weather',()=>({BattleWeather:class{dispose(){}}}));
vi.mock('../battle-v3/cinematic-player',()=>({CinematicPlayer:class{dispose(){}}}));
vi.mock('../battle-v3/post-fx',()=>({BattlePostFx:class{dispose(){}}}));

let hidden=false,nextFrame:FrameRequestCallback;
const scenes:SpineScene[]=[];
beforeEach(()=>{
 load.mockReset();hidden=false;
 vi.spyOn(document,'hidden','get').mockImplementation(()=>hidden);
 vi.stubGlobal('requestAnimationFrame',vi.fn((f:FrameRequestCallback)=>{nextFrame=f;return 1;}));
 vi.stubGlobal('cancelAnimationFrame',vi.fn());
 vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}});
 vi.stubGlobal('devicePixelRatio',1);
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({scale:vi.fn(),createRadialGradient:()=>({addColorStop:vi.fn()}),fillRect:vi.fn()} as never);
});
afterEach(()=>{for(const s of scenes.splice(0))s.dispose();vi.restoreAllMocks();vi.unstubAllGlobals();});
function prepared(){
 const setSuspended=vi.fn(),sample=vi.fn(),dispose=vi.fn();
 const actor={root:new T.Group(),clips:new Map(),designerIdle:true,designerMedia:{setSuspended},sample,dispose} as unknown as SpineActor;
 return{actor,setSuspended,sample,dispose};
}
function deferred(){let resolve!:(actor:SpineActor)=>void;const promise=new Promise<SpineActor>(yes=>{resolve=yes;});return{promise,resolve};}
function fixture(ids=['mochi']){
 let view={actors:ids.map(id=>({id,side:'enemy',cardRpg:{cardId:id}})),paused:false,suspended:false} as unknown as SceneView;
 const render=vi.spyOn(SpineScene.prototype,'render').mockImplementation(()=>{});
 const scene=new SpineScene(document.createElement('div'),()=>view,()=>{},()=>{},()=>{});scenes.push(scene);
 return{scene,render,get view(){return view;},change(patch:Partial<SceneView>,prepare=true){view={...view,...patch};if(prepare)scene.prepare(view);}};
}
it.each(['mochi','clover'])('stops retained prepared %s when prepare hides its battle, without sampling or disposing',async id=>{
 const a=prepared();load.mockResolvedValue(a.actor);const f=fixture([id]);await vi.waitFor(()=>expect(f.scene.ready).toBe(true));a.setSuspended.mockClear();
 f.change({suspended:true});expect(a.setSuspended).toHaveBeenLastCalledWith(true);expect(a.sample).not.toHaveBeenCalled();expect(a.dispose).not.toHaveBeenCalled();
});
it('pauses on visibilitychange without relying on another animation frame',async()=>{
 const a=prepared();load.mockResolvedValue(a.actor);const f=fixture();await vi.waitFor(()=>expect(f.scene.ready).toBe(true));a.setSuspended.mockClear();
 hidden=true;document.dispatchEvent(new Event('visibilitychange'));expect(a.setSuspended).toHaveBeenLastCalledWith(true);expect(f.render).not.toHaveBeenCalled();
 f.change({suspended:true});hidden=false;document.dispatchEvent(new Event('visibilitychange'));expect(a.setSuspended).toHaveBeenLastCalledWith(true);
});
it('takes beforeFrame suspension before returning and releases it before the next active draw',async()=>{
 const a=prepared();load.mockResolvedValue(a.actor);const f=fixture();await vi.waitFor(()=>expect(f.scene.ready).toBe(true));
 nextFrame(50);f.render.mockClear();
 f.scene.beforeFrame=()=>f.change({suspended:true},false);nextFrame(100);expect(a.setSuspended).toHaveBeenLastCalledWith(true);expect(f.render).not.toHaveBeenCalled();
 f.scene.beforeFrame=()=>f.change({suspended:false,paused:true},false);
 f.render.mockImplementation(()=>expect(a.setSuspended).toHaveBeenLastCalledWith(false));nextFrame(200);
 expect(f.render).toHaveBeenCalledOnce();expect(a.sample).not.toHaveBeenCalled();
});
it('releases visibility suspension while paused and invalidates one visible redraw',async()=>{
 const a=prepared();load.mockResolvedValue(a.actor);const f=fixture();await vi.waitFor(()=>expect(f.scene.ready).toBe(true));
 f.change({paused:true});nextFrame(100);f.render.mockClear();
 hidden=true;document.dispatchEvent(new Event('visibilitychange'));hidden=false;document.dispatchEvent(new Event('visibilitychange'));
 expect(a.setSuspended).toHaveBeenLastCalledWith(false);nextFrame(200);expect(f.render).toHaveBeenCalledOnce();expect(a.sample).not.toHaveBeenCalled();
});
it.each(['hidden','suspended'])('uses the latest %s state when an actor finishes loading',async state=>{
 const pending=deferred(),a=prepared();load.mockReturnValue(pending.promise);const f=fixture();
 if(state==='hidden')hidden=true;else f.change({suspended:true},false);
 pending.resolve(a.actor);await vi.waitFor(()=>expect(f.scene.ready).toBe(true));expect(a.setSuspended).toHaveBeenLastCalledWith(true);
 expect(f.scene.actors.get('mochi')?.actor).toBe(a.actor);expect(a.dispose).not.toHaveBeenCalled();
});
it('disposes a late request after removal without reviving its media',async()=>{
 const pending=deferred(),a=prepared();load.mockReturnValue(pending.promise);const f=fixture();f.change({actors:[]});pending.resolve(a.actor);
 await vi.waitFor(()=>expect(a.dispose).toHaveBeenCalledOnce());expect(a.setSuspended).not.toHaveBeenCalled();
});
it.each([{id:'mochi',prepared:false},{id:'clover',prepared:false},{id:'panko',prepared:true}])('leaves ordinary $id media-like hooks untouched (prepared=$prepared)',async({id,prepared:flag})=>{
 const a=prepared();Object.assign(a.actor,{designerIdle:flag});load.mockResolvedValue(a.actor);const f=fixture([id]);await vi.waitFor(()=>expect(f.scene.ready).toBe(true));
 f.change({suspended:true});hidden=true;document.dispatchEvent(new Event('visibilitychange'));nextFrame(100);hidden=false;f.change({suspended:false});
 expect(a.setSuspended).not.toHaveBeenCalled();
});
it('does not resume or sample media after scene disposal',async()=>{
 const a=prepared();load.mockResolvedValue(a.actor);const f=fixture();await vi.waitFor(()=>expect(f.scene.ready).toBe(true));f.scene.dispose();a.setSuspended.mockClear();
 hidden=true;document.dispatchEvent(new Event('visibilitychange'));hidden=false;document.dispatchEvent(new Event('visibilitychange'));nextFrame(100);f.change({suspended:false});
 expect(a.dispose).toHaveBeenCalledOnce();expect(a.setSuspended).not.toHaveBeenCalled();expect(a.sample).not.toHaveBeenCalled();
});
