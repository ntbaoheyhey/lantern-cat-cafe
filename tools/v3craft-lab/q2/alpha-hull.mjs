// Throwaway comparison: texture opacity mapped through current triangle positions.
const textures=new WeakMap(),geometryHulls=new WeakMap();
function pixels(texture){
 let data=textures.get(texture);if(data)return data;
 const image=texture.image,canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
 const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
 data={width:canvas.width,height:canvas.height,rgba:context.getImageData(0,0,canvas.width,canvas.height).data};textures.set(texture,data);return data;
}
function hull(points){
 if(points.length<4)return points;
 points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];
 for(const p of points){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),p)<=0)lo.pop();lo.push(p);}
 for(let i=points.length-1;i>=0;i--){const p=points[i];while(hi.length>1&&cross(hi.at(-2),hi.at(-1),p)<=0)hi.pop();hi.push(p);}
 lo.pop();hi.pop();return lo.concat(hi);
}
function weights(mesh){
 const geometry=mesh.geometry,texture=mesh.material.map;let cached=geometryHulls.get(geometry);if(cached)return cached;
 const uv=geometry.attributes.uv,index=geometry.index;if(!texture||!uv||!index)return [];
 const {width,height,rgba}=pixels(texture),rows=[];
 for(let t=0;t<index.count;t+=3){
  const ids=[index.getX(t),index.getX(t+1),index.getX(t+2)];
  const corners=ids.map(i=>[uv.getX(i)*width,(texture.flipY?1-uv.getY(i):uv.getY(i))*height]);
  const [a,b,c]=corners,den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-8)continue;
  const bary=(x,y)=>{const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den;return[u,v,1-u-v];};
  const x0=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),x1=Math.min(width-1,Math.ceil(Math.max(a[0],b[0],c[0])));
  const y0=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),y1=Math.min(height-1,Math.ceil(Math.max(a[1],b[1],c[1]))),edge=[];
  for(let y=y0;y<=y1;y++){
   let left=-1,right=-1;
   for(let x=x0;x<=x1;x++){
    if(rgba[(y*width+x)*4+3]<128)continue;
    const w=bary(x+.5,y+.5);if(w.some(n=>n<-.000001))continue;
    if(left<0)left=x;right=x;
   }
   if(left>=0){edge.push([left+.5,y+.5]);if(right!==left)edge.push([right+.5,y+.5]);}
  }
  for(const p of hull(edge))rows.push({ids,weights:bary(...p)});
 }
 geometryHulls.set(geometry,rows);return rows;
}
export function alphaWorldBounds(root){
 root.updateMatrixWorld(true);let left=Infinity,right=-Infinity,bottom=Infinity,top=-Infinity,points=0;
 root.traverse(mesh=>{
  if(!mesh.isMesh||!mesh.visible||!mesh.geometry.attributes.position)return;
  const pos=mesh.geometry.attributes.position,m=mesh.matrixWorld.elements;
  for(const r of weights(mesh)){
   let x=0,y=0,z=0,nonzero=false;
   for(let j=0;j<3;j++){const i=r.ids[j],w=r.weights[j];x+=pos.getX(i)*w;y+=pos.getY(i)*w;z+=pos.getZ(i)*w;nonzero ||=pos.getX(i)!==0||pos.getY(i)!==0;}
   if(!nonzero)continue;
   const wx=m[0]*x+m[4]*y+m[8]*z+m[12],wy=m[1]*x+m[5]*y+m[9]*z+m[13];
   left=Math.min(left,wx);right=Math.max(right,wx);bottom=Math.min(bottom,wy);top=Math.max(top,wy);points++;
  }
 });
 return{x:left,y:bottom,width:right-left,height:top-bottom,points};
}
