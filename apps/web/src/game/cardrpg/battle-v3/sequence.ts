import type {EffectPlan} from '../../squad/turn3d/effects';
import type {PaintTimeline} from '../vfx-layered/timeline';
import type {AudioCue} from '../contracts/audio-cues';
import {audioTimeline} from './audio-timeline';
import {type VoiceWindow} from './voice-windows';
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
export type SequencePlan=EffectPlan & {sequence?:SkillSequence;cinematicMode?:CinematicMode;voiceWindows?:VoiceWindow[];speechLeadInMs?:number;fixedTiming?:boolean};

/** F3/F11: one action clock for every actor, independent of voices and media. */
export const ACTION_TIMING=Object.freeze({basic:{duration:800,anticipation:250,impact:350},ultimate:{duration:2200,anticipation:600,impact:1100}});
export function configureSequence(plan:EffectPlan,_mode:CinematicMode='full'):SequencePlan {
 if(!plan.events.some(event=>event.type==='action_start'||event.type==='charge'))return {...plan,fixedTiming:true};
 const id=plan.presentationId??plan.skillId,authored=SEQUENCES.get(id)?.sequence;
 const ultimate=plan.ultimate||id.startsWith('enemy:')&&!id.endsWith(':basic');
 const tier=ultimate?'ultimate':'basic',timing=ACTION_TIMING[tier],{duration,impact}=timing;
 const sequence:SkillSequence={tier,duration,impact,
  camera:[{t:0,zoom:1,x:0,y:0,tilt:0},{t:duration,zoom:1,x:0,y:0,tilt:0}],
  time:[{t:0,value:1},{t:duration,value:1}],
  dim:ultimate?[{t:0,value:.55},{t:450,value:.55},{t:600,value:0},{t:duration,value:0}]:[{t:0,value:0},{t:duration,value:0}],
  casterAnim:[{t:0,name:ultimate?'ult':'attack'}],targetAnim:[{t:impact,name:'hurt'}],
  vfx:structuredClone(authored?.vfx??[]),postfx:[{t:0,bloom:0,aberration:0,vignette:0},{t:duration,bloom:0,aberration:0,vignette:0}],audio:[],
  damage:plan.targetIds.map(target=>({t:impact,target,split:1}))};
 const lengths=[timing.anticipation,impact-timing.anticipation,200/3,ultimate?700:250,duration-impact-200/3-(ultimate?700:250)];
 let start=0;const beats=plan.beats.map((beat,i)=>{const next={...beat,start,duration:lengths[i]!,shake:0,flash:0};start+=next.duration;return next;});
 const configured:SequencePlan={...plan,ultimate,duration,beats,sequence,fixedTiming:true,cinematicMode:'off',speechLeadInMs:0,voiceWindows:[]};
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
