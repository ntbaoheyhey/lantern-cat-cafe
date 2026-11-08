import type { ConfigOverridesV2 } from './config';
export const C5C_SB_OVERRIDES: ConfigOverridesV2 = {
  cat: { baseAtk: 14, baseHp: 300, baseDef: 5, levelGrowth: 0.06, xpGrowth: 1.12 },
  monster: { hpBase: 90, hpGrowth: 1.06, atkBase: 8, atkGrowth: 1.06, xpBase: 18, xpGrowth: 1.11 },
  idle: { dailyKeys: 3, walkTimeMs: 1000, gearDropChance: 0.0067 },
  boss: { maxMs: 180000, attackIntervalMs: 4500, bigEveryMs: 6000, bigMultiplier: 1.5 },
};
/** Frozen previous proposal for causal diagnostics. */
export const C5B_V2_OVERRIDES: ConfigOverridesV2 = {
  cat: { baseAtk: 14, baseHp: 300, baseDef: 5, levelGrowth: 0.06 },
  monster: { hpBase: 90, hpGrowth: 1.06, atkBase: 8, atkGrowth: 1.06, xpBase: 18 },
  idle: { dailyKeys: 3, walkTimeMs: 1000, clearedChapterKeyChance: 0.02 },
  boss: { maxMs: 180000, attackIntervalMs: 4500, bigEveryMs: 6000, bigMultiplier: 1.5 },
};


export const C5C_MAIN_OVERRIDES: ConfigOverridesV2 = {
  cat: {
    baseAtk: 18,
    baseHp: 300,
    baseDef: 5,
    levelGrowth: 0.06,
    xpGrowth: 1.12
  },
  monster: {
    hpBase: 90,
    hpGrowth: 1.06,
    atkBase: 8,
    atkGrowth: 1.06,
    xpBase: 18,
    xpGrowth: 1.15
  },
  idle: {
    dailyKeys: 3,
    walkTimeMs: 1000,
    gearDropChance: 0.0067
  },
  boss: {
    maxMs: 180000,
    attackIntervalMs: 4500,
    bigEveryMs: 6000,
    bigMultiplier: 1.5
  }
};

/** D1 S-B is mandatory in every new candidate. Arrays are ordered ch1..ch5. */
export function candidatesV2(): ConfigOverridesV2[] {
  const rows: ConfigOverridesV2[] = [];
  // Three directed pacing families x three boss pressure families x three XP/ATK families.
  for (const kills of [[6, 12, 18, 25, 30], [12, 16, 22, 28, 30], [18, 22, 26, 30, 30]] as const)
    for (const hp of [[14, 20, 30, 40, 50], [20, 25, 35, 50, 60], [28, 35, 40, 60, 70]] as const)
      for (const [baseAtk, xpGrowth] of [[14, 1.11], [18, 1.15], [14, 1.06]]) rows.push({
        ...C5C_SB_OVERRIDES,
        cat: { ...C5C_SB_OVERRIDES.cat, baseAtk },
        monster: { ...C5C_SB_OVERRIDES.monster, xpGrowth },
        chapters: { killsPerRound: [...kills] },
        boss: { ...C5C_SB_OVERRIDES.boss, firstClearKeys: 1, chapterHpMul: [...hp], chapterAtkMul: [0.85, 1.5, 2.5, 3, 3.5] },
      });
  return [{ ...C5C_SB_OVERRIDES, boss: { ...C5C_SB_OVERRIDES.boss, firstClearKeys: 1 } }, { ...C5C_MAIN_OVERRIDES, boss: { ...C5C_MAIN_OVERRIDES.boss, firstClearKeys: 1 } }, ...rows];
}
export const PROPOSED_V2_OVERRIDES: ConfigOverridesV2 = {
  "cat": {
    "baseAtk": 14,
    "baseHp": 300,
    "baseDef": 5,
    "levelGrowth": 0.06,
    "xpGrowth": 1.12
  },
  "monster": {
    "hpBase": 90,
    "hpGrowth": 1.06,
    "atkBase": 8,
    "atkGrowth": 1.06,
    "xpBase": 18,
    "xpGrowth": 1.11
  },
  "idle": {
    "dailyKeys": 3,
    "walkTimeMs": 1000,
    "gearDropChance": 0.0067
  },
  "boss": {
    "maxMs": 180000,
    "attackIntervalMs": 4500,
    "bigEveryMs": 6000,
    "bigMultiplier": 1.5,
    "firstClearKeys": 1,
    "chapterHpMul": [
      14,
      20,
      30,
      40,
      50
    ],
    "chapterAtkMul": [
      0.85,
      1.5,
      2.5,
      3,
      3.5
    ]
  },
  "chapters": {
    "killsPerRound": [
      18,
      22,
      26,
      30,
      30
    ]
  }
};
export const PROPOSAL_REASONS_V2: Record<string, string> = {
  'cat': 'Retain bounded class-neutral starting stats; ATK varies in the deterministic family.',
  'monster': 'Retain C5c damage/HP leaves; search XP growth independently.',
  'idle': 'D1: at most three daily keys, current one-second walking, C5c gear drop rate.',
  'boss': 'D1: one first-clear key; reduce early pressure and increase late pressure within each leaf guardrail.',
  'chapters': 'Increase later kill counts to counter later chapters becoming shorter; each count is integral and bounded.',
};
export const SCENARIO_V2_OVERRIDES = { 'S-B': { scenario: 'S-B' as const, overrides: PROPOSED_V2_OVERRIDES } };
export const CONFIG_FIRST_BOSS_WITNESS_V2 = C5C_SB_OVERRIDES;

