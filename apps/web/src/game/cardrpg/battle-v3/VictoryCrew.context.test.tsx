import {act,cleanup,render} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {Group} from 'three';
import {VictoryCrew} from './VictoryCrew';

const {construct,load}=vi.hoisted(()=>({construct:vi.fn(),load:vi.fn()}));
vi.mock('three',async original=>({...await original<typeof import('three')>(),WebGLRenderer:class {
 domElement=document.createElement('canvas');lost=false;ratio=1;width=1;height=1;
 render=vi.fn();dispose=vi.fn();forceContextLoss=vi.fn();
 getContext=()=>({isContextLost:()=>this.lost});getPixelRatio=()=>this.ratio;
 setSize(w:number,h:number){this.width=w;this.height=h;this.domElement.width=Math.floor(w*this.ratio);this.domElement.height=Math.floor(h*this.ratio);}
 setPixelRatio(ratio:number){this.ratio=ratio;this.setSize(this.width,this.height);}
 constructor(){construct(this);}
}}));
vi.mock('../spine/assets',()=>({loadSpineActor:load}));
vi.mock('../vfx-craft/encounter',()=>({isCraftOwner:()=>true}));
vi.mock('../vfx-craft/drawn-poses',()=>({loadDrawnPoseSet:async()=>({}),DrawnPoses:class {deform=vi.fn();}}));
vi.mock('../stage/core',()=>({unitCore:()=>({world:{x:0,y:0,width:100,height:100}})}));
vi.mock('../ui-v3/art-a6',()=>({artPropsA6:(id:string)=>({src:`/${id}.webp`})}));
const cats=['mochi','soot','clover','panko'].map(id=>({id,name:id,alive:true}));
const actor=()=>({root:new Group(),source:'native',bounds:{x:0,y:0,width:100,height:100},sample:vi.fn(),duration:()=>1,setOrder:vi.fn(),dispose:vi.fn()});
type Renderer={domElement:HTMLCanvasElement;lost:boolean;render:ReturnType<typeof vi.fn>;dispose:ReturnType<typeof vi.fn>;getPixelRatio:()=>number};
let frames:Map<number,FrameRequestCallback>,nextFrame:number,media:EventTarget&{matches:boolean},queries:EventTarget[],resize:Array<()=>void>;
const renderer=()=>construct.mock.calls.at(-1)![0] as Renderer;
const flush=async()=>{await act(async()=>{await Promise.resolve();});};
const step=async(now=1000)=>{const callbacks=[...frames.values()];frames.clear();await act(async()=>{callbacks.forEach(callback=>callback(now));});};
const loss=(r=renderer())=>{r.lost=true;const event=new Event('webglcontextlost',{cancelable:true});r.domElement.dispatchEvent(event);return event;};
const restore=(r=renderer())=>{r.lost=false;r.domElement.dispatchEvent(new Event('webglcontextrestored'));};
const mount=async(reduced=false)=>{const view=render(<VictoryCrew cats={cats} reduced={reduced}/>),host=view.container.firstElementChild as HTMLElement;
 Object.defineProperties(host,{clientWidth:{value:200,configurable:true},clientHeight:{value:120,configurable:true}});await flush();await step();return{view,host};};
beforeEach(()=>{
 frames=new Map();nextFrame=0;queries=[];resize=[];media=Object.assign(new EventTarget(),{matches:false});
 construct.mockReset();load.mockReset().mockImplementation(async()=>actor());
 vi.stubGlobal('requestAnimationFrame',vi.fn((callback:FrameRequestCallback)=>{frames.set(++nextFrame,callback);return nextFrame;}));
 vi.stubGlobal('cancelAnimationFrame',vi.fn((id:number)=>frames.delete(id)));
 vi.stubGlobal('devicePixelRatio',1);vi.stubGlobal('matchMedia',vi.fn((query:string)=>{if(query.includes('prefers-reduced-motion'))return media;const target=new EventTarget();queries.push(target);return target;}));
 vi.stubGlobal('ResizeObserver',class {disconnect=vi.fn();observe=vi.fn();constructor(callback:()=>void){resize.push(callback);}});
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});

it('exposes the fallback during normal loss and restores readiness only after a draw',async()=>{
 const {host}=await mount(),r=renderer(),oldFrame=[...frames.values()][0]!;expect(host.dataset.ready).toBe('true');
 expect(loss().defaultPrevented).toBe(true);expect(host.dataset.ready).toBe('false');expect(r.domElement.style.visibility).toBe('hidden');expect(frames.size).toBe(0);
 oldFrame(1200);expect(r.render).toHaveBeenCalledTimes(1);expect(frames.size).toBe(0);
 restore();expect(host.dataset.ready).toBe('false');expect(r.domElement.style.visibility).toBe('hidden');expect(frames.size).toBe(1);await step(1300);
 expect(host.dataset.ready).toBe('true');expect(r.domElement.style.visibility).toBe('');expect(r.render).toHaveBeenCalledTimes(2);expect(frames.size).toBe(1);
});

