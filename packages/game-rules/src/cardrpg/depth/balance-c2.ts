/** B4 round four, pass 3 (final allowed candidate). Authored chapter budgets, independent of player
 * stats, inventory, win history or elapsed time. See reports/cardrpg-c2/BALANCE.md.
 * New encounters freeze these numbers in enemyStats; replays never retune. */
export const BALANCE_C2 = {
  campaign: {
    ordinary: { hp: [2.6, 3, 1.25], attack: [1.1, .95, 2.35] },
    boss: { hp: [2.2, 1.7, 1.35], attack: [.7, .7, 1.8] },
  },
} as const;
