import {describe,it,expect} from 'vitest';
import {formationPoint,restYaw,targetYaw,blendYaw,stageHeight} from './formation';
describe('desktop formation and facing',()=>{
 it('keeps every enemy on its own half and all slots unique',()=>{
  const heroes=Array.from({length:3},(_,slot)=>formationPoint({side:'party',role:'guardian',slot}));
  const enemies=Array.from({length:6},(_,slot)=>formationPoint({side:'enemy',role:'guard',slot}));
  expect(heroes.every(p=>p.x<0)).toBe(true);expect(enemies.every(p=>p.x>0)).toBe(true);
  expect(new Set([...heroes,...enemies].map(p=>`${p.x},${p.z}`)).size).toBe(9);
  for(let slot=0;slot<2;slot++)expect(formationPoint({side:'enemy',role:'thread',slot},true).x).toBeGreaterThan(0);
 });
 it('faces the opposing half at 25–40 degrees in every rest slot',()=>{
  for(const side of ['party','enemy'] as const)for(let slot=0;slot<(side==='party'?3:6);slot++){
   const degrees=Math.abs(restYaw(side))*180/Math.PI;
   expect(degrees).toBeGreaterThanOrEqual(25);expect(degrees).toBeLessThanOrEqual(40);
   expect(Math.sign(Math.sin(restYaw(side)))).toBe(side==='party'?1:-1);
  }
 });
 it('turns to each possible opposing target along the short arc and returns',()=>{
  for(let h=0;h<3;h++)for(let e=0;e<6;e++){
   const a=formationPoint({side:'party',role:'guardian',slot:h}),b=formationPoint({side:'enemy',role:'guard',slot:e});
   for(const [source,target,side] of [[a,b,'party'],[b,a,'enemy']] as const){
    const yaw=targetYaw(source,target),facing={x:Math.sin(yaw),z:Math.cos(yaw)},dx=target.x-source.x,dz=target.z-source.z;
    expect((facing.x*dx+facing.z*dz)/Math.hypot(dx,dz)).toBeCloseTo(1,8);
    expect(Math.abs(blendYaw(restYaw(side),yaw,.5)-restYaw(side))).toBeLessThanOrEqual(Math.PI/2);
    expect(blendYaw(restYaw(side),yaw,0)).toBe(restYaw(side));
   }
  }
 });
 it('protects vertical framing at every desktop aspect',()=>{
  for(const aspect of [1.6,2,2.8,3.8]){expect(stageHeight(aspect)).toBeGreaterThanOrEqual(4.4);expect(stageHeight(aspect)*aspect).toBeGreaterThanOrEqual(14)}
 });
});
