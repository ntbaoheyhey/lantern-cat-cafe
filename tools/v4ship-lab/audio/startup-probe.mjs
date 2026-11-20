/** Fresh-context first gesture: current loading, encoded cache, and offline decode. */
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2]??'1';
if(!/^\d+$/.test(attempt))throw Error('Specify an unused numeric attempt');
const out=resolve(root,`reports/v4-ship/S11/audio-startup-probe-${attempt}.json`);
const modes=(process.env.V4_STARTUP_MODES??'current,encoded,decoded').split(',');
if(modes.some(mode=>!['current','encoded','decoded','prepared-context'].includes(mode)))throw Error('Unknown startup mode');
if(existsSync(out)||existsSync(resolve(root,'STOP-V4SHIP')))throw Error('Preserve evidence / STOP');
const report={at:new Date().toISOString(),harnessSha256:createHash('sha256').update(readFileSync(import.meta.filename)).digest('hex'),method:'Four prespecified fresh-context comparisons. Current first-gesture loading, encoded-byte cache, and offline-decoded UI pack. Preparation runs in a served module script; a console readiness event is awaited before any locator evaluation. Activation state is measured before native input. Native pointer gesture; real AudioEngine and source.start; no autoplay bypass, mix changes or output normalization. Later valid output timestamps may retrospectively estimate the first source; this is not physical onset or gameplay acceptance.',runtime:['apps/web/src/audio/engine.ts','apps/web/public/audio/manifest.json'].map(path=>({path,sha256:createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex')})),rows:[]};
async function setupStartupProbe(mode){
  const {AudioEngine}=await import('/src/audio/engine.ts');
  const e=window.__startupEngine=new AudioEngine(()=>.5),state=window.__startup={mode,starts:[],timestamps:[],before:performance.now(),preparationMs:0};
  const pack='b2-ui-baked',began=performance.now();
  if(mode!=='current'){
   const m=await e.loadManifest(),url=m.packs[pack].webm,response=await fetch(url),bytes=await response.arrayBuffer();
   state.preparedBytes=bytes.byteLength;
   if(mode==='prepared-context'){
    void e.unlock();
    const buffer=await e.ctx.decodeAudioData(bytes);
    e.decoded.set(pack,buffer);e.buffers.set(pack,Promise.resolve(buffer));
    state.preparedSampleRate=buffer.sampleRate;state.contextBeforeGesture=e.ctx.state;
   }else if(mode==='encoded'){
    const fetchOriginal=window.fetch;
    window.fetch=(input,init)=>String(input)===url?Promise.resolve(new Response(bytes.slice(0),{status:200})):fetchOriginal(input,init);
   }else{
    const decoder=new OfflineAudioContext(2,1,48000),buffer=await decoder.decodeAudioData(bytes);
    e.decoded.set(pack,buffer);e.buffers.set(pack,Promise.resolve(buffer));
    state.preparedSampleRate=buffer.sampleRate;
   }
  }
  state.userActivationBeforeGesture={active:navigator.userActivation.isActive,ever:navigator.userActivation.hasBeenActive};state.preparationMs=performance.now()-began;state.outputContextBeforeGesture=!!e.ctx;state.startsBeforeGesture=e.diagnostics.active;
  const original=e.start;
  e.start=function(id,buffer,sample,priority,rate,volume,delay,eq,group){
   const create=this.ctx.createBufferSource;
   this.ctx.createBufferSource=function(){const source=create.call(this),start=source.start;source.start=function(when=0,offset=0,duration){state.starts.push({id,when,offset,duration,rate:this.playbackRate.value,performanceMs:performance.now(),sampleRate:buffer.sampleRate,outputTimestamp:this.context.getOutputTimestamp()});return start.apply(this,arguments);};return source;};
   try{return original.apply(this,arguments);}finally{this.ctx.createBufferSource=create;}
  };
  document.querySelector('button').addEventListener('pointerdown',()=>{state.pointerDown=performance.now();void e.unlock();},{once:true});
  document.querySelector('button').addEventListener('click',()=>{state.request=performance.now();state.contextAtRequest=e.ctx.currentTime;e.play('ui.click');state.timer=setInterval(()=>state.timestamps.push(e.ctx.getOutputTimestamp()),5);},{once:true});
  document.querySelector('button').disabled=false;console.info('startup-ready');
}
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=document-user-activation-required','--disable-features=PreloadMediaEngagementData,MediaEngagementBypassAutoplayPolicies']});
try{for(let pair=0;pair<4;pair++)for(const mode of modes){
 if(existsSync(resolve(root,'STOP-V4SHIP')))throw Error('STOP-V4SHIP');
 const context=await browser.newContext(),page=await context.newPage();
 await page.route('**/__startup-probe',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><button disabled>Play free</button><script type="module">(${setupStartupProbe.toString()})(${JSON.stringify(mode)}).catch(error=>{window.__startupError=error.message});</script>`}));
 const prepared=page.waitForEvent('console',{predicate:message=>message.text()==='startup-ready'});
 await page.goto('http://127.0.0.1:5995/__startup-probe');
 await prepared;

 await page.getByRole('button',{name:'Play free'}).click();
 await page.waitForTimeout(500);
 const row=await page.evaluate(async()=>{
  const s=window.__startup,e=window.__startupEngine;clearInterval(s.timer);delete s.timer;
  const first=s.starts[0],stamp=first?.outputTimestamp.contextTime>0?first.outputTimestamp:s.timestamps.find(t=>t.contextTime>0);
  s.requestToStartCallMs=first?first.performanceMs-s.request:null;
  s.estimatedOnsetMs=first&&stamp?stamp.performanceTime+(first.when-stamp.contextTime)*1000-s.request:null;
  s.timestampSource=first?.outputTimestamp.contextTime>0?'at-start':stamp?'later-valid-retrospective':'unavailable';
  s.hits=e.hits;s.settings=e.settings;s.outputSampleRate=e.ctx.sampleRate;s.outputLatency=e.ctx.outputLatency;s.baseLatency=e.ctx.baseLatency;
  e.stop();await e.ctx.close();return s;
 });
 report.rows.push({pair,...row});await context.close();
 console.log(JSON.stringify({pair,mode,prepareMs:row.preparationMs,requestToStartCallMs:row.requestToStartCallMs,estimatedOnsetMs:row.estimatedOnsetMs,timestampSource:row.timestampSource,starts:row.starts.length}));
 writeFileSync(out,JSON.stringify(report,null,2)+'\n');
}}finally{await browser.close();}
