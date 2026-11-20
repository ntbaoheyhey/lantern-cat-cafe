import {describe,expect,it} from 'vitest';
import {pinCompiledPrograms} from './program-pin';

describe('pinCompiledPrograms',()=>{
 it('adds one lasting reference to each program once',()=>{
  const programs=[{usedTimes:1},{usedTimes:2}];
  const renderer={info:{programs}} as never;
  expect(pinCompiledPrograms(renderer)).toBe(2);
  expect(programs.map(p=>p.usedTimes)).toEqual([2,3]);
  programs.push({usedTimes:1});
  expect(pinCompiledPrograms(renderer)).toBe(1);
  expect(programs.map(p=>p.usedTimes)).toEqual([2,3,2]);
 });
 it('tolerates a renderer without program info',()=>{
  expect(pinCompiledPrograms({info:{programs:null}} as never)).toBe(0);
 });
});
