// Independent export audit: exact named rig rest poses and <=12k triangles.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const cats=(process.env.LOOK_OWNERS||'mochi,soot,clover').split(',');
const modelDirectory=process.env.LOOK_MODEL_DIR||'assets/cardrpg-look/models';
const output=process.env.LOOK_AUDIT_OUT||'reports/cardrpg-look/validation/l1/rig-export.json';
function parse(bytes){const size=bytes.readUInt32LE(12);return JSON.parse(bytes.subarray(20,20+size).toString());}
const rows=[];
for(const cat of cats){
 const before=parse(await readFile(`assets/cardrpg2/models/${cat}.glb`));
 const modelPath=`${modelDirectory}/${cat}.glb`,bytes=await readFile(modelPath),after=parse(bytes);
 const targets=before.nodes.filter(n=>n.mesh===undefined);const errors=[];
 for(const node of targets){
  const exported=after.nodes.find(n=>n.name===node.name);
  if(!exported){errors.push(`${node.name}: missing`);continue;}
  for(const [key,fallback] of [['translation',[0,0,0]],['rotation',[0,0,0,1]],['scale',[1,1,1]]]){
   const a=node[key]??fallback,b=exported[key]??fallback;
   const delta=Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
   if(delta>1e-5)errors.push(`${node.name}/${key}: ${delta}`);
  }
  for(const child of node.children??[]){
   const name=before.nodes[child].name;if(before.nodes[child].mesh!==undefined)continue;
   if(!(exported.children??[]).some(i=>after.nodes[i].name===name))errors.push(`${node.name} → ${name}: parent changed`);
  }
 }
 const triangles=after.meshes.flatMap(m=>m.primitives).reduce((sum,p)=>sum+after.accessors[p.indices].count/3,0);
 const triangleLimit=['yarn-giant','kettle-knight','pantry-crown'].includes(cat)?20000:12000;
 const row={cat,modelPath,sha256:createHash('sha256').update(bytes).digest('hex'),rigTargets:targets.length,triangles,triangleLimit,errors,scope:'Exact rest transform/parent compatibility. Animation playback and visual penetration need browser capture; this audit alone is not that proof.'};rows.push(row);
 console.log(JSON.stringify(row));
}
await mkdir(output.slice(0,output.lastIndexOf('/')),{recursive:true});await writeFile(output,JSON.stringify(rows,null,2)+'\n');
assert(rows.every(r=>r.errors.length===0&&r.triangles<=r.triangleLimit),'Export rig or triangle budget failed');
