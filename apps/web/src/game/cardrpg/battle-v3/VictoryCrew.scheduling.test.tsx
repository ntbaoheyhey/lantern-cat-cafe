import {act,cleanup,render} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {Group} from 'three';
import {VictoryCrew} from './VictoryCrew';

const {construct,load}=vi.hoisted(()=>({construct:vi.fn(),load:vi.fn()}));
vi.mock('three',async original=>({...await original<typeof import('three')>(),WebGLRenderer:class {
 domElement=document.createElement('canvas');render=vi.fn();setPixelRatio=vi.fn();getPixelRatio=()=>1;getContext=()=>({isContextLost:()=>false});dispose=vi.fn();forceContextLoss=vi.fn();
 setSize(w:number,h:number){this.domElement.width=w;this.domElement.height=h;}
 constructor(){construct(this);}
}}));
vi.mock('../spine/assets',()=>({loadSpineActor:load}));
vi.mock('../vfx-craft/encounter',()=>({isCraftOwner:()=>true}));
vi.mock('../vfx-craft/drawn-poses',()=>({loadDrawnPoseSet:async()=>({}),DrawnPoses:class {deform=vi.fn();}}));
vi.mock('../stage/core',()=>({unitCore:()=>({world:{x:0,y:0,width:100,height:100}})}));
vi.mock('../ui-v3/art-a6',()=>({artPropsA6:(id:string)=>({src:`/${id}.webp`})}));
const cats=['mochi','soot','clover','panko'].map(id=>({id,name:id,alive:true}));
const actor=()=>({root:new Group(),source:'native',bounds:{x:0,y:0,width:100,height:100},sample:vi.fn(),duration:()=>1,setOrder:vi.fn(),dispose:vi.fn()});
const flush=async()=>{await act(async()=>{await Promise.resolve();});};
let frames:Map<number,FrameRequestCallback>,nextFrame:number,media:EventTarget&{matches:boolean},observers:Array<{notify:()=>void;disconnect:ReturnType<typeof vi.fn>}>;
const step=async(now=1000)=>{const callbacks=[...frames.values()];frames.clear();await act(async()=>{for(const callback of callbacks)callback(now);});};
const renderer=()=>construct.mock.calls.at(-1)![0] as {render:ReturnType<typeof vi.fn>;domElement:HTMLCanvasElement};
beforeEach(()=>{
 frames=new Map();nextFrame=0;observers=[];media=Object.assign(new EventTarget(),{matches:false});
 construct.mockReset();load.mockReset().mockImplementation(async()=>actor());
 vi.stubGlobal('requestAnimationFrame',vi.fn((callback:FrameRequestCallback)=>{frames.set(++nextFrame,callback);return nextFrame;}));
 vi.stubGlobal('cancelAnimationFrame',vi.fn((id:number)=>frames.delete(id)));
 vi.stubGlobal('matchMedia',vi.fn((query:string)=>query.includes('prefers-reduced-motion')?media:Object.assign(new EventTarget(),{matches:true})));vi.stubGlobal('devicePixelRatio',1);
 vi.stubGlobal('ResizeObserver',class {
  disconnect=vi.fn();observe=vi.fn();unobserve=vi.fn();notify:()=>void;
  constructor(callback:()=>void){this.notify=()=>callback();observers.push(this);}
 });
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});

it('holds a loaded reduced scene without scheduling redundant frames',async()=>{
 render(<VictoryCrew cats={cats} reduced/>);await flush();await step();
 expect(renderer().render).toHaveBeenCalledTimes(1);expect(frames.size).toBe(0);
 await step(2000);expect(renderer().render).toHaveBeenCalledTimes(1);
});

it('draws a late actor after the initial reduced frame and then settles again',async()=>{
 let resolve!:(value:ReturnType<typeof actor>)=>void;load.mockImplementationOnce(()=>new Promise(done=>{resolve=done;}));
 const view=render(<VictoryCrew cats={cats} reduced/>);await flush();await step();
 expect(renderer().render).toHaveBeenCalledTimes(1);expect(frames.size).toBe(0);
 await act(async()=>{resolve(actor());});expect(frames.size).toBe(1);await step(2000);
 expect(renderer().render).toHaveBeenCalledTimes(2);expect(frames.size).toBe(0);
 expect((view.container.firstElementChild as HTMLElement).dataset.ready).toBe('true');
});

it('updates the reduced canvas after a container resize and coalesces resize notifications',async()=>{
 const view=render(<VictoryCrew cats={cats} reduced/>);await flush();await step();
 const host=view.container.firstElementChild as HTMLElement;
 Object.defineProperties(host,{clientWidth:{value:320,configurable:true},clientHeight:{value:190,configurable:true}});
 for(let i=0;i<3;i++)for(const observer of observers)observer.notify();expect(frames.size).toBe(1);await step(2000);
 expect(renderer().domElement.width).toBe(320);expect(renderer().domElement.height).toBe(190);
 expect(renderer().render).toHaveBeenCalledTimes(2);expect(frames.size).toBe(0);
});

it('keeps normal animation running and responds to OS motion changes without a prop change',async()=>{
 render(<VictoryCrew cats={cats} reduced={false}/>);await flush();await step();await step(1100);
 expect(renderer().render).toHaveBeenCalledTimes(2);expect(frames.size).toBe(1);
 media.matches=true;media.dispatchEvent(new Event('change'));await step(1200);expect(frames.size).toBe(0);
 media.matches=false;media.dispatchEvent(new Event('change'));expect(frames.size).toBe(1);await step(1300);
 expect(renderer().render).toHaveBeenCalledTimes(4);expect(frames.size).toBe(1);
});

it('redraws a static scene after WebGL context restoration',async()=>{
 render(<VictoryCrew cats={cats} reduced/>);await flush();await step();
 renderer().domElement.dispatchEvent(new Event('webglcontextrestored'));expect(frames.size).toBe(1);await step(2000);
 expect(renderer().render).toHaveBeenCalledTimes(2);expect(frames.size).toBe(0);
});

it('does not render or schedule after unmount even if an old callback arrives',async()=>{
 const view=render(<VictoryCrew cats={cats} reduced/>);await flush();const draw=[...frames.values()][0]!;
 const old=renderer();view.unmount();expect(frames.size).toBe(0);
 draw(1000);for(const observer of observers)observer.notify();media.dispatchEvent(new Event('change'));old.domElement.dispatchEvent(new Event('webglcontextrestored'));
 expect(old.render).not.toHaveBeenCalled();expect(frames.size).toBe(0);for(const observer of observers)expect(observer.disconnect).toHaveBeenCalledTimes(1);
});
