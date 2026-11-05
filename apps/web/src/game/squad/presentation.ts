import { ABILITIES, SQUAD_CONFIG as C } from '@taskbar-hero/game-rules/src/squad/config';
import type { Actor, BattleEvent, Cast, Point, Projection } from '@taskbar-hero/game-rules/src/squad/types';

const V = C.presentation;
/** Persistent status icons and defeat poses already communicate those events.
 * They must not evict a resolved hit from the finite impact-effect pool. */
export const hasImpactResidue = (event: BattleEvent): boolean =>
  ['passive', 'break'].includes(event.type)
  || (['impact', 'heal', 'shield'].includes(event.type) && (event.amount ?? 0) > 0);
export const firstImpact = (c: Cast) => c.start + ABILITIES[c.skill]!.windupMs + ABILITIES[c.skill]!.travelMs;
export const lastImpact = (c: Cast) => firstImpact(c) + ((ABILITIES[c.skill]!.hits ?? 1) - 1) * C.stormSpacingMs;
export const castEnd = (c: Cast) => lastImpact(c) + (c.skill === 'mossFlask' ? ABILITIES[c.skill]!.durationMs! : V.returnMs);
export const activeCast = (p: Projection, id: string, time: number) => Object.values(p.casts)
  .filter(c => c.source === id && c.start <= time && time <= lastImpact(c) + V.returnMs)
  .sort((a, b) => b.id - a.id)[0];

/** Presentation-only anchors. Damage and area membership always come from resolved events. */
export function actorPosition(p: Projection, a: Actor, time: number, calm: boolean, visited = new Set<string>()): Point {
  const c = activeCast(p, a.id, time);
  if (calm || !c || !ABILITIES[c.skill]?.melee || visited.has(a.id)) return { x: a.x, y: a.y };
  const target = p.actors[c.targets[0] ?? ''];
  if (!target) return { x: a.x, y: a.y };
  visited.add(a.id);
  const other = activeCast(p, target.id, time);
  const reciprocal = other && other.targets.includes(a.id) && ABILITIES[other.skill]?.melee;
  const toward = reciprocal ? target : actorPosition(p, target, time, calm, visited);
  // Several attackers occupy separate contact lanes instead of the same pixels.
  const peers = Object.values(p.casts).filter(x => x.targets[0] === target.id && ABILITIES[x.skill]?.melee
    && time <= lastImpact(x) + V.returnMs).sort((x, y) => x.source.localeCompare(y.source));
  const sign = a.side === 'party' ? -1 : 1;
  const occupied = Object.values(p.actors).filter(x => x.hp > 0 && x.id !== target.id && x.id !== a.id
    && !peers.some(peer => peer.source === x.id) && !ABILITIES[activeCast(p, x.id, time)?.skill ?? '']?.melee)
    .map(x => ({ x: x.x, y: x.y }));
  let contact: Point = { x: toward.x + sign * V.contactDistance, y: toward.y };
  for (const peer of peers) {
    const actor = p.actors[peer.source]!;
    const candidates = V.contactSlots.map(([dx, dy]) => ({ x: toward.x + sign * dx, y: toward.y + dy }))
      .filter(q => q.y >= V.heroFrame + V.sceneInset && q.y <= V.height - V.sceneInset)
      .sort((x, y) => Math.hypot(x.x - toward.x, x.y - toward.y) - Math.hypot(y.x - toward.x, y.y - toward.y)
        || Math.hypot(x.x - actor.x, x.y - actor.y) - Math.hypot(y.x - actor.x, y.y - actor.y));
    const chosen = candidates.find(q => occupied.every(x => Math.hypot(x.x - q.x, x.y - q.y) >= V.contactClearance)) ?? candidates[0] ?? contact;
    occupied.push(chosen);
    if (peer.id === c.id) contact = chosen;
  }
  if (reciprocal) contact = { x: (a.x + target.x) / 2 + sign * V.contactDistance / 2, y: (a.y + target.y) / 2 };
  const approach = Math.min(1, Math.max(0, (time - c.start) / Math.min(ABILITIES[c.skill]!.windupMs, V.approachMs)));
  const retreat = time > lastImpact(c) ? Math.max(0, 1 - (time - lastImpact(c)) / V.returnMs) : 1;
  return { x: a.x + (contact.x - a.x) * approach * retreat, y: a.y + (contact.y - a.y) * approach * retreat };
}
