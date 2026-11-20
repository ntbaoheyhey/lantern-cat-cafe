import type {SceneView} from '../../squad/turn3d/scene';
import {playCue,type AudioCue,type CueOptions} from '../contracts/audio-cues';
import {bodyStatuses,type BodyStatus} from './status';
import {audioTimeline,cueTier,type TimelineCue,type CueRole} from './audio-timeline';
import type {SequencePlan} from './sequence';
import {advanceBattleClock} from './final-hit';
// Opening skills begin shortly after the field appears. Leave their seven-second
// mixer cooldown intact before requesting optional party chatter.
const FIRST_BARK_MS=8000;
const BOSS_STINGS=new Set(['yarn-giant','rain-spool','pantry-crown']);
export interface FiredCue {cue:AudioCue;at:number;planId:number|string|null;skillId:string;tier:string;actorId:string;role:CueRole;targetId?:string;voicePhase?:string}
/** One battle-owned scheduler. B retains all decoding, mixing and voice synthesis. */
export class BattleAudio {
 readonly events:FiredCue[]=[];
 private battle:unknown;private lastPlan:unknown;private fired=new Set<number>();private track:TimelineCue[]=[];
 private statuses=new Map<string,Set<BodyStatus>>();private lastWall:number|undefined;private elapsed=0;private nextBark=FIRST_BARK_MS;private barks=0;
 private capture=false;private impacts:number[]=[];private pending:{event:FiredCue;options:CueOptions}[]=[];
 private voiceRoster='';private introDone=false;private outcome=false;
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
   this.voiceRoster='';this.introDone=false;this.outcome=false;
  }
  if(!this.introDone&&!view.galleryPreview){
   // V10: a chapter boss announces itself once per battle with its own sting.
   this.introDone=true;const boss=view.actors.map(a=>view.models?.[a.id]??a.cardRpg?.cardId??a.id).find(id=>BOSS_STINGS.has(id));
   if(boss)this.send({at:0,planId:null,skillId:'',tier:'',actorId:boss,cue:`ui.boss-intro.${boss}`,role:'cut'},{priority:60});
  }
  if(!this.outcome&&!view.galleryPreview&&view.actors.length){
   // V10: one fanfare when the field is decided (wave clear, boss down) or a defeat sting.
   const alive=(side:string)=>view.actors.filter(a=>a.side===side&&a.hp>0);
   const won=view.actors.some(a=>a.side==='enemy')&&!alive('enemy').length,lost=view.actors.some(a=>a.side==='party')&&!alive('party').length;
   if(won||lost){
    this.outcome=true;const cat=alive('party')[0],owner=cat&&(view.models?.[cat.id]??cat.cardRpg?.cardId);
    const ctx={at:this.elapsed/1000,planId:null,skillId:won?'victory':'defeat',tier:'',actorId:cat?.id??''};
    this.send({...ctx,cue:won?'music.victory':'music.defeat',role:'cut'},{priority:95});
    if(won&&owner)this.send({...ctx,cue:`voice.${owner}.victory`,role:'voice'},{priority:100});
   }
  }
  if(!this.capture&&typeof window!=='undefined'){
   const bridge=window.__thAudio,roster=view.actors.map(actor=>view.models?.[actor.id]??actor.cardRpg?.cardId??actor.id),key=roster.join('|');
   if(bridge&&key!==this.voiceRoster){this.voiceRoster=key;bridge.setBattleRoster?.(roster);void bridge.preloadVoices?.(roster);}
  }
  const now=view.fixedTime===undefined?performance.now():view.fixedTime*1000,delta=this.lastWall===undefined?0:Math.max(0,Math.min(250,now-this.lastWall));this.lastWall=now;
  if(view.galleryPreview||(!this.capture&&(view.paused||view.fixedTime!==undefined)))return;
  this.elapsed+=delta;const at=this.elapsed/1000,frame=view.frame;
  const oldPending=this.pending;this.pending=[];for(const p of oldPending)this.send({...p.event,at},p.options);
  const context={at,planId:frame?.plan.id??null,skillId:frame?.plan.presentationId??frame?.plan.skillId??'',tier:frame?cueTier(frame.plan):'',actorId:frame?.plan.actorId??''};
  for(const unit of view.actors){
   const current=new Set(bodyStatuses(view.cardStatuses?.[unit.id],unit.shield)),previous=this.statuses.get(unit.id);
   if(previous&&!view.formationC2){for(const status of current)if(!previous.has(status))this.send({...context,cue:`status.${status}.on`,role:'status',targetId:unit.id});for(const status of previous)if(!current.has(status))this.send({...context,cue:`status.${status}.off`,role:'status',targetId:unit.id});}
   this.statuses.set(unit.id,current);
  }
  if(frame&&frame.plan!==this.lastPlan){this.lastPlan=frame.plan;this.fired.clear();this.track=audioTimeline(frame.plan,(frame.plan as SequencePlan).sequence);}
  // A bark must fit before the next authored line. Keep its periodic due time
  // while the line owns the voice slot, then try again on the following frame.
  // Lead-ins and speech run at real time even at ×2/×3. Predict through the
  // same clock as playback; multiplying by speed reserves several extra seconds.
  const speechHorizon=frame?advanceBattleClock(frame.plan,frame.elapsed,1800,view.reducedMotion,view.playbackSpeed??1):0;
  const speechSoon=frame&&this.track.some(key=>key.role==='voice'&&key.t>=frame.elapsed-80&&key.t<speechHorizon);
  if(!view.formationC2&&this.elapsed>=this.nextBark&&!speechSoon){
   const party=view.actors.filter(a=>a.side==='party'&&a.hp>0),actor=party[this.barks%Math.max(1,party.length)],owner=actor&&(view.models?.[actor.id]??actor.cardRpg?.cardId);
   if(owner)this.send({...context,cue:`voice.${owner}.${this.barks%2?'attack':'select'}`,role:'bark',actorId:actor!.id},{volume:.65,priority:40});
   // Leave room inside the 7–8s cadence for a nearby authored speech slot.
   this.barks++;this.nextBark+=7250;
  }
  if(!frame)return;
  for(const [i,key] of this.track.entries()){
   // At fast playback the canonical midpoint can land on the contact frame.
   // Re-evaluate the travel checkpoint at the current speed, including a
   // mid-action speed change. Fired indices retain exactly-once dispatch.
   const speed=Number.isFinite(view.playbackSpeed)?Math.max(1,Math.min(3,view.playbackSpeed!)):1;
   const due=key.role==='travel'&&key.flightStart!==undefined?key.flightStart+(key.t-key.flightStart)/speed:key.t;
   if(this.fired.has(i)||due>frame.elapsed)continue;this.fired.add(i);
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
