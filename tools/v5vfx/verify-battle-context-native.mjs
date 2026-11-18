/** Verify archived native recovery, lifecycle, ordinary-play and capture provenance. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {hash} from './victory-demand-source.mjs';
import {battleModule} from './battle-context-source.mjs';
const root=resolve(import.meta.dirname,'../..');
const output=resolve(root,'reports/v5/CXV/V7-F-battle-context-native-verified.json');
assert(!existsSync(output));
const read=async path=>JSON.parse(await readFile(path,'utf8'));
const productionPath=resolve(root,'reports/v5/CXV/V7-F-battle-context-native-production.json');
const production=await read(productionPath);assert(production.pass&&!production.reviewedUtc);
for(const ref of [production.buildManifest,production.context,production.lifecycle,production.raw])assert.equal(hash(await readFile(ref.path)),ref.sha256);
const build=await read(production.buildManifest.path),artifact=build.artifacts[0],dir=dirname(production.buildManifest.path);
assert.equal(build.artifacts.length,1);assert.equal(artifact.mode,'native');assert.equal(artifact.transformed,0);assert.equal(build.envDir,false);
assert.equal(build.runtimePatchSha256,hash(''));assert.equal(production.runtimePatchSha256,hash(''));
assert.equal(production.source,build.source);assert.equal(production.indexSha256,artifact.indexSha256);
assert.equal(production.componentSha256,build.candidateSceneSha256);
assert.equal(hash(execFileSync('git',['show',build.source+':'+battleModule],{cwd:root})),production.componentSha256);
for(const file of artifact.files)assert.equal(hash(await readFile(resolve(artifact.dist,file.path))),file.sha256);
for(const snapshot of production.snapshots)assert.equal(hash(await readFile(resolve(dir,snapshot.name))),snapshot.sha256);
const context=await read(production.context.path),lifecycle=await read(production.lifecycle.path),raw=await read(production.raw.path);
assert(context.pass&&context.repair&&!context.candidate&&!context.reproduced&&context.restoredRgbExact);
assert(lifecycle.pass&&lifecycle.native&&raw.pass);
for(const report of [context,lifecycle,raw]){
 assert.equal(report.indexSha256,artifact.indexSha256);assert.equal(report.buildSource,build.source);
 assert.equal(report.buildRuntimePatchSha256,hash(''));assert.equal(report.url,production.url);
 assert.deepEqual(report.viewport,{width:1280,height:720});
}
assert.equal(hash(await readFile(context.raw.path)),context.raw.sha256);
assert.equal(hash(await readFile(resolve(dir,'lifecycle/report.json'))),production.lifecycle.sha256);
for(const [folder,snapshots]of [[dirname(context.raw.path),context.snapshots],[resolve(dir,'lifecycle'),lifecycle.snapshots]])
 for(const snapshot of snapshots)assert.equal(hash(await readFile(resolve(folder,snapshot.name))),snapshot.sha256);
assert.equal(context.runs.length,2);assert.equal(lifecycle.runs.length,2);assert.equal(raw.runs.length,2);
for(const row of context.runs){
 assert.deepEqual(row.errors,[]);assert.deepEqual(row.blockedRequests,[]);
 assert(row.lost.contextLost);assert.equal(row.lost.lostEvents,1);assert.equal(row.restored.restoredEvents,1);
 assert(!row.restored.contextLost&&row.restored.paused&&!row.restored.canAct);assert.equal(row.restored.sceneError,'');
 assert.equal(row.restored.overlays.length,0);assert(row.restored.draws>row.lost.draws);
 for(const key of ['battle','plan','units','age'])assert.deepEqual(row.restored[key],row.loaded[key]);
}
for(const row of lifecycle.runs){
 assert.deepEqual(row.errors,[]);assert.deepEqual(row.blockedRequests,[]);
 assert(row.changedLost.contextLost&&!row.changedRestored.contextLost);assert.equal(row.changedRestored.sceneError,'');
 for(const key of ['battleSha256','planSha256','age','actorIds'])assert.deepEqual(row.changedRestored[key],row.loaded[key]);
 assert.equal(row.density.devicePixelRatio,2);assert.equal(row.density.canvas.clientWidth,1200);assert.equal(row.density.actors,7);
 assert.equal(row.failedResource.sceneError,'Synthetic resource failure for recovery retention');
 assert.equal(row.disposed.lost,3);assert(row.disposed.disposed&&!row.disposed.connected&&!row.disposed.lossListener&&!row.disposed.restoreListener);
 assert(row.late.disposed&&!row.late.connected&&!row.late.lossListener&&!row.late.restoreListener);assert.equal(row.late.sceneError,row.disposed.sceneError);
}
assert.equal(raw.deviceScaleFactor,2);assert.deepEqual(raw.errors,[]);
for(const row of raw.runs){assert.deepEqual(row.blockedRequests,[]);assert(row.elapsedMs>=32000&&row.elapsedMs<36000);}
const captures=[...context.captures,...production.captures];assert.equal(captures.length,8);
for(const row of captures){
 const bytes=await readFile(row.path);assert.equal(hash(bytes),row.sha256);assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);
 const rgb=execFileSync('ffmpeg',['-v','error','-i',row.path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:4*1024*1024});assert.equal(hash(rgb),row.rgbSha256);
}
for(const mode of ['normal','reduced']){
 const rows=context.captures.filter(c=>c.mode===mode);assert.equal(rows.find(c=>c.name==='loaded').rgbSha256,rows.find(c=>c.name==='restored').rgbSha256);
}
const reviews=[...context.sheets,...production.captures.map(c=>c.review)];assert.equal(reviews.length,4);
for(const row of reviews){assert(row.width<=1024&&row.height<=1024);assert.equal(hash(await readFile(row.path)),row.sha256);}
const report={utc:new Date().toISOString(),production:{path:productionPath,sha256:hash(await readFile(productionPath))},source:build.source,indexSha256:artifact.indexSha256,runtimePatchSha256:hash(''),sceneSha256:production.componentSha256,artifactFilesVerified:artifact.files.length,toolSnapshotsVerified:production.snapshots.length+context.snapshots.length+lifecycle.snapshots.length,recoveryModes:2,restoredRgbExact:true,lifecycleModes:2,ordinaryRuns:production.runs,capturesVerified:captures.length,reviews,reviewedUtc:null,visualPass:null,pass:true,limits:production.limits};
await writeFile(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,pass:true,captures:captures.length,reviews:reviews.map(r=>r.path)}));
