import { TURN_CONFIG as C } from './config';
import { getLegalActions, getLegalTargets, hasStatus } from './targeting';
import type { TurnBattle, TurnChoice } from './types';

/** Pure, deterministic policy. Manual and Auto share exactly the same legal actions. */
export function getAutoAction(b: TurnBattle, policy: 'auto' | 'active' = 'auto'): TurnChoice | null {
  const actor = b.actors.find(a => a.id === b.activeId);
  if (!actor || b.phase !== 'choose' || b.result) return null;
  if (actor.side === 'enemy') {
    const intent = b.intents[actor.id];
    return intent && !intent.interrupted && getLegalActions(b).some(a => a.legal && a.skill.id === intent.skillId)
      && getLegalTargets(b, intent.skillId).some(t => t.legal && t.actorId === intent.targetId)
      ? { actorId: actor.id, skillId: intent.skillId, targetId: intent.targetId } : null;
  }
  const options: { choice: TurnChoice; score: number }[] = [];
  const allies = b.actors.filter(a => a.side === actor.side && a.hp > 0);
  for (const { skill, legal } of getLegalActions(b)) {
    if (!legal) continue;
    for (const target of getLegalTargets(b, skill.id).filter(t => t.legal)) {
      const affected = target.affectedIds.map(id => b.actors.find(a => a.id === id)!).filter(Boolean);
      let score = 0;
      for (const a of affected) {
        if (skill.power) {
          const damage = actor.attack * skill.power * (skill.hits ?? 1) * C.defenseScale / (C.defenseScale + a.defense) * (hasStatus(a, 'exposed') ? C.boss.exposedMultiplier : 1);
          score += Math.min(a.hp, damage) + (a.hp <= damage ? C.policy.killBonus : 0);
          // Active prioritizes exposed knots and dangerous queued roles; Auto values damage first.
          if (policy === 'active') score += (C.policy.activePriority[a.role as keyof typeof C.policy.activePriority] ?? 0) * .35;
          if (a.role === 'thread' && allies.some(a => hasStatus(a, 'restrain'))) score += 100;
        }
        if (skill.heal) {
          const missing = a.maxHp - a.hp;
          score += Math.min(missing, skill.heal * C.presets[b.preset].healing) * (a.hp / a.maxHp < C.policy.urgentHeal ? 2.7 : 1.15);
        }
        if (skill.shield) score += Math.min(skill.shield, Math.max(0, a.maxHp * .35 - a.shield)) * (a.hp / a.maxHp < .65 ? .9 : .35);
        if (skill.cleanse) score += a.statuses.filter(s => ['restrain','burn','stun'].includes(s.kind)).length * 100;
        if (skill.status === 'burn' && !hasStatus(a,'burn')) score += C.burnDamage * (skill.duration ?? 1);
        if (skill.status === 'guard' && !hasStatus(a,'guard')) score += 12;
        if (skill.delay && a.controlCount === 0) score += b.intents[a.id]?.interrupted ? 0 : 18;
      }
      if (skill.id === 'rally') {
        const threats = Object.values(b.intents).filter(i => i.targetIds.some(id => id !== actor.id && allies.some(a => a.id === id))).length;
        score += threats * 20;
      }
      if (skill.chargeCost && !skill.cleanse) score -= 12;
      options.push({ choice: { actorId: actor.id, skillId: skill.id, targetId: target.actorId }, score });
    }
  }
  options.sort((a,z) => z.score-a.score || a.choice.skillId.localeCompare(z.choice.skillId) || a.choice.targetId.localeCompare(z.choice.targetId));
  return options[0]?.choice ?? null;
}
