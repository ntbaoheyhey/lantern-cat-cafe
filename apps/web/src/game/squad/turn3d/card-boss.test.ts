import { expect, it } from 'vitest';
import * as T from 'three';
import { bossPerformance, CardBossAtmosphere, BOSS_STYLES } from './card-boss-performance';
import { cardClipDefinitions, sampleCardPose } from './card-motion';
it('keeps boss introductions and phase changes inside existing presentation budgets',()=>{
 for(const asset of Object.keys(BOSS_STYLES)){
  const clips=cardClipDefinitions(asset);
  for(const name of ['boss-intro','boss-phase']){
   const clip=clips.find(c=>c.id===name)!;expect(clip).toBeDefined();
   expect(sampleCardPose(clip,0)).toEqual(sampleCardPose(clip,1));
  }
 }
 expect(bossPerformance(1.14,10,false)).toBeNull();
 expect(bossPerformance(10,.3,false)).toBeNull();
 expect(bossPerformance(.3,-100,false)?.clip).toBe('boss-intro');
 expect(bossPerformance(10,.15,false)).toEqual({clip:'boss-phase',progress:.5});
 for(const [age,phase]of [[.2,-100],[20,.1],[1,0]])expect(bossPerformance(age!,phase!,true)).toBeNull();
});
it('uses one instanced boss draw, allocates no new objects while updating, and releases resources',()=>{
 const fx=new CardBossAtmosphere();let geometries=0,materials=0;
 for(const node of fx.root.children){const mesh=node as T.InstancedMesh<T.BufferGeometry,T.MeshBasicMaterial>;mesh.geometry.addEventListener('dispose',()=>geometries++);mesh.material.addEventListener('dispose',()=>materials++);}
 const objects=fx.root.children.map(node=>node.uuid),point=new T.Vector3(2,0,0);
 for(const asset of Object.keys(BOSS_STYLES))for(let i=0;i<60;i++){
  fx.update(asset,point,i>30?2:1,i/60,false);
  expect(fx.root.children.filter(o=>o.visible)).toHaveLength(1);
  expect(fx.root.children.map(o=>o.uuid)).toEqual(objects);
 }
 fx.update(undefined,undefined,1,0,false);expect(fx.root.children.every(o=>!o.visible)).toBe(true);
 fx.dispose();fx.dispose();expect(geometries).toBe(3);expect(materials).toBe(3);
});
