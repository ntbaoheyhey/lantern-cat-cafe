/** Reuse the preserved artifacts for a reversed balanced normal-only control. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile,open} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const production=resolve(root,'work/v5/CXV/films/V7-F-victory-demand-production');
const out=resolve(root,'work/v5/CXV/films/V7-F-victory-normal-control');assert(!existsSync(resolve(out,'series.json')));await mkdir(out,{recursive:true});
const first=JSON.parse(await readFile(resolve(production,'series.json'),'utf8'));assert(first.pass,'Original timings must finish first');
const build=JSON.parse(await readFile(resolve(production,'build.json'),'utf8'));
const snapshots=[];for(const name of ['run-victory-normal-control.mjs','benchmark-victory-normal-control.mjs','production-candidate-fixture.mjs']){
 const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);snapshots.push({name,sha256:hash(bytes)});
}
const {preview}=await import(require.resolve('vite')),servers=[];
const series={utc:new Date().toISOString(),buildManifest:resolve(production,'build.json'),buildManifestSha256:hash(await readFile(resolve(production,'build.json'))),snapshots,order:['native','baseline','baseline','native','native','baseline'],runs:[],pass:false};
try{
 for(const [index,mode]of ['baseline','native'].entries()){
  const artifact=build.artifacts.find(a=>a.mode===mode);assert.equal(hash(await readFile(resolve(artifact.dist,'index.html'))),artifact.indexSha256);
  servers.push(await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6311+index,strictPort:true}}));
 }
 for(const [index,mode]of series.order.entries()){
  const dir=resolve(out,'trials',`${index}-${mode}`),log=await open(resolve(out,`${index}-${mode}.log`),'w');let code;
  try{code=await new Promise((done,reject)=>{const child=spawn(process.execPath,['tools/v5vfx/benchmark-victory-normal-control.mjs'],{cwd:root,env:{...process.env,CXV_PRODUCTION_OUT:production,CXV_ARTIFACT_MODE:mode,CXV_CAPTURE_OUT:dir},stdio:['ignore',log.fd,log.fd]});child.once('error',reject);child.once('exit',done);});}finally{await log.close();}
  assert.equal(code,0,`Normal control ${index}-${mode} failed`);const raw=resolve(dir,'report.json'),trial=JSON.parse(await readFile(raw,'utf8'));assert(trial.pass);
  series.runs.push({index,mode,raw,pass:true});await writeFile(resolve(out,'series.json'),JSON.stringify(series,null,2));console.log(new Date().toISOString()+` normal control ${index} ${mode} passed`);
 }
 series.pass=series.runs.length===6;
}finally{await Promise.all(servers.map(server=>new Promise(done=>server.httpServer.close(done))));series.ended=new Date().toISOString();await writeFile(resolve(out,'series.json'),JSON.stringify(series,null,2));}
