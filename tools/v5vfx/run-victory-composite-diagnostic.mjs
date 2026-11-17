/** Compare preserved baseline/candidate GPU pixels and diagnostic page composition. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile,open} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const production=resolve(root,'work/v5/CXV/films/V7-F-victory-demand-production'),out=resolve(root,'work/v5/CXV/films/V7-F-victory-composite-diagnostic');
assert(!existsSync(resolve(out,'report.json')));await mkdir(out,{recursive:true});
const build=JSON.parse(await readFile(resolve(production,'build.json'),'utf8'));
const report={utc:new Date().toISOString(),buildManifest:resolve(production,'build.json'),buildManifestSha256:hash(await readFile(resolve(production,'build.json'))),runs:[],tools:[],pass:false};
for(const name of ['run-victory-composite-diagnostic.mjs','diagnose-victory-composite.mjs','production-candidate-fixture.mjs']){const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);report.tools.push({name,sha256:hash(bytes)});}
const {preview}=await import(require.resolve('vite')),servers=[];
try{
 for(const [index,mode]of ['baseline','native'].entries()){
  const artifact=build.artifacts.find(a=>a.mode===mode);assert.equal(hash(await readFile(resolve(artifact.dist,'index.html'))),artifact.indexSha256);
  servers.push(await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6311+index,strictPort:true}}));
 }
 for(const mode of ['baseline','native']){
  const dir=resolve(out,mode),log=await open(resolve(out,mode+'.log'),'w');let code;
  try{code=await new Promise((done,reject)=>{const child=spawn(process.execPath,['tools/v5vfx/diagnose-victory-composite.mjs'],{cwd:root,env:{...process.env,CXV_PRODUCTION_OUT:production,CXV_ARTIFACT_MODE:mode,CXV_CAPTURE_OUT:dir},stdio:['ignore',log.fd,log.fd]});child.once('error',reject);child.once('exit',done);});}finally{await log.close();}
  assert.equal(code,0);const raw=resolve(dir,'report.json'),r=JSON.parse(await readFile(raw,'utf8'));assert(r.pass);report.runs.push({...r,raw,rawSha256:hash(await readFile(raw))});console.log(new Date().toISOString()+' composite '+mode+' complete');
 }
 const [a,b]=report.runs;report.gpuExact=[a.initialGpu,a.restoredGpu,b.initialGpu,b.restoredGpu].every(r=>r.sha256===a.initialGpu.sha256);
 report.compositionChecks=a.captures.map((c,i)=>({name:c.name,equal:c.rgbSha256===b.captures[i].rgbSha256,hashes:[c.rgbSha256,b.captures[i].rgbSha256]}));report.pass=report.gpuExact;assert(report.gpuExact);
}finally{await Promise.all(servers.map(server=>new Promise(done=>server.httpServer.close(done))));report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
