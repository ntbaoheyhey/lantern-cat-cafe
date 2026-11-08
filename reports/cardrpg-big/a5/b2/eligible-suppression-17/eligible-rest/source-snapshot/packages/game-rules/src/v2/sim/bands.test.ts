import { expect, it } from 'vitest';
import { bandV2, renderBandsV2 } from './report';

it('keeps missing and empty observations outside finite bands', () => {
  expect(bandV2([3, 1, 2, 4])).toEqual([1, 2.5, 4]);
  expect(bandV2([1, null])).toEqual([1, Infinity, Infinity]);
  expect(bandV2([])).toEqual([Infinity, Infinity, Infinity]);
  expect(renderBandsV2([], {}).includes('first-boss | FAIL')).toBe(true);
});

import { CLASS_IDS } from '../content';
import { simulateV2, type SimResultV2 } from './simulate';
import { PROPOSED_V2_OVERRIDES } from './proposal';

function cohort(): SimResultV2[] {
  return CLASS_IDS.flatMap((classId, c) => Array.from({ length: 10 }, (_, index) => {
    const r = simulateV2({ classId, seed: index + 1, maxActiveMinutes: 0 });
    let cumulative = 0;
    for (let chapter = 1; chapter <= 5; chapter++) {
      const minutes = 12 * (1 + c * .01) * 1.5 ** (chapter - 1);
      cumulative += minutes;
      r.minutesPerChapter[chapter] = minutes;
      r.minutesToChapterBossWin[chapter] = cumulative;
      r.bosses[chapter] = { fights: 1, losses: Number(index >= 5), firstAttemptWon: index < 5, durationsMs: [60000], levels: [1] };
    }
    r.minutesToFirstBossWin = r.minutesPerChapter[1]!;
    for (const key of ['1:1', '3:5']) r.roundSamples[key] = { level: 1, timeToKillMs: 4000, walkTimeMs: 1000, walkShare: .2, timeToKillByLevelMs: [4000] };
    return r;
  }));
}

it('marks a complete cohort inside every band as passing', () => {
  const report = renderBandsV2(cohort(), PROPOSED_V2_OVERRIDES);
  expect(report).not.toContain('FAIL');
  expect(report.match(/\| first-boss \| PASS/g)).toHaveLength(1);
});

it('reports seed outliers that a passing first-boss median would hide', () => {
  const runs = cohort();
  runs[0]!.minutesToFirstBossWin = 16;
  const report = renderBandsV2(runs, PROPOSED_V2_OVERRIDES);
  expect(report).toContain('| first-boss | FAIL | Historical median/cohort verdict: PASS.');
});

it('uses paired seed growth and refuses boss-duration and walk-share tails', () => {
  const runs = cohort();
  runs[0]!.minutesPerChapter[2] = 12;
  runs[0]!.bosses[1]!.durationsMs.push(180001);
  runs[0]!.roundSamples['3:5']!.walkShare = .51;
  const report = renderBandsV2(runs, PROPOSED_V2_OVERRIDES);
  for (const key of ['chapter-growth', 'boss-check', 'walk-share']) expect(report).toContain(`| ${key} | FAIL | Historical median/cohort verdict: PASS.`);
});

it('checks each seed cross-class spread even if class medians pass', () => {
  const runs = cohort();
  runs[0]!.minutesToChapterBossWin[5]! *= 1.3;
  expect(renderBandsV2(runs, PROPOSED_V2_OVERRIDES)).toContain('| class-spread | FAIL | Historical median/cohort verdict: PASS.');
});
