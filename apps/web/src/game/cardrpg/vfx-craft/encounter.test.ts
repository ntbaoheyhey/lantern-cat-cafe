import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {Scene} from 'three';
import {CraftEncounter} from './encounter';

class PendingImage {
 src='';
 resolve!:()=>void;
 reject!:(error:Error)=>void;
 constructor(){images.push(this);}
 decode(){return new Promise<void>((resolve,reject)=>{this.resolve=resolve;this.reject=reject;});}
}
let images:PendingImage[]=[];
beforeEach(()=>{images=[];vi.stubGlobal('Image',PendingImage);});
afterEach(()=>vi.unstubAllGlobals());

it('loads only requested encounter effects and shares in-flight owner requests',async()=>{
 const scene=new Scene(),craft=new CraftEncounter(scene);
 await craft.prepare(['button-guard','toString']);expect(images).toHaveLength(0);
 let ready=false;
 const first=craft.prepare(['mochi','mochi','button-guard']).then(()=>{ready=true;});
 const second=craft.prepare(['mochi']);await Promise.resolve();
 expect(images.map(image=>image.src)).toEqual(['/vfx/mochi/shield-cut.webp','/vfx/mochi/shield-crest.webp']);
 expect(Object.keys(craft.effects)).toEqual(['shield']);expect(ready).toBe(false);
 images[0]!.resolve();await Promise.resolve();expect(ready).toBe(false);
 images[1]!.resolve();await Promise.all([first,second]);expect(ready).toBe(true);
 await craft.prepare(['mochi']);expect(images).toHaveLength(2);
 craft.dispose();expect(scene.children).toHaveLength(0);
});

it.each(['mochi','clover','panko','binding-thread','teacup-healer','yarn-giant'])(
 'releases %s effects once and creates no textures after a late image decode',async owner=>{
  const scene=new Scene(),craft=new CraftEncounter(scene),pending=craft.prepare([owner]);
  await Promise.resolve();const effect=Object.values(craft.effects)[0]!;
  const dispose=vi.spyOn(effect,'dispose');craft.dispose();craft.dispose();
  for(const image of images)image.resolve();await pending;
  expect(dispose).toHaveBeenCalledOnce();expect(scene.children).toHaveLength(0);
  expect(Object.keys(craft.effects)).toHaveLength(0);
  const resources=effect as unknown as {texture?:unknown;textures?:unknown[]};
  expect(resources.texture).toBeUndefined();expect(resources.textures??[]).toHaveLength(0);
 });

it('cleans a failed effect and ignores its other late image while another owner can prepare',async()=>{
 const scene=new Scene(),craft=new CraftEncounter(scene),pending=craft.prepare(['mochi']);
 const failure=expect(pending).rejects.toThrow('missing crest');await Promise.resolve();
 const shield=craft.effects.shield!,dispose=vi.spyOn(shield,'dispose');
 images[1]!.reject(new Error('missing crest'));await failure;
 images[0]!.resolve();await Promise.resolve();
 expect(dispose).toHaveBeenCalledOnce();expect(craft.effects.shield).toBeUndefined();
 const next=craft.prepare(['binding-thread']);await Promise.resolve();images[2]!.resolve();await next;
 expect(Object.keys(craft.effects)).toEqual(['thread']);craft.dispose();
 expect(dispose).toHaveBeenCalledOnce();expect(scene.children).toHaveLength(0);
});
