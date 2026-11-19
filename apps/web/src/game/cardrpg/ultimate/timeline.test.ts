import {describe,expect,it} from 'vitest';
import {ULT_TIMING,ULT_DIM,ultimateDim,cutinState,castPose,impactTrauma,beatsBetween,easeOutBack} from './timeline';
import {ULT_RECIPES,ultRecipe} from './recipes';
import {flipbookCell} from './flipbooks';

describe('V9 five-beat ultimate clock',()=>{
 it('dims the field to ~40% in one frame and undims in the linger',()=>{
  expect(ultimateDim(0)).toBe(ULT_DIM);expect(ULT_DIM).toBeCloseTo(.6);
  expect(ultimateDim(ULT_TIMING.impact)).toBe(ULT_DIM);
  expect(ultimateDim(ULT_TIMING.dimEnd)).toBe(0);
  expect(ultimateDim(1800)).toBeGreaterThan(0);expect(ultimateDim(1800)).toBeLessThan(ULT_DIM);
 });
 it('shows the cut-in for 500-700 ms',()=>{
  expect(cutinState(10).visible).toBe(true);
  expect(cutinState(ULT_TIMING.cutinEnd).visible).toBe(false);
  expect(ULT_TIMING.cutinEnd).toBeGreaterThanOrEqual(500);expect(ULT_TIMING.cutinEnd).toBeLessThanOrEqual(700);
 });
 it('squashes, lunges to the full reach at impact, holds, and steps back home',()=>{
  const reach=100,h=200;
  const squash=castPose(ULT_TIMING.lunge-1,reach,h);expect(squash.sy).toBeLessThan(1);expect(squash.x).toBeLessThan(0);
  expect(castPose(ULT_TIMING.impact,reach,h).x).toBeCloseTo(reach,0);
  expect(castPose(1300,reach,h).x).toBe(reach);
  const home=castPose(ULT_TIMING.back,reach,h);expect(home.x).toBe(0);expect(home.held).toBe(false);
  expect(castPose(300,reach,h).held).toBe(true);
  expect(castPose(-1,-reach,h).x).toBe(0);
 });
 it('keeps reduced motion still: no lunge, no shake',()=>{
  expect(castPose(ULT_TIMING.impact,120,200,true).x).toBe(0);
  expect(impactTrauma(ULT_TIMING.impact,true)).toBe(0);
  expect(cutinState(200,true).lines).toBe(0);
 });
 it('peaks camera trauma at the impact and decays within half a second',()=>{
  expect(impactTrauma(ULT_TIMING.impact)).toBe(1);expect(impactTrauma(ULT_TIMING.impact+600)).toBe(0);
 });
 it('fires every beat exactly once across arbitrary frame steps',()=>{
  const seen:string[]=[];let last=-1;for(let t=0;t<=2200;t+=37){for(const b of beatsBetween(last,t))seen.push(b.beat);last=t;}
  expect(seen).toEqual(['dim','cutin','squash','lunge','impact','linger','undim'].sort((a,b)=>seen.indexOf(a)-seen.indexOf(b)));
  expect(new Set(seen).size).toBe(seen.length);expect(seen.length).toBe(7);
 });
 it('never returns a negative ease (canvas radii)',()=>{for(let t=0;t<=1;t+=.01)expect(easeOutBack(t)).toBeGreaterThanOrEqual(0);});
});

describe('V9 ultimate recipes and flipbooks',()=>{
 it('names the three MVP ultimates',()=>{
  expect(ULT_RECIPES.mochi.name).toBe('Last Lantern Vow');expect(ULT_RECIPES.clover.name).toBe('Fourleaf Spring Brew');expect(ULT_RECIPES.soot.name).toBe('Chimney Comet');
  expect(ultRecipe('panko')).toBeUndefined();
  for(const r of Object.values(ULT_RECIPES)){expect(r.lunge).toBeGreaterThan(0);expect(r.lunge).toBeLessThanOrEqual(.1);}
 });
 it('reads CXV atlas cells row-major from the top-left',()=>{
  expect(flipbookCell(0,12,4,512,false)).toMatchObject({x:0,y:0});
  expect(flipbookCell(5,12,4,512,false)).toMatchObject({x:512,y:512});
  expect(flipbookCell(99,12,4,512,false).frame).toBe(11);
  expect(flipbookCell(13,12,4,512,true).frame).toBe(1);
 });
});

import {emissionPixels} from './flipbooks';
describe('V9 emission atlases',()=>{
 it('turns black into transparent and keeps bright emission opaque',()=>{
  const d=emissionPixels(new Uint8ClampedArray([0,0,0,255, 255,128,0,255, 64,32,0,255]));
  expect(d[3]).toBe(0);expect([...d.slice(4,8)]).toEqual([255,128,0,255]);
  expect(d[11]).toBe(64);expect(d[8]).toBe(255);
 });
});
