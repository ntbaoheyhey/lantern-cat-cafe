/** Decode real assets; pending fallbacks are listed, never counted as passing GLBs. */
import {createRequire} from 'node:module';
import {readFile,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json');
const {NodeIO}=require('@gltf-transform/core'),{ALL_EXTENSIONS}=require('@gltf-transform/extensions');
const {getBounds}=require('@gltf-transform/functions'),{MeshoptDecoder}=require('meshoptimizer');
export const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../../..');
export const manifest=JSON.parse(await readFile(resolve(root,'assets/cardrpg-look/v3-real/manifest.json'),'utf8'));
export async function io(){await MeshoptDecoder.ready;return new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});}
export function measure(document,unit){
 const nodes=document.getRoot().listNodes(),mins=[Infinity,Infinity,Infinity],maxs=[-Infinity,-Infinity,-Infinity];
 if(!unit.bodyNodes?.length)throw Error(unit.id+': no designated body nodes');
 for(const name of unit.bodyNodes){
  const found=nodes.filter(n=>n.getName()===name);if(found.length!==1)throw Error(unit.id+': body node absent/ambiguous: '+name);
  const b=getBounds(found[0]);for(let axis=0;axis<3;axis++){mins[axis]=Math.min(mins[axis],b.min[axis]);maxs[axis]=Math.max(maxs[axis],b.max[axis]);}
 }
 const [width,height,depth]=maxs.map((n,i)=>n-mins[i]);
 if(![width,height,depth].every(Number.isFinite))throw Error(unit.id+': invalid body bounds');
 if(height<unit.range[0]-1e-5||height>unit.range[1]+1e-5)throw Error(unit.id+': height '+height+' outside '+unit.range);
 if(unit.kind==='boss'&&width>2.20001)throw Error(unit.id+': boss footprint exceeds2.2');
 if(depth<height*.12)throw Error(unit.id+': flat body has no volume');
 if(Math.abs(mins[1])>.03)throw Error(unit.id+': feet are not on the floor');
 if(!nodes.some(n=>n.getMesh()&&n.getSkin()))throw Error(unit.id+': missing skinned mesh');
 const clips=document.getRoot().listAnimations().map(a=>a.getName());
 for(const name of manifest.clips)if(!clips.includes(name))throw Error(unit.id+': missing clip '+name);
 for(const [socket,name] of Object.entries(unit.sockets))if(!nodes.some(n=>n.getName()===name))throw Error(unit.id+': missing socket '+socket);
 const triangles=document.getRoot().listMeshes().reduce((sum,m)=>sum+m.listPrimitives().reduce((s,p)=>s+(p.getIndices()?.getCount()??p.getAttribute('POSITION')?.getCount()??0)/3,0),0);
 const limit=unit.kind==='boss'?25000:unit.kind==='cat'?12000:15000;
 if(triangles>limit)throw Error(unit.id+': triangle budget exceeded');
 if(document.getRoot().listMaterials().length>3)throw Error(unit.id+': material budget exceeded');
 return{id:unit.id,min:mins,max:maxs,width,height,depth,triangles};
}
export async function checkRoster({strict=false}={}){
 const loader=await io(),rows=[],pending=[];let bytes=0;
 for(const unit of manifest.units){
  const path=resolve(root,'assets/cardrpg-look/v3-real',unit.glb);
  if(!unit.accepted){pending.push(unit.id);continue;}
  const size=(await stat(path)).size;bytes+=size;
  rows.push({...measure(await loader.read(path),unit),bytes:size});
 }
 if(bytes>16000000)throw Error('3D roster exceeds16MB');
 if(strict&&pending.length)throw Error('Unaccepted/missing3D units: '+pending.join(','));
 return {accepted:rows.length,total:manifest.units.length,pending,bytes,strict,rows};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await checkRoster({strict:process.argv.includes('--strict')})));
