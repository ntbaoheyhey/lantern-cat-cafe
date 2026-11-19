import {describe,expect,it} from 'vitest';
import {ULT_DUCK,hitPitch,groupsToEvict,layersForBeat,legacyUltCat,v9LayerPaths,MAX_SAME_SOUND} from './ultimate-mix';

describe('V9 battle mix (C5)',()=>{
 it('ducks music 6 dB for 1.5 s on an ultimate',()=>{expect(ULT_DUCK.db).toBe(-6);expect(ULT_DUCK.hold).toBe(1.5);});
 it('spreads normal hit pitch within +/-5%',()=>{
  expect(hitPitch(()=>0)).toBeCloseTo(.95);expect(hitPitch(()=>1)).toBeCloseTo(1.05);expect(hitPitch(()=>.5)).toBe(1);
 });
 it('keeps at most three copies of one sound, evicting the oldest groups',()=>{
  expect(MAX_SAME_SOUND).toBe(3);
  expect(groupsToEvict([])).toEqual([]);expect(groupsToEvict([4,7])).toEqual([]);
  expect(groupsToEvict([9,4,7])).toEqual([4]);expect(groupsToEvict([2,2,5,8,9])).toEqual([2,5]);
 });
 it('maps director beats to the four AGS layers',()=>{
  expect(layersForBeat('cutin')).toEqual(['riser']);expect(layersForBeat('impact')).toEqual(['transient','body']);
  expect(layersForBeat('linger')).toEqual(['tail']);expect(layersForBeat('dim')).toEqual([]);
  expect(v9LayerPaths('soot','tail')).toEqual(['v9/sfx-ult-soot-tail.opus','v9/sfx-ult-soot-tail.m4a']);
 });
 it('only retires legacy ult cues of the three MVP cats',()=>{
  expect(legacyUltCat('ult.mochi.impact')).toBe('mochi');expect(legacyUltCat('ult.panko.impact')).toBeUndefined();expect(legacyUltCat('voice.mochi.ult.charge')).toBeUndefined();
 });
});
