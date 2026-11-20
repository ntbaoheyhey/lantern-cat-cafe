import type {EffectPlan} from '../../squad/turn3d/effects';
import type {SkillSequence,SequencePlan} from './sequence';
import {audioTimeline,cueOwner,voiceTiming,VOICE_TIMING} from './audio-timeline';

export interface VoiceWindow {start:number;end:number;cue:string;durationMs:number}
export const VOICE_TAIL_GUARD_MS=80;

/** Short/off cinematics still leave room for both spoken ultimate phases. */
export function minimumVoicedImpact(plan:EffectPlan,cutinStart:number){
 const owner=cueOwner(plan),id=plan.presentationId??plan.skillId;
 const charge=voiceTiming(owner,id,'charge'),release=voiceTiming(owner,id,'release');
 if(!charge||!release)return 0;
 return Math.max(0,cutinStart-charge.syncPointMs)+charge.durationMs+VOICE_TAIL_GUARD_MS+release.syncPointMs;
}

/** Extend recovery only; resolved events and contact positions remain intact. */
export function reserveVoiceTails(plan:SequencePlan,sequence?:SkillSequence):SequencePlan {
 if(plan.fixedTiming)return plan;
 const voiceWindows=audioTimeline(plan,sequence).filter(key=>key.role==='voice').flatMap(key=>{
  const take=VOICE_TIMING.find(line=>line.cueId===key.cue);
  return take?[{start:key.t,end:key.t+take.durationMs+VOICE_TAIL_GUARD_MS,cue:key.cue,durationMs:take.durationMs}]:[];
 });
 if(!voiceWindows.length)return plan;
 const duration=Math.max(plan.duration,...voiceWindows.map(window=>window.end));
 const beats=plan.beats.map((beat,i)=>i===plan.beats.length-1?{...beat,duration:beat.duration+duration-plan.duration}:beat);
 if(sequence)sequence.duration=duration;
 return {...plan,duration,beats,voiceWindows};
}

/** Keep intervening basic actions moving; only an adjacent spoken ultimate waits. */
export function reserveUltimateLeadIn(plan:SequencePlan,waitMs:number):SequencePlan {
 if(plan.fixedTiming||!plan.ultimate||waitMs<=0)return plan;
 const delay=Math.max(0,waitMs),sequence=plan.sequence?structuredClone(plan.sequence):undefined;
 if(sequence){
  sequence.duration+=delay;sequence.impact+=delay;
  for(const track of [sequence.camera,sequence.time,sequence.dim,sequence.postfx,sequence.audio,sequence.casterAnim,sequence.targetAnim,sequence.damage])for(const key of track)key.t+=delay;
  // Sampling before a track's first key returns that key. Explicit neutral
  // keys keep the field lit and its world clock running before charge begins.
  const hold=Math.max(0,delay-120);
  sequence.time.unshift({t:0,value:1},{t:Math.max(0,delay-1),value:1});
  sequence.dim.unshift({t:0,value:0},{t:hold,value:0});
  sequence.postfx.unshift({t:0,bloom:0,aberration:0,vignette:0},{t:hold,bloom:0,aberration:0,vignette:0});
  if(sequence.cutin){sequence.cutin.start+=delay;sequence.cutin.end+=delay;}
  if(sequence.plate){sequence.plate.start+=delay;sequence.plate.end+=delay;}
 }
 const beats=plan.beats.map((beat,i)=>i===0?{...beat,duration:beat.duration+delay}:{...beat,start:beat.start+delay});
 return {...plan,sequence,beats,duration:plan.duration+delay,speechLeadInMs:delay,
  voiceWindows:plan.voiceWindows?.map(window=>({...window,start:window.start+delay,end:window.end+delay}))};
}
