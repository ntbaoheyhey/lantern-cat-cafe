import { v2 } from '@taskbar-hero/game-rules';
import type { GainsV2, LootV2, MaterialStacks, OtherMaterialId } from '../../api/GameApiV2';

export interface LootLineV2 {
  id: 'fish' | 'yarn' | 'keys' | OtherMaterialId;
  label: string;
  amount: number;
}

/**
 * Returns formatted loot lines in canonical order:
 * fish, yarn, keys, then materials in registry order (v2.MATERIALS).
 * Filters out non-positive amounts.
 * Amounts are floored integers (no rounding beyond Math.floor).
 */
export function lootLines(loot: Pick<LootV2, 'fish' | 'yarn' | 'keys' | 'materials'>): LootLineV2[] {
  const lines: LootLineV2[] = [];

  const fish = Math.floor(loot.fish);
  if (fish > 0) {
    lines.push({ id: 'fish', label: 'Fish', amount: fish });
  }

  const yarn = Math.floor(loot.yarn);
  if (yarn > 0) {
    const yarnDef = v2.MATERIALS.find((m) => m.id === 'yarn');
    lines.push({ id: 'yarn', label: yarnDef?.name ?? 'Yarn', amount: yarn });
  }

  const keys = Math.floor(loot.keys);
  if (keys > 0) {
    const keyDef = v2.MATERIALS.find((m) => m.id === 'catKey');
    lines.push({ id: 'keys', label: keyDef?.name ?? 'Cat Key', amount: keys });
  }

  const mats: MaterialStacks = loot.materials ?? {};
  for (const m of v2.MATERIALS) {
    if (m.id === 'yarn' || m.id === 'catKey') continue;
    const val = mats[m.id as OtherMaterialId];
    if (val !== undefined && Math.floor(val) > 0) {
      lines.push({
        id: m.id as OtherMaterialId,
        label: m.name,
        amount: Math.floor(val),
      });
    }
  }

  return lines;
}

/**
 * Returns true if loot contains no currencies, no materials, no items, no autoSalvaged items,
 * and (for GainsV2) 0 XP and 0 levels gained.
 */
export function isEmptyLoot(loot: LootV2 | GainsV2): boolean {
  if (lootLines(loot).length > 0) return false;
  if (loot.items && loot.items.length > 0) return false;
  if (loot.autoSalvaged && loot.autoSalvaged.length > 0) return false;
  if ('xp' in loot && Math.floor(loot.xp) > 0) return false;
  if ('levelsGained' in loot && Math.floor(loot.levelsGained) > 0) return false;
  return true;
}

/**
 * Formats a numeric amount for display.
 * - Under 1,000,000: comma-separated integer (e.g. 0 -> '0', 999 -> '999', 1234 -> '1,234').
 * - 1,000,000 and above: divided by 1M with 'M' suffix:
 *   - Under 10M: up to 2 decimal places without trailing zeros (e.g. 1_250_000 -> '1.25M', 1_000_000 -> '1M').
 *   - 10M and above: up to 1 decimal place without trailing zeros (e.g. 12_345_678 -> '12.3M', 10_000_000 -> '10M').
 */
export function formatAmount(n: number): string {
  const floored = Math.floor(n);
  if (floored < 1_000_000) {
    return floored.toLocaleString('en-US');
  }

  const millions = floored / 1_000_000;
  if (millions < 10) {
    const formatted = Number(millions.toFixed(2)).toString();
    return `${formatted}M`;
  }

  const formatted = Number(millions.toFixed(1)).toString();
  return `${formatted}M`;
}
