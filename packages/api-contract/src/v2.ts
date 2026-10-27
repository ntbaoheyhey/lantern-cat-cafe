import type { v2 } from '@taskbar-hero/game-rules';

/** Optional for old servers/saves. Source, not catalog id, identifies free starter gear. */
export interface ItemViewV2 extends v2.ItemViewV2 {
  source?: 'starter' | 'drop' | 'chest' | 'craft' | 'founder';
}
export interface CraftRequestV2 {
  recipeId: string;
  slot: v2.GearSlotId;
  /** UUID v4 per action; reuse on transport retries. Missing means legacy, no deduplication. */
  requestId?: string;
}
export interface BossFightRequestV2 {
  chapter: number;
  /** UUID v4 per action; reuse on transport retries. Missing means legacy, no deduplication. */
  requestId?: string;
}
