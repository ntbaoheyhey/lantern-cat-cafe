/** Diagnostic recombinations of clocked buses, through actual WebAudio dynamics. */
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const base='reports/v3-shell/b2',scene=process.argv[2]||'battle';
const mode=process.argv[3]||'room',isBattle=['battle','boss'].includes(scene),seconds=isBattle?45.2:60.2;
const input=`${base}/mix/diagnostic-26-${isBattle?'clocked':'menus'}-${scene}.json`;
const variants=mode==='balanced'?(scene==='battle'?[{name:'rounded',voiceTone:-18,sfxTone:-12},{name:'rounded-body',voiceTone:-18,sfxTone:-12,voiceDb:-2},{name:'rounded-quieter',voiceTone:-18,sfxTone:-12,voiceDb:-4}]:[{name:'rounded',voiceTone:-12,sfxTone:-9},{name:'rounded-presence',voiceTone:-11,sfxTone:-8,voiceDb:.75}]):mode==='tone'?[{name:'baseline'},{name:'warm-voice',voiceTone:-9},{name:'warm-pair',voiceTone:-12,sfxTone:-9},{name:'soft-pair',voiceTone:-18,sfxTone:-12}]:mode==='menu'?
 (scene==='home'?[{name:'baseline'},{name:'dialogue',voiceDb:3},{name:'bright-room',voiceDb:3,musicTone:6},{name:'bright-clear',voiceDb:5,musicTone:9}]:[{name:'baseline'},{name:'warm-score',musicTone:-6},{name:'soft-score',musicTone:-12},{name:'clear-workshop',musicTone:-9,voiceDb:2}]):
 [{name:'baseline'},{name:'small-room',voiceWet:.7,sfxWet:.45},{name:'soft-room',voiceWet:1,sfxWet:.7},{name:'live-room',voiceWet:1.3,sfxWet:.85}];
const capture=JSON.parse(readFileSync(input));
const signed=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')});
const sources=capture.stems.map(s=>{if(signed(s.path).sha256!==s.sha256)throw Error('Changed stem');return {bus:s.bus,bytes:[...readFileSync(s.path)]};});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();mkdirSync('tmp/q5-room',{recursive:true});
const rows=[];
try{
 await page.evaluate(async sources=>{
  const context=new AudioContext();window.stems={};
  for(const s of sources)window.stems[s.bus]=await context.decodeAudioData(new Uint8Array(s.bytes).buffer);
  const durations=Object.values(window.stems).map(s=>s.duration);
  if(Math.min(...durations)<45||Math.max(...durations)-Math.min(...durations)>.1)throw Error('Invalid stem clocks');
  await context.close();
 },sources);
 for(const variant of variants){
  const {name}=variant;
  const bytes=await page.evaluate(async({voiceWet=0,sfxWet=0,voiceTone=0,sfxTone=0,musicTone=0,voiceDb=0,seconds})=>{
   const rate=48000,ctx=new OfflineAudioContext(2,Math.round(seconds*rate),rate);
   const master=ctx.createGain();master.gain.value=.7;
   const trim=ctx.createGain();trim.gain.value=10**(6/20);
   const limiter=ctx.createDynamicsCompressor();Object.assign(limiter.threshold,{value:-4});limiter.knee.value=6;limiter.ratio.value=20;limiter.attack.value=.002;limiter.release.value=.15;
   const headroom=ctx.createGain();headroom.gain.value=10**(-2.25/20);
   master.connect(trim).connect(limiter).connect(headroom).connect(ctx.destination);
   for(const [bus,buffer] of Object.entries(window.stems)){
    const source=ctx.createBufferSource();source.buffer=buffer;
    const gain=ctx.createGain();gain.gain.value=bus==='voice'?10**(voiceDb/20):1;
    source.connect(gain);
    const toneDb=bus==='voice'?voiceTone:bus==='sfx'?sfxTone:bus==='music'?musicTone:0;
    if(toneDb){const tone=ctx.createBiquadFilter();tone.type='highshelf';tone.frequency.value=1500;tone.gain.value=toneDb;gain.connect(tone).connect(master);}
    else gain.connect(master);
    const wet=bus==='voice'?voiceWet:bus==='sfx'?sfxWet:0;
    if(wet){
     const high=ctx.createBiquadFilter();high.type='highpass';high.frequency.value=1800;high.Q.value=.7;
     const room=ctx.createConvolver();room.normalize=false;
     const impulse=ctx.createBuffer(1,Math.round(rate*.085),rate),pcm=impulse.getChannelData(0);
     let seed=20261113;const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32*2-1;};
     for(let i=Math.round(rate*.004);i<pcm.length;i++)pcm[i]=noise()*Math.exp(-i/rate/.018)/Math.sqrt(rate*.018/6);
     room.buffer=impulse;const send=ctx.createGain();send.gain.value=wet;
     source.connect(high).connect(room).connect(send).connect(master);
    }
    source.start();
   }
   const rendered=await ctx.startRendering(),pcm=new Float32Array(rendered.length*2);
   for(let c=0;c<2;c++){const channel=rendered.getChannelData(c);for(let i=0;i<channel.length;i++)pcm[i*2+c]=channel[i];}
   const bytes=new Uint8Array(pcm.buffer),parts=[];
   for(let i=0;i<bytes.length;i+=32768)parts.push(String.fromCharCode(...bytes.subarray(i,i+32768)));
   return btoa(parts.join(''));
  },{...variant,seconds});
  const path=`tmp/q5-room/${mode}-${scene}-${name}-stereo.flac`;
  execFileSync('ffmpeg',['-v','error','-y','-f','f32le','-ar','48000','-ac','2','-i','pipe:0',path],{input:Buffer.from(bytes,'base64')});
  const metrics=JSON.parse(execFileSync('tools/.venv/bin/python',['scripts/audio/analyse.py',path,'--duration',String(seconds)],{encoding:'utf8',maxBuffer:8e6}));
  rows.push({...variant,...signed(path),metrics});
  writeFileSync(`${base}/q5/${mode}-probes-${scene}-stereo.json`,JSON.stringify({at:new Date().toISOString(),diagnostic:true,source:signed(input),method:'Clocked real stereo buses recombined through the same WebAudio master compressor. Room/tone/presence diagnostic; no source cue or timeline changes. Approximate recorder alignment; fresh browser evidence required. Earlier mono render underreported EBU loudness by3dB.',rows},null,2)+'\n');
  console.log(JSON.stringify({name,...Object.fromEntries(['tickTransientsPerSecond','voiceContoursPerMinute','integratedLufs','onsetsPerSecond','layersPerOnset'].map(k=>[k,metrics[k]]))}));
 }
}finally{await browser.close();}
