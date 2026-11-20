/** Diagnose encoded sprite alignment with the same browser decoder used in the experiment. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/ranged-codec-alignment-${attempt}.json`);assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=b=>createHash('sha256').update(b).digest('hex'),input='reports/v4-ship/S11/ranged-impact-bake-1.json',source=JSON.parse(readFileSync(resolve(root,input))),folder=resolve(root,source.output),rate=48000;
const original=readFileSync(resolve(folder,'impacts.f32'));
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true}),rows=[];
try{
 const page=await browser.newPage();
 for(const format of ['webm','mp3']){
  const bytes=readFileSync(resolve(folder,`v4-ranged-impacts.${format}`));assert.equal(hash(bytes),source.comparisons.find(c=>c.format===format).sha256);
  const result=await page.evaluate(async({pcmBase64,base64,variants,rate})=>{
   const decode64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer;
   const pcm=new Float32Array(decode64(pcmBase64)),ctx=new OfflineAudioContext(1,1,rate),decoded=await ctx.decodeAudioData(decode64(base64)),actual=decoded.getChannelData(0);
   return variants.map(v=>{
    const start=Math.round(v.sample.start*rate),length=Math.round(v.sample.duration*rate);let best={lag:0,correlation:-Infinity};
    for(let lag=-512;lag<=512;lag++){
     let xx=0,yy=0,xy=0;
     for(let i=64;i<Math.min(length-512,4096);i+=8){const x=pcm[start+i],y=actual[start+i+lag]??0;xx+=x*x;yy+=y*y;xy+=x*y;}
     const correlation=xy/Math.sqrt(xx*yy);if(correlation>best.correlation)best={lag,correlation};
    }
    let xx=0,yy=0,xy=0,error=0;
    for(let i=0;i<length;i++){const x=pcm[start+i],y=actual[start+i+best.lag]??0;xx+=x*x;yy+=y*y;xy+=x*y;error+=(y-x)**2;}
    return {variantId:v.sample.variantId,lagSamples:best.lag,lagMs:best.lag/rate*1000,prefixCorrelation:best.correlation,alignedCorrelation:xy/Math.sqrt(xx*yy),alignedRmsDeltaDb:10*Math.log10(yy/xx),alignedErrorToSignalDb:10*Math.log10(error/xx)};
   });
  },{pcmBase64:original.toString('base64'),base64:bytes.toString('base64'),variants:source.layerCombinations,rate});
  rows.push({format,sha256:hash(bytes),lagSamples:[...new Set(result.map(r=>r.lagSamples))],minimumAlignedCorrelation:Math.min(...result.map(r=>r.alignedCorrelation)),maximumAbsoluteLagMs:Math.max(...result.map(r=>Math.abs(r.lagMs))),variants:result});
 }
}finally{await browser.close();}
const report={at:new Date().toISOString(),source:{path:input,sha256:hash(readFileSync(resolve(root,input)))},pcm:{path:relative(root,resolve(folder,'impacts.f32')),sha256:hash(original)},harness:{path:relative(root,import.meta.filename),sha256:hash(readFileSync(import.meta.filename))},rows,
 scope:'Cross-correlation diagnostic on browser-decoded prepared sprites; search +/-512 samples using the first85ms, then evaluate each full sprite at the best lag. No source offsets, encoded files, runtime or acceptance thresholds changed.',runtimeChanged:false,physicalOnsetVerified:false,humanListeningVerified:false};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),rows:rows.map(({variants,...r})=>r)}));
