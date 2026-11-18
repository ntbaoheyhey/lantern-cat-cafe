/** Attribute remaining late stalls on the exact native DPR2 artifact already reviewed. */
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile,open} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const production=resolve(root,'work/v5/CXV/films/V7-F-battle-context-native-production');
const out=resolve(root,'work/v5/CXV/films/V7-F-battle-context-attribution');assert(!existsSync(out));
const verified=JSON.parse(await readFile(resolve(root,'reports/v5/CXV/V7-F-battle-context-native-verified.json')));
assert(verified.pass&&verified.visualPass&&verified.reviewedUtc);
assert.equal(hash(await readFile(verified.production.path)),verified.production.sha256);
const bytes=await readFile(resolve(production,'build.json')),build=JSON.parse(bytes),artifact=build.artifacts[0];
assert.equal(artifact.mode,'native');assert.equal(artifact.transformed,0);assert.equal(build.runtimePatchSha256,hash(''));
assert.equal(execFileSync('git',['diff','--name-only',build.source,'--','apps/web/src','apps/web/public'],{cwd:root,encoding:'utf8'}).trim(),'');
for(const file of artifact.files)assert.equal(hash(await readFile(resolve(artifact.dist,file.path))),file.sha256);
await mkdir(out,{recursive:true});
const provenance={utc:new Date().toISOString(),buildManifest:resolve(production,'build.json'),buildManifestSha256:hash(bytes),durationMs:32000,deviceScaleFactor:2,source:build.source,indexSha256:artifact.indexSha256,tools:[]};
for(const name of ['run-battle-context-attribution.mjs','trace-boss-startup.mjs','analyze-startup-attribution.mjs','desktop-density.mjs','production-candidate-fixture.mjs']){
 const b=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),b);provenance.tools.push({name,sha256:hash(b)});
}
await writeFile(resolve(out,'provenance.json'),JSON.stringify(provenance,null,2)+'\n');
const env={...process.env};for(const key of Object.keys(env))if(key.startsWith('CXV_'))delete env[key];
const {preview}=await import(require.resolve('vite'));
const server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6312,strictPort:true}});
const log=await open(resolve(out,'trace.log'),'w');
try{
 const code=await new Promise((done,reject)=>{
  const child=spawn(process.execPath,[resolve(root,'tools/v5vfx/trace-boss-startup.mjs')],{cwd:root,env:{...env,CXV_PRODUCTION_OUT:production,CXV_ARTIFACT_MODE:'native',CXV_CAPTURE_OUT:out,CXV_TRACE_DURATION_MS:'32000',CXV_TRACE_DPR:'2'},stdio:['ignore',log.fd,log.fd]});
  child.once('error',reject);child.once('exit',done);
 });
 assert.equal(code,0);const raw=JSON.parse(await readFile(resolve(out,'report.json')));assert(raw.pass);assert.equal(raw.deviceScaleFactor,2);
 console.log(JSON.stringify({utc:new Date().toISOString(),pass:true,out,source:build.source,runs:raw.runs.map(r=>({rate:r.rate,frames:r.frames.length,plans:r.plans.length}))}));
}finally{await log.close();await new Promise(done=>server.httpServer.close(done));}
