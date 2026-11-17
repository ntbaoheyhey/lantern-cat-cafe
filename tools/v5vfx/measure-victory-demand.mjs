/** Check image dimensions/variance before producing new review sheets. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {hash} from './victory-demand-source.mjs';
const root=resolve(import.meta.dirname,'../..'),input=resolve(process.env.CXV_CAPTURE_OUT??resolve(root,'work/v5/CXV/films/V7-F-victory-demand-prototype'));
const output=resolve(process.env.CXV_SUMMARY_OUT??resolve(root,'reports/v5/CXV/V7-F-victory-demand-prototype.json'));
assert(input.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(output.startsWith(resolve(root,'reports/v5/CXV')+'/'));
const rawPath=resolve(input,'report.json'),raw=JSON.parse(readFileSync(rawPath));assert(raw.pass);
const report={utc:new Date().toISOString(),source:raw.source,runtimePatchSha256:raw.runtimePatchSha256,viewport:raw.viewport,started:raw.utc,ended:raw.ended,
 method:raw.method,raw:{path:rawPath,sha256:hash(readFileSync(rawPath))},pixelChecks:raw.pixelChecks,runs:[],captures:[],sheets:[],reviewedUtc:null,visualReview:null,pass:raw.pass,errors:raw.errors};
const review=resolve(input,'review');mkdirSync(review,{recursive:true});
for(const run of raw.runs){
 report.runs.push({mode:run.mode,url:run.url,override:run.override,cases:run.cases,disposed:run.disposed,pendingUnmount:run.pendingUnmount,errors:run.errors,blockedRequests:run.blockedRequests});
 for(const c of run.captures){
  const bytes=readFileSync(c.path),width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);assert.equal(width,1280);assert.equal(height,720);
  const rgb=execFileSync('ffmpeg',['-v','error','-i',c.path,'-vf','scale=160:90','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1']);
  const mean=rgb.reduce((a,b)=>a+b,0)/rgb.length,stdDev=Math.sqrt(rgb.reduce((a,b)=>a+(b-mean)**2,0)/rgb.length);assert(stdDev>10);
  report.captures.push({mode:run.mode,...c,width,height,bytes:bytes.length,sha256:hash(bytes),mean,stdDev});
 }
 for(const [part,names]of [['lifecycle',['loaded','resized','restored-context','os-reduced']],['poses',['idle','normal-frozen-1000','normal-frozen-1600','normal-frozen-2800']]]){
  const captures=names.map(name=>run.captures.find(c=>c.name===name));assert(captures.every(Boolean));const path=resolve(review,`${run.mode}-${part}.jpg`);assert(!existsSync(path),'Do not replace prior review sheets');
  execFileSync('ffmpeg',['-v','error',...captures.flatMap(c=>['-i',c.path]),'-filter_complex','[0:v]scale=512:288[a];[1:v]scale=512:288[b];[2:v]scale=512:288[c];[3:v]scale=512:288[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[v]','-map','[v]','-frames:v','1','-q:v','3',path]);
  const dimensions=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',path],{encoding:'utf8'})).streams[0];assert.equal(dimensions.width,1024);assert.equal(dimensions.height,576);
  report.sheets.push({mode:run.mode,part,path,...dimensions,sha256:hash(readFileSync(path)),frames:names});
 }
}
report.limits='Candidate browser experiment with audit counters and explicit result fixtures. Pixel equality applies to the cropped victory crew region at named states; full scenes contain unrelated UI. Frozen normal frames are not timing/performance evidence. CPU counters include instrumentation overhead. Independent production/judge acceptance remains separate.';
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,pass:report.pass,sheets:report.sheets.map(s=>s.path)}));
