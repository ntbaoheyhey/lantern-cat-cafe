import {expect,it} from 'vitest';
import * as T from 'three';
import {MotionTrails} from './motion-trails';
import {neutralPose} from './motion';

it('places three after-images along the previous arc with the renderer rotation convention',()=>{
 const source=new T.Group(),geometry=new T.PlaneGeometry(1,1),material=new T.MeshBasicMaterial();
 source.add(new T.Mesh(geometry,material));source.position.set(30,20,0);source.rotation.z=.2;source.updateMatrixWorld(true);
 const current={...neutralPose(),phase:'travel' as const,x:100,y:-20,angle:-.2};
 const poses=[.05,.1,.15].map((angle,i)=>({...current,x:70+i*10,y:-5-i*5,angle:-angle}));
 const trails=new MotionTrails();trails.render(source,poses,current,1);
 expect(trails.root.children).toHaveLength(3);
 for(const [i,ghost] of trails.root.children.entries()){
  expect(ghost.rotation.z).toBeCloseTo([.05,.1,.15][i]!);
  expect(ghost.position.x).toBeCloseTo(i*10);
  expect(ghost.position.y).toBeCloseTo(5+i*5);
  expect((ghost.children[0] as T.Mesh).geometry).toBe(geometry);
 }
 expect(source.rotation.z).toBe(.2);expect(source.position.x).toBe(30);
 trails.render(source,poses,{...current,phase:'idle'},1);expect(trails.root.visible).toBe(false);
 trails.dispose();geometry.dispose();material.dispose();
});
