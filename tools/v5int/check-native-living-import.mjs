/** Shared cutout parity against the last integration checkpoint; no protected test edits. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {importSkeleton} from '../../scripts/art/import-spine.mjs';
const root=resolve(import.meta.dirname,'../..'),app=resolve(root,'apps/web'),req=createRequire(resolve(app,'package.json'));
const {createServer}=await import(req.resolve('vite')),T=req('three'),base='162efac4c';
const work=resolve(root,'work/v5/CXI/batch-m/native-parity');await mkdir(work,{recursive:true});
const file='apps/web/src/game/rig/cutout.ts',baseline=resolve(work,'cutout-baseline.ts');
let source=execFileSync('git',['show',`${base}:${file}`],{cwd:root,encoding:'utf8'});
source=source.replace(/from\s*(['"])(\.[^'"]+)\1/g,(_,q,s)=>`from ${q}${resolve(dirname(resolve(root,file)),s)}${q}`)
 .replace(/from ['"]three['"]/g,`from '${resolve(dirname(req.resolve('three')),'three.module.js')}'`);
await writeFile(baseline,source);
const server=await createServer({root:app,configFile:false,server:{middlewareMode:true,fs:{allow:[root]}},resolve:{dedupe:['three']},logLevel:'error'});
const report={utc:new Date().toISOString(),baseline:base,imported:['4ec917401','c7d3cf13a'],cases:0,perUnit:{},protectedDiff:[]};
const digest=m=>{const h=createHash('sha256');for(const c of m.children)if(c.geometry?.attributes.position)h.update(Buffer.from(c.geometry.attributes.position.array.buffer));h.update(JSON.stringify(m.bones));return h.digest('hex');};
try{
 const old=await server.ssrLoadModule(baseline),current=await server.ssrLoadModule(resolve(root,file));
 const {withRigContract}=await server.ssrLoadModule(resolve(app,'src/game/rig/contract.ts'));
 const slots=JSON.parse(await readFile(resolve(root,'assets/cardrpg-look/spine/slots.json')));
 const units=['mochi','soot','clover','panko','sorrel','biscuit','inkcap','cinnamon','brioche','velvet','marigold'];
 const times=[0,.049,.14,.25,.35,.55,.8,1,1.1,2.2,3.333,7.9,9.999,10];
 for(const id of units){
  let raw;
  if(['mochi','soot','clover'].includes(id)){
   const spec=slots.units.find(u=>u.id===id).placeholder;
   raw=JSON.stringify(withRigContract(importSkeleton(JSON.parse(await readFile(resolve(root,spec.skeleton))),await readFile(resolve(root,spec.atlas),'utf8'),spec.scale)));
  }else raw=await readFile(resolve(app,`public/units/${id}/rig.json`),'utf8');
  const data=JSON.parse(raw),textures=data.pages.map(()=>new T.Texture());
  const a=new current.CutoutMesh(JSON.parse(raw),textures),b=new old.CutoutMesh(JSON.parse(raw),textures);report.perUnit[id]=0;
  try{
   assert.equal(a.enableLivingCat(id),false,`unexpected enrollment ${id}`);
   for(const reduced of [false,true])for(const clip of ['idle','idle-phase2','attack','skill','ult','hurt','ko','victory'])for(const t of times){
    a.livingReducedMotion=reduced;a.proceduralTime=b.proceduralTime=20.4+t;a.pose(t,clip);b.pose(t,clip);
    a.updateNativeVertices();b.updateNativeVertices();assert.equal(digest(a),digest(b),`${id}/${reduced}/${clip}/${t}`);
    report.cases++;report.perUnit[id]++;
   }
   assert.equal(JSON.stringify(a.data),JSON.stringify(data));
  }finally{a.dispose();b.dispose();textures.forEach(t=>t.dispose());}
 }
 const inventory=JSON.parse(await readFile(resolve(root,'work/v5/CXI/batch-m/study/soot-baseline-full.json')));
 const changes=new Set(execFileSync('git',['diff',inventory.base,'--name-only'],{cwd:root,encoding:'utf8'}).trim().split('\n'));
 report.protectedPaths=inventory.protectedPaths.length;report.protectedDiff=inventory.protectedPaths.map(p=>p.path).filter(p=>changes.has(p));assert.deepEqual(report.protectedDiff,[]);
 report.pass=true;
}catch(e){report.pass=false;report.error=String(e.stack??e);process.exitCode=1;}
finally{await server.close();report.completedUTC=new Date().toISOString();await writeFile(resolve(root,'reports/v5/CXI/evidence/v8-m-mallow-import.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));}
