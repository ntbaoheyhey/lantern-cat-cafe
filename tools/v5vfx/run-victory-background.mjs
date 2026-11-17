/** Run one targeted background-isolation pair against preserved artifacts. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile,open} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const production=resolve(root,'work/v5/CXV/films/V7-F-victory-demand-production'),out=resolve(process.env.CXV_BACKGROUND_OUT??resolve(root,'work/v5/CXV/films/V7-F-victory-background-attribution'));
assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));
assert(!existsSync(resolve(out,'provenance.json')));await mkdir(out,{recursive:true});
const bytes=await readFile(resolve(production,'build.json')),build=JSON.parse(bytes),provenance={utc:new Date().toISOString(),buildManifest:resolve(production,'build.json'),buildManifestSha256:hash(bytes),tools:[],verifiedArtifacts:[]};
for(const a of build.artifacts){for(const f of a.files){const b=await readFile(resolve(a.dist,f.path));assert.equal(b.length,f.bytes);assert.equal(hash(b),f.sha256);}provenance.verifiedArtifacts.push({mode:a.mode,files:a.files.length,indexSha256:a.indexSha256});}
for(const name of ['run-victory-background.mjs','diagnose-victory-background.mjs','production-candidate-fixture.mjs']){const b=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),b);provenance.tools.push({name,sha256:hash(b)});}
await writeFile(resolve(out,'provenance.json'),JSON.stringify(provenance,null,2)+'\n');
const {preview}=await import(require.resolve('vite')),servers=[],trials=[];
try{
 for(const a of build.artifacts)servers.push(await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:a.dist},preview:{host:'127.0.0.1',port:a.mode==='baseline'?6311:6312,strictPort:true}}));
 for(const mode of ['baseline','native']){
  for(const stop of ['STOP-ALL','STOP-CXV'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+stop));
  const dir=resolve(out,mode);await mkdir(dir);const log=await open(resolve(dir,'runner.log'),'w');
  try{const code=await new Promise((done,reject)=>{const child=spawn(process.execPath,['tools/v5vfx/diagnose-victory-background.mjs'],{cwd:root,env:{...process.env,CXV_PRODUCTION_OUT:production,CXV_ARTIFACT_MODE:mode,CXV_CAPTURE_OUT:dir},stdio:['ignore',log.fd,log.fd]});child.once('error',reject);child.once('exit',done);});assert.equal(code,0,mode);}finally{await log.close();}
  const path=resolve(dir,'report.json'),b=await readFile(path),r=JSON.parse(b);assert(r.pass);trials.push({mode,path,sha256:hash(b)});await writeFile(resolve(out,'trials.json'),JSON.stringify(trials,null,2)+'\n');console.log(JSON.stringify({utc:new Date().toISOString(),mode,pass:r.pass,captures:r.captures.map(c=>({name:c.name,reference:c.reference}))}));
 }
}finally{for(const server of servers)await new Promise(done=>server.httpServer.close(done));}
