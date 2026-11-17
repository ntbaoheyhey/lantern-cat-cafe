import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import approved from './v5-approved-manifest-loader.json';
import delivery from './v5-avif-manifest-loader.json';

let failDecode:boolean,failAvif:boolean,badGeometry:boolean,fetcher:ReturnType<typeof vi.fn>,revoke:ReturnType<typeof vi.fn>;
class TestImage {
 src='';naturalWidth=1024;naturalHeight=1024;
 async decode(){if(failDecode||failAvif&&this.src==='blob:image/avif')throw Error('Unsupported image');if(badGeometry&&this.src==='blob:image/avif')this.naturalWidth=512;}
}
beforeEach(()=>{
 vi.resetModules();failDecode=false;failAvif=false;badGeometry=false;vi.stubGlobal('Image',TestImage);
 fetcher=vi.fn(async(url:string)=>({ok:true,blob:async()=>new Blob(['approved pixels'],{type:url.endsWith('.avif')?'image/avif':'image/webp'})}));vi.stubGlobal('fetch',fetcher);
 vi.spyOn(URL,'createObjectURL').mockImplementation(blob=>'blob:'+(blob as Blob).type);revoke=vi.spyOn(URL,'revokeObjectURL').mockImplementation(()=>{});
});
it('pins twelve smaller same-grid derivatives to both their own bytes and the approved originals',()=>{
 expect(Object.keys(delivery).sort()).toEqual(Object.keys(approved).sort());let total=0;
 for(const key of Object.keys(approved) as (keyof typeof approved)[]){
  const row=delivery[key],bytes=readFileSync(new URL('../../../../public/vfx/v5/'+row.file,import.meta.url));
  expect('sha256-'+createHash('sha256').update(bytes).digest('base64')).toBe(row.integrity);
  expect(row.sourceIntegrity).toBe(approved[key].integrity);expect(row.width).toBe(1024);expect(row.height).toBe(1024);total+=bytes.length;
 }
 expect(total).toBeLessThanOrEqual(350000);
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
  const row=delivery[key];expect(fetcher).toHaveBeenCalledWith('/vfx/v5/'+row.file,expect.objectContaining({integrity:row.integrity}));
 }
 const {getV5Texture}=await import('../vfx-layered/skill-textures');
 expect(getV5Texture('mochi-slash')).toMatchObject({cols:4,rows:4,blend:'add'});
 expect(getV5Texture('mochi-impact')).toBeUndefined();expect(getV5Texture('soot-impact')).toBeUndefined();
 await loadV5Textures('button-guard');expect(fetcher).toHaveBeenCalledTimes(2);expect(revoke).toHaveBeenCalledTimes(2);
});
it('falls back to the separately pinned original after derivative integrity/network rejection',async()=>{
 fetcher.mockRejectedValueOnce(new TypeError('Integrity mismatch'));
 const {loadV5Textures}=await import('./v5-texture-loader'),{getV5Texture}=await import('../vfx-layered/skill-textures');
 await expect(loadV5Textures('mochi')).resolves.toBeUndefined();
 expect(getV5Texture('mochi-slash')).toBeDefined();expect(fetcher).toHaveBeenCalledTimes(3);
 expect(fetcher).toHaveBeenCalledWith('/vfx/v5/'+approved['mochi-slash'].file,expect.objectContaining({integrity:approved['mochi-slash'].integrity}));
 await loadV5Textures('mochi');expect(fetcher).toHaveBeenCalledTimes(3);
});
it.each(['decode','geometry'])('uses approved original when AVIF %s is unsupported or invalid',async reason=>{
 failAvif=reason==='decode';badGeometry=reason==='geometry';
 const {loadV5Textures}=await import('./v5-texture-loader'),{getV5Texture}=await import('../vfx-layered/skill-textures');
 await loadV5Textures('mochi');expect(fetcher).toHaveBeenCalledTimes(4);expect(revoke).toHaveBeenCalledTimes(4);
 expect(getV5Texture('mochi-slash')).toMatchObject({width:1024,height:1024,image:{src:'blob:image/webp'}});
});
it('releases blobs after decode failure and permits a later recovery',async()=>{
 failDecode=true;
 const {loadV5Textures}=await import('./v5-texture-loader'),{getV5Texture}=await import('../vfx-layered/skill-textures');
 await loadV5Textures('mochi');expect(getV5Texture('mochi-slash')).toBeUndefined();expect(revoke).toHaveBeenCalledTimes(4);
 failDecode=false;await loadV5Textures('mochi');expect(getV5Texture('mochi-slash')).toBeDefined();expect(fetcher).toHaveBeenCalledTimes(6);
});
it('ignores a delivery tied to a different original',async()=>{
 vi.doMock('./v5-avif-manifest-loader.json',()=>({default:{...delivery,'mochi-slash':{...delivery['mochi-slash'],sourceIntegrity:approved['soot-impact'].integrity}}}));
 try{
  const {loadV5Textures}=await import('./v5-texture-loader');await loadV5Textures('mochi');
  expect(fetcher).not.toHaveBeenCalledWith('/vfx/v5/'+delivery['mochi-slash'].file,expect.anything());
  expect(fetcher).toHaveBeenCalledWith('/vfx/v5/'+approved['mochi-slash'].file,expect.objectContaining({integrity:approved['mochi-slash'].integrity}));
 }finally{vi.doUnmock('./v5-avif-manifest-loader.json');}
});
