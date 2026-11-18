import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const require=createRequire(resolve('apps/web/package.json')),ts=require('typescript'),T=require('three');
const sha=v=>createHash('sha256').update(v).digest('hex'),sources={};
async function compile(path,imports={}){
 const source=await readFile(path,'utf8'),exports={};sources[path]=sha(source);
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','exports',code)(id=>{if(id in imports)return imports[id];throw Error(`Unexpected CPU import: ${id}`);},exports);return exports;
}
const living=await compile('apps/web/src/game/rig/native-living.ts');
const {CutoutMesh}=await compile('apps/web/src/game/rig/cutout.ts',{'three':T,'./native-living':living,'./atlas-color':{usePaintedAtlasColor:()=>{}},'./drawing-layer':{DrawingLayer:class{constructor(){throw Error('Drawings outside CPU study');}}}});
const report={utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sources,method:'Actual native CPU skinning; shader/drawing imports stubbed. No browser or performance claim.',rows:[]};
const area=(p,o,ids)=>{const[a,b,c]=ids.map(i=>(o+i)*3);return(p[b]-p[a])*(p[c+1]-p[a+1])-(p[b+1]-p[a+1])*(p[c]-p[a]);};
const vertices=m=>m.batches.flatMap(b=>Array.from(b.positions));
const feet=m=>m.batches.flatMap(b=>b.parts.filter(({part})=>part.name.startsWith('foot-')).flatMap(({part,offset})=>Array.from(b.positions.slice(offset*3,(offset+part.vertices.length)*3))));
const delta=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
for(const cat of Object.keys(living.nativeLivingProfiles)){
 const original=await readFile(`apps/web/public/units/${cat}/rig.json`,'utf8'),data=JSON.parse(original),textures=data.pages.map(()=>new T.Texture()),m=new CutoutMesh(data,textures),reference=new Map();
 m.pose(0,'');const baseFeet=feet(m);
 for(const batch of m.batches)for(const{part,offset}of batch.parts){if(!part.visible||/^(eye|mouth)/.test(part.name))continue;for(let i=0;i<part.triangles.length;i+=3)reference.set(part.name+':'+i,area(batch.positions,offset,part.triangles.slice(i,i+3)));}
 if(!m.enableLivingCat(cat))throw Error(`Cannot enroll ${cat}`);
 for(const reduced of [false,true]){
  m.livingReducedMotion=reduced;
  const row={cat,reduced,profile:living.nativeLivingProfiles[cat],rigSha256:sha(original),maxFootDelta:0,minTriangleRatio:Infinity,castBoundaryDelta:0,minByClipPart:{}},names=['head','tail_3','weapon','torso'],samples=[];
  for(const clip of ['idle','skill'])for(const clock of clip==='idle'?[0]:[0,.45,1.1,1.8,2.5,3.3,4.2,5.1,6.4,7.5,8.6,9.7])for(let n=0;n<=(clip==='idle'?300:60);n++){
   m.proceduralTime=clip==='idle'?n/30:clock;m.pose(clip==='skill'?n/60:0,clip);row.maxFootDelta=Math.max(row.maxFootDelta,delta(baseFeet,feet(m)));
   if(clip==='idle')samples.push(names.map(name=>{const b=m.skeleton.findBone(name);return[b.worldX,b.worldY];}));
   for(const batch of m.batches)for(const{part,offset}of batch.parts){if(!part.visible||/^(eye|mouth)/.test(part.name))continue;for(let i=0;i<part.triangles.length;i+=3){const base=reference.get(part.name+':'+i);if(Math.abs(base)>.001){const ratio=area(batch.positions,offset,part.triangles.slice(i,i+3))/base,key=clip+':'+part.name;row.minByClipPart[key]=Math.min(row.minByClipPart[key]??Infinity,ratio);if(ratio<row.minTriangleRatio){row.minTriangleRatio=ratio;row.worst={clip,part:part.name,clock:m.proceduralTime,at:clip==='skill'?n/60:0,triangle:i/3};}}}}
  }
  m.proceduralTime=0;m.pose(0,'idle');const start=vertices(m);m.proceduralTime=10;m.pose(0,'idle');row.seamDelta=delta(start,vertices(m));
  for(const clock of [.9,1.3,4.57])for(const at of [0,1]){m.proceduralTime=clock;m.pose(0,'idle');const idle=vertices(m);m.pose(at,'skill');row.castBoundaryDelta=Math.max(row.castBoundaryDelta,delta(idle,vertices(m)));}
  row.rangesPercentH=Object.fromEntries(names.map((name,i)=>[name,[0,1].map(axis=>{const a=samples.map(s=>s[i][axis]);return(Math.max(...a)-Math.min(...a))/data.bounds.height*100;})]));
  row.originalDataUnchanged=JSON.stringify(data)===JSON.stringify(JSON.parse(original));row.pass=row.maxFootDelta===0&&row.seamDelta===0&&row.castBoundaryDelta===0&&row.minTriangleRatio>.5&&row.originalDataUnchanged;report.rows.push(row);
 }
 m.dispose();textures.forEach(t=>t.dispose());
}
report.pass=report.rows.every(r=>r.pass);report.completedUTC=new Date().toISOString();
await writeFile('reports/v5/CXV/M-native-eight-geometry.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,rows:report.rows.map(({cat,reduced,maxFootDelta,minTriangleRatio,seamDelta,castBoundaryDelta,rangesPercentH,pass})=>({cat,reduced,maxFootDelta,minTriangleRatio,seamDelta,castBoundaryDelta,rangesPercentH,pass}))}));if(!report.pass)process.exitCode=1;
