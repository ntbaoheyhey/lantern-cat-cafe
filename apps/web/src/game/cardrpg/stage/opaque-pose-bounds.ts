import type * as T from 'three';

type Point=[number,number];
type Triangle=[number,number,number];
type Sample={ids:Triangle;weights:Triangle};
type Pixels={width:number;height:number;rgba:Uint8ClampedArray};
export interface OpaqueWorldBounds {x:number;y:number;width:number;height:number}
const textures=new WeakMap<T.Texture,Pixels>();
const geometryHulls=new WeakMap<T.BufferGeometry,WeakMap<T.Texture,Sample[]>>();

function pixels(texture:T.Texture):Pixels|undefined {
 const cached=textures.get(texture);if(cached)return cached;
 const source=texture.image as HTMLImageElement,canvas=document.createElement('canvas');
 canvas.width=source.width;canvas.height=source.height;
 const context=canvas.getContext('2d',{willReadFrequently:true});
 // Pixel measurement is optional; an unavailable backend must not reject valid art.
 if(!context)return undefined;
 context.drawImage(source,0,0);
 const data={width:canvas.width,height:canvas.height,rgba:context.getImageData(0,0,canvas.width,canvas.height).data};
 textures.set(texture,data);return data;
}

/** Input is lexicographically ordered by y then x: two endpoints per row. */
function rowOrderedHull(points:Point[]):Point[] {
 if(points.length<4)return points;
 const cross=(o:Point,a:Point,b:Point)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
 const lower:Point[]=[],upper:Point[]=[];
 for(const p of points){while(lower.length>1&&cross(lower.at(-2)!,lower.at(-1)!,p)<=0)lower.pop();lower.push(p);}
 for(let i=points.length-1;i>=0;i--){const p=points[i]!;while(upper.length>1&&cross(upper.at(-2)!,upper.at(-1)!,p)<=0)upper.pop();upper.push(p);}
 lower.pop();upper.pop();return lower.concat(upper);
}

/** Cache painted-pixel contour weights, not the transparent geometry rectangle.
 * Each triangle is affine, so its convex contour retains every posed extremum.
 * Construction happens on a pose's first measurement; later frames transform points.
 * Method and actual-pixel comparisons: reports/v3-feel/LEARN/Q2.md. */
function samples(mesh:T.Mesh):Sample[] {
 const geometry=mesh.geometry,material=mesh.material;
 if(Array.isArray(material)||!('map' in material))return [];
 const texture=material.map as T.Texture|null,uv=geometry.attributes.uv,index=geometry.index;
 if(!texture||!texture.image||!uv||!index)return [];
 // Drawn poses alternate texture keys on the same mesh. Keep each contour so
 // returning to idle/contact does not scan the painted pixels again.
 let variants=geometryHulls.get(geometry);const cached=variants?.get(texture);if(cached)return cached;
 const data=pixels(texture);if(!data)return [];
 const {width,height,rgba}=data,result:Sample[]=[];
 for(let t=0;t<index.count;t+=3){
  const ids:Triangle=[index.getX(t),index.getX(t+1),index.getX(t+2)];
  const [a,b,c]=ids.map(i=>[uv.getX(i)*width,(texture.flipY?1-uv.getY(i):uv.getY(i))*height] as Point) as [Point,Point,Point];
  const denominator=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
  if(Math.abs(denominator)<1e-8)continue;
  const bcY=b[1]-c[1],cbX=c[0]-b[0],caY=c[1]-a[1],acX=a[0]-c[0];
  const barycentric=(x:number,y:number):Triangle=>{
   const u=(bcY*(x-c[0])+cbX*(y-c[1]))/denominator;
   const v=(caY*(x-c[0])+acX*(y-c[1]))/denominator;
   return[u,v,1-u-v];
  };
  const x0=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),x1=Math.min(width-1,Math.ceil(Math.max(a[0],b[0],c[0])));
  const y0=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),y1=Math.min(height-1,Math.ceil(Math.max(a[1],b[1],c[1]))),edge:Point[]=[];
  for(let y=y0;y<=y1;y++){
   let left=-1,right=-1;const py=y+.5-c[1];
   for(let x=x0;x<=x1;x++){
    if(rgba[(y*width+x)*4+3]!<128)continue;
    // Keep the exact containment tolerance without an array and callback for
    // every painted pixel. Only retained contour vertices need weight arrays.
    const px=x+.5-c[0],u=(bcY*px+cbX*py)/denominator,v=(caY*px+acX*py)/denominator;
    if(u<-.000001||v<-.000001||1-u-v<-.000001)continue;
    left=x;break;
   }
   if(left<0)continue;
   // Only the two row extrema can survive the convex hull. Search backwards
   // for the second endpoint, preserving the exact alpha/containment checks.
   right=left;
   for(let x=x1;x>left;x--){
    if(rgba[(y*width+x)*4+3]!<128)continue;
    const px=x+.5-c[0],u=(bcY*px+cbX*py)/denominator,v=(caY*px+acX*py)/denominator;
    if(u<-.000001||v<-.000001||1-u-v<-.000001)continue;
    right=x;break;
   }
   edge.push([left+.5,y+.5]);if(right!==left)edge.push([right+.5,y+.5]);
  }
  for(const p of rowOrderedHull(edge))result.push({ids,weights:barycentric(...p)});
 }
 if(!variants){variants=new WeakMap();geometryHulls.set(geometry,variants);}variants.set(texture,result);return result;
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
