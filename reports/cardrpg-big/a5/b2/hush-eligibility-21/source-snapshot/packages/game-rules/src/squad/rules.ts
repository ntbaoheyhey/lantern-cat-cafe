import { SQUAD_CONFIG as C } from './config';
import type { Actor, Battle, Point, Stats, TargetRule } from './types';

export const alive = (a: Actor) => a.hp > 0;
export const has = (a: Actor, kind: string) => a.statuses.some(s => s.kind === kind);
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export const inArea = (a: Point, center: Point, radius: number) => distance(a, center) <= radius;
export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : lo));
export const tickCeil = (ms: number) => Math.ceil(ms / C.tickMs) * C.tickMs;
export const interval = (s: Stats) => tickCeil(s.intervalMs / (1 + clamp(s.speed ?? 0, 0, C.caps.speed)));
export const cooldown = (ms: number, s: Stats) => tickCeil(ms * (1 - clamp(s.cdr ?? 0, 0, C.caps.cdr)));
/** Add same-kind modifiers once, cap once, then multiply base. Never multiply per source. */
export const buffedAttack = (base: number, buffs: readonly number[]) => base * (1 + clamp(buffs.reduce((a, b) => a + Math.max(0, b), 0), 0, C.caps.attackBuff));
export const mitigated = (attack: number, defense: number, guard = 0) => Math.max(C.minDamage,
  Math.round(attack * C.defenseScale / (C.defenseScale + Math.max(0, defense)) * (1 - clamp(guard, 0, C.caps.guard))));

/** Stable insertion order breaks every tie; IDs persist for an actor's whole lifetime. */
export function selectTarget(b: Battle, source: Actor, rule: TargetRule): Actor | undefined {
  if (rule === 'self') return source;
  const friendly = rule === 'injured' || rule === 'team';
  const candidates = b.actors.filter(a => alive(a) && (friendly ? a.side === source.side : a.side !== source.side));
  if (friendly) return candidates.sort((a, z) => a.hp / a.maxHp - z.hp / z.maxHp)[0];
  const taunt = source.statuses.find(s => s.kind === 'taunt');
  const forced = candidates.find(a => a.id === taunt?.source);
  if (forced) return forced;
  if (source.side === 'party') {
    const marked = candidates.find(a => a.id === b.priority);
    if (marked) return marked;
    if (b.tactic === 'protect') {
      const thread = candidates.find(a => a.role === 'thread');
      if (thread) return thread;
    }
    if (b.tactic === 'caster' || rule === 'caster') {
      const caster = candidates.find(a => a.role === 'healer') ?? candidates.find(a => a.role === 'ranger');
      if (caster) return caster;
    }
  }
  if (source.boundAlly) return candidates.find(a => a.id === source.boundAlly) ?? candidates[0];
  const row = rule === 'rear' ? 'rear' : 'front';
  return candidates.filter(a => a.row === row).sort((a, z) => distance(source, a) - distance(source, z))[0]
    ?? candidates.sort((a, z) => distance(source, a) - distance(source, z))[0];
}

/** Xorshift32; no platform time or global randomness. */
export function random(b: Battle): number {
  let x = b.rng; x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  b.rng = x >>> 0;
  return b.rng / 0x100000000;
}
