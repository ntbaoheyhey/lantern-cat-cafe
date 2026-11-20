import * as T from 'three';
import type {RootPose} from './motion';

/** Three pooled after-images share the current painted geometry and atlas. */
export class MotionTrails {
 readonly root=new T.Group();private source?:T.Group;private ghosts:T.Group[]=[];
 constructor(){this.root.name='attack-after-images';}
 render(source:T.Group|undefined,poses:RootPose[],current:RootPose,pixelsToWorld:number){
  if(!source||!['travel','return'].includes(current.phase)){this.root.visible=false;return;}
  if(this.source!==source){this.clear();this.source=source;
   for(let i=0;i<3;i++){
    const ghost=new T.Group(),inverse=source.matrixWorld.clone().invert();
    // A CutoutMesh requires rig data in its constructor. Copy only its visual
    // mesh leaves, sharing geometry instead of cloning the animation runtime.
    source.traverse(node=>{if(node instanceof T.Mesh){const original=node.material as T.MeshBasicMaterial,material=original.clone();material.onBeforeCompile=original.onBeforeCompile;material.customProgramCacheKey=original.customProgramCacheKey;material.opacity=[.24,.16,.08][i]!;material.depthWrite=false;
     const mesh=new T.Mesh(node.geometry,material),relative=new T.Matrix4().multiplyMatrices(inverse,node.matrixWorld);relative.decompose(mesh.position,mesh.quaternion,mesh.scale);mesh.renderOrder=node.renderOrder-1;mesh.frustumCulled=false;ghost.add(mesh);
    }});
    this.ghosts.push(ghost);this.root.add(ghost);
   }
  }
  this.root.visible=true;
  for(let i=0;i<this.ghosts.length;i++){
   const ghost=this.ghosts[i]!,pose=poses[i]!;ghost.visible=pose.phase!=='idle';
   ghost.position.copy(source.position);ghost.position.x+=(pose.x-current.x)*pixelsToWorld;ghost.position.y-=(pose.y-current.y)*pixelsToWorld;
   ghost.scale.copy(source.scale);ghost.rotation.copy(source.rotation);ghost.rotation.z+=current.angle-pose.angle;
  }
 }
 private clear(){for(const ghost of this.ghosts)ghost.traverse(node=>{if(node instanceof T.Mesh)(node.material as T.Material).dispose();});this.root.clear();this.ghosts=[];this.source=undefined;}
 dispose(){this.clear();this.root.removeFromParent();}
}
