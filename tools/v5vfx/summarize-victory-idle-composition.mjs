/** Classify baseline freeze/resume captures against the original two image variants. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {hash} from './victory-demand-source.mjs';
const root=resolve(import.meta.dirname,'../..'),input=resolve(root,'work/v5/CXV/films/V7-F-victory-idle-composition');
const rawPath=resolve(input,'report.json'),raw=JSON.parse(readFileSync(rawPath)),provenance=JSON.parse(readFileSync(resolve(input,'provenance.json'))),original=JSON.parse(readFileSync(resolve(root,'reports/v5/CXV/V7-F-victory-capture-consistency.json')));
assert(raw.pass&&!raw.errors.length&&!raw.blockedRequests.length&&raw.captures.length===5);
assert.equal(hash(readFileSync(provenance.buildManifest)),provenance.buildManifestSha256);assert.equal(raw.buildManifestSha256,provenance.buildManifestSha256);
for(const t of provenance.tools){assert.equal(hash(readFileSync(resolve(input,t.name))),t.sha256);assert.equal(hash(readFileSync(resolve(root,'tools/v5vfx',t.name))),t.sha256);}
const baseline=original.rows[0],variant=original.rows.find(r=>r.mode==='native'&&r.rate===4&&!r.fullSceneAgainstFirstBaseline.equal);assert(variant);
const classify=sha=>sha===baseline.fullSceneRgbSha256?'original-baseline':sha===variant.fullSceneRgbSha256?'original-discrepant-candidate':'new-variant';
const captures=raw.captures.map(c=>{
 const bytes=readFileSync(c.path);assert.equal(hash(bytes),c.sha256);assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);
 const rgb=execFileSync('ffmpeg',['-v','error','-i',c.path,'-vf','scale=160:90','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1']);
 const mean=rgb.reduce((a,b)=>a+b,0)/rgb.length,stdDev=Math.sqrt(rgb.reduce((a,b)=>a+(b-mean)**2,0)/rgb.length);assert(stdDev>10);
 return{...c,width:1280,height:720,mean,stdDev,variant:classify(c.fullRgbSha256)};
});
const path=resolve(input,'review.jpg');assert(!existsSync(path));
const selected=['active','frozen-1','resumed-1','frozen-2'].map(name=>captures.find(c=>c.name===name));
execFileSync('ffmpeg',['-v','error',...selected.flatMap(c=>['-i',c.path]),'-filter_complex','[0:v]scale=512:288[a];[1:v]scale=512:288[b];[2:v]scale=512:288[c];[3:v]scale=512:288[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[v]','-map','[v]','-frames:v','1','-q:v','3',path]);
const dimensions=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=width,height','-of','json',path],{encoding:'utf8'})).streams[0];assert.equal(dimensions.width,1024);assert.equal(dimensions.height,576);
const frozen=captures.filter(c=>c.name.startsWith('frozen-')),resumed=captures.filter(c=>c.name.startsWith('resumed-'));
const report={utc:new Date().toISOString(),source:raw.buildSource,runtimePatchSha256:raw.buildRuntimePatchSha256,indexSha256:raw.indexSha256,url:raw.url,viewport:raw.viewport,started:raw.utc,ended:raw.ended,method:raw.method,provenance,raw:{path:rawPath,sha256:hash(readFileSync(rawPath))},references:{baselineFullRgb:baseline.fullSceneRgbSha256,variantFullRgb:variant.fullSceneRgbSha256},captures,frozenReproducesOriginalVariant:frozen.every(c=>c.variant==='original-discrepant-candidate'),resumedMatchesOriginalBaseline:resumed.every(c=>c.variant==='original-baseline'),initialMatchesOriginalBaseline:captures[0].variant==='original-baseline',pass:true,sheet:{path,...dimensions,sha256:hash(readFileSync(path)),frames:selected.map(c=>c.name)},reviewedUtc:null,interpretation:null,limits:'Freezing all RAF is a diagnostic browser intervention on the baseline. A matching original PNG variant would show that this change can occur without candidate source, but would not locate the exact browser compositing mechanism. No GPU/performance result is inferred from this deliberately paused run.'};
const output=resolve(root,'reports/v5/CXV/V7-F-victory-idle-composition.json');writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,frozenReproducesOriginalVariant:report.frozenReproducesOriginalVariant,resumedMatchesOriginalBaseline:report.resumedMatchesOriginalBaseline,captures:captures.map(c=>({name:c.name,variant:c.variant,state:c.state})),sheet:path}));
