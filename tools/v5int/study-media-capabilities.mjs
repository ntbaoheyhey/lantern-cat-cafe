/** Capability declarations only; no actual media decode or laptop performance claim. */
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../..'),require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium,webkit}=require('@playwright/test');
const out=resolve(root,'work/v5/CXI/batch-m/av1-capability-r1');await mkdir(out);
const report={utc:new Date().toISOString(),kind:'Capability declarations, not decoding proof',harnessSha256:createHash('sha256').update(await readFile(import.meta.filename)).digest('hex'),rows:[],runtimeChanged:false};
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const rows=await page.evaluate(async()=>{
   const video=document.createElement('video'),rows=[];
   for(const contentType of ['video/mp4; codecs="avc1.64001f"','video/mp4; codecs="av01.0.04M.08"','video/webm; codecs="av01.0.04M.08"']){
    let declaration,error;
    try{declaration=await navigator.mediaCapabilities.decodingInfo({type:'file',video:{contentType,width:624,height:520,bitrate:800000,framerate:30}});}catch(e){error=String(e);}
    rows.push({contentType,canPlayType:video.canPlayType(contentType),declaration,error,ua:navigator.userAgent});
   }
   return rows;
  });
  report.rows.push({engine:name,version:browser.version(),rows});
 }finally{await browser.close();}
}
assert.equal(report.rows.length,2);report.completedUTC=new Date().toISOString();
await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
