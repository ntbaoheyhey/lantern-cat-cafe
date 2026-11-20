/** Compare MP3 muxer metadata against wide-lag browser decoding; preparation only. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const folder=resolve(root,`work/v4ship-audio/ranged-mp3-muxers-${attempt}`),output=resolve(root,`reports/v4-ship/S11/ranged-mp3-muxers-${attempt}.json`);
assert(!existsSync(folder)&&!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));mkdirSync(folder,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex'),signed=path=>({path,sha256:hash(readFileSync(resolve(root,path)))});
const sourcePath='reports/v4-ship/S11/ranged-impact-bake-1.json',source=JSON.parse(readFileSync(resolve(root,sourcePath)));
const pcmPath=resolve(root,source.output,'impacts.f32'),pcm=readFileSync(pcmPath),rate=48000;
const ffmpeg=process.env.V4_FFMPEG??'/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg';
const original=resolve(root,source.output,'v4-ranged-impacts.mp3');assert.equal(hash(readFileSync(original)),source.comparisons.find(r=>r.format==='mp3').sha256);
const files=[{name:'original-xing-id3',...signed(relative(root,original)),options:[]}];
for(const [name,options] of [['no-xing',['-write_xing','0']],['no-id3',['-id3v2_version','0']],['no-xing-no-id3',['-write_xing','0','-id3v2_version','0']]]){
 const target=resolve(folder,`${name}.mp3`);
 execFileSync(ffmpeg,['-v','error','-y','-f','f32le','-ar',String(rate),'-ac','1','-i',pcmPath,'-c:a','libmp3lame','-b:a','192k',...options,target]);
 files.push({name,options,...signed(relative(root,target))});
}
const require=createRequire(resolve(root,'apps/web/package.json')),playwright=require('@playwright/test'),rows=[];
for(const browserName of ['chromium','webkit']){
 const browser=await playwright[browserName].launch({headless:true});
 try{
  const page=await browser.newPage();await page.evaluate(base64=>{window.__originalPCM=new Float32Array(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer);},pcm.toString('base64'));
  for(const file of files){
   assert(!existsSync(resolve(root,'STOP-V4SHIP')));const bytes=readFileSync(resolve(root,file.path));assert.equal(hash(bytes),file.sha256);
   const result=await page.evaluate(async({base64,variants,rate})=>{
    const ctx=new OfflineAudioContext(1,1,rate),decoded=await ctx.decodeAudioData(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer),actual=decoded.getChannelData(0),pcm=window.__originalPCM;
    const rows=variants.map(v=>{
     const start=Math.round(v.sample.start*rate),length=Math.round(v.sample.duration*rate);let best={lag:0,correlation:-Infinity};
     for(let lag=-4096;lag<=4096;lag++){
      let xx=0,yy=0,xy=0;
      for(let i=64;i<Math.min(length,4096);i+=16){const x=pcm[start+i],y=actual[start+i+lag]??0;xx+=x*x;yy+=y*y;xy+=x*y;}
      const correlation=xy/Math.sqrt(xx*yy);if(correlation>best.correlation)best={lag,correlation};
     }
     const measure=lag=>{let xx=0,yy=0,xy=0,error=0;for(let i=0;i<length;i++){const x=pcm[start+i],y=actual[start+i+lag]??0;xx+=x*x;yy+=y*y;xy+=x*y;error+=(y-x)**2;}return {correlation:xy/Math.sqrt(xx*yy),rmsDeltaDb:10*Math.log10(yy/xx),errorToSignalDb:10*Math.log10(error/xx),complete:start+lag>=0&&start+lag+length<=actual.length};};
     return {variantId:v.sample.variantId,lagSamples:best.lag,lagMs:best.lag/rate*1000,prefixCorrelation:best.correlation,canonical:measure(0),aligned:measure(best.lag)};
    });
    return {decodedFrames:actual.length,originalFrames:pcm.length,sampleRate:decoded.sampleRate,channels:decoded.numberOfChannels,lagSamples:[...new Set(rows.map(r=>r.lagSamples))],minimumCanonicalCorrelation:Math.min(...rows.map(r=>r.canonical.correlation)),minimumAlignedCorrelation:Math.min(...rows.map(r=>r.aligned.correlation)),maximumAlignedRmsDeltaDb:Math.max(...rows.map(r=>Math.abs(r.aligned.rmsDeltaDb))),allComplete:rows.every(r=>r.aligned.complete),variants:rows};
   },{base64:bytes.toString('base64'),variants:source.layerCombinations,rate});
   const row={browser:browserName,version:browser.version(),file,bytes:bytes.length,...result};rows.push(row);
   console.log(JSON.stringify({browser:browserName,candidate:file.name,lagSamples:row.lagSamples,minimumCanonicalCorrelation:row.minimumCanonicalCorrelation,minimumAlignedCorrelation:row.minimumAlignedCorrelation,allComplete:row.allComplete}));
  }
 }finally{await browser.close();}
}
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-ranged-audio.md',source:signed(sourcePath),pcm:signed(relative(root,pcmPath)),harness:signed(relative(root,import.meta.filename)),files,rows,
 method:'Exhaustive integer-sample lag search +/-4096 using the first85ms at stride16, followed by full-sprite canonical and best-lag metrics for all72 variants. Same PCM, codec and bitrate; only Xing/ID3 muxer options vary.',
 scope:'Actual headless Chromium/WebKit decodeAudioData at48kHz. Decoder alignment is distinct from source scheduling, physical onset and audible quality. No runtime or public assets changed.',runtimeChanged:false,humanListeningVerified:false,overallAudioGatePass:false};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),cases:rows.length}));
