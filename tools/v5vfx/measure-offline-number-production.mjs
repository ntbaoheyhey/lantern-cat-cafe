/** Measure all gameplay images and prepare four fresh desktop views for one review. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {hash} from './victory-demand-source.mjs';
const root=resolve(import.meta.dirname,'../..');
const path=resolve(root,'reports/v5/CXV/V7-F-offline-number-production.json');
const report=JSON.parse(readFileSync(path));assert(report.pass&&report.trials.length===12&&!report.measuredUtc&&!report.reviewedUtc);
const review=resolve(root,'work/v5/CXV/films/V7-F-offline-number-production/review');mkdirSync(review,{recursive:true});
report.captures=[];report.reviewImages=[];
for(const r of report.trials){
 const source=resolve(dirname(r.raw),`boss-${r.rate}x.png`),bytes=readFileSync(source);
 const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);assert.equal(width,1280);assert.equal(height,720);
 const rgb=execFileSync('ffmpeg',['-v','error','-i',source,'-vf','scale=160:90','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1']);
 const mean=rgb.reduce((a,b)=>a+b,0)/rgb.length,stdDev=Math.sqrt(rgb.reduce((a,b)=>a+(b-mean)**2,0)/rgb.length);assert(stdDev>10);
 report.captures.push({index:r.index,mode:r.mode,rate:r.rate,utc:r.utc,ended:r.ended,url:r.url,identity:r.identity,path:source,width,height,bytes:bytes.length,sha256:hash(bytes),mean,stdDev});
 if((r.index===0&&r.rate===1)||(r.index===1&&r.rate===1)||(r.index===4&&r.rate===4)||(r.index===5&&r.rate===4)){
  const target=resolve(review,`${r.index}-${r.mode}-${r.rate}x.png`);assert(!existsSync(target),'Never replace reviewed evidence');
  execFileSync('ffmpeg',['-v','error','-i',source,'-vf','scale=1024:576','-frames:v','1',target]);const data=readFileSync(target);
  assert.equal(data.readUInt32BE(16),1024);assert.equal(data.readUInt32BE(20),576);
  report.reviewImages.push({index:r.index,mode:r.mode,rate:r.rate,path:target,width:1024,height:576,sha256:hash(data)});
 }
}
assert.equal(report.reviewImages.length,4);report.measuredUtc=new Date().toISOString();writeFileSync(path,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({measured:report.captures.length,reviewImages:report.reviewImages}));
