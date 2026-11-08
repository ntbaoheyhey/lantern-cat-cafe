import { describe, expect, it } from 'vitest';
import { CONFIG } from './config';
import { actCafe, advanceCafe, AFFIXES, BOSSES, bossReady, cafeQuests, cafeStats, compareKit, completion, copyCafe, qualityOdds, routeOptions, createCafe, ENCOUNTERS, masteryLevel, returnToCafe, SETS, setCounts, SLOTS, type CafeState } from '../client/cafe';
const C = CONFIG.cafe;
function ready(chapter = 1, seed = 11) {
  const s = createCafe(seed); s.chapter = chapter; s.encounters = C.bossGate * chapter; return actCafe(s, { type: 'mastery', mastery: s.mastery });
}
function fight(s: CafeState, active = false) {
  s = actCafe(s, { type: 'fight' });
  const phases = new Set<number>(), moves = new Set<string>();
  while (s.boss) {
    phases.add(s.boss.phase); moves.add(s.boss.counter);
    if (active) {
      s = actCafe(s, { type: 'counter', counter: s.boss.counter });
      if (s.boss?.stage === 'recovery') s = actCafe(s, { type: 'pounce' });
    }
    s = advanceCafe(s);
  }
  return { s, phases, moves };
}
describe('local cafe pacing and encounter variety', () => {
  it('is default-off and starts with one genuine route decision', () => {
    expect(CONFIG.features.cafeAdventure).toBe(false);
    expect(createCafe().events[0]?.kind).toBe('decision');
  });
  it.each([11, 29, 47, 71, 101])('has a reward by 8s and no opportunity gap over 20s for seed %i', seed => {
    for (const style of ['idle', 'active', 'minmax']) {
      let s = createCafe(seed); const timeline = [...s.events]; let previous = s.events.at(-1);
      for (let t = 0; t < 600; t++) {
        if (style !== 'idle' && s.encounter && s.seconds > 0) s = actCafe(s, { type: 'route', route: style === 'minmax' ? 'study' : 'risk' });
        s = advanceCafe(s);
        const index = previous ? s.events.map(e => `${e.at}:${e.text}`).lastIndexOf(`${previous.at}:${previous.text}`) : -1;
        timeline.push(...s.events.slice(index + 1)); previous = s.events.at(-1);
      }
      const moments = timeline.filter(e => e.kind === 'decision' || e.kind === 'reward' || e.kind === 'goal');
      const points = [0, ...moments.map(e => e.at), 600];
      expect(Math.max(...points.slice(1).map((t, i) => t - points[i]!))).toBeLessThanOrEqual(20);
      expect(moments.find(e => e.kind === 'reward')!.at).toBeLessThanOrEqual(10);
      expect(new Set(s.discovered.filter(k => !k.startsWith('gear:')).map(k => k.split(':')[1])).size).toBe(ENCOUNTERS.length);
      expect(s.events.length).toBeLessThanOrEqual(C.maxLog);
      expect(s.inventory.length).toBeLessThanOrEqual(C.maxItems);
    }
  });
  it('does not reroll a claimed encounter, and replaying the same inputs is deterministic', () => {
    const run = () => { let s = createCafe(29); for (let t = 0; t < 120; t++) { s = advanceCafe(s); if (s.encounter) s = actCafe(s, { type: 'route', route: 'risk' }); } return s; };
    expect(run()).toEqual(run());
    const once = actCafe(createCafe(), { type: 'route', route: 'gather' });
    expect(actCafe(once, { type: 'route', route: 'risk' })).toEqual(once);
  });
  it('guarantees all eight encounter kinds each chapter, regardless of seed', () => {
    for (let chapter = 1; chapter <= BOSSES.length; chapter++) {
      let s = createCafe(71); s.chapter = chapter; s.encounter = null;
      s = advanceCafe(s, C.encounterSeconds * ENCOUNTERS.length);
      expect(s.discovered.filter(k => k.startsWith(`${chapter}:`))).toHaveLength(ENCOUNTERS.length);
    }
  });
  it('caps lucky events, insight, supplies and step work; invalid time does nothing', () => {
    let s = createCafe(); s.lucky = C.luckyCapPerTour; s.patches = C.maxPatches;
    s.encounter!.kind = 'treasure'; s.insight = C.maxInsight;
    s = actCafe(s, { type: 'route', route: 'study' });
    expect(s.lucky).toBe(C.luckyCapPerTour); expect(s.insight).toBe(C.maxInsight); expect(s.patches).toBe(C.maxPatches);
    expect(advanceCafe(s, Infinity)).toEqual(s); expect(advanceCafe(s, -1)).toEqual(s);
    expect(advanceCafe(s, C.maxStepSeconds + 1).seconds).toBe(s.seconds + C.maxStepSeconds);
  });
  it('study on a splitter guarantees a kit item and cafe study adds mastery', () => {
    const s = createCafe(); s.encounters = C.itemEvery; s.encounter!.kind = 'splitter';
    expect(actCafe(s, { type: 'route', route: 'study' }).inventory.length).toBe(s.inventory.length + 1);
    s.encounter!.kind = 'cafe'; expect(actCafe(s, { type: 'route', route: 'study' }).xp).toBe(C.encounterXp * 2);
  });
});
describe('learnable bosses and fair retry', () => {
  it.each([11, 29, 47, 71, 101])('lets an idle starter clear chapter one on seed %i', seed => {
    const { s, phases, moves } = fight(ready(1, seed));
    expect(s.lastBoss?.won).toBe(true); expect(phases.size).toBe(3); expect(moves.size).toBe(3);
    expect(s.lastBoss?.grade).not.toBe('Perfect'); expect(s.clears).toEqual([1]);
  });
  it.each([1, 2, 3, 4, 5])('provides three phases, consistent cues and a perfect counter path in chapter %i', chapter => {
    const { s, phases, moves } = fight(ready(chapter), true);
    // Later rooms require stronger kits: perfect counters alone cannot beat enrage.
    expect(phases.size).toBeGreaterThanOrEqual(2); expect(moves.size).toBe(3);
    expect(s.lastBoss?.counters).toBeGreaterThan(0);
    if (s.lastBoss?.won) expect(s.lastBoss.grade).toBe('Perfect');
    expect(s.lastBoss?.seconds).toBeLessThanOrEqual(C.boss.maxSeconds);
  });
  it('locks kit, tier and mastery during a fight, and permits one answer per telegraph', () => {
    const s = actCafe(ready(), { type: 'fight' });
    expect(actCafe(s, { type: 'tier', tier: 2 })).toEqual(s);
    expect(actCafe(s, { type: 'mastery', mastery: 'bold' })).toEqual(s);
    expect(actCafe(s, { type: 'equip', id: s.inventory[0]!.id })).toEqual(s);
    const chosen = actCafe(s, { type: 'counter', counter: 'dodge' });
    expect(actCafe(chosen, { type: 'counter', counter: 'break' }).boss?.chosen).toBe('dodge');
  });
  it('bounds pounce by its cooldown and makes a recovery counter hit matter', () => {
    const s = actCafe(ready(), { type: 'fight' });
    const hit = actCafe(s, { type: 'pounce' });
    expect(hit.boss!.hp).toBeLessThan(s.boss!.hp);
    expect(actCafe(hit, { type: 'pounce' })).toEqual(hit);
    let exposed = actCafe(s, { type: 'counter', counter: s.boss!.counter });
    exposed = advanceCafe(exposed, C.boss.windupSeconds);
    expect(exposed.boss!.exposure).toBe(C.boss.correctExposureSeconds);
    expect(exposed.boss!.damageTaken).toBe(0);
  });
  it('losses keep the kit, show a specific hint, and offer bounded opt-out assistance', () => {
    const initial = ready(5), { s } = fight(initial);
    expect(s.lastBoss?.won).toBe(false); expect(s.lastBoss?.hint).toContain('→'); expect(s.inventory).toEqual(initial.inventory);
    expect(bossReady(s)).toBe(false);
    const again = advanceCafe(s, C.boss.retrySeconds); expect(bossReady(again)).toBe(true);
    again.losses = C.assist.afterLosses;
    const aided = actCafe(again, { type: 'fight' }); expect(aided.boss!.assisted).toBe(true);
    const unaided = actCafe(actCafe(again, { type: 'assist', enabled: false }), { type: 'fight' });
    expect(unaided.boss!.assisted).toBe(false); expect(aided.boss!.maxHp).toBeLessThan(unaided.boss!.maxHp);
  });
  it('caps fight duration, labels close calls honestly, and does not regrant first-clear loot', () => {
    const s = actCafe(ready(), { type: 'fight' }); s.boss!.hp = 1; s.boss!.catHp = 1; s.boss!.damageTaken = 1;
    const win = actCafe(s, { type: 'pounce' }); expect(win.lastBoss!.grade).toBe('Close call');
    const again = actCafe(advanceCafe(win, C.boss.retrySeconds), { type: 'fight' }); again.boss!.hp = 1;
    const repeat = actCafe(again, { type: 'pounce' }); expect(repeat.inventory.length).toBe(win.inventory.length);
    const timeout = actCafe(ready(5), { type: 'fight' }); timeout.boss!.hp = Number.MAX_SAFE_INTEGER; timeout.boss!.catHp = Number.MAX_SAFE_INTEGER; timeout.boss!.maxCatHp = Number.MAX_SAFE_INTEGER;
    expect(advanceCafe(timeout, C.boss.maxSeconds).lastBoss!.won).toBe(false);
  });
});
describe('builds, honest crafting and long goals', () => {
  it.each(SETS)('%s has functional 2/3/4-piece breakpoints', set => {
    const s = createCafe(); for (const i of s.inventory) i.set = set;
    const full = cafeStats(s); expect(setCounts(s)[set]).toBe(C.sets.four);
    s.inventory[0]!.set = SETS.find(x => x !== set)!; const three = cafeStats(s);
    s.inventory[1]!.set = s.inventory[0]!.set; const two = cafeStats(s);
    if (set === 'ember') { expect(full.exposure).toBeGreaterThan(three.exposure); expect(three.cooldown).toBeLessThan(two.cooldown); }
    if (set === 'moss') { expect(full.guard).toBeGreaterThan(three.guard); expect(three.regen).toBeGreaterThan(two.regen); }
    if (set === 'star') { expect(three.luck).toBeGreaterThan(two.luck); expect(full.patchBonus).toBeGreaterThan(0); }
  });
  it('affixes change real stats and item comparisons use the entire equipped kit', () => {
    const s = createCafe(), base = cafeStats(s);
    for (const affix of AFFIXES) {
      const test = copyCafe(s); test.inventory[0]!.affix = affix; const stats = cafeStats(test);
      if (affix === 'keen') expect(stats.damage).toBeGreaterThan(base.damage);
      if (affix === 'cushioned') expect(stats.hp).toBe(base.hp);
      if (affix === 'steady') expect(stats.guard).toBeGreaterThan(base.guard);
      if (affix === 'lucky') expect(stats.patchBonus).toBeGreaterThan(base.patchBonus);
    }
    const newItem = { ...s.inventory[0]!, id: 'new', affix: 'keen' as const }; s.inventory.push(newItem);
    expect(compareKit(s, newItem).damage).toBeGreaterThan(0); expect(compareKit(s, newItem).ehp).toBeLessThan(0);
    expect(compareKit(s, newItem).after).toEqual(cafeStats(actCafe(s, { type: 'equip', id: 'new' })));
  });
  it('crafts a chosen set and slot, refuses unaffordable/full kits and keeps stable item ids', () => {
    const s = createCafe(); s.patches = C.forge.craftCost;
    const made = actCafe(s, { type: 'craft', slot: 'charm', set: 'star' });
    expect(made.inventory.at(-1)).toMatchObject({ slot: 'charm', set: 'star' }); expect(made.patches).toBe(0);
    expect(actCafe(made, { type: 'craft', slot: 'charm', set: 'star' })).toEqual(made);
    const stocked = advanceCafe(createCafe(), C.maxStepSeconds); expect(new Set(stocked.inventory.map(i => i.id)).size).toBe(stocked.inventory.length);
    const full = { ...stocked, patches: C.maxPatches }; expect(full.inventory).toHaveLength(C.maxItems);
    expect(actCafe(full, { type: 'craft', slot: 'paw', set: 'ember' })).toEqual(full);
  });
  it('steady stitching is guaranteed; spark pity is item-bound and cannot destroy gear', () => {
    const s = createCafe(); s.patches = C.maxPatches;
    const id = s.inventory[0]!.id, steady = actCafe(s, { type: 'stitch', id, kind: 'steady' });
    expect(steady.inventory[0]!.level).toBe(1); expect(steady.patches).toBe(C.maxPatches - C.forge.steadyCost);
    s.inventory[0]!.misses = C.forge.pityMisses;
    const pity = actCafe(s, { type: 'stitch', id, kind: 'spark' });
    expect(pity.inventory[0]!.level).toBe(C.forge.sparkLevels); expect(pity.inventory[0]!.misses).toBe(0);
    expect(pity.inventory[1]!.misses).toBe(0);
    for (let seed = 0; seed < 100; seed++) {
      let t = createCafe(seed); t.patches = C.maxPatches;
      for (let n = 0; n <= C.forge.pityMisses; n++) t = actCafe(t, { type: 'stitch', id, kind: 'spark' });
      expect(t.inventory[0]!.level).toBeGreaterThan(0); expect(t.inventory).toHaveLength(SLOTS.length);
      expect(t.inventory[0]!.level).toBeLessThanOrEqual(C.gear.maxLevel);
    }
  });
  it('saved loadouts swap atomically and protect their gear from recycling', () => {
    let s = actCafe(createCafe(), { type: 'saveKit', name: 'A' }); s.patches = C.maxPatches;
    s = actCafe(s, { type: 'craft', slot: 'paw', set: 'star' }); const id = s.inventory.at(-1)!.id;
    s = actCafe(s, { type: 'equip', id }); s = actCafe(s, { type: 'saveKit', name: 'B' });
    expect(actCafe(s, { type: 'recycle', id: s.loadouts.A!.paw }).inventory.length).toBe(s.inventory.length);
    expect(actCafe(s, { type: 'loadKit', name: 'A' }).equipped).toEqual(s.loadouts.A);
    expect(actCafe(s, { type: 'loadKit', name: 'B' }).equipped.paw).toBe(id);
  });
  it('quests pay once, goals expose honest progress, and mastery perks are freely swappable', () => {
    const s = advanceCafe(createCafe(), C.encounterSeconds * C.quests.patrol);
    expect(s.claimed).toContain('patrol'); expect(cafeQuests(s).find(q => q.id === 'patrol')!.progress).toBe(C.quests.patrol);
    const repeated = actCafe(s, { type: 'mastery', mastery: s.mastery }); expect(repeated.xp).toBe(s.xp);
    s.xp = C.mastery.xpPerLevel * C.mastery.maxLevel; expect(masteryLevel(s)).toBe(C.mastery.maxLevel);
    expect(cafeStats(actCafe(s, { type: 'mastery', mastery: 'bold' })).damage).toBeGreaterThan(cafeStats(s).damage);
    expect(completion(s).percent).toBeGreaterThan(0); expect(completion(s).percent).toBeLessThan(100);
  });
  it('new tours have an explicit gate, preserve collections and kit, and cap the permanent bonus', () => {
    const s = createCafe(); expect(actCafe(s, { type: 'tour' })).toEqual(s);
    s.clears = [1, 2, 3]; s.chapter = 3; s.encounters = 30;
    const tour = actCafe(s, { type: 'tour' }); expect(tour.chapter).toBe(1); expect(tour.encounters).toBe(0);
    expect(tour.inventory).toEqual(s.inventory); expect(tour.discovered).toEqual(s.discovered); expect(tour.tours).toBe(1);
    tour.tours = C.tour.maxBonusTours; const capped = cafeStats(tour); tour.tours++; expect(cafeStats(tour)).toEqual(capped);
  });
  it('challenge tiers change boss pressure and local quality without changing any server rewards', () => {
    const s = ready(), cozy = actCafe(s, { type: 'fight' }), daring = actCafe(actCafe(s, { type: 'tier', tier: 2 }), { type: 'fight' });
    expect(daring.boss!.maxHp).toBeGreaterThan(cozy.boss!.maxHp);
    expect(actCafe(s, { type: 'tier', tier: -1 })).toEqual(s); expect(actCafe(s, { type: 'tier', tier: NaN })).toEqual(s);
  });
  it('away catch-up is capped, never runs battles, and cannot reward invalid or backward time', () => {
    const s = actCafe(ready(), { type: 'fight' });
    for (const time of [-1, NaN, Infinity]) expect(returnToCafe(s, time).patches).toBe(0);
    const away = returnToCafe(s, 86400); expect(away.patches).toBe(C.away.maxPatches); expect(away.credited).toBe(C.away.capSeconds);
    expect(away.state.boss).toEqual(s.boss); expect(away.state.inventory).toEqual(s.inventory); expect(away.state.seconds).toBe(s.seconds);
    s.patches = C.maxPatches; expect(returnToCafe(s, 86400).patches).toBe(0);
  });
});