it('keeps reduced loss idle through resize, density and motion notifications',async()=>{
 const {host}=await mount(true),r=renderer();loss();
 Object.defineProperties(host,{clientWidth:{value:320,configurable:true},clientHeight:{value:180,configurable:true}});
 vi.stubGlobal('devicePixelRatio',2);queries.at(-1)!.dispatchEvent(new Event('change'));
 resize.forEach(callback=>callback());media.dispatchEvent(new Event('change'));
 expect(frames.size).toBe(0);expect(r.render).toHaveBeenCalledTimes(1);expect(host.dataset.ready).toBe('false');
 restore();restore();expect(frames.size).toBe(1);await step(2000);
 expect(r.getPixelRatio()).toBe(1.5);expect(r.domElement.width).toBe(480);expect(r.domElement.height).toBe(270);
 expect(host.dataset.ready).toBe('true');expect(r.render).toHaveBeenCalledTimes(2);expect(frames.size).toBe(0);
});

it('does not hide fallback when a pending actor completes during loss',async()=>{
 let resolve!:(value:ReturnType<typeof actor>)=>void;load.mockImplementationOnce(()=>new Promise(done=>{resolve=done;}));
 const {host}=await mount(true);expect(host.dataset.ready).toBe('false');loss();
 await act(async()=>resolve(actor()));expect(host.dataset.ready).toBe('false');expect(frames.size).toBe(0);
 restore();expect(host.dataset.ready).toBe('false');await step(2000);expect(host.dataset.ready).toBe('true');expect(frames.size).toBe(0);
});

it('handles another loss before the queued restored frame',async()=>{
 const {host}=await mount(true),r=renderer();loss();restore();const queued=[...frames.values()][0]!;
 loss();queued(1800);expect(host.dataset.ready).toBe('false');expect(r.render).toHaveBeenCalledTimes(1);expect(frames.size).toBe(0);
 restore();await step(2000);expect(host.dataset.ready).toBe('true');expect(r.render).toHaveBeenCalledTimes(2);
});

it('retains fallback if the GPU is lost again inside the restoration render',async()=>{
 const {host}=await mount(true),r=renderer();loss();restore();r.render.mockImplementationOnce(()=>{r.lost=true;});
 await step(2000);expect(host.dataset.ready).toBe('false');expect(r.domElement.style.visibility).toBe('hidden');loss();restore();await step(2100);expect(host.dataset.ready).toBe('true');expect(r.domElement.style.visibility).toBe('');
});

it('ignores queued restoration and removed event listeners after unmount',async()=>{
 const {view,host}=await mount(true),r=renderer();loss();restore();const queued=[...frames.values()][0]!;view.unmount();
 const ready=host.dataset.ready;queued(2000);loss(r);restore(r);resize.forEach(callback=>callback());media.dispatchEvent(new Event('change'));
 expect(frames.size).toBe(0);expect(r.render).toHaveBeenCalledTimes(1);expect(host.dataset.ready).toBe(ready);expect(r.domElement.isConnected).toBe(false);expect(r.dispose).toHaveBeenCalledOnce();
});

it('starts a fresh renderer when motion props change during loss',async()=>{
 const {view,host}=await mount(),old=renderer();loss();view.rerender(<VictoryCrew cats={cats} reduced/>);await flush();await step(2000);
 expect(renderer()).not.toBe(old);expect(old.domElement.isConnected).toBe(false);expect(host.dataset.ready).toBe('true');
 loss(old);restore(old);expect(frames.size).toBe(0);expect(host.dataset.ready).toBe('true');
});

it('disposes a late actor after unmount while the context is lost',async()=>{
 let resolve!:(value:ReturnType<typeof actor>)=>void;load.mockImplementationOnce(()=>new Promise(done=>{resolve=done;}));
 const {view}=await mount(true);loss();view.unmount();const late=actor();await act(async()=>resolve(late));
 expect(late.dispose).toHaveBeenCalledOnce();expect(frames.size).toBe(0);
});

it('honors the current OS motion preference after restoration',async()=>{
 await mount();loss();media.matches=true;media.dispatchEvent(new Event('change'));restore();await step(2000);expect(frames.size).toBe(0);
 loss();media.matches=false;media.dispatchEvent(new Event('change'));restore();await step(2100);expect(frames.size).toBe(1);
});
