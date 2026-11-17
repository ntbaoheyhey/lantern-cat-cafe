/** LEARN/S11-audio-latency.md: actual AudioEngine, fresh contexts, no runtime edits. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/audio-context-latency-${attempt}.json`);
assert(!existsSync(output));assert(!existsSync(resolve(root,'STOP-V4SHIP')));
const sha=b=>createHash('sha256').update(b).digest('hex');
const require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const report={at:new Date().toISOString(),harnessSha256:sha(readFileSync(import.meta.filename)),runtime:['apps/web/src/audio/engine.ts','apps/web/public/audio/manifest.json'].map(path=>({path,sha256:sha(readFileSync(resolve(root,path)))})),rows:[],complete:false,physicalOnsetVerified:false,scope:'Controlled buffering comparison only; unchanged native cue graph and mixer. No battle/audio gate claim.'};
const save=()=>writeFileSync(output,JSON.stringify(report,null,2)+'\n');
try{
 for(let pair=0;pair<3;pair++)for(const method of pair%2?['numeric','default']:['default','numeric']){
  const context=await browser.newContext(),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message.slice(0,160)));
  await page.route('http://127.0.0.1:5995/__context-latency-study',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Local audio latency comparison</title>'}));
  await page.goto('http://127.0.0.1:5995/__context-latency-study');
  const row=await page.evaluate(async method=>{
   const {AudioEngine}=await import('/src/audio/engine.ts');
   const engine=new AudioEngine(()=>.5);
   engine.ctx=new AudioContext(method==='numeric'?{latencyHint:.001}:undefined);
   const audio=engine.ctx,starts=[],requests=[];
   await engine.unlock();await engine.preload('home');
   await new Promise(resolve=>setTimeout(resolve,300));
   const original=audio.createBufferSource.bind(audio);let request;
   audio.createBufferSource=()=>{
    const source=original(),start=source.start.bind(source);
    source.start=(when=0,offset=0,duration)=>{
     const stamp=audio.getOutputTimestamp();
     starts.push({request:request?{...request}:null,calledAt:performance.now(),when,offset,duration,stamp,estimatedOnsetMs:request&&stamp.contextTime>0?stamp.performanceTime+(when-stamp.contextTime)*1000-request.time:null});
     return start(when,offset,duration);
    };return source;
   };
   for(let i=0;i<20;i++){
    request={i,time:performance.now(),audioTime:audio.currentTime};requests.push({...request});
    engine.play('ui.hover');await new Promise(resolve=>setTimeout(resolve,120));
   }
   const result={sampleRate:audio.sampleRate,baseLatency:audio.baseLatency,outputLatency:audio.outputLatency,state:audio.state,starts,requests,hits:engine.hits};
   await audio.close();return result;
  },method);
  const estimated=row.starts.map(s=>s.estimatedOnsetMs).filter(n=>typeof n==='number').sort((a,b)=>a-b);
  report.rows.push({pair,method,...row,errors,summary:{sources:row.starts.length,uniqueRequests:new Set(row.starts.map(s=>s.request?.i)).size,min:estimated[0],median:estimated[Math.floor(estimated.length/2)],max:estimated.at(-1),outside33ms:estimated.filter(n=>Math.abs(n)>33).length}});
  await context.close();save();
 }
 report.complete=true;
}finally{await browser.close();save();}
console.log(JSON.stringify({output,complete:report.complete,rows:report.rows.map(r=>({pair:r.pair,method:r.method,baseLatency:r.baseLatency,outputLatency:r.outputLatency,...r.summary}))}));
