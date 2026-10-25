// @vitest-environment node
import { v2 } from '@taskbar-hero/game-rules';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { BossFightResultV2, TimelineEventV2 } from '../../api/GameApiV2';
import { ARENA_FIXTURES, buildArenaCues, finalState, type ArenaCue, type ArenaCueOptions } from './index';

const PRIMARY = {
  attack_start: 'attackStart', impact: 'impact', boss_windup: 'bossWindup',
  boss_impact: 'bossImpact', dot: 'dot', end: 'end',
} as const;
const RANK = { spawn: 0, attackStart: 1, release: 2, bossWindup: 3, impact: 4, bossImpact: 5, dot: 6, defeat: 7, end: 8, cycleEnd: 9 };
const EXTRAS = new Set(['shake', 'flash', 'bossDefeat', 'catDefeat']);
const options: ArenaCueOptions = { chapter: 1, classId: 'warrior', catMaxHp: 100, reducedMotion: false };
type FlaggedEvent = TimelineEventV2 & { big?: boolean; dodged?: boolean };
const fight = (timeline: FlaggedEvent[], won = true): BossFightResultV2 => ({ ...ARENA_FIXTURES[0]!.result, timeline, won });
const damageCues = (cues: ArenaCue[]) => cues.flatMap(c => 'damage' in c ? [[c.t, c.type, c.damage]] : []);

describe.each(ARENA_FIXTURES)('$id server replay', fixture => {
  const opts = { ...fixture, reducedMotion: false };
  const cues = buildArenaCues(fixture.result, opts);

  it('maps every event to exactly one primary cue, in RANK then source order', () => {
    const expected = fixture.result.timeline.map((e, i) => ({ t: e.t, type: PRIMARY[e.type], i }))
      .sort((a, b) => a.t - b.t || RANK[a.type] - RANK[b.type] || a.i - b.i)
      .map(({ t, type }) => ({ t, type }));
    const primary = cues.filter(c => Object.values(PRIMARY).some(type => type === c.type));
    expect(primary.map(({ t, type }) => ({ t, type }))).toEqual(expected);
    expect(primary).toHaveLength(fixture.result.timeline.length);
    // Spawn is the shared scheduler's initial HP snapshot, separate from timeline events.
    expect(cues.filter(c => c.type === 'spawn')).toHaveLength(1);
    for (const c of cues) {
      expect([...Object.values(PRIMARY), 'spawn', 'release', 'defeat', ...EXTRAS]).toContain(c.type);
    }
    for (let i = 1; i < cues.length; i++) expect(cues[i]!.t).toBeGreaterThanOrEqual(cues[i - 1]!.t);
    const shared = cues.filter((c): c is Exclude<ArenaCue, { type: 'shake' | 'flash' | 'bossDefeat' | 'catDefeat' }> => !EXTRAS.has(c.type));
    for (let i = 1; i < shared.length; i++) {
      if (shared[i]!.t === shared[i - 1]!.t) expect(RANK[shared[i]!.type]).toBeGreaterThanOrEqual(RANK[shared[i - 1]!.type]);
    }
    expect(cues.filter(c => c.type === 'attackStart').map(c => c.attack))
      .toEqual(fixture.result.timeline.filter(e => e.type === 'attack_start').map((_, i) => i + 1));
  });

  it('keeps HP nonnegative and derives Skip HP from the last server values', () => {
    for (const cue of cues) {
      if ('hp' in cue) expect(cue.hp).toBeGreaterThanOrEqual(0);
      if ('catHp' in cue) expect(cue.catHp).toBeGreaterThanOrEqual(0);
      if ('maxHp' in cue) expect(cue.maxHp).toBeGreaterThanOrEqual(0);
      if ('catMaxHp' in cue) expect(cue.catMaxHp).toBeGreaterThanOrEqual(0);
    }
    const lastCat = fixture.result.timeline.filter(e => e.catHp !== undefined).at(-1)?.catHp ?? fixture.catMaxHp;
    const lastBoss = fixture.result.timeline.filter(e => e.bossHp !== undefined).at(-1)?.bossHp ?? v2.bossOfChapter(fixture.chapter).hp;
    expect(finalState(fixture.result, opts)).toEqual({ catHp: Math.max(0, lastCat), bossHp: Math.max(0, lastBoss), won: fixture.result.won });
  });

  it('adds effects immediately after their causes and ends with the correct defeat', () => {
    for (let i = 0; i < cues.length; i++) {
      const cue = cues[i]!;
      if (cue.type === 'impact' && cue.crit) expect(cues[i + 1]).toEqual({ t: cue.t, type: 'flash', target: 'boss' });
      if (cue.type === 'bossImpact') {
        let next = i + 1;
        if (!cue.dodged) expect(cues[next++]).toEqual({ t: cue.t, type: 'shake', big: cue.big });
        if (cue.damage > 0) expect(cues[next]).toEqual({ t: cue.t, type: 'flash', target: 'cat' });
      }
    }
    const end = cues.findIndex(c => c.type === 'end');
    expect(cues[end + 1]).toEqual({ t: cues[end]!.t, type: fixture.result.won ? 'bossDefeat' : 'catDefeat' });
    expect(cues.at(-1)).toEqual(cues[end + 1]);
    const expectedEffects = cues.flatMap(c => c.type === 'impact' && c.crit ? ['flash']
      : c.type === 'bossImpact' ? [...(!c.dodged ? ['shake'] : []), ...(c.damage > 0 ? ['flash'] : [])] : []);
    expect(cues.filter(c => c.type === 'shake' || c.type === 'flash').map(c => c.type)).toEqual(expectedEffects);
  });

  it('reduced motion removes only shake and flash without changing damage or timing', () => {
    const reduced = buildArenaCues(fixture.result, { ...opts, reducedMotion: true });
    expect(reduced).toEqual(cues.filter(c => c.type !== 'shake' && c.type !== 'flash'));
    expect(damageCues(reduced)).toEqual(damageCues(cues));
  });
});

