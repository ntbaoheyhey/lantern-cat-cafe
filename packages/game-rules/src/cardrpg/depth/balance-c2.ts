/** B4 round four, pass 4 (user reopened tuning on 12 Nov). Authored chapter budgets, independent of player
 * stats, inventory, win history or elapsed time. See reports/cardrpg-c2/BALANCE.md.
 * New encounters freeze these numbers in enemyStats; replays never retune. */
export const BALANCE_C2 = {
  campaign: {
    ordinary: { hp: [3.2, 3.7, 1], attack: [1.2, 1.1, 2.65] },
    boss: { hp: [2.2, 1.7, 1.35], attack: [.7, .7, 1.8] },
  },
} as const;
