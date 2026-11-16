/** Compare explicit codec-leading silence; preserve canonical sprite coordinates and prior encodes. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const out=resolve(root,`work/v4ship-audio/ranged-codec-padding-${attempt}`),output=resolve(root,`reports/v4-ship/S11/ranged-codec-padding-${attempt}.json`);
assert(!existsSync(out)&&!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));mkdirSync(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex'),input='reports/v4-ship/S11/ranged-impact-bake-1.json',source=JSON.parse(readFileSync(resolve(root,input))),folder=resolve(root,source.output),rate=48000;
const original=readFileSync(resolve(folder,'impacts.f32')),alignment=JSON.parse(readFileSync(resolve(root,'reports/v4-ship/S11/ranged-codec-alignment-1.json')));assert.equal(hash(original),alignment.pcm.sha256);
assert.deepEqual(alignment.rows.find(r=>r.format==='webm').lagSamples,[-128]);
const ffmpeg=process.env.V4_FFMPEG??'/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg';
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true}),rows=[];
try{
 const page=await browser.newPage();
 await page.evaluate(base64=>{window.__originalPCM=new Float32Array(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer);},original.toString('base64'));
 for(const leadingSamples of [128,256]){
  const pcmPath=resolve(out,`leading-${leadingSamples}.f32`),path=resolve(out,`leading-${leadingSamples}.webm`);
  writeFileSync(pcmPath,Buffer.concat([Buffer.alloc(leadingSamples*4),original]));
  execFileSync(ffmpeg,['-v','error','-y','-f','f32le','-ar',String(rate),'-ac','1','-i',pcmPath,'-c:a','libvorbis','-q:a','7',path]);
  const bytes=readFileSync(path),variants=await page.evaluate(async({base64,variants,rate})=>{
   const pcm=window.__originalPCM,ctx=new OfflineAudioContext(1,1,rate),decoded=await ctx.decodeAudioData(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer),actual=decoded.getChannelData(0);
   return variants.map(v=>{
    const start=Math.round(v.sample.start*rate),length=Math.round(v.sample.duration*rate);let best={lag:0,correlation:-Infinity};
    for(let lag=-256;lag<=256;lag++){
     let xx=0,yy=0,xy=0;
     for(let i=64;i<Math.min(length-256,4096);i+=8){const x=pcm[start+i],y=actual[start+i+lag]??0;xx+=x*x;yy+=y*y;xy+=x*y;}
     const correlation=xy/Math.sqrt(xx*yy);if(correlation>best.correlation)best={lag,correlation};
    }
    let xx=0,yy=0,xy=0,error=0;
    for(let i=0;i<length;i++){const x=pcm[start+i],y=actual[start+i]??0;xx+=x*x;yy+=y*y;xy+=x*y;error+=(y-x)**2;}
    return {variantId:v.sample.variantId,lagSamples:best.lag,lagMs:best.lag/rate*1000,canonicalCorrelation:xy/Math.sqrt(xx*yy),canonicalRmsDeltaDb:10*Math.log10(yy/xx),canonicalErrorToSignalDb:10*Math.log10(error/xx),complete:start+length<=actual.length};
   });
  },{base64:bytes.toString('base64'),variants:source.layerCombinations,rate});
  assert(variants.length===72&&variants.every(v=>v.complete));
  rows.push({leadingSamples,file:{path:relative(root,path),bytes:bytes.length,sha256:hash(bytes)},lagSamples:[...new Set(variants.map(v=>v.lagSamples))],minimumCanonicalCorrelation:Math.min(...variants.map(v=>v.canonicalCorrelation)),maximumAbsoluteRmsDeltaDb:Math.max(...variants.map(v=>Math.abs(v.canonicalRmsDeltaDb))),variants});
 }
}finally{await browser.close();}
const selected=rows.find(r=>r.leadingSamples===128);assert.deepEqual(selected.lagSamples,[0]);
const report={at:new Date().toISOString(),source:{path:input,sha256:hash(readFileSync(resolve(root,input)))},diagnostic:{path:'reports/v4-ship/S11/ranged-codec-alignment-1.json',sha256:hash(readFileSync(resolve(root,'reports/v4-ship/S11/ranged-codec-alignment-1.json')))},harness:{path:relative(root,import.meta.filename),sha256:hash(readFileSync(import.meta.filename))},rows,selectedCandidate:selected.file,
 scope:'Only codec-leading silence changes. Browser decode trims128 samples from these Vorbis streams; adding128 zeros restores every canonical sprite coordinate.256 zeros is an intentionally over-padded comparison. No runtime source offsets, source layers, or gain normalization change.',
 limitations:['Measured in the current Chromium decoder. Alternate browser/codec behavior must be checked before publishing.','Nominal-pitch reconstruction does not establish audible equivalence after composite pitch/gain variation or speed changes.'],runtimeChanged:false,humanListeningVerified:false,overallAudioGatePass:false};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),rows:rows.map(({variants,...r})=>r)}));
