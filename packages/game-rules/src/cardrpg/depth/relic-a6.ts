import type { DepthAccount } from './contract';
import { gameplayA6 } from './gameplay-a6';
import { RELIC_EFFECTS } from './bridge';

export const RELIC_CAP_A6 = 800;
/** One team treasure; quantity and other owned Relics never stack its percentage. */
export function relicBonusA6(state: DepthAccount): number {
  if (!gameplayA6(state) || !state.relics.includes(state.selectedRelic ?? 0)) return 0;
  const relic = RELIC_EFFECTS.find(item => item.id === state.selectedRelic);
  return relic ? Math.min(RELIC_CAP_A6, (relic.rarity + 1) * 200) : 0;
}
