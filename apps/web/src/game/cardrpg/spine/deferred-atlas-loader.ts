import * as T from 'three';
import {CutoutMesh,type CutoutData} from '../../rig/cutout';
import {usePaintedAtlasColor} from '../../rig/atlas-color';

/** Drawn actors need rig geometry/sockets immediately, but hidden atlas pixels only on restoration. */
export function deferredRigFactory(data:CutoutData,load:()=>Promise<T.Texture[]>):()=>CutoutMesh {
 // No image also tells optional opacity measurement to use authored bounds until drawings arrive.
 const empty=data.pages.map(()=>new T.Texture());
 let pixels:T.Texture[]|undefined,pending:Promise<T.Texture[]>|undefined;
 const hydrate=()=>pending??=load().then(value=>pixels=value).catch(error=>{pending=undefined;throw error;});
 return()=>{
  const mesh=new CutoutMesh(data,pixels??empty),native=mesh.children.filter((node):node is T.Mesh=>node instanceof T.Mesh);
  const clear=mesh.clearDrawings.bind(mesh),install=mesh.installDrawings.bind(mesh),dispose=mesh.dispose.bind(mesh);
  let disposed=false,installing=false;
  const publish=()=>native.forEach((node,index)=>{
   const material=node.material as T.MeshBasicMaterial;material.map=pixels![index]!;
   usePaintedAtlasColor(material,!!data.pages[index]?.pma);material.needsUpdate=true;
  });
  mesh.clearDrawings=()=>{
   if(disposed||installing||!mesh.drawing){clear();return;}
   if(pixels){publish();clear();return;}
   const drawing=mesh.drawing;
   // Keep the last visible drawing until original pixels are decoded. Failed restoration can retry.
   void hydrate().then(()=>{if(!disposed&&mesh.drawing===drawing){publish();clear();delete mesh.userData.atlasRestoreError;}})
    .catch(error=>{if(!disposed)mesh.userData.atlasRestoreError=String(error);});
  };
  mesh.installDrawings=(...args)=>{installing=true;try{return install(...args);}finally{installing=false;}};
  mesh.dispose=()=>{if(disposed)return;disposed=true;dispose();};
  return mesh;
 };
}
