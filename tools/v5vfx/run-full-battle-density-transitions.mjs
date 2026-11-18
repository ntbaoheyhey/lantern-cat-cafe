/** Complete natural battles while changing desktop density during active play. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,open} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const production=resolve(root,'work/v5/CXV/films/V7-F-density-native-production'),out=resolve(root,'work/v5/CXV/films/V7-F-full-battle-density-transitions');assert(!existsSync(out));
const bytes=await readFile(resolve(production,'build.json')),built=JSON.parse(bytes),artifact=built.artifacts.find(a=>a.mode==='native');assert.equal(artifact.transformed,0);assert.equal(built.runtimePatchSha256,hash(''));
for(const f of artifact.files)assert.equal(hash(await readFile(resolve(artifact.dist,f.path))),f.sha256);
await mkdir(out,{recursive:true});const provenance=[];
for(const name of ['run-full-battle-density-transitions.mjs','capture-full-battle-production.mjs','desktop-density.mjs','production-candidate-fixture.mjs']){const data=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),data);provenance.push({name,sha256:hash(data)});}
await writeFile(resolve(out,'tool-provenance.json'),JSON.stringify({utc:new Date().toISOString(),source:built.source,indexSha256:artifact.indexSha256,manifestSha256:hash(bytes),artifactFilesVerified:artifact.files.length,provenance},null,2)+'\n');
const {preview}=await import(require.resolve('vite')),server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6312,strictPort:true}});
try{
 const log=await open(resolve(out,'capture.log'),'w');let code;
 try{code=await new Promise((done,reject)=>{const child=spawn(process.execPath,['tools/v5vfx/capture-full-battle-production.mjs'],{cwd:root,env:{...process.env,CXV_PRODUCTION_OUT:production,CXV_ARTIFACT_MODE:'native',CXV_FULL_LOCAL:'1',CXV_FULL_CPU_RATE:'4',CXV_FULL_DPR:'2',CXV_FULL_DENSITY_TRANSITIONS:'1',CXV_CAPTURE_OUT:out},stdio:['ignore',log.fd,log.fd]});child.once('error',reject);child.once('exit',done);});}finally{await log.close();}
 assert.equal(code,0);const report=JSON.parse(await readFile(resolve(out,'report.json')));assert(report.pass);console.log(JSON.stringify({out,source:built.source,transitions:report.runs.map(r=>r.densityTransitions.length),pass:report.pass}));
}finally{await new Promise(done=>server.httpServer.close(done));}
