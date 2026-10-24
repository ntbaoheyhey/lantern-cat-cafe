import { v2 } from '@taskbar-hero/game-rules';
import { describe, expect, it } from 'vitest';
import { CombatDirector, MAX_PARTICLES, weaponOf, type CombatHooks } from './CombatDirector';
import type { CombatCat, CombatMonster, CombatScene, FxGraphics, FxText } from './stage';
import { buildBossCues, type CombatCue } from './timeline';

/** Lightweight stand-in for a Phaser scene that counts live game objects. */
function fakeScene() {
  const live = new Set<object>();
  const shakes: { duration: number; intensity: number }[] = [];
  const chain = (target: object) =>
    new Proxy(target, {
      get: (t, key) => (key in t ? (t as Record<string | symbol, unknown>)[key] : () => proxy(t)),
    });
  const proxy = (t: object): unknown => chain(t);
  const make = () => {
    const o: Record<string, unknown> = {};
    live.add(o);
    o.destroy = () => live.delete(o);
    return chain(o);
  };
  const scene: CombatScene = {
    add: { graphics: () => make() as FxGraphics, text: () => make() as FxText },
    cameras: { main: { width: 320, shake: (duration, intensity) => shakes.push({ duration, intensity }) } },
  };
  return { scene, live, shakes };
}

function fakeActors() {
  const cat: CombatCat & { played: string[] } = {
    x: 40,
    y: 90,
    played: [],
    play(key: string) {
      this.played.push(key);
    },
  };
  const tints: string[] = [];
  const monster: CombatMonster = {
    x: 200,
    y: 90,
    alpha: 1,
    setPosition(x, y) {
      this.x = x;
      this.y = y;
      return this;
    },
    setAlpha(a) {
      this.alpha = a;
      return this;
    },
    setVisible() {
      return this;
    },
    setTintFill() {
      tints.push('on');
      return this;
    },
    clearTint() {
      tints.push('off');
      return this;
    },
  };
  return { cat, monster, tints };
}

function setup(classId: v2.ClassId, over: { reducedMotion?: boolean; tier?: 'normal' | 'elite' | 'boss'; hooks?: CombatHooks } = {}) {
  const f = fakeScene();
  const a = fakeActors();
  const director = new CombatDirector({
    scene: f.scene,
    cat: a.cat,
    monster: a.monster,
    weapon: weaponOf(classId),
    anims: { attack: 'atk', idle: 'idle' },
    lootTarget: { x: 160, y: 4 },
    reducedMotion: over.reducedMotion ?? false,
    tier: over.tier,
    hooks: over.hooks,
  });
  return { ...f, ...a, director };
}

const boss = (classId: v2.ClassId, level = 14) => {
  const stats = v2.deriveStats({ classId, level });
  return v2.simulateBossV2(stats, classId, v2.bossOfChapter(1), 3);
};

/** Runs 4 ms frames until the cue list and every effect are done; returns elapsed ms. */
function runAll(d: CombatDirector, step = 4, limit = 120000) {
  let t = 0;
  while (t < limit) {
    d.update(step);
    t += step;
    if (!d.busy && t > 50) {
      d.update(step);
      if (!d.busy) break;
    }
  }
  return t;
}

describe('CombatDirector timing', () => {
  it('calls onImpact at the game time of each impact cue, once', () => {
    const result = boss('warrior');
    const impacts = result.log.filter((e) => e.type === 'impact');
    let now = 0;
    const seen: number[] = [];
    const s = setup('warrior', { hooks: { onImpact: () => seen.push(now) } });
    s.director.playBoss(result);
    for (let i = 0; i < 100000 && seen.length < impacts.length; i++) {
      now += 1;
      s.director.update(1);
    }
    expect(seen).toHaveLength(impacts.length);
    seen.forEach((t, i) => expect(t).toBe(Math.ceil(impacts[i]!.t)));
  });

  it('moves the monster HP only at impact time for a projectile weapon', () => {
    const result = boss('archer');
    const first = result.log.find((e) => e.type === 'impact')!;
    const travel = weaponOf('archer').projectile!.travelMs;
    let now = 0;
    const hpAt: [number, number][] = [];
    const s = setup('archer', { hooks: { onMonsterHp: (hp) => hpAt.push([now, hp]) } });
    s.director.playBoss(result);
    for (; now < first.t + 5; ) {
      now += 1;
      s.director.update(1);
    }
    const drops = hpAt.filter(([, hp]) => hp < result.bossMaxHp);
    expect(drops[0]![0]).toBe(Math.ceil(first.t));
    expect(first.t).toBeGreaterThanOrEqual(travel);
  });

  it('keeps hit times identical with reduced motion', () => {
    const run = (reducedMotion: boolean) => {
      const result = boss('hunter');
      let now = 0;
      const seen: number[] = [];
      const s = setup('hunter', { reducedMotion, tier: 'boss', hooks: { onImpact: () => seen.push(now) } });
      s.director.playBoss(result);
      for (let i = 0; i < 40000; i++) {
        now += 5;
        s.director.update(5);
        if (now > result.durationMs + 200) break;
      }
      return seen;
    };
    const a = run(false);
    expect(a.length).toBeGreaterThan(0);
    expect(run(true)).toEqual(a);
  });

  it('flashes white for 60 ms on a hit', () => {
    const s = setup('warrior');
    const cues: CombatCue[] = [
      { t: 0, type: 'spawn', maxHp: 100 },
      { t: 100, type: 'impact', source: 'hit', damage: 10, crit: false, hp: 90 },
    ];
    s.director.play(cues);
    s.director.update(100);
    expect(s.tints.at(-1)).toBe('on');
    // 50 ms of hit-stop freezes visuals, then the 60 ms flash runs.
    for (let i = 0; i < 12; i++) s.director.update(10);
    expect(s.tints.at(-1)).toBe('off');
  });
});

