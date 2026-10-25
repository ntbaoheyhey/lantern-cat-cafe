import { MATERIALS } from '../content';
import { xpToNextV2 } from '../idle';
import type { OwnedItem, PlayerStateV2, StacksV2 } from '../state/types';
import { itemViewV2 } from './state';
import type { GainsViewV2, LootViewV2 } from './types';

export function lootViewV2(stackDeltas: StacksV2, items: OwnedItem[], autoSalvaged: { item: OwnedItem }[]): LootViewV2 {
  const materials: LootViewV2['materials'] = {};
  for (const { id } of MATERIALS) if (id !== 'yarn' && id !== 'catKey' && (stackDeltas[id] ?? 0) > 0) materials[id] = stackDeltas[id]!;
  return { fish: stackDeltas.fish ?? 0, yarn: stackDeltas.yarn ?? 0, keys: stackDeltas.catKey ?? 0, materials,
    items: items.map(itemViewV2), autoSalvaged: autoSalvaged.map(({ item }) => ({ itemKey: item.itemKey, slot: item.slot,
      ...(item.weaponType === undefined ? {} : { weaponType: item.weaponType }), rarity: item.rarity, level: item.level })) };
}
export function gainsViewV2(before: Pick<PlayerStateV2, 'level' | 'xp'>, after: Pick<PlayerStateV2, 'level' | 'xp'>, loot: LootViewV2): GainsViewV2 {
  let xp = after.xp - before.xp;
  for (let level = before.level; level < after.level; level++) xp += xpToNextV2(level);
  return { ...loot, xp, levelsGained: after.level - before.level };
}
