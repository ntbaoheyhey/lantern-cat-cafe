/** Offline development parity for the complete DrawingLayer; no production performance claim. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {pankoOffhandCacheSource,sourcePath,hash} from './panko-offhand-cache-source.mjs';
const root=resolve(import.meta.dirname,'../..'),req=createRequire(resolve(root,'apps/web/package.json'));
const out=resolve(process.argv[2]??'');assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(!existsSync(out));
const prePath=resolve(root,'reports/v5/CXV/M-panko-offhand-cache-R1-preregistration.json'),pre=JSON.parse(await readFile(prePath));
assert(Date.now()>=Date.parse(pre.implementationNotBeforeUTC));
const stop=()=>{for(const n of ['STOP-ALL','STOP-CXV'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+n),n);};stop();
const original=await readFile(resolve(root,sourcePath),'utf8');assert.equal(hash(original),pre.source.sha256);
const candidate=pankoOffhandCacheSource(original);await mkdir(out,{recursive:true});
await writeFile(resolve(out,'original-source.ts'),original);await writeFile(resolve(out,'candidate-source.ts'),candidate);
const imports=s=>s.replace(/from '(\.\/[^']+)'/g,(_,p)=>`from '${resolve(dirname(resolve(root,sourcePath)),p)}'`);
await writeFile(resolve(out,'original.ts'),imports(original));await writeFile(resolve(out,'candidate.ts'),imports(candidate));
const entry=resolve(out,'entry.ts');await writeFile(entry,"export {DrawingLayer as Original} from './original';\nexport {DrawingLayer as Candidate} from './candidate';\nexport {Texture} from 'three';\n");
const {build}=await import(req.resolve('vite'));
await build({configFile:false,root,envDir:false,publicDir:false,logLevel:'silent',resolve:{alias:{three:req.resolve('three')}},build:{emptyOutDir:false,outDir:out,minify:false,lib:{entry,formats:['es'],fileName:()=> 'layers.mjs'}}});
const {Original,Candidate,Texture}=await import(pathToFileURL(resolve(out,'layers.mjs')).href);
const report={utc:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),preregistration:{path:prePath,sha256:hash(await readFile(prePath))},source:{path:sourcePath,sha256:hash(original),candidateSha256:hash(candidate)},harnessSha256:hash(await readFile(import.meta.filename)),transformSha256:hash(await readFile(new URL('./panko-offhand-cache-source.mjs',import.meta.url))),bundleSha256:hash(await readFile(resolve(out,'layers.mjs'))),cases:[],pass:false,productionAcceptance:false,gpuChecked:false,timingClaim:false,imagesViewed:0};
const bytes=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength);
const inputs={idle:[0,.05,.299,.3,.6,1.1,3.3,9.999,10],skill:[0,.249,.25,.549,.55,.999,1,1.001],attack:[0,.049,.05,.269,.27,.329,.33,.349,.35,.439,.44,.559,.56,.799,.8],ult:[0,.299,.3,1.099,1.1,1.189,1.19,1.799,1.8,2.2],hurt:[0,.089,.09,.179,.18,.399,.4],ko:[0,.3,1],victory:[0,.6,3.3]};
function make(manifest){const textures=Object.fromEntries(Object.keys(manifest.poses).map(k=>[k,new Texture()])),set={manifest,textures};return{a:new Original(set,[17,23],.7),b:new Candidate(set,[17,23],.7),textures};}
function compare(f,tag){
 const {a,b}=f;assert.equal(a.key,b.key,tag);assert.equal(a.material.map,b.material.map,tag);
 for(const name of ['position','uv','normal'])assert(bytes(a.geometry.attributes[name].array).equals(bytes(b.geometry.attributes[name].array)),tag+':'+name);
 assert(bytes(a.geometry.index.array).equals(bytes(b.geometry.index.array)),tag+':indices');
 assert.deepEqual(a.contactPoints(),b.contactPoints(),tag+':feet');assert.deepEqual(a.faceCorners(),b.faceCorners(),tag+':face');
 for(const p of Object.values(a.frame.sockets))assert.deepEqual(a.point(p),b.point(p),tag+':socket');
 const [x,y,w,h]=a.frame.face;for(const p of [[x+w*.37,y+h*.28],[0,0],[13.25,49.75]])for(const at of [undefined,{clip:'idle',seconds:3.371,reduced:false},{clip:'skill',seconds:.551,reduced:true}])assert.deepEqual(a.point(p,a.key,at),b.point(p,b.key,at),tag+':arbitrary');
 assert.deepEqual(a.userData,b.userData,tag+':userData');assert.equal(a.stationaryRowsValid,b.stationaryRowsValid,tag+':staticRows');
}
function memory(f){
 const rows=[];for(const key of Object.keys(f.a.set.manifest.poses)){
  const a=f.a.weightsFor(key),b=f.b.weightsFor(key),extra=f.a.set.manifest.unit==='panko'&&f.a.set.manifest.poses[key].sockets.offHand?1:0;assert.equal(b.stride,a.stride+extra);
  for(let i=0;i<a.data.length/a.stride;i++)for(let k=0;k<a.stride;k++)assert(Object.is(a.data[i*a.stride+k],b.data[i*b.stride+k]),'Original cached weights changed');
  if(!extra)assert(bytes(a.data).equals(bytes(b.data)));rows.push({key,originalStride:a.stride,candidateStride:b.stride,originalBytes:a.data.byteLength,candidateBytes:b.data.byteLength,deltaBytes:b.data.byteLength-a.data.byteLength});
 }return rows;
}
try{
 for(const cat of pre.correctness.drawingFixtures){
  stop();const path=resolve(root,'apps/web/public/units',cat,'poses/manifest.json'),source=await readFile(path),manifest=JSON.parse(source),f=make(manifest);let samples=0,matchingExceptions=0;
  try{
   compare(f,cat+':initial');
   for(const reduced of [false,true])for(const [clip,times] of Object.entries(inputs))for(const t of [...times,...times.toReversed()]){
    for(const damage of [undefined,.089]){
     const args=[clip,t,reduced,damage,30+t,.7,.12];f.a.sample(...args);f.b.sample(...args);compare(f,`${cat}:${clip}:${t}:${reduced}:${damage}`);samples++;
    }
   }
   for(const bad of [NaN,Infinity,-Infinity]){
    const errors=[];for(const layer of [f.a,f.b])try{layer.sample('idle',bad,false,undefined,bad,.7,.12);errors.push(null);}catch(e){errors.push(e.name+':'+e.message);}assert.equal(errors[0],errors[1]);if(errors[0])matchingExceptions++;
    f.a.sample('idle',.6,false,undefined,30.6,.7,.12);f.b.sample('idle',.6,false,undefined,30.6,.7,.12);compare(f,cat+':recovery');samples++;
   }
   const reachedBeforeForced=[...f.a.vertexWeights.keys()];const weights=memory(f);report.cases.push({cat,manifestSha256:hash(source),samples,matchingExceptions,vertices:f.a.geometry.attributes.position.count,reachedBeforeForced,weights,deltaBytes:weights.reduce((n,x)=>n+x.deltaBytes,0)});
  }finally{f.a.dispose();f.b.dispose();assert.equal(f.a.vertexWeights.size,0);assert.equal(f.b.vertexWeights.size,0);for(const t of Object.values(f.textures))t.dispose();}
 }
 // Missing offHand must keep the original storage and arbitrary-point behavior.
 const missing=JSON.parse(await readFile(resolve(root,'apps/web/public/units/panko/poses/manifest.json')));for(const frame of Object.values(missing.poses))delete frame.sockets.offHand;
 const f=make(missing);try{for(const clip of ['idle','skill','attack']){f.a.sample(clip,.551,false);f.b.sample(clip,.551,false);compare(f,'missing-offHand');}const rows=memory(f);assert(rows.every(r=>r.deltaBytes===0));report.missingOffHand={pass:true,weights:rows};}finally{f.a.dispose();f.b.dispose();for(const t of Object.values(f.textures))t.dispose();}
 assert.equal(await readFile(resolve(root,sourcePath),'utf8'),original);report.pass=true;
}catch(e){report.failure=e.stack;process.exitCode=1;}finally{report.finishedUTC=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({out,pass:report.pass,cases:report.cases.map(c=>({cat:c.cat,samples:c.samples,deltaBytes:c.deltaBytes})),failure:report.failure}));}