describe('CombatDirector feedback', () => {
  const hit = (crit: boolean): CombatCue[] => [
    { t: 0, type: 'spawn', maxHp: 100 },
    { t: 10, type: 'impact', source: 'hit', damage: 10, crit, hp: 90 },
  ];

  it('shakes 2 px on crits and hammer slams only', () => {
    const plain = setup('warrior');
    plain.director.play(hit(false));
    plain.director.update(50);
    expect(plain.shakes).toHaveLength(0);

    const crit = setup('warrior');
    crit.director.play(hit(true));
    crit.director.update(50);
    expect(crit.shakes).toHaveLength(1);
    expect(crit.shakes[0]!.intensity * 320).toBeCloseTo(2);

    const hammer = setup('guardian');
    hammer.director.play(hit(false));
    hammer.director.update(50);
    expect(hammer.shakes).toHaveLength(1);
  });

  it('never shakes under reduced motion', () => {
    const s = setup('guardian', { reducedMotion: true });
    s.director.play(hit(true));
    s.director.update(50);
    expect(s.shakes).toHaveLength(0);
  });

  it('never has more than 30 particles over 1,000 hits', () => {
    const s = setup('alchemist');
    const cues: CombatCue[] = [{ t: 0, type: 'spawn', maxHp: 1e9 }];
    for (let i = 0; i < 1000; i++) {
      cues.push({ t: 10 + i * 16, type: 'impact', source: 'hit', damage: 5, crit: i % 3 === 0, hp: 1e9 - i });
    }
    s.director.play(cues);
    let peak = 0;
    for (let i = 0; i < 1100; i++) {
      s.director.update(16);
      peak = Math.max(peak, s.director.activeCounts.particles);
    }
    expect(peak).toBeGreaterThan(0);
    expect(peak).toBeLessThanOrEqual(MAX_PARTICLES);
  });
});

describe('CombatDirector cleanup', () => {
  it('leaves no extra game objects after a defeat, and none after destroy', () => {
    let loot = 0;
    const s = setup('witch', { tier: 'boss', hooks: { onLootArrive: () => loot++ } });
    const before = s.live.size;
    expect(before).toBeGreaterThan(0);
    s.director.playBoss(boss('witch', 40));
    runAll(s.director);
    expect(s.live.size).toBe(before);
    expect(s.director.busy).toBe(false);
    expect(s.director.activeCounts).toEqual({ particles: 0, shapes: 0, projectiles: 0, numbers: 0 });
    expect(loot).toBe(4);
    expect(s.monster.alpha).toBe(0);
    s.director.destroy();
    expect(s.live.size).toBe(0);
  });

  it('loops the idle kill loop with defeat and respawn', () => {
    const stats = v2.deriveStats({ classId: 'rogue', level: 3 });
    const monster: v2.MonsterStats = { id: 'm', hp: 60, atk: 1, def: 0, attackIntervalMs: 2000, xp: 1, fish: 0 };
    let defeats = 0;
    const s = setup('rogue', { hooks: { onDefeat: () => defeats++ } });
    s.director.playIdle(stats, monster);
    const ttk = v2.monsterFight(stats, monster).timeToKillMs;
    for (let t = 0; t < ttk * 3 + 4000; t += 10) s.director.update(10);
    expect(defeats).toBeGreaterThanOrEqual(3);
    s.director.destroy();
    expect(s.live.size).toBe(0);
  });

  it('builds cues the same way the director plays them', () => {
    const result = boss('rogue');
    const cues = buildBossCues(result, weaponOf('rogue'));
    expect(cues.filter((c) => c.type === 'impact').length).toBe(result.log.filter((e) => e.type === 'impact').length);
  });
});