it('covers all six timeline types across six distinct fixtures with the expected outcomes', () => {
  expect(ARENA_FIXTURES).toHaveLength(6);
  expect(new Set(ARENA_FIXTURES.map(f => f.id)).size).toBe(6);
  expect(new Set(ARENA_FIXTURES.flatMap(f => f.result.timeline.map(e => e.type))))
    .toEqual(new Set(Object.keys(PRIMARY)));
  for (const f of ARENA_FIXTURES) expect(f.result.won).toBe(f.id.includes('-win'));
});

it('preserves equal-time RANK and source order while extras stay beside their causes', () => {
  const cues = buildArenaCues(fight([
    { t: 20, type: 'end' },
    { t: 20, type: 'dot', damage: 3, bossHp: 0 },
    { t: 20, type: 'boss_impact', damage: 4, catHp: 10 },
    { t: 20, type: 'impact', damage: 1, crit: true, bossHp: 5 },
    { t: 20, type: 'impact', damage: 2, bossHp: 3 },
    { t: 20, type: 'boss_windup' },
    { t: 20, type: 'attack_start' },
  ]), options);
  expect(cues.map(c => c.type)).toEqual(['spawn', 'attackStart', 'bossWindup', 'impact', 'flash', 'impact', 'bossImpact', 'shake', 'flash', 'dot', 'defeat', 'end', 'bossDefeat']);
  expect(cues.filter(c => c.type === 'impact').map(c => c.damage)).toEqual([1, 2]);
});

it('clamps synthetic negative HP, including spawn and Skip defaults', () => {
  const result = fight([
    { t: 1, type: 'impact', bossHp: -5 },
    { t: 2, type: 'dot', bossHp: -6 },
    { t: 3, type: 'boss_impact', catHp: -8, damage: 108 },
    { t: 4, type: 'end' },
  ]);
  const cues = buildArenaCues(result, { ...options, catMaxHp: -1 });
  for (const cue of cues) {
    if ('hp' in cue) expect(cue.hp).toBe(0);
    if ('catHp' in cue) expect(cue.catHp).toBe(0);
    if ('catMaxHp' in cue) expect(cue.catMaxHp).toBe(0);
  }
  expect(finalState(result, options)).toEqual({ catHp: 0, bossHp: 0, won: true });
  expect(finalState(fight([{ t: 0, type: 'end' }]), { ...options, catMaxHp: -1 }).catHp).toBe(0);
});

it('uses full HP when untouched, retains authoritative healing, and uses result.won', () => {
  expect(finalState(fight([]), options)).toEqual({ catHp: 100, bossHp: v2.bossOfChapter(1).hp, won: true });
  const result = fight([{ t: 1, type: 'boss_impact', catHp: 30 }, { t: 2, type: 'end', catHp: 40, bossHp: 50 }], false);
  expect(finalState(result, options)).toEqual({ catHp: 40, bossHp: 50, won: false });
  expect(buildArenaCues(result, options).at(-2)).toEqual({ t: 2, type: 'end', won: false });
});

