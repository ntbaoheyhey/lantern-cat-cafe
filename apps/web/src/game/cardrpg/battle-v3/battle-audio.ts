import type {SceneView} from '../../squad/turn3d/scene';
import {playCue,type AudioCue,type CueOptions} from '../contracts/audio-cues';
import {bodyStatuses,type BodyStatus} from './status';
import {audioTimeline,cueTier,type TimelineCue,type CueRole} from './audio-timeline';
import type {SequencePlan} from './sequence';
import {advanceBattleClock} from './final-hit';
// Opening skills begin shortly after the field appears. Leave their seven-second
// mixer cooldown intact before requesting optional party chatter.
const FIRST_BARK_MS=8000;
export interface FiredCue {cue:AudioCue;at:number;planId:number|string|null;skillId:string;tier:string;actorId:string;role:CueRole;targetId?:string;voicePhase?:string}
/** One battle-owned scheduler. B retains all decoding, mixing and voice synthesis. */
export class BattleAudio {
 readonly events:FiredCue[]=[];
 private battle:unknown;private lastPlan:unknown;private fired=new Set<number>();private track:TimelineCue[]=[];
 private statuses=new Map<string,Set<BodyStatus>>();private lastWall:number|undefined;private elapsed=0;private nextBark=FIRST_BARK_MS;private barks=0;
 private capture=false;private impacts:number[]=[];private pending:{event:FiredCue;options:CueOptions}[]=[];
 constructor(private play:(id:AudioCue,options?:CueOptions)=>void=playCue){}
 /** Deterministic evidence swaps the audio bridge for a recorder, never a second AudioContext. */
 setCapture(enabled:boolean){this.capture=enabled;}
 private send(event:FiredCue,options:CueOptions={}){
  if(event.role==='impact'){
   this.impacts=this.impacts.filter(t=>event.at-t<.1);
   if(this.impacts.length>=6){this.pending.push({event,options});return;}
   this.impacts.push(event.at);
  }
  this.events.push(event);if(this.events.length>12000)this.events.splice(0,1000);
  this.play(event.cue,options);
 }
 render(view:SceneView){
  if(view.battleKey!==this.battle){
   this.battle=view.battleKey;this.lastPlan=null;this.statuses.clear();this.fired.clear();this.track=[];this.events.length=0;
   this.elapsed=0;this.nextBark=FIRST_BARK_MS;this.barks=0;this.lastWall=undefined;this.pending=[];this.impacts=[];
  }
  const now=view.fixedTime===undefined?performance.now():view.fixedTime*1000,delta=this.lastWall===undefined?0:Math.max(0,Math.min(250,now-this.lastWall));this.lastWall=now;
  if(view.galleryPreview||(!this.capture&&(view.paused||view.fixedTime!==undefined)))return;
  this.elapsed+=delta;const at=this.elapsed/1000,frame=view.frame;
  const oldPending=this.pending;this.pending=[];for(const p of oldPending)this.send({...p.event,at},p.options);
  const context={at,planId:frame?.plan.id??null,skillId:frame?.plan.presentationId??frame?.plan.skillId??'',tier:frame?cueTier(frame.plan):'',actorId:frame?.plan.actorId??''};
  for(const unit of view.actors){
   const current=new Set(bodyStatuses(view.cardStatuses?.[unit.id],unit.shield)),previous=this.statuses.get(unit.id);
   if(previous){for(const status of current)if(!previous.has(status))this.send({...context,cue:`status.${status}.on`,role:'status',targetId:unit.id});for(const status of previous)if(!current.has(status))this.send({...context,cue:`status.${status}.off`,role:'status',targetId:unit.id});}
   this.statuses.set(unit.id,current);
  }
  if(frame&&frame.plan!==this.lastPlan){this.lastPlan=frame.plan;this.fired.clear();this.track=audioTimeline(frame.plan,(frame.plan as SequencePlan).sequence);}
  // A bark must fit before the next authored line. Keep its periodic due time
  // while the line owns the voice slot, then try again on the following frame.
  // Lead-ins and speech run at real time even at ×2/×3. Predict through the
  // same clock as playback; multiplying by speed reserves several extra seconds.
  const speechHorizon=frame?advanceBattleClock(frame.plan,frame.elapsed,1800,view.reducedMotion,view.playbackSpeed??1):0;
  const speechSoon=frame&&this.track.some(key=>key.role==='voice'&&key.t>=frame.elapsed-80&&key.t<speechHorizon);
  if(this.elapsed>=this.nextBark&&!speechSoon){
   const party=view.actors.filter(a=>a.side==='party'&&a.hp>0),actor=party[this.barks%Math.max(1,party.length)],owner=actor&&(view.models?.[actor.id]??actor.cardRpg?.cardId);
   if(owner)this.send({...context,cue:`voice.${owner}.${this.barks%2?'attack':'select'}`,role:'bark',actorId:actor!.id},{volume:.65,priority:40});
   // Leave room inside the 7–8s cadence for a nearby authored speech slot.
   this.barks++;this.nextBark+=7250;
  }
  if(!frame)return;
  for(const [i,key] of this.track.entries()){
   if(this.fired.has(i)||key.t>frame.elapsed)continue;this.fired.add(i);
   this.send({...context,cue:key.cue,role:key.role,targetId:key.targetId,voicePhase:key.voicePhase},{speed:view.playbackSpeed??1,element:key.element,...(key.role==='voice'?{priority:context.tier==='ultimate'?100:90}:{}),...(key.role==='movement'?{volume:.7}:{})});
  }
  // Death and periodic damage are independent resolved events, not extra hit amounts.
  if(frame.elapsed>=frame.plan.beats[2]!.start&&!this.fired.has(-1)){
   this.fired.add(-1);
   for(const event of frame.plan.events){
    if(event.type==='death')for(const id of event.targetIds){const owner=view.models?.[id]??view.actors.find(a=>a.id===id)?.cardRpg?.cardId;if(owner)this.send({...context,cue:`voice.${owner}.death`,role:'voice',targetId:id},{priority:80});}
    if(event.type==='damage'&&['burn','poison','bleed'].includes(event.skillId))this.send({...context,cue:`status.${event.skillId}.tick`,role:'status'});
   }
  }
 }
}
