/** Measure fresh captures before visual review; never overwrite existing review copies. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'work/v5/CXV/films/V7-F-static-native/production');
const series=JSON.parse(readFileSync(resolve(out,'series.json'))),built=JSON.parse(readFileSync(resolve(out,'build.json')));
assert(series.pass&&series.runs.length===6);
const captures=[];mkdirSync(resolve(out,'review'),{recursive:true});
for(const row of series.runs){
 const trial=JSON.parse(readFileSync(row.raw));
 for(const rate of [1,4]){
  const path=resolve(out,'trials',`${row.index}-${row.mode}`,`boss-${rate}x.png`),bytes=readFileSync(path);
  const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);assert.equal(width,1280);assert.equal(height,720);
  const rgb=execFileSync('ffmpeg',['-v','error','-i',path,'-vf','scale=160:90','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1']);
  assert.equal(rgb.length,160*90*3);const mean=rgb.reduce((a,b)=>a+b,0)/rgb.length,variance=rgb.reduce((a,b)=>a+(b-mean)**2,0)/rgb.length;
  assert(variance>100,'Unexpected blank capture');
  const capture={path,width,height,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),rate,mode:row.mode,index:row.index,url:trial.url,started:trial.utc,ended:trial.ended,identity:trial.runs.find(r=>r.rate===rate).identity,rgbMean:mean,rgbStdDev:Math.sqrt(variance)};
  if(row.index>=4){
   capture.review=resolve(out,'review',`${row.index}-${row.mode}-${rate}x.jpg`);assert(!existsSync(capture.review),'Review copy already exists; do not reopen inspected images');
   execFileSync('sips',['-Z','1024','-s','format','jpeg','-s','formatOptions','85',path,'--out',capture.review],{stdio:'ignore'});
  }
  captures.push(capture);
 }
}
const report={utc:new Date().toISOString(),source:built.source,runtimePatchSha256:built.runtimePatchSha256,viewport:{width:1280,height:720},method:'PNG dimensions/digests and 160x90 RGB variance for all twelve captures. Four new 1024px review copies from trials4/5. Captures follow ordinary32s seeded fixture play and are not synchronized pixel comparisons.',captures,reviewedUtc:null,limits:'Local production artifacts on6311/6312, not independent judge acceptance.'};
writeFileSync(resolve(root,'reports/v5/CXV/V7-F-static-native-production-captures.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({captures:captures.length,review:captures.filter(c=>c.review).map(c=>c.review),source:built.source}));
