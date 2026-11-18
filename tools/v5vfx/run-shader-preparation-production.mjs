/** Six alternating preparation-only trials using one immutable native artifact. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile,open} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const production=resolve(root,'work/v5/CXV/films/V7-F-focus-read-native-production'),out=resolve(root,'work/v5/CXV/films/V7-F-shader-preparation-production');assert(!existsSync(out));
const manifest=await readFile(resolve(production,'build.json')),built=JSON.parse(manifest),artifact=built.artifacts.find(a=>a.mode==='native');assert(artifact?.transformed===0);
for(const file of artifact.files)assert.equal(hash(await readFile(resolve(artifact.dist,file.path))),file.sha256);
await mkdir(out,{recursive:true});const snapshots=[];
for(const name of ['run-shader-preparation-production.mjs','shader-preparation-prototype.mjs','benchmark-boss-play.mjs','production-candidate-fixture.mjs']){const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);snapshots.push({name,sha256:hash(bytes)});}
const series={utc:new Date().toISOString(),source:built.source,runtimePatchSha256:built.runtimePatchSha256,indexSha256:artifact.indexSha256,buildManifest:{path:resolve(production,'build.json'),sha256:hash(manifest)},filesVerified:artifact.files.length,snapshots,order:['baseline','compile','compile','baseline','baseline','compile'],runs:[],pass:false};
const {preview}=await import(require.resolve('vite')),server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6312,strictPort:true}});
try{
 for(const [index,mode]of series.order.entries()){
  const dir=resolve(out,index+'-'+mode),log=await open(resolve(out,index+'-'+mode+'.log'),'w'),env={...process.env,CXV_LOCAL_PRODUCTION:'1',CXV_PRODUCTION_OUT:production,CXV_ARTIFACT_MODE:'native',CXV_CAPTURE_OUT:dir,CXV_LAYOUT_PROFILE:'1',CXV_FOCUS_PROFILE:'1',CXV_SHADER_PREPARE:mode};
  for(const key of ['CXV_LABEL_SEARCH','CXV_LABEL_SEARCH_PAIRED','CXV_PRODUCTION','CXV_HUD_MODE','CXV_PROFILE','CXV_STRESS_ONLY','CXV_PENDING_BATCH','CXV_FACE_PROTOTYPE','CXV_OUTER_PROTOTYPE','CXV_NUMBER_METRICS','CXV_OFFLINE_NUMBER','CXV_CLOVER_LEAF','CXV_DRAWING_RESET','CXV_TRANSPARENT_WORK'])delete env[key];
  let code;try{code=await new Promise((done,reject)=>{const child=spawn(process.execPath,[resolve(root,'tools/v5vfx/benchmark-boss-play.mjs')],{cwd:root,env,stdio:['ignore',log.fd,log.fd]});child.once('error',reject);child.once('exit',done);});}finally{await log.close();}
  assert.equal(code,0,'Retained failed trial '+index);const bytes=await readFile(resolve(dir,'report.json')),trial=JSON.parse(bytes);assert(trial.pass&&trial.runs.length===2&&trial.runs.every(r=>r.shaderPreparation.stateExact&&r.shaderPlay.checksEnabled&&!r.blockedRequests.length));
  series.runs.push({index,mode,raw:resolve(dir,'report.json'),sha256:hash(bytes),pass:true});await writeFile(resolve(out,'series.json'),JSON.stringify(series,null,2)+'\n');console.log(new Date().toISOString()+' trial '+index+' '+mode+' passed');
 }
 series.pass=series.runs.length===6;
}finally{await new Promise(done=>server.httpServer.close(done));series.ended=new Date().toISOString();await writeFile(resolve(out,'series.json'),JSON.stringify(series,null,2)+'\n');}
