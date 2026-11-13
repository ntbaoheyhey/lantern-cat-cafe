import type {AudioBridge,CueOptions} from '../game/cardrpg/contracts/audio-cues';
import {BUS_NAMES,resolveCue,resolveDesign,voiceProfiles,type AudioManifest,type Bus,type Sample,type LayerEq,type CueDesign} from './cues';
import {VariantPools,SFX_LIMIT,between,dbGain} from './variants';

const KEY='tbh-audio-v3';
const defaults:Record<Bus,number>={master:.7,music:.55,ambience:.3,sfx:.8,voice:.7,ui:.6};
interface Playing {
 id:string; source:AudioBufferSourceNode; gain:GainNode; filter?:BiquadFilterNode;
 bus:Bus; priority:number; group:number; baseRate:number; ended:boolean;
}
export interface LayerPlayed {role:string;variantId:string;offsetMs:number;pitch:number;gainDb:number;}
export interface AudioHit {id:string;result:string;at:number;layers?:LayerPlayed[];sfx?:number;voice?:number;}
export class AudioEngine implements AudioBridge {
 private ctx?:AudioContext;
 private buses=new Map<Bus,GainNode>(); private duck?:GainNode;
 private buffers=new Map<string,Promise<AudioBuffer>>(); private manifest?:Promise<AudioManifest>;
 private active=new Set<Playing>(); private last=new Map<string,number>();
 private pools:VariantPools; private group=0; private epoch=0; private stopped=new Map<string,number>();
 private voiceRequest=0; private pendingVoicePriority=0; private voicePriority=0;
 private musicToken=0; private musicId=''; private paused=false; private rate=1;
 private preferences={...defaults}; muted=false;
 readonly hits:AudioHit[]=[];
 constructor(private random:()=>number=Math.random){
  this.pools=new VariantPools(random);
  try{const p=JSON.parse(localStorage.getItem(KEY)??'null');for(const b of BUS_NAMES)if(Number.isFinite(p?.[b]))this.preferences[b]=Math.max(0,Math.min(1,p[b]));this.muted=p?.muted===true;}catch{/* storage optional */}
 }
 get ready(){return this.ctx?.state==='running';}
 get settings(){return {...this.preferences};}
 get diagnostics(){return {active:this.active.size,sfx:this.count('sfx'),voice:this.count('voice'),packs:[...this.buffers.keys()]};}
 private count(bus:Bus){let count=0;for(const p of this.active)if(p.bus===bus)count++;return count;}
 private remember(){try{localStorage.setItem(KEY,JSON.stringify({...this.preferences,muted:this.muted}));}catch{/* storage optional */}if(typeof window!=='undefined')window.dispatchEvent(new Event('audio:changed'));}
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
   const urls=m.packs[pack];if(!urls)throw new Error(`Unknown audio pack: ${pack}`);
   for(const format of ['webm','mp3'] as const){try{const response=await fetch(urls[format]);if(!response.ok)continue;return await this.ctx!.decodeAudioData(await response.arrayBuffer());}catch{/* Safari may need MP3. */}}
   throw new Error(`Audio pack ${pack} unavailable`);
  })().catch(e=>{this.buffers.delete(pack);throw e;}));return this.buffers.get(pack)!;
 }
 async preload(screen:'home'|'battle'|'landing'){
  if(!this.ctx)return;
  try{const m=await this.loadManifest();const ids=screen==='battle'?['b2-hits','b2-motion','b2-magic','b2-ui','voice','battle']:['b2-ui',screen];await Promise.all(ids.filter(p=>m.packs[p]).map(p=>this.buffer(p,m)));}catch{/* playback can retry */}
 }
 private record(id:string,result:string,layers?:LayerPlayed[]){
  this.hits.push({id,result,at:Date.now(),...(layers?{layers,sfx:this.count('sfx'),voice:this.count('voice')}:{})});
  if(this.hits.length>12000)this.hits.splice(0,1000);
 }
 setBus(name:string,value:number){if(!BUS_NAMES.includes(name as Bus)||!Number.isFinite(value))return;const bus=name as Bus;this.preferences[bus]=Math.max(0,Math.min(1,value));this.buses.get(bus)?.gain.setTargetAtTime(bus==='master'&&this.muted?0:this.preferences[bus],this.ctx!.currentTime,.025);this.remember();}
 mute(value:boolean){this.muted=value;this.buses.get('master')?.gain.setTargetAtTime(value?0:this.preferences.master,this.ctx!.currentTime,.025);this.remember();}
 pause(value:boolean){this.paused=value;if(value)void this.ctx?.suspend();else void this.ctx?.resume().catch(()=>{});}
 speed(value:number){if(!Number.isFinite(value))return;this.rate=Math.max(1,Math.min(3,value));for(const p of this.active)if(p.bus==='sfx')p.source.playbackRate.setValueAtTime(p.baseRate*this.rate,this.ctx!.currentTime);}
 private duckMusic(){if(!this.ctx||!this.duck)return;const p=this.duck.gain,now=this.ctx.currentTime;p.cancelScheduledValues(now);p.setValueAtTime(p.value,now);p.linearRampToValueAtTime(dbGain(-8),now+.12);}
 private releaseDuck(){if(!this.ctx||!this.duck||[...this.active].some(p=>p.bus==='voice'||p.id.startsWith('ult.')))return;const p=this.duck.gain,now=this.ctx.currentTime;p.cancelScheduledValues(now);p.setValueAtTime(p.value,now);p.linearRampToValueAtTime(1,now+.4);}
 play(id:string,opts:CueOptions={}){void this.perform(id,opts);}
 private async perform(id:string,opts:CueOptions){
  if(!this.ctx||this.paused){this.record(id,'locked');return;}
  if(this.muted){this.record(id,'muted');return;}
  const epoch=this.epoch,stopped=this.stopped.get(id)??0;
  let voiceToken=0;
  try{
   const m=await this.loadManifest(),design=resolveDesign(id,m,opts.element),choices=resolveCue(id,m,opts.element);
   if(!choices?.length&&!design){this.record(id,'unmapped');return;}
   const bus=design?.bus??choices![0]!.bus;
   const priority=opts.priority??(bus==='voice'?/\.ult(?:\.|$)/.test(id)?100:id.includes('.skill')?90:id.endsWith('.death')?80:id.endsWith('.hit')?50:40:design?.priority??20);
   if(bus==='voice'){
    if(Math.max(this.pendingVoicePriority,this.voicePriority)>priority){this.record(id,'priority');return;}
    this.pendingVoicePriority=priority;voiceToken=++this.voiceRequest;
   }
   // All asynchronous loads precede pool selection and atomic source admission.
   const candidates=design?(design.baked?.map(v=>v.sample)??design.layers.flatMap(l=>l.variants)):choices!;
   const packs=[...new Set(candidates.map(s=>s.pack))];
   const loaded=new Map(await Promise.all(packs.map(async p=>[p,await this.buffer(p,m)] as const)));
   if(this.paused||this.muted||epoch!==this.epoch||stopped!==(this.stopped.get(id)??0))return;
   if(bus==='voice'&&voiceToken!==this.voiceRequest){this.record(id,'superseded');return;}
   const now=this.ctx.currentTime*1000;
   if(now-(this.last.get(id)??-Infinity)<(design?.cooldownMs??30)){this.record(id,'cooldown');return;}
   if(bus==='voice'&&priority<90&&now-(this.last.get('voice-cadence')??-Infinity)<7000){this.record(id,'cadence');return;}
   const count=design?.baked?1:design?.layers.length??1;
   if(!this.admit(bus,count,priority)){this.record(id,'limit');return;}
   if(bus==='voice'){this.stopBus('voice');this.voicePriority=priority;this.last.set('voice-cadence',now);}
   if(bus==='ambience'){if([...this.active].some(p=>p.id===id))return;this.stopBus('ambience');}
   this.last.set(id,now);const group=++this.group,played:LayerPlayed[]=[];
   const userPitch=Number.isFinite(opts.pitch)?Math.max(.25,Math.min(4,opts.pitch!)):1;
   const volume=Number.isFinite(opts.volume)?Math.max(0,Math.min(2,opts.volume!)):1;
   if(design?.baked){
    const chosen=this.pools.next(`${id}/baked`,design.baked,v=>v.sample.variantId??`${v.sample.pack}:${v.sample.start}`),pitch=between(design.pitchRange,this.random),gainDb=between(design.gainRange,this.random);
    this.start(id,loaded.get(chosen.sample.pack)!,chosen.sample,priority,userPitch*pitch,volume*dbGain(gainDb),0,'flat',group);
    played.push(...chosen.layers.map(l=>({...l,pitch:userPitch*pitch,gainDb})));
   }else if(design){
    for(const layer of design.layers){
     const sample=this.pools.next(`${id}/${layer.role}`,layer.variants,s=>s.variantId??`${s.pack}:${s.start}`),pitch=userPitch*between(design.pitchRange,this.random),gainDb=layer.gainDb+between(design.gainRange,this.random);
     this.start(id,loaded.get(sample.pack)!,sample,priority,pitch,volume*dbGain(gainDb),layer.offsetMs/1000,layer.eq,group);
     played.push({role:layer.role,variantId:sample.variantId??`${sample.pack}:${sample.start}`,offsetMs:layer.offsetMs,pitch,gainDb});
    }
   }else{
    const sample=this.pools.next(id,choices!,s=>s.variantId??`${s.pack}:${s.start}`),profile=bus==='voice'?(voiceProfiles[id.split('.')[1]!]??voiceProfiles.mochi!):undefined;
    const pitch=userPitch*(profile?.pitch??1);
    this.start(id,loaded.get(sample.pack)!,sample,priority,pitch,volume,0,'flat',group);
    played.push({role:bus,variantId:sample.variantId??`${sample.pack}:${sample.start}`,offsetMs:0,pitch,gainDb:0});
   }
   if(design?.ducking)this.duckMusic();
   this.record(id,'played',played);
  }catch(e){this.record(id,'unavailable');if(import.meta.env.DEV)console.warn('Audio unavailable',id,e instanceof Error?e.message:String(e));}
  finally{if(voiceToken===this.voiceRequest)this.pendingVoicePriority=0;}
 }
 private admit(bus:Bus,count:number,priority:number){
  if(bus==='voice')return count===1;
  const limit=bus==='sfx'?SFX_LIMIT:bus==='ui'?8:Infinity;
  if(count>limit)return false;
  // Evict whole quiet groups, never partially drop the body/tail of a new hit.
  while(this.count(bus)+count>limit){
   const victim=[...this.active].filter(p=>p.bus===bus&&p.priority<=priority).sort((a,b)=>a.priority-b.priority||a.group-b.group)[0];
   if(!victim)return false;
   for(const p of this.active)if(p.group===victim.group)this.end(p,true);
  }
  return true;
 }
 private start(id:string,buffer:AudioBuffer,s:Sample,priority:number,baseRate:number,volume:number,delay:number,eq:LayerEq,group:number){
  const ctx=this.ctx!,source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;
  const rate=baseRate*(s.bus==='sfx'?this.rate:1);source.playbackRate.value=rate;gain.gain.value=volume;
  const now=ctx.currentTime+delay,duration=s.duration/rate;source.connect(gain);
  let filter:BiquadFilterNode|undefined;
  if(eq!=='flat'){
   filter=ctx.createBiquadFilter();filter.type=eq==='low-shelf-180'?'lowshelf':'highpass';
   filter.frequency.value=eq==='low-shelf-180'?180:eq==='high-pass-1800'?1800:80;filter.Q.value=.7;filter.gain.value=eq==='low-shelf-180'?3:0;
   gain.connect(filter).connect(this.buses.get(s.bus)!);
  }else gain.connect(this.buses.get(s.bus)!);
  const p:Playing={id,source,gain,filter,bus:s.bus,priority,group,baseRate,ended:false};this.active.add(p);
  source.onended=()=>this.end(p,false);
  if(s.loop){source.loop=true;source.loopStart=s.start;source.loopEnd=s.start+s.duration;source.start(now,s.start);}
  else{
   const attack=Math.min(.003,duration*.15),release=Math.min(.015,duration*.3);
   gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+attack);
   gain.gain.setValueAtTime(volume,now+duration-release);gain.gain.linearRampToValueAtTime(0,now+duration);
   source.start(now,s.start,s.duration);
  }
  if(s.bus==='voice'||id.startsWith('ult.'))this.duckMusic();
 }
 private end(p:Playing,stop:boolean){
  if(p.ended)return;p.ended=true;if(stop)p.source.stop();p.source.disconnect();p.gain.disconnect();p.filter?.disconnect();this.active.delete(p);
  if(!this.count('voice'))this.voicePriority=0;this.releaseDuck();
 }
 private stopBus(bus:Bus){for(const p of this.active)if(p.bus===bus)this.end(p,true);}
 stop(id?:string){
  if(id)this.stopped.set(id,(this.stopped.get(id)??0)+1);else{this.epoch++;this.voiceRequest++;this.pendingVoicePriority=0;this.musicToken++;}
  for(const p of this.active)if(!id||p.id===id)this.end(p,true);
  if(!id||id===this.musicId){this.musicId='';this.musicToken++;}this.releaseDuck();
 }
 music(id:string){
  const cue=id.startsWith('music.')?id:`music.${id}`;if(cue===this.musicId)return;this.musicId=cue;
  const token=++this.musicToken;
  void(async()=>{try{
   const m=await this.loadManifest(),s=resolveCue(cue,m)?.[0];if(!s||!this.ctx){this.musicId='';return;}
   const b=await this.buffer(s.pack,m);if(token!==this.musicToken)return;
   for(const p of this.active)if(p.bus==='music'){p.gain.gain.cancelScheduledValues(this.ctx.currentTime);p.gain.gain.setValueAtTime(p.gain.gain.value,this.ctx.currentTime);p.gain.gain.linearRampToValueAtTime(0,this.ctx.currentTime+.8);p.source.stop(this.ctx.currentTime+.82);}
   this.start(cue,b,s,0,1,1,0,'flat',++this.group);this.record(cue,'played');
  }catch{if(token===this.musicToken)this.musicId='';this.record(cue,'unavailable');}})();
 }
}
export const audioEngine=new AudioEngine();
export function installAudio(){
 if(typeof window==='undefined')return;window.__thAudio=audioEngine;
 const unlock=()=>{void audioEngine.unlock().then(()=>audioEngine.preload('home')).catch(()=>{});};window.addEventListener('pointerdown',unlock,{once:true});window.addEventListener('keydown',unlock,{once:true});
 document.addEventListener('click',e=>{if((e.target as Element)?.closest?.('button,a,summary'))audioEngine.play('ui.click');});
 document.addEventListener('pointerover',e=>{const button=(e.target as Element)?.closest?.('button');if(button&&!button.contains((e as PointerEvent).relatedTarget as Node|null))audioEngine.play('ui.hover');});
}
