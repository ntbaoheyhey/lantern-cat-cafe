import {act,cleanup,render} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {Group} from 'three';
import {VictoryCrew} from './VictoryCrew';
const {construct,load}=vi.hoisted(()=>({construct:vi.fn(),load:vi.fn()}));
vi.mock('three',async original=>({...await original<typeof import('three')>(),WebGLRenderer:class {
 domElement=document.createElement('canvas');ratio=1;width=1;height=1;
 render=vi.fn();dispose=vi.fn();forceContextLoss=vi.fn();
 setSize=vi.fn((w:number,h:number)=>{this.width=w;this.height=h;this.domElement.width=Math.floor(w*this.ratio);this.domElement.height=Math.floor(h*this.ratio);});
 setPixelRatio=vi.fn((ratio:number)=>{this.ratio=ratio;this.setSize(this.width,this.height);});
 getPixelRatio=()=>this.ratio;
 constructor(){construct(this);}
}}));
vi.mock('../spine/assets',()=>({loadSpineActor:load}));
vi.mock('../vfx-craft/encounter',()=>({isCraftOwner:()=>true}));
vi.mock('../vfx-craft/drawn-poses',()=>({loadDrawnPoseSet:async()=>({}),DrawnPoses:class {deform=vi.fn();}}));
vi.mock('../stage/core',()=>({unitCore:()=>({world:{x:0,y:0,width:100,height:100}})}));
vi.mock('../ui-v3/art-a6',()=>({artPropsA6:(id:string)=>({src:`/${id}.webp`})}));
const cats=['mochi','soot','clover','panko'].map(id=>({id,name:id,alive:true}));
const actor=()=>({root:new Group(),source:'native',bounds:{x:0,y:0,width:100,height:100},sample:vi.fn(),duration:()=>1,setOrder:vi.fn(),dispose:vi.fn()});
let frames:Map<number,FrameRequestCallback>,nextFrame:number,queries:Array<EventTarget&{media:string;matches:boolean}>,resize:Array<()=>void>;
const renderer=()=>construct.mock.calls.at(-1)![0] as {domElement:HTMLCanvasElement;render:ReturnType<typeof vi.fn>;setPixelRatio:ReturnType<typeof vi.fn>;setSize:ReturnType<typeof vi.fn>;getPixelRatio:()=>number};
const resolution=()=>queries.filter(q=>q.media.startsWith('(resolution:')).at(-1)!;
const step=async(now=1000)=>{const callbacks=[...frames.values()];frames.clear();await act(async()=>{callbacks.forEach(callback=>callback(now));});};
const setDimensions=(host:Element,width:number,height:number)=>Object.defineProperties(host,{clientWidth:{value:width,configurable:true},clientHeight:{value:height,configurable:true}});
const mount=async(reduced=true)=>{const view=render(<VictoryCrew cats={cats} reduced={reduced}/>);setDimensions(view.container.firstElementChild!,201,121);await act(async()=>{await Promise.resolve();});await step();return view;};
beforeEach(()=>{
 frames=new Map();nextFrame=0;queries=[];resize=[];construct.mockReset();load.mockReset().mockImplementation(async()=>actor());
 vi.stubGlobal('devicePixelRatio',1);
 vi.stubGlobal('requestAnimationFrame',vi.fn((callback:FrameRequestCallback)=>{frames.set(++nextFrame,callback);return nextFrame;}));
 vi.stubGlobal('cancelAnimationFrame',vi.fn((id:number)=>frames.delete(id)));
 vi.stubGlobal('matchMedia',vi.fn((media:string)=>{const query=Object.assign(new EventTarget(),{media,matches:false});vi.spyOn(query,'addEventListener');vi.spyOn(query,'removeEventListener');queries.push(query);return query;}));
 vi.stubGlobal('ResizeObserver',class {observe=vi.fn();disconnect=vi.fn();constructor(callback:()=>void){resize.push(callback);}});
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});

