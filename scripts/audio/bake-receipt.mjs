/** Render existing receipt layers through the real start graph. No source download or synthesis. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const out=resolve(root,`work/v4ship-audio/receipt-bake-${attempt}`),reportPath=resolve(root,`reports/v4-ship/S11/audio-receipt-bake-${attempt}.json`);
assert(!existsSync(out)&&!existsSync(reportPath)&&!existsSync(resolve(root,'STOP-V4SHIP')));mkdirSync(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex'),audio=resolve(root,'apps/web/public/audio');
const ffmpeg=process.env.V4_FFMPEG??'/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg';
const manifest=JSON.parse(readFileSync(resolve(audio,'manifest.json'))),design=structuredClone(manifest.designs['tx.confirmed']);
assert.equal(design.layers.length,2);assert(design.layers.every(l=>l.variants.length===6));delete design.baked;
const source=resolve(audio,'b2-ui.webm'),sourceBytes=readFileSync(source),rate=48000;
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true});let page,rendered;
try{
 page=await browser.newPage();await page.route('**/__receipt-bake',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Receipt composite preparation</title>'}));
 await page.goto('http://127.0.0.1:5995/__receipt-bake');
 rendered=await page.evaluate(async({design,base64,rate})=>{
  const {AudioEngine}=await import('/src/audio/engine.ts');
  const decode=new OfflineAudioContext(1,1,rate),input=await decode.decodeAudioData(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer);
  const rows=[];let cursor=0;
  for(let a=0;a<6;a++)for(let b=0;b<6;b++){
   const samples=[design.layers[0].variants[a],design.layers[1].variants[b]];
   const length=Math.ceil((Math.max(...samples.map((s,i)=>s.duration+design.layers[i].offsetMs/1000))+.012)*rate);
   const ctx=new OfflineAudioContext(1,length,rate),engine=new AudioEngine(()=>.5);
   engine.ctx=ctx;engine.buses.set('sfx',ctx.destination);
   for(let i=0;i<2;i++){
    const layer=design.layers[i],sample=samples[i],roleTrim=layer.role==='transient'?-9:layer.role==='sweetener'?-7:layer.role==='body'?3:1;
    engine.start('tx.confirmed',input,sample,design.priority,1,10**((layer.gainDb+roleTrim)/20),layer.offsetMs/1000,layer.eq,1,0);
   }
   const buffer=await ctx.startRendering(),pcm=Array.from(buffer.getChannelData(0));
   rows.push({sample:{pack:'v4-receipt',start:cursor/rate,duration:length/rate,bus:'sfx',variantId:`tx.confirmed/${a}-${b}`,enveloped:true},layers:design.layers.map((l,i)=>({role:l.role,variantId:samples[i].variantId,offsetMs:l.offsetMs})),pcm});
   cursor+=length+Math.round(.08*rate);
  }
  return {rows,samples:cursor};
 },{design,base64:sourceBytes.toString('base64'),rate});
 const pcm=Buffer.alloc(rendered.samples*4);let cursor=0;
 for(const row of rendered.rows){for(const n of row.pcm){pcm.writeFloatLE(n,cursor*4);cursor++;}cursor+=Math.round(.08*rate);}
 writeFileSync(resolve(out,'receipt.f32'),pcm);
 for(const [format,codec,quality] of [['webm','libvorbis',['-q:a','7']],['mp3','libmp3lame',['-b:a','192k']]])execFileSync(ffmpeg,['-v','error','-y','-f','f32le','-ar',String(rate),'-ac','1','-i',resolve(out,'receipt.f32'),'-c:a',codec,...quality,resolve(out,`v4-receipt.${format}`)]);
 const comparisons=[];
 for(const format of ['webm','mp3']){
  const bytes=readFileSync(resolve(out,`v4-receipt.${format}`));
  const rows=await page.evaluate(async({base64,rows,rate})=>{
   const ctx=new OfflineAudioContext(1,1,rate),decoded=await ctx.decodeAudioData(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer),pcm=decoded.getChannelData(0);
   return rows.map(row=>{
    const offset=Math.round(row.sample.start*rate),original=row.pcm,actual=pcm.slice(offset,offset+original.length);let sourceEnergy=0,decodedEnergy=0,errorEnergy=0,maxError=0,dot=0;
    for(let i=0;i<original.length;i++){const x=original[i],y=actual[i]??0,e=y-x;sourceEnergy+=x*x;decodedEnergy+=y*y;errorEnergy+=e*e;dot+=x*y;maxError=Math.max(maxError,Math.abs(e));}
    return {variantId:row.sample.variantId,durationMs:row.sample.duration*1000,rmsDeltaDb:10*Math.log10(decodedEnergy/sourceEnergy),errorToSignalDb:10*Math.log10(errorEnergy/sourceEnergy),correlation:dot/Math.sqrt(sourceEnergy*decodedEnergy),maxAbsoluteError:maxError};
   });
  },{base64:bytes.toString('base64'),rows:rendered.rows,rate});
  comparisons.push({format,bytes:bytes.length,sha256:sha(bytes),rows});
 }
 const baked=rendered.rows.map(({pcm,...row})=>row),patch={pack:{'v4-receipt':{webm:'/audio/v4-receipt.webm',mp3:'/audio/v4-receipt.mp3'}},cue:'tx.confirmed',design:{...design,baked}};
 writeFileSync(resolve(out,'manifest-patch.json'),JSON.stringify(patch,null,2)+'\n');
 const licences=JSON.parse(readFileSync(resolve(audio,'LICENSES.json'))),original=licences.files.find(r=>r.path==='apps/web/public/audio/b2-ui.webm');assert.equal(original.sha256,sha(sourceBytes));
 const entries=comparisons.map(c=>({...original,path:`apps/web/public/audio/v4-receipt.${c.format}`,file:`v4-receipt.${c.format}`,sha256:c.sha256,date:'2026-11-16',processing:'36 existing receipt-layer pairs rendered through AudioEngine.start at48kHz, with authored filters,offsets,role gains and individual envelopes;80ms sprite guards;VorbisQ7 or192kbpsMP3. Common cue gain and composite pitch/gain remain in runtime. No new recording or normalization.',derivedFrom:{path:'apps/web/public/audio/b2-ui.webm',sha256:sha(sourceBytes)},buildScript:{path:relative(root,import.meta.filename),sha256:sha(readFileSync(import.meta.filename))}}));
 writeFileSync(resolve(out,'license-entries.json'),JSON.stringify(entries,null,2)+'\n');
 const report={at:new Date().toISOString(),source:{path:relative(root,source),sha256:sha(sourceBytes)},engine:{path:'apps/web/src/audio/engine.ts',sha256:sha(readFileSync(resolve(root,'apps/web/src/audio/engine.ts')))},script:{path:relative(root,import.meta.filename),sha256:sha(readFileSync(import.meta.filename))},output:relative(root,out),variants:baked.length,layerPairs:baked.map(r=>({variantId:r.sample.variantId,layers:r.layers})),commonRuntimeGainDb:-4,comparisons,scope:'Nominal-pitch source rendering and lossy encoded reconstruction measurements only. No human listening or end-to-end mix acceptance is inferred.',runtimeInstalled:false};
 writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({report:relative(root,reportPath),variants:baked.length,formats:comparisons.map(c=>({format:c.format,bytes:c.bytes,maximumAbsoluteRmsDeltaDb:Math.max(...c.rows.map(r=>Math.abs(r.rmsDeltaDb))),minimumCorrelation:Math.min(...c.rows.map(r=>r.correlation))}))}));
}catch(error){
 writeFileSync(reportPath,JSON.stringify({at:new Date().toISOString(),failure:String(error.message).slice(0,600),output:relative(root,out),runtimeInstalled:false},null,2)+'\n');throw error;
}finally{await browser.close();}
