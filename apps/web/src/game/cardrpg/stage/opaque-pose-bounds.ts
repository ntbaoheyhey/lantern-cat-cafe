import type * as T from 'three';

type Point=[number,number];
type Triangle=[number,number,number];
type Sample={ids:Triangle;weights:Triangle};
type Pixels={width:number;height:number;rgba:Uint8ClampedArray};
export interface OpaqueWorldBounds {x:number;y:number;width:number;height:number}
const textures=new WeakMap<T.Texture,Pixels>();
const geometryHulls=new WeakMap<T.BufferGeometry,{texture:T.Texture;samples:Sample[]}>();

function pixels(texture:T.Texture):Pixels {
 const cached=textures.get(texture);if(cached)return cached;
 const source=texture.image as HTMLImageElement,canvas=document.createElement('canvas');
 canvas.width=source.width;canvas.height=source.height;
 const context=canvas.getContext('2d',{willReadFrequently:true})!;context.drawImage(source,0,0);
 const data={width:canvas.width,height:canvas.height,rgba:context.getImageData(0,0,canvas.width,canvas.height).data};
 textures.set(texture,data);return data;
}

function convexHull(points:Point[]):Point[] {
 if(points.length<4)return points;
 points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const cross=(o:Point,a:Point,b:Point)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
 const lower:Point[]=[],upper:Point[]=[];
 for(const p of points){while(lower.length>1&&cross(lower.at(-2)!,lower.at(-1)!,p)<=0)lower.pop();lower.push(p);}
 for(let i=points.length-1;i>=0;i--){const p=points[i]!;while(upper.length>1&&cross(upper.at(-2)!,upper.at(-1)!,p)<=0)upper.pop();upper.push(p);}
 lower.pop();upper.pop();return lower.concat(upper);
}

/** Cache painted-pixel contour weights, not the transparent geometry rectangle.
 * Each triangle is affine, so its convex contour retains every posed extremum.
 * Construction happens at asset load; subsequent frames only transform points.
 * Method and actual-pixel comparisons: reports/v3-feel/LEARN/Q2.md. */
function samples(mesh:T.Mesh):Sample[] {
 const geometry=mesh.geometry,material=mesh.material;
 if(Array.isArray(material)||!('map' in material))return [];
 const texture=material.map as T.Texture|null,uv=geometry.attributes.uv,index=geometry.index;
 if(!texture||!texture.image||!uv||!index)return [];
 const cached=geometryHulls.get(geometry);if(cached?.texture===texture)return cached.samples;
 const {width,height,rgba}=pixels(texture),result:Sample[]=[];
 for(let t=0;t<index.count;t+=3){
  const ids:Triangle=[index.getX(t),index.getX(t+1),index.getX(t+2)];
  const [a,b,c]=ids.map(i=>[uv.getX(i)*width,(texture.flipY?1-uv.getY(i):uv.getY(i))*height] as Point) as [Point,Point,Point];
  const denominator=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
  if(Math.abs(denominator)<1e-8)continue;
  const barycentric=(x:number,y:number):Triangle=>{
   const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/denominator;
   const v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/denominator;
   return[u,v,1-u-v];
  };
  const x0=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),x1=Math.min(width-1,Math.ceil(Math.max(a[0],b[0],c[0])));
  const y0=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),y1=Math.min(height-1,Math.ceil(Math.max(a[1],b[1],c[1]))),edge:Point[]=[];
  for(let y=y0;y<=y1;y++){
   let left=-1,right=-1;
   for(let x=x0;x<=x1;x++){
    if(rgba[(y*width+x)*4+3]!<128)continue;
    if(barycentric(x+.5,y+.5).some(weight=>weight<-.000001))continue;
    if(left<0)left=x;right=x;
   }
   if(left>=0){edge.push([left+.5,y+.5]);if(right!==left)edge.push([right+.5,y+.5]);}
  }
  for(const p of convexHull(edge))result.push({ids,weights:barycentric(...p)});
 }
 geometryHulls.set(geometry,{texture,samples:result});return result;
}

/** World-space opacity bounds follow the current skinned vertices and reflection. */
export function opaqueWorldBounds(root:T.Object3D):OpaqueWorldBounds|undefined {
 root.updateMatrixWorld(true);let left=Infinity,right=-Infinity,bottom=Infinity,top=-Infinity;
 root.traverse(node=>{
  const mesh=node as T.Mesh;if(!mesh.isMesh||!mesh.visible)return;
  const positions=mesh.geometry.attributes.position;if(!positions)return;
  const m=mesh.matrixWorld.elements;
  for(const sample of samples(mesh)){
   let x=0,y=0,z=0,visible=false;
   for(let j=0;j<3;j++){
    const index=sample.ids[j]!,weight=sample.weights[j]!,px=positions.getX(index),py=positions.getY(index);
    x+=px*weight;y+=py*weight;z+=positions.getZ(index)*weight;visible ||=px!==0||py!==0;
   }
   // The cut-out renderer collapses hidden attachments to zero vertices.
   if(!visible)continue;
   const wx=m[0]!*x+m[4]!*y+m[8]!*z+m[12]!,wy=m[1]!*x+m[5]!*y+m[9]!*z+m[13]!;
   left=Math.min(left,wx);right=Math.max(right,wx);bottom=Math.min(bottom,wy);top=Math.max(top,wy);
  }
 });
 return Number.isFinite(left+right+bottom+top)?{x:left,y:bottom,width:right-left,height:top-bottom}:undefined;
}
