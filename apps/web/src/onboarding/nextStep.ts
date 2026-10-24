import { upgradeCost } from '@taskbar-hero/game-rules';
import type { TabName } from '../Panel';
import type { ServerState } from '../api/GameApi';

export type HintTab = Exclude<TabName, 'Hero' | 'Market'>;

export interface NextStep {
  text: string;
  /** Tab that has the action, or null when there is nothing to do right now. */
  tab: HintTab | null;
}

/** The single most useful next action. `gold` is the gold the player sees (predicted). */
export function nextStep(s: ServerState, gold: number): NextStep {
  if (s.forge.pending) return { text: 'Mint your Relic in Forge', tab: 'Forge' };
  if (s.forge.blockedBy === null) return { text: 'You can forge a Relic now', tab: 'Forge' };
  const canUpgrade = s.inventory.some((g) => {
    if (!g.equipped) return false;
    const cost = upgradeCost(g);
    return cost !== null && cost <= gold;
  });
  if (canUpgrade) return { text: 'Upgrade your gear in Inventory', tab: 'Inventory' };
  const left = s.boss.attemptsLeft;
  if (left > 0 && !s.boss.keyEarnedToday) {
    return { text: `Try the boss (${left} ${left === 1 ? 'fight' : 'fights'} left today)`, tab: 'Boss' };
  }
  return { text: 'Come back tomorrow for a new Boss Key', tab: null };
}
