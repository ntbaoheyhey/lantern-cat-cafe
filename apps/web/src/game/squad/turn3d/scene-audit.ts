import * as T from 'three';
import {intersects,type Rect} from './label-layout';
/** Capture-only conservative mesh bounds: includes visible gear, excludes hidden props. */
export function screenBounds(model:T.Object3D,camera:T.Camera,width:number,height:number):Rect {
 let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
 const point=new T.Vector3();
 model.updateWorldMatrix(true,true);
 model.traverseVisible(node=>{
  if(!(node instanceof T.Mesh))return;
  const geometry=node.geometry as T.BufferGeometry;
  if(!geometry.boundingBox)geometry.computeBoundingBox();
  const b=geometry.boundingBox;if(!b)return;
  for(let corner=0;corner<8;corner++){
   point.set(corner&1?b.max.x:b.min.x,corner&2?b.max.y:b.min.y,corner&4?b.max.z:b.min.z).applyMatrix4(node.matrixWorld).project(camera);
   const x=(point.x*.5+.5)*width,y=(-point.y*.5+.5)*height;
   left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
 });
 return {x:left,y:top,width:right-left,height:bottom-top};
}
export function auditBounds(units:{id:string;side:string;role:string;box:Rect;yaw:number}[],width:number,height:number){
 const overlaps:string[][]=[];
 for(let i=0;i<units.length;i++)for(let j=i+1;j<units.length;j++)if(intersects(units[i]!.box,units[j]!.box,0))overlaps.push([units[i]!.id,units[j]!.id]);
 return {width,height,units,overlaps,outside:units.filter(({box:b})=>b.x<0||b.y<0||b.x+b.width>width||b.y+b.height>height).map(u=>u.id)};
}
