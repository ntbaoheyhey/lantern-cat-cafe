import {emitGameplayEvent} from '../events-v4';
import type { Actor, Battle, StatusId, StatusRule } from '../contract';
import { adjacentV5, type ShapeV5 } from './shapes';

export type ReactionIdV5 = 'crumb-burst' | 'wildfire' | 'rupture' | 'spread';
export const REACTION_NAMES_V5: Record<ReactionIdV5,string> = {'crumb-burst':'Crumb Burst',wildfire:'Wildfire',rupture:'Rupture',spread:'Spread'};
export interface ReactionRuntimeV5 {
  apply: (b: Battle, source: Actor, target: Actor, id: StatusId, stacks: number) => boolean;
  loseHp: (b: Battle, source: Actor, target: Actor, amount: number, kind: string) => number;
  record: (b: Battle, source: Actor, target: Actor, kind: string, amount: number, text: string, skillId: string) => void;
  rule: (id: StatusId) => StatusRule;
}
const count = (a: Actor, id: StatusId) => a.statuses.find(s => s.id === id)?.stacks ?? 0;
export function canReactV5(b: Battle, target: Actor): boolean {
  return b.initial.skillsV5 === true && !b.procRounds.v5ReactionDepth && target.bonuses.v5ReactionRound !== b.round;
}
function react(b: Battle, source: Actor, target: Actor, id: ReactionIdV5, io: ReactionRuntimeV5, primerIds:StatusId[], targets:Actor[], apply: () => void): boolean {
  if (!canReactV5(b,target)) return false;
  target.bonuses.v5ReactionRound = b.round;
  b.procRounds.v5ReactionDepth = 1;
  try { apply(); } finally { delete b.procRounds.v5ReactionDepth; }
  io.record(b,source,target,'reaction',1,REACTION_NAMES_V5[id],id);
  emitGameplayEvent(b,{kind:'reaction',reactionId:id,primerIds,targets:targets.map(a=>a.id),actorId:source.id,sourceId:source.id,targetId:target.id,text:`${source.name} → ${REACTION_NAMES_V5[id]}.`});
  return true;
}
export function crumbBurstV5(b: Battle, source: Actor, target: Actor, io: ReactionRuntimeV5, detonate: () => void): boolean {
  return target.hp > 0 && count(target,'crumb') > 0 && react(b,source,target,'crumb-burst',io,count(target,'scald')?['crumb','scald']:['crumb'],[target],detonate);
}
/** A lethal hit offers Spread first; a living direct-hit target offers Rupture before Wildfire. */
export function directReactionV5(b: Battle, source: Actor, target: Actor, shape: ShapeV5, io: ReactionRuntimeV5): boolean {
  if (!canReactV5(b,target)) return false;
  const bleed = count(target,'snag');
  if (target.hp > 0 && bleed && count(target,'brittle')) return react(b,source,target,'rupture',io,['snag','brittle'],[target],() => {
    target.statuses = target.statuses.filter(s => s.id !== 'snag');
    io.loseHp(b,source,target,12*bleed,'reaction-damage');
  });
  const neighbours = adjacentV5(b,target);
  if (count(target,'scald') >= 3 && ['splash','row','all'].includes(shape) && neighbours.length) return react(b,source,target,'wildfire',io,['scald'],neighbours,() => {
    for (const other of neighbours) io.apply(b,source,other,'scald',1);
  });
  return false;
}
export function spreadV5(b: Battle, source: Actor, target: Actor, io: ReactionRuntimeV5): boolean {
  if (target.hp > 0 || !count(target,'scent') || !canReactV5(b,target)) return false;
  const nearest = adjacentV5(b,target)[0];
  if (!nearest) return false;
  const debuffs = target.statuses.filter(s => io.rule(s.id).kind === 'debuff');
  return react(b,source,target,'spread',io,debuffs.map(s=>s.id),[nearest],() => {
    for (const status of debuffs) io.apply(b,source,nearest,status.id,Math.ceil(status.stacks/2));
  });
}
