import { describe, expect, it } from 'vitest';
import { computeFloorY, damageTextStyle, feedbackAt, scaleForMonster, visibleBounds } from './stageFx';
import { buildSheet } from '../rig/bake';
import { CLASS_LOOKS } from '../rig';
import { MONSTER_ART } from '../../art/monsters';

describe('stage grounding', () => {
  it('uses the authored floor, clamps it and documents the 7/8 fallback', () => {
    expect(computeFloorY(96, 84)).toBe(84);
    expect(computeFloorY(96)).toBe(84);
    expect(computeFloorY(96, 200)).toBe(96);
    expect(computeFloorY(96, -10)).toBe(0);
    expect(computeFloorY(100)).toBe(88);
  });
  it('ignores transparent frame padding', () => {
    expect(visibleBounds(8, 8, (x, y) => x >= 2 && x < 6 && y >= 3 && y < 7)).toEqual({ width: 4, height: 4, bottom: 7 });
  });
  it('clamps to half steps within normal and boss height ratios', () => {
    for (const boss of [false, true]) for (const h of [8, 12, 16, 20, 24, 28, 32, 48]) {
      const scale = scaleForMonster(30, h, boss);
      expect(scale * 2).toBe(Math.round(scale * 2));
      expect(h * scale / 30).toBeGreaterThanOrEqual(.8);
      expect(h * scale / 30).toBeLessThanOrEqual(boss ? 1.5 : 1.25);
    }
    expect(scaleForMonster(30, 40, true)).toBe(1);
    expect(() => scaleForMonster(30, 40)).toThrow(RangeError);
  });
  it('rejects invalid and mathematically impossible scale combinations', () => {
    expect(() => scaleForMonster(0, 20)).toThrow(RangeError);
    expect(() => scaleForMonster(10, 100)).toThrow(RangeError);
  });
  it('fits every existing monster against every class using visible pixels', () => {
    for (const look of Object.values(CLASS_LOOKS)) {
      const { image } = buildSheet(look, {});
      const f = image.frames.find(f => f.name === 'idle:0')!;
      const cat = visibleBounds(image.frameW, image.frameH, (x, y) => image.pixels[(f.y + y) * image.width + f.x + x] !== -1);
      for (const art of Object.values(MONSTER_ART)) {
        const rows = (art.frames.walk ?? art.frames.idle)![0]!;
        const monster = visibleBounds(art.size.w, art.size.h, (x, y) => rows[y]![x] !== '.');
        const scale = scaleForMonster(cat.height, monster.height, art.kind === 'boss');
        expect(monster.height * scale / cat.height).toBeGreaterThanOrEqual(.8);
        expect(monster.height * scale / cat.height).toBeLessThanOrEqual(art.kind === 'boss' ? 1.5 : 1.25);
      }
    }
  });
});

describe('impact feedback', () => {
  it('flashes for 80ms, shakes 2px for 100ms, rises 12px and fades for 600ms', () => {
    expect(feedbackAt(0, false)).toMatchObject({ flash: true, shake: 2, rise: 0, alpha: 1 });
    expect(feedbackAt(25, false).shake).toBe(-2);
    expect(feedbackAt(80, false).flash).toBe(false);
    expect(feedbackAt(100, false).shake).toBe(0);
    expect(feedbackAt(300, false)).toMatchObject({ rise: 6, alpha: .5, done: false });
    expect(feedbackAt(600, false)).toMatchObject({ rise: 12, alpha: 0, done: true });
  });
  it('reduced motion keeps numbers in place for 600ms, removes shake and retains flash', () => {
    for (const age of [0, 25, 79, 80, 100, 300, 599]) {
      expect(feedbackAt(age, true)).toMatchObject({ shake: 0, rise: 0, alpha: 1, flash: age < 80 });
    }
    expect(feedbackAt(600, true)).toMatchObject({ alpha: 0, done: true });
  });
  it('uses the numerical font, accent and 1.5x big hits, and muted Miss text', () => {
    expect(damageTextStyle().fontFamily).toContain('JetBrains Mono');
    expect(damageTextStyle(true)).toMatchObject({ fontSize: '15px', color: '#ff9a4a' });
    expect(damageTextStyle(false, true).color).toBe('#b8a9c9');
  });
});
