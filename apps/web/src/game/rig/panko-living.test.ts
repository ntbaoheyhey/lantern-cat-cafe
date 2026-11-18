import {expect,it} from 'vitest';
import * as T from 'three';
import {DrawingLayer,type DrawingManifest} from './drawing-layer';
import {pankoBlink} from './panko-living';
import raw from '../../../public/units/panko/poses/manifest.json';
const make=()=>{const manifest=raw as unknown as DrawingManifest;return new DrawingLayer({manifest,textures:Object.fromEntries(Object.keys(manifest.poses).map(k=>[k,new T.Texture()]))},[0,0],1);};
const vertices=(d:DrawingLayer)=>Array.from(d.geometry.attributes.position!.array);
it('closes the ten-second mesh cycle and preserves planted feet across arbitrary seeks',()=>{
 const d=make();try{
  const feet=d.contactPoints();
  for(const reduced of [false,true])for(const t of [0,.9,1.2,2.1,4.5,7.8,9.999]){
   d.sample('idle',t%3.6,reduced,undefined,t,0);const expected=vertices(d);
   d.sample('idle',(t+10)%3.6,reduced,undefined,t+10,0);const actual=vertices(d);
   expect(Math.max(...actual.map((n,i)=>Math.abs(n-expected[i]!)))).toBeLessThan(.0001);
   expect(d.contactPoints()).toEqual(feet);
  }
  d.sample('idle',0,false,undefined,0,0);const start=vertices(d);
  d.sample('idle',0,false,undefined,10,0);expect(vertices(d)).toEqual(start);
 }finally{d.dispose();}
});
it('retains positive triangle orientation throughout stronger local followers',()=>{
 const d=make(),base=new T.PlaneGeometry(raw.canvas[0],raw.canvas[1],32,32);try{
  const indices=base.index!.array,source=base.attributes.position!.array;
  const area=(a:ArrayLike<number>,i:number)=>{const x=indices[i]!*3,y=indices[i+1]!*3,z=indices[i+2]!*3;return(a[y]!-a[x]!)*(a[z+1]!-a[x+1]!)-(a[y+1]!-a[x+1]!)*(a[z]!-a[x]!);};
  let minimum=Infinity;
  for(let f=0;f<=100;f++){
   d.sample('idle',f/10%3.6,false,undefined,f/10,0);const a=d.geometry.attributes.position!.array;
   for(let i=0;i<indices.length;i+=3)minimum=Math.min(minimum,area(a,i)/area(source,i));
  }
  expect(minimum).toBeGreaterThan(.45);
 }finally{base.dispose();d.dispose();}
});
it('keeps the long expressive closure smooth and fully shut without a cycle-boundary blink',()=>{
 expect(pankoBlink(0)).toBe(0);expect(pankoBlink(10)).toBe(0);
 expect(pankoBlink(1.3)).toBe(1);expect(pankoBlink(1.55)).toBe(1);
 for(const t of [1,1.18,1.58,1.9]){
  const e=.0001,left=(pankoBlink(t)-pankoBlink(t-e))/e,right=(pankoBlink(t+e)-pankoBlink(t))/e;
  expect(Math.abs(right-left)).toBeLessThan(.01);
 }
});