export const RANKED_V2_OVERRIDES: ConfigOverridesV2[] = [
  {
    "cat": {
      "baseAtk": 14,
      "baseHp": 300,
      "baseDef": 5,
      "levelGrowth": 0.06,
      "xpGrowth": 1.12
    },
    "monster": {
      "hpBase": 90,
      "hpGrowth": 1.06,
      "atkBase": 8,
      "atkGrowth": 1.06,
      "xpBase": 18,
      "xpGrowth": 1.11
    },
    "idle": {
      "dailyKeys": 3,
      "walkTimeMs": 1000,
      "gearDropChance": 0.0067
    },
    "boss": {
      "maxMs": 180000,
      "attackIntervalMs": 4500,
      "bigEveryMs": 6000,
      "bigMultiplier": 1.5,
      "firstClearKeys": 1,
      "chapterHpMul": [
        14,
        20,
        30,
        40,
        50
      ],
      "chapterAtkMul": [
        0.85,
        1.5,
        2.5,
        3,
        3.5
      ]
    },
    "chapters": {
      "killsPerRound": [
        18,
        22,
        26,
        30,
        30
      ]
    }
  },
  {
    "cat": {
      "baseAtk": 14,
      "baseHp": 300,
      "baseDef": 5,
      "levelGrowth": 0.06,
      "xpGrowth": 1.12
    },
    "monster": {
      "hpBase": 90,
      "hpGrowth": 1.06,
      "atkBase": 8,
      "atkGrowth": 1.06,
      "xpBase": 18,
      "xpGrowth": 1.06
    },
    "idle": {
      "dailyKeys": 3,
      "walkTimeMs": 1000,
      "gearDropChance": 0.0067
    },
    "boss": {
      "maxMs": 180000,
      "attackIntervalMs": 4500,
      "bigEveryMs": 6000,
      "bigMultiplier": 1.5,
      "firstClearKeys": 1,
      "chapterHpMul": [
        14,
        20,
        30,
        40,
        50
      ],
      "chapterAtkMul": [
        0.85,
        1.5,
        2.5,
        3,
        3.5
      ]
    },
    "chapters": {
      "killsPerRound": [
        12,
        16,
        22,
        28,
        30
      ]
    }
  },
  {
    "cat": {
      "baseAtk": 14,
      "baseHp": 300,
      "baseDef": 5,
      "levelGrowth": 0.06,
      "xpGrowth": 1.12
    },
    "monster": {
      "hpBase": 90,
      "hpGrowth": 1.06,
      "atkBase": 8,
      "atkGrowth": 1.06,
      "xpBase": 18,
      "xpGrowth": 1.06
    },
    "idle": {
      "dailyKeys": 3,
      "walkTimeMs": 1000,
      "gearDropChance": 0.0067
    },
    "boss": {
      "maxMs": 180000,
      "attackIntervalMs": 4500,
      "bigEveryMs": 6000,
      "bigMultiplier": 1.5,
      "firstClearKeys": 1,
      "chapterHpMul": [
        28,
        35,
        40,
        60,
        70
      ],
      "chapterAtkMul": [
        0.85,
        1.5,
        2.5,
        3,
        3.5
      ]
    },
    "chapters": {
      "killsPerRound": [
        12,
        16,
        22,
        28,
        30
      ]
    }
  }
];