it('does not reallocate buffers during unchanged normal frames',async()=>{
 await mount(false);const r=renderer(),sizes=r.setSize.mock.calls.length;
 await step(1100);await step(1200);expect(r.render).toHaveBeenCalledTimes(3);
 expect(r.setPixelRatio).toHaveBeenCalledTimes(1);expect(r.setSize).toHaveBeenCalledTimes(sizes);
});
it('updates a running victory at the existing cap without changing CSS geometry',async()=>{
 const view=await mount(false);vi.stubGlobal('devicePixelRatio',2);await step(1100);
 const r=renderer();expect(r.getPixelRatio()).toBe(1.5);expect(r.domElement.width).toBe(301);expect(r.domElement.height).toBe(181);
 expect(view.container.firstElementChild!.clientWidth).toBe(201);expect(r.setPixelRatio).toHaveBeenCalledTimes(2);
 await step(1200);expect(r.setPixelRatio).toHaveBeenCalledTimes(2);
});
it('coalesces density notifications into one reduced draw then becomes idle',async()=>{
 await mount();expect(frames.size).toBe(0);vi.stubGlobal('devicePixelRatio',2);
 for(let i=0;i<3;i++)resolution().dispatchEvent(new Event('change'));
 expect(frames.size).toBe(1);await step(1100);expect(renderer().render).toHaveBeenCalledTimes(2);
 expect(renderer().getPixelRatio()).toBe(1.5);expect(frames.size).toBe(0);await step(1200);expect(renderer().render).toHaveBeenCalledTimes(2);
});
it('rearms the raw density query without redrawing when the effective cap is unchanged',async()=>{
 vi.stubGlobal('devicePixelRatio',2);await mount();const old=resolution();
 vi.stubGlobal('devicePixelRatio',1.5);old.dispatchEvent(new Event('change'));
 expect(resolution().media).toBe('(resolution: 1.5dppx)');expect(old.removeEventListener).toHaveBeenCalledTimes(1);expect(frames.size).toBe(0);
 vi.stubGlobal('devicePixelRatio',1);old.dispatchEvent(new Event('change'));expect(frames.size).toBe(0);
 resolution().dispatchEvent(new Event('change'));await step(1100);expect(renderer().getPixelRatio()).toBe(1);expect(renderer().render).toHaveBeenCalledTimes(2);
});
it('removes the active density listener and ignores queued work after unmount',async()=>{
 const view=await mount(),old=resolution(),callback=vi.mocked(old.addEventListener).mock.calls[0]![1] as EventListener;
 vi.stubGlobal('devicePixelRatio',2);old.dispatchEvent(new Event('change'));const draw=[...frames.values()][0]!,active=resolution(),r=renderer();
 view.unmount();expect(active.removeEventListener).toHaveBeenCalledTimes(1);expect(frames.size).toBe(0);
 callback(new Event('change'));draw(1100);active.dispatchEvent(new Event('change'));
 expect(r.render).toHaveBeenCalledTimes(1);expect(r.setPixelRatio).toHaveBeenCalledTimes(1);expect(frames.size).toBe(0);
});
it('combines a CSS resize and density change into one correctly sized draw',async()=>{
 const view=await mount();setDimensions(view.container.firstElementChild!,270,164);vi.stubGlobal('devicePixelRatio',1.5);
 resize.forEach(notify=>notify());resolution().dispatchEvent(new Event('change'));expect(frames.size).toBe(1);await step(1100);
 expect(renderer().domElement.width).toBe(405);expect(renderer().domElement.height).toBe(246);expect(renderer().render).toHaveBeenCalledTimes(2);expect(frames.size).toBe(0);
});
it('uses the original 1x fallback when density becomes unavailable',async()=>{
 vi.stubGlobal('devicePixelRatio',2);await mount();vi.stubGlobal('devicePixelRatio',0);resolution().dispatchEvent(new Event('change'));await step(1100);
 expect(resolution().media).toBe('(resolution: 1dppx)');expect(renderer().getPixelRatio()).toBe(1);expect(renderer().domElement.width).toBe(201);expect(frames.size).toBe(0);
});
