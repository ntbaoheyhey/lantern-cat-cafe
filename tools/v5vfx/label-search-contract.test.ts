import {expect,it} from 'vitest';
import {layoutLabels,type LabelInput} from '../../apps/web/src/game/squad/turn3d/label-layout';
const label=(id:string):LabelInput=>({id,x:640,y:320,height:40,head:{x:620,y:200,width:40,height:200}});
it('keeps the original left-first winner when both sides have the same score',()=>{
 expect([...layoutLabels([label('a')],1280,720,110)]).toEqual([['a',{x:495,y:284,width:110,height:40}]]);
});
it('retains id order and exact winners for equal-position labels without mutating inputs',()=>{
 const input=[label('c'),label('b'),label('a')],before=structuredClone(input);
 expect([...layoutLabels(input,1280,720,110)]).toEqual([
  ['a',{x:495,y:284,width:110,height:40}],['b',{x:675,y:284,width:110,height:40}],['c',{x:495,y:232,width:110,height:40}],
 ]);
 expect(input).toEqual(before);
});
it('does not select a non-finite candidate score',()=>{
 for(const x of [NaN,Infinity,-Infinity])expect(layoutLabels([{...label('a'),x}],1280,720,110).size).toBe(0);
});
