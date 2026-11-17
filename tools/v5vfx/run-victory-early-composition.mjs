/** Paired original baseline, early baseline freeze and natural candidate; preserved artifacts. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile,open} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const production=resolve(root,'work/v5/CXV/films/V7-F-victory-demand-production'),out=resolve(root,'work/v5/CXV/films/V7-F-victory-early-composition');
assert(!existsSync(out));await mkdir(out,{recursive:true});
const bytes=await readFile(resolve(production,'build.json')),build=JSON.parse(bytes);
const provenance={utc:new Date().toISOString(),buildManifest:resolve(production,'build.json'),buildManifestSha256:hash(bytes),tools:[],verifiedArtifacts:[]};
for(const artifact of build.artifacts){for(const file of artifact.files){const data=await readFile(resolve(artifact.dist,file.path));assert.equal(data.length,file.bytes);assert.equal(hash(data),file.sha256,file.path);}provenance.verifiedArtifacts.push({mode:artifact.mode,files:artifact.files.length,indexSha256:artifact.indexSha256});}
for(const name of ['run-victory-early-composition.mjs','diagnose-victory-early-composition.mjs','production-candidate-fixture.mjs']){const data=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),data);provenance.tools.push({name,sha256:hash(data)});}
await writeFile(resolve(out,'provenance.json'),JSON.stringify(provenance,null,2)+'\n');
const {preview}=await import(require.resolve('vite')),servers=[];
try{
 for(const artifact of build.artifacts)servers.push(await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:artifact.mode==='baseline'?6311:6312,strictPort:true}}));
 const order=[['baseline',false],['baseline',true],['native',false],['native',false],['baseline',true],['baseline',false]],trials=[];
 for(const [trial,[mode,early]]of order.entries()){
  const dir=resolve(out,`${trial}-${mode}-${early?'early':'natural'}`);await mkdir(dir);const log=await open(resolve(dir,'runner.log'),'w');
  try{const code=await new Promise((done,reject)=>{const child=spawn(process.execPath,['tools/v5vfx/diagnose-victory-early-composition.mjs'],{cwd:root,env:{...process.env,CXV_PRODUCTION_OUT:production,CXV_ARTIFACT_MODE:mode,CXV_EARLY_FREEZE:early?'1':'0',CXV_CAPTURE_OUT:dir},stdio:['ignore',log.fd,log.fd]});child.once('error',reject);child.once('exit',done);});assert.equal(code,0,dir);}
  finally{await log.close();}
  const reportPath=resolve(dir,'report.json'),data=await readFile(reportPath),r=JSON.parse(data);assert(r.pass);trials.push({trial,mode,early,reportPath,sha256:hash(data)});await writeFile(resolve(out,'trials.json'),JSON.stringify(trials,null,2)+'\n');console.log(JSON.stringify({utc:new Date().toISOString(),trial,mode,early,pass:r.pass,captures:r.captures.map(c=>({name:c.name,full:c.fullRgbSha256,crew:c.crewRgbSha256,draws:c.state.draws}))}));
 }
}finally{for(const server of servers)await new Promise(done=>server.httpServer.close(done));}
