import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { animatePainted } from './look-painted';

function actor() {
  const model=new T.Group(),root=new T.Group(),rig=new T.Group();
  root.add(model);model.add(rig);model.userData.lookPainted=true;
  for(const part of ['head','armR','armL','footL','footR']){
    const node=new T.Group();node.name=`paint_${part}`;
    node.position.set(.2,.8,.1);node.userData.paintRest=node.position.toArray();rig.add(node);
  }
  return {model,rig,camera:new T.PerspectiveCamera()};
}

describe('articulated painted battle foes',()=>{
  it.each(['button-guard','yarn-giant'])('recognizes the actual %s cue and recovers to rest',clip=>{
    const {model,rig,camera}=actor(),arm=rig.getObjectByName('paint_armR')!;
    animatePainted(model,camera,0,clip,.25,false);const anticipation=arm.rotation.z;
    animatePainted(model,camera,0,clip,.55,false);const impact=arm.rotation.z;
    expect(anticipation*impact).toBeLessThan(0);
    expect(Math.abs(impact-anticipation)).toBeGreaterThan(.15);
    animatePainted(model,camera,0,clip,1,false);expect(arm.rotation.z).toBeCloseTo(0);
  });
  it('resets a moving foot and body when reduced motion is enabled',()=>{
    const {model,rig,camera}=actor();
    animatePainted(model,camera,1,'yarn-giant',.55,false);
    expect(rig.getObjectByName('paint_footL')!.position.y).toBeGreaterThan(.8);
    animatePainted(model,camera,1,'yarn-giant',.55,true);
    expect(rig.rotation.z).toBe(0);
    for(const node of rig.children){expect(node.position.toArray()).toEqual([.2,.8,.1]);expect(node.rotation.z).toBe(0);}
  });
  it('keeps the actor gesture through step and idle action beats',()=>{
    const {model,rig,camera}=actor(),arm=rig.getObjectByName('paint_armR')!;
    animatePainted(model,camera,0,'step',.4,false,true);
    expect(Math.abs(arm.rotation.z)).toBeGreaterThan(.05);
    animatePainted(model,camera,0,'idle',.78,false,true);
    expect(Math.abs(arm.rotation.z)).toBeGreaterThan(.05);
    animatePainted(model,camera,0,'idle',.78,false,false);
    expect(arm.rotation.z).toBe(0);
  });
});
