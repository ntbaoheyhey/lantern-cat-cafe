/** Verify exact behavior and fresh measured evidence from the native density build. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {root} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const output=resolve(root,'reports/v5/CXV/V7-F-density-native-production.json'),report=JSON.parse(await readFile(output));assert(report.pass);
const manifest=await readFile(report.buildManifest.path);assert.equal(hash(manifest),report.buildManifest.sha256);const build=JSON.parse(manifest),artifact=build.artifacts.find(a=>a.mode==='native');assert.equal(artifact.transformed,0);assert.equal(build.runtimePatchSha256,hash(''));
for(const f of artifact.files)assert.equal(hash(await readFile(resolve(artifact.dist,f.path))),f.sha256);
const dir=resolve(report.buildManifest.path,'..');for(const s of report.snapshots)assert.equal(hash(await readFile(resolve(dir,s.name))),s.sha256);
const rawBytes=await readFile(report.raw.path);assert.equal(hash(rawBytes),report.raw.sha256);const raw=JSON.parse(rawBytes);
const old=JSON.parse(await readFile(resolve(root,'reports/v5/CXV/V7-F-desktop-density-production.json'))),control=JSON.parse(await readFile(old.trials.find(t=>t.dpr===2).raw));
const behavior=r=>({initial:r.initial,final:r.final,plans:r.plans.map(({wallMs,...p})=>p)});
for(const r of raw.runs){const expected=control.runs.find(x=>x.rate===r.rate);assert.deepEqual(behavior(r),behavior(expected),'Native density synchronization changed ordinary-play behavior');assert.deepEqual(r.blockedRequests,[]);assert.equal(r.identity.indexSha256,artifact.indexSha256);assert.equal(r.identityAfter.indexSha256,artifact.indexSha256);for(const d of Object.values(r.desktopDensity)){assert(d.checksEnabled&&!d.contextLost);assert.equal(d.rendererRatio,2);assert.deepEqual(d.drawingBuffer,{width:2560,height:1440});}}
assert.deepEqual(raw.errors,[]);report.exactBehavior=true;report.behaviorControl={source:control.runs[0].identity.buildSource,path:old.trials.find(t=>t.dpr===2).raw};
const probeBytes=await readFile(report.probe.path);assert.equal(hash(probeBytes),report.probe.sha256);const probe=JSON.parse(probeBytes);assert(probe.pass&&probe.runs.length===4&&probe.captures.length===20&&probe.mode==='native');
for(const run of probe.runs){assert.deepEqual(run.errors,[]);assert.deepEqual(run.blockedRequests,[]);assert.deepEqual(run.lifecycle.stable,{frames:0,extraRatioSets:0});assert.equal(run.lifecycle.lateDensity.extraRatioSets,0);for(const row of run.rows){assert(row.geometryExact&&row.matchedNativeRgbExact);for(const buffer of Object.values(row.density.composer))assert.deepEqual(buffer,row.density.drawingBuffer);}}
for(const c of probe.captures){const bytes=await readFile(c.path);assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);assert.equal(hash(bytes),c.sha256);assert(c.stdDev>10);}
for(const c of report.captures){const bytes=await readFile(c.path);assert.equal(hash(bytes),c.sha256);const rgb=execFileSync('ffmpeg',['-v','error','-i',c.path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:4*1024*1024});assert.equal(hash(rgb),c.rgbSha256);const mean=rgb.reduce((a,b)=>a+b,0)/rgb.length;let variance=0;for(const x of rgb)variance+=(x-mean)**2;c.mean=mean;c.stdDev=Math.sqrt(variance/rgb.length);assert(c.stdDev>10);}
report.reviews=[...probe.reviews,...report.captures.map(c=>c.review)];
for(const v of report.reviews){assert.equal(hash(await readFile(v.path)),v.sha256);const size=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=width,height','-of','json',v.path],{encoding:'utf8'})).streams[0];assert.deepEqual(size,{width:1024,height:576});}
report.verifiedUtc=new Date().toISOString();report.verification={artifactFiles:artifact.files.length,toolSnapshots:report.snapshots.length,exactNativePixelPairs:16,exactGeometrySets:16,stableAndDisposedLifecycles:4,capturesMeasured:22};
await writeFile(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:true,output,verification:report.verification,reviews:report.reviews.map(r=>r.path)}));
