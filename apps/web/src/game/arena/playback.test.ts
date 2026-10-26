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
      const expected = buildArenaCues(fixture.result, options);
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
