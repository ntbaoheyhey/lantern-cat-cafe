import {expect,it} from 'vitest';
import * as T from 'three';
import {SpineScene} from './scene';

function fixture(asset='clover',prepared=true,drawn=false){
 const root=new T.Group(),spout=new T.Object3D(),grip=new T.Object3D();root.add(spout,grip);
 root.position.set(42,96,0);root.rotation.z=.07;grip.position.set(125,220,1);spout.position.set(205,330,1);
 const camera=new T.OrthographicCamera(-640,640,360,-360,-100,100);camera.position.z=10;camera.updateMatrixWorld();camera.updateProjectionMatrix();
 const actor={root,designerIdle:prepared,socket:(name:string,target:T.Vector3)=>(name==='vfxOrigin'?spout:grip).getWorldPosition(target)};
 const scene=Object.assign(Object.create(SpineScene.prototype),{camera,width:1280,height:720,scratch:new T.Vector3(),actors:new Map([['unit',{asset,actor,craftPose:drawn?{}:undefined}]])}) as {
  craftSource:(id:string)=>{x:number;y:number}|undefined;
 };
 const project=(object:T.Object3D)=>{const p=object.getWorldPosition(new T.Vector3()).project(camera);return{x:(p.x+1)*640,y:(1-p.y)*360};};
 return{root,spout,grip,scene,project};
}

it.each([1,-1])('keeps the prepared Clover emission on its independently moving spout with facing %s',facing=>{
 const {root,spout,grip,scene,project}=fixture();root.scale.set(.4*facing,.4,.4);
 for(const [x,y] of [[205,330],[213,315],[198,339]]){
  spout.position.set(x!,y!,1);root.updateMatrixWorld(true);
  const actual=scene.craftSource('unit')!;
  expect(actual.x).toBeCloseTo(project(spout).x,9);expect(actual.y).toBeCloseTo(project(spout).y,9);
  expect(Math.hypot(actual.x-project(grip).x,actual.y-project(grip).y)).toBeGreaterThan(40);
 }
});
it.each([['clover',false],['mochi',true]] as const)('retains the existing grip origin for %s prepared=%s', (asset,prepared)=>{
 const {root,spout,grip,scene,project}=fixture(asset,prepared);root.updateMatrixWorld(true);
 expect(scene.craftSource('unit')).toEqual(project(grip));spout.position.x+=40;root.updateMatrixWorld(true);
 expect(scene.craftSource('unit')).toEqual(project(grip));
});
it('retains authored drawn origins and returns no point for a missing actor',()=>{
 const {root,spout,scene,project}=fixture('panko',false,true);root.updateMatrixWorld(true);
 expect(scene.craftSource('unit')).toEqual(project(spout));expect(scene.craftSource('missing')).toBeUndefined();
});
