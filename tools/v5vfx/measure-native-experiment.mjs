import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {nativeLivingExperiment} from './native-living-experiment.mjs';
const require=createRequire(resolve('apps/web/package.json')),ts=require('typescript'),T=require('three');
const source=await readFile('apps/web/src/game/rig/cutout.ts','utf8'),exports={};
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
// Native CPU geometry only: drawings and shader compilation are not exercised here.
new Function('require','exports',code)(id=>id==='three'?T:id==='./atlas-color'?{usePaintedAtlasColor:()=>{}}:id==='./drawing-layer'?{DrawingLayer:class{constructor(){throw Error('Drawings outside this experiment');}}}:(()=>{throw Error(id);})(),exports);
const {CutoutMesh}=exports,rows=[];
for(const cat of ['mallow','sorrel','biscuit','inkcap','cinnamon','brioche','velvet','marigold']){
 const original=JSON.parse(await readFile(`apps/web/public/units/${cat}/rig.json`,'utf8'));
 for(const [variant,options]of [['R1',{}],['expressive',{neckX:3.6,tail:7}]]){
  const data=nativeLivingExperiment(original,options),textures=data.pages.map(()=>new T.Texture()),m=new CutoutMesh(data,textures),reference=new Map(),minimum={};
  const area=(p,offset,ids)=>{const [a,b,c]=ids.map(i=>(offset+i)*3);return(p[b]-p[a])*(p[c+1]-p[a+1])-(p[b+1]-p[a+1])*(p[c]-p[a]);};
  m.pose(0,'');for(const batch of m.batches)for(const {part,offset}of batch.parts){if(!part.visible||/^(eye|mouth)/.test(part.name))continue;for(let i=0;i<part.triangles.length;i+=3)reference.set(part.name+':'+i,area(batch.positions,offset,part.triangles.slice(i,i+3)));}
  const samples=[],names=['leg_l','leg_r','head','tail_3','weapon'];let start,end,footStart,maxFootDelta=0;
  for(let f=0;f<=300;f++){
   m.proceduralTime=f/30;m.pose(f===300?0:f/30,'idle');
   samples.push(names.map(n=>{const b=m.skeleton.findBone(n);return[b.worldX,b.worldY];}));
   const feet=[];for(const batch of m.batches)for(const {part,offset}of batch.parts){
    if(/^foot-/.test(part.name))feet.push(...Array.from(batch.positions.slice(offset*3,(offset+part.vertices.length)*3)));
    if(!part.visible||/^(eye|mouth)/.test(part.name))continue;
    for(let i=0;i<part.triangles.length;i+=3){const base=reference.get(part.name+':'+i);if(Math.abs(base)>.001)minimum[part.name]=Math.min(minimum[part.name]??Infinity,area(batch.positions,offset,part.triangles.slice(i,i+3))/base);}
   }
   if(!f){start=m.batches.map(b=>Array.from(b.positions));footStart=feet;}else feet.forEach((v,i)=>{maxFootDelta=Math.max(maxFootDelta,Math.abs(v-footStart[i]));});
   if(f===300)end=m.batches.map(b=>Array.from(b.positions));
  }
  const ranges=Object.fromEntries(names.map((n,i)=>[n,[0,1].map(axis=>{const v=samples.map(s=>s[i][axis]);return return100(Math.max(...v)-Math.min(...v));})]));
  function return100(v){return Math.round(v/512*100*1e5)/1e5;}
  const endFlat=end.flat();rows.push({cat,variant,minTriangleByPart:minimum,maxFootDelta,seamDelta:Math.max(...start.flat().map((v,i)=>Math.abs(v-endFlat[i]))),ranges});m.dispose();textures.forEach(t=>t.dispose());
 }
}
const out={utc:new Date().toISOString(),cutoutSha256:createHash('sha256').update(source).digest('hex'),method:'Actual native CPU skinning; shader/drawing imports stubbed. Compare triangle orientation to setup geometry, 301samples10s.',rows};
await writeFile('work/v5/CXV/batch-m/native-experiment-geometry.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(rows.map(({minTriangleByPart,...r})=>({...r,minTriangle:Math.min(...Object.values(minTriangleByPart))}))));
