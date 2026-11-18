/** Native repair, recovery lifecycle, and ordinary DPR2 boss coverage. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,open} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {spawn,execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {root,appRoot,require,buildProductionComparison} from './build-hud-production.mjs';
import {battleModule} from './battle-context-source.mjs';
import {hash} from './victory-demand-source.mjs';
const out=resolve(root,'work/v5/CXV/films/V7-F-battle-context-native-production');assert(!existsSync(out));await mkdir(out,{recursive:true});
const source=await readFile(resolve(root,battleModule),'utf8'),types=JSON.parse(await readFile(resolve(root,'reports/v5/CXV/V7-F-battle-context-types.json')));
assert(types.pass&&!types.prototype);assert.equal(hash(source),types.sceneSha256);assert.equal(hash(execFileSync('git',['show','HEAD:'+battleModule],{cwd:root})),hash(source));
const path=resolve(out,'native-scene.ts');await writeFile(path,source);const snapshots=[];
for(const name of ['run-battle-context-native.mjs','build-hud-production.mjs','probe-battle-context-loss.mjs','probe-battle-context-lifecycle.mjs','measure-battle-context.mjs','desktop-density.mjs','benchmark-boss-play.mjs','production-candidate-fixture.mjs']){const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);snapshots.push({name,sha256:hash(bytes)});}
const built=await buildProductionComparison(out,{modulePath:battleModule,currentSource:source,variants:{native:source},metadata:{candidateSceneSha256:hash(source),candidatePath:path,snapshots}}),artifact=built.artifacts[0];assert.equal(artifact.transformed,0);assert.equal(built.runtimePatchSha256,hash(''));
const env={...process.env};for(const key of Object.keys(env))if(key.startsWith('CXV_'))delete env[key];
const run=async(script,extra,name)=>{const log=await open(resolve(out,name+'.log'),'w');try{const code=await new Promise((done,reject)=>{const child=spawn(process.execPath,[resolve(root,'tools/v5vfx',script)],{cwd:root,env:{...env,...extra},stdio:['ignore',log.fd,log.fd]});child.once('error',reject);child.once('exit',done);});assert.equal(code,0,name+' failed');}finally{await log.close();}};
await run('probe-battle-context-loss.mjs',{CXV_BATTLE_CONTEXT_REPAIR:'1',CXV_BATTLE_CONTEXT_PRODUCTION:out,CXV_BATTLE_CONTEXT_OUT:resolve(out,'context')},'context');
await run('probe-battle-context-lifecycle.mjs',{CXV_BATTLE_CONTEXT_NATIVE:'1',CXV_BATTLE_CONTEXT_PRODUCTION:out,CXV_BATTLE_CONTEXT_LIFECYCLE_OUT:resolve(out,'lifecycle')},'lifecycle');
await run('measure-battle-context.mjs',{CXV_BATTLE_CONTEXT_NATIVE:'1'},'measure');
const {preview}=await import(require.resolve('vite')),server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6312,strictPort:true}});
try{
 await run('benchmark-boss-play.mjs',{CXV_LOCAL_PRODUCTION:'1',CXV_PRODUCTION_OUT:out,CXV_ARTIFACT_MODE:'native',CXV_CAPTURE_OUT:resolve(out,'trial'),CXV_DESKTOP_DPR:'2'},'trial');
 const rawPath=resolve(out,'trial/report.json'),rawBytes=await readFile(rawPath),raw=JSON.parse(rawBytes);assert(raw.pass&&raw.runs.length===2);assert.deepEqual(raw.errors,[]);
 const captures=[];
 for(const row of raw.runs){
  assert.deepEqual(row.blockedRequests,[]);assert(row.elapsedMs>=32000&&row.elapsedMs<36000);
  const path=resolve(out,'trial',`boss-${row.rate}x.png`),bytes=await readFile(path);assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);
  const rgb=execFileSync('ffmpeg',['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:4*1024*1024});const mean=rgb.reduce((a,b)=>a+b,0)/rgb.length,stdDev=Math.sqrt(rgb.reduce((a,b)=>a+(b-mean)**2,0)/rgb.length);assert(stdDev>10);
  const review=resolve(out,row.rate+'x-review.jpg');execFileSync('ffmpeg',['-v','error','-i',path,'-vf','scale=1024:576','-frames:v','1','-q:v','3',review]);
  captures.push({path,rate:row.rate,width:1280,height:720,sha256:hash(bytes),rgbSha256:hash(rgb),mean,stdDev,review:{path:review,width:1024,height:576,sha256:hash(await readFile(review))}});
 }
 const contextPath=resolve(root,'reports/v5/CXV/V7-F-battle-context-native.json'),lifecyclePath=resolve(root,'reports/v5/CXV/V7-F-battle-context-native-lifecycle.json');
 const contextBytes=await readFile(contextPath),lifecycleBytes=await readFile(lifecyclePath),context=JSON.parse(contextBytes),lifecycle=JSON.parse(lifecycleBytes);assert(context.pass&&context.restoredRgbExact&&lifecycle.pass&&lifecycle.native);
 const report={utc:new Date().toISOString(),source:built.source,indexSha256:artifact.indexSha256,runtimePatchSha256:hash(''),componentSha256:hash(source),artifactTransforms:0,artifactFiles:artifact.files.length,snapshots,
  buildManifest:{path:resolve(out,'build.json'),sha256:hash(await readFile(resolve(out,'build.json')))},context:{path:contextPath,sha256:hash(contextBytes)},lifecycle:{path:lifecyclePath,sha256:hash(lifecycleBytes)},raw:{path:rawPath,sha256:hash(rawBytes)},
  url:raw.url,viewport:raw.viewport,deviceScaleFactor:2,runs:raw.runs.map(r=>({rate:r.rate,elapsedMs:r.elapsedMs,actions:r.plans.filter(p=>p.kind==='action').length,ultimates:r.plans.filter(p=>p.ultimate).length,frame:r.frameMs,frameScope:'Steady window beginning at 2000ms',steadyWindowStartMs:r.steadyWindowStartMs,wholeRun:r.wholeRun,startup:r.startup,density:r.desktopDensity,blockedRequests:r.blockedRequests})),errors:raw.errors,captures,pass:true,reviewedUtc:null,
  limits:'Untransformed local application;independent acceptance pending. Native extension events are injected failures,not hardware incidence. Density/motion/error-notification controls are synthetic. Ordinary CPU1x/4x runs are configuration coverage,not a speedup or physical laptop equivalence.'};
 await writeFile(resolve(root,'reports/v5/CXV/V7-F-battle-context-native-production.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({out,pass:true,source:built.source,indexSha256:artifact.indexSha256,runs:report.runs}));
}finally{await new Promise(resolve=>server.httpServer.close(resolve));}
