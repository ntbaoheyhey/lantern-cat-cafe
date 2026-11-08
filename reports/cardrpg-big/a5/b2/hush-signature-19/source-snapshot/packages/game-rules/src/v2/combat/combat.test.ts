import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { CLASSES, ITEMS, type ClassId } from '../content';
import {
  bossOfChapter,
  damage,
  deriveStats,
  monsterAt,
  monsterFight,
  powerRating,
  simulateBossV2,
  stageOf,
  type BossDef,
  type CatStats,
  type ItemInstance,
} from './index';

const weaponOf = (classId: ClassId, rarity: string) => {
  const type = CLASSES.find((c) => c.id === classId)!.weaponType;
  return ITEMS.find((i) => i.weaponType === type && i.rarity === rarity)!.id;
};

/** Equal reference gear for every class: the class's own rare weapon plus the same rare set. */
function referenceGear(classId: ClassId, rarity = 'rare', level = 10): ItemInstance[] {
  return [
    { itemId: weaponOf(classId, rarity), level },
    ...['helmet', 'armor', 'gloves', 'boots'].map((slot) => ({ itemId: `arm.cozy.${slot}.${rarity}`, level })),
    { itemId: `acc.collar.bell.${rarity}`, level },
    { itemId: `acc.earring.pearl.${rarity}`, level },
    { itemId: `acc.ring.paw.${rarity}`, level },
  ];
}

const referenceStats = (classId: ClassId) => deriveStats({ classId, level: 10 }, referenceGear(classId));
// A sturdy but harmless boss, so every class survives and the kill time shows pure damage output.
const dummyBoss: BossDef = { id: 'test.dummy', hp: 3000, atk: 3, def: 10, attackIntervalMs: 1500 };

describe('deriveStats', () => {
  it('gives a naked level 1 cat the base stats times the class multipliers', () => {
    const s = deriveStats({ classId: 'warrior', level: 1 });
    expect([s.hp, s.atk, s.def]).toEqual([100, 10, 5]);
    expect(s.attackIntervalMs).toBe(1000);
    const g = deriveStats({ classId: 'guardian', level: 1 });
    expect(g.hp).toBeCloseTo(130);
    expect(g.attackIntervalMs).toBe(1400);
  });

  it('grows 6% per level', () => {
    const a = deriveStats({ classId: 'warrior', level: 1 });
    const b = deriveStats({ classId: 'warrior', level: 11 });
    expect(b.atk / a.atk).toBeCloseTo(1.06 ** 10, 6);
  });

  it('scales items by rarity and item level', () => {
    const w = (level: number, rarity: string) =>
      deriveStats({ classId: 'warrior', level: 1 }, [{ itemId: weaponOf('warrior', rarity), level }]).atk;
    expect(w(1, 'common')).toBe(10 + 8);
    expect(w(1, 'rare')).toBeCloseTo(10 + 8 * 1.7);
    expect(w(11, 'rare')).toBeCloseTo(10 + 8 * 1.7 * 1.7); // 1 + 0.07 x 10
    expect(w(999, 'common')).toBeCloseTo(10 + 8 * (1 + 0.07 * 9)); // clamped to maxLevel 10
  });

  it('adds bonus lines and class passives', () => {
    const s = deriveStats({ classId: 'hunter', level: 1 }, [
      { itemId: weaponOf('hunter', 'common'), level: 1, bonusLines: [{ stat: 'critChance', value: 0.1 }] },
    ]);
    expect(s.critChance).toBeCloseTo(0.15);
    expect(s.materialFind).toBeCloseTo(0.1);
  });

  it('ignores locked accessory slots, a wrong weapon type and a second item per slot', () => {
    const base = deriveStats({ classId: 'warrior', level: 1 });
    const ring = { itemId: 'acc.ring.paw.legendary', level: 1 };
    expect(deriveStats({ classId: 'warrior', level: 9 }, [ring])).toEqual({ ...base, level: 9, hp: expect.any(Number), atk: expect.any(Number), def: expect.any(Number) });
    expect(deriveStats({ classId: 'warrior', level: 9 }, [ring]).attackIntervalMs).toBe(1000);
    expect(deriveStats({ classId: 'warrior', level: 10 }, [ring]).attackIntervalMs).toBeLessThan(1000);
    expect(deriveStats({ classId: 'warrior', level: 1 }, [{ itemId: weaponOf('archer', 'legendary'), level: 1 }]).atk).toBe(10);
    const two = deriveStats({ classId: 'warrior', level: 1 }, [
      { itemId: weaponOf('warrior', 'common'), level: 1 },
      { itemId: weaponOf('warrior', 'legendary'), level: 1 },
    ]);
    expect(two.atk).toBe(18);
    expect(deriveStats({ classId: 'warrior', level: 1 }, [{ itemId: 'nope', level: 1 }]).atk).toBe(10);
  });

  it('caps stacked bonuses', () => {
    const s = deriveStats({ classId: 'rogue', level: 1 }, [
      { itemId: weaponOf('rogue', 'common'), level: 1, bonusLines: [
        { stat: 'critChance', value: 5 }, { stat: 'dodge', value: 5 }, { stat: 'attackSpeed', value: 50 }, { stat: 'hpRegen', value: 5 },
      ] },
    ]);
    expect(s.critChance).toBe(0.75);
    expect(s.dodge).toBe(0.6);
    expect(s.attackIntervalMs).toBe(400);
    expect(s.hpRegen).toBe(0.05);
  });
});

