import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {loadAtlasImage} from './atlas-delivery';

const sampled={url:'/sample.avif',width:683,height:341};
let images:TestImage[],mode:'pass'|'reject'|'wrong-size';
class TestImage {
 src='';
 get naturalWidth(){return this.src===sampled.url?(mode==='wrong-size'?682:683):1024;}
 get naturalHeight(){return this.src===sampled.url?341:512;}
 constructor(){images.push(this);}
 async decode(){if(this.src===sampled.url&&mode==='reject')throw Error('unsupported image');}
}
beforeEach(()=>{images=[];mode='pass';vi.stubGlobal('Image',TestImage);});
afterEach(()=>vi.unstubAllGlobals());

it('publishes a decoded sampled page without fetching the established page',async()=>{
 const image=await loadAtlasImage('/original.webp',sampled);
 expect(image.src).toBe(sampled.url);expect(images).toHaveLength(1);
});
it.each(['reject','wrong-size'] as const)('uses the established page after a sampled %s failure',async failure=>{
 mode=failure;const pending=new Set<HTMLImageElement>();
 const image=await loadAtlasImage('/original.webp',sampled,{track:(image,active)=>{if(active)pending.add(image);else pending.delete(image);}});
 expect(images.map(i=>i.src)).toEqual([sampled.url,'/original.webp']);
 expect(image.naturalWidth).toBe(1024);expect(image.naturalHeight).toBe(512);expect(pending.size).toBe(0);
});
it('does not start a fallback request after disposal aborts decoding',async()=>{
 mode='reject';await expect(loadAtlasImage('/original.webp',sampled,{aborted:()=>true})).rejects.toThrow('unsupported image');
 expect(images).toHaveLength(1);
});
