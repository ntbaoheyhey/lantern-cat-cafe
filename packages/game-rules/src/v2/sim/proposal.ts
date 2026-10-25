import type { ConfigOverridesV2 } from './config';
/** Proposal only: tested on seeds 1–20, never applied to production config. */
export const PROPOSED_V2_OVERRIDES: ConfigOverridesV2 = {
  cat: { baseAtk: 52, baseHp: 6000, levelGrowth: 0.008 },
  monster: { hpGrowth: 1.111, atkGrowth: 1.01 },
  idle: { dailyKeys: 5, walkTimeMs: 6000 },
  boss: { maxMs: 1200000 },
};
export const PROPOSAL_REASONS_V2: Record<string, string> = {
  'cat.baseAtk': 'Raise starting damage so every class can clear the first frontier and boss at ten minutes.',
  'cat.baseHp': 'Give enough health for the longer late boss fights without widening class clear times.',
  'cat.levelGrowth': 'Grow base stats by 0.8% per level instead of 6% so later chapters keep getting longer.',
  'monster.hpGrowth': 'Grow monster health by 11.1% per stage instead of 13% to keep the last chapter under six hours.',
  'monster.atkGrowth': 'Grow monster damage by 1% per stage instead of 12% so long fights remain survivable.',
  'idle.dailyKeys': 'Grant enough daily keys for all five first clears without waiting for another day.',
  'idle.walkTimeMs': 'Spend six seconds walking between monsters so class attack speed has less effect on chapter times.',
  'boss.maxMs': 'Allow up to twenty minutes per boss fight so later clears are not blocked by the one-minute timeout.',
};
