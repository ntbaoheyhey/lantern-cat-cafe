import {expect,it} from 'vitest';
import {numberPieces,numberRecipients,numberOffset} from './number-pieces';
it('shows secondary damage from a support ultimate without mutating its primary targets',()=>{
 const plan={targetIds:['mochi','soot'],events:[{type:'shield',targetIds:['mochi']},{type:'damage',targetIds:['foe']},{type:'status_apply',targetIds:['other']}]} as const;
 expect(numberRecipients(plan)).toEqual(['mochi','soot','foe']);
 expect(plan.targetIds).toEqual(['mochi','soot']);
});
it('shows every secondary hit before Mochi finishes shielding four allies',()=>{
 const shown=new Set<number>();
 for(let elapsed=0;elapsed<400;elapsed+=1000/30)for(let i=0;i<3;i++){
  if(elapsed>=numberOffset(400,280,i,3))shown.add(i);
 }
 expect([...shown]).toEqual([0,1,2]);
 expect(numberPieces(39,3).filter((_,i)=>shown.has(i)).reduce((a,b)=>a+b,0)).toBe(39);
});
it('preserves resolved damage for small, odd and large totals without inventing zero hits',()=>{
 for(const total of [0,1,2,3,17,101,9999])for(const count of [1,2,3,6]){
  const parts=numberPieces(total,count);expect(parts.reduce((a,b)=>a+b,0)).toBe(total);
  expect(parts.every(p=>Number.isInteger(p)&&(total===0?p===0:p>0))).toBe(true);
  expect(parts.length).toBeLessThanOrEqual(count);
 }
});
