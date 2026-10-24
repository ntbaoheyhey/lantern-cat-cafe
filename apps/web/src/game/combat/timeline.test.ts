import { v2 } from '@taskbar-hero/game-rules';
import { describe, expect, it } from 'vitest';
import { Pool } from './pool';
import { buildBossCues, buildIdleCues, CuePlayer, type CombatCue } from './timeline';

const profile = (id: string) => v2.WEAPON_TYPES.find((w) => w.id === id)!;
const classOfWeapon = (id: string) => v2.CLASSES.find((c) => c.weaponType === id)!.id;

function bossFight(classId: v2.ClassId, level = 12, seed = 7) {
  const stats = v2.deriveStats({ classId, level });
  const boss = v2.bossOfChapter(1);
  return { stats, result: v2.simulateBossV2(stats, classId, boss, seed) };
}

/** Plays cues with a fake clock in uneven steps and records the game time each cue fired at. */
function run(cues: CombatCue[], steps: number[]) {
  const fired: { cue: CombatCue; at: number }[] = [];
  const player = new CuePlayer(cues, (cue) => fired.push({ cue, at: player.now }));
  let i = 0;
  while (!player.done && i < 100000) player.advance(steps[i++ % steps.length]!);
  return fired;
}

describe('cue scheduler', () => {
  it('fires every cue once, in time order, never early', () => {
    const { result } = bossFight('warrior');
    const cues = buildBossCues(result, profile('sword'));
    const fired = run(cues, [7, 16, 33, 3]);
    expect(fired.map((f) => f.cue)).toEqual(cues);
    for (let i = 1; i < cues.length; i++) expect(cues[i]!.t).toBeGreaterThanOrEqual(cues[i - 1]!.t);
    for (const f of fired) expect(f.at).toBeGreaterThanOrEqual(f.cue.t);
  });

  it('fires the damage callback once per impact at the log time', () => {
    const { result } = bossFight('warrior');
    const impacts = result.log.filter((e) => e.type === 'impact');
    const fired = run(buildBossCues(result, profile('sword')), [1]).filter((f) => f.cue.type === 'impact');
    expect(fired).toHaveLength(impacts.length);
    fired.forEach((f, i) => expect(f.at).toBe(impacts[i]!.t));
  });

  it.each(['bow', 'staff', 'flasks'])('%s deals damage on arrival, not on release', (weapon) => {
    const { result } = bossFight(classOfWeapon(weapon));
    const { projectile } = profile(weapon);
    const cues = buildBossCues(result, profile(weapon));
    const impacts = cues.filter((c) => c.type === 'impact');
    const releases = cues.filter((c) => c.type === 'release');
    expect(releases).toHaveLength(impacts.length);
    const fired = run(cues, [1]);
    fired.filter((f) => f.cue.type === 'release').forEach((f, i) => {
      expect(f.cue.t).toBe(Math.max(0, impacts[i]!.t - projectile!.travelMs));
    });
    const firstImpact = fired.find((f) => f.cue.type === 'impact')!;
    const firstRelease = fired.find((f) => f.cue.type === 'release')!;
    expect(firstImpact.at - firstRelease.at).toBe(projectile!.travelMs);
  });

  it('melee weapons have no release cues', () => {
    const { result } = bossFight('warrior');
    expect(buildBossCues(result, profile('sword')).some((c) => c.type === 'release')).toBe(false);
  });

  it('daggers hit twice per attack, at their profile moments', () => {
    expect(profile('daggers').hitAtMs).toHaveLength(2);
    const stats = v2.deriveStats({ classId: 'rogue', level: 1 });
    const monster: v2.MonsterStats = { id: 'm', hp: 400, atk: 1, def: 0, attackIntervalMs: 2000, xp: 1, fish: 0 };
    const cues = buildIdleCues(stats, monster);
    const starts = cues.filter((c) => c.type === 'attackStart');
    const impacts = cues.filter((c) => c.type === 'impact');
    expect(starts.length).toBeGreaterThan(1);
    expect(impacts.length).toBeGreaterThanOrEqual(2 * (starts.length - 1) + 1);
    for (const s of starts.slice(0, -1)) {
      const mine = impacts.filter((i) => i.t >= s.t && i.t < s.t + stats.attackIntervalMs).map((i) => i.t - s.t);
      expect(mine).toEqual(profile('daggers').hitAtMs);
    }
  });

  it('keeps cue times when later cues are visually delayed by hit-stop (clock is independent)', () => {
    const { result } = bossFight('warrior');
    const cues = buildBossCues(result, profile('sword'));
    const a = run(cues, [16]).map((f) => f.cue.t);
    const b = run(cues, [50, 1, 50, 1]).map((f) => f.cue.t);
    expect(b).toEqual(a);
  });

  it('feeds a real simulateBossV2 log: ends with a defeat then the end cue', () => {
    const { result } = bossFight('witch', 30);
    const cues = buildBossCues(result, profile('staff'));
    expect(cues[0]).toMatchObject({ type: 'spawn', maxHp: result.bossMaxHp });
    expect(cues.at(-1)).toMatchObject({ type: 'end', won: result.won });
    if (result.won) {
      expect(cues.filter((c) => c.type === 'defeat')).toHaveLength(1);
      const di = cues.findIndex((c) => c.type === 'defeat');
      expect(cues[di - 1]).toMatchObject({ hp: 0 });
    }
  });
});

