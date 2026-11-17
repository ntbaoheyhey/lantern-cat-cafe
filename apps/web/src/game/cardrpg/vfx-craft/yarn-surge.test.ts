import {expect,it,vi} from 'vitest';
import {Mesh,ShaderMaterial} from 'three';
import {YarnSurge,type YarnFrame} from './yarn-surge';
vi.mock('../spine/craft-image-loader',()=>({loadCraftImage:async()=>({width:4,height:4})}));
const frame=(elapsed:number,ultimate=true,reducedMotion=false):YarnFrame=>({elapsed,ultimate,reducedMotion,width:1280,height:720,worldWidth:1280,worldHeight:720,source:{x:700,y:320},layoutSource:{x:700,y:320},home:{x:920,y:548},casterFeet:{x:850,y:605},targets:[{x:220,y:300},{x:400,y:510}],feet:[{x:220,y:500},{x:400,y:610}],faces:[{x:190,y:270,width:60,height:60}],rearOrder:3,frontOrder:20});
const mesh=(effect:YarnSurge)=>effect.rear.children[0] as Mesh;
const alpha=(effect:YarnSurge)=>(mesh(effect).material as ShaderMaterial).uniforms.uAlpha!.value as number;
it('keeps a low fan, full contact and recovery clear by1760ms',async()=>{
 const effect=new YarnSurge();await effect.ready;
 for(const reduced of [false,true]){
  effect.render(frame(1100,true,reduced));expect(mesh(effect).scale.x).toBe(860);expect(Math.abs(mesh(effect).scale.y)).toBe(268);expect(alpha(effect)).toBe(1);expect(effect.audit.socketError).toBe(0);
  effect.render(frame(1550,true,reduced));expect(alpha(effect)).toBeCloseTo(.40673828125);effect.render(frame(1760,true,reduced));expect(mesh(effect).visible).toBe(false);expect(effect.audit.active).toBe(0);
 }
 effect.dispose();
});
it('preserves exact basic and ultimate source contacts and unit-face protection',async()=>{
 const effect=new YarnSurge();await effect.ready;
 for(const [ultimate,elapsed]of [[false,350],[true,1100]] as const){effect.render(frame(elapsed,ultimate));expect(effect.audit.paintedTip).toEqual({x:700,y:320});expect(effect.audit.active).toBeGreaterThan(0);expect((mesh(effect).material as ShaderMaterial).uniforms.uFaceCount!.value).toBe(1);}
 effect.render(frame(800,false));expect(effect.front.visible).toBe(false);effect.render(frame(2200));expect(effect.rear.visible).toBe(false);effect.dispose();
});
it('clamps the fan inside a narrow desktop stage without changing its source',async()=>{
 const effect=new YarnSurge();await effect.ready;effect.render({...frame(1100),width:800,source:{x:790,y:300}});const m=mesh(effect);
 expect(m.position.x-m.scale.x/2).toBeGreaterThanOrEqual(16);expect(m.position.x+m.scale.x/2).toBeLessThanOrEqual(784);expect(effect.audit.socketError).toBe(0);effect.dispose();
});
