import {expect,it} from 'vitest';
import * as T from 'three';
import {DrawingLayer,type DrawingManifest} from './drawing-layer';
import mochi from '../../../public/units/mochi/poses/manifest.json';
import soot from '../../../public/units/soot/poses/manifest.json';
import clover from '../../../public/units/clover/poses/manifest.json';
import panko from '../../../public/units/panko/poses/manifest.json';

function drawing(raw:unknown){
 const manifest=raw as DrawingManifest;
 return new DrawingLayer({manifest,textures:Object.fromEntries(Object.keys(manifest.poses).map(key=>[key,new T.Texture()]))},[0,0],1);
}
const span=(values:number[])=>Math.max(...values)-Math.min(...values);

it.each([mochi,soot,clover,panko])('keeps the sampled mesh identical to arbitrary-point projection across poses: $unit',raw=>{
 const d=drawing(raw),source=new T.PlaneGeometry(raw.canvas[0],raw.canvas[1],32,32),vertices=source.attributes.position!;
 const point:[number,number]=[0,0],out={x:0,y:0},expected=new Float32Array(vertices.count*3);
 const cases:[string,number][]=[['idle',.6],['attack',.1],['attack',.27],['attack',.35],['attack',.439],['attack',.44],['attack',.799],['ult',.6],['ult',1.1],['ult',1.8],['hurt',.06],['hurt',.18],['victory',1]];
 try{
  for(const reduced of [false,true])for(const [clip,seconds]of cases){
   d.sample(clip,seconds,reduced,undefined,30+seconds,.7);
   for(let i=0;i<vertices.count;i++){
    point[0]=vertices.getX(i)+raw.canvas[0]/2;point[1]=raw.canvas[1]/2-vertices.getY(i);
    const p=d.point(point,d.key,undefined,out);expected[i*3]=p.x;expected[i*3+1]=p.y;expected[i*3+2]=.002;
   }
   expect(Array.from(d.geometry.attributes.position!.array)).toEqual(Array.from(expected));
  }
 }finally{source.dispose();d.dispose();}
});

it.each([mochi,soot,clover,panko])('gives $unit a restrained lateral idle with planted feet and reproducible long seeks',raw=>{
 const d=drawing(raw),head=d.frame.sockets.head!,feet=d.contactPoints(),xs:number[]=[],snapshots:number[][]=[];
 try{
  for(let frame=0;frame<=240;frame++){
   const clock=frame/12;d.sample('idle',clock%3.6,false,undefined,clock,.7);
   xs.push(d.point(head).x);
   const positions=Array.from(d.geometry.attributes.position!.array);
   expect(positions.every(Number.isFinite)).toBe(true);snapshots.push(positions);
   d.contactPoints().forEach((p,i)=>expect(Math.hypot(p.x-feet[i]!.x,p.y-feet[i]!.y)).toBeLessThanOrEqual(1));
  }
  expect(span(xs)).toBeGreaterThan(raw.opaqueHeight*.01);
  expect(span(xs)).toBeLessThan(raw.opaqueHeight*.085);
  for(const frame of [240,120,36,1,0,210]){
   const clock=frame/12;d.sample('idle',clock%3.6,false,undefined,clock,.7);
   expect(Array.from(d.geometry.attributes.position!.array)).toEqual(snapshots[frame]);
  }
 }finally{d.dispose();}
});

it('keeps background breathing under a cast while preserving the impact hold',()=>{
 const d=drawing(clover),head=d.set.manifest.poses.K5!.sockets.head!,ys:number[]=[];
 try{
  for(let n=0;n<40;n++){
   d.sample('ult',.7,false,undefined,10+n/10,.7);ys.push(d.point(head).y);
  }
  expect(span(ys)).toBeGreaterThan(clover.opaqueHeight*.002);
  d.sample('attack',.35,false,undefined,20.35,.7);const contact=Array.from(d.geometry.attributes.position!.array);
  d.sample('attack',.439,false,undefined,20.439,.7);
  expect(Array.from(d.geometry.attributes.position!.array)).toEqual(contact);
 }finally{d.dispose();}
});

it('keeps reduced motion to quiet breath and blink without lateral gestures',()=>{
 const d=drawing(mochi),head=d.frame.sockets.head!,xs:number[]=[],ys:number[]=[];
 try{
  for(let n=0;n<240;n++){
   const clock=n/12;d.sample('idle',clock%3.6,true,undefined,clock,.7);
   const p=d.point(head);xs.push(p.x);ys.push(p.y);
  }
  expect(span(xs)).toBeLessThan(.001);
  expect(span(ys)).toBeGreaterThan(0);
  expect(span(ys)).toBeLessThanOrEqual(mochi.opaqueHeight*.01);
 }finally{d.dispose();}
});
