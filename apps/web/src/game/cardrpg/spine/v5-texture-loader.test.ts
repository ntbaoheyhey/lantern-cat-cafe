import {afterEach,beforeEach,expect,it,vi} from 'vitest';
let urls:string[],failDecode:boolean;
class TestImage {
 src='';naturalWidth=512;naturalHeight=512;
 async decode(){urls.push(this.src);if(failDecode)throw Error('Unsupported image');}
}
const entry=(file:string)=>({file,cols:4,rows:4,frameMs:40});
beforeEach(()=>{vi.resetModules();urls=[];failDecode=false;vi.stubGlobal('Image',TestImage);});
afterEach(()=>vi.unstubAllGlobals());
it('shares manifest/decode work and requests only the current actor timeline',async()=>{
 const fetcher=vi.fn(async()=>({ok:true,json:async()=>({'mochi-impact':entry('mochi-impact.webp'),'soot-impact':entry('soot-impact.webp')})}));vi.stubGlobal('fetch',fetcher);
 const {loadV5Textures}=await import('./v5-texture-loader');
 await Promise.all([loadV5Textures('mochi'),loadV5Textures('mochi')]);
 expect(fetcher).toHaveBeenCalledTimes(1);expect(urls).toEqual(['/vfx/v5/mochi-impact.webp']);
 const {getV5Texture}=await import('../vfx-layered/skill-textures');expect(getV5Texture('mochi-impact')?.cols).toBe(4);expect(getV5Texture('soot-impact')).toBeUndefined();
 await loadV5Textures('button-guard');expect(fetcher).toHaveBeenCalledTimes(1);
});
it('leaves procedural fallback intact after missing manifests and failed decoding, and allows retry',async()=>{
 const fetcher=vi.fn().mockRejectedValueOnce(Error('offline')).mockResolvedValue({ok:true,json:async()=>({'mochi-impact':entry('mochi-impact.webp')})});vi.stubGlobal('fetch',fetcher);
 const {loadV5Textures}=await import('./v5-texture-loader'),{getV5Texture}=await import('../vfx-layered/skill-textures');
 await expect(loadV5Textures('mochi')).resolves.toBeUndefined();expect(urls).toHaveLength(0);
 failDecode=true;await loadV5Textures('mochi');expect(getV5Texture('mochi-impact')).toBeUndefined();
 failDecode=false;await loadV5Textures('mochi');expect(getV5Texture('mochi-impact')).toBeDefined();expect(fetcher).toHaveBeenCalledTimes(2);
});
it('rejects paths outside the delivery folder and invalid sheet geometry without decoding',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({'mochi-impact':entry('../private.png'),'mochi-slash':{...entry('safe.webp'),cols:0},'mochi-projectile':entry('https://invalid.example/image.png')})})));
 const {loadV5Textures}=await import('./v5-texture-loader');await loadV5Textures('mochi');expect(urls).toEqual([]);
});
