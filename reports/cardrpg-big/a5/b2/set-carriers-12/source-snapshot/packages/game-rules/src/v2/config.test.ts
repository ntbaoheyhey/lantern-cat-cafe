import { describe, expect, it } from 'vitest';
import { V2_CONFIG } from './config';
import { CHAPTERS } from './content';
import { ARCHETYPE } from './content/monsters';

describe('V2_CONFIG boss keys', () => {
  it('boss keyCost and lossCooldownSeconds match the approved docs', () => {
    expect(V2_CONFIG.boss.keyCost).toBe(1);
    expect(V2_CONFIG.boss.lossCooldownSeconds).toBe(60);
  });
});


describe('V2_CONFIG chapter levers', () => {
  it('has one pacing, HP and ATK entry per chapter with unchanged defaults', () => {
    for (const values of [V2_CONFIG.chapters.killsPerRound, V2_CONFIG.boss.chapterHpMul, V2_CONFIG.boss.chapterAtkMul])
      expect(values).toHaveLength(CHAPTERS.length);
    expect(V2_CONFIG.chapters.killsPerRound).toEqual([6, 10, 10, 10, 10]);
    expect(V2_CONFIG.boss.chapterHpMul).toEqual([40, 40, 40, 40, 40]);
    expect(V2_CONFIG.boss.chapterAtkMul).toEqual([2.5, 2.5, 2.5, 2.5, 2.5]);
    expect(V2_CONFIG.boss.firstClearKeys).toBe(0);
  });

  it('keeps default boss multipliers equal to the documented archetype', () => {
    for (const hp of V2_CONFIG.boss.chapterHpMul) expect(hp).toBe(ARCHETYPE.boss.hpMul);
    for (const atk of V2_CONFIG.boss.chapterAtkMul) expect(atk).toBe(ARCHETYPE.boss.atkMul);
  });
});
