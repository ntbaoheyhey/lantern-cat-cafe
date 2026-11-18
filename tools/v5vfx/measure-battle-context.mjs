/** Verify candidate provenance and measure fresh paused battle recovery captures. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {root} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const reportPath=resolve(root,'reports/v5/CXV/V7-F-battle-context-prototype.json'),report=JSON.parse(await readFile(reportPath));
assert(report.pass&&report.candidate&&!report.reproduced&&!report.reviewedUtc&&!report.sheets);
assert.equal(hash(await readFile(report.raw.path)),report.raw.sha256);const raw=JSON.parse(await readFile(report.raw.path)),dir=resolve(report.raw.path,'..');
assert.equal(hash(await readFile(report.buildManifest.path)),report.buildManifest.sha256);const build=JSON.parse(await readFile(report.buildManifest.path)),artifact=build.artifacts[0];
assert.equal(report.buildSource,build.source);assert.equal(report.indexSha256,artifact.indexSha256);assert.equal(artifact.transformed,1);assert.equal(build.runtimePatchSha256,hash(''));
assert.equal(hash(await readFile(build.candidatePath)),build.candidateSceneSha256);
const types=JSON.parse(await readFile(resolve(root,'reports/v5/CXV/V7-F-battle-context-prototype-types.json')));assert(types.pass&&types.prototype);assert.equal(types.sceneSha256,build.candidateSceneSha256);
for(const file of artifact.files)assert.equal(hash(await readFile(resolve(artifact.dist,file.path))),file.sha256);
for(const [folder,snapshots]of [[dir,report.snapshots],[resolve(report.buildManifest.path,'..'),build.snapshots]])for(const snap of snapshots)assert.equal(hash(await readFile(resolve(folder,snap.name))),snap.sha256);
assert.equal(raw.runs.length,2);assert.equal(raw.captures.length,6);
for(const row of raw.runs){
 assert.deepEqual(row.errors,[]);assert.deepEqual(row.blockedRequests,[]);assert(row.lost.contextLost);assert.equal(row.lost.lostEvents,1);assert.equal(row.restored.restoredEvents,1);
 assert.equal(row.restored.sceneError,'');assert.equal(row.restored.overlays.length,0);assert(row.restored.draws>row.lost.draws);assert(row.restored.paused&&!row.restored.canAct);
 assert.deepEqual(row.restored.battle,row.loaded.battle);assert.deepEqual(row.restored.plan,row.loaded.plan);assert.deepEqual(row.restored.units,row.loaded.units);assert.equal(row.restored.age,row.loaded.age);
}
report.sheets=[];report.measurements=[];
for(const row of raw.captures){
 const bytes=await readFile(row.path);assert.equal(hash(bytes),row.sha256);assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);
 const rgb=execFileSync('ffmpeg',['-v','error','-i',row.path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:4*1024*1024});assert.equal(hash(rgb),row.rgbSha256);
 report.measurements.push({mode:row.mode,name:row.name,width:1280,height:720,sha256:hash(bytes),rgbSha256:hash(rgb),mean:row.mean,stdDev:row.stdDev});
}
for(const mode of ['normal','reduced']){
 const rows=raw.captures.filter(c=>c.mode===mode);assert.equal(rows.find(c=>c.name==='loaded').rgbSha256,rows.find(c=>c.name==='restored').rgbSha256);
 const path=resolve(dir,mode+'-review.jpg');assert(!existsSync(path));
 execFileSync('ffmpeg',['-v','error',...rows.flatMap(c=>['-i',c.path]),'-filter_complex','[0:v]scale=512:288[a];[1:v]scale=512:288[b];[2:v]scale=512:288[c];[a][b][c]xstack=inputs=3:layout=0_0|w0_0|0_h0:fill=black[v]','-map','[v]','-frames:v','1','-q:v','3',path]);
 const size=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',path])).streams[0];assert.deepEqual(size,{width:1024,height:576});
 report.sheets.push({path,...size,mode,sha256:hash(await readFile(path)),frames:rows.map(c=>c.name)});
}
report.measuredUtc=new Date().toISOString();report.candidateSceneSha256=build.candidateSceneSha256;report.originalSceneSha256=build.originalSceneSha256;report.artifactFilesVerified=artifact.files.length;report.restoredRgbExact=true;
await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({reportPath,pass:true,captures:report.measurements.length,sheets:report.sheets.map(s=>s.path)}));
