/** Verify and measure the fresh unmodified-baseline series before visual review. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {hash} from './victory-demand-source.mjs';
const root=resolve(import.meta.dirname,'../..'),input=resolve(root,'work/v5/CXV/films/V7-F-victory-unmodified-baseline');
const rawPath=resolve(input,'report.json'),raw=JSON.parse(readFileSync(rawPath)),provenance=JSON.parse(readFileSync(resolve(input,'provenance.json'))),original=JSON.parse(readFileSync(resolve(root,'reports/v5/CXV/V7-F-victory-capture-consistency.json')));
assert(raw.pass&&raw.captures.length===6&&!raw.errors.length&&!raw.blockedRequests.length);assert.equal(raw.artifactMode,'baseline');
assert.equal(hash(readFileSync(provenance.buildManifest)),provenance.buildManifestSha256);assert.equal(raw.buildManifestSha256,provenance.buildManifestSha256);
for(const t of provenance.tools){assert.equal(hash(readFileSync(resolve(input,t.name))),t.sha256);assert.equal(hash(readFileSync(resolve(root,'tools/v5vfx',t.name))),t.sha256);}
const baseline=original.rows[0],variant=original.rows.find(r=>r.mode==='native'&&r.rate===4&&!r.fullSceneAgainstFirstBaseline.equal);assert(variant);
const captures=raw.captures.map(c=>{
 const png=readFileSync(c.path);assert.equal(hash(png),c.sha256);assert.equal(png.readUInt32BE(16),1280);assert.equal(png.readUInt32BE(20),720);
 const decode=path=>execFileSync('ffmpeg',['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:10_000_000});
 const rgb=decode(c.path);assert.equal(hash(rgb),c.fullRgbSha256);assert.equal(hash(decode(c.crewPath)),c.crewRgbSha256);
 const mean=rgb.reduce((a,b)=>a+b,0)/rgb.length,stdDev=Math.sqrt(rgb.reduce((a,b)=>a+(b-mean)**2,0)/rgb.length);assert(stdDev>10);
 return{...c,width:1280,height:720,mean,stdDev,variant:c.fullRgbSha256===baseline.fullSceneRgbSha256?'original-baseline':c.fullRgbSha256===variant.fullSceneRgbSha256?'original-discrepant-candidate':'new-variant'};
});
const selected=captures.slice(0,4),path=resolve(input,'review.jpg');assert(!existsSync(path));
execFileSync('ffmpeg',['-v','error',...selected.flatMap(c=>['-i',c.path]),'-filter_complex','[0:v]scale=512:288[a];[1:v]scale=512:288[b];[2:v]scale=512:288[c];[3:v]scale=512:288[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[v]','-map','[v]','-frames:v','1','-q:v','3',path]);
const dimensions=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=width,height','-of','json',path],{encoding:'utf8'})).streams[0];assert.equal(dimensions.width,1024);assert.equal(dimensions.height,576);
const report={utc:new Date().toISOString(),source:raw.buildSource,runtimePatchSha256:raw.buildRuntimePatchSha256,indexSha256:raw.indexSha256,url:raw.url,viewport:raw.viewport,started:raw.utc,ended:raw.ended,method:raw.method,provenance,raw:{path:rawPath,sha256:hash(readFileSync(rawPath))},references:{baselineFullRgb:baseline.fullSceneRgbSha256,variantFullRgb:variant.fullSceneRgbSha256},captures,originalVariantReproduced:captures.some(c=>c.variant==='original-discrepant-candidate'),allMatchOriginalBaseline:captures.every(c=>c.variant==='original-baseline'),behaviorPass:true,sheet:{path,...dimensions,sha256:hash(readFileSync(path)),trials:selected.map(c=>c.trial)},reviewedUtc:null,interpretation:null,limits:'Six fresh local artifact pages, not independent judge acceptance. A failure to reproduce does not negate the instrumented-baseline reproduction or the original candidate discrepancy. No tolerance, pixel masks or new golden images are used.'};
const output=resolve(root,'reports/v5/CXV/V7-F-victory-unmodified-baseline.json');writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,originalVariantReproduced:report.originalVariantReproduced,allMatchOriginalBaseline:report.allMatchOriginalBaseline,ended:report.ended,sheet:path}));
