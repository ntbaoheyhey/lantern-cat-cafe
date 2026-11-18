/** Independent pre-import/shared-runtime parity; no browser or protected test edits. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),app=resolve(root,'apps/web');
const require=createRequire(resolve(app,'package.json'));
const {createServer}=await import(require.resolve('vite'));
const T=require('three'),base='0d0ef510d';
const work=resolve(root,'work/v5/CXI/batch-m/panko-parity');await mkdir(work,{recursive:true});
const files={drawing:'apps/web/src/game/rig/drawing-layer.ts',secondary:'apps/web/src/game/rig/secondary-motion.ts',poses:'apps/web/src/game/cardrpg/vfx-craft/drawn-poses.ts'};
const baseline=Object.fromEntries(Object.keys(files).map(k=>[k,resolve(work,`${k}-baseline.ts`)]));
for(const [key,file]of Object.entries(files)){
 let source=execFileSync('git',['show',`${base}:${file}`],{cwd:root,encoding:'utf8'});
 source=source.replace(/from\s*(['"])(\.[^'"]+)\1/g,(_,quote,spec)=>{
  const absolute=resolve(dirname(resolve(root,file)),spec),match=Object.entries(files).find(([,v])=>resolve(root,v)===`${absolute}.ts`);
  return `from ${quote}${match?baseline[match[0]]:absolute}${quote}`;
 }).replace(/from ['"]three['"]/g,`from '${resolve(dirname(require.resolve('three')),'three.module.js')}'`);
 await writeFile(baseline[key],source);
}
const server=await createServer({root:app,configFile:false,server:{middlewareMode:true,fs:{allow:[root]}},resolve:{dedupe:['three']},logLevel:'error'});
const result={utc:new Date().toISOString(),baseline:base,source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),uncommittedImport:true,secondaryCases:0,drawingCases:0,poseCases:0,protectedPaths:0,protectedDiff:[],maxVertexDelta:0};
try{
 const current={},old={};
 for(const [key,file]of Object.entries(files)){current[key]=await server.ssrLoadModule(resolve(root,file));old[key]=await server.ssrLoadModule(baseline[key]);}
 const units=['mochi','soot','clover','mallow','sorrel','biscuit','inkcap','cinnamon','brioche','velvet','marigold'];
 const clips=['idle','idle-phase2','attack','skill','ult','hurt','ko','victory'];
 const times=[0,.049,.14,.25,.27,.31,.35,.439,.55,.8,1,1.1,1.19,1.8,2.2,3.333,7.9,9.999,10,20.4];
 for(const id of units){
  const a=new current.secondary.SecondaryMotion(id),b=new old.secondary.SecondaryMotion(id);
  for(const reduced of [false,true])for(const clip of clips)for(const time of times){
   a.sample(time+20.4,clip,time,reduced,.2,.05,.1);b.sample(time+20.4,clip,time,reduced,.2,.05,.1);
   for(const key of Object.keys(b))assert.deepEqual(a[key],b[key],`${id}/${clip}/${time}/${key}`);
   for(const part of ['tail','apron','ear','prop','hair'])assert.equal(a.layer(part,.6),b.layer(part,.6));
   for(const key of ['ear','accessory'])assert.equal(a[key],b[key]);result.secondaryCases++;
  }
 }
 const manifest=JSON.parse(await readFile(resolve(app,'public/units/soot/poses/manifest.json')));
 const makeSet=()=>({manifest,textures:Object.fromEntries(Object.keys(manifest.poses).map(k=>[k,new T.Texture()]))});
 const a=new current.drawing.DrawingLayer(makeSet(),[13,-7],.63),b=new old.drawing.DrawingLayer(makeSet(),[13,-7],.63);
 try{
  for(const reduced of [false,true])for(const clip of clips)for(const time of times)for(const damage of [undefined,.03,.17,.2]){
   a.sample(clip,time,reduced,damage,time+20.4,.2,.1);b.sample(clip,time,reduced,damage,time+20.4,.2,.1);
   assert.equal(a.key,b.key);assert.deepEqual(a.geometry.attributes.position.array,b.geometry.attributes.position.array);
   assert.deepEqual(a.contactPoints(),b.contactPoints());assert.deepEqual(a.faceCorners(),b.faceCorners());
   for(const point of Object.values(a.frame.sockets)){
    assert.deepEqual(a.point(point),b.point(point));
    assert.deepEqual(a.point(point,a.key,{clip,seconds:time,reduced}),b.point(point,b.key,{clip,seconds:time,reduced}));
   }result.drawingCases++;
  }
 }finally{a.dispose();b.dispose();}
 const actor=(DrawingLayer)=>({unit:{id:'soot'},bounds:{x:-256,y:0,width:512,height:512},mesh:{installDrawings:(set,origin,scale)=>new DrawingLayer(set,origin,scale)},clips:new Map(),sockets:new Map()});
 const ca=actor(current.drawing.DrawingLayer),cb=actor(old.drawing.DrawingLayer);
 const pa=new current.poses.DrawnPoses(ca,makeSet()),pb=new old.poses.DrawnPoses(cb,makeSet());
 try{
  assert.deepEqual(ca.clips,cb.clips);assert.deepEqual(pa.layoutExtents,pb.layoutExtents);
  for(const reduced of [false,true])for(const clip of clips)for(const time of times){
   assert.equal(pa.owns(clip),pb.owns(clip));pa.deform(clip,time,reduced,undefined,time+20.4,.2,.1);pb.deform(clip,time,reduced,undefined,time+20.4,.2,.1);
   assert.deepEqual(pa.drawing.geometry.attributes.position.array,pb.drawing.geometry.attributes.position.array);result.poseCases++;
  }
 }finally{pa.drawing.dispose();pb.drawing.dispose();}
 const inventory=JSON.parse(await readFile(resolve(root,'work/v5/CXI/batch-m/study/soot-baseline-full.json')));
 const changes=new Set(execFileSync('git',['diff',inventory.base,'--name-only'],{cwd:root,encoding:'utf8'}).trim().split('\n'));
 result.protectedPaths=inventory.protectedPaths.length;result.protectedDiff=inventory.protectedPaths.map(p=>p.path).filter(p=>changes.has(p));assert.deepEqual(result.protectedDiff,[]);
 result.importHashes={};for(const file of Object.values(files))result.importHashes[file]=createHash('sha256').update(await readFile(resolve(root,file))).digest('hex');
 result.status='PASS';
 await writeFile(resolve(root,'reports/v5/CXI/evidence/v8-m-panko-import.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await server.close();}