describe('damage and power', () => {
  it('halves damage at DEF 100 and never reaches zero', () => {
    expect(damage(100, 0)).toBe(100);
    expect(damage(100, 100)).toBe(50);
    expect(damage(100, 300)).toBe(25);
    expect(damage(1, 1e9)).toBe(1);
  });

  it('rises with gear', () => {
    const naked = powerRating(deriveStats({ classId: 'warrior', level: 10 }));
    const geared = powerRating(referenceStats('warrior'));
    expect(naked).toBeGreaterThan(0);
    expect(geared).toBeGreaterThan(naked * 1.5);
  });
});

describe('simulateBossV2', () => {
  it('is deterministic per seed and differs across seeds', () => {
    for (const c of CLASSES) {
      const a = simulateBossV2(referenceStats(c.id), c.id, dummyBoss, 7);
      expect(simulateBossV2(referenceStats(c.id), c.id, dummyBoss, 7)).toEqual(a);
    }
    const logs = new Set(
      [1, 2, 3, 4, 5].map((s) => JSON.stringify(simulateBossV2(referenceStats('rogue'), 'rogue', dummyBoss, s).log)),
    );
    expect(logs.size).toBeGreaterThan(1);
  });

  it('starts attacks on the class interval and lands hits at the weapon offsets', () => {
    for (const c of CLASSES) {
      const stats = referenceStats(c.id);
      const { log } = simulateBossV2(stats, c.id, dummyBoss, 3);
      const starts = log.filter((e) => e.type === 'attack_start');
      starts.slice(0, 5).forEach((e, i) => expect(e.t).toBe(i * stats.attackIntervalMs));
      const w = CLASSES.find((x) => x.id === c.id)!;
      const profile = { sword: [240], hammer: [520], daggers: [140, 300], spear: [300], bow: [500], staff: [850], flasks: [710] }[w.weaponType]!;
      const hits = log.filter((e) => e.type === 'impact' && e.source === 'hit').slice(0, profile.length);
      hits.forEach((h, i) => expect(h.t).toBe(profile[i]));
    }
  });

  it('plays out the class passives', () => {
    const run = (id: ClassId, boss = dummyBoss) => simulateBossV2(referenceStats(id), id, boss, 11).log;
    expect(run('rogue').filter((e) => e.type === 'impact').length).toBeGreaterThan(run('warrior').filter((e) => e.type === 'impact').length * 0.9);
    expect(run('archer').some((e) => e.type === 'impact' && e.source === 'arrow')).toBe(true);
    expect(run('witch').some((e) => e.type === 'dot' && e.source === 'burn')).toBe(true);
    expect(run('alchemist').some((e) => e.type === 'dot' && e.source === 'poison')).toBe(true);
    expect(run('warrior').some((e) => e.type === 'dot')).toBe(false);
    // Hunter's second hit is stronger than its first on the same stats.
    const hunter = simulateBossV2({ ...referenceStats('hunter'), critChance: 0 }, 'hunter', dummyBoss, 1).log.filter((e) => e.type === 'impact');
    expect((hunter[1] as { damage: number }).damage).toBeGreaterThan((hunter[0] as { damage: number }).damage);
  });

  it('telegraphs the big attack and lands it every 6 s', () => {
    const tank = { ...referenceStats('guardian'), hp: 1e9 };
    const { log } = simulateBossV2(tank, 'guardian', { ...dummyBoss, hp: 1e12 }, 1);
    const big = log.filter((e) => e.type === 'boss_impact' && e.big);
    expect(big.map((e) => e.t)).toEqual([6000, 12000, 18000, 24000, 30000, 36000, 42000, 48000, 54000]);
    for (const b of big) expect(log.some((e) => e.type === 'boss_windup' && e.big && e.t === b.t - 1000)).toBe(true);
  });

  it('bonk pushes back the next boss attack', () => {
    const base = { ...referenceStats('guardian'), hp: 1e9 };
    const long = { ...dummyBoss, hp: 1e12, attackIntervalMs: 1500 };
    const withBonk = simulateBossV2(base, 'guardian', long, 1).log.filter((e) => e.type === 'boss_impact' && !e.big);
    const noBonk = simulateBossV2(base, 'warrior', long, 1).log.filter((e) => e.type === 'boss_impact' && !e.big);
    expect(withBonk.length).toBeLessThan(noBonk.length);
  });

  it('ends in a loss at 60 s, and when the cat dies', () => {
    const timeout = simulateBossV2(referenceStats('warrior'), 'warrior', { ...dummyBoss, hp: 1e12, atk: 0 }, 1);
    expect(timeout.won).toBe(false);
    expect(timeout.durationMs).toBe(60000);
    const dead = simulateBossV2({ ...referenceStats('warrior'), hp: 5 }, 'warrior', { ...dummyBoss, hp: 1e12, atk: 500 }, 1);
    expect(dead.won).toBe(false);
    expect(dead.durationMs).toBeLessThan(5000);
    expect(dead.log.at(-1)).toMatchObject({ type: 'end', won: false });
  });

  it('keeps boss HP in the log consistent with the damage dealt', () => {
    const r = simulateBossV2(referenceStats('witch'), 'witch', dummyBoss, 5);
    let hp = r.bossMaxHp;
    for (const e of r.log) {
      if (e.type === 'impact' || e.type === 'dot') {
        hp = Math.max(0, hp - e.damage);
        expect(e.bossHp).toBe(hp);
      }
    }
    expect(r.won).toBe(true);
    expect(hp).toBe(0);
  });

  it('every class beats the reference boss within 10% of the median time with equal gear', () => {
    const times = CLASSES.map((c) => {
      // Average over seeds so crit luck does not decide the comparison.
      const runs = Array.from({ length: 30 }, (_, i) => simulateBossV2(referenceStats(c.id), c.id, dummyBoss, 100 + i));
      expect(runs.every((r) => r.won)).toBe(true);
      return [c.id, runs.reduce((a, r) => a + r.durationMs, 0) / runs.length] as const;
    });
    const sorted = times.map(([, t]) => t).sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)]!;
    for (const [id, t] of times) expect(Math.abs(t - median) / median, `${id} ${t} vs median ${median}`).toBeLessThanOrEqual(0.1);
  });
});

