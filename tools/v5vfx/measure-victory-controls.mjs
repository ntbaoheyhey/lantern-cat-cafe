import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),dir=resolve(process.env.CXV_CONTROLS_INPUT??resolve(root,'work/v5/CXV/films/V7-E-victory-controls')),input=resolve(dir,'report.json'),rawBytes=readFileSync(input),raw=JSON.parse(rawBytes);assert(raw.ended&&raw.runs.length===2);
const output=resolve(root,'reports/v5/CXV/V7-E-victory-controls.json');assert(!existsSync(output));
const hash=v=>createHash('sha256').update(v).digest('hex'),sheets=[];
for(const run of raw.runs){
 for(const c of run.captures){const data=readFileSync(c.path);assert.equal(hash(data),c.sha256);assert.equal(data.readUInt32BE(16),1280);assert.equal(data.readUInt32BE(20),720);const rgb=execFileSync('ffmpeg',['-v','error','-i',c.path,'-vf','scale=160:90','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1']);const mean=rgb.reduce((a,b)=>a+b,0)/rgb.length,stdDev=Math.sqrt(rgb.reduce((a,b)=>a+(b-mean)**2,0)/rgb.length);assert(stdDev>10);Object.assign(c,{width:1280,height:720,mean,stdDev});}
 const sheet=resolve(dir,run.mode+'-review.jpg');assert(!existsSync(sheet));assert.equal(run.captures.length,2);execFileSync('ffmpeg',['-v','error',...run.captures.flatMap(c=>['-i',c.path]),'-filter_complex','[0:v]scale=512:288[a];[1:v]scale=512:288[b];[a][b]hstack=inputs=2[v]','-map','[v]','-frames:v','1','-q:v','3',sheet]);
 sheets.push({mode:run.mode,path:sheet,width:1024,height:288,sha256:hash(readFileSync(sheet))});
}
writeFileSync(output,JSON.stringify({...raw,measuredUtc:new Date().toISOString(),raw:{path:input,sha256:hash(rawBytes)},sheets,reviewedUtc:null,interpretation:null},null,2)+'\n');
console.log(JSON.stringify({output,pass:raw.pass,sheets,runs:raw.runs.map(r=>({mode:r.mode,pass:r.pass,samples:r.samples.map(s=>({at:s.elapsedMs,toast:s.toast,blocked:s.buttons.filter(b=>b.points.some(p=>!p.hitOwn))}))}))}));
