import { describe, expect, it } from 'vitest';
import { bossOfChapter, deriveStats, monsterAt, monsterFight, simulateBossV2, stageOf } from './combat';
import { CHAPTERS, CLASSES, type ClassId } from './content';
import { computeClaimV2 } from './idle';
import { applyBossResult, emptyState } from './state';
import type { PlayerStateV2 } from './state/types';
import { rollChestV2 } from './view/chest';
import { claimInputV2 } from './view/claim';
import { lootViewV2 } from './view/loot';
import { withConfigV2 } from './sim/config';
import { V2_CONFIG } from './config';

const today = '2026-10-25';
function stateOf(classId: ClassId): PlayerStateV2 {
  const result = emptyState();
  if (!result.ok) throw new Error('empty state');
  return { ...result.state, classId, level: 5, chapter: 2, round: 3, bestStage: 12 };
}

/** FNV-1a over JSON's UTF-16 code units; fixtures below contain only ASCII. */
function digest(value: unknown): string {
  let hash = 0x811c9dc5;
  for (const char of JSON.stringify(value)) hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193);
  return (hash >>> 0).toString(16).padStart(8, '0');
}

const GOLDEN: Record<string, { boss: string; claim: string; chest: string }> = {
  "warrior:1": {
    "boss": "f77a0f36",
    "claim": "984e03ce",
    "chest": "330bc17f"
  },
  "warrior:2": {
    "boss": "43f8ce01",
    "claim": "99c69e8c",
    "chest": "fab4080b"
  },
  "warrior:3": {
    "boss": "f77a0f36",
    "claim": "71f7df94",
    "chest": "1e201172"
  },
  "guardian:1": {
    "boss": "308af879",
    "claim": "d8698d24",
    "chest": "deea11e3"
  },
  "guardian:2": {
    "boss": "c1339390",
    "claim": "fba8ab15",
    "chest": "fab4080b"
  },
  "guardian:3": {
    "boss": "308af879",
    "claim": "8a769b19",
    "chest": "1e201172"
  },
  "rogue:1": {
    "boss": "0a37d06e",
    "claim": "669b68a9",
    "chest": "e8c9ce6d"
  },
  "rogue:2": {
    "boss": "f65372e8",
    "claim": "c28b4334",
    "chest": "fab4080b"
  },
  "rogue:3": {
    "boss": "fe594cc4",
    "claim": "643244fc",
    "chest": "1e201172"
  },
  "hunter:1": {
    "boss": "52475c8e",
    "claim": "8757686d",
    "chest": "16bdef8b"
  },
  "hunter:2": {
    "boss": "05061dac",
    "claim": "a7ac2a23",
    "chest": "fab4080b"
  },
  "hunter:3": {
    "boss": "52475c8e",
    "claim": "a66b143b",
    "chest": "1e201172"
  },
  "archer:1": {
    "boss": "bb5d2984",
    "claim": "bdc975c4",
    "chest": "8a57c12f"
  },
  "archer:2": {
    "boss": "58cd4121",
    "claim": "0a3658e7",
    "chest": "fab4080b"
  },
  "archer:3": {
    "boss": "bb5d2984",
    "claim": "94bf5ec2",
    "chest": "1e201172"
  },
  "witch:1": {
    "boss": "eef3f935",
    "claim": "8cdd77c7",
    "chest": "60b7956d"
  },
  "witch:2": {
    "boss": "eef3f935",
    "claim": "ad498dd1",
    "chest": "fab4080b"
  },
  "witch:3": {
    "boss": "eef3f935",
    "claim": "d4760313",
    "chest": "1e201172"
  },
  "alchemist:1": {
    "boss": "2d8e74b5",
    "claim": "fa242f38",
    "chest": "89fd6881"
  },
  "alchemist:2": {
    "boss": "2d8e74b5",
    "claim": "66f132d5",
    "chest": "fab4080b"
  },
  "alchemist:3": {
    "boss": "2d8e74b5",
    "claim": "c1f3e415",
    "chest": "1e201172"
  }
};

// Captured from unmodified origin/main before adding any production levers.
describe('v2 default golden digests', () => {
  it('preserves boss stats and chapter pacing', () => {
    const actual = digest({ bosses: CHAPTERS.map(ch => bossOfChapter(ch.index)), kills: CHAPTERS.map(ch => ch.killsPerRound) });
    expect(actual).toBe('cb3a4b19');
  });

  for (const { id: classId } of CLASSES) {
    for (const seed of [1, 2, 3]) {
      it(`preserves ${classId} seed ${seed}: boss logs, claim and chests`, () => {
        const actual = {
          boss: digest([1, 3, 5].map(ch => simulateBossV2(deriveStats({ classId, level: 10 }, []), classId, bossOfChapter(ch), seed).log)),
          claim: digest(computeClaimV2(claimInputV2(stateOf(classId), { today, offline: false }), 3600, seed)),
          chest: digest([1, 5].flatMap(chapter => [true, false].map(firstClear => rollChestV2({ chapter, firstClear, classId, level: 5 }, seed)))),
        };
        expect(actual).toEqual(GOLDEN[`${classId}:${seed}`]);
      });
    }
  }
});


