/** Reuse a verified, untransformed artifact for complete natural battle validation. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,open} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const buildDir=resolve(process.env.CXV_PRODUCTION_OUT),out=resolve(process.env.CXV_CAPTURE_OUT),mode=process.env.CXV_ARTIFACT_MODE;
assert([buildDir,out].every(p=>p.startsWith(resolve(root,'work/v5/CXV')+'/')));
assert(['baseline','native'].includes(mode));assert(!existsSync(out),'Preserve earlier evidence');
for(const name of ['STOP-ALL','STOP-CXV'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),'STOP: '+name);
const manifest=await readFile(resolve(buildDir,'build.json')),built=JSON.parse(manifest),artifact=built.artifacts.find(a=>a.mode===mode);
assert(artifact&&artifact.transformed===0&&artifact.dist===resolve(buildDir,mode));
assert.equal(hash(await readFile(resolve(artifact.dist,'index.html'))),artifact.indexSha256);
for(const file of artifact.files){const bytes=await readFile(resolve(artifact.dist,file.path));assert.equal(bytes.length,file.bytes);assert.equal(hash(bytes),file.sha256);}
await mkdir(out,{recursive:true});const snapshots=[];
for(const name of ['run-built-full-battle.mjs','capture-full-battle-production.mjs','production-candidate-fixture.mjs']){const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);snapshots.push({name,sha256:hash(bytes)});}
await writeFile(resolve(out,'artifact-verification.json'),JSON.stringify({utc:new Date().toISOString(),manifest:{path:resolve(buildDir,'build.json'),sha256:hash(manifest)},source:built.source,runtimePatchSha256:built.runtimePatchSha256,indexSha256:artifact.indexSha256,filesVerified:artifact.files.length,transformed:artifact.transformed,snapshots},null,2)+'\n');
const {preview}=await import(require.resolve('vite')),server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:mode==='baseline'?6311:6312,strictPort:true}});
try{
 const log=await open(resolve(out,'capture.log'),'w');let code;
 try{code=await new Promise((done,reject)=>{const child=spawn(process.execPath,[resolve(root,'tools/v5vfx/capture-full-battle-production.mjs')],{cwd:root,env:{...process.env,CXV_PRODUCTION_OUT:buildDir,CXV_ARTIFACT_MODE:mode,CXV_FULL_LOCAL:'1',CXV_CAPTURE_OUT:out},stdio:['ignore',log.fd,log.fd]});child.once('error',reject);child.once('exit',done);});}finally{await log.close();}
 assert.equal(code,0);const raw=JSON.parse(await readFile(resolve(out,'report.json'),'utf8'));assert(raw.pass&&raw.runs.length===2&&raw.runs.every(r=>!r.blockedRequests.length));
 console.log(JSON.stringify({utc:new Date().toISOString(),out,pass:raw.pass,source:raw.servedSource,index:raw.indexSha256,cpuRate:raw.cpuRate}));
}finally{await new Promise(done=>server.httpServer.close(done));}
