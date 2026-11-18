/** Build native density repair, verify transitions, then ordinary DPR2 play. */
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile,open} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,appRoot,require,buildProductionComparison} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const out=resolve(root,'work/v5/CXV/films/V7-F-density-native-production');assert(!existsSync(out));await mkdir(out,{recursive:true});
const modulePath='apps/web/src/game/cardrpg/spine/scene.ts',currentSource=await readFile(resolve(root,modulePath),'utf8'),snapshots=[];
for(const name of ['run-density-native-production.mjs','build-hud-production.mjs','probe-desktop-density-prototype.mjs','desktop-density-prototype.mjs','desktop-density.mjs','benchmark-boss-play.mjs','production-candidate-fixture.mjs']){const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);snapshots.push({name,sha256:hash(bytes)});}
const built=await buildProductionComparison(out,{modulePath,currentSource,variants:{native:currentSource},metadata:{nativeDensitySha256:hash(currentSource)}}),artifact=built.artifacts[0];assert.equal(artifact.transformed,0);assert.equal(built.runtimePatchSha256,hash(''));
const baseEnv={...process.env};for(const key of Object.keys(baseEnv))if(key.startsWith('CXV_'))delete baseEnv[key];
const run=async(script,extra,name)=>{const log=await open(resolve(out,name+'.log'),'w');try{const code=await new Promise((done,reject)=>{const child=spawn(process.execPath,[resolve(root,'tools/v5vfx',script)],{cwd:root,env:{...baseEnv,...extra},stdio:['ignore',log.fd,log.fd]});child.once('error',reject);child.once('exit',done);});assert.equal(code,0,name+' failed');}finally{await log.close();}};
const probeOut=resolve(out,'probe');await run('probe-desktop-density-prototype.mjs',{CXV_DENSITY_NATIVE:'1',CXV_DENSITY_PRODUCTION:out,CXV_DENSITY_PROBE_OUT:probeOut},'probe');
const probeBytes=await readFile(resolve(probeOut,'report.json')),probe=JSON.parse(probeBytes);assert(probe.pass&&probe.mode==='native');
for(const r of probe.runs)for(const row of r.rows){assert(row.matchedNativeRgbExact&&row.geometryExact);for(const b of Object.values(row.density.composer))assert.deepEqual(b,row.density.drawingBuffer);}
const {preview}=await import(require.resolve('vite')),server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6312,strictPort:true}});
try{
 await run('benchmark-boss-play.mjs',{CXV_LOCAL_PRODUCTION:'1',CXV_PRODUCTION_OUT:out,CXV_ARTIFACT_MODE:'native',CXV_CAPTURE_OUT:resolve(out,'trial'),CXV_DESKTOP_DPR:'2'},'trial');
 const rawPath=resolve(out,'trial/report.json'),rawBytes=await readFile(rawPath),raw=JSON.parse(rawBytes);assert(raw.pass&&raw.runs.length===2&&raw.runs.every(r=>!r.blockedRequests.length));
 const captures=[];
 for(const r of raw.runs){const path=resolve(out,'trial',`boss-${r.rate}x.png`),png=await readFile(path);assert.equal(png.readUInt32BE(16),1280);assert.equal(png.readUInt32BE(20),720);const rgb=execFileSync('ffmpeg',['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:4*1024*1024});const review=resolve(out,r.rate+'x-review.jpg');execFileSync('ffmpeg',['-v','error','-i',path,'-vf','scale=1024:576','-frames:v','1','-q:v','3',review]);captures.push({rate:r.rate,path,width:1280,height:720,sha256:hash(png),rgbSha256:hash(rgb),review:{path:review,width:1024,height:576,sha256:hash(await readFile(review))}});}
 const report={utc:new Date().toISOString(),source:built.source,runtimePatchSha256:built.runtimePatchSha256,indexSha256:artifact.indexSha256,nativeDensitySha256:hash(currentSource),artifactTransforms:0,envDir:false,artifactFiles:artifact.files.length,snapshots,probe:{path:resolve(probeOut,'report.json'),sha256:hash(probeBytes),exactRgbPairs:16,geometrySets:16,lifecycles:4},raw:{path:rawPath,sha256:hash(rawBytes)},buildManifest:{path:resolve(out,'build.json'),sha256:hash(await readFile(resolve(out,'build.json')))},url:raw.url,viewport:raw.viewport,deviceScaleFactor:2,started:raw.utc,ended:raw.ended,pass:true,runs:raw.runs.map(r=>({rate:r.rate,elapsedMs:r.elapsedMs,actions:r.plans.filter(p=>p.kind==='action').length,ultimates:r.plans.filter(p=>p.ultimate).length,frame:r.frameMs,density:r.desktopDensity,blockedRequests:r.blockedRequests})),errors:raw.errors,captures,reviewedUtc:null,limits:'Untransformed local build;no independent judge acceptance or before/after performance claim. Density transitions use CDP emulation,not a physical monitor. Host-relative4x is not physical laptop equivalence.'};
 await writeFile(resolve(root,'reports/v5/CXV/V7-F-density-native-production.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({out,pass:report.pass,source:built.source,indexSha256:artifact.indexSha256,runs:report.runs}));
}finally{await new Promise(done=>server.httpServer.close(done));}
