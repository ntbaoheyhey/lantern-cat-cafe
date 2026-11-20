import type { Battle } from '@taskbar-hero/game-rules/src/cardrpg/depth/contract';
import type { EffectPlan } from '../../squad/turn3d/effects';

/** Read only the resolved action (or grouped round), never invent a passive cast. */
export function passivePresentation(before: Battle, after: Battle): Pick<EffectPlan, 'presentationCues' | 'presentationCueTargets'> {
  const log = after.log.slice(before.log.length);
  const targets: Record<string, string> = {};
  for (const actor of after.actors.filter(a => a.side === 'party')) {
    const previous = before.actors.find(a => a.id === actor.id);
    if (!previous) continue;
    const events = log.filter(e => e.actorId === actor.id);
    const ownShield = events.filter(e => e.kind === 'shield' && e.targetId === actor.id).reduce((n, e) => n + e.amount, 0);
    let target: string | undefined;
    if (actor.catalogId === 'mochi' && actor.shield - previous.shield > ownShield && events.some(e => e.kind === 'shield' && e.targetId !== actor.id)) target = actor.id;
    if (actor.catalogId === 'soot' && events.some(e => e.kind === 'detonate' && e.amount > 0) && ownShield > 0) target = actor.id;
    if (actor.catalogId === 'clover' && !previous.passiveUsed && actor.passiveUsed) {
      // heal() emits this dispel immediately after the first patient heal.
      const heal = events.findIndex(e => e.kind === 'heal');
      const cleanse = events[heal + 1];
      if (heal >= 0 && cleanse?.kind === 'dispel' && cleanse.targetId === events[heal]!.targetId) target = cleanse.targetId;
    }
    if (actor.catalogId === 'panko' && events.some(e => e.kind === 'action' && e.skillId === 'defend') && events.some(e => e.kind === 'status' && e.text === 'Saucer riposte')) target = actor.id;
    if (target) targets[`${actor.catalogId}-passive`] = target;
  }
  return Object.keys(targets).length ? { presentationCues: Object.keys(targets), presentationCueTargets: targets } : {};
}
