import type {SceneView} from '../../squad/turn3d/scene';
import {playCue} from '../contracts/audio-cues';
import {bodyStatuses,type BodyStatus} from './status';

/** Crossing-based cues; paused redraws and gallery seeks stay silent. */
export class BattleAudio {
 private battle:unknown;private impact:unknown;private lastPlan:unknown;private statuses=new Map<string,Set<BodyStatus>>();
 render(view:SceneView){
  if(view.battleKey!==this.battle){this.battle=view.battleKey;this.impact=null;this.lastPlan=null;this.statuses.clear();}
  const live=!view.paused&&view.fixedTime===undefined&&!view.galleryPreview,frame=view.frame;
  for(const unit of view.actors){
   const current=new Set(bodyStatuses(view.cardStatuses?.[unit.id],unit.shield)),previous=this.statuses.get(unit.id);
   if(live&&previous){for(const s of current)if(!previous.has(s))playCue(`status.${s}.on`);for(const s of previous)if(!current.has(s))playCue(`status.${s}.off`);}
   this.statuses.set(unit.id,current);
  }
  if(!frame)return;
  const owner=view.models?.[frame.plan.actorId]??view.actors.find(a=>a.id===frame.plan.actorId)?.cardRpg?.cardId;
  if(frame.plan!==this.lastPlan){this.lastPlan=frame.plan;if(live&&owner&&!frame.plan.ultimate)playCue(`voice.${owner}.${frame.clip==='attack'?'attack':'skill'}`,{volume:.65});}
  if(frame.elapsed<frame.plan.beats[2]!.start||this.impact===frame.plan)return;
  this.impact=frame.plan;if(!live)return;
  if(frame.plan.events.some(e=>e.type==='damage'))playCue(frame.plan.ultimate?'hit.heavy':/slash|cross|arrow/.test(frame.plan.shape)?'hit.slash':/orb|flask|storm|beam/.test(frame.plan.shape)?'hit.magic':'hit.blunt');
  for(const e of frame.plan.events){
   if(e.type==='death')for(const id of e.targetIds){const unit=view.models?.[id]??view.actors.find(a=>a.id===id)?.cardRpg?.cardId;if(unit)playCue(`voice.${unit}.death`);}
   if(e.type==='damage'&&['burn','poison','bleed'].includes(e.skillId))playCue(`status.${e.skillId}.tick`);
  }
 }
}