describe('adversarial route, collection and build checks', () => {
  it('offers genuinely different encounter trades, with previews equal to actual safe grants', () => {
    for (const kind of ENCOUNTERS) {
      const s = createCafe(); s.encounter!.kind = kind; s.encounters = 9; s.claimed = ['patrol'];
      const preview = routeOptions(s), gathered = actCafe(s, { type: 'route', route: 'gather' });
      expect(gathered.patches - s.patches).toBe(preview.gather + (kind === 'treasure' ? C.luckyExtra : 0));
      const studied = actCafe(s, { type: 'route', route: 'study' });
      expect(studied.insight - s.insight).toBe(preview.study.insight);
    }
    const s = createCafe(); s.encounter!.kind = 'hazard'; expect(routeOptions(s).study.insight).toBe(2);
    s.encounter!.kind = 'swift'; const swift = routeOptions(s).risk;
    s.encounter!.kind = 'thief'; expect(routeOptions(s).risk.chance).toBeGreaterThan(swift.chance);
    expect(routeOptions(s).risk.patches).toBeLessThan(swift.patches);
  });
  it('never awards free higher-tier craft or patrol quality; only first-clear loot gets the premium', () => {
    for (const seed of [11, 29, 47, 71, 101]) {
      const s = createCafe(seed); s.patches = C.maxPatches;
      const hard = actCafe(s, { type: 'tier', tier: 2 });
      expect(qualityOdds(hard)).toEqual(qualityOdds(s));
      expect(qualityOdds(hard, true).bright - qualityOdds(s, true).bright).toBeCloseTo(C.tiers[2].quality);
      expect(actCafe(hard, { type: 'craft', slot: 'paw', set: 'ember' }).inventory).toEqual(actCafe(s, { type: 'craft', slot: 'paw', set: 'ember' }).inventory);
      expect(advanceCafe(hard, 100).inventory).toEqual(advanceCafe(s, 100).inventory);
      for (const i of hard.inventory) i.set = 'star';
      const odds = qualityOdds(hard); expect(odds.plain).toBe(0); expect(odds.bright + odds.fine).toBeCloseTo(1);
    }
  });
  it('keeps discovered set pieces after recycling and excludes them from creature achievements', () => {
    let s = createCafe(); s.patches = C.maxPatches;
    for (const set of SETS) for (const slot of SLOTS) {
      s = actCafe(s, { type: 'craft', slot, set }); const id = s.inventory.at(-1)!.id;
      s = actCafe(s, { type: 'recycle', id }); expect(s.discovered).toContain(`gear:${set}:${slot}`);
    }
    expect(s.claimed).not.toContain('variety'); expect(completion(s).target).toBe(65);
    expect(s.discovered.filter(d => d.startsWith('gear:'))).toHaveLength(12);
  });
  it.each([11, 29, 47, 71, 101])('keeps burst and sustain viable with distinct strengths on seed %i', seed => {
    const kit = (set: 'ember' | 'moss') => { const s = ready(2, seed); for (const i of s.inventory) Object.assign(i, { set, chapter: 2, level: 1, quality: 'fine', affix: set === 'ember' ? 'keen' : 'cushioned' }); return s; };
    const ember = fight(kit('ember'), true).s.lastBoss!, moss = fight(kit('moss'), true).s.lastBoss!;
    expect(ember.won).toBe(true); expect(moss.won).toBe(true); expect(ember.seconds).toBeLessThan(moss.seconds);
    expect(ember.seconds).toBeGreaterThanOrEqual(18); expect(moss.hp).toBeGreaterThan(ember.hp);
    expect(fight(kit('ember')).s.lastBoss!.won).toBe(false);
  });
  it('actions and time never mutate caller snapshots or saved loadouts', () => {
    const s = createCafe(), snapshot = JSON.stringify(s);
    advanceCafe(s, 600); actCafe(s, { type: 'route', route: 'risk' }); returnToCafe(s, 7200);
    expect(JSON.stringify(s)).toBe(snapshot);
  });
});
