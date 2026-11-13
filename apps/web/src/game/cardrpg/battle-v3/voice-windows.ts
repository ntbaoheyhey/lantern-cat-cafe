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
