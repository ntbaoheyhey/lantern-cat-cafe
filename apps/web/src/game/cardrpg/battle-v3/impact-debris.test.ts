import {expect,it} from 'vitest';
import {paintImpactDebris} from './impact-debris';
function canvas(){
 const points:number[][]=[];let saves=0;
 const flashes:number[][]=[];
 const c={save:()=>saves++,restore:()=>saves--,translate:(x:number,y:number)=>points.push([x,y]),rotate:()=>{},beginPath:()=>{},moveTo:()=>{},lineTo:()=>{},closePath:()=>{},fill:()=>{},stroke:()=>{},createRadialGradient:()=>({addColorStop:()=>{}}),fillRect:(...rect:number[])=>flashes.push(rect)} as unknown as CanvasRenderingContext2D;
 return {c,points,flashes,balance:()=>saves};
}
it('starts only at contact, expires, and respects reduced motion and the low-quality budget',()=>{
 const {c,points,balance}=canvas(),paint=(t:number,reduced=false,low=false)=>paintImpactDebris(c,t,300,400,220,1,['#fff','#f60'],12,1,reduced,low);
 expect(paint(-1)).toBe(0);expect(paint(560)).toBe(0);expect(paint(100,true)).toBe(0);expect(points).toHaveLength(0);
 expect(paint(100,false,true)).toBe(6);expect(paint(100)).toBe(16);expect(balance()).toBe(0);
});
it('limits contact light to two authored frames while fragments keep falling',()=>{
 const {c,flashes,balance}=canvas();
 for(const t of [0,33,67,300])paintImpactDebris(c,t,300,400,220,1,['#ffffff','#ff6600'],12,1,false,false);
 expect(flashes).toHaveLength(2);expect(balance()).toBe(0);
});
it('mirrors the impulse for enemy hits and reproduces the same particles after seeking',()=>{
 const a=canvas(),b=canvas(),again=canvas();
 const draw=(c:CanvasRenderingContext2D,t:number,direction:number)=>paintImpactDebris(c,t,300,400,220,direction,['#fff','#f60'],12,1,false,false);
 draw(a.c,150,1);draw(b.c,150,-1);draw(again.c,400,1);again.points.length=0;draw(again.c,150,1);
 expect(a.points).toEqual(again.points);
 for(let i=0;i<a.points.length;i++){expect(a.points[i]![0]!+b.points[i]![0]!).toBeCloseTo(600);expect(a.points[i]![1]).toBe(b.points[i]![1]);}
});
