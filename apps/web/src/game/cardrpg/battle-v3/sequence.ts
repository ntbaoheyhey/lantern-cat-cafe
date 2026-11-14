import type {EffectPlan} from '../../squad/turn3d/effects';
import type {PaintTimeline} from '../vfx-layered/timeline';
import type {AudioCue} from '../contracts/audio-cues';
import {audioTimeline} from './audio-timeline';
import {minimumVoicedImpact,reserveVoiceTails,type VoiceWindow} from './voice-windows';
import {impactFeedback} from './presentation';

export type CinematicMode = 'full' | 'short' | 'off';
export interface ScalarKey {t:number;value:number}
export interface CameraKey {t:number;zoom:number;x:number;y:number;tilt:number}
export interface PostKey {t:number;bloom:number;aberration:number;vignette:number;shockwave?:boolean}
export interface SkillSequence {
 tier:'basic'|'active'|'ultimate'; duration:number; impact:number;
 camera:CameraKey[]; time:ScalarKey[]; dim:ScalarKey[];
 cutin?:{start:number;end:number;portrait:string;name:string};
 casterAnim:{t:number;name?:string;event?:string}[]; targetAnim:{t:number;name:string}[];
 vfx:{type:'flipbook'|'shader'|'particles'|'painted-layer';source:string;anchor:'caster'|'target'|'flight';blend:'normal'|'add'|'screen'}[];
 postfx:PostKey[]; audio:{t:number;cue:AudioCue}[];
 damage:{t:number;target:string;split:number}[];
 plate?:{id:string;start:number;end:number};
}
export interface Signature {element:{palette:string[];grade:string};camera:string;motif:string;target:string;soundKit:string}
const files=import.meta.glob('../../../../../../skills/*/sequence.json',{eager:true,import:'default'}) as Record<string,PaintTimeline>;
const fields=import.meta.glob('../../../../../../skills/*/field.json',{eager:true,import:'default'}) as Record<string,PaintTimeline[]>;
const signatures=import.meta.glob('../../../../../../skills/*/signature.json',{eager:true,import:'default'}) as Record<string,Signature>;
export const SEQUENCES=new Map([...Object.values(files),...Object.values(fields).flat()].filter(t=>t.sequence).map(t=>[t.id,t]));
export const SIGNATURES=new Map(Object.entries(signatures).map(([path,s])=>[path.split('/').at(-2)!,s]));
export type SequencePlan=EffectPlan & {sequence?:SkillSequence;cinematicMode?:CinematicMode;voiceWindows?:VoiceWindow[];speechLeadInMs?:number};

/** Retimes presentation only. Event objects, actor IDs, recipients and amounts are unchanged. */
export function configureSequence(plan:EffectPlan,mode:CinematicMode='full'):SequencePlan {
 const authored=SEQUENCES.get(plan.presentationId??plan.skillId)?.sequence;
 if(!authored)return reserveVoiceTails(plan);
 const sequence=structuredClone(authored);
 const ultimate=sequence.tier==='ultimate';
 const impact=ultimate?Math.max(mode==='full'?sequence.impact:mode==='short'?950:450,minimumVoicedImpact(plan,mode==='off'?0:150)):sequence.impact;
 const duration=ultimate?impact+400:sequence.duration;
 const remap=(t:number)=>t<=authored.impact?t/authored.impact*impact:impact+(t-authored.impact)/(authored.duration-authored.impact)*(duration-impact);
 // Short retains the cut-in, then carries its build through the spoken charge.
 const trackTime=(t:number)=>ultimate&&mode==='short'?(t<=650?t:t<=authored.impact?650+(t-650)/(authored.impact-650)*(impact-650):remap(t)):remap(t);
 for(const track of [sequence.camera,sequence.time,sequence.dim,sequence.postfx,sequence.audio,sequence.casterAnim,sequence.targetAnim,sequence.damage])for(const key of track)key.t=trackTime(key.t);
 sequence.duration=duration;sequence.impact=impact;
 if(sequence.plate&&mode!=='full')delete sequence.plate;
 if(mode==='off')delete sequence.cutin;
 if(sequence.cutin&&mode==='full'){sequence.cutin.start=150;sequence.cutin.end=650;}
 const lengths=ultimate?[Math.min(650,impact*.68),0,100,200,100]:[Math.min(200,impact*.5),0,70,120,duration-impact-190];
 lengths[1]=impact-lengths[0]!;
 let start=0;
 const beats=plan.beats.map((beat,i)=>{const next={...beat,start,duration:lengths[i]!,shake:i===2?(ultimate?12:3):0,flash:i===2?.35:0};start+=next.duration;return next;});
 const configured=reserveVoiceTails({...plan,ultimate,beats,duration,sequence,cinematicMode:mode},sequence);
 sequence.audio=audioTimeline(configured,sequence);
 return configured;
}

export function sampleKeys<T extends {t:number}>(keys:readonly T[],at:number):T {
 const first=keys[0]!,last=keys.at(-1)!;
 if(at<=first.t)return first;if(at>=last.t)return last;
 const right=keys.findIndex(k=>k.t>at),a=keys[right-1]!,b=keys[right]!;
 const u=(at-a.t)/Math.max(1,b.t-a.t),result={...a,t:at};
 for(const key of Object.keys(a) as (keyof T)[])if(key!=='t'&&typeof a[key]==='number'&&typeof b[key]==='number')result[key]=((a[key] as number)+((b[key] as number)-(a[key] as number))*u) as T[keyof T];
 return result;
}
export function sequenceAt(plan:EffectPlan,elapsed:number,reduced=false){
 const seq=(plan as SequencePlan).sequence;if(!seq)return null;
 const at=Math.max(0,elapsed);
 return {seq,at,camera:sampleKeys(seq.camera,at),timeScale:sampleKeys(seq.time,at).value,dim:sampleKeys(seq.dim,at).value,
  post:sampleKeys(seq.postfx,at),plate:!!seq.plate&&at>=seq.plate.start&&at<seq.plate.end,
  cutin:!!seq.cutin&&at>=seq.cutin.start&&at<seq.cutin.end,
  ...impactFeedback(plan,at,reduced)};
}

/** Analytic integral keeps world slow-motion stable during arbitrary seeking. */
export function sequenceWorldTime(sequence:SkillSequence,elapsed:number){
 let time=0;
 const keys=sequence.time;
 for(let i=0;i<keys.length;i++){
  const a=keys[i]!,b=keys[i+1]??{t:elapsed,value:a.value};
  const span=Math.max(0,Math.min(elapsed,b.t)-a.t);
  if(span>0){const end=a.value+(b.value-a.value)*span/Math.max(1,b.t-a.t);time+=span*(a.value+end)/2;}
  if(b.t>=elapsed)break;
 }
 return time;
}
