import type { StatusId } from './contract';
import type { ShapeV5 } from './skills-v5/shapes';
import type { ReactionIdV5 } from './skills-v5/reactions';
import type { Battle } from './contract';
import type { CrewJob, StandingPlan } from './gameplay-v4';

/** Presentation data only: consumers cannot resolve combat or spend rewards. */
export type LegacyGameplayEventPayload =
  | { kind: 'crew-active'; crew: CrewJob; marks: number; contributors: string[]; threshold: 2 | 4; text: string }
  | { kind: 'formation-cover'; amount: number; text: string }
  | { kind: 'plan-target'; plan: StandingPlan; reason: string; text: string }
  | { kind: 'gear-trigger'; templateId: string; effect: string; amount: number; text: string }
  | { kind: 'boss-phase'; bossId: string; from: number; to: number; threshold: number; text: string }
  | { kind: 'boss-finish'; bossId: string; retiredIds: string[]; outcome: 'party' | 'enemy'; text: string }
  | { kind: 'earned-reveal'; bannerId: string; draw: number; itemId: string; rarity: string; duplicate: number; pityBefore: number; pityAfter: number; text: string };
export type SkillsEventPayloadV5 =
  | {kind:'status-applied';statusId:StatusId;stacks:number;sourceId:string;targetId:string;text:string}
  | {kind:'status-tick';statusId:StatusId;amount:number;sourceId:string;targetId:string;text:string}
  | {kind:'reaction';reactionId:ReactionIdV5;primerIds:StatusId[];targets:string[];sourceId:string;targetId:string;text:string}
  | {kind:'multi-hit';skillId:string;shape:ShapeV5;targets:string[];text:string};
export type GameplayEventPayload = LegacyGameplayEventPayload | SkillsEventPayloadV5;
type EventIdentity = {sequence:number;round:number;actorId?:string;targetId?:string};
export type EventContextV5 = {version:2;actionId:number;stage:'setup'|'action'|'round-end';logIndex:number};
export type GameplayEventV4 = (LegacyGameplayEventPayload & EventIdentity & {version:1})
  | (GameplayEventPayload & EventIdentity & EventContextV5);
export const LEGACY_EVENT_KINDS = ['crew-active','formation-cover','plan-target','gear-trigger','boss-phase','boss-finish','earned-reveal'];
export function emitGameplayEvent(battle: Battle, event: GameplayEventPayload & { actorId?: string; targetId?: string }): void {
  if (!battle.v4) return;
  const identity={sequence:battle.v4.events.length,round:battle.round};
  if(battle.initial.skillsV5){
    const actionId=battle.procRounds.v5ActionSequence??0;
    battle.v4.events.push({...event,...identity,version:2,actionId,
      stage:battle.procRounds.v5RoundEnd?'round-end':actionId?'action':'setup',logIndex:battle.log.length});
  }else{
    if(!LEGACY_EVENT_KINDS.includes(event.kind))throw Error('Skills V5 event requires skillsV5');
    battle.v4.events.push({...event as LegacyGameplayEventPayload,version:1,...identity});
  }
}
export function battleReasons(battle: Battle): string[] {
  if (!battle.v4) return [];
  const reasons: string[] = [];
  const cover = battle.v4.events.reduce((n, e) => n + (e.kind === 'formation-cover' ? e.amount : 0), 0);
  if (cover) reasons.push(`Front-row cover prevented ${cover} direct damage to the back row.`);
  const shields = battle.log.filter(e => e.kind === 'absorbed' && battle.actors.some(a => a.id === e.targetId && a.side === 'party')).reduce((n, e) => n + e.amount, 0);
  if (shields) reasons.push(`Your shields absorbed ${shields} damage before it reached HP.`);
  const suppressed = battle.log.filter(e => e.kind === 'suppressed');
  if (suppressed.length) reasons.push(`Your control softened or stopped ${suppressed.length} enemy actions.`);
  const gear = battle.v4.events.find(e => e.kind === 'gear-trigger' && e.amount > 0);
  if (gear) reasons.push(gear.text);
  const healing = battle.log.filter(e => e.kind === 'heal' && battle.actors.some(a => a.id === e.targetId && a.side === 'party')).reduce((n, e) => n + e.amount, 0);
  if (healing) reasons.push(`The crew restored ${healing} missing HP.`);
  if (!reasons.length) reasons.push('Direct attacks and current health decided this encounter; no protection contribution was recorded.');
  return reasons.slice(0, 3);
}

/** Version 2 earned discoveries have no draw, banner or pity fields. Version 1 receipts remain readable. */
export interface DiscoveryRevealV4 {
  version: 2; kind: 'earned-reveal'; sequence: number; round: 0;
  discovery: { kind: 'crew' | 'set' | 'rank' | 'legendary' | 'stars'; id: string };
  itemId: string; text: string;
}
