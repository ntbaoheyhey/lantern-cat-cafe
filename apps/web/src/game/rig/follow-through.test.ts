import {expect,it} from 'vitest';
import {followThrough} from './follow-through';

it('keeps idle, status and death poses intact and settles every action',()=>{
 for(const name of ['idle','stunned','frozen','hurt','death','victory'])
  for(const at of [0,.18,.29,.4,.55])expect(followThrough(name,at,.55,.29)).toBe(0);
 for(const name of ['attack','cast','skill','ultimate','ult']){
  expect(followThrough(name,0,.55,.29)).toBe(0);
  expect(followThrough(name,.18,.55,.29)).toBeLessThan(0);
  expect(followThrough(name,.29,.55,.29)).toBeCloseTo(1);
  expect(followThrough(name,.45,.55,.29)).toBeGreaterThan(0);
  expect(followThrough(name,.55,.55,.29)).toBe(0);
  const expected=followThrough(name,.4,.55,.29);
  followThrough(name,.1,.55,.29);expect(followThrough(name,.4,.55,.29)).toBe(expected);
 }
});