describe('monsterFight', () => {
  it('matches the boss simulation roughly for a harmless monster', () => {
    for (const c of CLASSES) {
      const stats = referenceStats(c.id);
      const monster = { id: 'm', hp: 1500, atk: 0, def: 10, attackIntervalMs: 1500, xp: 0, fish: 0 };
      const analytic = monsterFight(stats, monster).timeToKillMs;
      const sim = simulateBossV2(stats, c.id, { id: 'm', hp: 1500, atk: 0, def: 10, attackIntervalMs: 1500 }, 3).durationMs;
      expect(Math.abs(analytic - sim) / sim, `${c.id} analytic ${analytic} sim ${sim}`).toBeLessThan(0.3);
    }
  });

  it('says a weak cat cannot win a strong monster and a strong one can', () => {
    const weak = deriveStats({ classId: 'witch', level: 1 });
    const strong = referenceStats('guardian');
    const m = monsterAt('mon.dust.bunny', 30);
    expect(monsterFight(weak, m).canWin).toBe(false);
    expect(monsterFight(strong, monsterAt('mon.dust.bunny', 1)).canWin).toBe(true);
  });

  it('a one-hit kill takes exactly the hit time', () => {
    const stats = referenceStats('warrior');
    const r = monsterFight(stats, { id: 'm', hp: 1, atk: 5, def: 0, attackIntervalMs: 1500, xp: 0, fish: 0 });
    expect(r.timeToKillMs).toBe(240);
    expect(r.damageTaken).toBe(0);
  });
});

