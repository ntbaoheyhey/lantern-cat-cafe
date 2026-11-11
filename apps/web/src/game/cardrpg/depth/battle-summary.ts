import type { Battle } from '@taskbar-hero/game-rules/src/cardrpg/depth/contract';
import { SKILLS } from '@taskbar-hero/game-rules/src/cardrpg/depth/catalog';

const damageKinds = new Set(['damage', 'dot', 'detonate', 'shared', 'reflect', 'reaction-damage']);

export function summarizeBattle(battle: Battle) {
  const cats = battle.actors.filter(actor => actor.side === 'party').map(actor => ({
    id: actor.id, name: actor.name, catalogId: actor.catalogId, damage: 0, healing: 0, taken: 0, shielding: 0,
  }));
  for (const event of battle.log) {
    const source = cats.find(cat => cat.id === event.actorId);
    const target = cats.find(cat => cat.id === event.targetId);
    if (damageKinds.has(event.kind)) {
      if (source && !target) source.damage += event.amount;
      if (target) target.taken += event.amount;
    }
    if (source && event.kind === 'heal') source.healing += event.amount;
    if (source && event.kind === 'shield') source.shielding += event.amount;
  }
  const contribution = (cat: typeof cats[number]) => cat.damage + cat.healing + cat.shielding * .25;
  const mvp = [...cats].sort((a, b) => contribution(b) - contribution(a))[0];
  // A selected ultimate can be cancelled by Bleed before it is cast. A6 records actual casts separately.
  const cast = battle.initial.gameplayA6 ? battle.v4?.events.find(event => event.kind === 'ultimate.cast'
    && cats.some(cat => cat.id === event.actorId)) : undefined;
  const legacyCast = !battle.initial.gameplayA6 ? battle.log.find(event => event.kind === 'action'
    && event.text !== 'Bleed prevented the action' && SKILLS[event.skillId]?.type === 'ultimate') : undefined;
  const firstUltimate = cast?.kind === 'ultimate.cast' && cast.actorId
    ? { round: cast.round, actorId: cast.actorId, skillId: cast.skillId, displayName: cast.displayName }
    : legacyCast ? { ...legacyCast, displayName: SKILLS[legacyCast.skillId]!.name } : undefined;
  const biggestHit = battle.log.filter(event => damageKinds.has(event.kind) && event.amount > 0).sort((a, b) => b.amount - a.amount)[0];
  const saves = battle.log.filter(event => event.kind === 'survive' || event.kind === 'revive');
  return { cats, mvp, firstUltimate, biggestHit, saves };
}
