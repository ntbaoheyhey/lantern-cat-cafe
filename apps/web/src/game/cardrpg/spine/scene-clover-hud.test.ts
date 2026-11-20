import {expect,it,vi} from 'vitest';
import * as T from 'three';
import type {SceneView,Anchor} from '../../squad/turn3d/scene';
import {SpineScene} from './scene';

function fixture(asset:string,prepared:boolean,formation=true){
 const root=new T.Group(),hp=new T.Object3D(),head=new T.Object3D(),feet=new T.Object3D();root.add(hp,head,feet);
 hp.position.set(0,220,0);head.position.set(18,110,0);root.position.set(-180,-80,0);root.updateMatrixWorld(true);
 const camera=new T.OrthographicCamera(-640,640,360,-360,-100,100);camera.position.z=10;camera.updateMatrixWorld();camera.updateProjectionMatrix();
 const actor={root,designerIdle:prepared,socket:(name:string,out:T.Vector3)=>(name==='hpAnchor'?hp:name==='head'?head:feet).getWorldPosition(out)};
 const body={x:360,y:240,width:200,height:220},face={x:445,y:240,width:65,height:65};
 const scene=Object.assign(Object.create(SpineScene.prototype),{camera,width:1280,height:720,scratch:new T.Vector3(),anchors:[],actors:new Map([['unit',{asset,actor}]]),bounds:()=>body,faceBounds:()=>face,labelAudit:{heads:[],cards:[],missing:[],overlaps:0},onAnchors:vi.fn()}) as {projectAnchors:(view:SceneView)=>void;anchors:(Anchor&{labelTarget?:{x:number;y:number;avoid:typeof body}})[]};
 scene.projectAnchors({actors:[{id:'unit',hp:100,side:'party'}],formationC2:formation} as unknown as SceneView);
 const p=hp.getWorldPosition(new T.Vector3()).project(camera);return{anchor:scene.anchors[0]!,body,projected:{x:(p.x+1)*640,y:(1-p.y)*360}};
}
it.each([['clover',5],['mochi',0]] as const)('carries the prepared %s HP socket and body independently from its face-side legacy anchor',(asset,tailClearance)=>{
 const f=fixture(asset,true);expect(f.anchor.labelTarget).toEqual({x:f.projected.x,y:f.projected.y+tailClearance,avoid:f.body});
 expect(f.anchor.labelX).toBe(f.anchor.x);expect(f.anchor.labelY).toBe(f.body.y-9);
});
it.each([['clover',false,true],['mochi',false,true],['clover',true,false],['mochi',true,false],['panko',true,true]] as const)('retains ordinary label routing for %s prepared=%s formation=%s',(asset,prepared,formation)=>{
 expect(fixture(asset,prepared,formation).anchor.labelTarget).toBeUndefined();
});
