import { describe, expect, it } from 'vitest';
import { clone } from '../../internal';
import { createBattle } from '../battle';
import { playBattle } from '../policies';
import { battleCats, createDepthAccount } from '../state';
import { CAT_BY_ID } from '../catalog';
import { actAutoExtras, autoIntentHints, createAutoExtrasMemory, DEFAULT_AUTO_EXTRAS, playAutoExtras } from './index';
import type { AutoExtrasOptions } from './index';

const on: AutoExtrasOptions = { autoExtras: true, teaCloud: true, frontRelay: true, intentLens: true };
function fixture(seed = 11) {
  const cats = battleCats(createDepthAccount(seed));
  cats[1] = { ...cats[1]!, id: 'mallow', row: 'front', skills: CAT_BY_ID.mallow!.skills.map(s => s.id) };
  const b = createBattle({ seed, chapter: 1, cats, enemies: ['kettle-knight', 'yarn-giant'] });
  return b;
}
function reaction(seed = 11) {
  const b = fixture(seed), source = b.actors.find(a => a.id === 'clover')!, target = b.actors.find(a => a.side === 'enemy')!;
  b.queue = [source.id, ...b.queue.filter(id => id !== source.id)];
  target.statuses = [{ id: 'scald', stacks: 1, remaining: 3, source: 'mallow', appliedRound: b.round }];
  b.actors[0]!.hp = 100;
  return { b, source, target, choice: { actorId: source.id, skillId: 'clover-1', targetId: target.id } };
}
function relay() {
  const b = fixture(), source = b.actors.find(a => a.id === 'clover')!, target = b.actors[0]!;
  b.queue = [source.id, ...b.queue.filter(id => id !== source.id)]; target.hp = 100; target.shield = 0;
  return { b, source, target, choice: { actorId: source.id, skillId: 'clover-2', targetId: target.id } };
}

describe('default-off automatic extras', () => {
  it('starts with every toggle off', () => expect(Object.values(DEFAULT_AUTO_EXTRAS)).toEqual([false, false, false, false]));
  it.each([1, 7, 11, 37, 10001])('preserves the complete serialized battle with flags off, seed %i', seed => {
    const b = fixture(seed), expected = playBattle(clone(b), 'auto');
    const actual = playAutoExtras(b);
    expect(JSON.stringify(actual)).toBe(JSON.stringify(expected));
  });
  it('master-off defeats independently enabled experiments', () => {
    const b = fixture(), expected = playBattle(clone(b), 'auto');
    expect(JSON.stringify(playAutoExtras(b, createAutoExtrasMemory(), { ...on, autoExtras: false }))).toBe(JSON.stringify(expected));
  });
  it('rejected choices do not change rules state or consume a proc', () => {
    const { b, source } = reaction(), before = JSON.stringify(b), memory = createAutoExtrasMemory();
    expect(actAutoExtras(b, memory, on, { actorId: source.id, skillId: 'missing', targetId: 'missing' })).toBe(false);
    expect(JSON.stringify(b)).toBe(before); expect(memory.rounds).toEqual({});
  });
  it('is seeded and independent of rendering speed or number of read-only lens polls', () => {
    const b = fixture(44), expected = playAutoExtras(clone(b), createAutoExtrasMemory(), on);
    const memory = createAutoExtrasMemory();
    while (!b.result) { for (let i = 0; i < 9; i++) autoIntentHints(b, on); actAutoExtras(b, memory, on); }
    expect(JSON.stringify(b)).toBe(JSON.stringify(expected));
  });
});

