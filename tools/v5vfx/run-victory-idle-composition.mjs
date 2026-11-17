/** Serve the preserved baseline for the browser-only idle composition probe. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile,open} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const production=resolve(root,'work/v5/CXV/films/V7-F-victory-demand-production'),out=resolve(root,'work/v5/CXV/films/V7-F-victory-idle-composition');
assert(!existsSync(resolve(out,'provenance.json')));await mkdir(out,{recursive:true});
const bytes=await readFile(resolve(production,'build.json')),build=JSON.parse(bytes),artifact=build.artifacts.find(a=>a.mode==='baseline');
assert.equal(hash(await readFile(resolve(artifact.dist,'index.html'))),artifact.indexSha256);
const provenance={utc:new Date().toISOString(),buildManifest:resolve(production,'build.json'),buildManifestSha256:hash(bytes),tools:[]};
for(const name of ['run-victory-idle-composition.mjs','diagnose-victory-idle-composition.mjs','production-candidate-fixture.mjs']){const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);provenance.tools.push({name,sha256:hash(bytes)});}
await writeFile(resolve(out,'provenance.json'),JSON.stringify(provenance,null,2)+'\n');
const {preview}=await import(require.resolve('vite'));
const server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6311,strictPort:true}});
const log=await open(resolve(out,'baseline.log'),'w');
try{
 const code=await new Promise((done,reject)=>{const child=spawn(process.execPath,['tools/v5vfx/diagnose-victory-idle-composition.mjs'],{cwd:root,env:{...process.env,CXV_PRODUCTION_OUT:production,CXV_ARTIFACT_MODE:'baseline',CXV_CAPTURE_OUT:out},stdio:['ignore',log.fd,log.fd]});child.once('error',reject);child.once('exit',done);});
 assert.equal(code,0);const r=JSON.parse(await readFile(resolve(out,'report.json'),'utf8'));assert(r.pass);console.log(JSON.stringify({utc:new Date().toISOString(),pass:r.pass,captures:r.captures.map(c=>({name:c.name,full:c.fullRgbSha256,crew:c.crewRgbSha256,state:c.state}))}));
}finally{await log.close();await new Promise(done=>server.httpServer.close(done));}
