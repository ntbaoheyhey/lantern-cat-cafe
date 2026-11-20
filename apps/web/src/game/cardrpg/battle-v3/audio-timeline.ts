import type {EffectPlan} from '../../squad/turn3d/effects';
import type {AudioCue} from '../contracts/audio-cues';
import type {SkillSequence} from './sequence';
import {presentationTier as cueTier} from './presentation';
import snapshot from './voice-timing.json';
import {CAT_BY_ID,ENEMY_BY_ID} from '@taskbar-hero/game-rules/src/cardrpg/depth/catalog';
import {validatePaint,type PaintTimeline} from '../vfx-layered/timeline';
import {BATTLE_ELEMENTS as elements} from '../../../audio/ranged-packs';
export interface VoiceTiming {unitId:string;skillId:string;cueId:string;text:string;durationMs:number;syncPointMs:number;phase?:string;kind:string}
const live=import.meta.glob('../../../audio/voice-callouts.json',{eager:true,import:'default'}) as Record<string,VoiceTiming[]>;
/** B owns these takes; the read-only snapshot keeps timing available before the scheduled merge. */
export const VOICE_TIMING:readonly VoiceTiming[]=Object.values(live)[0]??snapshot.callouts;
export type CueRole='charge'|'movement'|'release'|'travel'|'impact'|'tail'|'voice'|'bark'|'status'|'cut';
export interface TimelineCue {t:number;cue:AudioCue;role:CueRole;element?:string;targetId?:string;voicePhase?:'active'|'charge'|'release';flightStart?:number}
const authored=import.meta.glob('../../../../../../assets/cardrpg-look/vfx-layered/*.json',{eager:true,import:'default'}) as Record<string,PaintTimeline>;
const paintings=new Map(Object.values(authored).map(p=>[p.id,validatePaint(p)]));
/** Read the same authored flight interval as the renderer; contact remains the rules beat. */
function rangedFlight(plan:EffectPlan,impact:number,element:string):TimelineCue[]{
 const painting=paintings.get(plan.presentationId??plan.skillId);if(!painting)return [];
 const flights=painting.layers.filter(l=>l.anchor==='flight'&&l.start<painting.impact&&l.keys.some(k=>k.t<painting.impact&&k.alpha>0));
 if(!flights.length)return [];
 const castStart=plan.ultimate?600:0,start=castStart+Math.min(...flights.map(l=>l.start))/painting.impact*(impact-castStart);
 return [{t:start,cue:`kit.ranged-${element}.release`,role:'release',element},{t:(start+impact)/2,cue:`kit.ranged-${element}.travel`,role:'travel',element,flightStart:start}];
}
export function cueOwner(plan:EffectPlan){return (plan.presentationId??plan.skillId).replace(/^enemy:/,'').replace(/:basic$/,'').replace(/-[1-4]$/,'');}
export {cueTier};
export function voiceTiming(owner:string,skill:string,phase?:string){return VOICE_TIMING.find(v=>v.unitId===owner&&v.skillId===skill&&(phase?v.phase===phase:v.kind==='skill'));}
/** Authored beat times plus resolved recipients; amounts and the combat clock are read-only. */
export function audioTimeline(plan:EffectPlan,sequence?:SkillSequence):TimelineCue[]{
 const id=plan.presentationId??plan.skillId,owner=cueOwner(plan),tier=sequence?.tier??cueTier(plan),impact=sequence?.impact??plan.beats[2]!.start,duration=sequence?.duration??plan.duration;
 if(!plan.events.some(e=>e.type==='action_start'||e.type==='charge'))return [];
 // The fixed beat owns speech and weapon cues; voice lengths never move contact.
 if((plan as EffectPlan&{fixedTiming?:boolean}).fixedTiming){
  const element=elements[owner]??'heavy',unit=CAT_BY_ID[owner]??ENEMY_BY_ID[owner],role=unit?.role??'striker',healer=unit?.combatClass==='healer',ranged=unit?.combatClass==='ranged';
  const flight=ranged?rangedFlight(plan,impact,element):[],hit:AudioCue=healer?'heal.medium':ranged?`kit.ranged-${element}.impact`:`kit.${element}.impact`;
  // The contact role is also the healing beat; healers never use weapon layers.
  if(tier==='basic')return healer?[{t:impact,cue:'heal.medium',role:'impact',element}]:[
   ...(flight.length?flight:[{t:0,cue:`move.${role}.whoosh` as AudioCue,role:'movement' as const,element}]),
   {t:impact,cue:hit,role:'impact',element},
  ];
  const line=voiceTiming(owner,id,'charge');
  return [
   ...(line?[{t:0,cue:line.cueId as AudioCue,role:'voice' as const,element,voicePhase:'charge' as const}]:[]),
   {t:600,cue:healer?'kit.magic.charge':`ult.${owner}.charge` as AudioCue,role:'charge',element},
   ...flight,
   {t:impact,cue:hit,role:'impact',element},
   ...(!healer?[{t:impact+200,cue:`ult.${owner}.tail` as AudioCue,role:'tail' as const,element}]:[]),
  ];
 }
 const movement=plan.beats[1]!.start,slot=Number(id.match(/-([1-4])$/)?.[1]??(tier==='active'?2:1));
 const family=/slash|arrow|cross/.test(plan.shape)?'slash':/bash|charge|sweep/.test(plan.shape)?'heavy':'magic';
 const role=(CAT_BY_ID[owner]??ENEMY_BY_ID[owner])?.role??'striker',element=elements[owner]??family,track:TimelineCue[]=[];
 const add=(t:number,cue:AudioCue,role:CueRole,extra:Partial<TimelineCue>={})=>track.push({t:Math.max(0,Math.min(duration-35,t)),cue,role,element,...extra});
 add(0,`kit.${element}.charge`,'charge');add(movement,`move.${role}.whoosh`,'movement');
 add(Math.max(movement,impact-160),`kit.${element}.release`,'release');
 if(tier==='ultimate'){
  const charge=voiceTiming(owner,id,'charge'),release=voiceTiming(owner,id,'release');
  const leadIn=(plan as EffectPlan&{speechLeadInMs?:number}).speechLeadInMs??0;
  const chargeAt=Math.max(leadIn,(sequence?.cutin?.start??leadIn)-(charge?.syncPointMs??0));
  const releaseAt=Math.max(0,impact-(release?.syncPointMs??0));
  // Explicit voice precedes its cast SFX in the same tick: B's documented
  // microtask fallback sees it and never starts a second take.
  add(chargeAt,(charge?.cueId??`voice.${owner}.ult.charge`) as AudioCue,'voice',{voicePhase:'charge'});
  add(chargeAt,`ult.${owner}.charge`,'charge');
  add(releaseAt,(release?.cueId??`voice.${owner}.ult.release`) as AudioCue,'voice',{voicePhase:'release'});
  add(releaseAt,`ult.${owner}.release`,'release');
  if(sequence?.plate){add(sequence.plate.start,'battle.cut','cut');add(sequence.plate.start+650,`kit.${element}.charge`,'charge');add(sequence.plate.end-400,`move.${role}.whoosh`,'movement');}
 }else if(tier==='active'){
  const line=voiceTiming(owner,id),at=Math.max(0,movement-(line?.syncPointMs??0));
  add(at,(line?.cueId??`voice.${owner}.skill.${id}`) as AudioCue,'voice',{voicePhase:'active'});
  add(at,`skill.${owner}.${slot}.cast`,'charge');
 }
 const recipients=[...new Set(plan.events.filter(e=>['damage','heal','shield'].includes(e.type)&&e.amount>0).flatMap(e=>e.targetIds))];
 for(const [i,targetId] of recipients.entries()){
  const damage=plan.events.some(e=>e.targetIds.includes(targetId)&&e.type==='damage'&&e.amount>0),heal=plan.events.some(e=>e.targetIds.includes(targetId)&&e.type==='heal'&&e.amount>0);
  add(impact+i*35,damage?`kit.${element}.impact`:heal?'heal.medium':'kit.holy.impact','impact',{targetId});
 }
 if(!recipients.length)add(impact,`kit.${element}.impact`,'impact');
 add(impact+200,tier==='ultimate'?`ult.${owner}.tail`:`kit.${element}.tail`,'tail');
 add(impact+250,`move.${role}.whoosh`,'movement');
 return track.sort((a,b)=>a.t-b.t||(a.role==='voice'?-1:b.role==='voice'?1:0));
}