const flagTimeline: FlaggedEvent[] = [
  { t: 1, type: 'boss_windup' }, { t: 2, type: 'boss_impact', damage: 0 },
  { t: 3, type: 'boss_windup' }, { t: 4, type: 'boss_impact', damage: 10 },
  { t: 5, type: 'boss_windup' }, { t: 6, type: 'boss_impact', damage: 10 },
  { t: 7, type: 'boss_windup' }, { t: 8, type: 'boss_impact', damage: 30 },
  { t: 9, type: 'end' },
];

it('infers dodge and big hits from the positive-damage median and marks the preceding windup', () => {
  const cues = buildArenaCues(fight(flagTimeline), options);
  expect(cues.filter(c => c.type === 'bossImpact').map(c => [c.big, c.dodged])).toEqual([[false, true], [false, false], [false, false], [true, false]]);
  expect(cues.filter(c => c.type === 'bossWindup').map(c => c.big)).toEqual([false, false, false, true]);
  expect(cues.filter(c => c.type === 'shake')).toHaveLength(3);
  expect(cues.filter(c => c.type === 'flash')).toHaveLength(3);
});

it('uses explicit false and true flags over inference, independently for each event and flag', () => {
  const timeline = flagTimeline.map(e => ({ ...e }));
  timeline[0]!.big = true;
  timeline[1]!.dodged = false;
  timeline[3]!.big = true;
  timeline[3]!.dodged = true;
  timeline[6]!.big = true;
  timeline[7]!.big = false;
  const cues = buildArenaCues(fight(timeline), options);
  expect(cues.filter(c => c.type === 'bossImpact').map(c => [c.big, c.dodged])).toEqual([[false, false], [true, true], [false, false], [false, false]]);
  expect(cues.filter(c => c.type === 'bossWindup').map(c => c.big)).toEqual([true, true, false, true]);
  const suppressed = buildArenaCues(fight([{ t: 0, type: 'boss_windup', big: false }, { t: 1, type: 'boss_impact', damage: 10, big: true }]), options);
  expect(suppressed.find(c => c.type === 'bossWindup')).toMatchObject({ big: false });
});

it('handles zero hits, even medians, and windups before an unmatched final impact', () => {
  expect(buildArenaCues(fight([{ t: 1, type: 'boss_impact', damage: 0 }]), options).find(c => c.type === 'bossImpact'))
    .toMatchObject({ big: false, dodged: true });
  const even = buildArenaCues(fight([10, 10, 20, 30].map((damage, t) => ({ t, type: 'boss_impact', damage }))), options);
  expect(even.filter(c => c.type === 'bossImpact').map(c => c.big)).toEqual([false, false, false, true]);
});

it.each(['witch', 'alchemist'] as const)('restores %s dot sources from the class passive', classId => {
  const cue = buildArenaCues(fight([{ t: 20, type: 'dot', damage: 4, bossHp: 3 }]), { ...options, classId }).find(c => c.type === 'dot');
  expect(cue).toMatchObject({ source: classId === 'witch' ? 'burn' : 'poison', damage: 4, hp: 3 });
});

it('gives every archer impact, including volley arrows, a release travelMs earlier', () => {
  for (const fixture of ARENA_FIXTURES.filter(f => f.classId === 'archer')) {
    const cues = buildArenaCues(fixture.result, { ...fixture, reducedMotion: false });
    const impacts = cues.filter(c => c.type === 'impact');
    const releases = cues.filter(c => c.type === 'release');
    const travelMs = v2.weaponProfileOf('archer').projectile!.travelMs;
    expect(releases).toHaveLength(impacts.length);
    for (let i = 0; i < impacts.length; i++) expect(releases[i]!.t).toBe(impacts[i]!.t - travelMs);
  }
});

it('imports the public arena API in plain node and has no Phaser imports', () => {
  for (const file of ['cues.ts', 'arenaFixtures.ts', 'index.ts']) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    expect(source).not.toMatch(/(?:from\s*|import\s*\(?\s*|require\s*\(\s*)['"][^'"]*phaser[^'"]*['"]/i);
  }
});
