import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { CONFIG } from '../config';
import { ABILITIES, HEROES, KITS, SQUAD_CONFIG as C } from './config';
import { advance, applyStatus, beginCast, cleanse, createBattle, damage, heal, interrupt, makeActor, queueCommand, run, shield, step } from './engine';
import { buffedAttack, cooldown, has, inArea, interval, mitigated, selectTarget } from './rules';
import { createProjection, decodeCommands, encodeCommands, project, replayCommands } from './replay';
import type { Actor, Battle, Hero, Preset, Role } from './types';

const party = (b: Battle) => b.actors.filter(a => a.side === 'party');
const foes = (b: Battle) => b.actors.filter(a => a.side === 'enemy');
const idle = (b: Battle) => { for (const a of b.actors) { a.nextBasic = Infinity; a.auto = false; for (const k of Object.keys(ABILITIES)) a.cooldowns[k] = Infinity; } return b; };
const ready = (a: Actor, skill: string) => { a.cooldowns[skill] = 0; a.castId = null; };

describe('squad local boundary and content', () => {
  it('is default off and has a distinct log format', () => {
    expect(CONFIG.features.squadCombat).toBe(false);
    expect(createBattle().version).toBe(1);
    expect(() => decodeCommands('{"version":2,"commands":[]}')).toThrow();
  });
  it('has three independent heroes, nine activated skills and five ordinary roles plus elite', () => {
    const b = createBattle();
    expect(new Set(b.actors.map(a => a.id)).size).toBe(7);
    expect(HEROES.flatMap(h => KITS[h])).toHaveLength(9);
    expect(new Set(C.waves.flatMap(w => [...w.roles]))).toEqual(new Set(['guard', 'flanker', 'ranger', 'healer', 'charger', 'elite']));
    expect(party(b).map(a => a.hp)).toEqual([683, 381, 426]);
  });
  it.each(Object.entries(ABILITIES))('%s has an explicit effect contract', (_id, a) => {
    expect(a.shape).toBeTruthy(); expect(a.description.length).toBeGreaterThan(10);
    expect(a.windupMs).toBeGreaterThanOrEqual(a.heavy || a.ultimate && a.shape === 'storm' ? 800 : 150);
    expect(a.windupMs).toBeLessThanOrEqual(a.heavy || a.shape === 'storm' ? 1500 : 350);
    expect(a.travelMs).toBeGreaterThan(0);
    expect(a.windupMs % C.tickMs).toBe(0); expect(a.travelMs % C.tickMs).toBe(0);
  });
});

describe('targeting and numerical rules', () => {
  it('selects nearest front, rear, and the most injured fraction', () => {
    const b = createBattle(), [g, w, a] = party(b);
    expect(selectTarget(b, g!, 'front')!.role).toBe('guard');
    expect(selectTarget(b, foes(b)[0]!, 'rear')!.side).toBe('party');
    w!.hp = w!.maxHp / 2; a!.hp = a!.maxHp / 3;
    expect(selectTarget(b, g!, 'injured')!.id).toBe('alchemist');
  });
  it('marks a backline caster and lets living taunt override it', () => {
    const b = createBattle({ wave: 1 }), g = party(b)[0]!, healer = foes(b).find(a => a.role === 'healer')!;
    b.priority = healer.id; expect(selectTarget(b, g, 'front')!.id).toBe(healer.id);
    const guard = foes(b)[0]!; applyStatus(b, guard, g, 'taunt', 2000);
    expect(selectTarget(b, g, 'front')!.id).toBe(guard.id);
    guard.hp = 0; expect(selectTarget(b, g, 'front')!.id).toBe(healer.id);
  });
  it('caster tactic finds healer; protect tactic finds binding thread', () => {
    const b = createBattle({ wave: 1 }); b.tactic = 'caster';
    expect(selectTarget(b, party(b)[1]!, 'front')!.role).toBe('healer');
    const t = makeActor('thread', 7, 'thread'); b.actors.push(t); b.tactic = 'protect';
    expect(selectTarget(b, party(b)[1]!, 'front')!.id).toBe('thread');
  });
  it('includes the exact AoE boundary and excludes the next point', () => {
    expect(inArea({ x: 3, y: 4 }, { x: 0, y: 0 }, 5)).toBe(true);
    expect(inArea({ x: 3, y: 4.01 }, { x: 0, y: 0 }, 5)).toBe(false);
  });
  it('defense has diminishing returns and guard caps once', () => {
    expect(mitigated(100, 80)).toBe(50); expect(mitigated(100, 240)).toBe(25);
    expect(mitigated(100, 80, 10)).toBe(25); expect(mitigated(100, 0)).toBe(100);
  });
  it('caps attack speed, cooldown reduction and additive buffs', () => {
    const s = { ...C.stats.guardian, speed: 900, cdr: 900 };
    expect(interval(s)).toBe(Math.ceil(s.intervalMs / (1 + C.caps.speed) / C.tickMs) * C.tickMs);
    expect(cooldown(10000, s)).toBe(6500);
    expect(buffedAttack(100, [0.2, 0.2, 0.2])).toBe(130);
    expect(buffedAttack(100, [0.1, 0.1, 0.1])).toBe(130);
  });
  it('defense and buffs remain finite for ordinary bounded inputs', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 10000 }), fc.integer({ min: 0, max: 10000 }), (atk, def) => {
      expect(mitigated(atk, def)).toBeGreaterThanOrEqual(1);
      expect(mitigated(atk, def)).toBeLessThanOrEqual(Math.max(1, atk));
    }));
  });
});

