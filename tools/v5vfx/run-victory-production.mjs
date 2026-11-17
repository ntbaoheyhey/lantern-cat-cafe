/** Preserve two isolated artifacts and six alternating result-screen trials. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile,open} from 'node:fs/promises';
import {resolve} from 'node:path';
import {buildProductionComparison,root,appRoot,require} from './build-hud-production.mjs';
import {sources,victoryModule,hash} from './victory-demand-source.mjs';
const out=resolve(root,'work/v5/CXV/films/V7-F-victory-demand-production');await mkdir(out,{recursive:true});
const source=await sources(root);await writeFile(resolve(out,'baseline-VictoryCrew.tsx'),source.original);await writeFile(resolve(out,'candidate-VictoryCrew.tsx'),source.candidate);
const toolNames=['run-victory-production.mjs','benchmark-victory-production.mjs','victory-demand-source.mjs','build-hud-production.mjs','production-candidate-fixture.mjs'],provenance=[];
for(const name of toolNames){const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);provenance.push({name,sha256:hash(bytes)});}
await writeFile(resolve(out,'tool-provenance.json'),JSON.stringify(provenance,null,2));
const built=await buildProductionComparison(out,{modulePath:victoryModule,currentSource:source.original,variants:{baseline:source.original,native:source.candidate},metadata:{experiment:'victory-demand-browser-prototype',baselineModuleSha256:source.originalSha256,candidateModuleSha256:source.candidateSha256,candidateIsApplicationSource:false}});assert(built.staticAssetsExact);
const {preview}=await import(require.resolve('vite')),servers=[];
const series={utc:new Date().toISOString(),order:['baseline','native','native','baseline','baseline','native'],buildManifest:resolve(out,'build.json'),runs:[],pass:false};
try{
 for(const [index,mode]of ['baseline','native'].entries())servers.push(await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:resolve(out,mode)},preview:{host:'127.0.0.1',port:6311+index,strictPort:true}}));
 for(const [index,mode]of series.order.entries()){
  const dir=resolve(out,'trials',`${index}-${mode}`),log=await open(resolve(out,`${index}-${mode}.log`),'w');let code;
  try{code=await new Promise((done,reject)=>{const child=spawn(process.execPath,['tools/v5vfx/benchmark-victory-production.mjs'],{cwd:root,env:{...process.env,CXV_PRODUCTION_OUT:out,CXV_ARTIFACT_MODE:mode,CXV_CAPTURE_OUT:dir},stdio:['ignore',log.fd,log.fd]});child.once('error',reject);child.once('exit',done);});}finally{await log.close();}
  assert.equal(code,0,`Victory trial ${index}-${mode} failed`);const raw=resolve(dir,'report.json'),trial=JSON.parse(await readFile(raw,'utf8'));assert(trial.pass);
  series.runs.push({index,mode,raw,pass:true});await writeFile(resolve(out,'series.json'),JSON.stringify(series,null,2));console.log(new Date().toISOString()+` victory trial ${index} ${mode} passed`);
 }
 series.pass=series.runs.length===6;
}finally{await Promise.all(servers.map(server=>new Promise(done=>server.httpServer.close(done))));series.ended=new Date().toISOString();await writeFile(resolve(out,'series.json'),JSON.stringify(series,null,2));}
