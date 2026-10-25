import { describe, expect, it } from 'vitest';
import { bossOfChapter, deriveStats, simulateBossV2 } from './combat';
import { CHAPTERS, CLASSES, type ClassId } from './content';
import { computeClaimV2 } from './idle';
import { emptyState } from './state';
import type { PlayerStateV2 } from './state/types';
import { rollChestV2 } from './view/chest';
import { claimInputV2 } from './view/claim';

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