describe('v2 config levers at call time', () => {
  it('adds first-clear keys without changing other rewards or any rematch', () => {
    for (const { id: classId } of CLASSES) for (const seed of [1, 2, 3]) for (const ch of CHAPTERS) {
      const input = { chapter: ch.index, firstClear: true, classId, level: 5 };
      const baseline = rollChestV2(input, seed);
      const repeat = rollChestV2({ ...input, firstClear: false }, seed);
      withConfigV2({ boss: { firstClearKeys: 1 } }, () => {
        const chest = rollChestV2(input, seed);
        expect(chest.stackDeltas.catKey).toBe(1);
        expect(chest).toEqual({ ...baseline, stackDeltas: { ...baseline.stackDeltas, catKey: 1 } });
        expect(lootViewV2(chest.stackDeltas, chest.items, []).keys).toBe(1);
        const rematch = rollChestV2({ ...input, firstClear: false }, seed);
        expect(rematch).toEqual(repeat);
        expect(rematch.stackDeltas.catKey).toBeUndefined();
      });
      expect(rollChestV2(input, seed)).toEqual(baseline);
    }
  });

  it('spends the entry key before refunding it and respects the existing stack cap', () => {
    for (const [held, refund, expected] of [[1, 1, 1], [5, 3, 5]] as const) {
      withConfigV2({ boss: { firstClearKeys: refund } }, () => {
        const state = { ...stateOf('warrior'), chapter: 1, round: 10, kills: 6, stacks: { catKey: held } };
        const chest = rollChestV2({ chapter: 1, firstClear: true, classId: 'warrior', level: state.level }, 1);
        const result = applyBossResult(state, { won: true, chapter: 1, chest,
          keyCost: V2_CONFIG.boss.keyCost, cooldownS: V2_CONFIG.boss.lossCooldownSeconds, now: 0 });
        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error(result.code);
        expect(result.firstClear).toBe(true);
        expect(result.keySpent).toBe(true);
        expect(result.state.stacks.catKey).toBe(expected);
        expect(state.stacks.catKey).toBe(held);
        expect(applyBossResult({ ...state, stacks: { catKey: 0 } }, { won: true, chapter: 1, chest,
          keyCost: 1, cooldownS: 60, now: 0 })).toEqual({ ok: false, code: 'no_key' });
      });
    }
  });

  it('uses twelve kills in a chapter-three claim before advancing the round, then restores ten', () => {
    expect(CHAPTERS[2]!.killsPerRound).toBe(10);
    withConfigV2({ chapters: { killsPerRound: [6, 10, 12, 10, 10] } }, () => {
      const chapter = CHAPTERS[2]!;
      expect(chapter.killsPerRound).toBe(12);
      const state = { ...stateOf('warrior'), level: 60, chapter: 3, round: 3, bestStage: 22 };
      const input = claimInputV2(state, { today, offline: false });
      const stats = deriveStats({ classId: 'warrior', level: 60 }, []);
      // Independent kill-by-kill reference: eleven regulars, then the elite.
      const times = Array.from({ length: 12 }, (_, kill) => {
        const id = kill === 11 ? chapter.elite : chapter.regulars[kill % chapter.regulars.length]!;
        return monsterFight(stats, monsterAt(id, stageOf(3, 3))).timeToKillMs + V2_CONFIG.idle.walkTimeMs;
      });
      const regularMs = times.slice(0, 11).reduce((sum, time) => sum + time, 0);
      const fullMs = regularMs + times[11]!;
      expect(computeClaimV2(input, (regularMs + 0.001) / 1000, 1).progress).toMatchObject({ round: 3, kills: 11, bestStage: 22 });
      // Starting at eleven is valid only with the override; exactly the elite time completes kill twelve.
      const atEleven = { ...input, kills: 11 };
      expect(computeClaimV2(atEleven, times[11]! / 1000, 1).progress).toMatchObject({ round: 3, kills: 12, bestStage: 23 });
      expect(computeClaimV2(input, (fullMs + 0.001) / 1000, 1).progress).toMatchObject({ round: 4, kills: 0, bestStage: 23 });
    });
    expect(CHAPTERS[2]!.killsPerRound).toBe(10);
    const input = claimInputV2({ ...stateOf('warrior'), chapter: 3, kills: 11 }, { today, offline: false });
    expect(() => computeClaimV2(input, 1, 1)).toThrow('Invalid idle frontier');
  });

  it('changes only chapter two HP and ATK, independently, and restores them', () => {
    const baseline = CHAPTERS.map(ch => bossOfChapter(ch.index));
    withConfigV2({ boss: { chapterHpMul: [40, 60, 40, 40, 40] } }, () => {
      for (const ch of CHAPTERS) {
        const boss = bossOfChapter(ch.index);
        const before = baseline[ch.index - 1]!;
        if (ch.index !== 2) expect(boss).toEqual(before);
        else {
          expect(Math.abs(boss.hp - before.hp * 60 / 40)).toBeLessThanOrEqual(1);
          expect(boss).toEqual({ ...before, hp: boss.hp });
        }
      }
    });
    withConfigV2({ boss: { chapterAtkMul: [2.5, 3.75, 2.5, 2.5, 2.5] } }, () => {
      for (const ch of CHAPTERS) {
        const boss = bossOfChapter(ch.index);
        const before = baseline[ch.index - 1]!;
        if (ch.index !== 2) expect(boss).toEqual(before);
        else {
          expect(boss.atk).toBeCloseTo(before.atk * 3.75 / 2.5, 10);
          expect(boss).toEqual({ ...before, atk: boss.atk });
        }
      }
    });
    expect(CHAPTERS.map(ch => bossOfChapter(ch.index))).toEqual(baseline);
  });
});
