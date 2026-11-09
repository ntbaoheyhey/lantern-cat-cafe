import type { EffectPlan } from './effects';
import type { StatusPresentation } from './card-status-beats';
import { statusIdentity, type VisualStatusId } from './card-status-data';

export const REACTION_WORDS = { 'crumb-burst':'CRUMB BURST!', wildfire:'WILDFIRE!', rupture:'RUPTURE!', spread:'SPREAD!' } as const;
export type ReactionId = keyof typeof REACTION_WORDS;
export interface V5Event { version:2; kind:string; sequence:number; actionId:number; round:number; stage:string; logIndex:number; sourceId?:string; actorId?:string; targetId?:string; statusId?:string; stacks?:number; amount?:number; reactionId?:string; primerIds?:string[]; targets?:string[]; skillId?:string; shape?:string }
export interface StatusSnapshot { id:string; statuses:{id:string;stacks:number;remaining:number}[] }
export interface VisualTriggerLog { kind:string; actorId:string; targetId:string; amount:number; text:string }
export interface V5Source { triggerLogs?:readonly VisualTriggerLog[]; logStart?:number; events:unknown[]; before:StatusSnapshot[]; after:StatusSnapshot[] }
export type V5Plan = EffectPlan & { v5?:V5Source };
export interface ReactionBeat { id:ReactionId; targetId:string; sourceId:string; targets:string[]; primerIds:VisualStatusId[]; at:number; duration:number }
export interface LandingBeat { targetId:string; fromId:string; shape:string; index:number; at:number; duration:number; scale:number }
const strings=(x:unknown):x is string[]=>Array.isArray(x)&&x.every(s=>typeof s==='string');
/** Discriminate per event, not by battle container version. Malformed/future input stays legacy. */
export function readV5Events(input:unknown):V5Event[] {
  if(!Array.isArray(input))return [];
  return input.filter((e):e is V5Event=>{
    if(!e||typeof e!=='object'||e.version!==2||typeof e.kind!=='string'||!Number.isInteger(e.sequence)||!Number.isInteger(e.actionId)||!Number.isInteger(e.logIndex))return false;
    if(['status-applied','status-tick'].includes(e.kind))return typeof e.targetId==='string'&&typeof e.sourceId==='string'&&!!statusIdentity(e.statusId)&&Number.isFinite(e.kind==='status-applied'?e.stacks:e.amount);
    if(e.kind==='reaction')return Object.hasOwn(REACTION_WORDS,e.reactionId)&&typeof e.targetId==='string'&&typeof e.sourceId==='string'&&strings(e.targets)&&strings(e.primerIds);
    if(e.kind==='multi-hit')return typeof e.skillId==='string'&&typeof e.shape==='string'&&strings(e.targets);
    return false;
  }).slice().sort((a,b)=>a.sequence-b.sequence);
}
/** Published snapshots/events are render inputs only. Never roll targets or advance combat. */
export function applyV5Presentation(plan:EffectPlan, legacy:StatusPresentation, source:V5Source|undefined):StatusPresentation {
  const events=readV5Events(source?.events);if(!events.length&&!source?.triggerLogs?.length)return legacy;
  const impact=plan.beats[2]!.start, result:StatusPresentation={offsets:new Map(),beats:legacy.beats.filter(b=>!events.length||b.kind==='expire').map(b=>({...b})),kinds:new Map(legacy.kinds),bursts:[],reactions:[],landings:[],tickIds:new Map(),bitterTargets:new Set()};
  const landing=events.find(e=>e.kind==='multi-hit');
  if(landing){
    // Preserve repeated targets; a Map alone loses a second/third seeded strike.
    landing.targets!.forEach((targetId,index)=>{
      const at=Math.min(plan.duration-1,impact+index*70);
      if(!result.offsets.has(targetId))result.offsets.set(targetId,at-impact);
      result.landings!.push({targetId,fromId:index&&landing.shape==='bounce'?landing.targets![index-1]!:landing.actorId??plan.actorId,shape:landing.shape!,index,at,duration:Math.min(180,plan.duration-at),scale:['splash','ally-splash'].includes(landing.shape!)&&index>0?.60:1});
    });
  }else for(const [id,at]of legacy.offsets)result.offsets.set(id,at);
  const reactions=events.filter(e=>e.kind==='reaction');
  for(const [index,event]of reactions.entries()){
    const at=Math.max(0,Math.min(impact+(result.offsets.get(event.targetId!)??index*70),plan.duration-400));
    const reaction:ReactionBeat={id:event.reactionId as ReactionId,targetId:event.targetId!,sourceId:event.sourceId!,targets:[...event.targets!],primerIds:event.primerIds!.filter(id=>statusIdentity(id)) as VisualStatusId[],at,duration:Math.min(500,plan.duration-at)};
    result.reactions!.push(reaction);if(!result.bursts.includes(reaction.targetId))result.bursts.push(reaction.targetId);
  }
  for(const event of events){
    if(event.kind!=='status-applied'&&event.kind!=='status-tick')continue;
    const at=impact+(result.offsets.get(event.targetId!)??0),kind=event.kind==='status-applied'?'apply':'tick';
    result.beats.push({kind,statusId:event.statusId as VisualStatusId,sourceId:event.sourceId!,targetId:event.targetId!,stacks:event.stacks??event.amount??0,at:kind==='apply'?Math.max(0,at-180):at,duration:Math.min(kind==='apply'?280:200,plan.duration-(kind==='apply'?Math.max(0,at-180):at))});
    if(kind==='tick'){
      const label=plan.events.filter(e=>(source?.logStart??0)+e.seq<=event.logIndex&&e.targetIds.includes(event.targetId!)&&e.amount===event.amount&&e.type===(event.statusId==='steep'?'heal':'damage')&&(event.statusId==='steep'||legacy.kinds.get(e.seq)==='dot')&&!result.tickIds!.has(e.seq)).at(-1);
      if(label){result.kinds.set(label.seq,'dot');result.tickIds!.set(label.seq,event.statusId!);}
    }
  }
  // The published rules log non-periodic modifiers as direct hits/heals or
  // explicit suppression, rather than status-tick events. These pulses are
  // presentation annotations of that log, never new combat events.
  for(const log of source?.triggerLogs??[]){
    const actor=source!.before.find(a=>a.id===log.targetId);
    const ids:VisualStatusId[]=log.kind==='damage'?['scent','brittle','cozy']
      :log.kind==='heal'||log.kind==='shield'?['bitter']
      :log.kind==='suppressed'&&log.text==='Daze spent the next action'?['drowsy']:[];
    for(const statusId of ids){
      const status=actor?.statuses.find(s=>s.id===statusId);if(!status)continue;
      if(result.beats.some(b=>b.kind==='trigger'&&b.statusId===statusId&&b.targetId===log.targetId))continue;
      const at=Math.min(plan.duration-1,impact+(result.offsets.get(log.targetId)??0));
      result.beats.push({kind:'trigger',statusId,sourceId:log.actorId,targetId:log.targetId,stacks:status.stacks,at,duration:Math.min(200,plan.duration-at)});
    }
  }
  for(const actor of source!.before){
    if(actor.statuses.some(s=>s.id==='bitter'))result.bitterTargets!.add(actor.id);
    for(const status of actor.statuses){
      if(!statusIdentity(status.id)||source!.after.find(a=>a.id===actor.id)?.statuses.some(s=>s.id===status.id))continue;
      // Explicit before/after state also covers consumed primers; no stale body marks.
      if(result.beats.some(b=>b.kind==='expire'&&b.statusId===status.id&&b.targetId===actor.id))continue;
      result.beats.push({kind:'expire',statusId:status.id as VisualStatusId,sourceId:actor.id,targetId:actor.id,stacks:status.stacks,at:impact,duration:Math.min(200,plan.duration-impact)});
    }
  }
  return result;
}