describe('tea cloud', () => {
  it('turns an ally Scald follow-up into bounded shield on the most injured living ally', () => {
    const { b, choice } = reaction(), memory = createAutoExtrasMemory();
    expect(actAutoExtras(b, memory, on, choice)).toBe(true);
    expect(memory.cues).toContainEqual(expect.objectContaining({ id: 'tea-cloud', targetId: 'mochi', amount: 18 }));
    expect(b.actors[0]!.shield).toBeGreaterThanOrEqual(18);
  });
  it.each(['self', 'enemy', 'none', 'blocked'] as const)('does not react to %s Scald/damage', kind => {
    const { b, source, target, choice } = reaction(), memory = createAutoExtrasMemory();
    if (kind === 'none') target.statuses = [];
    if (kind === 'self') target.statuses[0]!.source = source.id;
    if (kind === 'enemy') target.statuses[0]!.source = target.id;
    if (kind === 'blocked') target.shield = 10000;
    actAutoExtras(b, memory, on, choice);
    expect(memory.cues.some(c => c.id === 'tea-cloud')).toBe(false);
  });
  it('caps shield and does not select a defeated ally', () => {
    const { b, choice } = reaction(), memory = createAutoExtrasMemory();
    b.actors[0]!.hp = 0;
    const living = b.actors.filter(a => a.side === 'party' && a.hp > 0);
    for (const actor of living) { actor.hp = actor.maxHp; actor.shield = Math.floor(actor.maxHp * .6) - 2; }
    actAutoExtras(b, memory, on, choice);
    expect(memory.cues.find(c => c.id === 'tea-cloud')?.amount).toBe(2);
    expect(memory.cues.every(c => c.targetId !== b.actors[0]!.id)).toBe(true);
    expect(living.every(a => a.shield <= Math.floor(a.maxHp * .6))).toBe(true);
  });
  it('fires at most once in a round and can fire again next round', () => {
    const { b, source, choice } = reaction(), memory = createAutoExtrasMemory();
    actAutoExtras(b, memory, on, choice);
    b.queue = [source.id, ...b.queue.filter(id => id !== source.id)]; source.cooldowns = {};
    actAutoExtras(b, memory, on, choice); expect(memory.cues).toEqual([]);
    b.round++; b.queue = [source.id, ...b.queue.filter(id => id !== source.id)]; source.cooldowns = {};
    actAutoExtras(b, memory, on, choice); expect(memory.cues.some(c => c.id === 'tea-cloud')).toBe(true);
  });
  it('cannot add a post-victory bonus or resurrect a resolved fight', () => {
    const { b, choice } = reaction(), memory = createAutoExtrasMemory(); b.result = 'party';
    const before = JSON.stringify(b); expect(actAutoExtras(b, memory, on, choice)).toBe(false); expect(JSON.stringify(b)).toBe(before);
  });
});

describe('front relay', () => {
  it('grants charge when rear support actually restores a front ally', () => {
    const { b, target, choice } = relay(), before = target.charge, memory = createAutoExtrasMemory();
    actAutoExtras(b, memory, on, choice);
    expect(target.charge).toBe(before + 6);
    expect(memory.cues).toContainEqual(expect.objectContaining({ id: 'front-relay', targetId: target.id, amount: 6 }));
  });
  it.each(['front-caster', 'rear-target', 'full-health', 'self'] as const)('excludes %s', kind => {
    const { b, source, target, choice } = relay(), memory = createAutoExtrasMemory();
    if (kind === 'front-caster') source.row = 'front';
    if (kind === 'rear-target') target.row = 'rear';
    if (kind === 'full-health') target.hp = target.maxHp;
    if (kind === 'self') { choice.targetId = source.id; source.hp = 10; }
    actAutoExtras(b, memory, on, choice);
    expect(memory.cues.some(c => c.id === 'front-relay')).toBe(false);
  });
  it('caps ultimate charge at 100 and records the actual gain', () => {
    const { b, target, choice } = relay(), memory = createAutoExtrasMemory(); target.charge = 98;
    actAutoExtras(b, memory, on, choice); expect(target.charge).toBe(100);
    expect(memory.cues.find(c => c.id === 'front-relay')?.amount).toBe(2);
  });
  it('respects its individual toggle', () => {
    const { b, target, choice } = relay(), before = target.charge;
    actAutoExtras(b, createAutoExtrasMemory(), { ...on, frontRelay: false }, choice); expect(target.charge).toBe(before);
  });
});

describe('intent lens', () => {
  it('is absent by default and exposes only public intents with the flag on', () => {
    const b = fixture(), before = JSON.stringify(b);
    expect(autoIntentHints(b)).toEqual([]); expect(autoIntentHints(b, on).length).toBe(b.intents.length);
    for (const hint of autoIntentHints(b, on)) expect(b.intents.find(i => i.actorId === hint.actorId)?.targetId).toBe(hint.targetId);
    expect(JSON.stringify(b)).toBe(before);
  });
  it('has byte-identical outcomes when it is the only enabled experiment', () => {
    const b = fixture(), expected = playBattle(clone(b), 'auto');
    const actual = playAutoExtras(b, createAutoExtrasMemory(), { ...on, teaCloud: false, frontRelay: false });
    expect(JSON.stringify(actual)).toBe(JSON.stringify(expected));
  });
});
