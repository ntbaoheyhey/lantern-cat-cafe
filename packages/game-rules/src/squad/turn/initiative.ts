import { TURN_CONFIG as C } from './config';
import type { TimelineSlot, TurnActor, TurnBattle } from './types';

export const interval = (a: TurnActor): number => C.initiative.unit / Math.max(C.initiative.minSpeed, a.speed);
/** Seeded initial tie order. No RNG state is read or consumed by any preview. */
function tie(seed: number, id: string): number {
  let h = seed >>> 0;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13;
  return h >>> 0;
}
export function insertSlot(b: TurnBattle, queue: TimelineSlot[], slot: TimelineSlot): void {
  if (queue.some(s => s.actorId === slot.actorId)) return;
  const index = queue.findIndex(s => s.at > slot.at || (s.at === slot.at &&
    (tie(b.seed, s.actorId) > tie(b.seed, slot.actorId) ||
      (tie(b.seed, s.actorId) === tie(b.seed, slot.actorId) && s.actorId > slot.actorId))));
  queue.splice(index < 0 ? queue.length : index, 0, slot);
}
/** Move one pending slot; active actors cannot be moved or duplicated. */
export function moveSlot(b: TurnBattle, id: string, slots: number): boolean {
  if (b.result || id === b.activeId || !Number.isFinite(slots)) return false;
  const from = b.queue.findIndex(s => s.actorId === id);
  if (from < 0 || !b.actors.some(a => a.id === id && a.hp > 0)) return false;
  const to = Math.max(0, Math.min(b.queue.length - 1, from + Math.trunc(slots)));
  if (from === to) return false;
  const [entry] = b.queue.splice(from, 1);
  const left = b.queue[to - 1]?.at ?? b.clock;
  const right = b.queue[to]?.at;
  entry!.at = right === undefined ? left + interval(b.actors.find(a => a.id === id)!) : (left + right) / 2;
  // Queue order is authoritative for equal times created by explicit moves.
  b.queue.splice(to, 0, entry!);
  return true;
}
export function getTimeline(b: TurnBattle, n: number = C.preview): TimelineSlot[] {
  if (b.result || !Number.isFinite(n) || n <= 0) return [];
  const actors = new Map(b.actors.filter(a => a.hp > 0).map(a => [a.id, a]));
  const queue = b.queue.filter(s => actors.has(s.actorId)).map(s => ({ actorId: s.actorId, at: s.at }));
  if (b.activeId && actors.has(b.activeId)) queue.unshift({ actorId: b.activeId, at: b.clock });
  const out: TimelineSlot[] = [], seen = new Set<string>();
  while (queue.length && out.length < Math.floor(n)) {
    const slot = queue.shift()!, intent = !seen.has(slot.actorId) ? b.intents[slot.actorId] : undefined;
    out.push({ ...slot, ...(intent ? { intent: { ...intent, targetIds: [...intent.targetIds] } } : {}) });
    seen.add(slot.actorId);
    insertSlot(b, queue, { actorId: slot.actorId, at: slot.at + interval(actors.get(slot.actorId)!) });
  }
  return out;
}
