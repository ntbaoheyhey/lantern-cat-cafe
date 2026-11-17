/** Diagnostic CPU sample of an existing measured artifact; profiler overhead is not a comparison result. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile,mkdir,open,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,appRoot,require} from './build-hud-production.mjs';
const out=resolve(process.env.CXV_PRODUCTION_OUT??resolve(root,'work/v5/CXV/films/V7-F-hud-production'));
const mode=process.env.CXV_PROFILE_ARTIFACT_MODE??'text';assert(['text','native'].includes(mode));
const capture=resolve(process.env.CXV_CAPTURE_OUT??resolve(out,'diagnostic-'+mode));
assert(out.startsWith(resolve(root,'work/v5/CXV')+'/')&&capture.startsWith(resolve(root,'work/v5/CXV')+'/'));
assert(!existsSync(capture),'Preserve prior diagnostic; choose a fresh directory');
const build=JSON.parse(await readFile(resolve(out,'build.json'),'utf8'));
assert(build.staticAssetsExact);const artifact=build.artifacts.find(a=>a.mode===mode);assert(artifact);
await mkdir(capture,{recursive:true});
const {preview}=await import(require.resolve('vite'));
const server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6312,strictPort:true}});
const log=await open(resolve(capture,'run.log'),'w');
try{
 const env={...process.env,CXV_LOCAL_PRODUCTION:'1',CXV_PRODUCTION_OUT:out,CXV_ARTIFACT_MODE:mode,CXV_CAPTURE_OUT:capture,CXV_PROFILE:'1',CXV_LAYOUT_PROFILE:'1'};
 for(const key of ['CXV_LABEL_SEARCH','CXV_LABEL_SEARCH_PAIRED','CXV_PRODUCTION','CXV_HUD_MODE','CXV_FOCUS_PROFILE','CXV_METHOD_PROFILE','CXV_STRESS_ONLY','CXV_PENDING_BATCH','CXV_FACE_PROTOTYPE','CXV_OUTER_PROTOTYPE','CXV_NUMBER_METRICS'])delete env[key];
 const code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['tools/v5vfx/benchmark-boss-play.mjs'],{cwd:root,env,stdio:['ignore',log.fd,log.fd]});child.once('error',reject);child.once('exit',resolve);});
 assert.equal(code,0,'Diagnostic failed; see '+resolve(capture,'run.log'));
 const report=JSON.parse(await readFile(resolve(capture,'report.json'),'utf8'));assert(report.pass&&report.localProduction&&report.runs.length===1&&report.runs[0].rate===4);
 await writeFile(resolve(capture,'diagnostic.json'),JSON.stringify({utc:new Date().toISOString(),source:build.source,mode,indexSha256:artifact.indexSha256,profile:resolve(capture,'cpu.cpuprofile'),report:resolve(capture,'report.json'),limits:'CPU sampling adds overhead. Attribution only; retain the unprofiled six-trial series for performance comparison.'},null,2));
 console.log('Production CPU diagnostic complete: '+capture);
}finally{await log.close();await new Promise(resolve=>server.httpServer.close(resolve));}
