import {act,cleanup,render} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {Group} from 'three';
import {VictoryCrew} from './VictoryCrew';

const {construct,load,loadDrawing,draw}=vi.hoisted(()=>({construct:vi.fn(),load:vi.fn(),loadDrawing:vi.fn(),draw:vi.fn()}));
vi.mock('three',async original=>({...await original<typeof import('three')>(),WebGLRenderer:class {
 domElement=document.createElement('canvas');render=vi.fn();setPixelRatio=vi.fn();getPixelRatio=()=>1;getContext=()=>({isContextLost:()=>false});dispose=vi.fn();forceContextLoss=vi.fn();
 setSize(w:number,h:number){this.domElement.width=w;this.domElement.height=h;}
 constructor(){construct(this);}
}}));
vi.mock('../spine/assets',()=>({loadSpineActor:load}));
vi.mock('../vfx-craft/encounter',()=>({isCraftOwner:()=>true}));
vi.mock('../vfx-craft/drawn-poses',()=>({loadDrawnPoseSet:loadDrawing,DrawnPoses:class {
 deform=vi.fn();constructor(actor:{mesh?:object}){draw(actor);if(!actor.mesh)throw Error('Drawing swaps require an accepted cut-out rig');}
}}));
vi.mock('../stage/core',()=>({unitCore:()=>({world:{x:0,y:0,width:100,height:100}})}));
vi.mock('../ui-v3/art-a6',()=>({artPropsA6:(id:string)=>({src:`/${id}.webp`})}));
const actor=(media=false)=>({root:new Group(),source:media?'media':'puppet',designerIdle:media,mesh:media?undefined:{},bounds:{x:0,y:0,width:100,height:100},sample:vi.fn(),duration:()=>1.4,setOrder:vi.fn(),dispose:vi.fn(),onMediaFrame:undefined as undefined|(()=>void)});
const cats=(...ids:string[])=>ids.map(id=>({id,name:id,alive:true}));
const flush=async()=>{await act(async()=>{await Promise.resolve();await Promise.resolve();});};
let frames:Map<number,FrameRequestCallback>,nextFrame:number;
const step=async(now=1000)=>{const callbacks=[...frames.values()];frames.clear();await act(async()=>{for(const callback of callbacks)callback(now);});};
const renderer=()=>construct.mock.calls.at(-1)![0] as {render:ReturnType<typeof vi.fn>};
beforeEach(()=>{
 frames=new Map();nextFrame=0;construct.mockReset();load.mockReset();loadDrawing.mockReset().mockResolvedValue({});draw.mockReset();
 vi.stubGlobal('requestAnimationFrame',vi.fn((callback:FrameRequestCallback)=>{frames.set(++nextFrame,callback);return nextFrame;}));
 vi.stubGlobal('cancelAnimationFrame',vi.fn((id:number)=>frames.delete(id)));
 vi.stubGlobal('matchMedia',vi.fn(()=>Object.assign(new EventTarget(),{matches:false})));vi.stubGlobal('devicePixelRatio',1);
 vi.stubGlobal('ResizeObserver',class {disconnect=vi.fn();observe=vi.fn();unobserve=vi.fn();});
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});

it.each(['mochi','clover'])('keeps prepared %s media in the victory scene and preserves the drawing fallback',async id=>{
 const video=actor(true),fallback=actor();load.mockImplementation(async(name:string)=>name===id?video:fallback);
 const view=render(<VictoryCrew cats={cats(id,'panko')} reduced/>);await flush();await step();
 const host=view.container.firstElementChild as HTMLElement;
 expect(host.dataset.ready).toBe('true');expect(host.dataset.loadError).toBeUndefined();expect(host.dataset.drawn).toBe('1');
 expect(loadDrawing.mock.calls).toEqual([['panko']]);expect(draw.mock.calls).toEqual([[fallback]]);expect(video.dispose).not.toHaveBeenCalled();
 view.unmount();expect(video.dispose).toHaveBeenCalledTimes(1);expect(fallback.dispose).toHaveBeenCalledTimes(1);
});

it('keeps media time continuous across the shorter victory gesture loop',async()=>{
 const video=actor(true),fallback=actor();load.mockImplementation(async(name:string)=>name==='mochi'?video:fallback);
 render(<VictoryCrew cats={cats('mochi','panko')} reduced={false}/>);await flush();await step(1000);await step(2600);
 const sample=video.sample.mock.calls.at(-1)!;
 expect(sample[2]).toBeCloseTo(.2);expect(sample[6]).toEqual({worldTime:1.6,paused:false,fixedTime:false,frozen:false});
 expect(fallback.sample.mock.calls.at(-1)).toHaveLength(6);
});

it('redraws a decoded reduced frame once, then remains idle and ignores late callbacks',async()=>{
 const video=actor(true);load.mockResolvedValue(video);
 const view=render(<VictoryCrew cats={cats('clover')} reduced/>);await flush();await step();
 expect(frames.size).toBe(0);expect(video.sample.mock.calls.at(-1)![6]).toEqual({worldTime:.75,paused:true,fixedTime:true,frozen:false});
 const before=renderer().render.mock.calls.length,decoded=video.onMediaFrame!;expect(decoded).toBeTypeOf('function');
 decoded();decoded();expect(frames.size).toBe(1);await step(1500);expect(renderer().render.mock.calls.length).toBe(before+1);expect(frames.size).toBe(0);
 view.unmount();decoded();expect(frames.size).toBe(0);
});

it('retains the original drawing path when commissioned media is unavailable',async()=>{
 const fallback=actor();load.mockResolvedValue(fallback);
 const view=render(<VictoryCrew cats={cats('mochi')} reduced/>);await flush();await step();
 expect((view.container.firstElementChild as HTMLElement).dataset.ready).toBe('true');expect(loadDrawing).toHaveBeenCalledWith('mochi');
 expect(fallback.onMediaFrame).toBeUndefined();expect(fallback.sample.mock.calls.at(-1)).toHaveLength(6);
});