describe('casts, impacts, support and control', () => {
  it('fizzles hostile projectiles when their locked target dies', () => {
    const b = idle(createBattle()), w = party(b)[1]!, t = foes(b)[0]!;
    ready(w, 'witchBasic'); beginCast(b, w, 'witchBasic'); advance(b, 250); t.hp = 0; advance(b, 300);
    expect(b.events.some(e => e.type === 'fizzle')).toBe(true);
    expect(b.events.filter(e => e.type === 'impact')).toHaveLength(0);
  });
  it('retargets a healing flask if its injured ally dies in flight', () => {
    const b = idle(createBattle()), [g, w, a] = party(b); g!.hp = 1; w!.hp = 80;
    ready(a!, 'milkFlask'); beginCast(b, a!, 'milkFlask'); advance(b, 250); g!.hp = 0; advance(b, 650);
    expect(b.events.find(e => e.type === 'retarget')?.target).toBe(w!.id);
    expect(w!.hp).toBeGreaterThan(80);
  });
  it('launched attacks survive caster death; unreleased attacks interrupt', () => {
    const b = idle(createBattle()), w = party(b)[1]!, t = foes(b)[0]!;
    ready(w, 'witchBasic'); beginCast(b, w, 'witchBasic'); advance(b, 250); w.hp = 0; advance(b, 300);
    expect(t.hp).toBeLessThan(t.maxHp);
    ready(t, 'guardAttack'); beginCast(b, t, 'guardAttack');
    expect(interrupt(b, t, party(b)[0]!)).toBe(true);
    expect(b.events.some(e => e.type === 'interrupt')).toBe(true);
  });
  it('area burst resolves each living actor inside the locked zone', () => {
    const b = idle(createBattle()), w = party(b)[1]!, [t, inside, outside] = foes(b);
    inside!.x = t!.x + ABILITIES.emberOrb!.radius!; inside!.y = t!.y;
    outside!.x = inside!.x + 1; outside!.y = t!.y;
    ready(w, 'emberOrb'); beginCast(b, w, 'emberOrb'); advance(b, 750);
    expect(t!.hp).toBeLessThan(t!.maxHp); expect(inside!.hp).toBeLessThan(inside!.maxHp);
    expect(outside!.hp).toBe(outside!.maxHp);
  });
  it('heals HP before granting capped shields; shields absorb before HP', () => {
    const b = idle(createBattle()), g = party(b)[0]!, a = party(b)[2]!, e = foes(b)[0]!;
    g.hp = 100; heal(b, a, g, 20, 'milkFlask'); shield(b, a, g, 100000, 'test');
    expect(g.hp).toBeGreaterThan(100); expect(g.shield).toBe(Math.round(g.maxHp * C.caps.shieldFraction));
    const hp = g.hp, before = g.shield; damage(b, e, g, 10, 'test', false);
    expect(g.hp).toBe(hp); expect(g.shield).toBeLessThan(before);
    expect(b.events.findIndex(e => e.type === 'heal')).toBeLessThan(b.events.findIndex(e => e.type === 'shield'));
  });
  it('never revives a dead actor with a heal or shield', () => {
    const b = createBattle(), [g, , a] = party(b); g!.hp = 0;
    heal(b, a!, g!, 200, 'test'); shield(b, a!, g!, 200, 'test');
    expect(g!.hp).toBe(0); expect(g!.shield).toBe(0);
  });
  it('caps burn stacks, ticks them, expires them and preserves beneficial guard on cleanse', () => {
    const b = idle(createBattle()), g = party(b)[0]!, e = foes(b)[0]!;
    for (let i = 0; i < 8; i++) applyStatus(b, g, e, 'burn', 2500);
    expect(e.statuses[0]!.strength).toBe(C.caps.burn); const hp = e.hp; advance(b, 1000); expect(e.hp).toBeLessThan(hp);
    applyStatus(b, g, e, 'guard', 3000, C.guardFraction); cleanse(b, g, e);
    expect(has(e, 'burn')).toBe(false); expect(has(e, 'guard')).toBe(true); advance(b, 3000); expect(has(e, 'guard')).toBe(false);
  });
  it('interrupt triggers Guardian passive and control cannot be chained forever', () => {
    const b = idle(createBattle()), g = party(b)[0]!, e = foes(b).find(a => a.role === 'charger')!;
    ready(e, 'chargerAttack'); beginCast(b, e, 'chargerAttack');
    expect(applyStatus(b, g, e, 'stun', 2000)).toBe(true); expect(g.shield).toBeGreaterThan(0);
    expect(applyStatus(b, g, e, 'stun', 9000)).toBe(false);
    advance(b, C.control.continuousMs + C.control.immuneMs);
    applyStatus(b, g, e, 'stun', 2000);
    expect(e.statuses.find(s => s.kind === 'stun')!.until - b.time).toBeLessThan(2000);
  });
  it('Witch burning-hit passive grants charge; Alchemist injured heal grants shield', () => {
    const b = createBattle(), [g, w, a] = party(b), e = foes(b)[0]!;
    applyStatus(b, w!, e, 'burn', 2000); const charge = w!.charge; damage(b, w!, e, 20, 'test', false);
    expect(w!.charge).toBeGreaterThan(charge + C.ultimate.perHit);
    g!.hp = 20; heal(b, a!, g!, 30, 'test'); expect(g!.shield).toBeGreaterThan(0);
    expect(b.events.filter(e => e.type === 'passive').map(e => e.skill)).toEqual(['warmWick', 'lastSip']);
  });
  it('Rally redirects an unreleased charge and guards its target', () => {
    const b = idle(createBattle()), g = party(b)[0]!, e = foes(b).find(a => a.role === 'charger')!;
    ready(e, 'chargerAttack'); beginCast(b, e, 'chargerAttack');
    ready(g, 'rally'); beginCast(b, g, 'rally'); advance(b, 550);
    expect(has(g, 'guard')).toBe(true); expect(has(e, 'taunt')).toBe(true);
    expect(b.events.some(e => e.type === 'retarget' && e.target === g.id)).toBe(true);
  });
  it('taunt cannot collapse a ground sweep into a single-target attack', () => {
    const b = idle(createBattle({ encounter: 'boss' })), g = party(b)[0]!, boss = foes(b)[0]!;
    ready(boss, 'crossSweep'); beginCast(b, boss, 'crossSweep');
    ready(g, 'rally'); beginCast(b, g, 'rally'); advance(b, 550);
    expect(b.casts.find(c => c.skill === 'crossSweep')!.targets).toHaveLength(3);
  });
  it('Nine-Lives cleanses, heals, then shields all living heroes', () => {
    const b = idle(createBattle()), a = party(b)[2]!, enemy = foes(b)[0]!;
    for (const h of party(b)) { h.hp = 100; applyStatus(b, enemy, h, 'burn', 5000); }
    a.charge = C.ultimate.max; ready(a, 'nineLives'); beginCast(b, a, 'nineLives'); advance(b, 550);
    expect(party(b).every(h => !has(h, 'burn') && h.hp > 100 && h.shield > 0)).toBe(true);
  });
  it('Lanternstorm hits three times from a single marked cast', () => {
    const b = idle(createBattle({ encounter: 'dummy' })), w = party(b)[1]!;
    w.charge = C.ultimate.max; ready(w, 'lanternstorm'); beginCast(b, w, 'lanternstorm'); advance(b, 2300);
    expect(b.events.filter(e => e.type === 'impact' && e.skill === 'lanternstorm')).toHaveLength(3);
    expect(w.charge).toBeLessThan(C.ultimate.max);
  });
  it.each(['hearthkeepers', 'lanternbreakers'] as Preset[])('%s gear changes behavior', preset => {
    const b = idle(createBattle({ preset })), [g, w, a] = party(b);
    if (preset === 'hearthkeepers') {
      g!.hp = 100; heal(b, a!, g!, 100, 'milkFlask');
      expect(b.events.some(e => e.skill === 'lastLight')).toBe(true);
    } else {
      ready(w!, 'witchBasic'); beginCast(b, w!, 'witchBasic'); advance(b, 550);
      expect(b.events.some(e => e.skill === 'needleLantern')).toBe(true);
    }
  });
});

