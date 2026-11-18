import {StrictMode} from 'react';
import {act,cleanup,render} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {Group} from 'three';
import {VictoryCrew} from './VictoryCrew';

const {construct,load}=vi.hoisted(()=>({construct:vi.fn(),load:vi.fn()}));
vi.mock('three',async original=>({...await original<typeof import('three')>(),WebGLRenderer:class {
 domElement=document.createElement('canvas');setPixelRatio=vi.fn();dispose=vi.fn();forceContextLoss=vi.fn();
 constructor(){construct(this);}
}}));
vi.mock('../spine/assets',()=>({loadSpineActor:load}));
vi.mock('../vfx-craft/encounter',()=>({isCraftOwner:()=>true}));
vi.mock('../vfx-craft/drawn-poses',()=>({loadDrawnPoseSet:async()=>({}),DrawnPoses:class {deform=vi.fn();}}));
vi.mock('../stage/core',()=>({unitCore:vi.fn()}));
vi.mock('../ui-v3/art-a6',()=>({artPropsA6:(id:string)=>({src:`/${id}.webp`})}));
const cats=['mochi','soot','clover','panko'].map(id=>({id,name:id,alive:true}));
const actor=()=>({root:new Group(),source:'native',dispose:vi.fn()});
function pending<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(yes=>{resolve=yes;});return{promise,resolve};}
const flush=async()=>{await act(async()=>{await Promise.resolve();});};
beforeEach(()=>{
 construct.mockReset();load.mockReset().mockImplementation(async()=>actor());
 vi.stubGlobal('requestAnimationFrame',vi.fn(()=>1));vi.stubGlobal('cancelAnimationFrame',vi.fn());
 vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
 vi.stubGlobal('ResizeObserver',class {observe=vi.fn();disconnect=vi.fn();});vi.stubGlobal('devicePixelRatio',1);
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});

it.each([false,true])('keeps original fallback available after a failed renderer restart from reduced=%s',async reduced=>{
 const view=render(<VictoryCrew cats={cats} reduced={reduced}/>);await flush();
 const host=view.container.firstElementChild as HTMLElement,oldCanvas=host.querySelector('canvas');
 expect(host.dataset.ready).toBe('true');expect(host.dataset.drawn).toBe('4');expect(oldCanvas).not.toBeNull();
 construct.mockImplementationOnce(()=>{throw Error('Context unavailable');});
 view.rerender(<VictoryCrew cats={cats} reduced={!reduced}/>);await flush();
 expect(view.container.firstElementChild).toBe(host);expect(oldCanvas!.isConnected).toBe(false);
 expect(host.querySelector('canvas')).toBeNull();expect(host.dataset.ready).not.toBe('true');expect(host.dataset.drawn).toBeUndefined();
 expect(host.querySelectorAll('.b3-victory-fallback img')).toHaveLength(4);
 view.rerender(<VictoryCrew cats={cats} reduced={reduced}/>);await flush();
 expect(host.querySelector('canvas')).not.toBeNull();expect(host.dataset.ready).toBe('true');expect(host.dataset.drawn).toBe('4');
});

it('keeps fallback available on a fresh failed mount',async()=>{
 construct.mockImplementation(()=>{throw Error('Context unavailable');});
 const view=render(<VictoryCrew cats={cats} reduced/>);await flush();
 const host=view.container.firstElementChild as HTMLElement;
 expect(host.querySelector('canvas')).toBeNull();expect(host.dataset.ready).not.toBe('true');expect(load).not.toHaveBeenCalled();
 expect(host.querySelectorAll('.b3-victory-fallback img')).toHaveLength(4);
});

it('ignores and disposes old pending actors after a failed restart',async()=>{
 const deferred=cats.map(()=>pending<ReturnType<typeof actor>>());let i=0;load.mockImplementation(()=>deferred[i++]!.promise);
 const view=render(<VictoryCrew cats={cats} reduced/>);await flush();
 construct.mockImplementationOnce(()=>{throw Error('Context unavailable');});view.rerender(<VictoryCrew cats={cats} reduced={false}/>);
 const oldActors=cats.map(actor);await act(async()=>{deferred.forEach((d,i)=>d.resolve(oldActors[i]!));});
 const host=view.container.firstElementChild as HTMLElement;
 expect(host.dataset.ready).not.toBe('true');expect(host.querySelector('canvas')).toBeNull();
 for(const old of oldActors)expect(old.dispose).toHaveBeenCalledTimes(1);
});

it('retains fallback while replacement assets reject, then clears the old error on constructor failure',async()=>{
 const view=render(<VictoryCrew cats={cats} reduced/>);await flush();
 load.mockRejectedValue(Error('Asset unavailable'));view.rerender(<VictoryCrew cats={cats} reduced={false}/>);await flush();
 const host=view.container.firstElementChild as HTMLElement;
 expect(host.dataset.ready).not.toBe('true');expect(host.dataset.loadError).toBe('true');expect(host.dataset.drawn).toBeUndefined();
 construct.mockImplementationOnce(()=>{throw Error('Context unavailable');});view.rerender(<VictoryCrew cats={cats} reduced/>);await flush();
 expect(host.dataset.ready).not.toBe('true');expect(host.dataset.loadError).toBeUndefined();expect(host.querySelector('canvas')).toBeNull();
});

it('disposes rehearsal mounts and retains one ready canvas in StrictMode',async()=>{
 const created:ReturnType<typeof actor>[]=[];load.mockImplementation(async()=>{const a=actor();created.push(a);return a;});
 const view=render(<StrictMode><VictoryCrew cats={cats} reduced/></StrictMode>);await flush();
 const host=view.container.firstElementChild as HTMLElement;
 expect(host.dataset.ready).toBe('true');expect(host.dataset.drawn).toBe('4');expect(host.querySelectorAll('canvas')).toHaveLength(1);
 expect(created).toHaveLength(8);created.slice(0,4).forEach(a=>expect(a.dispose).toHaveBeenCalledTimes(1));
 view.unmount();created.forEach(a=>expect(a.dispose).toHaveBeenCalledTimes(1));
});
