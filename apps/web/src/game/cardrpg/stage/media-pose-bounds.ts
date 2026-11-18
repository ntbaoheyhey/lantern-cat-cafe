import type * as T from 'three';
import {hasDesignerIdleBody} from '../spine/designer-idle-body';
import {opaqueWorldBounds,type OpaqueWorldBounds} from './opaque-pose-bounds';

type Weights=[number,number,number];
type Vertex={u:number;v:number;weights:Weights};
type Sample={ids:Weights;weights:Weights};
type Manifest={width:number;height:number;opaqueBounds?:[number,number,number,number]};
type MediaActor={root:T.Object3D;designerMedia?:{media:{plane:T.Mesh;manifest:Manifest}}};
type Contour={key:string;uv:unknown;index:unknown;uvVersion:number;indexVersion:number;samples:Sample[]};
const contours=new WeakMap<T.BufferGeometry,Contour>();

function clip(input:Vertex[],axis:'u'|'v',edge:number,sign:number):Vertex[]{
 if(!input.length)return input;
 const result:Vertex[]=[];let a=input.at(-1)!;
 for(const b of input){
  const insideA=(a[axis]-edge)*sign>=0,insideB=(b[axis]-edge)*sign>=0;
  if(insideA!==insideB){
   const t=(edge-a[axis])/(b[axis]-a[axis]);
   result.push({u:a.u+(b.u-a.u)*t,v:a.v+(b.v-a.v)*t,
    weights:[0,1,2].map(i=>a.weights[i]!+(b.weights[i]!-a.weights[i]!)*t) as Weights});
  }
  if(insideB)result.push(b);a=b;
 }
 return result;
}

/** The declared logical silhouette envelope, clipped to the actual cast triangles.
 * Packed video pixels contain data planes, not ordinary RGBA. Never scan them.
 * Each triangle is affine, so its clipped polygon vertices contain all extrema. */
export function measuredMediaWorldBounds(mesh:T.Mesh,manifest:Manifest):OpaqueWorldBounds|undefined {
 const {width,height,opaqueBounds:b}=manifest,geometry=mesh.geometry,uv=geometry.attributes.uv,index=geometry.index;
 if(!mesh.visible||!uv||!index||!b||!Number.isFinite(width+height)||width<=0||height<=0
  ||!b.every(Number.isFinite)||b[0]<0||b[1]<0||b[2]<=b[0]||b[3]<=b[1]||b[2]>width||b[3]>height)return undefined;
 const key=[width,height,...b].join(','),uvVersion='data' in uv?uv.data.version:uv.version;
 let contour=contours.get(geometry);
 if(!contour||contour.key!==key||contour.uv!==uv||contour.index!==index||contour.uvVersion!==uvVersion||contour.indexVersion!==index.version){
  const samples:Sample[]=[];
  for(let t=0;t<index.count;t+=3){
   const ids:Weights=[index.getX(t),index.getX(t+1),index.getX(t+2)];
   let polygon=ids.map((id,i)=>({u:uv.getX(id),v:uv.getY(id),weights:[i===0?1:0,i===1?1:0,i===2?1:0] as Weights}));
   polygon=clip(polygon,'u',b[0]/width,1);polygon=clip(polygon,'u',b[2]/width,-1);
   polygon=clip(polygon,'v',1-b[3]/height,1);polygon=clip(polygon,'v',1-b[1]/height,-1);
   for(const p of polygon)samples.push({ids,weights:p.weights});
  }
  contour={key,uv,index,uvVersion,indexVersion:index.version,samples};contours.set(geometry,contour);
 }
 const positions=geometry.attributes.position;if(!positions)return undefined;
 mesh.updateWorldMatrix(true,false);const m=mesh.matrixWorld.elements;
 let left=Infinity,right=-Infinity,bottom=Infinity,top=-Infinity;
 for(const {ids,weights} of contour.samples){
  let x=0,y=0,z=0;
  for(let i=0;i<3;i++){const id=ids[i]!,w=weights[i]!;x+=positions.getX(id)*w;y+=positions.getY(id)*w;z+=positions.getZ(id)*w;}
  const wx=m[0]!*x+m[4]!*y+m[8]!*z+m[12]!,wy=m[1]!*x+m[5]!*y+m[9]!*z+m[13]!;
  left=Math.min(left,wx);right=Math.max(right,wx);bottom=Math.min(bottom,wy);top=Math.max(top,wy);
 }
 return Number.isFinite(left+right+bottom+top)?{x:left,y:bottom,width:right-left,height:top-bottom}:undefined;
}

export function actorOpaqueWorldBounds(asset:string,actor:{root:T.Object3D}):OpaqueWorldBounds|undefined {
 if(!hasDesignerIdleBody(asset,actor))return opaqueWorldBounds(actor.root);
 const media=(actor as MediaActor).designerMedia?.media;
 return media?measuredMediaWorldBounds(media.plane,media.manifest):undefined;
}
