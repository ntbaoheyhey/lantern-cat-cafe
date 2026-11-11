import {describe,it,expect} from 'vitest';
import {cinematicBox,ultimateFocus,fitStageCamera} from './cinematics';
import {intersects} from '../../squad/turn3d/label-layout';

describe('Spine cinematic safety',()=>{
 it('fits an asymmetric full crew and outer enemy within a shared camera without shrinking units',()=>{
  const out={zoom:1,x:0},width=4800,left=-2000,right=2400,margin=36;
  expect(fitStageCamera(width,left,right,1.1,margin,out)).toBe(out);
  expect(out.zoom).toBeGreaterThan(1);expect(out.zoom).toBeLessThan(1.1);
  const half=width/(2*out.zoom);
  expect(left-out.x).toBeGreaterThanOrEqual(-half+margin-1e-6);
  expect(right-out.x).toBeLessThanOrEqual(half-margin+1e-6);
  expect(out.x).toBeGreaterThan(0);
 });
 it('retains the authored center and zoom when the roster already fits',()=>{
  expect(fitStageCamera(4800,-1800,1900,1.1,36,{zoom:0,x:0})).toEqual({zoom:1.1,x:0});
  expect(fitStageCamera(4800,Infinity,-Infinity,1,36,{zoom:0,x:5})).toEqual({zoom:1,x:0});
 });
 it('keeps the recentering when fractional animated bounds exactly fill the fitted view',()=>{
  const width=1950*1280/490,left=-1935.673469387755-213.99507289701393,right=2215.836734693877+255.8040482711652;
  const out=fitStageCamera(width,left,right,1.1,36,{zoom:1,x:0}),half=width/(2*out.zoom);
  expect(out.x).toBeGreaterThan(150);
  expect(left-out.x).toBeGreaterThanOrEqual(-half+36-1e-6);
  expect(right-out.x).toBeLessThanOrEqual(half-36+1e-6);
 });
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
