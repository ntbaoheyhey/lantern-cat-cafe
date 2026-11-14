import type {AudioBridge,CueOptions} from '../game/cardrpg/contracts/audio-cues';
import {BUS_NAMES,resolveCue,resolveDesign,voiceProfiles,type AudioManifest,type Bus,type Sample,type LayerEq,type CueDesign} from './cues';
import {calloutForCast,voiceCallout} from './callouts';
import {VariantPools,SFX_LIMIT,between,dbGain} from './variants';
import {installUiFeedback} from './feedback';

const KEY='tbh-audio-v3';
const defaults:Record<Bus,number>={master:.7,music:.55,ambience:.3,sfx:.8,voice:.7,ui:.6};
interface Playing {
 id:string; source:AudioBufferSourceNode; gain:GainNode; filter?:BiquadFilterNode;
 bus:Bus; priority:number; group:number; baseRate:number; ended:boolean;
}
export interface LayerPlayed {role:string;variantId:string;offsetMs:number;pitch:number;gainDb:number;}
export interface AudioHit {id:string;result:string;at:number;layers?:LayerPlayed[];sfx?:number;voice?:number;duckDb?:number;}
export class AudioEngine implements AudioBridge {
 private ctx?:AudioContext;
 private mixTrim?:GainNode;
 private buses=new Map<Bus,GainNode>(); private duck?:GainNode; private speechSpace?:BiquadFilterNode;
 private tones=new Map<Bus,BiquadFilterNode>();
 private voiceBody?:BiquadFilterNode;
 private buffers=new Map<string,Promise<AudioBuffer>>(); private manifest?:Promise<AudioManifest>;
 private active=new Set<Playing>(); private last=new Map<string,number>();
 private pools:VariantPools; private group=0; private epoch=0; private stopped=new Map<string,number>();
 private voiceRequest=0; private pendingVoicePriority=0; private voicePriority=0;
 private lastVoiceRequested=-Infinity; private calloutRequests=new Map<string,number>();
 private bedTokens={music:0,ambience:0}; private bedIds={music:'',ambience:''}; private paused=false; private rate=1;
 private speechCutDb=0;
 private musicScopes:{key:symbol;id:string}[]=[];private musicScopeBase='';
 private preferences={...defaults}; muted=false;
 readonly hits:AudioHit[]=[];
 constructor(private random:()=>number=Math.random,private readonly assetBase='/audio/'){
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
   const limiter=this.ctx.createDynamicsCompressor();limiter.threshold.value=-4;limiter.knee.value=6;limiter.ratio.value=20;limiter.attack.value=.002;limiter.release.value=.15;
   const headroom=this.ctx.createGain();headroom.gain.value=dbGain(-2.25);limiter.connect(headroom).connect(this.ctx.destination);
   // Calibrate the authored mix without changing the user's saved bus levels.
   const trim=this.ctx.createGain();this.mixTrim=trim;trim.gain.value=dbGain(6);trim.connect(limiter);
   for(const name of BUS_NAMES){const gain=this.ctx.createGain();gain.gain.value=name==='master'&&this.muted?0:this.preferences[name];this.buses.set(name,gain);}
   this.buses.get('master')!.connect(trim);this.duck=this.ctx.createGain();this.duck.connect(this.buses.get('master')!);
   this.speechSpace=this.ctx.createBiquadFilter();this.speechSpace.type='lowshelf';this.speechSpace.frequency.value=1200;this.speechSpace.gain.value=0;
   this.speechSpace.connect(this.duck);
   for(const name of BUS_NAMES.slice(1)){
    const output=name==='music'?this.speechSpace:this.buses.get('master')!;
    if(name==='voice'||name==='sfx'||name==='music'){
     const tone=this.ctx.createBiquadFilter();tone.type='highshelf';tone.frequency.value=1500;tone.gain.value=0;
     this.tones.set(name,tone);
     if(name==='voice'){
      this.voiceBody=this.ctx.createBiquadFilter();this.voiceBody.type='lowshelf';this.voiceBody.frequency.value=500;this.voiceBody.gain.value=0;
      this.buses.get(name)!.connect(this.voiceBody).connect(tone).connect(output);
     }else this.buses.get(name)!.connect(tone).connect(output);
    }else this.buses.get(name)!.connect(output);
   }
   this.setSceneTone();
  }
  await this.ctx.resume();this.paused=false;this.remember();
 }
 private assetUrl(path:string){return path.startsWith('/audio/')?this.assetBase+path.slice('/audio/'.length):path;}
 private loadManifest(){return this.manifest??=fetch(this.assetUrl('/audio/manifest.json')).then(r=>{if(!r.ok)throw new Error('Audio manifest unavailable');return r.json() as Promise<AudioManifest>;}).catch(e=>{this.manifest=undefined;throw e;});}
 private buffer(pack:string,m:AudioManifest):Promise<AudioBuffer>{
  if(!this.buffers.has(pack))this.buffers.set(pack,(async()=>{
   const urls=m.packs[pack];if(!urls)throw new Error(`Unknown audio pack: ${pack}`);
   for(const format of ['webm','mp3'] as const){try{const response=await fetch(this.assetUrl(urls[format]));if(!response.ok)continue;return await this.ctx!.decodeAudioData(await response.arrayBuffer());}catch{/* Safari may need MP3. */}}
   throw new Error(`Audio pack ${pack} unavailable`);
  })().catch(e=>{this.buffers.delete(pack);throw e;}));return this.buffers.get(pack)!;
 }
 async preload(screen:'home'|'battle'|'landing'){
  if(!this.ctx)return;
  try{const m=await this.loadManifest();const musicPack=resolveCue(`music.${screen}`,m)?.[0]?.pack;const ids=screen==='battle'?['b2-hits','b2-motion','b2-magic','b2-ui',...(musicPack?[musicPack]:[])]:['b2-ui',...(musicPack?[musicPack]:[])];await Promise.all(ids.filter(p=>m.packs[p]).map(p=>this.buffer(p,m)));}catch{/* playback can retry */}
 }
 private record(id:string,result:string,layers?:LayerPlayed[]){
  this.hits.push({id,result,at:Date.now(),...(layers?{layers,sfx:this.count('sfx'),voice:this.count('voice'),duckDb:this.count('voice')||id.startsWith('ult.')?-8:0}:{})});
  if(this.hits.length>12000)this.hits.splice(0,1000);
 }
 setBus(name:string,value:number){if(!BUS_NAMES.includes(name as Bus)||!Number.isFinite(value))return;const bus=name as Bus;this.preferences[bus]=Math.max(0,Math.min(1,value));this.buses.get(bus)?.gain.setTargetAtTime(bus==='master'&&this.muted?0:this.preferences[bus],this.ctx!.currentTime,.025);this.remember();}
 mute(value:boolean){this.muted=value;this.buses.get('master')?.gain.setTargetAtTime(value?0:this.preferences.master,this.ctx!.currentTime,.025);this.remember();}
 pause(value:boolean){this.paused=value;if(value)void this.ctx?.suspend();else void this.ctx?.resume().catch(()=>{});}
 speed(value:number){if(!Number.isFinite(value))return;this.rate=Math.max(1,Math.min(3,value));for(const p of this.active)if(p.bus==='sfx')p.source.playbackRate.setValueAtTime(p.baseRate*this.rate,this.ctx!.currentTime);}
 private makeSpeechSpace(){
  if(!this.ctx||!this.speechSpace)return;
  const speaking=this.count('voice')>0;
  const boss=this.bedIds.music==='music.boss';
  const amount=speaking?(this.bedIds.music==='music.battle'?-9:boss?-8:this.bedIds.music==='music.home'?-9:-6):0;
  const type=boss?'peaking':'lowshelf';
  if(amount===this.speechCutDb&&this.speechSpace.type===type)return;this.speechCutDb=amount;
  this.speechSpace.type=type;this.speechSpace.frequency.value=boss?1700:1200;this.speechSpace.Q.value=.7;
  const p=this.speechSpace.gain,now=this.ctx.currentTime;
  // Open the boss strings around speech without dulling spoken consonants.
  // Other scenes keep their low-shelf opening and the normal music duck.
  p.cancelScheduledValues(now);p.setValueAtTime(p.value,now);p.linearRampToValueAtTime(amount,now+(speaking ? .06 : .4));
 }
 private setSceneTone(){
  if(!this.ctx)return;
  const scene=this.bedIds.music;
  // Keep speech consonants clear against sustained upper strings, with softer
  // effect accents. The brighter battle arrangement has its own output trim.
  const amounts:Partial<Record<Bus,number>>=scene==='music.battle'?{voice:-3,sfx:-12,music:9}:scene==='music.boss'?{sfx:-12,music:6}:scene==='music.forge'?{music:-9}:scene==='music.gacha'?{music:3}:{};
  for(const [bus,tone] of this.tones){const gain=tone.gain,now=this.ctx.currentTime;gain.cancelScheduledValues(now);gain.setValueAtTime(gain.value,now);gain.linearRampToValueAtTime(amounts[bus]??0,now+.15);}
  // A lighter low-mid voice body makes the spoken attacks clearer over the
  // boss strings; compensate presence at the source without shifting pitch.
  if(this.voiceBody){const gain=this.voiceBody.gain,now=this.ctx.currentTime;gain.cancelScheduledValues(now);gain.setValueAtTime(gain.value,now);gain.linearRampToValueAtTime(scene==='music.boss'?-6:0,now+.15);}
  if(this.mixTrim){const gain=this.mixTrim.gain,now=this.ctx.currentTime;gain.cancelScheduledValues(now);gain.setValueAtTime(gain.value,now);gain.linearRampToValueAtTime(dbGain(scene==='music.battle'?2.8:scene==='music.boss'?4.5:6),now+.15);}
 }
 private duckMusic(){if(!this.ctx||!this.duck)return;this.makeSpeechSpace();const p=this.duck.gain,now=this.ctx.currentTime;p.cancelScheduledValues(now);p.setValueAtTime(p.value,now);p.linearRampToValueAtTime(dbGain(-8),now+.12);}
 private releaseDuck(){this.makeSpeechSpace();if(!this.ctx||!this.duck||[...this.active].some(p=>p.bus==='voice'||p.id.startsWith('ult.')))return;const p=this.duck.gain,now=this.ctx.currentTime;p.cancelScheduledValues(now);p.setValueAtTime(p.value,now);p.linearRampToValueAtTime(1,now+.4);}
 play(id:string,opts:CueOptions={}){
  const now=Date.now();
  if(id.startsWith('voice.')){
   this.lastVoiceRequested=now;
   // A can send its explicit request just after the cast fallback. One take
   // owns that sync point, so the second request must not restart the line.
   if(voiceCallout(id)){
    if(now-(this.calloutRequests.get(id)??-Infinity)<300){this.record(id,'duplicate');return;}
    this.calloutRequests.set(id,now);
   }
  }
  void this.perform(id,opts);
  const fallback=calloutForCast(id),epoch=this.epoch;
  if(fallback)this.record(id,'cast');
  if(fallback)queueMicrotask(()=>{
   // Wait one microtask for A's explicit voice call at the same cast point.
   if(epoch===this.epoch&&Date.now()-this.lastVoiceRequested>=300)this.play(fallback);
  });
 }
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
   // Required ultimate charge/release lines override ordinary chatter cadence.
   // They still share a single voice source and retain priority over skills.
   const requiredUltimate=voiceCallout(id)?.kind==='ultimate';
   if(bus==='voice'&&!requiredUltimate&&now-(this.last.get('voice-cadence')??-Infinity)<7000){this.record(id,'cadence');return;}
   const count=design?.baked?1:design?.layers.length??1;
   if(!this.admit(bus,count,priority)){this.record(id,'limit');return;}
   if(bus==='voice'){this.stopBus('voice');this.voicePriority=priority;this.last.set('voice-cadence',now);}
   if(bus==='ambience'){this.ambience(id);return;}
   this.last.set(id,now);const group=++this.group,played:LayerPlayed[]=[];
   const userPitch=Number.isFinite(opts.pitch)?Math.max(.25,Math.min(4,opts.pitch!)):1;
   // Balance repeated movement beneath the strike and the spoken line.
   const cueTrimDb=bus==='voice'?(this.bedIds.music==='music.battle'?3:this.bedIds.music==='music.boss'?3:this.bedIds.music==='music.forge'||this.bedIds.music==='music.home'?5:3):bus==='sfx'?(id.startsWith('move.')?-7:-4):id==='ui.hover'?6:0;
   const volume=(Number.isFinite(opts.volume)?Math.max(0,Math.min(2,opts.volume!)):1)*dbGain(cueTrimDb);
   if(design?.baked){
    const chosen=this.pools.next(`${id}/baked`,design.baked,v=>v.sample.variantId??`${v.sample.pack}:${v.sample.start}`),pitch=between(design.pitchRange,this.random),gainDb=between(design.gainRange,this.random);
    this.start(id,loaded.get(chosen.sample.pack)!,chosen.sample,priority,userPitch*pitch,volume*dbGain(gainDb),0,'flat',group);
    played.push(...chosen.layers.map(l=>({...l,pitch:userPitch*pitch,gainDb:gainDb+cueTrimDb})));
   }else if(design){
    for(const layer of design.layers){
     const sample=this.pools.next(`${id}/${layer.role}`,layer.variants,s=>s.variantId??`${s.pack}:${s.start}`),pitch=userPitch*between(design.pitchRange,this.random),gainDb=layer.gainDb+between(design.gainRange,this.random);
     // Resonant bodies carry strikes; bright attacks remain shorter accents.
     const roleTrimDb=bus==='sfx'?(layer.role==='transient'?-9:layer.role==='sweetener'?-7:layer.role==='body'?3:1):0;
     this.start(id,loaded.get(sample.pack)!,sample,priority,pitch,volume*dbGain(gainDb+roleTrimDb),layer.offsetMs/1000,layer.eq,group);
     played.push({role:layer.role,variantId:sample.variantId??`${sample.pack}:${sample.start}`,offsetMs:layer.offsetMs,pitch,gainDb:gainDb+cueTrimDb+roleTrimDb});
    }
   }else{
    const sample=this.pools.next(id,choices!,s=>s.variantId??`${s.pack}:${s.start}`),profile=bus==='voice'?(voiceProfiles[id.split('.')[1]!]??voiceProfiles.mochi!):undefined;
    // Authored cat sprites already contain pitch, formants and syllable timing.
    const pitch=userPitch*(sample.processedVoice?1:profile?.pitch??1);
    this.start(id,loaded.get(sample.pack)!,sample,priority,pitch,volume,0,'flat',group);
    played.push({role:bus,variantId:sample.variantId??`${sample.pack}:${sample.start}`,offsetMs:0,pitch,gainDb:cueTrimDb});
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
   const movement=id.startsWith('move.');
   const attack=Math.min(movement ? .035 : .003,duration*.3),release=Math.min(movement ? .04 : .015,duration*.3);
   gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+attack);
   gain.gain.setValueAtTime(volume,now+duration-release);gain.gain.linearRampToValueAtTime(0,now+duration);
   source.start(now,s.start,s.duration);
  }
  if(s.bus==='voice'||id.startsWith('ult.'))this.duckMusic();
  return p;
 }
 private end(p:Playing,stop:boolean){
  if(p.ended)return;p.ended=true;if(stop)p.source.stop();p.source.disconnect();p.gain.disconnect();p.filter?.disconnect();this.active.delete(p);
  if(!this.count('voice'))this.voicePriority=0;this.releaseDuck();
 }
 private stopBus(bus:Bus){for(const p of this.active)if(p.bus===bus)this.end(p,true);}
 stop(id?:string){
  if(id)this.stopped.set(id,(this.stopped.get(id)??0)+1);else{this.epoch++;this.voiceRequest++;this.pendingVoicePriority=0;}
  for(const p of this.active)if(!id||p.id===id||(id==='music.boss'&&p.id==='music.boss.dawn'))this.end(p,true);
  for(const bus of ['music','ambience'] as const)if(!id||id===this.bedIds[bus]){this.bedIds[bus]='';this.bedTokens[bus]++;}this.setSceneTone();this.releaseDuck();
 }
 music(id:string){this.musicScopes=[];this.bed('music',id);}
 /** Dialog scores restore the underlying scene; later navigation wins. */
 musicScope(id:string){
  if(!this.musicScopes.length)this.musicScopeBase=this.bedIds.music;
  const key=Symbol(id);this.musicScopes.push({key,id});this.bed('music',id);
  return()=>{
   const index=this.musicScopes.findIndex(s=>s.key===key);if(index<0)return;
   this.musicScopes.splice(index,1);
   const next=this.musicScopes.at(-1)?.id??this.musicScopeBase;
   if(next)this.bed('music',next);else this.stop(this.bedIds.music);
  };
 }
 ambience(id:string){this.bed('ambience',id);}
 private bed(bus:'music'|'ambience',id:string){
  const cue=id.startsWith(`${bus}.`)?id:`${bus}.${id}`;if(cue===this.bedIds[bus])return;this.bedIds[bus]=cue;
  if(bus==='music')this.setSceneTone();
  const token=++this.bedTokens[bus];
  void(async()=>{try{
   const m=await this.loadManifest(),s=resolveCue(cue,m)?.[0];if(!s||!this.ctx){if(token===this.bedTokens[bus]){this.bedIds[bus]='';this.setSceneTone();}return;}
   const dawn=cue==='music.boss'?resolveCue('music.boss.dawn',m)?.[0]:undefined;
   const [b,dawnBuffer]=await Promise.all([this.buffer(s.pack,m),dawn?this.buffer(dawn.pack,m):undefined]);
   if(token!==this.bedTokens[bus])return;
   // Keep the outgoing bed until the incoming audio has decoded. Both sides
   // then crossfade for 800 ms, including when a rapid tab switch supersedes a load.
   const now=this.ctx.currentTime;
   for(const p of this.active)if(p.bus===bus){p.gain.gain.cancelScheduledValues(now);p.gain.gain.setValueAtTime(p.gain.gain.value,now);p.gain.gain.linearRampToValueAtTime(0,now+.8);p.source.stop(now+.82);}
   const level=dbGain(['music.battle','music.boss'].includes(cue)?3:0);
   const incoming=this.start(cue,b,s,0,1,level,0,'flat',++this.group);
   incoming.gain.gain.setValueAtTime(0,now);incoming.gain.gain.linearRampToValueAtTime(level,now+.8);this.record(cue,'played');
   // Decode together so the dawn harmonics follow the boss score's bar clock.
   // They share music volume, ducking, mute and pause, and leave with the scene.
   if(dawn&&dawnBuffer){
    const layer=this.start('music.boss.dawn',dawnBuffer,dawn,0,1,0,0,'flat',++this.group);
    layer.gain.gain.setValueAtTime(0,now);layer.gain.gain.linearRampToValueAtTime(.42,now+30.72);
    this.record('music.boss.dawn','played');
   }
  }catch{if(token===this.bedTokens[bus]){this.bedIds[bus]='';this.setSceneTone();}this.record(cue,'unavailable');}})();
 }
}
export const audioEngine=new AudioEngine();
export function installAudio(){
 if(typeof window==='undefined')return;window.__thAudio=audioEngine;
 const unlock=()=>{void audioEngine.unlock().then(()=>audioEngine.preload('home')).catch(()=>{});};window.addEventListener('pointerdown',unlock,{once:true});window.addEventListener('keydown',unlock,{once:true});
 installUiFeedback(audioEngine);
}
