import {describe,it,expect} from 'vitest';
import {atlasSlots} from './atlas';
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