describe('encounters, threat and boss mechanics', () => {
  it('plays the authored intercept, three-foe snare, burst and injured-Guardian heal', () => {
    const b = createBattle({ seed: C.defaultSeed }); advance(b, 6500);
    const snare = b.events.find(e => e.type === 'cast_start' && e.skill === 'threadSnare')!;
    const orb = b.events.find(e => e.type === 'cast_start' && e.skill === 'emberOrb')!;
    const charge = b.events.find(e => e.type === 'cast_start' && e.skill === 'chargerAttack')!;
    expect(snare.cast!.targets.map(id => b.actors.find(a => a.id === id)!.role)).toEqual(['guard', 'flanker', 'flanker']);
    expect(orb.cast!.targets).toEqual(snare.cast!.targets);
    expect(charge.target).toBe('guardian');
    const milk = b.events.find(e => e.type === 'heal' && e.skill === 'milkFlask')!;
    expect(milk.target).toBe('guardian'); expect(milk.amount).toBeGreaterThan(0);
    expect(milk.time).toBeGreaterThan(orb.time);
  });
  it('persists hero HP across all three waves and settles rewards exactly once', () => {
    const b = idle(createBattle()), g = party(b)[0]!; g.hp = 123;
    for (let i = 0; i < 3; i++) {
      for (const e of foes(b)) e.hp = 0;
      step(b); advance(b, C.wavePauseMs); expect(g.hp).toBe(123);
    }
    expect(b.result?.winner).toBe('party'); expect(b.fishFound).toBe(C.waveFish);
    advance(b, 100000); step(b);
    expect(b.events.filter(e => e.type === 'reward')).toHaveLength(1);
    expect(b.events.filter(e => e.type === 'wave_transition')).toHaveLength(3);
    expect(createBattle().actors[0]!.hp).toBe(createBattle().actors[0]!.maxHp);
  });
  it('offsets routines and caps concurrent heavy windups', () => {
    const b = createBattle({ encounter: 'group' });
    expect(new Set(foes(b).map(a => a.nextBasic)).size).toBe(8);
    for (let i = 0; i < 600; i++) { step(b); expect(b.casts.filter(c => !c.released && ABILITIES[c.skill]!.heavy).length).toBeLessThanOrEqual(1); }
  });
  it('accepts auto and tactic commands during the breath between waves', () => {
    const b = idle(createBattle());
    for (const a of foes(b)) a.hp = 0;
    step(b);
    queueCommand(b, { type: 'auto', hero: 'witch', enabled: false });
    queueCommand(b, { type: 'tactic', value: 'caster' });
    advance(b, C.wavePauseMs);
    expect(b.wave).toBe(1); expect(b.tactic).toBe('caster');
    expect(party(b)[1]!.auto).toBe(false);
    expect(b.events.filter(e => e.type === 'command')).toHaveLength(2);
  });
  it('phase two introduces cross-lane sweeps and enrage increases pressure', () => {
    const b = idle(createBattle({ encounter: 'boss' })), boss = foes(b)[0]!;
    boss.hp = boss.maxHp / 2; step(b); expect(b.phase).toBe(2);
    b.time = C.boss.enrageMs - C.tickMs; b.tick = b.time / C.tickMs; step(b); expect(b.enraged).toBe(true);
    expect(b.events.some(e => e.type === 'enrage')).toBe(true);
    ready(boss, 'crossSweep'); expect(beginCast(b, boss, 'crossSweep')).toBe(true);
    expect(b.casts.find(c => c.skill === 'crossSweep')!.targets).toHaveLength(3);
  });
  it('thread restraint is freed by killing its own actor and exposes the knot', () => {
    const b = idle(createBattle({ encounter: 'boss' })), boss = foes(b)[0]!;
    ready(boss, 'bindThread'); beginCast(b, boss, 'bindThread'); advance(b, 1350);
    const thread = foes(b).find(a => a.role === 'thread')!; expect(thread).toBeTruthy();
    const ally = b.actors.find(a => a.id === thread.boundAlly)!; expect(has(ally, 'restrain')).toBe(true);
    damage(b, party(b)[0]!, thread, 9999, 'test', false);
    expect(has(ally, 'restrain')).toBe(false); expect(has(boss, 'exposed')).toBe(true);
  });
  it('break exposes the knot but repeated control meets resistance', () => {
    const b = createBattle({ encounter: 'boss' }), boss = foes(b)[0]!, g = party(b)[0]!;
    boss.break = C.boss.breakMax - C.boss.bashBreak;
    damage(b, g, boss, 1, 'shieldBash', false);
    expect(has(boss, 'exposed')).toBe(true); expect(boss.break).toBe(0);
    expect(b.events.some(e => e.type === 'break')).toBe(true);
  });
  it('bounds boss adds by the global enemy cap', () => {
    const b = idle(createBattle({ encounter: 'boss' }));
    for (let i = 0; i < C.maxDurationMs / C.tickMs; i++) {
      step(b); const living = foes(b).filter(a => a.hp > 0);
      expect(living.length).toBeLessThanOrEqual(C.maxEnemies);
      expect(new Set(living.map(a => `${a.x},${a.y}`)).size).toBe(living.length);
    }
  });
  it('defeat explains the first casualty and provides an adjustment', () => {
    const b = createBattle(), e = foes(b)[0]!;
    for (const role of ['witch', 'guardian', 'alchemist'] as Hero[]) damage(b, e, b.actors.find(a => a.id === role)!, 99999, 'test', false);
    step(b); expect(b.result?.firstDeath).toBe('witch'); expect(b.result?.cause).toContain('Rear'); expect(b.result?.suggestion).toContain('Needle');
  });
});

