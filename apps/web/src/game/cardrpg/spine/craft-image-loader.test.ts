import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {loadCraftImage} from './craft-image-loader';
import manifest from './craft-manifest-loader.json';
const original='/vfx/clover/healing-canopy.webp',delivery=manifest[original];
let urls:string[],mode:'ok'|'unsupported'|'wrong-size';
class TestImage {
 src='';
 get naturalWidth(){return mode==='wrong-size'&&this.src===delivery.url?1:delivery.width;}
 get naturalHeight(){return delivery.height;}
 async decode(){urls.push(this.src);if(mode==='unsupported'&&this.src===delivery.url)throw Error('Unsupported AVIF');}
}
beforeEach(()=>{urls=[];mode='ok';vi.stubGlobal('Image',TestImage);});
afterEach(()=>vi.unstubAllGlobals());
it('decodes a selected craft delivery at its original canvas dimensions',async()=>{
 const image=await loadCraftImage(original);expect(image.src).toBe(delivery.url);
 expect([image.naturalWidth,image.naturalHeight]).toEqual([delivery.width,delivery.height]);expect(urls).toEqual([delivery.url]);
});
it.each(['unsupported','wrong-size'] as const)('restores original pixels when the AVIF is %s',async failure=>{
 mode=failure;expect((await loadCraftImage(original)).src).toBe(original);expect(urls).toEqual([delivery.url,original]);
});
it('leaves custom texture URLs unchanged',async()=>{
 const url='/custom/needle.webp';expect((await loadCraftImage(url)).src).toBe(url);expect(urls).toEqual([url]);
});
