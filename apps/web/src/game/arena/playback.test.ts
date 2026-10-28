import { describe, expect, it, vi } from 'vitest';
import { ArenaPlayback } from './playback';
import { ARENA_FIXTURES } from './arenaFixtures';
import { buildArenaCues, finalState, type ArenaCue } from './cues';

describe('arena replay', () => {
  for (const fixture of ARENA_FIXTURES) for (const reducedMotion of [false, true]) {
    it(`${fixture.id}, reduced motion ${reducedMotion}: exact order, HP and ending`, () => {
      const options = { ...fixture, reducedMotion };
      const seen: ArenaCue[] = [], finish = vi.fn();
      const replay = new ArenaPlayback(fixture.result, options, { cue: c => seen.push(c), finish });
      const source = buildArenaCues(fixture.result, options);
      const speed = Math.max(1, Math.max(...source.map(c => c.t)) / 12000);
      const expected = source.map(c => c.type === 'release' ? { ...c, t: c.t / speed, travelMs: c.travelMs / speed } : { ...c, t: c.t / speed });
      replay.advance(0);
      replay.advance(1e9);
      replay.advance(1e9); replay.skip();
      expect(seen).toEqual(expected);
      expect(finish).toHaveBeenCalledExactlyOnceWith(finalState(fixture.result, options));
      if (reducedMotion) expect(seen.some(c => c.type === 'shake' || c.type === 'flash')).toBe(false);
      // Tied cues are emitted in C14 order, including end before the defeat extra.
      for (const t of new Set(expected.map(c => c.t))) expect(seen.filter(c => c.t === t)).toEqual(expected.filter(c => c.t === t));
    });
  }
  it('Skip emits only final HP and calls completion exactly once', () => {
    const f = ARENA_FIXTURES.find(f => !f.result.won)!;
    const options = { ...f, reducedMotion: false };
    const cue = vi.fn(), finish = vi.fn();
    const replay = new ArenaPlayback(f.result, options, { cue, finish });
    replay.skip(); replay.skip(); replay.advance(100000);
    expect(cue).not.toHaveBeenCalled();
    expect(finish).toHaveBeenCalledExactlyOnceWith(finalState(f.result, options));
  });
  it('clamps negative authoritative HP on Skip', () => {
    const f = ARENA_FIXTURES[0]!;
    const result = { ...f.result, timeline: [{ t: 1, type: 'end' as const, catHp: -3, bossHp: -7 }] };
    const finish = vi.fn();
    new ArenaPlayback(result, { ...f, reducedMotion: false }, { cue: vi.fn(), finish }).skip();
    expect(finish).toHaveBeenCalledWith({ catHp: 0, bossHp: 0, won: true });
  });
});

it('scales a 60 second replay to 12 seconds, preserving event order and projectile arrival', () => {
  const fixture = ARENA_FIXTURES[0]!;
  const result = { ...fixture.result, timeline: [{ type: 'attack_start' as const, t: 0 }, { type: 'impact' as const, t: 850, damage: 10, bossHp: 10 }, { type: 'end' as const, t: 60000 }] };
  const finish = vi.fn();
  const replay = new ArenaPlayback(result, { ...fixture, classId: 'witch', reducedMotion: false }, { cue: vi.fn(), finish });
  expect(replay.speed).toBe(5);
  const release = replay.cues.find(c => c.type === 'release')!;
  const impact = replay.cues.find(c => c.type === 'impact')!;
  expect(impact.t - release.t).toBe(release.type === 'release' ? release.travelMs : -1);
  replay.advance(11999); expect(finish).not.toHaveBeenCalled();
  replay.advance(1); expect(finish).toHaveBeenCalledOnce();
});

it('pauses while hidden and returns straight to the confirmed result without a cue burst', () => {
  const f = ARENA_FIXTURES[0]!, cue = vi.fn(), finish = vi.fn();
  const replay = new ArenaPlayback(f.result, { ...f, reducedMotion: false }, { cue, finish });
  replay.visibility(true); replay.advance(60000);
  expect(cue).not.toHaveBeenCalled(); expect(finish).not.toHaveBeenCalled();
  replay.visibility(false); replay.visibility(false);
  expect(cue).not.toHaveBeenCalled(); expect(finish).toHaveBeenCalledExactlyOnceWith(finalState(f.result, f));
});