describe('deterministic clocks, event projection and command round-trip', () => {
  it.each([50, 60, 144])('same log at %iHz as at fixed simulation ticks', hz => {
    const options = { seed: 47, encounter: 'patrol' as const };
    const expected = run(createBattle(options)), b = createBattle(options);
    while (!b.result) advance(b, 1000 / hz);
    expect(b.events).toEqual(expected.events); expect(b.result).toEqual(expected.result);
  });
  it('survives a long-frame hitch and ignores invalid delta input', () => {
    const b = createBattle({ seed: 7 }); advance(b, NaN); advance(b, -1); expect(b.tick).toBe(0);
    advance(b, 3749); while (!b.result) advance(b, 1000 / 60);
    expect(b.events).toEqual(run(createBattle({ seed: 7 })).events);
  });
  it('replays resolved events to the identical actor state and result, without simulation', () => {
    const b = run(createBattle({ encounter: 'boss' })), p = project(createProjection(), b.events);
    expect(Object.values(p.actors)).toEqual(b.actors); expect(p.result).toEqual(b.result); expect(p.fishFound).toBe(b.fishFound);
  });
  it('round-trips ordered commands and rejects malformed versions/actions', () => {
    const b = createBattle({ seed: 29 });
    queueCommand(b, { type: 'auto', hero: 'witch', enabled: false }, 1);
    queueCommand(b, { type: 'priority', target: foes(b)[1]!.id }, 2);
    queueCommand(b, { type: 'ultimate', hero: 'witch' }, 400);
    queueCommand(b, { type: 'tactic', value: 'caster' }, 500); run(b);
    const log = decodeCommands(encodeCommands(b.commands)); expect(log).toEqual(b.commands);
    expect(replayCommands({ seed: 29 }, log).events).toEqual(b.events);
    expect(() => decodeCommands('{"format":"squad-local-commands","version":1,"commands":[{"version":1,"tick":1,"seq":0,"type":"grant"}]}')).toThrow();
  });
  it('different seeds change rolls; each seed remains reproducible', () => {
    const a = run(createBattle({ seed: 11 })), b = run(createBattle({ seed: 12 }));
    expect(a.events).not.toEqual(b.events);
    expect(a.events).toEqual(run(createBattle({ seed: 11 })).events);
  });
  it('property: bounded HP/shield and finite damage for ten seeds in both presets', () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 99999 }), fc.constantFrom<Preset>('hearthkeepers', 'lanternbreakers'), (seed, preset) => {
      const b = run(createBattle({ seed, preset }));
      for (const a of b.actors) { expect(a.hp).toBeGreaterThanOrEqual(0); expect(a.hp).toBeLessThanOrEqual(a.maxHp); expect(a.shield).toBeLessThanOrEqual(Math.round(a.maxHp * C.caps.shieldFraction)); }
      expect(b.result).not.toBeNull(); expect(Number.isFinite(b.result!.durationMs)).toBe(true);
    }), { numRuns: 10 });
  });
});
