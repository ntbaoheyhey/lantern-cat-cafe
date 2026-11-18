/** Untransformed native outcome density: transition lifecycle, then ordinary 32s trials. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,open} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {root,appRoot,require,buildProductionComparison} from './build-hud-production.mjs';
import {hash,victoryModule} from './victory-demand-source.mjs';
const out=resolve(root,'work/v5/CXV/films/V7-E-victory-density-native-production');assert(!existsSync(out));await mkdir(out,{recursive:true});
const currentSource=await readFile(resolve(root,victoryModule),'utf8'),snapshots=[];
for(const name of ['run-victory-density-native.mjs','build-hud-production.mjs','probe-victory-density.mjs','benchmark-victory-production.mjs','production-candidate-fixture.mjs']){
 const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);snapshots.push({name,sha256:hash(bytes)});
}
const built=await buildProductionComparison(out,{modulePath:victoryModule,currentSource,variants:{native:currentSource},metadata:{victoryDensitySha256:hash(currentSource)}}),artifact=built.artifacts[0];
assert.equal(artifact.transformed,0);assert.equal(built.runtimePatchSha256,hash(''));
const baseEnv={...process.env};for(const key of Object.keys(baseEnv))if(key.startsWith('CXV_'))delete baseEnv[key];
const run=async(script,env,name)=>{const log=await open(resolve(out,name+'.log'),'w');try{const code=await new Promise((done,reject)=>{const child=spawn(process.execPath,[resolve(root,'tools/v5vfx',script)],{cwd:root,env:{...baseEnv,...env},stdio:['ignore',log.fd,log.fd]});child.once('error',reject);child.once('exit',done);});assert.equal(code,0,name+' failed');}finally{await log.close();}};
await run('probe-victory-density.mjs',{CXV_VICTORY_DENSITY_NATIVE:'1',CXV_VICTORY_DENSITY_PRODUCTION:out,CXV_VICTORY_DENSITY_OUT:resolve(out,'probe')},'probe');
const probePath=resolve(out,'probe/report.json'),probeBytes=await readFile(probePath),probe=JSON.parse(probeBytes);assert(probe.pass&&probe.native);
const {preview}=await import(require.resolve('vite')),server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6312,strictPort:true}});
try{
 await run('benchmark-victory-production.mjs',{CXV_PRODUCTION_OUT:out,CXV_ARTIFACT_MODE:'native',CXV_CAPTURE_OUT:resolve(out,'trial'),CXV_VICTORY_DPR:'2'},'trial');
 const rawPath=resolve(out,'trial/report.json'),bytes=await readFile(rawPath),raw=JSON.parse(bytes);assert(raw.pass&&raw.runs.length===4);
 for(const run of raw.runs){assert.deepEqual(run.errors,[]);assert.deepEqual(run.blockedRequests,[]);if(run.reduced){assert.equal(run.counters.draws,0);assert.equal(run.counters.uploads,0);}}
 const report={utc:new Date().toISOString(),source:built.source,victoryDensitySha256:hash(currentSource),runtimePatchSha256:built.runtimePatchSha256,indexSha256:artifact.indexSha256,artifactTransforms:0,artifactFiles:artifact.files.length,envDir:false,snapshots,
 buildManifest:{path:resolve(out,'build.json'),sha256:hash(await readFile(resolve(out,'build.json')))},probe:{path:probePath,sha256:hash(probeBytes),transitions:6,captures:8},raw:{path:rawPath,sha256:hash(bytes)},url:raw.url,viewport:raw.viewport,deviceScaleFactor:2,started:probe.utc,ended:raw.ended,runs:raw.runs,pass:true,reviewedUtc:null,
 limits:'Native local artifact; independent judge acceptance pending. Synthetic media events exercise reduced invalidation because CDP is not physical monitor delivery. Ordinary32s normal/reduced CPU1x/4x coverage is descriptive, not a calibrated laptop or before/after benchmark.'};
 await writeFile(resolve(root,'reports/v5/CXV/V7-E-victory-density-native-production.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({out,pass:true,source:built.source,runs:raw.runs.map(r=>({rate:r.rate,reduced:r.reduced,counters:r.counters,errors:r.errors}))}));
}finally{await new Promise(done=>server.httpServer.close(done));}
