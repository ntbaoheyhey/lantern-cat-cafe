import { describe, expect, it } from 'vitest';
import { advanceBattle, commandBattle, createBattle, exportReplay, hasStatus, inRadius, replayBattle, selectTarget, shieldOf } from './battle';
import { HERO_KITS } from './content';
import type { Actor, Battle, SkillId } from './types';

function finish(s: Battle) { for (let i = 0; i < 200 && !['won', 'lost'].includes(s.phase); i++) s = advanceBattle(s, 1000); return s; }
function actor(s: Battle, id: string) { return s.actors.find(a => a.id === id)!; }
function cast(s: Battle, source: Actor, skill: SkillId, targets: Actor[]) {
  source.cast = { skill, start: 0, release: 1, impact: 2, end: 5, released: false, targets: targets.map(a => a.id), point: { x: targets[0]!.x, y: targets[0]!.y } };
  for (const a of s.actors) {
    a.cooldowns = Object.fromEntries(['basic', 'bash', 'rally', 'hearthwall', 'snare', 'orb', 'lanternstorm', 'milk', 'moss', 'shelter', 'mend', 'charge', 'volley', 'thread', 'sweep'].map(id => [id, 9999]));
  }
  return advanceBattle(s, 100);
}

describe('squad combat slice', () => {
  it('has three independent heroes and a five-role catalogue with fifteen activated skills', () => {
    const s = createBattle(), team = s.actors.filter(a => a.side === 'hero');
    expect(team).toHaveLength(3);
    expect(new Set(team.map(a => a.id)).size).toBe(3);
    expect(Object.values(HERO_KITS).flatMap(k => [...k.abilities, k.ultimate])).toHaveLength(15);
    expect(Object.values(HERO_KITS).every(k => k.passive.length > 0)).toBe(true);
    expect(new Set(s.actors.map(a => a.statuses)).size).toBe(s.actors.length);
  });
  it('does not mutate an input snapshot or command log', () => {
    const s = createBattle(), before = JSON.stringify(s);
    commandBattle(s, { type: 'auto', enabled: false }); advanceBattle(s, 5000);
    expect(JSON.stringify(s)).toBe(before);
  });
  it('reproduces the complete event stream across update rates', () => {
    const total = 10000;
    let fast = createBattle({ seed: 4 }), slow = createBattle({ seed: 4 });
    for (let elapsed = 0; elapsed < total; elapsed += 16) fast = advanceBattle(fast, Math.min(16, total - elapsed));
    for (let elapsed = 0; elapsed < total; elapsed += 137) slow = advanceBattle(slow, Math.min(137, total - elapsed));
    expect(fast).toEqual(slow);
  });
  it('replays manual targets, tactics and ultimates with the same resolved outcomes', () => {
    let s = createBattle(); s = commandBattle(s, { type: 'auto', enabled: false });
    s = commandBattle(s, { type: 'focus', target: s.actors.find(a => a.role === 'slinger')!.id });
    s = advanceBattle(s, 12000); s = commandBattle(s, { type: 'ultimate', actor: 'cat-1' });
    s = commandBattle(s, { type: 'tactic', tactic: 'backline' }); s = finish(s);
    expect(s.commands.some(c => c.command.type === 'ultimate')).toBe(true);
    expect(replayBattle(exportReplay(s))).toEqual(s);
  });
  it('keeps the same tick at fractional 30/60 Hz frame boundaries', () => {
    let sixty = createBattle(), thirty = createBattle();
    for (let i = 0; i < 600; i++) sixty = advanceBattle(sixty, 1000 / 60);
    for (let i = 0; i < 300; i++) thirty = advanceBattle(thirty, 1000 / 30);
    expect(sixty.tick).toBe(200); expect(thirty.tick).toBe(200);
    expect(sixty.events).toEqual(thirty.events); expect(sixty.actors).toEqual(thirty.actors);
  });
  it('uses focus, backline tactics and taunt before default targets', () => {
    let s = createBattle(); const witch = actor(s, 'cat-1'), slinger = s.actors.find(a => a.role === 'slinger')!;
    s = commandBattle(s, { type: 'focus', target: slinger.id }); expect(selectTarget(s, witch)?.id).toBe(slinger.id);
    s = commandBattle(s, { type: 'focus', target: null }); s = commandBattle(s, { type: 'tactic', tactic: 'backline' });
    expect(selectTarget(s, witch)?.id).toBe(slinger.id);
    actor(s, 'cat-0').statuses.push({ kind: 'taunt', until: 99, source: 'cat-0', value: 0 });
    expect(selectTarget(s, slinger)?.id).toBe('cat-0');
  });
  it('includes the exact AoE boundary and excludes the next pixel', () => {
    expect(inRadius({ x: 0, y: 0 }, { x: 75, y: 100 }, 125)).toBe(true);
    expect(inRadius({ x: 0, y: 0 }, { x: 75, y: 101 }, 125)).toBe(false);
    const s = createBattle(), target = s.actors[3]!, inside = s.actors[4]!, outside = s.actors[5]!;
    inside.x = target.x + 125; inside.y = target.y; outside.x = target.x + 126; outside.y = target.y;
    inside.home = { x: inside.x, y: inside.y }; outside.home = { x: outside.x, y: outside.y };
    const result = cast(s, actor(s, 'cat-1'), 'orb', [target]);
    expect(actor(result, inside.id).hp).toBeLessThan(inside.hp);
    expect(actor(result, outside.id).hp).toBe(outside.hp);
  });
  it('lets a projectile miss a dead target without transferring damage', () => {
    const s = createBattle(), target = s.actors[3]!, other = s.actors[4]!; target.hp = 0;
    const result = cast(s, actor(s, 'cat-1'), 'basic', [target]);
    expect(actor(result, other.id).hp).toBe(other.hp);
    expect(result.events.some(e => e.type === 'impact' && e.text === 'Miss')).toBe(true);
  });
  it('gives the stationary boss a traveling basic attack before damage resolves', () => {
    let s = createBattle({ scenario: 'boss' });
    const boss = s.actors.find(a => a.role === 'yarn')!;
    s = advanceBattle(s, 900);
    const attack = actor(s, boss.id).cast!;
    expect(attack.skill).toBe('basic');
    expect(attack.impact).toBeGreaterThan(attack.release);
    s = advanceBattle(s, (attack.release - s.tick) * 50);
    expect(s.events.some(e => e.source === boss.id && e.type === 'release')).toBe(true);
    expect(s.events.some(e => e.source === boss.id && e.type === 'impact')).toBe(false);
    s = advanceBattle(s, (attack.impact - s.tick) * 50);
    expect(s.events.some(e => e.source === boss.id && e.type === 'impact')).toBe(true);
  });
  it('resolves hits at actual contact positions and returns melee actors to their anchors', () => {
    let s = createBattle(), source = actor(s, 'cat-0'), target = s.actors[3]!;
    s = cast(s, source, 'basic', [target]);
    const hit = s.events.find(e => e.type === 'impact' && e.source === source.id)!;
    expect(hit.point).toEqual({ x: actor(s, target.id).x, y: actor(s, target.id).y });
    expect(actor(s, source.id).x).toBe(actor(s, target.id).x - 45);
    s = advanceBattle(s, 1000);
    expect({ x: actor(s, source.id).x, y: actor(s, source.id).y }).toEqual(source.home);
  });
  it('AoE tests a moving actor position, not its formation anchor', () => {
    const s = createBattle(), target = s.actors[3]!, moving = s.actors[5]!;
    moving.home = { x: target.x + 300, y: target.y }; moving.x = target.x + 40; moving.y = target.y;
    moving.statuses.push({ kind: 'snare', until: 30, source: 'cat-1', value: 0 });
    const result = cast(s, actor(s, 'cat-1'), 'orb', [target]);
    expect(actor(result, moving.id).hp).toBeLessThan(moving.hp);
  });
  it('heals before the soft-landing shield and caps overhealing', () => {
    const s = createBattle(), target = actor(s, 'cat-0'); target.hp -= 30;
    const result = cast(s, actor(s, 'cat-2'), 'milk', [target]), healed = actor(result, target.id);
    expect(healed.hp).toBe(healed.maxHp); expect(shieldOf(healed)).toBe(18);
    const effects = result.events.filter(e => e.type === 'heal' || e.type === 'shield');
    expect(effects.map(e => e.type)).toEqual(['heal', 'shield']); expect(effects[0]?.amount).toBe(30);
  });
  it('absorbs damage with a shield before HP and does not stack burn instances', () => {
    const s = createBattle(), target = s.actors[3]!;
    target.statuses.push({ kind: 'shield', until: 90, source: target.id, value: 500 }, { kind: 'burn', until: 60, source: 'cat-1', value: 7, next: 20 });
    const result = cast(s, actor(s, 'cat-1'), 'orb', [target]), hit = actor(result, target.id);
    expect(hit.hp).toBe(target.hp); expect(shieldOf(hit)).toBeLessThan(500);
    expect(hit.statuses.filter(x => x.kind === 'burn')).toHaveLength(1);
  });
  it('interrupts a windup, triggers Steadfast, and respects control resistance', () => {
    const s = createBattle(), target = s.actors[3]!;
    target.cast = { skill: 'charge', start: 0, release: 20, impact: 20, end: 25, targets: ['cat-1'], point: actor(s, 'cat-1'), released: false };
    let result = cast(s, actor(s, 'cat-0'), 'bash', [target]);
    expect(actor(result, target.id).cast).toBeNull(); expect(shieldOf(actor(result, 'cat-0'))).toBe(35);
    expect(result.events.some(e => e.type === 'interrupt')).toBe(true);
    result = createBattle({ scenario: 'boss' }); const boss = result.actors[3]!; boss.break = 80;
    result = cast(result, actor(result, 'cat-0'), 'bash', [boss]);
    expect(actor(result, boss.id).break).toBe(0); expect(actor(result, boss.id).controlImmuneUntil).toBeGreaterThan(100);
    expect(hasStatus(actor(result, boss.id), 'exposed')).toBe(true);
  });
  it('binding creates a separate knot and killing it frees the cat', () => {
    let s = createBattle({ scenario: 'boss' }), target = actor(s, 'cat-1');
    s = cast(s, s.actors[3]!, 'thread', [target]);
    const knot = s.actors.find(a => a.role === 'knot')!;
    expect(knot.linkedTo).toBe(target.id); expect(hasStatus(actor(s, target.id), 'bound')).toBe(true);
    s.tick = 0; s.actors.forEach(a => { a.cast = null; }); actor(s, 'cat-0').attack = 999;
    s = cast(s, actor(s, 'cat-0'), 'basic', [knot]);
    expect(hasStatus(actor(s, target.id), 'bound')).toBe(false);
  });
  it('boss sweep resolves the marked lane at impact, including entrants and excluding actors outside it', () => {
    const s = createBattle({ scenario: 'boss' }), outsider = actor(s, 'cat-2');
    outsider.y = 350; outsider.home = { x: outsider.x, y: 350 };
    const result = cast(s, s.actors[3]!, 'sweep', [actor(s, 'cat-0')]);
    expect(actor(result, 'cat-1').hp).toBeLessThan(actor(s, 'cat-1').hp);
    expect(actor(result, outsider.id).hp).toBe(outsider.hp);
  });
  it('settles each wave budget once, never per damage effect', () => {
    const result = finish(createBattle());
    expect(result.phase).toBe('won'); expect(result.settlements.map(x => x.wave)).toEqual([0, 1, 2, 3]);
    expect(result.settlements.reduce((n, x) => n + x.budget, 0)).toBe(670);
    expect(advanceBattle(result, 90000)).toBe(result);
    expect(result.events.filter(e => e.type === 'settle')).toHaveLength(4);
  });
  it('carries damage between waves and restores HP only on a new encounter', () => {
    let s = createBattle(); actor(s, 'cat-0').hp = 123;
    s.actors.filter(a => a.side === 'enemy').forEach(a => { a.hp = 0; });
    s = advanceBattle(s, 50); expect(s.phase).toBe('between');
    s = advanceBattle(s, 1800); expect(s.wave).toBe(1); expect(actor(s, 'cat-0').hp).toBe(123);
    expect(actor(createBattle(), 'cat-0').hp).toBe(520);
  });
  it('stress encounter starts at the eight-enemy cap and always terminates', () => {
    const s = createBattle({ scenario: 'crowd' });
    expect(s.actors.filter(a => a.side === 'enemy')).toHaveLength(8);
    const result = finish(s); expect(['won', 'lost']).toContain(result.phase);
    expect(result.events.filter(e => e.type === 'spawn')).toHaveLength(8);
  });
  it('both compositions complete full-auto patrols across twelve seeds', () => {
    const rows = [];
    for (const preset of ['hearth', 'cinders'] as const) for (let seed = 1; seed <= 12; seed++) {
      const s = finish(createBattle({ seed, preset }));
      rows.push({ preset, seed, outcome: s.phase, seconds: s.tick / 20, survivors: s.actors.filter(a => a.side === 'hero' && a.hp > 0).length });
      expect(s.phase, `${preset} seed ${seed}`).toBe('won');
    }
    expect(rows).toHaveLength(24);
  });
  it('active targeting changes resolved outcomes', () => {
    const auto = finish(createBattle({ seed: 17 }));
    const active = finish(commandBattle(createBattle({ seed: 17 }), { type: 'tactic', tactic: 'backline' }));
    expect(active.events).not.toEqual(auto.events);
    expect(active.actors.filter(a => a.side === 'hero').map(a => a.received)).not.toEqual(auto.actors.filter(a => a.side === 'hero').map(a => a.received));
  });
  it('rejects invalid time and unsupported replay versions', () => {
    expect(() => advanceBattle(createBattle(), Number.NaN)).toThrow();
    expect(() => advanceBattle(createBattle(), -1)).toThrow();
    expect(() => replayBattle({ ...exportReplay(createBattle()), version: 99 })).toThrow();
  });
});
