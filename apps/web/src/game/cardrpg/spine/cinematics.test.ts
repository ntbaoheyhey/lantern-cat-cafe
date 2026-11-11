import {describe,it,expect} from 'vitest';
import {cinematicBox,ultimateFocus} from './cinematics';
import {intersects} from '../../squad/turn3d/label-layout';

describe('Spine cinematic safety',()=>{
 it('opens and releases smoothly on authored events without overshooting',()=>{
  expect(ultimateFocus(2,-100,-100,false)).toBe(0);
  expect(ultimateFocus(2,2,-100,true)).toBe(0);
  expect(ultimateFocus(2.09,2,-100,true)).toBeCloseTo(.5);
  expect(ultimateFocus(2.4,2,-100,true)).toBe(1);
  expect(ultimateFocus(2.5,2,2.4,false)).toBeCloseTo(.5);
  expect(ultimateFocus(3,2,2.4,false)).toBe(0);
 });
 it.each([[1280,490],[1440,670]])('keeps portraits clear of the crew, boss and health labels at %sx%s',(width,height)=>{
  const protectedRects=[{x:0,y:height*.48,width:width*.50,height:height*.52},{x:width*.58,y:height*.20,width:width*.42,height:height*.80},{x:0,y:0,width:width,height:50}];
  const box=cinematicBox(width,height,protectedRects);
  expect(box).not.toBeNull();expect(protectedRects.some(r=>intersects(box!,r,12))).toBe(false);
 });
 it('omits a cut-in when the stage has no safe space',()=>{
  expect(cinematicBox(600,200,[{x:0,y:0,width:600,height:200}])).toBeNull();
 });
 it('uses the compact portrait when an ally-wide ultimate reserves three number lanes',()=>{
  const protectedRects=[{x:416.36,y:147.17,width:150,height:34},{x:34.37,y:179.34,width:150,height:34},{x:219.03,y:185.05,width:150,height:34},{x:797.29,y:163.92,width:138,height:52}];
  const box=cinematicBox(1280,490,protectedRects);
  expect(box).not.toBeNull();expect(box!.height).toBe(88);
  expect(protectedRects.some(r=>intersects(box!,r,12))).toBe(false);
 });
});
