/** Check the prepared, padded candidate and MP3 fallback in available headless decoders. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/ranged-codec-browsers-${attempt}.json`);assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=b=>createHash('sha256').update(b).digest('hex'),input='reports/v4-ship/S11/ranged-impact-bake-1.json',source=JSON.parse(readFileSync(resolve(root,input))),folder=resolve(root,source.output),rate=48000;
const paddingPath='reports/v4-ship/S11/ranged-codec-padding-1.json',padding=JSON.parse(readFileSync(resolve(root,paddingPath))),pcm=readFileSync(resolve(folder,'impacts.f32'));
const files=[{format:'webm',...padding.selectedCandidate},{format:'mp3',path:relative(root,resolve(folder,'v4-ranged-impacts.mp3')),sha256:source.comparisons.find(c=>c.format==='mp3').sha256}];
const require=createRequire(resolve(root,'apps/web/package.json')),playwright=require('@playwright/test'),rows=[];
for(const browserName of ['chromium','webkit']){
 const browser=await playwright[browserName].launch({headless:true});
 try{
  const page=await browser.newPage();await page.evaluate(base64=>{window.__originalPCM=new Float32Array(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer);},pcm.toString('base64'));
  for(const file of files){
   const bytes=readFileSync(resolve(root,file.path));assert.equal(hash(bytes),file.sha256);
   const result=await page.evaluate(async({base64,variants,rate})=>{
    const ctx=new OfflineAudioContext(1,1,rate);let decoded;
    try{decoded=await ctx.decodeAudioData(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer);}catch(error){return {decoded:false,error:String(error.message).slice(0,180)};}
    const actual=decoded.getChannelData(0),pcm=window.__originalPCM;
    const rows=variants.map(v=>{
     const start=Math.round(v.sample.start*rate),length=Math.round(v.sample.duration*rate);let best={lag:0,correlation:-Infinity};
     for(let lag=-256;lag<=256;lag++){
      let xx=0,yy=0,xy=0;
      for(let i=64;i<Math.min(length-256,4096);i+=8){const x=pcm[start+i],y=actual[start+i+lag]??0;xx+=x*x;yy+=y*y;xy+=x*y;}
      const correlation=xy/Math.sqrt(xx*yy);if(correlation>best.correlation)best={lag,correlation};
     }
     let xx=0,yy=0,xy=0;for(let i=0;i<length;i++){const x=pcm[start+i],y=actual[start+i]??0;xx+=x*x;yy+=y*y;xy+=x*y;}
     return {variantId:v.sample.variantId,lagSamples:best.lag,canonicalCorrelation:xy/Math.sqrt(xx*yy),canonicalRmsDeltaDb:10*Math.log10(yy/xx),complete:start+length<=actual.length};
    });
    return {decoded:true,lagSamples:[...new Set(rows.map(r=>r.lagSamples))],minimumCanonicalCorrelation:Math.min(...rows.map(r=>r.canonicalCorrelation)),maximumAbsoluteRmsDeltaDb:Math.max(...rows.map(r=>Math.abs(r.canonicalRmsDeltaDb))),allComplete:rows.every(r=>r.complete),variants:rows};
   },{base64:bytes.toString('base64'),variants:source.layerCombinations,rate});
   rows.push({browser:browserName,version:browser.version(),file,...result});
  }
 }finally{await browser.close();}
}
const report={at:new Date().toISOString(),source:{path:input,sha256:hash(readFileSync(resolve(root,input)))},padding:{path:paddingPath,sha256:hash(readFileSync(resolve(root,paddingPath)))},harness:{path:relative(root,import.meta.filename),sha256:hash(readFileSync(import.meta.filename))},rows,
 scope:'Canonical sprite positions after browser decode, with the prepared128-sample Vorbis prefix and unchanged MP3 fallback. Both actual headless engines are tested independently. Unsupported formats are explicit failures for that format, never treated as zero latency.',runtimeChanged:false,humanListeningVerified:false,overallAudioGatePass:false};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),rows:rows.map(({variants,...r})=>r)}));
