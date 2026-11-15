// Timing proxy from actual original-paint support, before r2 source authoring.
import {readFileSync,writeFileSync} from 'node:fs';
const samples=JSON.parse(readFileSync('tools/v3craft-drills/assets/d4-r1.json')).stats;
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const sourceTime=(ms,method)=>method==='linear'?ms*2:ms<=240?430*smooth(ms/240):ms<=350?430+45*smooth((ms-240)/110):475+1525*smooth((ms-350)/650);
const support=ms=>{const index=Math.max(0,Math.min(30,ms/2000*30)),lo=Math.floor(index),hi=Math.min(30,lo+1),f=index-lo;return samples[lo].support*(1-f)+samples[hi].support*f;};
const rows=['linear','readable-shape'].map(method=>{
 const frames=Array.from({length:31},(_,i)=>({ms:i/30*1000,sourceMs:sourceTime(i/30*1000,method),support:support(sourceTime(i/30*1000,method))})),peak=Math.max(...frames.map(f=>f.support));
 return{method,frames,framesAbove80Percent:frames.filter(f=>f.support>=peak*.8).length,maxLossFractionOfPeak:Math.max(...frames.slice(1).map((f,i)=>(frames[i].support-f.support)/peak)),endSupport:frames.at(-1).support};
});
writeFileSync('tools/v3craft-lab/q3/flipbook-readability-study.json',JSON.stringify({at:new Date().toISOString(),limitation:'Interpolated support proxy from r1, not final-r2 GPU acceptance.',rows},null,2)+'\n');console.log(JSON.stringify(rows.map(({frames,...r})=>r)));
