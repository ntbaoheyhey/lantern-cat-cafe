import type { ConfigOverridesV2 } from './config';
/** Failing fallback from a bounded search. Proposal only; production V2_CONFIG is unchanged. */
export const PROPOSED_V2_OVERRIDES: ConfigOverridesV2 = {
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
export const PROPOSAL_REASONS_V2: Record<string, string> = {
  'cat.baseAtk': 'The best candidate meeting the mandatory claim-size stability check in the searched family. Its first-boss target still fails; do not sign off.',
  'cat.baseHp': 'Cap starting HP at three times current health, retaining meaningful early boss losses and class HP/DEF differences.',
  'cat.baseDef': 'Keep the current base DEF of 5; class defensive multipliers remain content-defined.',
  'cat.levelGrowth': 'Retain current 6% stat growth rather than the old 0.8% proposal so levels materially improve combat strength.',
  'monster.hpBase': 'Use three times starting monster HP so attacking matters more than walking at the measured probes.',
  'monster.hpGrowth': 'Use 6% stage HP growth to keep later monsters manageable within the three-minute boss cap; chapter growth still fails.',
  'monster.atkBase': 'Double initial monster damage to retain survival pressure alongside the bounded HP increase.',
  'monster.atkGrowth': 'Use 6% stage damage growth to avoid late survival walls; first-attempt success still needs content tuning.',
  'idle.gearDropChance': 'Reduce gear drops to 0.67% (33.5% of current); the finite search uses this lower loot rate to change early equipment progression. This is a real balance cost, not a measurement-only adjustment.',
  'boss.lossCooldownSeconds': 'Search shorter retry cooldowns while preserving the production boss application rule.',
  'monster.xpBase': 'Triple initial XP per monster to make level progression meaningful before the first boss and reduce early farming waits.',
  'idle.dailyKeys': 'Grant three daily keys, the allowed maximum; the remaining key budget gap is explicitly reported.',
  'idle.walkTimeMs': 'Keep current one-second walking instead of six seconds; measured combat retains the larger share of each probe.',
  'cat.xpGrowth': 'Search XP-to-next-level growth to reduce late over-leveling.',
  'monster.xpGrowth': 'Search stage XP growth independently of monster HP.',
  'boss.maxMs': 'Bound every boss attempt to three minutes instead of the old twenty-minute proposal.',
  'boss.attackIntervalMs': 'Allow 4.5 seconds between normal boss attacks to keep bounded player HP viable; first-attempt rate failures remain visible.',
  'boss.bigEveryMs': 'Keep the current six-second big-attack cadence so telegraphed attacks remain part of combat.',
  'boss.bigMultiplier': 'Reduce big-hit damage to 1.5 times normal damage while retaining early survival losses.',
};

/** Scenario only, needs a user decision; never applied to production or the proposal. */
export const SCENARIO_V2_OVERRIDES: Record<'S-A' | 'S-B', { scenario: 'S-A' | 'S-B'; overrides: ConfigOverridesV2 }> = {
  'S-A': {
    scenario: 'S-A',
    overrides: {
      cat: {
        baseAtk: 14,
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
        xpGrowth: 1.11
      },
      idle: {
        dailyKeys: 5,
        walkTimeMs: 1000,
        gearDropChance: 0.0067
      },
      boss: {
        maxMs: 180000,
        attackIntervalMs: 4500,
        bigEveryMs: 6000,
        bigMultiplier: 1.5
      }
    }
  },
  'S-B': {
    scenario: 'S-B',
    overrides: {
      cat: {
        baseAtk: 14,
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
        xpGrowth: 1.11
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
    }
  }
};

/** Frozen previous proposal for causal diagnostics. */
export const C5B_V2_OVERRIDES: ConfigOverridesV2 = {
  cat: { baseAtk: 14, baseHp: 300, baseDef: 5, levelGrowth: 0.06 },
  monster: { hpBase: 90, hpGrowth: 1.06, atkBase: 8, atkGrowth: 1.06, xpBase: 18 },
  idle: { dailyKeys: 3, walkTimeMs: 1000, clearedChapterKeyChance: 0.02 },
  boss: { maxMs: 180000, attackIntervalMs: 4500, bigEveryMs: 6000, bigMultiplier: 1.5 },
};

/** A first-boss target witness, excluded from the main proposal by the timing diagnostic. */
export const CONFIG_FIRST_BOSS_WITNESS_V2: ConfigOverridesV2 = {
  cat: { baseAtk: 14, baseHp: 300, baseDef: 5, levelGrowth: 0.06, xpGrowth: 1.12 },
  monster: { hpBase: 90, hpGrowth: 1.06, atkBase: 8, atkGrowth: 1.06, xpBase: 18, xpGrowth: 1.11 },
  idle: { dailyKeys: 3, walkTimeMs: 1000, gearDropChance: 0.0067 },
  boss: { maxMs: 180000, attackIntervalMs: 4500, bigEveryMs: 6000, bigMultiplier: 1.5 },
};
