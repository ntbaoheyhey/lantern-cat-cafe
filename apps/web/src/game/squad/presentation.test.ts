import { describe, expect, it } from 'vitest';
import { ABILITIES, SQUAD_CONFIG as C } from '@taskbar-hero/game-rules/src/squad/config';
import { beginCast, createBattle } from '@taskbar-hero/game-rules/src/squad/engine';
import { createProjection, project } from '@taskbar-hero/game-rules/src/squad/replay';
import { actorPosition, castEnd, firstImpact, hasImpactResidue, lastImpact } from './presentation';
import type { BattleEvent } from '@taskbar-hero/game-rules/src/squad/types';

describe('resolved-event presentation geometry', () => {
  it('keeps actual area hits when same-tick statuses and deaths follow them', () => {
    const events = ['impact', 'status_applied', 'death', 'heal', 'shield', 'passive', 'break'].map((type, seq) =>
      ({ type, seq, version: 1, tick: 1, time: 50, amount: 20 }) as BattleEvent);
    expect(events.filter(hasImpactResidue).map(e => e.type)).toEqual(['impact', 'heal', 'shield', 'passive', 'break']);
    expect(hasImpactResidue({ ...events[0]!, amount: 0 })).toBe(false);
  });
  it('opposed melee attacks meet without passing and return home', () => {
    const b = createBattle(), g = b.actors[0]!, e = b.actors[3]!;
    beginCast(b, g, 'guardianBasic'); beginCast(b, e, 'guardAttack');
    const p = project(createProjection(), b.events);
    for (let t = 0; t <= 450; t += 50) {
      const a = actorPosition(p, g, t, false), z = actorPosition(p, e, t, false);
      expect(a.x).toBeLessThan(z.x);
    }
    const a = actorPosition(p, g, 400, false), z = actorPosition(p, e, 400, false);
    expect(z.x - a.x).toBe(C.presentation.contactDistance); expect(z.y).toBe(a.y);
    expect(actorPosition(p, g, 900, false)).toEqual({ x: g.x, y: g.y });
  });
  it('ranged and calm actors remain at snapped formation anchors', () => {
    const b = createBattle(), g = b.actors[0]!, w = b.actors[1]!;
    beginCast(b, g, 'guardianBasic'); beginCast(b, w, 'witchBasic');
    const p = project(createProjection(), b.events);
    expect(actorPosition(p, g, 400, true)).toEqual({ x: g.x, y: g.y });
    expect(actorPosition(p, w, 400, false)).toEqual({ x: w.x, y: w.y });
  });
  it('crowded attackers select separate reachable contact positions', () => {
    const b = createBattle(), g = b.actors[0]!;
    for (const e of b.actors.filter(a => a.side === 'enemy')) { e.statuses.push({ kind: 'taunt', source: g.id, until: 5000, strength: 1, nextTick: 0 }); beginCast(b, e, e.role + 'Attack'); }
    const p = project(createProjection(), b.events);
    const points = b.actors.filter(a => a.side === 'enemy').map(a => actorPosition(p, a, 300, false));
    expect(new Set(points.map(p => `${p.x},${p.y}`)).size).toBe(points.length);
    for (const p of points) expect(Math.hypot(p.x - g.x, p.y - g.y)).toBeLessThanOrEqual(C.presentation.contactReach);
    for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++)
      expect(Math.hypot(points[i]!.x - points[j]!.x, points[i]!.y - points[j]!.y)).toBeGreaterThanOrEqual(C.presentation.contactClearance);
  });
  it('all three storm strikes and the moss patch have complete lifetimes', () => {
    const b = createBattle(), w = b.actors[1]!, a = b.actors[2]!;
    w.charge = 100; w.cooldowns.lanternstorm = 0; a.cooldowns.mossFlask = 0;
    beginCast(b, w, 'lanternstorm'); beginCast(b, a, 'mossFlask');
    const storm = b.casts[0]!, moss = b.casts[1]!;
    expect(lastImpact(storm) - firstImpact(storm)).toBe(C.stormSpacingMs * 2);
    expect(castEnd(moss)).toBe(firstImpact(moss) + ABILITIES.mossFlask!.durationMs!);
  });
});
