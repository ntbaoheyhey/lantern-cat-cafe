/** Measure native context-loss evidence before fresh once-only visual review. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),input=resolve(process.env.CXV_CONTEXT_OUT??resolve(root,'work/v5/CXV/films/V7-E-victory-context-loss'));
const output=resolve(process.env.CXV_CONTEXT_REPORT??resolve(root,'reports/v5/CXV/V7-E-victory-context-loss.json'));
assert(input.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(output.startsWith(resolve(root,'reports/v5/CXV')+'/'));assert(!existsSync(output));
const hash=b=>createHash('sha256').update(b).digest('hex'),rawPath=resolve(input,'report.json'),raw=JSON.parse(readFileSync(rawPath));
assert(raw.pass&&raw.runs.length===2&&raw.captures.length===6);assert.equal(raw.buildRuntimePatchSha256,hash(''));
for(const file of raw.toolSnapshots)assert.equal(hash(readFileSync(resolve(input,file.name))),file.sha256);
const report={utc:new Date().toISOString(),source:raw.source,servedSource:raw.buildSource,url:raw.url,indexSha256:raw.indexSha256,
 runtimePatchSha256:raw.buildRuntimePatchSha256,buildManifestSha256:raw.buildManifestSha256,captureUtc:raw.utc,captureEnded:raw.ended,viewport:raw.viewport,
 raw:{path:rawPath,sha256:hash(readFileSync(rawPath))},method:raw.method,toolSnapshotsVerified:raw.toolSnapshots.length,
 reproduced:raw.reproduced,runs:raw.runs,captures:[],restoredPixels:[],sheets:[],reviewedUtc:null,visualReview:null,pass:true};
const rgb=path=>execFileSync('ffmpeg',['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:1280*720*3+1024});
for(const c of raw.captures){
 const bytes=readFileSync(c.path);assert.equal(hash(bytes),c.sha256);const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);assert.equal(width,1280);assert.equal(height,720);
 const pixels=rgb(c.path),mean=pixels.reduce((a,b)=>a+b,0)/pixels.length,sd=Math.sqrt(pixels.reduce((a,b)=>a+(b-mean)**2,0)/pixels.length);assert(sd>10);
 report.captures.push({...c,width,height,bytes:bytes.length,mean,stdDev:sd});
}
const review=resolve(input,'review');mkdirSync(review,{recursive:true});
for(const mode of ['normal','reduced']){
 const captures=raw.captures.filter(c=>c.mode===mode);assert.deepEqual(captures.map(c=>c.name),['loaded','lost','restored']);
 const a=rgb(captures[0].path),b=rgb(captures[2].path),rect=captures[0].after.rect;
 const x0=Math.max(0,Math.floor(rect.x)),y0=Math.max(0,Math.floor(rect.y)),x1=Math.min(1280,Math.ceil(rect.right)),y1=Math.min(720,Math.ceil(rect.bottom));
 let changed=0,crewChanged=0,maxChannel=0;
 for(let i=0;i<a.length;i+=3){const d=Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]));if(d){changed++;const p=i/3,x=p%1280,y=Math.floor(p/1280);if(x>=x0&&x<x1&&y>=y0&&y<y1)crewChanged++;}maxChannel=Math.max(maxChannel,d);}
 report.restoredPixels.push({mode,changedPixels:changed,crewChangedPixels:crewChanged,maxChannel,fullFrameExact:changed===0,crewExact:crewChanged===0,limitation:mode==='normal'?'Animated normal poses are not synchronized.':'Same retained page and buffer size; report exact values without tolerance.'});
 const path=resolve(review,mode+'.jpg');assert(!existsSync(path));
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error',...captures.flatMap(c=>['-i',c.path]),'-filter_complex','[0:v]scale=512:288[a];[1:v]scale=512:288[b];[2:v]scale=512:288[c];[a][b][c]xstack=inputs=3:layout=0_0|w0_0|0_h0:fill=black[v]','-map','[v]','-frames:v','1','-q:v','3',path]);
 const dimensions=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',path],{encoding:'utf8'})).streams[0];assert.equal(dimensions.width,1024);assert.equal(dimensions.height,576);
 report.sheets.push({mode,path,...dimensions,sha256:hash(readFileSync(path)),frames:captures.map(c=>c.name)});
}
report.limitations='Injected native context loss on local artifact, not hardware frequency, independent acceptance, speedup, or public-chain proof. Fresh visual review remains required.';
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,reproduced:report.reproduced,captures:report.captures.length,restoredPixels:report.restoredPixels,sheets:report.sheets.map(s=>s.path)}));
