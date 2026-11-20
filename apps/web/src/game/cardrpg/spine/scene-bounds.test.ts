import {expect,it} from 'vitest';
import * as T from 'three';
import {SpineScene} from './scene';

it('keeps the full silhouette bounds through spins and mirrored nonuniform scales',()=>{
 const camera=new T.OrthographicCamera(-640,640,360,-360,.1,1000);
 camera.position.set(0,0,100);camera.updateProjectionMatrix();camera.updateMatrixWorld();
 const scene=Object.assign(Object.create(SpineScene.prototype),{camera,width:1280,height:720,scratch:new T.Vector3()}) as {bounds:(entry:unknown)=>{x:number;y:number;width:number;height:number}};
 const root=new T.Group(),bounds={x:-50,y:-50,width:100,height:100};
 for(const angle of [Math.PI/4,Math.PI/2,Math.PI*3/4,Math.PI*1.9])for(const sx of [1,-1.2]){
  root.rotation.z=angle;root.scale.set(sx,.9,1);root.updateMatrixWorld(true);
  const box=scene.bounds({actor:{root,bounds}}),expectedWidth=100*(Math.abs(Math.cos(angle)*sx)+Math.abs(Math.sin(angle)*.9)),expectedHeight=100*(Math.abs(Math.sin(angle)*sx)+Math.abs(Math.cos(angle)*.9));
  expect(box.width).toBeCloseTo(expectedWidth,8);expect(box.height).toBeCloseTo(expectedHeight,8);
  expect(box.x+box.width/2).toBeCloseTo(640,8);expect(box.y+box.height/2).toBeCloseTo(360,8);
 }
});
