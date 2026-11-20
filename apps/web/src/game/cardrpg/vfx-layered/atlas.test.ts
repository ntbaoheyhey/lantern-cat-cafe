import {describe,it,expect} from 'vitest';
import {atlasSlots,paintSourceRect,type PackedPaint} from './atlas';
describe('painted atlas placement',()=>{
 it.each([1,2,5,7,32,86])('retains every sheet without overlaps or out-of-page sampling: %i',count=>{
  const pages=atlasSlots(count,1024,512);const indices:number[]=[];
  for(const page of pages){
   expect(Math.max(page.width,page.height)).toBeLessThanOrEqual(4096);
   for(const [i,a] of page.slots.entries()){
    indices.push(a.index);expect(a.x+1024).toBeLessThanOrEqual(page.width);expect(a.y+512).toBeLessThanOrEqual(page.height);
    for(const b of page.slots.slice(i+1))expect(a.x+1024<=b.x||b.x+1024<=a.x||a.y+512<=b.y||b.y+512<=a.y).toBe(true);
   }
  }
  expect(indices.sort((a,b)=>a-b)).toEqual(Array.from({length:count},(_,i)=>i));
 });
 it('rejects unsupported image geometry',()=>expect(()=>atlasSlots(1,8192,512)).toThrow());
});

it('scales packed offsets and crop extents independently of destination geometry',()=>{
 const paint:PackedPaint={image:{} as HTMLImageElement,x:1024,y:512,width:1024,height:512,sourceUrl:'/original.webp',sourceScaleX:683/1024,sourceScaleY:.5};
 expect(paintSourceRect(paint,[64,128,256,192])).toEqual([1088*683/1024,320,256*683/1024,96]);
 expect([paint.x,paint.y,paint.width,paint.height]).toEqual([1024,512,1024,512]);
 const original={...paint,sourceScaleX:undefined,sourceScaleY:undefined};
 expect(paintSourceRect(original,[64,128,256,192])).toEqual([1088,640,256,192]);
});
