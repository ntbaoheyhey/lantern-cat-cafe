import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {Texture} from 'three';
import {LanternRequiem} from '../vfx-craft/lantern-requiem';
import {loadPoseTexture} from './pose-texture-loader';

const original='/units/soot/poses/lantern-flame.webp';
let requested:string[],failAvif:boolean,wrongSize:boolean,hold:boolean,release:()=>void;
class PoseImage {
 src='';
 get naturalWidth(){return wrongSize&&this.src.endsWith('.avif')?512:1536;}
 get naturalHeight(){return 510;}
 async decode(){
  requested.push(this.src);
  if(hold)await new Promise<void>(resolve=>{release=resolve;});
  if(failAvif&&this.src.endsWith('.avif'))throw Error('Unsupported codec');
 }
}
beforeEach(()=>{requested=[];failAvif=false;wrongSize=false;hold=false;vi.stubGlobal('Image',PoseImage);});
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
it('uploads the same-size delivered flame without fetching its original WebP',async()=>{
 const texture=await loadPoseTexture(original,1536,510);
 expect(requested).toEqual(['/units/soot/poses/lantern-flame.avif']);
 expect(texture.image.naturalWidth).toBe(1536);expect(texture.image.naturalHeight).toBe(510);
 expect(texture.version).toBe(1);texture.dispose();
});
it.each(['decode','geometry'])('keeps the authored WebP when the AVIF %s fails',async failure=>{
 failAvif=failure==='decode';wrongSize=failure==='geometry';
 const texture=await loadPoseTexture(original,1536,510);
 expect(requested).toEqual(['/units/soot/poses/lantern-flame.avif',original]);
 expect(texture.image.src).toBe(original);texture.dispose();
});
it('disposes a late flame texture when its encounter closed during decoding',async()=>{
 hold=true;const dispose=vi.spyOn(Texture.prototype,'dispose'),effect=new LanternRequiem();
 effect.dispose();const prior=dispose.mock.calls.length;
 release();await effect.ready;
 expect(dispose).toHaveBeenCalledTimes(prior+1);
});
