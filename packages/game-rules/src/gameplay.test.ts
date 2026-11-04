import { describe, expect, it } from 'vitest';
import { CONFIG } from './config';
import { chapterJourney, bonusRollQuality, replayOutcome } from './gameplay';
import { BONUS_LINE_RANGES } from './v2/content/stats';
import { CHAPTERS } from './v2/content/chapters';

describe('client presentation is derived from authoritative facts', () => {
  it('requires every round, not just one finished round, in every chapter', () => {
    for (const ch of CHAPTERS) {
      expect(chapterJourney(ch.index, 1, ch.killsPerRound).bossReached).toBe(false);
      expect(chapterJourney(ch.index, ch.roundsPerChapter, ch.killsPerRound - 1).bossReached).toBe(false);
      expect(chapterJourney(ch.index, ch.roundsPerChapter, ch.killsPerRound)).toMatchObject({ remaining: 0, bossReached: true });
    }
    expect(chapterJourney(999, 1, 0).bossReached).toBe(false);
    expect(chapterJourney(1, -10, -8).done).toBe(0);
  });
  it('does not manufacture a great roll for guaranteed rarity or an empty bonus list', () => {
    expect(bonusRollQuality('common', [])).toEqual({ quality: null, great: false });
    const [min, max] = BONUS_LINE_RANGES.critChance!.rare;
    expect(bonusRollQuality('rare', [{ stat: 'critChance', value: min }])).toEqual({ quality: 0, great: false });
    expect(bonusRollQuality('rare', [{ stat: 'critChance', value: max }])).toEqual({ quality: 1, great: true });
    expect(bonusRollQuality('rare', [{ stat: 'critChance', value: NaN }]).great).toBe(false);
    const lines = [{ stat: 'critChance' as const, value: min + (max - min) * 0.5 }];
    expect(bonusRollQuality('rare', lines).great).toBe(false);
    expect(lines[0]!.value).toBe(min + (max - min) * 0.5);
  });
  it('uses replay health, not a guessed win chance, for outcome labels', () => {
    expect(replayOutcome(false, 100, [{ catHp: 100 }])).toBe('retry');
    expect(replayOutcome(true, 100, [{ catHp: 100 }])).toBe('perfect');
    expect(replayOutcome(true, 100, [{ catHp: 99 }, { catHp: 100 }])).toBe('victory');
    expect(replayOutcome(true, 100, [{ catHp: 20 }])).toBe('close-call');
    expect(replayOutcome(true, 100, [{ catHp: 21 }])).toBe('victory');
    expect(replayOutcome(true, 100, [])).toBe('victory');
  });
  it('stays inside existing server claim and presentation budgets', () => {
    expect(CONFIG.gameplay.firstClaimMs).toBeGreaterThanOrEqual(10_000);
    expect(60_000 / CONFIG.gameplay.claimIntervalMs + 1).toBeLessThanOrEqual(12);
    expect(CONFIG.gameplay.juice.critStopMs).toBeGreaterThanOrEqual(40);
    expect(CONFIG.gameplay.juice.critStopMs).toBeLessThanOrEqual(80);
    expect(CONFIG.gameplay.juice.maxShakePx).toBeLessThanOrEqual(2);
  });
});
