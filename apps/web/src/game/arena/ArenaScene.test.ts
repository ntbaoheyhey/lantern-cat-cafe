import { expect, it, vi } from 'vitest';
vi.mock('phaser', () => ({ default: { Scene: class {}, Math: { Clamp: (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x)) } } }));
import { ArenaScene } from './ArenaScene';
import type { ArenaCue } from './cues';
import { ARENA_FIXTURES } from './arenaFixtures';
function object() {
  const obj = { play: vi.fn(), setTintFill: vi.fn(), clearTint: vi.fn(), setOrigin: vi.fn(), setDepth: vi.fn(), destroy: vi.fn(), clear: vi.fn(), fillStyle: vi.fn(), fillRect: vi.fn() };
  for (const name of ['setOrigin', 'setDepth', 'clear', 'fillStyle', 'fillRect'] as const) obj[name].mockReturnValue(obj);
  return obj;
}
it('maps every cue into scene actions, clamps HP and honors reduced motion', () => {
  const fixture = ARENA_FIXTURES[0]!;
  for (const reducedMotion of [false, true]) {
    const scene = new ArenaScene(), cat = object(), boss = object(), label = object(), bars = object();
    const hp = vi.fn(), done = vi.fn(), shake = vi.fn(), tween = vi.fn();
    Object.assign(scene, { input0: { ...fixture, reducedMotion, hp, done }, cat, boss, bars,
      sheet: { anims: Object.fromEntries(['attack', 'hurt', 'defeat', 'victory'].map(a => [a, { key: a }])) },
      bossAnims: { hit: 'hit', windup: 'windup', attack: 'attack', defeat: 'defeat' },
      add: { text: vi.fn(() => label), circle: vi.fn(() => label) }, tweens: { add: tween }, cameras: { main: { shake } }, time: { delayedCall: (_t: number, fn: () => void) => fn() },
    });
    const cues: ArenaCue[] = [
      { t: 0, type: 'spawn', maxHp: 100 }, { t: 0, type: 'attackStart', attack: 1 },
      { t: 0, type: 'release', kind: 'arrow', travelMs: 200 }, { t: 0, type: 'impact', hp: -5, damage: 10, source: 'hit', crit: true },
      { t: 0, type: 'dot', hp: -3, source: 'poison', damage: 2 }, { t: 0, type: 'bossWindup', big: true },
      { t: 0, type: 'bossImpact', catHp: -2, big: true, damage: 10, dodged: false },
      { t: 0, type: 'bossImpact', catHp: 0, big: false, damage: 0, dodged: true },
      { t: 0, type: 'flash', target: 'cat' }, { t: 0, type: 'shake', big: true },
      { t: 0, type: 'defeat' }, { t: 0, type: 'bossDefeat' }, { t: 0, type: 'catDefeat' }, { t: 0, type: 'end', won: true }, { t: 0, type: 'cycleEnd' },
    ];
    for (const cue of cues) scene['applyCue'](cue);
    expect(cat.play).toHaveBeenCalledWith('attack'); expect(cat.play).toHaveBeenCalledWith('hurt');
    expect(boss.play).toHaveBeenCalledWith('windup'); expect(boss.play).toHaveBeenCalledWith('attack');
    expect(hp.mock.calls.every(([catHp, bossHp]) => catHp >= 0 && bossHp >= 0)).toBe(true);
    expect(shake).toHaveBeenCalledTimes(reducedMotion ? 0 : 1);
    expect(cat.setTintFill).toHaveBeenCalledTimes(reducedMotion ? 0 : 1);
    scene['finish']({ catHp: 0, bossHp: 5, won: false }); scene['finish']({ catHp: 0, bossHp: 5, won: false });
    expect(done).toHaveBeenCalledOnce(); expect(cat.play).toHaveBeenCalledWith('defeat');
  }
});
