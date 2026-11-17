import {expect,it} from 'vitest';
import * as T from 'three';
import {DrawingLayer,type DrawingManifest} from './drawing-layer';
import {SecondaryMotion,SECONDARY_SPRINGS,blinkStart,seededBlink,motionSeed,springImpulse,springWave} from './secondary-motion';
import mochi from '../../../public/units/mochi/poses/manifest.json';
import soot from '../../../public/units/soot/poses/manifest.json';
import clover from '../../../public/units/clover/poses/manifest.json';
import panko from '../../../public/units/panko/poses/manifest.json';
import yarn from '../../../public/units/yarn-giant/poses/manifest.json';

function layer(raw:unknown){const manifest=raw as DrawingManifest;
 return new DrawingLayer({manifest,textures:Object.fromEntries(Object.keys(manifest.poses).map(k=>[k,new T.Texture()]))},[17,23],1);
}
function frameHash(mesh:DrawingLayer){
 const vertices=mesh.geometry.attributes.position!.array as Float32Array,words=new Uint32Array(vertices.buffer,vertices.byteOffset,vertices.length);
 let hash=2166136261;for(const word of words)hash=Math.imul(hash^word,16777619);
 return [hash,mesh.secondary.leftBlink,mesh.secondary.rightBlink];
}
it.each([mochi,soot,clover,panko,yarn])('replays the same three-second visible idle and pins both feet: $unit',manifest=>{
 const a=layer(manifest),b=layer(manifest);
 try{
  const feet=a.contactPoints(),frames:ReturnType<typeof frameHash>[]=[];
  for(let n=0;n<=180;n++){
   const t=n/60;a.sample('idle',t,false,undefined,t,.6);b.sample('idle',t,false,undefined,t,.6);
   expect(frameHash(a)).toEqual(frameHash(b));frames.push(frameHash(a));
   a.contactPoints().forEach((p,i)=>expect(Math.hypot(p.x-feet[i]!.x,p.y-feet[i]!.y)).toBeLessThanOrEqual(1));
  }
  expect(new Set(frames.map(f=>f[0])).size).toBeGreaterThan(150);
  a.sample('hurt',.1,false,.1,20,-1);
  for(let n=180;n>=0;n--){a.sample('idle',n/60,false,undefined,n/60,.6);expect(frameHash(a)).toEqual(frames[n]);}
 }finally{a.dispose();b.dispose();}
});
it('keeps seeded blink intervals inside two to six seconds and closes at each scheduled blink',()=>{
 for(const owner of ['mochi','soot','clover','panko','yarn-giant']){
  const seed=motionSeed(owner);expect(blinkStart(seed,0)).toBeGreaterThanOrEqual(2);
  for(let i=0;i<100;i++){
   const at=blinkStart(seed,i),interval=blinkStart(seed,i+1)-at;
   expect(interval).toBeGreaterThanOrEqual(2);expect(interval).toBeLessThanOrEqual(6);
   expect(seededBlink(at+.06,seed)).toBeCloseTo(1);expect(seededBlink(at+.3,seed)).toBe(0);
  }
 }
 expect(blinkStart(motionSeed('mochi'),0)).not.toBe(blinkStart(motionSeed('soot'),0));
});
it('delays each spring, overshoots and settles without a frame-step history',()=>{
 for(const spec of Object.values(SECONDARY_SPRINGS)){
  expect(springImpulse(spec.delay,spec)).toBe(0);
  const samples=Array.from({length:181},(_,i)=>springImpulse(i/60,spec));
  expect(Math.max(...samples)).toBeGreaterThan(.2);expect(Math.min(...samples)).toBeLessThan(0);
  expect(Math.abs(springImpulse(2,spec))).toBeLessThan(.001);
  expect(samples.every(Number.isFinite)).toBe(true);
 }
 expect(springWave(1,2,0,SECONDARY_SPRINGS.tail)).not.toBe(springWave(1,2,0,SECONDARY_SPRINGS.ear));
});
it('turns the head toward the target, winks on crit, flattens ears on hit, and attenuates reduced motion',()=>{
 const a=layer(mochi),m=new SecondaryMotion('mochi');
 try{
  const face=a.frame.sockets.head!;
  a.sample('idle',1,false,undefined,1,-1);const left=a.point(face).x;
  a.sample('idle',1,false,undefined,1,1);expect(a.point(face).x-left).toBeGreaterThan(2);
  m.sample(1,'attack',.5,false,1,-1,.1);expect(m.leftBlink).toBeGreaterThan(.9);expect(m.rightBlink).toBe(0);
  m.sample(1,'hurt',.05,false,1,.05);expect(m.earFlatten).toBeGreaterThan(.8);
  m.sample(1,'hurt',.5,false,1,.5);expect(m.earFlatten).toBe(0);
  m.sample(1,'hurt',.05,true,1,.05);expect([m.look,m.earFlatten,m.hair,m.ear,m.accessory]).toEqual([0,0,0,0,0]);
 }finally{a.dispose();}
});
