/** Browser-only experiment: retain exact original grid vertices/UVs/triangles. */
export async function installOuterCellPrototype(page,{active=true,padding=2,fullControl=false,preserveSlots=false}={}){
 return page.evaluate(async ({active,padding,fullControl,preserveSlots})=>{
  const T=await import('/node_modules/.vite/deps/three.js'),s=window.__depthScene;
  cancelAnimationFrame(s.raf);const variants=[],details=[];
  for(const [actorId,e]of s.actors){
   const d=e.craftPose?.drawing;if(!d)continue;
   const m=d.set.manifest,[w,h]=m.canvas,poses=Object.values(m.poses),bounds=poses.map(p=>p.opaqueBounds);
   const dimensionsMatch=Object.values(d.set.textures).every(t=>t.image?.width===w&&t.image?.height===h);
   const valid=Number.isSafeInteger(w)&&w>0&&Number.isSafeInteger(h)&&h>0&&bounds.length>0&&bounds.every(b=>Array.isArray(b)&&b.length===4&&b.every(Number.isSafeInteger)&&b[0]>=0&&b[1]>=0&&b[2]>b[0]&&b[3]>b[1]&&b[2]<=w&&b[3]<=h);
   const grid=valid&&dimensionsMatch&&!fullControl?[Math.max(0,Math.floor(Math.min(...bounds.map(b=>b[0]))*32/w)-padding),Math.max(0,Math.floor(Math.min(...bounds.map(b=>b[1]))*32/h)-padding),Math.min(32,Math.ceil(Math.max(...bounds.map(b=>b[2]))*32/w)+padding),Math.min(32,Math.ceil(Math.max(...bounds.map(b=>b[3]))*32/h)+padding)]:[0,0,32,32];
   if(d.source.length!==33*33*3)throw Error('Unexpected source grid: '+m.unit);
   const full={geometry:d.geometry,source:d.source,weights:d.vertexWeights},ids=[],remap=new Map();
   for(let y=grid[1];y<=grid[3];y++)for(let x=grid[0];x<=grid[2];x++){const old=y*33+x;remap.set(old,ids.length);ids.push(old);}
   const geometry=new T.BufferGeometry(),source=new Float32Array(ids.length*3);
   for(const [name,a]of Object.entries(full.geometry.attributes)){
    const data=new a.array.constructor(ids.length*a.itemSize);
    for(let i=0;i<ids.length;i++)for(let c=0;c<a.itemSize;c++)data[i*a.itemSize+c]=name==='position'?full.source[ids[i]*a.itemSize+c]:a.array[ids[i]*a.itemSize+c];
    geometry.setAttribute(name,new T.BufferAttribute(data,a.itemSize,a.normalized));
   }
   source.set(geometry.attributes.position.array);const indices=[],originalIndex=full.geometry.index.array;
   for(let i=0;i<originalIndex.length;i+=3){const tri=[originalIndex[i],originalIndex[i+1],originalIndex[i+2]];if(tri.every(id=>remap.has(id)))indices.push(...tri.map(id=>remap.get(id)));else if(preserveSlots)indices.push(0,0,0);}
   geometry.setIndex(indices);const cut={geometry,source,weights:new Map()};variants.push({d,full,cut,ids});
   details.push({actorId,unit:m.unit,grid,dimensionsMatch,valid,vertices:ids.length,triangles:indices.length/3,fullVertices:full.source.length/3,textureFilters:Object.entries(d.set.textures).map(([key,t])=>({key,min:t.minFilter,mag:t.magFilter,mipmaps:t.generateMipmaps}))});
  }
  const select=mode=>{for(const {d,full,cut}of variants){const v=mode==='full'?full:cut;d.geometry=v.geometry;d.source=v.source;d.vertexWeights=v.weights;}};
  window.__cxvOuter={variants,select,restore(){select('full');for(const {cut}of variants){cut.weights.clear();cut.geometry.dispose();}delete window.__cxvOuter;}};
  select(active?'cut':'full');return details;
 },{active,padding,fullControl,preserveSlots});
}
