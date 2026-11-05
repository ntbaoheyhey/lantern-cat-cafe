import { TURN_KITS, TURN_SKILLS } from './config';
import type { Hero, LegalTurnAction, LegalTurnTarget, TurnActor, TurnBattle, TurnSkill } from './types';

export const living = (a: TurnActor): boolean => a.hp > 0;
export const hasStatus = (a: TurnActor, kind: string): boolean => a.statuses.some(s => s.kind === kind && s.turns > 0);
export function taunter(b: TurnBattle, source: TurnActor): TurnActor | undefined {
  const status = source.statuses.find(s => s.kind === 'taunt' && s.turns > 0 &&
    b.actors.some(a => a.id === s.source && a.hp > 0 && a.side !== source.side));
  return status ? b.actors.find(a => a.id === status.source) : undefined;
}
export function affected(b: TurnBattle, source: TurnActor, skill: TurnSkill, target: TurnActor): TurnActor[] {
  const friendly = ['self', 'ally', 'allAllies'].includes(skill.target);
  const all = b.actors.filter(a => living(a) && (friendly ? a.side === source.side : a.side !== source.side));
  if (skill.target === 'allAllies' || skill.target === 'allEnemies') return all;
  if (skill.target === 'row') return all.filter(a => a.row === target.row);
  return living(target) ? [target] : [];
}
export function skillIds(b: TurnBattle, a: TurnActor): readonly string[] {
  if (a.side === 'party') return TURN_KITS[a.role as Hero];
  const committed = b.intents[a.id]?.skillId;
  return [committed ?? `${a.role}Attack`];
}
/** Target geometry is available before a turn, even when the action is on cooldown. */
export function getLegalTargets(b: TurnBattle, skillId: string, actorId: string = b.activeId ?? ''): LegalTurnTarget[] {
  const source = b.actors.find(a => a.id === actorId), skill = TURN_SKILLS[skillId];
  const forced = source && skill?.target === 'enemy' ? taunter(b, source) : undefined;
  return b.actors.map(target => {
    let reason = '';
    if (!source) reason = 'Actor does not exist.';
    else if (!living(source)) reason = 'Actor is defeated.';
    else if (!skill || !skillIds(b, source).includes(skillId)) reason = 'Skill is not in this actor’s kit or committed intent.';
    else if (!living(target)) reason = 'Target is defeated.';
    else if (skill.target === 'self' && source.id !== target.id) reason = 'This skill targets its caster.';
    else if (['self', 'ally', 'allAllies'].includes(skill.target) && source.side !== target.side) reason = 'Choose a living ally.';
    else if (['enemy', 'row', 'allEnemies'].includes(skill.target) && source.side === target.side) reason = 'Choose a living opponent.';
    else if (forced && forced.id !== target.id) reason = `Taunted by ${forced.name}; target ${forced.id}.`;
    return { actorId: target.id, legal: !reason, reason: reason || (skill?.target === 'row' ? `Affects the ${target.row} row.` : 'Legal target.'),
      affectedIds: !reason && source && skill ? affected(b, source, skill, target).map(a => a.id) : [] };
  });
}
export function getLegalActions(b: TurnBattle, actorId: string = b.activeId ?? ''): LegalTurnAction[] {
  const a = b.actors.find(a => a.id === actorId);
  if (!a) return [];
  return skillIds(b, a).map(id => TURN_SKILLS[id]).filter((s): s is TurnSkill => !!s).map(skill => {
    let reason = '';
    if (b.result) reason = 'Battle has finished.';
    else if (!living(a)) reason = 'Actor is defeated.';
    else if (a.id !== b.activeId) reason = 'It is not this actor’s turn.';
    else if (b.phase !== 'choose') reason = b.phase === 'chosen' ? 'An action is already locked.' : 'This turn is not accepting a choice.';
    else if (hasStatus(a, 'stun') || hasStatus(a, 'restrain')) reason = 'This actor cannot act this turn.';
    else if ((a.cooldowns[skill.id] ?? 0) > 0) reason = `Cooldown: ${a.cooldowns[skill.id]} own turn(s).`;
    else if (a.charge < skill.chargeCost) reason = `Requires ${skill.chargeCost} charge (${a.charge} available).`;
    else if (!getLegalTargets(b, skill.id, a.id).some(t => t.legal)) reason = 'No living legal target.';
    return { skill, legal: !reason, reason: reason || 'Ready.' };
  });
}
