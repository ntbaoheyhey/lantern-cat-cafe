/** B4 round four, pass 5 (user reopened tuning on 12 Nov). Authored chapter budgets, independent of player
 * stats, inventory, win history or elapsed time. See reports/cardrpg-c2/BALANCE.md.
 * New encounters freeze these numbers in enemyStats; replays never retune. */
export const BALANCE_C2 = {
  campaign: {
    // 20 Nov: chapter 3 was a wall (fresh, equipped and fully upgraded crews all lost across 8 seeds and 4 days).
    // Now a crew that equips its drops and spends its earnings clears it first try; an untouched starter crew
    // still loses, so the defeat screen's "improve team" step is the real way through (campaign-clear-a6.test.ts, 8 seeds).
    ordinary: { hp: [3.2, 3.7, 1], attack: [1.1, .95, 1.75] },
    boss: { hp: [2.2, 1.7, 1.35], attack: [.7, .7, 1.3] },
  },
} as const;