describe('idle loop', () => {
  const stats = v2.deriveStats({ classId: 'archer', level: 5 });
  const monster: v2.MonsterStats = { id: 'm', hp: 120, atk: 2, def: 1, attackIntervalMs: 1500, xp: 3, fish: 1 };

  it('kills the monster at the monsterFight time and loops with a respawn gap', () => {
    const fight = v2.monsterFight(stats, monster);
    const cues = buildIdleCues(stats, monster, { cycles: 2, respawnMs: 500 });
    const defeats = cues.filter((c) => c.type === 'defeat');
    expect(defeats).toHaveLength(2);
    expect(defeats[0]!.t).toBeCloseTo(fight.timeToKillMs, 6);
    const spawns = cues.filter((c) => c.type === 'spawn');
    expect(spawns[1]!.t).toBeCloseTo(fight.timeToKillMs + 500, 6);
    const lastImpact = cues.filter((c) => c.type === 'impact')[0]!;
    expect(lastImpact.t).toBeGreaterThan(0);
  });

  it('lowers HP monotonically to exactly 0 on the last impact', () => {
    const hps = buildIdleCues(stats, monster).flatMap((c) => (c.type === 'impact' ? [c.hp] : []));
    expect(hps.at(-1)).toBe(0);
    for (let i = 1; i < hps.length; i++) expect(hps[i]!).toBeLessThanOrEqual(hps[i - 1]!);
  });
});

describe('Pool', () => {
  it('never creates more than its cap over 1,000 hits', () => {
    let made = 0;
    const pool = new Pool(30, () => ({ id: made++ }));
    let refused = 0;
    for (let hit = 0; hit < 1000; hit++) {
      for (let i = 0; i < 12; i++) if (!pool.acquire()) refused++;
      expect(pool.active.length).toBeLessThanOrEqual(30);
      if (hit % 3 === 0) pool.releaseAll();
    }
    expect(made).toBeLessThanOrEqual(30);
    expect(pool.size).toBe(made);
    expect(refused).toBeGreaterThan(0);
  });

  it('reuses released objects and can recycle the oldest when full', () => {
    const pool = new Pool(2, () => ({}), () => {}, true);
    const a = pool.acquire()!;
    const b = pool.acquire()!;
    expect(pool.acquire()).toBe(a);
    pool.release(b);
    expect(pool.acquire()).toBe(b);
    expect(pool.size).toBe(2);
  });
});
