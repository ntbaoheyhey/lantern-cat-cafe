/** One timeline player per scene. These are shared immutable limits, not per-target limits. */
export const SKILL_MAX_LAYERS = 16;
export const SKILL_MAX_COUNT = 32;
export const SKILL_BUDGETS = {
  high: {draws: 96, motes: 64},
  low: {draws: 48, motes: 24},
  reduced: {draws: 24, motes: 8},
} as const;
