/** Compare native sampling with the original Vite module saved before the edit. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),saved=resolve(root,'work/v5/CXV/films/V7-F-static-native');
export async function installStaticVertexNative(page,{active=true}={}){
 const provenance=JSON.parse(await readFile(resolve(saved,'baseline-provenance.json')));
 const code=await readFile(resolve(saved,'original-drawing-layer.js'),'utf8');
 assert.equal(createHash('sha256').update(code).digest('hex'),provenance.servedModuleSha256);
 const original=await readFile(resolve(saved,'original-drawing-layer.ts'),'utf8'),current=await readFile(resolve(root,provenance.path),'utf8');
 assert.equal(createHash('sha256').update(original).digest('hex'),provenance.sourceSha256);
 assert.equal(current.slice(current.indexOf(' private weightsFor(')),original.slice(original.indexOf(' private weightsFor(')),'Point and weight behavior must remain identical');
 await page.route('**/__cxv_original_drawing.js',route=>route.fulfill({status:200,contentType:'text/javascript',body:code}));
 return page.evaluate(async ({active,provenance})=>{
  const {DrawingLayer:Original}=await import('/__cxv_original_drawing.js');
  const s=window.__depthScene;cancelAnimationFrame(s.raf);const variants=[],details=[];
  for(const [actorId,e]of s.actors){
   const d=e.craftPose?.drawing;if(!d)continue;
   const native=d.sample,original=Original.prototype.sample;
   original.call(d,'idle',0,false,undefined,0,0);d.stationaryRowsValid=true;
   const full={geometry:d.geometry,source:d.source,weights:d.vertexWeights,sample:original};
   const cut={geometry:d.geometry.clone(),source:d.source,weights:d.vertexWeights,sample:native};
   cut.initialPosition=Float32Array.from(cut.geometry.attributes.position.array);
   const ids=Array.from({length:full.geometry.attributes.position.count},(_,i)=>i);
   variants.push({d,full,cut,ids,fullTopology:true,staticOnly:true});
   details.push({actorId,unit:d.set.manifest.unit,vertices:ids.length,sampledVertices:d.movingVertexCount,indices:d.geometry.index.count,baseline:provenance});
  }
  const select=mode=>{for(const {d,full,cut}of variants){const v=mode==='full'?full:cut;d.geometry=v.geometry;d.source=v.source;d.vertexWeights=v.weights;d.sample=v.sample;}};
  window.__cxvOuter={variants,select,restore(){select('full');for(const {d,cut}of variants){d.sample=cut.sample;d.stationaryRowsValid=false;cut.geometry.dispose();}delete window.__cxvOuter;}};
  select(active?'cut':'full');return details;
 },{active,provenance});
}
