import type {AudioBridge,CueOptions} from '../game/cardrpg/contracts/audio-cues';
import {BUS_NAMES,resolveCue,voiceProfiles,type AudioManifest,type Bus,type Sample} from './cues';
const KEY='tbh-audio-v3';
const defaults:Record<Bus,number>={master:.7,music:.55,ambience:.3,sfx:.8,voice:.7,ui:.6};
interface Playing { id:string; source:AudioBufferSourceNode; gain:GainNode; bus:Bus; priority:number; }
export class AudioEngine implements AudioBridge {
 private ctx?:AudioContext; private buses=new Map<Bus,GainNode>(); private duck?:GainNode;
 private buffers=new Map<string,Promise<AudioBuffer>>(); private manifest?:Promise<AudioManifest>;
 private active=new Set<Playing>(); private last=new Map<string,number>(); private voicePriority=0;
 private voiceToken=0; private musicToken=0; private musicId=''; private paused=false; private rate=1;
 private preferences={...defaults}; muted=false;
 readonly hits:Array<{id:string;result:string;at:number}>=[];
 constructor(){try{const p=JSON.parse(localStorage.getItem(KEY)??'null');for(const b of BUS_NAMES)if(Number.isFinite(p?.[b]))this.preferences[b]=Math.max(0,Math.min(1,p[b]));this.muted=p?.muted===true;}catch{/* storage optional */}}
 get ready(){return this.ctx?.state==='running';}
 private remember(){try{localStorage.setItem(KEY,JSON.stringify({...this.preferences,muted:this.muted}));}catch{/* storage optional */}if(typeof window!=='undefined')window.dispatchEvent(new Event('audio:changed'));}
 get settings(){return {...this.preferences};}
 async unlock(){
  this.ctx??=new AudioContext();
  if(!this.buses.size){
   const limiter=this.ctx.createDynamicsCompressor();limiter.threshold.value=-3;limiter.ratio.value=16;limiter.attack.value=.003;limiter.release.value=.15;limiter.connect(this.ctx.destination);
   for(const name of BUS_NAMES){const gain=this.ctx.createGain();gain.gain.value=name==='master'&&this.muted?0:this.preferences[name];this.buses.set(name,gain);}
   this.buses.get('master')!.connect(limiter);this.duck=this.ctx.createGain();this.duck.connect(this.buses.get('master')!);
   for(const name of BUS_NAMES.slice(1))this.buses.get(name)!.connect(name==='music'?this.duck:this.buses.get('master')!);
  }
  await this.ctx.resume();this.paused=false;this.remember();
 }
 private loadManifest(){return this.manifest??=fetch('/audio/manifest.json').then(r=>{if(!r.ok)throw new Error('Audio manifest unavailable');return r.json() as Promise<AudioManifest>;}).catch(e=>{this.manifest=undefined;throw e;});}
 private buffer(pack:string,m:AudioManifest):Promise<AudioBuffer>{
  if(!this.buffers.has(pack))this.buffers.set(pack,(async()=>{
   for(const format of ['webm','mp3'] as const){try{const response=await fetch(m.packs[pack]![format]);if(!response.ok)continue;return await this.ctx!.decodeAudioData(await response.arrayBuffer());}catch{/* Safari may need MP3. */}}
   throw new Error(`Audio pack ${pack} unavailable`);
  })().catch(e=>{this.buffers.delete(pack);throw e;}));return this.buffers.get(pack)!;
 }
 async preload(screen:'home'|'battle'|'landing') { if(!this.ctx)return;try{const m=await this.loadManifest();const ids=screen==='battle'?['rpg','impact','voice','battle']:['interface',screen];await Promise.all(ids.filter(p=>m.packs[p]).map(p=>this.buffer(p,m)));}catch{/* playback can retry */} }
 private record(id:string,result:string){this.hits.push({id,result,at:Date.now()});if(this.hits.length>3000)this.hits.shift();}
 setBus(name:string,value:number){if(!BUS_NAMES.includes(name as Bus)||!Number.isFinite(value))return;const bus=name as Bus;this.preferences[bus]=Math.max(0,Math.min(1,value));this.buses.get(bus)?.gain.setTargetAtTime(bus==='master'&&this.muted?0:this.preferences[bus],this.ctx!.currentTime,.025);this.remember();}
 mute(value:boolean){this.muted=value;this.buses.get('master')?.gain.setTargetAtTime(value?0:this.preferences.master,this.ctx!.currentTime,.025);this.remember();}
 pause(value:boolean){this.paused=value;if(value)void this.ctx?.suspend();else void this.ctx?.resume().catch(()=>{});}
 speed(value:number){this.rate=Math.max(1,Math.min(3,value));for(const p of this.active)if(p.bus==='sfx')p.source.playbackRate.setValueAtTime(this.rate,this.ctx!.currentTime);}
 private duckMusic(){if(!this.ctx||!this.duck)return;const p=this.duck.gain,now=this.ctx.currentTime;p.cancelScheduledValues(now);p.setValueAtTime(p.value,now);p.linearRampToValueAtTime(10**(-8/20),now+.12);}
 private releaseDuck(){if(!this.ctx||!this.duck||[...this.active].some(p=>p.bus==='voice'||p.id.startsWith('ult.')))return;const p=this.duck.gain,now=this.ctx.currentTime;p.cancelScheduledValues(now);p.setValueAtTime(p.value,now);p.linearRampToValueAtTime(1,now+.4);}
 play(id:string,opts:CueOptions={}){void this.perform(id,opts);}
 private async perform(id:string,opts:CueOptions){
  if(!this.ctx||this.paused){this.record(id,'locked');return;}
  const token=id.startsWith('voice.')?++this.voiceToken:0;
  try{
   const m=await this.loadManifest(),choices=resolveCue(id,m,opts.element);if(!choices?.length){this.record(id,'unmapped');return;}
   const sample=choices[Math.floor(Math.random()*choices.length)]!;const buffer=await this.buffer(sample.pack,m);
   if(this.paused)return;
   const priority=opts.priority??(id.endsWith('.ult')?4:id.endsWith('.skill')?3:id.endsWith('.death')?2:1);
   if(sample.bus==='voice'){
    if(token!==this.voiceToken||this.voicePriority>priority){this.record(id,'priority');return;}
    if(priority<3&&Date.now()-(this.last.get('voice-cadence')??0)<7000){this.record(id,'cadence');return;}
    this.stopBus('voice');this.voicePriority=priority;this.last.set('voice-cadence',Date.now());
   }
   const key=`${sample.pack}:${sample.start}`;
   if(Date.now()-(this.last.get(key)??0)<50){this.record(id,'cooldown');return;}
   this.last.set(key,Date.now());
   if(sample.bus==='sfx'&&[...this.active].filter(p=>p.bus==='sfx').length>=10){this.record(id,'limit');return;}
   const jitter=sample.bus==='sfx'||sample.bus==='ui';
   if(sample.bus==='voice'){
    const profile=voiceProfiles[id.split('.')[1]!]??voiceProfiles.mochi!;
    const syllables=id.endsWith('.ult')?5:id.endsWith('.skill')?4:2;
    for(let n=0;n<syllables;n++)this.start(id,buffer,{...sample,start:sample.start+(n%3)*.035,duration:Math.min(.14,sample.duration/3)},priority,(opts.pitch??1)*profile.pitch*(1+(n%3)*.07),opts.volume??1,n*profile.speed,profile.brightness);
   }else this.start(id,buffer,sample,priority,(opts.pitch??1)*(jitter?1+(Math.random()-.5)*.08:1)*(sample.bus==='sfx'?this.rate:1),(opts.volume??1)*(jitter?10**(((Math.random()-.5)*3)/20):1));
   this.record(id,'played');
  }catch{this.record(id,'fallback');this.fallback();}
 }
 private start(id:string,buffer:AudioBuffer,s:Sample,priority:number,rate:number,volume:number,delay=0,brightness?:number){
  const ctx=this.ctx!,source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;source.playbackRate.value=rate;gain.gain.value=volume;
  const now=ctx.currentTime+delay,duration=s.duration/rate;source.connect(gain);
  if(brightness){const filter=ctx.createBiquadFilter();filter.type='bandpass';filter.frequency.value=brightness;filter.Q.value=.7;gain.connect(filter).connect(this.buses.get(s.bus)!);}else gain.connect(this.buses.get(s.bus)!);
  const p={id,source,gain,bus:s.bus,priority};this.active.add(p);
  if(s.loop){source.loop=true;source.loopStart=s.start;source.loopEnd=s.start+s.duration;source.start(now,s.start);}else{gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.006);gain.gain.setValueAtTime(volume,Math.max(now+.006,now+duration-.015));gain.gain.linearRampToValueAtTime(0,now+duration);source.start(now,s.start,s.duration);}
  if(s.bus==='voice'||id.startsWith('ult.'))this.duckMusic();
  source.onended=()=>{source.disconnect();gain.disconnect();this.active.delete(p);if(![...this.active].some(p=>p.bus==='voice'))this.voicePriority=0;this.releaseDuck();};
 }
 private fallback(){if(!this.ctx||!this.ready)return;const ctx=this.ctx,osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=220;gain.gain.setValueAtTime(.025,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.07);osc.connect(gain).connect(this.buses.get('sfx')!);osc.start();osc.stop(ctx.currentTime+.08);osc.onended=()=>{osc.disconnect();gain.disconnect();};}
 private stopBus(bus:Bus){for(const p of this.active)if(p.bus===bus){p.source.stop();this.active.delete(p);}}
 stop(id?:string){for(const p of this.active)if(!id||p.id===id){p.source.stop();this.active.delete(p);}if(!id||id===this.musicId)this.musicId='';this.releaseDuck();}
 music(id:string){const cue=id.startsWith('music.')?id:`music.${id}`;if(cue===this.musicId)return;this.musicId=cue;const token=++this.musicToken;void(async()=>{try{const m=await this.loadManifest();const s=resolveCue(cue,m)?.[0];if(!s||!this.ctx)return;const b=await this.buffer(s.pack,m);if(token!==this.musicToken)return;for(const p of this.active)if(p.bus==='music'){p.gain.gain.linearRampToValueAtTime(0,this.ctx.currentTime+.6);p.source.stop(this.ctx.currentTime+.65);}this.start(cue,b,s,0,1,1);this.record(cue,'played');}catch{this.musicId='';this.record(cue,'unavailable');}})();}
}
export const audioEngine=new AudioEngine();
export function installAudio(){if(typeof window==='undefined')return;window.__thAudio=audioEngine;
 const unlock=()=>{void audioEngine.unlock().then(()=>audioEngine.preload('home')).catch(()=>{});};window.addEventListener('pointerdown',unlock,{once:true});window.addEventListener('keydown',unlock,{once:true});
 const click=(e:Event)=>{if((e.target as Element)?.closest?.('button,a,summary'))audioEngine.play('ui.click');};document.addEventListener('click',click);
 document.addEventListener('pointerover',e=>{if((e.target as Element)?.closest?.('button'))audioEngine.play('ui.hover');});
}
