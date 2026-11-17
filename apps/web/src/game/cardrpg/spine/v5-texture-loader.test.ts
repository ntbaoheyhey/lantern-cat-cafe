import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import approved from './v5-approved-manifest-loader.json';

let failDecode:boolean,fetcher:ReturnType<typeof vi.fn>,revoke:ReturnType<typeof vi.fn>;
class TestImage {
 src='';naturalWidth=1024;naturalHeight=1024;
 async decode(){if(failDecode)throw Error('Unsupported image');}
}
beforeEach(()=>{
 vi.resetModules();failDecode=false;vi.stubGlobal('Image',TestImage);
 fetcher=vi.fn(async()=>({ok:true,blob:async()=>new Blob(['approved pixels'])}));vi.stubGlobal('fetch',fetcher);
 vi.spyOn(URL,'createObjectURL').mockReturnValue('blob:approved');revoke=vi.spyOn(URL,'revokeObjectURL').mockImplementation(()=>{});
});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});

it('pins all twelve reviewed files to the approved content and keeps their sheet metadata',()=>{
 expect(Object.keys(approved)).toHaveLength(12);
 for(const row of Object.values(approved)){
  const bytes=readFileSync(new URL('../../../../public/vfx/v5/'+row.file,import.meta.url));
  expect('sha256-'+createHash('sha256').update(bytes).digest('base64')).toBe(row.integrity);
  expect(row.cols).toBe(4);expect(row.rows).toBe(4);
 }
});
it('shares in-flight work and loads only approved textures used by the current actor',async()=>{
 const {loadV5Textures}=await import('./v5-texture-loader');
 await Promise.all([loadV5Textures('mochi'),loadV5Textures('mochi')]);
 expect(fetcher).toHaveBeenCalledTimes(2);
 for(const key of ['mochi-slash','mochi-ult-release'] as const){
  const row=approved[key];expect(fetcher).toHaveBeenCalledWith('/vfx/v5/'+row.file,expect.objectContaining({integrity:row.integrity}));
 }
 const {getV5Texture}=await import('../vfx-layered/skill-textures');
 expect(getV5Texture('mochi-slash')).toMatchObject({cols:4,rows:4,blend:'add'});
 expect(getV5Texture('mochi-impact')).toBeUndefined();expect(getV5Texture('soot-impact')).toBeUndefined();
 await loadV5Textures('button-guard');expect(fetcher).toHaveBeenCalledTimes(2);expect(revoke).toHaveBeenCalledTimes(2);
});
it('keeps procedural fallback after integrity/network rejection and retries on the next prepare',async()=>{
 fetcher.mockRejectedValueOnce(new TypeError('Integrity mismatch'));
 const {loadV5Textures}=await import('./v5-texture-loader'),{getV5Texture}=await import('../vfx-layered/skill-textures');
 await expect(loadV5Textures('mochi')).resolves.toBeUndefined();
 expect(getV5Texture('mochi-slash')).toBeUndefined();
 await loadV5Textures('mochi');expect(getV5Texture('mochi-slash')).toBeDefined();expect(fetcher).toHaveBeenCalledTimes(3);
});
it('releases blobs after decode failure and permits a later recovery',async()=>{
 failDecode=true;
 const {loadV5Textures}=await import('./v5-texture-loader'),{getV5Texture}=await import('../vfx-layered/skill-textures');
 await loadV5Textures('mochi');expect(getV5Texture('mochi-slash')).toBeUndefined();expect(revoke).toHaveBeenCalledTimes(2);
 failDecode=false;await loadV5Textures('mochi');expect(getV5Texture('mochi-slash')).toBeDefined();expect(fetcher).toHaveBeenCalledTimes(4);
});
