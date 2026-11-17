/** Measure fresh production result captures before their single visual review. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {hash} from './victory-demand-source.mjs';
const root=resolve(import.meta.dirname,'../..'),input=resolve(root,'work/v5/CXV/films/V7-F-victory-demand-production');
const output=resolve(root,'reports/v5/CXV/V7-F-victory-demand-production.json');
const report=JSON.parse(readFileSync(output));assert(report.artifactFilesReverified&&report.trialBehaviorPass&&report.runs.length===24&&!report.reviewedUtc&&!report.sheets);
const review=resolve(input,'review');mkdirSync(review,{recursive:true});report.captures=[];report.sheets=[];
for(const [trial,mode]of [[0,'baseline'],[5,'native']]){
 const captures=report.runs.filter(r=>r.trial===trial);assert.equal(captures.length,4);
 for(const c of captures){
  const bytes=readFileSync(c.path),width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);assert.equal(width,1280);assert.equal(height,720);
  const rgb=execFileSync('ffmpeg',['-v','error','-i',c.path,'-vf','scale=160:90','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1']);
  const mean=rgb.reduce((a,b)=>a+b,0)/rgb.length,stdDev=Math.sqrt(rgb.reduce((a,b)=>a+(b-mean)**2,0)/rgb.length);assert(stdDev>10);
  report.captures.push({trial,mode,rate:c.rate,reduced:c.reduced,utc:c.utc,path:c.path,width,height,bytes:bytes.length,sha256:hash(bytes),mean,stdDev});
 }
 const path=resolve(review,`${trial}-${mode}.jpg`);assert(!existsSync(path),'Never replace an existing review sheet');
 execFileSync('ffmpeg',['-v','error',...captures.flatMap(c=>['-i',c.path]),'-filter_complex','[0:v]scale=512:288[a];[1:v]scale=512:288[b];[2:v]scale=512:288[c];[3:v]scale=512:288[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[v]','-map','[v]','-frames:v','1','-q:v','3',path]);
 const dimensions=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',path],{encoding:'utf8'})).streams[0];assert.equal(dimensions.width,1024);assert.equal(dimensions.height,576);
 report.sheets.push({trial,mode,path,...dimensions,sha256:hash(readFileSync(path)),frames:captures.map(c=>`${c.rate}x-${c.reduced?'reduced':'normal'}`)});
}
report.measuredUtc=new Date().toISOString();writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,captures:report.captures.length,sheets:report.sheets.map(s=>s.path)}));
