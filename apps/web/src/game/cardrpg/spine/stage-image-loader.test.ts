import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';

let urls:string[],failures:Set<string>,wrongSize:boolean;
beforeEach(()=>{
 vi.resetModules();urls=[];failures=new Set();wrongSize=false;
 vi.stubGlobal('Image',class{
  src='';naturalWidth=1774;naturalHeight=887;
  async decode(){urls.push(this.src);if(wrongSize&&this.src.includes('.avif'))this.naturalWidth=100;
   if([...failures].some(extension=>this.src.includes(extension)))throw Error('decode failed');}
 });
});
afterEach(()=>vi.unstubAllGlobals());
describe('stage painting delivery',()=>{
 it('shares the successful same-size AVIF decode',async()=>{
  const {loadStagePainting}=await import('./stage-image-loader');
  const first=loadStagePainting();expect(loadStagePainting()).toBe(first);
  expect((await first).src).toContain('.avif');expect(urls).toHaveLength(1);
 });
 it.each(['decode','dimensions'])('falls back to the original WebP after a sibling %s failure',async(reason)=>{
  if(reason==='decode')failures.add('.avif');else wrongSize=true;
  const {loadStagePainting}=await import('./stage-image-loader');
  expect((await loadStagePainting()).src).toContain('.webp');expect(urls).toHaveLength(2);
 });
 it('allows a later scene to retry after both formats fail',async()=>{
  failures=new Set(['.avif','.webp']);const {loadStagePainting}=await import('./stage-image-loader');
  await expect(loadStagePainting()).rejects.toThrow('decode failed');failures.clear();
  expect((await loadStagePainting()).src).toContain('.avif');expect(urls).toHaveLength(3);
 });
});
