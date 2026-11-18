import {afterEach,expect,it,vi} from 'vitest';
import {SpineScene} from './scene';
import {PAINT} from './style';

afterEach(()=>vi.unstubAllGlobals());
function fixture(initial=1){
 let ratio=initial;
 const renderer={getPixelRatio:vi.fn(()=>ratio),setPixelRatio:vi.fn((next:number)=>{ratio=next;}),setSize:vi.fn()};
 const postFx={resize:vi.fn()};
 const scene=Object.assign(Object.create(SpineScene.prototype),{disposed:false,width:1280,height:720,worldWidth:PAINT.worldHeight*1280/720,renderer,postFx}) as {
  disposed:boolean;width:number;height:number;worldWidth:number;resizeViewport:(width:number,height:number)=>void;render:(view:never)=>void;
 };
 vi.stubGlobal('devicePixelRatio',initial);
 return{scene,renderer,postFx};
}
it('retains buffers when density and CSS dimensions are unchanged',()=>{
 const {scene,renderer,postFx}=fixture();for(let i=0;i<12;i++)scene.resizeViewport(1280,720);
 expect(renderer.setPixelRatio).not.toHaveBeenCalled();expect(renderer.setSize).not.toHaveBeenCalled();expect(postFx.resize).not.toHaveBeenCalled();
});
it('updates renderer and composer on density-only transitions without moving world bounds',()=>{
 const {scene,renderer,postFx}=fixture(),worldWidth=scene.worldWidth;
 for(const ratio of [2,1.5,1]){vi.stubGlobal('devicePixelRatio',ratio);scene.resizeViewport(1280,720);expect(renderer.getPixelRatio()).toBe(ratio);expect(postFx.resize).toHaveBeenLastCalledWith(1280,720);expect(scene.worldWidth).toBe(worldWidth);}
 expect(renderer.setPixelRatio).toHaveBeenCalledTimes(3);expect(postFx.resize).toHaveBeenCalledTimes(3);expect(renderer.setSize).not.toHaveBeenCalled();
});
it('updates the composer once to the final size when CSS dimensions and density change together',()=>{
 const {scene,renderer,postFx}=fixture();vi.stubGlobal('devicePixelRatio',2);scene.resizeViewport(1440,900);
 expect(renderer.setPixelRatio).toHaveBeenCalledExactlyOnceWith(2);expect(renderer.setSize).toHaveBeenCalledExactlyOnceWith(1440,900);expect(postFx.resize).toHaveBeenCalledExactlyOnceWith(1440,900);
 expect(scene.worldWidth).toBe(PAINT.worldHeight*1440/900);expect([scene.width,scene.height]).toEqual([1440,900]);
});
it('keeps the existing two-times quality cap without repeated allocations',()=>{
 const {scene,renderer,postFx}=fixture(2);for(const ratio of [3,4,2]){vi.stubGlobal('devicePixelRatio',ratio);scene.resizeViewport(1280,720);}
 expect(renderer.setPixelRatio).not.toHaveBeenCalled();expect(postFx.resize).not.toHaveBeenCalled();
});
it('preserves the existing fallback density when the browser reports zero',()=>{
 const {scene,renderer,postFx}=fixture(2);vi.stubGlobal('devicePixelRatio',0);scene.resizeViewport(1280,720);
 expect(renderer.getPixelRatio()).toBe(1);expect(postFx.resize).toHaveBeenCalledExactlyOnceWith(1280,720);
});
it('resizes CSS geometry at a stable density',()=>{
 const {scene,renderer,postFx}=fixture(1.5);scene.resizeViewport(1440,900);
 expect(renderer.setPixelRatio).not.toHaveBeenCalled();expect(renderer.setSize).toHaveBeenCalledExactlyOnceWith(1440,900);expect(postFx.resize).toHaveBeenCalledExactlyOnceWith(1440,900);expect(scene.worldWidth).toBe(PAINT.worldHeight*1440/900);
});
it('ignores late resize and render callbacks after disposal',()=>{
 const {scene,renderer,postFx}=fixture();scene.disposed=true;vi.stubGlobal('devicePixelRatio',2);scene.resizeViewport(1440,900);scene.render(undefined as never);
 expect(renderer.getPixelRatio).not.toHaveBeenCalled();expect(renderer.setPixelRatio).not.toHaveBeenCalled();expect(renderer.setSize).not.toHaveBeenCalled();expect(postFx.resize).not.toHaveBeenCalled();expect([scene.width,scene.height]).toEqual([1280,720]);
});
