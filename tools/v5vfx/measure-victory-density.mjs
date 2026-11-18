/** Measure density captures before any visual review; preserve each output. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {hash} from './victory-demand-source.mjs';
const root=resolve(import.meta.dirname,'../..');
const input=resolve(process.env.CXV_DENSITY_INPUT??resolve(root,'work/v5/CXV/films/V7-E-victory-density-probe'));
const output=resolve(process.env.CXV_DENSITY_REPORT??resolve(root,'reports/v5/CXV/V7-E-victory-density-probe.json'));
assert(input.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(output.startsWith(resolve(root,'reports/v5/CXV')+'/'));assert(!existsSync(output));
const rawPath=resolve(input,'report.json'),raw=JSON.parse(readFileSync(rawPath));assert(raw.pass);
const report={utc:new Date().toISOString(),url:raw.url,source:raw.source,buildSource:raw.buildSource,indexSha256:raw.indexSha256,
 runtimePatchSha256:raw.buildRuntimePatchSha256??raw.runtimePatchSha256,viewport:raw.viewport,method:raw.method,
 raw:{path:rawPath,sha256:hash(readFileSync(rawPath))},captureUtc:raw.utc,captureEnded:raw.ended,runs:raw.runs,captures:[],sheets:[],reviewedUtc:null,visualReview:null,pass:raw.pass};
for(const c of raw.captures){
 const bytes=readFileSync(c.path),width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);assert.equal(width,1280);assert.equal(height,720);
 const rgb=execFileSync('ffmpeg',['-v','error','-i',c.path,'-vf','scale=160:90','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1']);
 assert.equal(rgb.length,160*90*3);const mean=rgb.reduce((a,b)=>a+b,0)/rgb.length,stdDev=Math.sqrt(rgb.reduce((a,b)=>a+(b-mean)**2,0)/rgb.length);assert(stdDev>10);
 report.captures.push({name:c.name,mode:c.mode,path:c.path,utc:c.utc,width,height,bytes:bytes.length,sha256:hash(bytes),mean,stdDev});
}
const review=resolve(input,'review');mkdirSync(review,{recursive:true});
const groups=raw.reviewGroups??Array.from({length:Math.ceil(report.captures.length/4)},(_,i)=>[i*4,i*4+1,i*4+2,i*4+3]);assert(groups.length<=6);
for(const [index,group]of groups.entries()){
 const captures=group.map(i=>report.captures[i]);assert.equal(captures.length,4);assert(captures.every(Boolean));
 const path=resolve(review,'review-'+index+'.jpg');assert(!existsSync(path));
 execFileSync('ffmpeg',['-v','error',...captures.flatMap(c=>['-i',c.path]),'-filter_complex','[0:v]scale=512:288[a];[1:v]scale=512:288[b];[2:v]scale=512:288[c];[3:v]scale=512:288[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[v]','-map','[v]','-frames:v','1','-q:v','3',path]);
 const dimensions=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',path],{encoding:'utf8'})).streams[0];assert.equal(dimensions.width,1024);assert.equal(dimensions.height,576);
 report.sheets.push({path,...dimensions,frames:captures.map(c=>({name:c.name,mode:c.mode})),sha256:hash(readFileSync(path))});
}
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,captures:report.captures.length,sheets:report.sheets.map(s=>s.path),pass:report.pass}));
