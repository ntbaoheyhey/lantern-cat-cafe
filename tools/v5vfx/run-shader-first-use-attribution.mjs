/** Attribute shader first-use work without disabling diagnostics or changing source. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile,open} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const production=resolve(root,'work/v5/CXV/films/V7-F-focus-read-native-production'),out=resolve(root,'work/v5/CXV/films/V7-F-shader-first-use-attribution');assert(!existsSync(out));
const accepted=JSON.parse(await readFile(resolve(root,'reports/v5/CXV/V7-F-focus-read-native-production.json'),'utf8'));assert(accepted.pass&&accepted.artifactFilesExactToPrototype&&accepted.reviewedUtc);
const manifest=await readFile(resolve(production,'build.json')),build=JSON.parse(manifest),artifact=build.artifacts.find(a=>a.mode==='native');assert(artifact?.transformed===0);assert.equal(build.source,accepted.source);assert.equal(artifact.indexSha256,accepted.indexSha256);
for(const file of artifact.files)assert.equal(hash(await readFile(resolve(artifact.dist,file.path))),file.sha256);
await mkdir(out,{recursive:true});const provenance={utc:new Date().toISOString(),buildManifest:{path:resolve(production,'build.json'),sha256:hash(manifest)},source:build.source,runtimePatchSha256:build.runtimePatchSha256,indexSha256:artifact.indexSha256,filesVerified:artifact.files.length,durationMs:32000,tools:[]};
for(const name of ['run-shader-first-use-attribution.mjs','trace-boss-startup.mjs','production-candidate-fixture.mjs']){const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);provenance.tools.push({name,sha256:hash(bytes)});}
await writeFile(resolve(out,'provenance.json'),JSON.stringify(provenance,null,2)+'\n');
const {preview}=await import(require.resolve('vite')),server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6312,strictPort:true}}),log=await open(resolve(out,'trace.log'),'w');
try{const code=await new Promise((done,reject)=>{const child=spawn(process.execPath,[resolve(root,'tools/v5vfx/trace-boss-startup.mjs')],{cwd:root,env:{...process.env,CXV_TRACE_JUDGE:'0',CXV_PRODUCTION_OUT:production,CXV_ARTIFACT_MODE:'native',CXV_CAPTURE_OUT:out,CXV_TRACE_DURATION_MS:'32000',CXV_TRACE_SHADER:'1'},stdio:['ignore',log.fd,log.fd]});child.once('error',reject);child.once('exit',done);});assert.equal(code,0);const raw=JSON.parse(await readFile(resolve(out,'report.json'),'utf8'));assert(raw.pass&&raw.runs.every(r=>r.shader.before.checksEnabled&&r.shader.after.checksEnabled));console.log(JSON.stringify({utc:new Date().toISOString(),pass:true,runs:raw.runs.map(r=>({rate:r.rate,frames:r.frames.length,plans:r.plans.length,shaderCalls:r.shader.calls.length}))}));}
finally{await log.close();await new Promise(done=>server.httpServer.close(done));}
