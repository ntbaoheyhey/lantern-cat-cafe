/** P2 balance search over real simultaneous buses; diagnostic only. */
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const base='reports/v3-shell/b2',metricPath=process.argv[2],label=process.argv[3]??'31';
if(!/^[a-z0-9-]+$/.test(label))throw Error('Invalid probe label');
const metric=JSON.parse(readFileSync(metricPath));
if(!metric.diagnostic||!metric.stems?.length)throw Error('Clocked diagnostic stems required');
const sign=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')});
const runtime=JSON.parse(gunzipSync(readFileSync(metric.runtime.path)));
const integration=JSON.parse(readFileSync(`${base}/q2/integration.json`));
const manifest=JSON.parse(readFileSync(`${integration.out}/apps/web/public/audio/manifest.json`));
const callouts=JSON.parse(readFileSync(`${integration.out}/apps/web/src/audio/voice-callouts.json`));
const voices=runtime.hits.filter(h=>h.result==='played'&&h.id.startsWith('voice.'));
const windows=voices.map((hit,i)=>{
 const layer=hit.layers[0],sample=manifest.cues[hit.id]?.find(s=>s.variantId===layer.variantId);
 if(!sample)throw Error('Missing actual voice variant');
 const start=hit.at/1000-runtime.started,duration=sample.duration/(layer.pitch||1);
 const next=voices[i+1]?voices[i+1].at/1000-runtime.started:Infinity;
 return {cueId:hit.id,start,duration:Math.min(duration,next-start),...callouts.find(c=>c.cueId===hit.id)};
}).filter(w=>w.start>=0&&w.start+w.duration<metric.durationSeconds);
const sources=metric.stems.map(s=>{if(sign(s.path).sha256!==s.sha256)throw Error('Changed stem');return {bus:s.bus,bytes:[...readFileSync(s.path)]};});
const variants=label==='40'?[{name:'clear-raised',voiceLowShelf:-6,voiceLowHz:500,voiceGain:3,trimDb:4.5},{name:'clear-forward',voiceLowShelf:-6,voiceLowHz:500,voiceGain:6,trimDb:4.5},{name:'clear-mid',voiceLowShelf:-6,voiceLowHz:500,voiceGain:3,voiceShelf:-3,trimDb:4.5},{name:'clear-lower',voiceLowShelf:-6,voiceLowHz:350,voiceGain:3,trimDb:4.5}]:label==='39'?[{name:'baseline',trimDb:4.5},{name:'body-soft',voiceLowShelf:-3,voiceLowHz:400,trimDb:4.5},{name:'body-clear',voiceLowShelf:-6,voiceLowHz:500,trimDb:4.5},{name:'body-focus',voiceLowShelf:-6,voiceLowHz:800,trimDb:4.5},{name:'presence',voiceShelf:3,trimDb:4.5}]:[{name:'baseline',trimDb:4.5},{name:'voice-minus1',voiceGain:-1,trimDb:4.5},{name:'voice-plus1',voiceGain:1,trimDb:4.5},{name:'voice-warm',voiceShelf:-2,trimDb:4.5},{name:'music-open',notch:-2,trimDb:4.5},{name:'effects-soft',sfxDuck:-2,trimDb:4.5}];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();mkdirSync('tmp/p2-dialogue',{recursive:true});const rows=[];
try{
 await page.evaluate(async sources=>{const ctx=new AudioContext();window.stems={};for(const s of sources)window.stems[s.bus]=await ctx.decodeAudioData(new Uint8Array(s.bytes).buffer);const ds=Object.values(window.stems).map(b=>b.duration);if(Math.max(...ds)-Math.min(...ds)>.1)throw Error('Invalid stem clocks');await ctx.close();},sources);
 for(const variant of variants){
  const bytes=await page.evaluate(async({seconds,windows,notch,sfxDuck,notchType='peaking',frequency=1700,voiceGain=0,voiceShelf=0,voiceLowShelf=0,voiceLowHz=400,trimDb=6})=>{
   const rate=48000,ctx=new OfflineAudioContext(2,Math.round(seconds*rate),rate);
   const master=ctx.createGain();master.gain.value=.7;
   const trim=ctx.createGain();trim.gain.value=10**(trimDb/20);
   const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-4;limiter.knee.value=6;limiter.ratio.value=20;limiter.attack.value=.002;limiter.release.value=.15;
   const headroom=ctx.createGain();headroom.gain.value=10**(-2.25/20);master.connect(trim).connect(limiter).connect(headroom).connect(ctx.destination);
   const automate=(param,active,quiet)=>{
    param.value=quiet;
    const spans=[];
    for(const w of windows){const start=Math.max(0,w.start-.025),end=w.start+w.duration,last=spans.at(-1);if(last&&start<=last.end+.2)last.end=Math.max(last.end,end);else spans.push({start,end});}
    for(const w of spans){param.setValueAtTime(quiet,w.start);param.linearRampToValueAtTime(active,w.start+.04);param.setValueAtTime(active,w.end);param.linearRampToValueAtTime(quiet,w.end+.2);}
   };
   for(const [bus,buffer] of Object.entries(window.stems)){
    const source=ctx.createBufferSource();source.buffer=buffer;let end=source;
    if(bus==='sfx'){const tone=ctx.createBiquadFilter();tone.type='highshelf';tone.frequency.value=1500;tone.gain.value=-12;end.connect(tone);end=tone;if(sfxDuck){const duck=ctx.createGain();automate(duck.gain,10**(sfxDuck/20),1);end.connect(duck);end=duck;}}
    if(bus==='music'&&notch){const space=ctx.createBiquadFilter();space.type=notchType;space.frequency.value=frequency;space.Q.value=.7;automate(space.gain,notch,0);end.connect(space);end=space;}
    if(bus==='voice'&&voiceGain){const presence=ctx.createGain();presence.gain.value=10**(voiceGain/20);end.connect(presence);end=presence;}
    if(bus==='voice'&&voiceShelf){const warmth=ctx.createBiquadFilter();warmth.type='highshelf';warmth.frequency.value=1500;warmth.gain.value=voiceShelf;end.connect(warmth);end=warmth;}
    if(bus==='voice'&&voiceLowShelf){const body=ctx.createBiquadFilter();body.type='lowshelf';body.frequency.value=voiceLowHz;body.gain.value=voiceLowShelf;end.connect(body);end=body;}
    end.connect(master);source.start();
   }
   const out=await ctx.startRendering(),pcm=new Float32Array(out.length*2);
   for(let c=0;c<2;c++){const ch=out.getChannelData(c);for(let i=0;i<ch.length;i++)pcm[i*2+c]=ch[i];}
   const bytes=new Uint8Array(pcm.buffer),parts=[];for(let i=0;i<bytes.length;i+=32768)parts.push(String.fromCharCode(...bytes.subarray(i,i+32768)));return btoa(parts.join(''));
  },{...variant,windows,seconds:metric.durationSeconds});
  const path=`tmp/p2-dialogue/boss-${label}-${variant.name}.flac`;
  execFileSync('ffmpeg',['-v','error','-y','-f','f32le','-ar','48000','-ac','2','-i','pipe:0',path],{input:Buffer.from(bytes,'base64')});
  const metrics=JSON.parse(execFileSync('tools/.venv/bin/python',['scripts/audio/analyse.py',path,'--duration',String(metric.durationSeconds)],{encoding:'utf8',maxBuffer:8e6}));
  rows.push({...variant,...sign(path),metrics});
  writeFileSync(`${base}/polish/P2/dialogue-probes${label}.json`,JSON.stringify({at:new Date().toISOString(),diagnostic:true,source:sign(metricPath),windows,method:'Clocked actual current buses, actual voice windows and production WebAudio master dynamics. Existing music duck is already in music stem. Approximate recorder alignment; fresh runtime capture required.',rows},null,2)+'\n');
  console.log(JSON.stringify({name:variant.name,...Object.fromEntries(['tickTransientsPerSecond','voiceContoursPerMinute','integratedLufs','musicBedFraction'].map(k=>[k,metrics[k]]))}));
 }
}finally{await browser.close();}
