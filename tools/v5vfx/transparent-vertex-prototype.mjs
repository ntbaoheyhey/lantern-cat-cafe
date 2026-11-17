/** Tool-only partial CPU deformation, retaining all vertices and original triangles. */
export async function installTransparentVertexPrototype(page,{active=true,padding=2,fullControl=false,staticOnly=false}={}){
 return page.evaluate(async ({active,padding,fullControl,staticOnly})=>{
  const {drawingAt}=await import('/src/game/rig/drawing-layer.ts'),{eyeClosure}=await import('/src/game/rig/drawing-expression.ts');
  const s=window.__depthScene;cancelAnimationFrame(s.raf);const variants=[],details=[];
  for(const [actorId,e]of s.actors){
   const d=e.craftPose?.drawing;if(!d)continue;
   const m=d.set.manifest,[w,h]=m.canvas,bounds=Object.values(m.poses).map(p=>p.opaqueBounds);
   const dimensionsMatch=Object.values(d.set.textures).every(t=>t.image?.width===w&&t.image?.height===h);
   const valid=Number.isSafeInteger(w)&&w>0&&Number.isSafeInteger(h)&&h>0&&bounds.length>0&&bounds.every(b=>Array.isArray(b)&&b.length===4&&b.every(Number.isSafeInteger)&&b[0]>=0&&b[1]>=0&&b[2]>b[0]&&b[3]>b[1]&&b[2]<=w&&b[3]<=h);
   const grid=valid&&dimensionsMatch&&!fullControl?[Math.max(0,Math.floor(Math.min(...bounds.map(b=>b[0]))*32/w)-padding),Math.max(0,Math.floor(Math.min(...bounds.map(b=>b[1]))*32/h)-padding),Math.min(32,Math.ceil(Math.max(...bounds.map(b=>b[2]))*32/w)+padding),Math.min(32,Math.ceil(Math.max(...bounds.map(b=>b[3]))*32/h)+padding)]:[0,0,32,32];
   if(d.source.length!==33*33*3||d.geometry.index.count!==6144)throw Error('Unexpected full source grid: '+m.unit);
   const sample=d.sample,code=sample.toString(),needle='for (let i = 0; i < positions.count; i++) {';
   if(!code.startsWith('sample(')||code.split(needle).length!==2)throw Error('Changed sample method; inspect before transform: '+code.slice(0,80));
   const candidate=new Function('drawingAt','NO_OVERLAP','eyeClosure','return function '+code.replace(needle,'for (const i of this.__cxvActiveIds) {'))(drawingAt,[],eyeClosure);
   // Initialize both geometries independently of later baseline samples. Frozen
   // outer positions must never inherit the current baseline under comparison.
   sample.call(d,'idle',0,false,undefined,0,0);
   const full={geometry:d.geometry,source:d.source,weights:d.vertexWeights,sample},ids=[];
   const staticThreshold=Math.max(m.baseline[1],...Object.values(m.poses).map(p=>p.face[1]+p.face[3]*1.31+1));
   if(staticOnly&&!fullControl){for(let i=0;i<d.source.length/3;i++)if(h/2-d.source[i*3+1]<staticThreshold)ids.push(i);}
   else for(let y=grid[1];y<=grid[3];y++)for(let x=grid[0];x<=grid[2];x++)ids.push(y*33+x);
   const geometry=d.geometry.clone(),initialPosition=Float32Array.from(geometry.attributes.position.array);
   const cut={geometry,source:d.source,weights:d.vertexWeights,sample:candidate,initialPosition};
   variants.push({d,full,cut,ids,activeIds:Uint16Array.from(ids),fullTopology:true,staticOnly});
   details.push({actorId,unit:m.unit,grid,dimensionsMatch,valid,staticOnly,staticThreshold,vertices:1089,sampledVertices:ids.length,triangles:geometry.index.count/3,fullVertices:1089,indexBytes:ids.length*2,initialSample:{clip:'idle',seconds:0,clock:0},textureFilters:Object.entries(d.set.textures).map(([key,t])=>({key,min:t.minFilter,mag:t.magFilter,mipmaps:t.generateMipmaps}))});
  }
  const select=mode=>{for(const {d,full,cut,activeIds}of variants){const v=mode==='full'?full:cut;d.geometry=v.geometry;d.source=v.source;d.vertexWeights=v.weights;d.sample=v.sample;d.__cxvActiveIds=activeIds;}};
  window.__cxvOuter={variants,select,restore(){select('full');for(const {d,cut}of variants){delete d.__cxvActiveIds;cut.geometry.dispose();}delete window.__cxvOuter;}};
  select(active?'cut':'full');return details;
 },{active,padding,fullControl,staticOnly});
}
