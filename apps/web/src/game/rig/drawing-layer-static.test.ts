import {expect,it,vi} from 'vitest';
import * as T from 'three';
import mochi from '../../../public/units/mochi/poses/manifest.json';
import soot from '../../../public/units/soot/poses/manifest.json';
import clover from '../../../public/units/clover/poses/manifest.json';
import panko from '../../../public/units/panko/poses/manifest.json';
import {DrawingLayer,type DrawingManifest,type DrawingSet} from './drawing-layer';

function make(input:unknown=mochi,scale=.7){
 const manifest=structuredClone(input) as DrawingManifest;
 const textures=Object.fromEntries(Object.keys(manifest.poses).map(key=>[key,new T.Texture()]));
 const layer=new DrawingLayer({manifest,textures} as DrawingSet,[17,23],scale);
 const source=new T.PlaneGeometry(...manifest.canvas,32,32);
 const verify=()=>{
  const initial=source.attributes.position!,actual=layer.geometry.attributes.position!;
  expect(actual.count).toBe(initial.count);
  for(let i=0;i<initial.count;i++){
   const p=layer.point([initial.getX(i)+manifest.canvas[0]/2,manifest.canvas[1]/2-initial.getY(i)]);
   expect(Object.is(actual.getX(i),Math.fround(p.x))).toBe(true);
   expect(Object.is(actual.getY(i),Math.fround(p.y))).toBe(true);
   expect(actual.getZ(i)).toBe(Math.fround(.002));
  }
 };
 return{layer,manifest,verify,dispose:()=>{layer.dispose();source.dispose();Object.values(textures).forEach(t=>t.dispose());}};
}
it('retains every vertex across poses, reverse seeks, reduced motion and retaliation while skipping stationary work',()=>{
 for(const input of [mochi,soot,clover,panko]){
  const f=make(input),point=vi.spyOn(f.layer,'point');
  try{
   for(const reduced of [false,true])for(const clip of ['idle','attack','ult','hurt','ko','victory'])for(const at of [1.81,.35,.09,0,.6]){
    point.mockClear();f.layer.sample(clip,at,reduced,clip==='ult'?.05:undefined,30+at,.7,.12);
    expect(point.mock.calls.length).toBeLessThan(1089);expect(point.mock.calls.length).toBeGreaterThan(0);f.verify();
   }
  }finally{point.mockRestore();f.dispose();}
 }
});
it('fully resamples invalid inputs and restores frozen rows before optimizing the next finite sample',()=>{
 // Unprofiled actors reach the existing NaN vertex path; profiled actors can
 // throw while selecting a gesture, before vertex updates (covered below).
 const manifest=structuredClone(mochi);manifest.unit='stationary-contract';
 const f=make(manifest),point=vi.spyOn(f.layer,'point');
 try{
  for(const bad of [NaN,Infinity,-Infinity]){
   point.mockClear();f.layer.sample('idle',.6,false,undefined,bad);expect(point.mock.calls.length).toBe(1089);
   point.mockClear();f.layer.sample('idle',.6,false,undefined,30.6);expect(point.mock.calls.length).toBe(1089);f.verify();
   point.mockClear();f.layer.sample('idle',.7,false,undefined,30.7);expect(point.mock.calls.length).toBeLessThan(1089);f.verify();
  }
 }finally{point.mockRestore();f.dispose();}
});
it('preserves a profiled actor invalid-clock exception and fully refreshes after recovery',()=>{
 const f=make(),point=vi.spyOn(f.layer,'point');
 try{
  expect(()=>f.layer.sample('idle',.6,false,undefined,NaN)).toThrow();
  point.mockClear();f.layer.sample('idle',.6,false,undefined,30.6);expect(point.mock.calls.length).toBe(1089);f.verify();
  point.mockClear();f.layer.sample('idle',.7,false,undefined,30.7);expect(point.mock.calls.length).toBeLessThan(1089);f.verify();
 }finally{point.mockRestore();f.dispose();}
});
it('retains the full original loop for invalid motion metadata or scale',()=>{
 const badFace=structuredClone(mochi);badFace.poses.K5.face[3]=NaN;
 const badOverlap=structuredClone(mochi);badOverlap.poses.K5.overlap[0]!.radius[0]=0;
 const badFoot=structuredClone(mochi);badFoot.poses.K5.feet[0]!.pop();
 for(const [manifest,scale]of [[badFace,.7],[badOverlap,.7],[badFoot,.7],[mochi,0],[mochi,-.7]] as const){
  const f=make(manifest,scale),point=vi.spyOn(f.layer,'point');
  try{f.layer.sample('idle',.6,false,undefined,30.6);expect(point.mock.calls.length).toBe(1089);f.verify();}
  finally{point.mockRestore();f.dispose();}
 }
});
