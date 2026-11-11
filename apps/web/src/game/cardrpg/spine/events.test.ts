import { describe,it,expect } from 'vitest';
import {animationCues,SpineEventCursor,retimedClipTime} from './events';
import {lookSpineEnabled,lookV3DEnabled} from './config';
describe('Spine contract clock',()=>{
 it('defaults on for demo/look, explicitly off remains legacy, 3D stays parked',()=>{expect(lookSpineEnabled('?demo=1',false)).toBe(true);expect(lookSpineEnabled('',true)).toBe(true);expect(lookSpineEnabled('?demo=1&lookSpine=0',true)).toBe(false);expect(lookSpineEnabled('',false)).toBe(false);expect(lookV3DEnabled('?demo=1')).toBe(false);});
 it('keeps multiple authored hits and only fills missing named events',()=>{const cues=animationCues('ult',2,[{name:'hit',time:.8},{name:'hit',time:1.1}]);expect(cues.filter(c=>c.name==='hit')).toHaveLength(2);expect(cues.filter(c=>c.fallback).map(c=>c.name)).toEqual(['ult-start','cast','ult-end']);});
 it.each([-.1,3,NaN,Infinity])('replaces an unusable authored hit at %s with a timed fallback',time=>{
  const authored=[{name:'hit',time},{name:'cast',time:.3}],cues=animationCues('skill',1,authored);
  expect(cues.find(c=>c.name==='hit')).toEqual({name:'hit',time:.55,fallback:true});
  expect(cues.find(c=>c.name==='cast')).toEqual({name:'cast',time:.3,fallback:false});
  const cursor=new SpineEventCursor(),seen:string[]=[];cursor.advance(cues,1,c=>seen.push(c.name));cursor.advance(cues,1,c=>seen.push(c.name));
  expect(seen).toEqual(['cast','hit']);expect(Object.is(authored[0]!.time,time)).toBe(true);
 });
 it('keeps valid repeated hits while discarding a malformed extra event',()=>{
  const cues=animationCues('ult',2,[{name:'hit',time:NaN},{name:'hit',time:.8},{name:'hit',time:1.1}]);
  expect(cues.filter(c=>c.name==='hit')).toEqual([{name:'hit',time:.8,fallback:false},{name:'hit',time:1.1,fallback:false}]);
  expect(cues.every(c=>Number.isFinite(c.time))).toBe(true);
 });
 it('crosses every event once even after a large x3 frame and can restart a replay',()=>{const cursor=new SpineEventCursor(),cues=animationCues('skill',1,[{name:'cast',time:.1},{name:'hit',time:.4}]),seen:string[]=[];cursor.advance(cues,0,c=>seen.push(c.name));cursor.advance(cues,.8,c=>seen.push(c.name));cursor.advance(cues,1,c=>seen.push(c.name));expect(seen).toEqual(['cast','hit']);cursor.reset();cursor.advance(cues,1,c=>seen.push(c.name));expect(seen).toEqual(['cast','hit','cast','hit']);});
 it('retimes contact exactly to the unchanged gameplay impact and holds endpoints',()=>{expect(retimedClipTime(.63,1,.48,.63)).toBeCloseTo(.48);expect(retimedClipTime(0,2,1.1,.6)).toBe(0);expect(retimedClipTime(1,2,1.1,.6)).toBe(2);});
});
