/** Local acceptance viewer; imported only by the review harness, never by gameplay. */
import * as T from 'three';
import {loadSpineActor,type SpineActor} from './assets';
import {SPINE_UNIT_BY_ID,type AcceptedSkeleton} from './config';
export class SpineReview {
 readonly scene=new T.Scene();readonly camera=new T.OrthographicCamera(-600,600,1100,-400,.1,1000);
 readonly renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
 actor?:SpineActor;private serial=0;
 constructor(host:HTMLElement){this.renderer.setSize(320,400);this.renderer.setPixelRatio(1);this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.NoToneMapping;this.camera.position.z=100;host.appendChild(this.renderer.domElement);}
 async load(id:string,override?:AcceptedSkeleton){
  this.actor?.dispose();const unit=SPINE_UNIT_BY_ID.get(id)!;const previous=unit.placeholder;
  try{if(override)unit.placeholder={...previous,...override};this.actor=await loadSpineActor(id,'placeholder');}finally{unit.placeholder=previous;}
  this.scene.add(this.actor.root);this.actor.setOrder(1);this.pose('idle',0);return {id,source:this.actor.source,warnings:this.actor.root.userData.intakeWarnings,bounds:this.actor.bounds,animations:[...this.actor.clips.keys()]};
 }
 pose(name:string,progress:number){const actor=this.actor!;actor.mesh?.state.clearTracks();actor.mesh?.skeleton.setToSetupPose();actor.sample(name,++this.serial,actor.duration(name)*progress,0,this.camera,true);const bounds=actor.mesh?.skeleton.getBoundsRect();this.camera.position.y=bounds?Math.min(0,bounds.y+350):0;this.renderer.render(this.scene,this.camera);return [...actor.boneRefs].map(([name,bone])=>({name,x:bone.worldX,y:bone.worldY}));}
 dispose(){this.actor?.dispose();this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove();}
}
