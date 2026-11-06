/** Original synthesized sound only. The AudioContext is created exclusively by an explicit click. */
import {EFFECT_REGISTRY} from './effects';
import type {EffectFrame} from './effects';
export type AudioFamily='swish'|'thud'|'chime'|'flame'|'glass'|'whoosh';
export const AUDIO_SETTINGS={master:.14,ambient:.018,cue:.14,peakCeiling:.72,notes:[196,246.94,293.66,369.99,293.66,246.94,220,261.63],sampleRate:44100};
export function cueFamily(shape:string):AudioFamily{return ['slash','arrow'].includes(shape)?'swish':['bash','charge','sweep','cross'].includes(shape)?'thud':['mend','shelter','rally','wall'].includes(shape)?'chime':['orb','storm'].includes(shape)?'flame':['flask','patch'].includes(shape)?'glass':'whoosh'}
export function cueSignature(id:string){const i=Math.max(0,Object.keys(EFFECT_REGISTRY).indexOf(id));return {notes:[i%12,(i*5+3)%17,(i*7+5)%19],gap:.06+(i%5)*.012}}
export function synthCue(ctx:BaseAudioContext,destination:AudioNode,family:AudioFamily,beat:number,when:number,variant=0){
 const duration=beat===2?.18:beat===0?.12:.24,volume=beat===2?.32:.12,base={swish:170,thud:84,chime:587,flame:210,glass:1046,whoosh:330}[family]*2**((variant%19)/19);
 const gain=ctx.createGain();gain.connect(destination);gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(volume,when+.009);gain.gain.exponentialRampToValueAtTime(.0001,when+duration);
 const oscillator=ctx.createOscillator();oscillator.type=family==='thud'?'sine':family==='flame'?'triangle':'sine';oscillator.frequency.setValueAtTime(base*(beat===0?.75:1.5),when);oscillator.frequency.exponentialRampToValueAtTime(Math.max(30,base*(family==='thud'?.35:beat===1?2:.7)),when+duration);oscillator.connect(gain);oscillator.start(when);oscillator.stop(when+duration+.02);
 oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()};
 if(['swish','flame','whoosh','glass'].includes(family)){
  const length=Math.floor(ctx.sampleRate*duration),buffer=ctx.createBuffer(1,length,ctx.sampleRate),samples=buffer.getChannelData(0);let seed=7919+variant*31;
  for(let i=0;i<length;i++){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;samples[i]=((seed>>>0)/4294967295*2-1)*.45}
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),noiseGain=ctx.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.setValueAtTime(family==='glass'?4000:1200,when);filter.Q.value=.8;noiseGain.gain.setValueAtTime(volume*.45,when);noiseGain.gain.exponentialRampToValueAtTime(.0001,when+duration);source.connect(filter).connect(noiseGain).connect(destination);source.start(when);source.onended=()=>{source.disconnect();filter.disconnect();noiseGain.disconnect()};
 }
}
export class CafeAudio{
 enabled=false;blocked=false;private ctx:AudioContext|null=null;private master:GainNode|null=null;private key='';private round=0;private actor='';private note=0;private nextNote=0;
 async toggle(){
  if(this.enabled){this.enabled=false;this.master?.gain.setTargetAtTime(0,this.ctx!.currentTime,.04);return}
  try{this.ctx??=new AudioContext({sampleRate:AUDIO_SETTINGS.sampleRate});this.master??=this.ctx.createGain();this.master.disconnect();this.master.connect(this.ctx.destination);await this.ctx.resume();this.enabled=this.ctx.state==='running';this.blocked=!this.enabled;this.master.gain.setTargetAtTime(AUDIO_SETTINGS.master,this.ctx.currentTime,.04);this.nextNote=this.ctx.currentTime;this.ui()}catch{this.blocked=true;this.enabled=false}
 }
 ui(){if(this.enabled&&this.ctx&&this.master)synthCue(this.ctx,this.master,'chime',0,this.ctx.currentTime,4)}
 update(frame:EffectFrame|null,round:number,actor:string|null,quiet:boolean,ambienceScale=1){
  if(!this.enabled||!this.ctx||!this.master||this.ctx.state!=='running')return;const now=this.ctx.currentTime;
  const key=frame?`${frame.plan.id}/${frame.plan.skillId}/${frame.beat.kind}`:'';
  if(key&&key!==this.key){this.key=key;const beat=['anticipation','travel','impact','reaction','residue'].indexOf(frame!.beat.kind),id=frame!.plan.skillId;let variant=[...id].reduce((s,c)=>s+c.charCodeAt(0),0);synthCue(this.ctx,this.master,cueFamily(frame!.plan.shape),beat,now,variant);
   if(beat===0){const signature=cueSignature(id);signature.notes.forEach((note,i)=>synthCue(this.ctx!,this.master!,'chime',0,now+i*signature.gap,note));}
   if(['victory','defeat'].includes(id)&&beat===0)for(let i=0;i<4;i++)synthCue(this.ctx,this.master,id==='victory'?'chime':'thud',0,now+i*.16,variant+i*2);
  }
  if(round!==this.round){this.round=round;synthCue(this.ctx,this.master,'chime',0,now,2)}
  if(actor&&actor!==this.actor){this.actor=actor;synthCue(this.ctx,this.master,'glass',0,now,1)}
  if(!quiet&&now>=this.nextNote){this.nextNote=now+.65;const oscillator=this.ctx.createOscillator(),gain=this.ctx.createGain();oscillator.type='sine';oscillator.frequency.value=AUDIO_SETTINGS.notes[this.note++%AUDIO_SETTINGS.notes.length]! * ambienceScale;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(AUDIO_SETTINGS.ambient,now+.10);gain.gain.exponentialRampToValueAtTime(.0001,now+1.2);oscillator.connect(gain).connect(this.master);oscillator.start(now);oscillator.stop(now+1.25);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()}}
 }
 dispose(){this.enabled=false;void this.ctx?.close();this.ctx=null;this.master=null}
}
