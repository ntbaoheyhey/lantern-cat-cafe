import { RELIC_RECIPE } from '../content/recipes';
import type { ForgeState } from './index';

// Preserve the exact v1 function and its seeded stream/odds.
export { rollRelicRarity } from '../../rules';

export type RelicForgeBlockV2 = 'daily_limit' | 'not_enough_yarn' | 'no_moon_pearl';

/** today is an explicit game-day index; the caller records it after a successful forge. */
export function relicForgeBlockV2(state: ForgeState, today: number): RelicForgeBlockV2 | null {
  if (state.lastRelicDay === today) return 'daily_limit';
  if ((state.stacks.yarn ?? 0) < RELIC_RECIPE.materials.yarn!) return 'not_enough_yarn';
  if ((state.stacks.moonPearl ?? 0) < RELIC_RECIPE.materials.moonPearl!) return 'no_moon_pearl';
  return null;
}
