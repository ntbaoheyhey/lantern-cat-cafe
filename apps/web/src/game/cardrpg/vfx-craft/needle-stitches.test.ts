import {describe,expect,it} from 'vitest';
import {needleFlight} from './needle-stitches';

describe('Needle late ranged release',()=>{
 it.each([350,1100])('lands at the fixed %ims impact with at least three visible film frames',impact=>{
  const start=impact-150;
  expect(needleFlight(start-1,impact,150).active).toBe(false);
  expect(needleFlight(start,impact,150).alpha).toBe(0);
  const visible=Array.from({length:Math.ceil(impact/1000*30)},(_,i)=>i*1000/30)
   .map(ms=>needleFlight(ms,impact,150)).filter(f=>f.active&&f.alpha>.05);
  expect(visible.length).toBeGreaterThanOrEqual(3);
  expect(needleFlight(start+75,impact,150).progress).toBeCloseTo(.5);
  expect(needleFlight(impact,impact,150)).toEqual({active:false,progress:1,alpha:0});
  expect(needleFlight(impact+100,impact,150).active).toBe(false);
 });
});
