/** Distinguish repeat-render variation from faithful playback of the first native graph output. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {runtimeSignature,assertUnchanged} from '../../../scripts/audio/runtime-signature.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/forge-native-replay-${attempt}.json`),raw=output.replace('.json','.rows.json.gz');assert(!existsSync(output)&&!existsSync(raw)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=b=>createHash('sha256').update(b).digest('hex'),signed=path=>({path,sha256:hash(readFileSync(resolve(root,path)))}),signature=runtimeSignature(root);
const require=createRequire(resolve(root,'apps/web/package.json')),browsers=require('@playwright/test'),rows=[];
for(const name of ['chromium','webkit']){
 const browser=await browsers[name].launch({headless:true});try{
  const p=await browser.newPage();await p.route('**/*',route=>{const u=new URL(route.request().url());if(u.pathname==='/__forge-replay')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Forge native replay comparison</title>'});return u.hostname==='127.0.0.1'&&u.port==='5995'?route.continue():route.abort();});await p.goto('http://127.0.0.1:5995/__forge-replay');
  for(const rate of [48000,44100]){
   const result=await p.evaluate(async rate=>{
    const {AudioEngine}=await import('/src/audio/engine.ts'),m=await(await fetch('/audio/manifest.json')).json(),bytes=await(await fetch(m.packs['b2-ui'].webm)).arrayBuffer(),inputBytes=bytes.byteLength;
    const input=await new OfflineAudioContext(1,1,rate).decodeAudioData(bytes),rows=[];let preparationMs=0,retainedBufferBytes=0;
    const difference=(a,b)=>{let max=0;for(let i=0;i<Math.max(a.length,b.length);i++)max=Math.max(max,Math.abs((a[i]??0)-(b[i]??0)));return max;};
    for(const [id,key] of [['ui.forge.hammer','ui.hammer'],['ui.forge.success','ui.confirm']])for(let a=0;a<6;a++)for(let b=0;b<6;b++){
     const design=m.designs[key],samples=[design.layers[0].variants[a],design.layers[1].variants[b]],length=Math.ceil((Math.max(...samples.map((s,i)=>s.duration+design.layers[i].offsetMs/1000))+.012)*rate);
     async function direct(){const c=new OfflineAudioContext(1,length,rate),e=new AudioEngine(()=>.5);e.ctx=c;e.buses.set('ui',c.destination);design.layers.forEach((l,i)=>e.start(id,input,samples[i],design.priority,1,10**(l.gainDb/20),l.offsetMs/1000,l.eq,1,0));return c.startRendering();}
     const begin=performance.now(),reference=await direct();preparationMs+=performance.now()-begin;retainedBufferBytes+=reference.length*4;
     const repeated=await direct(),outputs=[];
     for(const method of ['raw-node','engine-composite']){
      const c=new OfflineAudioContext(1,length+128,rate);
      if(method==='raw-node'){const s=c.createBufferSource();s.buffer=reference;s.connect(c.destination);s.start(0,0,reference.duration);}
      else{const e=new AudioEngine(()=>.5);e.ctx=c;e.buses.set('ui',c.destination);e.start(id,reference,{pack:'native',start:0,duration:reference.duration,bus:'ui',enveloped:true},design.priority,1,1,0,'flat',1,0);}
      const actual=await c.startRendering();outputs.push({method,maxAbsoluteError:difference(reference.getChannelData(0),actual.getChannelData(0))});
     }
     rows.push({id,a,b,durationMs:reference.duration/.97*1000,repeatGraphError:difference(reference.getChannelData(0),repeated.getChannelData(0)),outputs});
    }return {sampleRate:rate,inputBytes,preparationMs,retainedBufferBytes,rows};
   },rate);rows.push({browser:name,version:browser.version(),...result});
  }
 }finally{await browser.close();}
}
assertUnchanged(root,signature);writeFileSync(raw,gzipSync(JSON.stringify(rows)));
const summary=rows.map(({rows,...r})=>({...r,variants:rows.length,repeatGraphThresholdFailures:rows.filter(x=>x.repeatGraphError>1e-7).length,maximumRepeatGraphError:Math.max(...rows.map(x=>x.repeatGraphError)),maximumDurationMs:Math.max(...rows.map(x=>x.durationMs)),methods:['raw-node','engine-composite'].map(method=>({method,cases:rows.length,maximumError:Math.max(...rows.flatMap(x=>x.outputs.filter(o=>o.method===method).map(o=>o.maxAbsoluteError))),failures:rows.filter(x=>x.outputs.find(o=>o.method===method).maxAbsoluteError>1e-7).length}))}));
const replayPass=summary.every(r=>r.inputBytes>0&&r.variants===72&&r.maximumDurationMs<=300&&r.methods.every(m=>m.failures===0));
writeFileSync(output,JSON.stringify({at:new Date().toISOString(),harness:signed(relative(root,import.meta.filename)),inputs:[signed('reports/v4-ship/S11/forge-native-study-1.json'),signed('apps/web/public/audio/manifest.json'),signed('apps/web/public/audio/b2-ui.webm')],signature,raw:signed(relative(root,raw)),summary,replayPass,originalRepeatRenderFailureRetained:true,runtimeChanged:false,overallAudioGatePass:false,limits:'Replay compares the first rendered native graph buffer with two independent one-source playback paths. Repeat-render variation is measured separately and the original failed criterion is not rewritten. No physical onset, listening, scene mix or UI admission claim.'},null,2)+'\n');
console.log(JSON.stringify({output:relative(root,output),replayPass,summary}));if(!replayPass)process.exitCode=1;
