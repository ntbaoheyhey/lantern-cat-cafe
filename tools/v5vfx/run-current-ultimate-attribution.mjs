/** Reuse the verified native production artifact to locate remaining boss stalls. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile,open} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const production=resolve(root,'work/v5/CXV/films/V7-F-victory-native-production'),out=resolve(root,'work/v5/CXV/films/V7-F-current-ultimate-attribution');assert(!existsSync(out));
const series=JSON.parse(await readFile(resolve(production,'native-series.json'),'utf8'));assert(series.pass);await mkdir(out,{recursive:true});
const bytes=await readFile(resolve(production,'build.json')),build=JSON.parse(bytes),artifact=build.artifacts.find(a=>a.mode==='native');assert(artifact&&artifact.transformed===0);assert.equal(hash(await readFile(resolve(artifact.dist,'index.html'))),artifact.indexSha256);
const provenance={utc:new Date().toISOString(),buildManifest:resolve(production,'build.json'),buildManifestSha256:hash(bytes),durationMs:32000,source:build.source,indexSha256:artifact.indexSha256,tools:[]};
for(const name of ['run-current-ultimate-attribution.mjs','trace-boss-startup.mjs','production-candidate-fixture.mjs']){const b=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),b);provenance.tools.push({name,sha256:hash(b)});}
await writeFile(resolve(out,'provenance.json'),JSON.stringify(provenance,null,2)+'\n');
const {preview}=await import(require.resolve('vite')),server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6312,strictPort:true}}),log=await open(resolve(out,'trace.log'),'w');
try{const code=await new Promise((done,reject)=>{const p=spawn(process.execPath,[resolve(root,'tools/v5vfx/trace-boss-startup.mjs')],{cwd:root,env:{...process.env,CXV_PRODUCTION_OUT:production,CXV_ARTIFACT_MODE:'native',CXV_CAPTURE_OUT:out,CXV_TRACE_DURATION_MS:'32000'},stdio:['ignore',log.fd,log.fd]});p.once('error',reject);p.once('exit',done);});assert.equal(code,0);const raw=JSON.parse(await readFile(resolve(out,'report.json'),'utf8'));assert(raw.pass);console.log(JSON.stringify({utc:new Date().toISOString(),pass:true,runs:raw.runs.map(r=>({rate:r.rate,frames:r.frames.length,plans:r.plans.length}))}));}
finally{await log.close();await new Promise(done=>server.httpServer.close(done));}
