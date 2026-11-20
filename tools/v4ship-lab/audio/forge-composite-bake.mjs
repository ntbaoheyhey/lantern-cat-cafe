/** Render all existing forge layer pairs; preparation only, never install implicitly. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {runtimeSignature,assertUnchanged} from '../../../scripts/audio/runtime-signature.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const out=resolve(root,`work/v4ship-audio/forge-composite-${attempt}`),reportPath=resolve(root,`reports/v4-ship/S11/forge-composite-bake-${attempt}.json`);
assert(!existsSync(out)&&!existsSync(reportPath)&&!existsSync(resolve(root,'STOP-V4SHIP')));mkdirSync(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex'),signed=p=>({path:relative(root,p),bytes:readFileSync(p).length,sha256:hash(readFileSync(p))});
const signature=runtimeSignature(root),audio=resolve(root,'apps/web/public/audio'),manifest=JSON.parse(readFileSync(resolve(audio,'manifest.json'))),source=resolve(audio,'b2-ui.webm');
const sourceBytes=readFileSync(source),rate=48000,ffmpeg='/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg';
const definitions=[{id:'ui.forge.hammer',base:'ui.hammer'},{id:'ui.forge.success',base:'ui.confirm'}].map(d=>({...d,design:structuredClone(manifest.designs[d.base])}));
for(const d of definitions){assert.equal(d.design.bus,'ui');assert(!d.design.baked);assert.equal(d.design.layers.length,2);assert(d.design.layers.every(l=>l.variants.length===6&&l.variants.every(s=>s.pack==='b2-ui')));}
const require=createRequire(resolve(root,'apps/web/package.json')),browsers=require('@playwright/test');
async function setup(browser){
 const page=await browser.newPage();await page.route('**/*',route=>{const u=new URL(route.request().url());
  if(u.pathname==='/__forge-composite')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Forge composite preparation</title>'});
  return u.hostname==='127.0.0.1'&&u.port==='5995'?route.continue():route.abort();
 });await page.goto('http://127.0.0.1:5995/__forge-composite');
 await page.evaluate(async({definitions,base64,rate})=>{
  const {AudioEngine}=await import('/src/audio/engine.ts'),decode=new OfflineAudioContext(1,1,rate);
  const source=await decode.decodeAudioData(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer);
  window.forgeRender=async(def,a,b,pitch=1)=>{
   const samples=[def.design.layers[0].variants[a],def.design.layers[1].variants[b]];
   const length=Math.ceil((Math.max(...samples.map((s,i)=>s.duration/pitch+def.design.layers[i].offsetMs/1000))+.012)*rate);
   const ctx=new OfflineAudioContext(1,length,rate),e=new AudioEngine(()=>.5);e.ctx=ctx;e.buses.set('ui',ctx.destination);
   def.design.layers.forEach((l,i)=>e.start(def.id,source,samples[i],def.design.priority,pitch,10**(l.gainDb/20),l.offsetMs/1000,l.eq,1,0));
   return Array.from((await ctx.startRendering()).getChannelData(0));
  };
  window.forgeDefinitions=definitions;window.forgeRate=rate;window.forgeEngine=AudioEngine;
 },{definitions,base64:sourceBytes.toString('base64'),rate});return page;
}
let browser;
try{
 browser=await browsers.chromium.launch({headless:true});const page=await setup(browser);
 const rendered=await page.evaluate(async()=>{
  const rows=[];let cursor=0;for(const def of window.forgeDefinitions)for(let a=0;a<6;a++)for(let b=0;b<6;b++){
   const pcm=await window.forgeRender(def,a,b),samples=[def.design.layers[0].variants[a],def.design.layers[1].variants[b]];
   rows.push({id:def.id,a,b,sample:{pack:'v4-forge',start:cursor/window.forgeRate,duration:pcm.length/window.forgeRate,bus:'ui',variantId:`${def.id}/${a}-${b}`,enveloped:true},layers:def.design.layers.map((l,i)=>({role:l.role,variantId:samples[i].variantId,offsetMs:l.offsetMs})),pcm});
   cursor+=pcm.length+Math.round(.08*window.forgeRate);
  }return {rows,samples:cursor};
 });assert.equal(rendered.rows.length,72);await browser.close();browser=null;
 const pcm=Buffer.alloc(rendered.samples*4);for(const row of rendered.rows)row.pcm.forEach((n,i)=>pcm.writeFloatLE(n,(Math.round(row.sample.start*rate)+i)*4));
 writeFileSync(resolve(out,'forge.f32'),pcm);
 for(const [format,codec,quality] of [['webm','libvorbis',['-q:a','7']],['mp3','libmp3lame',['-b:a','192k']]])
  execFileSync(ffmpeg,['-v','error','-y','-f','f32le','-ar',String(rate),'-ac','1','-i',resolve(out,'forge.f32'),'-c:a',codec,...quality,resolve(out,`v4-forge.${format}`)]);
 const comparisons=[];
 for(const browserName of ['chromium','webkit']){
  browser=await browsers[browserName].launch({headless:true});const p=await setup(browser);
  for(const format of ['pcm','webm','mp3']){
   const file=resolve(out,format==='pcm'?'forge.f32':`v4-forge.${format}`),bytes=readFileSync(file);
   const rows=await p.evaluate(async({format,base64,rows})=>{
    const rate=window.forgeRate,decode=new OfflineAudioContext(1,1,rate),bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));let input;
    if(format==='pcm'){input=decode.createBuffer(1,bytes.byteLength/4,rate);input.copyToChannel(new Float32Array(bytes.buffer),0);}else input=await decode.decodeAudioData(bytes.buffer);
    const results=[];for(const row of rows)for(const pitch of [.97,1,1.03]){
     const def=window.forgeDefinitions.find(d=>d.id===row.id),reference=await window.forgeRender(def,row.a,row.b,pitch);
     const length=Math.max(reference.length,Math.ceil(row.sample.duration/pitch*rate))+128,ctx=new OfflineAudioContext(1,length,rate),e=new window.forgeEngine(()=>.5);
     e.ctx=ctx;e.buses.set('ui',ctx.destination);e.start(row.id,input,row.sample,def.design.priority,pitch,1,0,'flat',1,0);
     const actual=(await ctx.startRendering()).getChannelData(0);let se=0,ae=0,ee=0,dot=0,maxError=0,sp=0,ap=0;
     for(let i=0;i<length;i++){const x=reference[i]??0,y=actual[i]??0,err=y-x;se+=x*x;ae+=y*y;ee+=err*err;dot+=x*y;maxError=Math.max(maxError,Math.abs(err));sp=Math.max(sp,Math.abs(x));ap=Math.max(ap,Math.abs(y));}
     const onset=(samples,peak)=>samples.findIndex(n=>Math.abs(n)>=peak*.01)/rate*1000;
     const metrics={rmsDeltaDb:10*Math.log10(ae/se),correlation:dot/Math.sqrt(se*ae),peakDeltaDb:20*Math.log10(ap/sp),onsetDeltaMs:onset(actual,ap)-onset(reference,sp),maxAbsoluteError:maxError,errorToSignalDb:ee?10*Math.log10(ee/se):null,durationMs:row.sample.duration/pitch*1000};
     const checks={rms:Math.abs(metrics.rmsDeltaDb)<=.5,correlation:metrics.correlation>=.98,peak:Math.abs(metrics.peakDeltaDb)<=1,onset:Math.abs(metrics.onsetDeltaMs)<=2,duration:metrics.durationMs<=300};
     results.push({variantId:row.sample.variantId,pitch,...metrics,checks,nominalPass:pitch!==1?null:format==='pcm'?maxError<=1e-7:Object.values(checks).every(Boolean)});
    }return results;
   },{format,base64:bytes.toString('base64'),rows:rendered.rows.map(({pcm,...row})=>row)});
   comparisons.push({browser:browserName,format,artifact:signed(file),rows});
  }await browser.close();browser=null;
 }
 const baked=rendered.rows.map(({pcm,...r})=>r),patch={pack:{'v4-forge':{webm:'/audio/v4-forge.webm',mp3:'/audio/v4-forge.mp3'}},designs:{},bindings:{}};
 for(const d of definitions){patch.designs[d.id]={...d.design,baked:baked.filter(r=>r.id===d.id).map(({sample,layers})=>({sample,layers}))};patch.bindings[d.id]=d.id;}
 writeFileSync(resolve(out,'manifest-patch.json'),JSON.stringify(patch,null,2)+'\n');
 const licences=JSON.parse(readFileSync(resolve(audio,'LICENSES.json'))),original=licences.files.find(r=>r.path==='apps/web/public/audio/b2-ui.webm');assert.equal(original.sha256,hash(sourceBytes));
 const entries=['webm','mp3'].map(format=>({...original,path:`apps/web/public/audio/v4-forge.${format}`,file:`v4-forge.${format}`,sha256:hash(readFileSync(resolve(out,`v4-forge.${format}`))),date:'2026-11-17',processing:'72 existing forge layer pairs rendered at48kHz through AudioEngine.start with authored offsets,filters,gains,envelopes;80ms sprite guards;VorbisQ7 or192kbpsMP3. Runtime common pitch/gain variation; no synthesis or normalization.',derivedFrom:signed(source),buildScript:signed(import.meta.filename)}));
 writeFileSync(resolve(out,'license-entries.json'),JSON.stringify(entries,null,2)+'\n');assertUnchanged(root,signature);
 const pass=comparisons.every(c=>c.rows.filter(r=>r.pitch===1).every(r=>r.nominalPass)&&c.rows.every(r=>r.checks.duration));
 const report={at:new Date().toISOString(),harness:signed(import.meta.filename),source:signed(source),signature,definitions:definitions.map(d=>({id:d.id,base:d.base,pairs:36})),output:relative(root,out),comparisons,
  patch:signed(resolve(out,'manifest-patch.json')),licenses:signed(resolve(out,'license-entries.json')),pass,runtimeInstalled:false,
  limits:['Nominal-pitch reference uses both authored layer filters/gains/envelopes. Composites share runtime pitch/gain variation; original independent layer randomization is not identical.','Pitch-boundary measurements use the same rate for both original layers. They do not cover every independent random pair or prove perceptual equivalence.','No listening, physical onset, scene mix or real UI admission acceptance is established.']};
 writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,reportPath),pass,comparisons:comparisons.map(c=>({browser:c.browser,format:c.format,bytes:c.artifact.bytes,nominalFailures:c.rows.filter(r=>r.pitch===1&&!r.nominalPass).length,maxNominalRmsDelta:Math.max(...c.rows.filter(r=>r.pitch===1).map(r=>Math.abs(r.rmsDeltaDb))),minNominalCorrelation:Math.min(...c.rows.filter(r=>r.pitch===1).map(r=>r.correlation)),maxPitchBoundaryRmsDelta:Math.max(...c.rows.map(r=>Math.abs(r.rmsDeltaDb))),minPitchBoundaryCorrelation:Math.min(...c.rows.map(r=>r.correlation))}))}));
 if(!pass)process.exitCode=1;
}catch(error){if(!existsSync(reportPath))writeFileSync(reportPath,JSON.stringify({at:new Date().toISOString(),failure:error.message,harness:signed(import.meta.filename),runtimeInstalled:false},null,2)+'\n');throw error;}
finally{if(browser)await browser.close();}