/** Integration accepts S4's v4.version=1 container with version=2 events. */
export function v5SourceForPlan(plan:EffectPlan,battle:unknown,before?:{actors:StatusSnapshot[]}):V5Source|undefined {
  if((plan as V5Plan).v5)return (plan as V5Plan).v5;
  const b=battle as {initial?:{skillsV5?:boolean};v4?:{version:number;events?:unknown[]};actors?:StatusSnapshot[];log?:{kind:string;actorId:string;targetId:string;amount:number;text:string}[]}|undefined;
  if(b?.v4?.version!==1||!b.log)return;
  const planEvents=plan.events.filter(e=>e.type!=='action_start'),first=planEvents[0];if(!first)return;
  const types:Record<string,string>={'reaction-damage':'damage',damage:'damage',dot:'damage',detonate:'damage',shared:'damage',reflect:'damage',heal:'heal',revive:'heal',survive:'heal',shield:'shield',defeat:'death',status:'status_apply',expire:'status_expire',phase:'boss_phase',summon:'spawn'};
  const matches=(e:typeof first,index:number)=>{const l=b.log![index];return l&&types[l.kind]===e.type&&l.actorId===e.actorId&&e.targetIds.includes(l.targetId)&&l.amount===e.amount&&(l.text===e.note||e.note==='Clutch heal');};
  const end=Math.min(first.actionId,b.log.length);let start=-1;
  for(let i=end-1;i>=first.seq-1;i--){const candidate=i-first.seq+1;if(matches(first,i)&&planEvents.every(e=>matches(e,candidate+e.seq-1))){start=candidate;break;}}
  if(start<0)return;
  const events=readV5Events(b.v4.events).filter(e=>e.logIndex>start&&e.logIndex<=end&&(plan.skillId==='round-status'?e.stage==='round-end':e.stage==='action'));
  const triggerLogs=b.initial?.skillsV5&&readV5Events(b.v4.events).length
    ?b.log.slice(start,start+Math.max(...planEvents.map(e=>e.seq))):undefined;
  return events.length||triggerLogs?.length?{logStart:start,events,triggerLogs,before:before?.actors??b.actors??[],after:b.actors??[]}:undefined;
}