describe('stages and monsters', () => {
  it('numbers stages 1..50 across chapters', () => {
    expect(stageOf(1, 1)).toBe(1);
    expect(stageOf(2, 3)).toBe(13);
    expect(stageOf(5, 10)).toBe(50);
  });

  it('follows the plan formulas', () => {
    const m = monsterAt('mon.dust.bunny', 10);
    expect(m.hp).toBe(Math.round(30 * 1.13 ** 9));
    expect(m.atk).toBeCloseTo(4 * 1.12 ** 9);
    expect(m.xp).toBeCloseTo(6 * 1.11 ** 9);
    expect(m.fish).toBeCloseTo(2 * 1.1 ** 9);
    expect(bossOfChapter(1).hp).toBe(Math.round(30 * 1.13 ** 9 * 40));
  });
});

describe('robustness', () => {
  const finiteStat = fc.oneof(
    fc.constant(0), fc.constant(-5), fc.constant(NaN), fc.constant(Infinity), fc.constant(1e300), fc.double({ min: 0, max: 1e9, noNaN: true }),
  );
  it('never produces NaN from zero, huge or broken stats', () => {
    fc.assert(
      fc.property(fc.constantFrom(...CLASSES.map((c) => c.id)), finiteStat, finiteStat, finiteStat, finiteStat, fc.nat(), (classId, hp, atk, def, regen, seed) => {
        const base = deriveStats({ classId, level: 5 });
        const stats: CatStats = { ...base, hp, atk, def, hpRegen: regen };
        const boss: BossDef = { id: 'b', hp: Math.abs(atk) || 100, atk: Math.abs(def) || 1, def: Math.abs(hp) || 1, attackIntervalMs: 1500 };
        const r = simulateBossV2(stats, classId, boss, seed);
        for (const e of r.log) for (const v of Object.values(e)) if (typeof v === 'number') expect(Number.isNaN(v)).toBe(false);
        expect(Number.isNaN(r.durationMs)).toBe(false);
        expect(r.durationMs).toBeLessThanOrEqual(60000);
        const f = monsterFight(stats, { id: 'm', hp: boss.hp, atk: boss.atk, def: boss.def, attackIntervalMs: 1500, xp: 0, fish: 0 });
        expect(Number.isNaN(f.timeToKillMs) || Number.isNaN(f.damageTaken)).toBe(false);
        expect(Number.isNaN(powerRating(stats))).toBe(false);
      }),
      { numRuns: 300 },
    );
  });

  it('deriveStats survives odd levels', () => {
    fc.assert(
      fc.property(fc.constantFrom(...CLASSES.map((c) => c.id)), fc.oneof(fc.integer(), fc.constant(NaN), fc.constant(Infinity)), (classId, level) => {
        const s = deriveStats({ classId, level });
        expect(s.level).toBeGreaterThanOrEqual(1);
        expect(s.level).toBeLessThanOrEqual(60);
        expect(Number.isFinite(s.hp + s.atk + s.def)).toBe(true);
      }),
    );
  });
});
