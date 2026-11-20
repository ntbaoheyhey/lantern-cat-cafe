/** Compare native individual composites with the original layered graph, before installation. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {runtimeSignature,assertUnchanged} from '../../../scripts/audio/runtime-signature.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/forge-native-study-${attempt}.json`),raw=output.replace('.json','.rows.json.gz');
assert(!existsSync(output)&&!existsSync(raw)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=b=>createHash('sha256').update(b).digest('hex'),signed=path=>({path,bytes:readFileSync(resolve(root,path)).length,sha256:hash(readFileSync(resolve(root,path)))});
const signature=runtimeSignature(root),require=createRequire(resolve(root,'apps/web/package.json')),browsers=require('@playwright/test'),results=[];
try{
 for(const name of ['chromium','webkit']){
  const browser=await browsers[name].launch({headless:true});try{
   const page=await browser.newPage();await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.pathname==='/__forge-native')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Native forge comparison</title>'});return u.hostname==='127.0.0.1'&&u.port==='5995'?route.continue():route.abort();});
   await page.goto('http://127.0.0.1:5995/__forge-native');
   const result=await page.evaluate(async()=>{
    const {AudioEngine}=await import('/src/audio/engine.ts'),m=await(await fetch('/audio/manifest.json')).json(),bytes=await(await fetch(m.packs['b2-ui'].webm)).arrayBuffer();
    const rate=48000,decode=new OfflineAudioContext(1,1,rate),input=await decode.decodeAudioData(bytes),prepared=[],rows=[];
    async function direct(id,design,a,b,pitch){
     const samples=[design.layers[0].variants[a],design.layers[1].variants[b]],length=Math.ceil((Math.max(...samples.map((s,i)=>s.duration/pitch+design.layers[i].offsetMs/1000))+.012)*rate);
     const ctx=new OfflineAudioContext(1,length,rate),e=new AudioEngine(()=>.5);e.ctx=ctx;e.buses.set('ui',ctx.destination);
     design.layers.forEach((l,i)=>e.start(id,input,samples[i],design.priority,pitch,10**(l.gainDb/20),l.offsetMs/1000,l.eq,1,0));return ctx.startRendering();
    }
    const began=performance.now();for(const [id,base] of [['ui.forge.hammer','ui.hammer'],['ui.forge.success','ui.confirm']])for(let a=0;a<6;a++)for(let b=0;b<6;b++){
     const design=m.designs[base],buffer=await direct(id,design,a,b,1);prepared.push({id,design,a,b,buffer});
    }const preparationMs=performance.now()-began;
    for(const {id,design,a,b,buffer} of prepared)for(const pitch of [.97,1,1.03]){
     const reference=await direct(id,design,a,b,pitch),length=Math.max(reference.length,Math.ceil(buffer.length/pitch))+128,ctx=new OfflineAudioContext(1,length,rate),e=new AudioEngine(()=>.5);
     e.ctx=ctx;e.buses.set('ui',ctx.destination);e.start(id,buffer,{pack:'native',start:0,duration:buffer.duration,bus:'ui',enveloped:true},design.priority,pitch,1,0,'flat',1,0);
     const actual=(await ctx.startRendering()).getChannelData(0),expected=reference.getChannelData(0);let se=0,ae=0,dot=0,maxError=0,sp=0,ap=0;
     for(let i=0;i<length;i++){const x=expected[i]??0,y=actual[i]??0;se+=x*x;ae+=y*y;dot+=x*y;maxError=Math.max(maxError,Math.abs(y-x));sp=Math.max(sp,Math.abs(x));ap=Math.max(ap,Math.abs(y));}
     const onset=(s,p)=>s.findIndex(v=>Math.abs(v)>=p*.01)/rate*1000;
     rows.push({id,a,b,pitch,maxAbsoluteError:maxError,rmsDeltaDb:10*Math.log10(ae/se),correlation:dot/Math.sqrt(se*ae),peakDeltaDb:20*Math.log10(ap/sp),onsetDeltaMs:onset(actual,ap)-onset(expected,sp),durationMs:buffer.duration/pitch*1000,nominalPass:pitch===1?maxError<=1e-7:null});
    }
    return {sampleRate:rate,inputBytes:bytes.byteLength,preparationMs,retainedBufferBytes:prepared.reduce((n,r)=>n+r.buffer.length*r.buffer.numberOfChannels*4,0),variants:prepared.length,rows};
   });results.push({browser:name,version:browser.version(),...result});
  }finally{await browser.close();}
 }
 assertUnchanged(root,signature);const bytes=gzipSync(JSON.stringify(results));writeFileSync(raw,bytes);
 const summary=results.map(({rows,...r})=>({...r,nominalCases:rows.filter(x=>x.pitch===1).length,nominalFailures:rows.filter(x=>x.pitch===1&&!x.nominalPass).length,maximumNominalError:Math.max(...rows.filter(x=>x.pitch===1).map(x=>x.maxAbsoluteError)),maximumDurationMs:Math.max(...rows.map(x=>x.durationMs)),pitchBoundaries:{maxRmsDeltaDb:Math.max(...rows.map(x=>Math.abs(x.rmsDeltaDb))),minCorrelation:Math.min(...rows.map(x=>x.correlation)),maxOnsetDeltaMs:Math.max(...rows.map(x=>Math.abs(x.onsetDeltaMs)))}}));
 const pass=summary.every(r=>r.nominalFailures===0&&r.variants===72&&r.maximumDurationMs<=300);
 writeFileSync(output,JSON.stringify({at:new Date().toISOString(),harness:signed(relative(root,import.meta.filename)),inputs:[signed('apps/web/public/audio/manifest.json'),signed('apps/web/public/audio/b2-ui.webm')],signature,raw:signed(relative(root,raw)),summary,pass,runtimeChanged:false,physicalOnsetVerified:false,humanListeningVerified:false,overallAudioGatePass:false,limits:'Native graph sample fidelity only. Shared composite pitch/gain replaces independently varied layers. This does not measure real UI admission, mix or listening.'},null,2)+'\n');
 console.log(JSON.stringify({output:relative(root,output),pass,summary}));if(!pass)process.exitCode=1;
}catch(error){if(!existsSync(output))writeFileSync(output,JSON.stringify({at:new Date().toISOString(),failure:error.message,harness:signed(relative(root,import.meta.filename)),runtimeChanged:false},null,2)+'\n');throw error;}
