import {expect,it,vi} from 'vitest';
import type {Mesh,PlaneGeometry,ShaderMaterial} from 'three';
import {ThreadSnare,type ThreadFrame} from './thread-snare';
vi.mock('../spine/craft-image-loader',()=>({loadCraftImage:async()=>({width:768,height:139})}));
const frame=(elapsed=1280):ThreadFrame=>({elapsed,ultimate:true,width:1280,height:720,worldWidth:1280,worldHeight:720,source:{x:900,y:300},layoutSource:{x:900,y:300},targets:[{x:300,y:350}],feet:[{x:300,y:500}],faces:[],rearOrder:1,frontOrder:2,reducedMotion:false});
type Strand=Mesh<PlaneGeometry,ShaderMaterial>;
const strands=(effect:ThreadSnare)=>effect.rear.children as Strand[];
const endpoints=(effect:ThreadSnare)=>strands(effect).flatMap(m=>[-1,1].map(d=>({x:m.position.x+d*Math.cos(m.rotation.z)*m.scale.x/2,y:m.position.y+d*Math.sin(m.rotation.z)*m.scale.x/2})));

it('centres a single-target weave on the victim without covering a second lane',async()=>{
 const e=new ThreadSnare();await e.ready;e.render(frame());
 const points=endpoints(e),xs=points.map(p=>p.x),ys=points.map(p=>p.y);
 expect(Math.max(...xs)-Math.min(...xs)).toBeLessThanOrEqual(380.001);
 expect(Math.max(...ys)-Math.min(...ys)).toBeLessThanOrEqual(280.001);
 expect((Math.min(...xs)+Math.max(...xs))/2).toBeCloseTo(300);
 expect((Math.min(...ys)+Math.max(...ys))/2).toBeCloseTo(350);
 expect(strands(e).filter(m=>m.visible)).toHaveLength(12);e.dispose();
});

it('expands only with actual recipients while retaining thin strands',async()=>{
 const e=new ThreadSnare();await e.ready;const f=frame();f.targets.push({x:650,y:510});e.render(f);
 const points=endpoints(e),xs=points.map(p=>p.x),ys=points.map(p=>p.y);
 expect(Math.min(...xs)).toBeLessThan(300);expect(Math.max(...xs)).toBeGreaterThan(650);
 expect(Math.min(...ys)).toBeLessThan(350);expect(Math.max(...ys)).toBeGreaterThan(510);
 for(const strand of strands(e))expect(Math.abs(strand.scale.y)).toBe(18);
 e.dispose();
});

it('clears the net during recovery and preserves the local wrap and basic',async()=>{
 const e=new ThreadSnare();await e.ready;
 e.render(frame(1099));expect(strands(e).some(m=>m.visible)).toBe(false);
 e.render(frame(1280));expect(strands(e).some(m=>m.visible)).toBe(true);
 e.render(frame(1640));expect(strands(e).some(m=>m.visible)).toBe(false);expect(e.front.children.some(m=>m.visible)).toBe(true);
 e.render({...frame(350),ultimate:false});expect(strands(e).some(m=>m.visible)).toBe(false);expect(e.front.children.some(m=>m.visible)).toBe(true);
 e.render(frame(2200));expect(e.rear.visible).toBe(false);e.dispose();
});
