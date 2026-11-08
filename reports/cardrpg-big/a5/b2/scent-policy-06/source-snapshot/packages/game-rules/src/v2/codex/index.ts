/** Read-only Compendium snapshots. See docs/compendium-adapter.md for ID/source/odds semantics. */
export type * from './types';
export * from './entries';
export * from './odds';

import { toCompendiumEntries } from './entries';
import { allChestOdds } from './odds';
import { readonlyCopy, type CompendiumEntry, type ChestOdds, type ReadonlyData } from './types';

export interface CompendiumData {
  entries: readonly CompendiumEntry[];
  chestOdds: ReadonlyData<Record<string, ChestOdds>>;
}
export function compendiumData(): ReadonlyData<CompendiumData> {
  return readonlyCopy({ entries: toCompendiumEntries(), chestOdds: allChestOdds() });
}
