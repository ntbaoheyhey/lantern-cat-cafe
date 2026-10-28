import { expect, it } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import { sampleServerStateV2 } from '../../layout/a11y/fixtures';
import { buildIdleCues, CuePlayer } from '../combat/timeline';
import { claimMontage, contactX, expectedCatHp, frontierMonster, impactTime, stageStats } from './choreography';
import { horizontalBounds } from './stageFx';

for (const cls of v2.CLASS_IDS) it(`${cls}: anticipation + strike + travel is the impact cue, within one frame`, () => {
  const stats = v2.deriveStats({ classId: cls, level: 60 });
  const monster = v2.monsterAt(v2.CHAPTERS[0]!.regulars[0]!, 1);
  const weapon = v2.weaponProfileOf(cls), cues = buildIdleCues(stats, monster);
  const impact = cues.find(c => c.type === 'impact')!;
  expect(impact.t).toBe(impactTime(weapon));
  const seen: { type: string; at: number }[] = [];
  const player = new CuePlayer(cues, cue => seen.push({ type: cue.type, at: player.now }));
  while (!player.done) player.advance(1000 / 60);
  if (weapon.projectile) {
    const arrival = seen.find(c => c.type === 'impact')!.at - seen.find(c => c.type === 'release')!.at;
    expect(Math.abs(arrival - weapon.projectile.travelMs)).toBeLessThanOrEqual(1000 / 60);
  }
});

it('calculates contact from asymmetric padded visible bounds at any scale', () => {
  for (const zoom of [1, 2, 3, 4]) {
    const cat = horizontalBounds(64, 64, .5, zoom, (x, y) => x >= 15 && x <= 49 && y > 10);
    const monster = horizontalBounds(32, 32, .5, zoom, (x, y) => x >= 4 && x <= 22 && y > 3);
    const x = contactX(100, cat.right, monster.left);
    expect(x + monster.left - (100 + cat.right)).toBe(2);
  }
});

it('uses kill rotation, final elite, and the actual unbeatable member of a gated round', () => {
  const state = sampleServerStateV2({ kills: 5, round: 1 });
  expect(frontierMonster(state)).toBe(v2.CHAPTERS[0]!.elite);
  state.progress.kills = 1;
  expect(frontierMonster(state)).toBe(v2.CHAPTERS[0]!.regulars[1]);
  state.progress.gated = true; state.cat.level = 1; state.inventory = []; state.progress.round = 10;
  const stats = stageStats(state), id = frontierMonster(state, stats);
  expect(v2.monsterFight(stats, v2.monsterAt(id, 10)).canWin).toBe(false);
  expect(buildIdleCues(stats, v2.monsterAt(id, 10))).toEqual([]);
});

it('caps acknowledged montage at eight and preserves the last elite across round advancement', () => {
  const before = sampleServerStateV2({ round: 1, kills: 0 });
  const after = sampleServerStateV2({ round: 4, kills: 0 });
  const montage = claimMontage(before, after);
  expect(montage).toHaveLength(8);
  expect(montage.at(-1)).toEqual({ id: v2.CHAPTERS[0]!.elite, round: 3 });
  expect(claimMontage(after, before)).toEqual([]);
});

it('spreads exactly monsterFight net damage after regen, with no extra idle HP mechanic', () => {
  const stats = v2.deriveStats({ classId: 'warrior', level: 5 });
  const fight = v2.monsterFight(stats, v2.monsterAt(v2.CHAPTERS[0]!.elite, 2));
  expect(expectedCatHp(stats.hp, fight.damageTaken, 0, fight.timeToKillMs)).toBe(stats.hp);
  expect(expectedCatHp(stats.hp, fight.damageTaken, fight.timeToKillMs / 2, fight.timeToKillMs)).toBeCloseTo(stats.hp - fight.damageTaken / 2);
  expect(expectedCatHp(stats.hp, fight.damageTaken, fight.timeToKillMs, fight.timeToKillMs)).toBeCloseTo(Math.max(0, stats.hp - fight.damageTaken));
});
