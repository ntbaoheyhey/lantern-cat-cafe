import * as T from 'three';
import type {Rect} from '../../squad/turn3d/label-layout';

/** Bounded outline copies share the live cut-out geometry; no canvas readback. */
export class CasterFocus {
 readonly root=new T.Group();
 private source?:T.Group;
 private preserveSourceShader=false;
 private copies:{source:T.Mesh;mesh:T.Mesh;dx:number;dy:number;alpha:number}[]=[];
 private tint=new T.Color();
 constructor(){this.root.name='caster-focus-outline';}
 render(source:T.Group|undefined,color:string,amount:number,pixelsToWorld:number,preserveSourceShader=false){
  if(!source||amount<=0){this.root.visible=false;return;}
  if(this.source!==source||this.preserveSourceShader!==preserveSourceShader){
   this.clear();this.source=source;this.preserveSourceShader=preserveSourceShader;
   source.traverse(node=>{if(!(node instanceof T.Mesh))return;
    for(const [dx,dy,alpha] of [[-4,0,.18],[4,0,.18],[0,-4,.18],[0,4,.18],[-2,0,.8],[2,0,.8],[0,-2,.8],[0,2,.8]]){
     const sourceMaterial=node.material as T.MeshBasicMaterial,material=sourceMaterial.clone();
     material.transparent=true;material.depthWrite=false;material.depthTest=false;
     material.onBeforeCompile=(shader,renderer)=>{
      // Commissioned media reconstructs alpha from packed opaque video planes.
      // Preserve that decoder before replacing only the outline's final color.
      if(preserveSourceShader)sourceMaterial.onBeforeCompile(shader,renderer);
      shader.uniforms.focusTint={value:this.tint};
      shader.fragmentShader='uniform vec3 focusTint;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','outgoingLight = focusTint;\n#include <opaque_fragment>');
     };
     material.customProgramCacheKey=()=> preserveSourceShader?`v3-feel-caster-outline:${sourceMaterial.customProgramCacheKey()}`:'v3-feel-caster-outline';
     const mesh=new T.Mesh(node.geometry,material);mesh.matrixAutoUpdate=false;mesh.frustumCulled=false;
     this.root.add(mesh);this.copies.push({source:node,mesh,dx:dx!,dy:dy!,alpha:alpha!});
    }
   });
  }
  this.root.visible=true;this.tint.set(color);
  for(const copy of this.copies){
   // Hidden rig attachments must not reappear through their outline copies.
   let visible=true;
   for(let node:T.Object3D|null=copy.source;node;node=node.parent)visible&&=node.visible;
   copy.mesh.visible=visible;if(!visible)continue;
   const sourceMaterial=copy.source.material as T.MeshBasicMaterial,material=copy.mesh.material as T.MeshBasicMaterial;
   // Drawing swaps change the map on an existing mesh. Keep the alpha mask
   // current while sharing source geometry and texture ownership.
   if(!!material.map!==!!sourceMaterial.map)material.needsUpdate=true;
   material.map=sourceMaterial.map;copy.mesh.geometry=copy.source.geometry;
   copy.mesh.matrix.copy(copy.source.matrixWorld);copy.mesh.matrix.elements[12]!+=copy.dx*pixelsToWorld;copy.mesh.matrix.elements[13]!+=copy.dy*pixelsToWorld;
   copy.mesh.matrixWorldNeedsUpdate=true;copy.mesh.renderOrder=copy.source.renderOrder-.5;
   material.opacity=copy.alpha*amount*sourceMaterial.opacity;
  }
 }
 private clear(){for(const copy of this.copies)(copy.mesh.material as T.Material).dispose();this.root.clear();this.copies=[];this.source=undefined;}
 dispose(){this.clear();this.root.removeFromParent();}
}
const overlap=(a:Rect,b:Rect)=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
/** Prefer a nearby clear side of the caster; never escape the viewport. */
export function focusBannerBox(caster:Rect,width:number,height:number,obstacles:readonly Rect[]):Rect {
 const w=Math.min(230,width-16),h=38;
 const candidates=[{x:caster.x+caster.width+8,y:caster.y+caster.height*.35},{x:caster.x-w-8,y:caster.y+caster.height*.35},{x:caster.x+(caster.width-w)/2,y:caster.y-h-48},{x:caster.x+(caster.width-w)/2,y:caster.y+caster.height+8}].map(p=>({x:Math.max(8,Math.min(width-w-8,p.x)),y:Math.max(8,Math.min(height-h-8,p.y)),width:w,height:h}));
 return candidates.reduce((best,b)=>obstacles.reduce((sum,o)=>sum+overlap(b,o),0)<obstacles.reduce((sum,o)=>sum+overlap(best,o),0)?b:best);
}

/** Keep a title at one chosen location for its action. Idle breathing must not
 * flip it between equally clear sides; a real viewport resize can relayout. */
export class FocusBannerAnchor {
 private key:unknown;
 private width=0;
 private height=0;
 private box?:Rect;
 place(key:unknown,caster:Rect,width:number,height:number,obstacles:readonly Rect[]):Rect {
  if(!this.box||key!==this.key||width!==this.width||height!==this.height){
   const breathingMargin=12;
   const reserved=obstacles.map(r=>({x:r.x-breathingMargin,y:r.y-breathingMargin,width:r.width+2*breathingMargin,height:r.height+2*breathingMargin}));
   this.box=focusBannerBox(caster,width,height,reserved);
   this.key=key;this.width=width;this.height=height;
  }
  return this.box;
 }
}
