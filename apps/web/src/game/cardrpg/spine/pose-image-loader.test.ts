import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {loadPoseImage} from './pose-image-loader';
let urls:string[],failAvif:boolean,wrongSize:boolean;
class TestImage {
 src='';
 get naturalWidth(){return wrongSize&&this.src.endsWith('.avif')?64:1024;}
 get naturalHeight(){return 1024;}
 async decode(){urls.push(this.src);if(failAvif&&this.src.endsWith('.avif'))throw Error('Unsupported AVIF');}
}
beforeEach(()=>{urls=[];failAvif=false;wrongSize=false;vi.stubGlobal('Image',TestImage);});
afterEach(()=>vi.unstubAllGlobals());
const original='/units/mochi/poses/K0.webp';
it('uses only explicitly selected pose AVIF deliveries',async()=>{
 const image=await loadPoseImage(original,1024,1024);expect(image.src).toBe('/units/mochi/poses/K0.avif');
 const untouched=await loadPoseImage('/units/unknown/poses/K0.webp',1024,1024);expect(untouched.src).toBe('/units/unknown/poses/K0.webp');
});
it('preserves the original pose when AVIF decoding is unsupported',async()=>{
 failAvif=true;expect((await loadPoseImage(original,1024,1024)).src).toBe(original);
 expect(urls).toEqual(['/units/mochi/poses/K0.avif',original]);
});
it('rejects a sampled pose whose canvas geometry changed',async()=>{
 wrongSize=true;expect((await loadPoseImage(original,1024,1024)).src).toBe(original);
 expect(urls).toEqual(['/units/mochi/poses/K0.avif',original]);
});
