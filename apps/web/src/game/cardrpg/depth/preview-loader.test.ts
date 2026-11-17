import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import type {DepthModel} from './model';
import {PreviewRuntime} from './preview-runtime';

const deferred=vi.hoisted(()=>({load:vi.fn(),created:vi.fn(),dispose:vi.fn(),invalidate:vi.fn()}));
vi.mock('./preview-loader',()=>({loadPreviewScene:deferred.load,loadPreviewModel:vi.fn()}));
class Scene {
 ready=false;
 constructor(){deferred.created();}
 dispose=deferred.dispose;
 invalidate=deferred.invalidate;
}
let resolveScene:(value:unknown)=>void,rejectScene:(error:Error)=>void;
const runtimes:PreviewRuntime[]=[];
const options=()=>({visible:true,rotating:false,angle:0,fixture:{battle:{} as never,plan:null},view:{} as never});
const create=()=>{
 const runtime=new PreviewRuntime({offline:true,showBattle:false} as DepthModel);runtimes.push(runtime);return runtime;
};
beforeEach(()=>{
 vi.useFakeTimers();vi.clearAllMocks();
 vi.stubGlobal('requestAnimationFrame',(callback:FrameRequestCallback)=>window.setTimeout(()=>callback(performance.now()),16));
 vi.stubGlobal('cancelAnimationFrame',(id:number)=>window.clearTimeout(id));
 deferred.load.mockImplementation(()=>new Promise((resolve,reject)=>{resolveScene=resolve;rejectScene=reject;}));
});
afterEach(()=>{runtimes.splice(0).forEach(runtime=>runtime.dispose());vi.useRealTimers();vi.unstubAllGlobals();});

it('does not load a miniature until attached and never creates it after disposal during loading',async()=>{
 const runtime=create();expect(deferred.load).not.toHaveBeenCalled();
 runtime.attach(document.createElement('div'),options,vi.fn());
 await vi.advanceTimersByTimeAsync(100);expect(deferred.load).toHaveBeenCalledOnce();
 runtime.dispose();resolveScene(Scene);await vi.advanceTimersByTimeAsync(100);
 expect(deferred.created).not.toHaveBeenCalled();expect(window.__depthPreviewScene).toBeUndefined();expect(vi.getTimerCount()).toBe(0);
});
it('ignores a detached slot and constructs exactly one scene for the current slot',async()=>{
 const runtime=create(),first=document.createElement('div'),second=document.createElement('div');
 const detach=runtime.attach(first,options,vi.fn());await vi.advanceTimersByTimeAsync(100);
 const oldResolve=resolveScene;detach();
 runtime.attach(second,options,vi.fn());await vi.advanceTimersByTimeAsync(100);
 oldResolve(Scene);await vi.advanceTimersByTimeAsync(1);expect(deferred.created).not.toHaveBeenCalled();
 resolveScene(Scene);await vi.advanceTimersByTimeAsync(100);expect(deferred.created).toHaveBeenCalledOnce();
 expect(first.childElementCount).toBe(0);expect(second.childElementCount).toBe(1);
 runtime.dispose();expect(deferred.dispose).toHaveBeenCalledOnce();expect(vi.getTimerCount()).toBe(0);
});
it('leaves the portrait available after a load failure and retries when opened again',async()=>{
 const runtime=create(),status=vi.fn(),detach=runtime.attach(document.createElement('div'),options,status);
 await vi.advanceTimersByTimeAsync(100);rejectScene(Error('offline'));await vi.advanceTimersByTimeAsync(1);
 expect(status).toHaveBeenLastCalledWith('Preview unavailable. Error: offline');expect(deferred.created).not.toHaveBeenCalled();
 detach();runtime.attach(document.createElement('div'),options,status);await vi.advanceTimersByTimeAsync(100);
 resolveScene(Scene);await vi.advanceTimersByTimeAsync(100);expect(deferred.created).toHaveBeenCalledOnce();
});
