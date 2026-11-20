/** Prepare ranged-only impact composites from published layers; never install a runtime patch. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const out=resolve(root,`work/v4ship-audio/ranged-impact-bake-${attempt}`),reportPath=resolve(root,`reports/v4-ship/S11/ranged-impact-bake-${attempt}.json`);
assert(!existsSync(out)&&!existsSync(reportPath)&&!existsSync(resolve(root,'STOP-V4SHIP')));mkdirSync(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex'),signed=path=>({path,sha256:sha(readFileSync(resolve(root,path)))}),audio=resolve(root,'apps/web/public/audio');
const manifest=JSON.parse(readFileSync(resolve(audio,'manifest.json'))),designs=Object.fromEntries(['ember','heavy'].map(element=>[element,structuredClone(manifest.designs[`kit.${element}.impact`])]));
for(const design of Object.values(designs))assert(design.layers.length===4&&design.layers.every(l=>l.variants.length===6&&l.variants.every(s=>s.pack==='b2-hits'))&&!design.baked);
const source=resolve(audio,'b2-hits.webm'),sourceBytes=readFileSync(source),rate=48000,pack='v4-ranged-impacts';
const ffmpeg=process.env.V4_FFMPEG??'/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg';
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true});let page;
try{
 page=await browser.newPage();await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.pathname==='/__ranged-bake')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Ranged impact composite preparation</title>'});return u.hostname==='127.0.0.1'&&u.port==='5995'?route.continue():route.abort();});
 await page.goto('http://127.0.0.1:5995/__ranged-bake');
 const rendered=await page.evaluate(async({designs,base64,rate,pack})=>{
  const {AudioEngine}=await import('/src/audio/engine.ts'),decode=new OfflineAudioContext(1,1,rate),input=await decode.decodeAudioData(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer);
  if(input.numberOfChannels!==1)throw Error('Published impact pack must be mono; no implicit downmix');
  const rows=[];let cursor=0;
  for(const [element,design] of Object.entries(designs))for(let a=0;a<6;a++)for(let b=0;b<6;b++){
   // Balanced 36 combinations: each constituent variant occurs six times per element.
   const indices=[a,b,(a+b)%6,(a+5*b)%6],samples=design.layers.map((l,i)=>l.variants[indices[i]]);
   const length=Math.ceil((Math.max(...samples.map((s,i)=>s.duration+design.layers[i].offsetMs/1000))+.012)*rate);
   const ctx=new OfflineAudioContext(1,length,rate),engine=new AudioEngine(()=>.5);engine.ctx=ctx;engine.buses.set('sfx',ctx.destination);
   for(const [i,layer] of design.layers.entries()){
    const roleTrim=layer.role==='transient'?-9:layer.role==='sweetener'?-7:layer.role==='body'?3:1;
    engine.start(`kit.${element}.impact`,input,samples[i],design.priority,1,10**((layer.gainDb+roleTrim)/20),layer.offsetMs/1000,layer.eq,1,0);
   }
   const buffer=await ctx.startRendering(),pcm=Array.from(buffer.getChannelData(0));
   rows.push({element,indices,sample:{pack,start:cursor/rate,duration:length/rate,bus:'sfx',variantId:`ranged.${element}.impact/${a}-${b}`,enveloped:true},layers:design.layers.map((l,i)=>({role:l.role,variantId:samples[i].variantId,offsetMs:l.offsetMs})),pcm});
   cursor+=length+Math.round(.08*rate);
  }
  return {rows,samples:cursor};
 },{designs,base64:sourceBytes.toString('base64'),rate,pack});
 assert.equal(rendered.rows.length,72);const pcm=Buffer.alloc(rendered.samples*4);let cursor=0;
 for(const row of rendered.rows){for(const n of row.pcm){assert(Number.isFinite(n));pcm.writeFloatLE(n,cursor++*4);}cursor+=Math.round(.08*rate);}
 writeFileSync(resolve(out,'impacts.f32'),pcm);
 const comparisons=[];
 for(const [format,codec,quality] of [['webm','libvorbis',['-q:a','7']],['mp3','libmp3lame',['-b:a','192k']]]){
  const target=resolve(out,`${pack}.${format}`);
  execFileSync(ffmpeg,['-v','error','-y','-f','f32le','-ar',String(rate),'-ac','1','-i',resolve(out,'impacts.f32'),'-c:a',codec,...quality,target]);
  const bytes=readFileSync(target),rows=await page.evaluate(async({base64,rows,rate})=>{
   const ctx=new OfflineAudioContext(1,1,rate),decoded=await ctx.decodeAudioData(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer),pcm=decoded.getChannelData(0);
   return rows.map(row=>{
    const offset=Math.round(row.sample.start*rate),original=row.pcm,actual=pcm.slice(offset,offset+original.length);let sourceEnergy=0,decodedEnergy=0,errorEnergy=0,maxError=0,dot=0;
    for(let i=0;i<original.length;i++){const x=original[i],y=actual[i]??0,e=y-x;sourceEnergy+=x*x;decodedEnergy+=y*y;errorEnergy+=e*e;dot+=x*y;maxError=Math.max(maxError,Math.abs(e));}
    return {variantId:row.sample.variantId,durationMs:row.sample.duration*1000,rmsDeltaDb:10*Math.log10(decodedEnergy/sourceEnergy),errorToSignalDb:10*Math.log10(errorEnergy/sourceEnergy),correlation:dot/Math.sqrt(sourceEnergy*decodedEnergy),maxAbsoluteError:maxError};
   });
  },{base64:bytes.toString('base64'),rows:rendered.rows,rate});
  comparisons.push({format,bytes:bytes.length,sha256:sha(bytes),rows});
 }
 const baked=rendered.rows.map(({pcm,...row})=>row),patch={packs:{[pack]:{webm:`/audio/${pack}.webm`,mp3:`/audio/${pack}.mp3`}},designs:Object.fromEntries(Object.entries(designs).map(([element,design])=>[`kit.ranged-${element}.impact`,{...design,baked:baked.filter(r=>r.element===element).map(({sample,layers})=>({sample,layers}))}]))};
 writeFileSync(resolve(out,'manifest-patch.json'),JSON.stringify(patch,null,2)+'\n');
 const licenses=JSON.parse(readFileSync(resolve(audio,'LICENSES.json'))),original=licenses.files.find(r=>r.path==='apps/web/public/audio/b2-hits.webm');assert.equal(original.sha256,sha(sourceBytes));
 const entries=comparisons.map(c=>({...original,path:`apps/web/public/audio/${pack}.${c.format}`,file:`${pack}.${c.format}`,sha256:c.sha256,date:'2026-11-16',processing:'36 balanced four-layer combinations per ember/heavy impact; original AudioEngine.start graph at48kHz, nominal pitch, authored filters/offsets/gains/envelopes,80ms sprite guards. No new recording or normalization. Composite common pitch/gain replaces independent per-layer randomization; these are selected combinations, not all1296.',derivedFrom:signed(relative(root,source)),buildScript:signed(relative(root,import.meta.filename))}));
 writeFileSync(resolve(out,'license-entries.json'),JSON.stringify(entries,null,2)+'\n');
 const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-ranged-audio.md',source:signed(relative(root,source)),engine:signed('apps/web/src/audio/engine.ts'),script:signed(relative(root,import.meta.filename)),output:relative(root,out),variants:baked.length,layerCombinations:baked,commonRuntimeGainDb:-4,comparisons,
  scope:'Ranged-only composite preparation; encoded reconstruction against the nominal-pitch original start graph. Common runtime pitch/gain is retained but independent layer randomization is reduced to36 balanced combinations per element. No claims about audible equivalence, physical onset or production admission.',runtimeInstalled:false,humanListeningVerified:false,overallAudioGatePass:false};
 writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({report:relative(root,reportPath),variants:baked.length,formats:comparisons.map(c=>({format:c.format,bytes:c.bytes,maximumAbsoluteRmsDeltaDb:Math.max(...c.rows.map(r=>Math.abs(r.rmsDeltaDb))),minimumCorrelation:Math.min(...c.rows.map(r=>r.correlation))}))}));
}catch(error){writeFileSync(reportPath,JSON.stringify({at:new Date().toISOString(),failure:String(error.message).slice(0,300),output:relative(root,out),runtimeInstalled:false},null,2)+'\n');throw error;}
finally{await browser.close();}
