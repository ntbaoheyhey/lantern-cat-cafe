import {expect,it} from 'vitest';
import {numberPieces} from './number-pieces';
it('preserves resolved damage for small, odd and large totals without inventing zero hits',()=>{
 for(const total of [0,1,2,3,17,101,9999])for(const count of [1,2,3,6]){
  const parts=numberPieces(total,count);expect(parts.reduce((a,b)=>a+b,0)).toBe(total);
  expect(parts.every(p=>Number.isInteger(p)&&(total===0?p===0:p>0))).toBe(true);
  expect(parts.length).toBeLessThanOrEqual(count);
 }
});
