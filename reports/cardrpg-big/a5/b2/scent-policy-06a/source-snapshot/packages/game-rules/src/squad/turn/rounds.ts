import type { RoundSlot, TurnBattle } from './types';

/** Stable tie order; reading a preview never consumes the battle RNG. */
function tie(seed: number, id: string): number {
  let h = seed >>> 0;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13;
  return h >>> 0;
}
export function orderForRound(b: TurnBattle, round = b.round): RoundSlot[] {
  return b.actors.filter(a => a.hp > 0).sort((a, z) => z.initiative - a.initiative ||
    tie(b.seed, a.id) - tie(b.seed, z.id) || a.id.localeCompare(z.id))
    .map(a => ({ actorId: a.id, round }));
}
/** Reorder only a pending action. No extra actions, fractional values or hidden schedule. */
export function moveInRound(b: TurnBattle, id: string, steps: number): boolean {
  if (b.result || id === b.activeId || !Number.isFinite(steps)) return false;
  const from = b.queue.findIndex(s => s.actorId === id);
  if (from < 0 || !b.actors.some(a => a.id === id && a.hp > 0)) return false;
  const to = Math.max(0, Math.min(b.queue.length - 1, from + Math.trunc(steps)));
  if (from === to) return false;
  const [entry] = b.queue.splice(from, 1); b.queue.splice(to, 0, entry!); return true;
}
/** This round's remaining participants followed by the complete next round. */
export function getTimeline(b: TurnBattle, n = Infinity): RoundSlot[] {
  if (b.result || Number.isNaN(n) || n <= 0) return [];
  const alive = new Set(b.actors.filter(a => a.hp > 0).map(a => a.id));
  const remaining = b.queue.filter(s => alive.has(s.actorId));
  if (b.activeId && alive.has(b.activeId)) remaining.unshift({ actorId: b.activeId, round: b.round });
  return [...remaining, ...orderForRound(b, b.round + 1)].slice(0, n).map(s => ({ ...s,
    ...(b.intents[s.actorId] && b.intents[s.actorId]!.countdown === s.round - b.round
      ? { intent: { ...b.intents[s.actorId]!, targetIds: [...b.intents[s.actorId]!.targetIds] } } : {}),
  }));
}
